import { isNationalFitnessStandardId } from '../../nationalFitness/catalog'
import { nationalBatchStandard } from '../nationalBatch'
import { assertCollectionUnchanged } from '../../persistence/collectionConflict'
import { isListedClass } from '../../class/validate'
import { listBuiltinExamStandards } from '../../examStandard/catalog'
import type { ClassRecord } from '../../class/types'
import { emptyImportTransactionReport, runStagedJsonWrites } from '../../importTransaction'
import type { PETestSession, TestItem } from '../../peTest/types'
import type { StudentRecord } from '../../student/types'
import { mergePeTestsAtomically, planExamBatchPeTestImport } from './planImport'
import type { ExamBatchPeTestImportResult, ImportExamBatchToPeTestsPayload } from './types'

export interface ExamBatchPeTestImportStores {
  loadClasses(): Promise<ClassRecord[]>
  loadStudents(): Promise<StudentRecord[]>
  loadTestItems(): Promise<TestItem[]>
  loadPeTests(): Promise<PETestSession[]>
  savePeTests(items: PETestSession[]): Promise<PETestSession[]>
  nowIso?: string
}

function asPayload(input: unknown): ImportExamBatchToPeTestsPayload {
  if (typeof input !== 'object' || input === null) {
    throw new Error('入库内容无效')
  }
  const record = input as Record<string, unknown>
  if (typeof record.classId !== 'string' || record.classId.trim() === '') {
    throw new Error('请选择班级')
  }
  if (typeof record.testDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(record.testDate)) {
    throw new Error('请确认测试日期')
  }
  if (typeof record.examStandardId !== 'string' || record.examStandardId.trim() === '') {
    throw new Error('缺少评分标准')
  }
  if (typeof record.scoringCity !== 'string' || record.scoringCity.trim() === '') {
    throw new Error('缺少评分城市')
  }
  if (typeof record.scoringVersion !== 'string' || record.scoringVersion.trim() === '') {
    throw new Error('缺少评分版本')
  }
  if (record.duplicateAction !== 'skip' && record.duplicateAction !== 'cancel') {
    throw new Error('不支持覆盖已有测试')
  }
  if (!Array.isArray(record.rows) || record.rows.length === 0) {
    throw new Error('没有可入库的成绩行')
  }
  return {
    classId: record.classId.trim(),
    testDate: record.testDate,
    examStandardId: record.examStandardId.trim(),
    scoringCity: record.scoringCity.trim(),
    scoringVersion: record.scoringVersion.trim(),
    duplicateAction: record.duplicateAction,
    rows: record.rows as ImportExamBatchToPeTestsPayload['rows']
  }
}

function summarize(sessions: PETestSession[]): Pick<ExamBatchPeTestImportResult, 'validCount' | 'absentCount' | 'nonScoreCount' | 'sessions'> {
  return {
    validCount: sessions.reduce((total, session) => total + session.records.filter((row) => row.status === 'valid').length, 0),
    absentCount: sessions.reduce((total, session) => total + session.records.filter((row) => row.status === 'absent').length, 0),
    nonScoreCount: sessions.reduce(
      (total, session) => total + session.records.filter((row) => row.status === 'absent' || row.status === 'exempt' || (row.status === 'pending' && row.note !== '')).length,
      0
    ),
    sessions: sessions.map((session) => ({
      id: session.id,
      testItemId: session.testItemId,
      testItemName: session.testItemNameSnapshot,
      studentCount: session.records.length,
      validCount: session.records.filter((row) => row.status === 'valid').length,
      absentCount: session.records.filter((row) => row.status === 'absent').length
    }))
  }
}

