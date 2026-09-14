import { createPeTestId, createPeTestRecordId } from '../../peTest/validate'
import type { PETestRecord, PETestSession } from '../../peTest/types'
import type { StudentGender } from '../../student/types'
import type { BatchAssessmentRow } from '../types'
import { matchExcelStudent } from './matchStudent'
import { mapExamRowToPeTestStatus } from './mapRecordStatus'
import { resolveExamItemToTestItem } from './resolveTestItem'
import type { ImportExamBatchToPeTestsPayload, PlannedPeTestImport, PlanImportContext, StudentMatchResult } from './types'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function examGenderToStudent(gender: BatchAssessmentRow['gender']): StudentGender | null {
  if (gender === 'male' || gender === 'female') {
    return gender
  }
  return null
}

function sessionKey(classId: string, date: string, testItemId: string): string {
  return `${classId}|${date}|${testItemId}`
}

export function findDuplicatePeTests(
  existing: ReadonlyArray<PETestSession>,
  classId: string,
  date: string,
  testItemId: string
): PETestSession[] {
  return existing.filter(
    (session) =>
      session.classId === classId &&
      session.date === date &&
      session.testItemId === testItemId &&
      !session.testGroupId
  )
}

export function mergePeTestsAtomically(
  existing: ReadonlyArray<PETestSession>,
  planned: ReadonlyArray<PETestSession>,
  duplicateAction: ImportExamBatchToPeTestsPayload['duplicateAction']
): { ok: true; next: PETestSession[] } | { ok: false; reason: string } {
  const duplicateKeys = planned.flatMap((session) =>
    findDuplicatePeTests(existing, session.classId, session.date, session.testItemId).map((hit) => ({
      plannedId: session.id,
      existingId: hit.id,
      key: sessionKey(session.classId, session.date, session.testItemId)
    }))
  )

  if (duplicateKeys.length > 0 && duplicateAction === 'cancel') {
    return { ok: false, reason: '同班同日同项目已有测试，已取消写入' }
  }

  if (duplicateAction !== 'skip' && duplicateAction !== 'cancel') {
    return { ok: false, reason: '不支持覆盖已有测试' }
  }

  const skipKeys = new Set(duplicateAction === 'skip' ? duplicateKeys.map((item) => item.key) : [])
  const kept = [...existing]
  const added = planned.filter((session) => !skipKeys.has(sessionKey(session.classId, session.date, session.testItemId)))
  return { ok: true, next: [...kept, ...added] }
}

