import { calculateExamScore } from '../examStandard/score'
import { BUILTIN_TEST_ITEMS } from '../peTest/builtinItems'
import { parsePeTestSessions } from '../peTest/validate'
import { summarizeStudentTests } from '../statistics/tests'
import type { ClassRecord } from '../class/types'
import type { StudentRecord } from '../student/types'
import { listBuiltinExamStandards } from '../examStandard/catalog'
import type { BatchAssessmentRow } from './types'
import { matchExcelStudent } from './peTestImport/matchStudent'
import { mapExamRowToPeTestStatus } from './peTestImport/mapRecordStatus'
import { resolveExamItemToTestItem } from './peTestImport/resolveTestItem'
import { executeImportExamBatchToPeTests } from './peTestImport/execute'
import { mergePeTestsAtomically, planExamBatchPeTestImport } from './peTestImport/planImport'
import type { ImportExamBatchToPeTestsPayload } from './peTestImport/types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function student(partial: Partial<StudentRecord> & Pick<StudentRecord, 'id' | 'studentNo' | 'name'>): StudentRecord {
  return {
    classId: 'class-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    gender: 'male',
    status: 'active',
    notes: '',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...partial
  }
}

function row(partial: Partial<BatchAssessmentRow> & Pick<BatchAssessmentRow, 'sourceRow' | 'studentName' | 'examItemId'>): BatchAssessmentRow {
  const result: BatchAssessmentRow = {
    studentNo: '1',
    className: '初一9班',
    gender: 'male',
    examStandardId: 'cn-gd-guangzhou-middle-2024-2026',
    examItemName: '1000米跑',
    rawValueOriginal: '3:39',
    rawValueNormalized: '3:39',
    rawValueParsed: 219,
    score: 10,
    status: 'success',
    message: '',
    ...partial
  }
  if (result.status === 'success' && result.rawValueParsed !== null && result.gender) {
    const standard = listBuiltinExamStandards().find(item => item.id === result.examStandardId)!
    const scored = calculateExamScore({ standard, itemId: result.examItemId!, rawValue: result.rawValueParsed, gender: result.gender, officialOnly: true })
    assert(scored.ok, '测试夹具须有真实评分')
    result.score = scored.score
  }
  return result
}