export async function executeImportExamBatchToPeTests(
  input: unknown,
  stores: ExamBatchPeTestImportStores
): Promise<ExamBatchPeTestImportResult> {
  const payload = asPayload(input)
  const [classes, students, testItems, existing] = await Promise.all([
    stores.loadClasses(),
    stores.loadStudents(),
    stores.loadTestItems(),
    stores.loadPeTests()
  ])
  const classRecord = classes.find((item) => item.id === payload.classId)
  if (!classRecord || !isListedClass(classRecord)) {
    throw new Error('班级不存在或不在当前名单')
  }
  const standard = isNationalFitnessStandardId(payload.examStandardId) ? nationalBatchStandard(classRecord.grade) : listBuiltinExamStandards().find((item) => item.id === payload.examStandardId)
  if (!standard) {
    throw new Error('评分标准不存在')
  }

  const planned = planExamBatchPeTestImport(payload, {
    classRecord,
    students,
    testItems,
    existingSessions: existing,
    standard,
    nowIso: stores.nowIso ?? new Date().toISOString()
  })
  if (!planned.ok) {
    throw new Error(planned.errors[0] ?? '无法保存到体育测试')
  }
  for (const session of planned.sessions) {
    if (session.classId !== payload.classId) {
      throw new Error('测试班级与所选班级不一致')
    }
    for (const record of session.records) {
      const student = students.find((item) => item.id === record.studentId)
      if (!student || student.classId !== payload.classId || student.status === 'deleted') {
        throw new Error(`学生 ${record.nameSnapshot} 不属于该班或已删除`)
      }
      if (record.status === 'valid' && (record.rawValue == null || (record.examScore == null && record.scoreOutcome !== 'below_official_minimum' && !['test-item-builtin-height', 'test-item-builtin-weight'].includes(session.testItemId)))) {
        throw new Error(`学生 ${record.nameSnapshot} 缺少原始成绩或换算分`)
      }
      if (record.status !== 'valid' && (record.rawValue != null || record.examScore != null)) {
        throw new Error(`非正常成绩不得带分数：${record.nameSnapshot}`)
      }
    }
  }

  const merged = mergePeTestsAtomically(existing, planned.sessions, payload.duplicateAction)
  if (!merged.ok) {
    throw new Error(merged.reason)
  }
  if (JSON.stringify(merged.next) === JSON.stringify(existing) && planned.sessions.length === 0) {
    throw new Error('没有可新建的测试')
  }

  const previous = existing
  const writeResult = await runStagedJsonWrites([
    {
      name: 'pe-tests.json',
      write: async () => {
        assertCollectionUnchanged(await stores.loadPeTests(), previous)
        assertCollectionUnchanged(await stores.loadStudents(), students)
        assertCollectionUnchanged(await stores.loadClasses(), classes)
        assertCollectionUnchanged(await stores.loadTestItems(), testItems)
        await stores.savePeTests(merged.next)
      },
      restore: async () => {
        await stores.savePeTests(previous)
      }
    }
  ])

  if (!writeResult.ok) {
    const message =
      writeResult.error instanceof Error ? writeResult.error.message : String(writeResult.error)
    const err = new Error(
      writeResult.rolledBack
        ? `体育测试导入失败，已回滚到导入前状态：${message}`
        : `体育测试导入失败且回滚不完整：${message}`
    )
    ;(err as Error & { transaction?: unknown }).transaction = emptyImportTransactionReport('pe-tests', {
      created: planned.sessions.length,
      updated: 0,
      unchanged: 0,
      skipped: planned.duplicateKeys.length,
      conflicts: 0,
      errors: [message],
      rolledBack: writeResult.rolledBack,
      ok: false
    })
    throw err
  }

  return {
    classId: classRecord.id,
    className: classRecord.className,
    testDate: payload.testDate,
    createdCount: planned.sessions.length,
    skippedCount: planned.duplicateKeys.length,
    ...summarize(planned.sessions),
    transaction: emptyImportTransactionReport('pe-tests', {
      created: planned.sessions.length,
      updated: 0,
      unchanged: 0,
      skipped: planned.duplicateKeys.length,
      conflicts: 0,
      errors: [],
      rolledBack: false,
      ok: true
    })
  }
}