export function planExamBatchPeTestImport(
  payload: ImportExamBatchToPeTestsPayload,
  context: PlanImportContext
): PlannedPeTestImport {
  const errors: string[] = []
  const matches: StudentMatchResult[] = []

  if (!context.classRecord || context.classRecord.id !== payload.classId) {
    errors.push('班级不存在或不匹配')
  }
  if (!DATE_PATTERN.test(payload.testDate)) {
    errors.push('测试日期必须由老师确认为 YYYY-MM-DD')
  }
  if (context.standard.id !== payload.examStandardId) {
    errors.push('评分标准与 payload 不一致')
  }

  const uniqueExcel = new Map<number, BatchAssessmentRow>()
  for (const row of payload.rows) {
    if (!uniqueExcel.has(row.sourceRow)) {
      uniqueExcel.set(row.sourceRow, row)
    }
  }

  const matchByRow = new Map<number, StudentMatchResult>()
  for (const row of uniqueExcel.values()) {
    const matched = matchExcelStudent({
      classId: payload.classId,
      students: context.students,
      excelRow: row.sourceRow,
      studentNo: row.studentNo,
      studentName: row.studentName,
      gender: examGenderToStudent(row.gender)
    })
    matchByRow.set(row.sourceRow, matched)
    matches.push(matched)
    if (matched.kind === 'needs_confirm' || !matched.student) {
      errors.push(`第 ${row.sourceRow} 行学生需要确认：${matched.reason}`)
    }
  }

  const grouped = new Map<string, { testItemId: string; rows: BatchAssessmentRow[] }>()
  for (const row of payload.rows) {
    const mapped = mapExamRowToPeTestStatus(row)
    if (mapped.blockImport) {
      errors.push(`第 ${row.sourceRow} 行 ${row.examItemName} 为真正异常，禁止入库`)
      continue
    }
    if (mapped.skipCell) {
      continue
    }
    if (!row.examItemId) {
      errors.push(`第 ${row.sourceRow} 行缺少 examItemId`)
      continue
    }
    const examItem = context.standard.items.find((item) => item.id === row.examItemId)
    if (!examItem) {
      errors.push(`考试项目 ${row.examItemId} 不在当前标准内`)
      continue
    }
    const testItem = resolveExamItemToTestItem(examItem, context.testItems)
    if (!testItem) {
      errors.push(`考试项目 ${examItem.name} 无法对应日常测试项目，需确认映射`)
      continue
    }
    const current = grouped.get(testItem.id) ?? { testItemId: testItem.id, rows: [] }
    current.rows.push(row)
    grouped.set(testItem.id, current)
  }

  const duplicateKeys: PlannedPeTestImport['duplicateKeys'] = []
  for (const group of grouped.values()) {
    for (const hit of findDuplicatePeTests(context.existingSessions, payload.classId, payload.testDate, group.testItemId)) {
      duplicateKeys.push({
        classId: payload.classId,
        date: payload.testDate,
        testItemId: group.testItemId,
        existingSessionId: hit.id
      })
    }
  }

  if (duplicateKeys.length > 0 && payload.duplicateAction !== 'skip') {
    errors.push('同班同日同项目已有测试，阻止直接写入')
  }

  if (payload.duplicateAction === 'skip') {
    for (const hit of duplicateKeys) {
      grouped.delete(hit.testItemId)
    }
  }

  if (grouped.size === 0 && errors.length === 0) {
    errors.push(payload.duplicateAction === 'skip' ? '已存在的项目已跳过，没有可新建的测试' : '没有可入库的项目成绩')
  }

  const now = context.nowIso ?? '2026-09-10T00:00:00.000Z'
  const sessions: PETestSession[] = []

  if (errors.length === 0) {
    for (const group of grouped.values()) {
      const testItem = context.testItems.find((item) => item.id === group.testItemId)
      if (!testItem) {
        errors.push(`测试项目 ${group.testItemId} 不存在`)
        continue
      }
      const sessionId = createPeTestId()
      const records: PETestRecord[] = []
      const seen = new Set<string>()
      for (const row of group.rows) {
        const matched = matchByRow.get(row.sourceRow)
        if (!matched?.student) {
          continue
        }
        if (seen.has(matched.student.id)) {
          errors.push(`同一测试中学生重复：${matched.student.name}`)
          continue
        }
        seen.add(matched.student.id)
        const mapped = mapExamRowToPeTestStatus(row)
        if (mapped.skipCell || mapped.blockImport) {
          continue
        }
        if (mapped.peStatus === 'valid' && mapped.rawValue == null) {
          errors.push(`${matched.student.name} 有效成绩缺少 rawValue`)
          continue
        }
        records.push({
          id: createPeTestRecordId(),
          testSessionId: sessionId,
          studentId: matched.student.id,
          nameSnapshot: matched.student.name,
          studentNoSnapshot: matched.student.studentNo,
          genderSnapshot: matched.student.gender,
          rawValue: mapped.rawValue,
          status: mapped.peStatus,
          note: mapped.note,
          createdAt: now,
          updatedAt: now,
          examScore: mapped.examScore,
          rawOriginal: row.rawValueOriginal,
          examItemId: row.examItemId,
          resolvedTestItemId: testItem.id
        })
      }
      if (records.length === 0) {
        errors.push(`${testItem.name} 没有可写入的学生成绩`)
        continue
      }
      sessions.push({
        id: sessionId,
        classId: payload.classId,
        testItemId: testItem.id,
        date: payload.testDate,
        title: `${context.classRecord.className} · ${testItem.name} · ${payload.testDate}`,
        notes: '',
        classNameSnapshot: context.classRecord.className,
        gradeSnapshot: context.classRecord.grade,
        testItemNameSnapshot: testItem.name,
        unitSnapshot: testItem.unit,
        customUnitLabelSnapshot: testItem.customUnitLabel,
        directionSnapshot: testItem.direction,
        valueTypeSnapshot: testItem.valueType,
        timeInputModeSnapshot: testItem.timeInputMode,
        createdAt: now,
        updatedAt: now,
        records,
        importSource: 'exam-batch',
        examStandardId: payload.examStandardId,
        scoringCitySnapshot: payload.scoringCity,
        scoringVersionSnapshot: payload.scoringVersion
      })
    }
  }

  const ok = errors.length === 0
  return {
    ok,
    errors,
    matches,
    duplicateKeys,
    sessions: ok ? sessions : []
  }
}