export async function runV0170PeTestImportPlanSelfCheck(): Promise<string> {
  const classId = 'class-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  const classRecord: ClassRecord = {
    id: classId,
    className: '初一9班',
    grade: '初一',
    academicYear: '2025-2026',
    semester: '第一学期',
    studentCount: 2,
    notes: '',
    status: 'active',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z'
  }
  const zhang = student({ id: 'student-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', studentNo: '1', name: '张三' })
  const li = student({ id: 'student-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', studentNo: '2', name: '李四' })
  const sameName = student({
    id: 'student-cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    studentNo: '3',
    name: '张三',
    gender: 'male'
  })

  const byId = matchExcelStudent({
    classId,
    students: [zhang, li],
    excelRow: 2,
    studentId: zhang.id,
    studentNo: '',
    studentName: '张三',
    gender: 'male'
  })
  assert(byId.kind === 'studentId' && byId.student?.id === zhang.id, 'B. studentId 精确匹配')

  const byNo = matchExcelStudent({
    classId,
    students: [zhang, li],
    excelRow: 2,
    studentNo: '1',
    studentName: '张三',
    gender: 'male'
  })
  assert(byNo.kind === 'studentNo' && byNo.student?.id === zhang.id, '学号匹配')

  const ambiguous = matchExcelStudent({
    classId,
    students: [zhang, sameName],
    excelRow: 2,
    studentNo: '',
    studentName: '张三',
    gender: 'male'
  })
  assert(ambiguous.kind === 'needs_confirm' && ambiguous.student === null, 'C. 同名不得自动匹配')

  const otherClass = matchExcelStudent({
    classId: 'class-dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    students: [zhang],
    excelRow: 2,
    studentNo: '1',
    studentName: '张三',
    gender: 'male'
  })
  assert(otherClass.kind === 'needs_confirm', '禁止跨班凭学号/姓名匹配')

  const absent = mapExamRowToPeTestStatus(row({ sourceRow: 3, studentName: '李四', examItemId: 'male-1000m', rawValueOriginal: '缺考', rawValueParsed: null, score: null, status: 'non_score_record' }))
  assert(absent.peStatus === 'absent' && absent.examScore == null && absent.rawValue == null && !absent.blockImport, 'D. 缺考 score null')
  const exempt = mapExamRowToPeTestStatus(row({ sourceRow: 4, studentName: '李四', examItemId: 'male-1000m', rawValueOriginal: '免考', rawValueParsed: null, score: null, status: 'non_score_record' }))
  assert(exempt.peStatus === 'exempt' && exempt.examScore == null, 'E. 免考 score null')
  const bad = mapExamRowToPeTestStatus(row({ sourceRow: 5, studentName: '李四', examItemId: 'male-1000m', rawValueOriginal: 'abc', status: 'invalid_raw_value', score: null, rawValueParsed: null }))
  assert(bad.blockImport === true, 'F. 异常行阻止入库')

  const guangzhou = listBuiltinExamStandards().find((item) => item.id === 'cn-gd-guangzhou-middle-2024-2026')
  assert(guangzhou, '广州标准')
  const exam1000 = guangzhou.items.find((item) => item.id === 'male-1000m')
  const examRope = guangzhou.items.find((item) => item.id === 'rope-skip-1min')
  assert(exam1000 && examRope, '考试项目')
  const pe1000 = resolveExamItemToTestItem(exam1000, BUILTIN_TEST_ITEMS)
  const peRope = resolveExamItemToTestItem(examRope, BUILTIN_TEST_ITEMS)
  assert(pe1000?.builtinKey === 'run-1000m', '1000米映射到日常 1000米')
  assert(peRope?.builtinKey === 'skip-1min', '跳绳别名映射到 skip-1min')

  const payload: ImportExamBatchToPeTestsPayload = {
    classId,
    testDate: '2026-09-10',
    examStandardId: guangzhou.id,
    scoringCity: '广州',
    scoringVersion: guangzhou.policyLabel,
    duplicateAction: 'cancel',
    rows: [
      row({ sourceRow: 2, studentName: '张三', studentNo: '1', examItemId: 'male-1000m', examItemName: '1000米跑', rawValueOriginal: '3:39', rawValueParsed: 219, score: 20, sourceColumn: 5 }),
      row({ sourceRow: 2, studentName: '张三', studentNo: '1', examItemId: 'rope-skip-1min', examItemName: '一分钟跳绳', rawValueOriginal: '154', rawValueParsed: 154, score: 8, sourceColumn: 7 }),
      row({ sourceRow: 3, studentName: '李四', studentNo: '2', examItemId: 'male-1000m', examItemName: '1000米跑', rawValueOriginal: '缺考', rawValueParsed: null, score: null, status: 'non_score_record', sourceColumn: 5 }),
      row({ sourceRow: 3, studentName: '李四', studentNo: '2', examItemId: 'rope-skip-1min', examItemName: '一分钟跳绳', rawValueOriginal: '132', rawValueParsed: 132, score: 7, sourceColumn: 7 })
    ]
  }
  const planned = planExamBatchPeTestImport(payload, {
    classRecord,
    students: [zhang, li],
    testItems: BUILTIN_TEST_ITEMS,
    existingSessions: [],
    standard: guangzhou,
    nowIso: '2026-09-10T00:00:00.000Z'
  })
  assert(planned.ok && planned.sessions.length === 2, 'A. 24人场景的 2 项目 → 2 个 PE Test')
  assert(planned.sessions.every((session) => session.importSource === 'exam-batch' && session.examStandardId === guangzhou.id), 'I. 评分来源 snapshot')
  const runSession = planned.sessions.find((session) => session.testItemId === pe1000?.id)
  const ropeSession = planned.sessions.find((session) => session.testItemId === peRope?.id)
  assert(runSession && ropeSession && runSession.id !== ropeSession.id, '分项目生成独立 session')
  const liRun = runSession.records.find((record) => record.studentId === li.id)
  assert(liRun?.status === 'absent' && liRun.examScore == null && liRun.rawValue == null && liRun.rawOriginal === '缺考', '缺考写入 PE 为 absent')

  const blockedError = planExamBatchPeTestImport(
    { ...payload, rows: [...payload.rows, row({ sourceRow: 4, studentName: '张三', studentNo: '1', examItemId: 'male-1000m', status: 'invalid_raw_value', rawValueOriginal: 'xx', score: null, rawValueParsed: null })] },
    { classRecord, students: [zhang, li], testItems: BUILTIN_TEST_ITEMS, existingSessions: [], standard: guangzhou, nowIso: '2026-09-10T00:00:00.000Z' }
  )
  assert(!blockedError.ok && blockedError.sessions.length === 0, 'F. 异常行整批不写')

  const duplicatePlan = planExamBatchPeTestImport(payload, {
    classRecord,
    students: [zhang, li],
    testItems: BUILTIN_TEST_ITEMS,
    existingSessions: planned.sessions,
    standard: guangzhou,
    nowIso: '2026-09-10T00:00:00.000Z'
  })
  assert(!duplicatePlan.ok && duplicatePlan.duplicateKeys.length >= 1, 'G. 同班同日同项目拦截')

  const mergedSkip = mergePeTestsAtomically(planned.sessions, planned.sessions, 'skip')
  assert(mergedSkip.ok && mergedSkip.next.length === 2, 'H. skip 不重复追加')
  const mergedCancel = mergePeTestsAtomically(planned.sessions, planned.sessions, 'cancel')
  assert(!mergedCancel.ok, 'G/H. cancel 拒绝写入')

  const oldJson = [
    {
      id: 'pe-test-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      classId,
      testItemId: 'test-item-builtin-50m',
      date: '2026-01-01',
      title: '老测试',
      notes: '',
      classNameSnapshot: '初一9班',
      gradeSnapshot: '初一',
      testItemNameSnapshot: '50米',
      unitSnapshot: 's',
      customUnitLabelSnapshot: '',
      directionSnapshot: 'lowerBetter',
      valueTypeSnapshot: 'time',
      timeInputModeSnapshot: 'seconds',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      records: [
        {
          id: 'pe-test-record-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          testSessionId: 'pe-test-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          studentId: zhang.id,
          nameSnapshot: '张三',
          studentNoSnapshot: '1',
          genderSnapshot: 'male',
          rawValue: 8.2,
          status: 'valid',
          note: '',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z'
        }
      ]
    }
  ]
  const oldParsed = parsePeTestSessions(oldJson)
  assert(oldParsed[0].importSource === 'manual' && oldParsed[0].records[0].examScore == null, 'J. 老 PE Test 继续可读')
  const stats = summarizeStudentTests([...oldParsed, ...planned.sessions], zhang.id, BUILTIN_TEST_ITEMS, { start: null, end: null })
  assert(stats.some((item) => item.testItemId === pe1000?.id && item.testCount >= 1), 'K. 数据统计能读到新测试')

  const skipPlan = planExamBatchPeTestImport(
    { ...payload, duplicateAction: 'skip' },
    {
      classRecord,
      students: [zhang, li],
      testItems: BUILTIN_TEST_ITEMS,
      existingSessions: planned.sessions.filter((session) => session.testItemId === pe1000?.id),
      standard: guangzhou,
      nowIso: '2026-09-10T00:00:00.000Z'
    }
  )
  assert(skipPlan.ok && skipPlan.sessions.length === 1 && skipPlan.sessions[0].testItemId === peRope?.id, 'I. skip 只创建不存在项目')

  const classStudents = Array.from({ length: 24 }, (_item, index) => {
    const n = index + 1
    return student({
      id: `student-aaaaaaaa-aaaa-4aaa-8aaa-${n.toString(16).padStart(12, '0')}`,
      studentNo: String(n),
      name: `学生${n}`
    })
  })
  const wideRows: BatchAssessmentRow[] = classStudents.flatMap((person, index) => {
    const sourceRow = index + 2
    const absent = person.studentNo === '24'
    return [
      row({
        sourceRow,
        studentName: person.name,
        studentNo: person.studentNo,
        examItemId: 'male-1000m',
        examItemName: '1000米跑',
        rawValueOriginal: absent ? '缺考' : '3:39',
        rawValueParsed: absent ? null : 219,
        score: absent ? null : 20,
        status: absent ? 'non_score_record' : 'success',
        sourceColumn: 5
      }),
      row({
        sourceRow,
        studentName: person.name,
        studentNo: person.studentNo,
        examItemId: 'rope-skip-1min',
        examItemName: '一分钟跳绳',
        rawValueOriginal: '154',
        rawValueParsed: 154,
        score: 8,
        status: 'success',
        sourceColumn: 7
      })
    ]
  })
  assert(wideRows.filter((item) => item.status === 'success').length === 47, 'Q. 缺考不计入真正异常（成功+缺考）')
  assert(wideRows.filter((item) => item.status === 'non_score_record').length === 1, '缺考 1 格')
  assert(wideRows.filter((item) => item.sourceColumn === 5).every((item, index, list) => list[0] && item.examItemId === 'male-1000m'), 'P. 两列 mapping 不共享')
  assert(wideRows.filter((item) => item.sourceColumn === 7).every((item) => item.examItemId === 'rope-skip-1min'), 'P. 跳绳列独立 itemId')

  let stored = [...oldParsed]
  let writes = 0
  const stores = {
    loadClasses: async () => [classRecord],
    loadStudents: async () => classStudents,
    loadTestItems: async () => [...BUILTIN_TEST_ITEMS],
    loadPeTests: async () => stored,
    savePeTests: async (items: typeof stored) => {
      writes += 1
      stored = parsePeTestSessions(items)
      return stored
    },
    nowIso: '2026-09-10T00:00:00.000Z'
  }

  const imported = await executeImportExamBatchToPeTests(
    {
      classId,
      testDate: '2026-09-10',
      examStandardId: guangzhou.id,
      scoringCity: '广州',
      scoringVersion: guangzhou.policyLabel,
      duplicateAction: 'cancel',
      rows: wideRows
    },
    stores
  )
  assert(writes === 1, '正式入库写盘一次')
  assert(imported.createdCount === 2, 'A. 24学生×2项目 → 2 个 PE Test')
  assert(imported.sessions[0].testItemId !== imported.sessions[1].testItemId, 'B. 两个项目不同 testItemId')
  const run = stored.find((session) => session.testItemId === pe1000?.id)
  const rope = stored.find((session) => session.testItemId === peRope?.id)
  assert(run && rope, '写入后可读取两个测试')
  const first = classStudents[0]
  const runRec = run.records.find((record) => record.studentId === first.id)
  const ropeRec = rope.records.find((record) => record.studentId === first.id)
  assert(runRec && ropeRec && runRec.rawValue !== ropeRec.rawValue, 'C. 同一学生两项目成绩不同')
  assert(runRec.studentId === first.id, 'D. studentId 精确匹配')
  assert(runRec.rawOriginal === '3:39' && runRec.rawValue === 219 && runRec.examScore === wideRows[0].score, 'G. rawResult + score 同时存在')
  const last = classStudents[23]
  const absentRec = run.records.find((record) => record.studentId === last.id)
  assert(absentRec?.status === 'absent' && absentRec.examScore == null && absentRec.rawValue == null, 'F. 缺考 absent / score null')
  assert(imported.validCount === 47 && imported.absentCount === 1, 'Q. 缺考不计入真正异常')
  assert(run.examStandardId === guangzhou.id && run.scoringCitySnapshot === '广州' && run.scoringVersionSnapshot === guangzhou.policyLabel, 'K. 评分来源 metadata')
  assert(stored.some((session) => session.id === oldParsed[0].id && session.importSource === 'manual'), 'L. 老测试仍在')

  const afterFirst = stored
  writes = 0
  let skipAllFailed = false
  try {
    await executeImportExamBatchToPeTests(
      {
        classId,
        testDate: '2026-09-10',
        examStandardId: guangzhou.id,
        scoringCity: '广州',
        scoringVersion: guangzhou.policyLabel,
        duplicateAction: 'skip',
        rows: wideRows
      },
      { ...stores, loadPeTests: async () => afterFirst }
    )
  } catch {
    skipAllFailed = true
  }
  assert(skipAllFailed && writes === 0, 'I. 两项都已存在时 skip 不写盘')

  const onlyRunExisting = stored.filter((session) => session.testItemId === pe1000?.id || session.date !== '2026-09-10')
  stored = onlyRunExisting
  writes = 0
  const skippedRope = await executeImportExamBatchToPeTests(
    {
      classId,
      testDate: '2026-09-10',
      examStandardId: guangzhou.id,
      scoringCity: '广州',
      scoringVersion: guangzhou.policyLabel,
      duplicateAction: 'skip',
      rows: wideRows
    },
    stores
  )
  assert(writes === 1 && skippedRope.createdCount === 1 && skippedRope.sessions[0].testItemId === peRope?.id, 'I. skip 仅创建跳绳')

  const beforeFail = stored
  writes = 0
  let failed = false
  try {
    await executeImportExamBatchToPeTests(
      {
        classId,
        testDate: '2026-09-11',
        examStandardId: guangzhou.id,
        scoringCity: '广州',
        scoringVersion: guangzhou.policyLabel,
        duplicateAction: 'cancel',
        rows: [
          ...wideRows,
          row({
            sourceRow: 99,
            studentName: '学生1',
            studentNo: '1',
            examItemId: 'male-1000m',
            status: 'invalid_raw_value',
            rawValueOriginal: 'xx',
            score: null,
            rawValueParsed: null
          })
        ]
      },
      stores
    )
  } catch {
    failed = true
  }
  assert(failed && writes === 0 && stored === beforeFail, 'J. 任一项目校验失败则整体不写')

  const sameNameBlocked = planExamBatchPeTestImport(
    {
      ...payload,
      rows: payload.rows.map((item) => (item.studentName === '张三' ? { ...item, studentNo: '' } : item))
    },
    {
      classRecord,
      students: [zhang, sameName, li],
      testItems: BUILTIN_TEST_ITEMS,
      existingSessions: [],
      standard: guangzhou,
      nowIso: '2026-09-10T00:00:00.000Z'
    }
  )
  assert(!sameNameBlocked.ok, 'E. 同名冲突阻止写入')

  const statsAfter = summarizeStudentTests(stored, first.id, BUILTIN_TEST_ITEMS, { start: null, end: null })
  assert(
    statsAfter.some((item) => item.testItemId === pe1000?.id) && statsAfter.some((item) => item.testItemId === peRope?.id),
    'M. 统计模块可读取新测试'
  )

  return 'v0.17.0 pe-test import plan self-check passed'
}

export async function runV0170PeTestImportPlanSelfCheckOrThrow(): Promise<string> {
  return runV0170PeTestImportPlanSelfCheck()
}
