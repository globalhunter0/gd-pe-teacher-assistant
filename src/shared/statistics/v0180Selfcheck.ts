import { BUILTIN_TEST_ITEMS } from '../peTest/builtinItems'
import { parsePeTestSessions } from '../peTest/validate'
import type { PETestSession, TestDirection } from '../peTest/types'
import type { ClassRecord } from '../class/types'
import type { StudentRecord } from '../student/types'
import type { ExamItemDefinition, ExamStandard, ScoreRule } from '../examStandard/types'
import {
  buildStudentAttentionSignals,
  buildStudentItemHistory,
  classifyScoreBand,
  compareWithPreviousResult,
  detectPersonalBest,
  detectScoringStandardChange,
  indexPeTests,
  resolveExamItemFullScore,
  summarizeClassItemTrend,
  summarizeSingleTest,
  summarizeStudentGrowth
} from './analytics'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

const NOW = '2026-09-10T00:00:00.000Z'
const CLASS_ID = 'class-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const STUDENT_A = 'student-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const STUDENT_B = 'student-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const ITEM_1000 = 'test-item-builtin-run-1000m'
const ITEM_SKIP = 'test-item-builtin-skip-1min'

function classRecord(): ClassRecord {
  return {
    id: CLASS_ID,
    className: '初一9班',
    grade: '初一',
    academicYear: '2025-2026',
    semester: '第一学期',
    studentCount: 2,
    notes: '',
    status: 'active',
    createdAt: NOW,
    updatedAt: NOW
  }
}

function student(id: string, name: string, extra: Partial<StudentRecord> = {}): StudentRecord {
  return {
    id,
    classId: CLASS_ID,
    studentNo: id === STUDENT_A ? '1' : '2',
    name,
    gender: 'male',
    status: 'active',
    notes: '',
    createdAt: NOW,
    updatedAt: NOW,
    ...extra
  }
}

function session(partial: {
  id: string
  testItemId: string
  date: string
  direction?: TestDirection
  examStandardId?: string | null
  scoringVersionSnapshot?: string
  records: Array<{
    studentId: string
    name: string
    rawValue: number | null
    status?: PETestSession['records'][number]['status']
    examScore?: number | null
    examItemId?: string | null
  }>
}): PETestSession {
  const item = BUILTIN_TEST_ITEMS.find((entry) => entry.id === partial.testItemId)!
  return {
    id: partial.id,
    classId: CLASS_ID,
    testItemId: partial.testItemId,
    date: partial.date,
    title: `${item.name} ${partial.date}`,
    notes: '',
    classNameSnapshot: '初一9班',
    gradeSnapshot: '初一',
    testItemNameSnapshot: item.name,
    unitSnapshot: item.unit,
    customUnitLabelSnapshot: '',
    directionSnapshot: partial.direction ?? item.direction,
    valueTypeSnapshot: item.valueType,
    timeInputModeSnapshot: item.timeInputMode,
    createdAt: `${partial.date}T08:00:00.000Z`,
    updatedAt: `${partial.date}T08:00:00.000Z`,
    importSource: 'manual',
    examStandardId: partial.examStandardId ?? null,
    scoringCitySnapshot: partial.examStandardId ? '广州' : '',
    scoringVersionSnapshot: partial.scoringVersionSnapshot ?? '',
    records: partial.records.map((row, index) => ({
      id: `pe-test-record-aaaaaaaa-aaaa-4aaa-8aaa-${partial.id.slice(-8)}${String(index).padStart(4, '0')}`,
      testSessionId: partial.id,
      studentId: row.studentId,
      nameSnapshot: row.name,
      studentNoSnapshot: row.studentId === STUDENT_A ? '1' : '2',
      genderSnapshot: 'male' as const,
      rawValue: row.rawValue,
      status: row.status ?? 'valid',
      note: '',
      createdAt: `${partial.date}T08:00:00.000Z`,
      updatedAt: `${partial.date}T08:00:00.000Z`,
      examScore: row.examScore ?? null,
      rawOriginal: '',
      examItemId: row.examItemId ?? null
    }))
  }
}

function fakeStandard(maxScore: number, itemId: string, testItemId: string): ExamStandard {
  const rule: ScoreRule = {
    kind: 'thresholdTable',
    scoreMode: 'linear',
    maxScore,
    minScore: 0,
    entries: [{ score: maxScore, threshold: 1 }]
  }
  const examItem: ExamItemDefinition = {
    id: itemId,
    itemKey: itemId,
    name: '测试项目',
    gender: 'male',
    requirement: 'required',
    category: 'endurance',
    valueType: 'time',
    timeInputMode: 'minutesSeconds',
    unit: 's',
    customUnitLabel: '',
    direction: 'lowerBetter',
    decimalPlaces: 0,
    maxScore,
    testItemBuiltinKey: 'run-1000m',
    testItemId,
    verification: 'verified_supported',
    scoreRule: rule
  }
  return {
    id: `std-${maxScore}`,
    examType: 'middle_school_exam',
    regionCode: 'CN-GD',
    cityCode: '440100',
    citySlug: 'guangzhou',
    cityName: '广州',
    yearFrom: 2024,
    yearTo: 2026,
    policyLabel: '测试',
    policyPeriod: '2024-2026',
    title: `${maxScore}分制`,
    sourceAuthority: 'test',
    sourceTitle: 'test',
    sourceUrl: null,
    policySourceTitle: '',
    policySourceUrl: null,
    publishedAt: null,
    effectiveFrom: null,
    effectiveTo: null,
    status: 'verified',
    ruleStatus: 'verified',
    scoreTableStatus: 'verified',
    schemeLabel: `${maxScore}分制`,
    scoreYear: 2026,
    applicableGroups: ['regular'],
    enrollmentCohort: null,
    calculationNotes: '',
    notes: '',
    totalMaxScore: maxScore,
    scoring: { rounding: 'none' },
    items: [examItem],
    groups: [],
    components: [],
    createdAt: NOW,
    updatedAt: NOW
  }
}

export function runV0180AnalyticsSelfCheck(): string {
  const runA = session({
    id: 'pe-test-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
    testItemId: ITEM_1000,
    date: '2026-09-10',
    examStandardId: 'std-20',
    scoringVersionSnapshot: 'v1',
    records: [
      { studentId: STUDENT_A, name: '张三', rawValue: 245, examScore: 18, examItemId: 'male-1000m' },
      { studentId: STUDENT_B, name: '李四', rawValue: null, status: 'absent', examScore: null }
    ]
  })
  const runB = session({
    id: 'pe-test-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02',
    testItemId: ITEM_1000,
    date: '2026-10-15',
    examStandardId: 'std-20',
    scoringVersionSnapshot: 'v1',
    records: [{ studentId: STUDENT_A, name: '张三', rawValue: 238, examScore: 16, examItemId: 'male-1000m' }]
  })
  const runC = session({
    id: 'pe-test-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03',
    testItemId: ITEM_1000,
    date: '2026-11-20',
    examStandardId: 'std-20',
    scoringVersionSnapshot: 'v2',
    records: [{ studentId: STUDENT_A, name: '张三', rawValue: 231, examScore: 18, examItemId: 'male-1000m' }]
  })
  const skip = session({
    id: 'pe-test-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa04',
    testItemId: ITEM_SKIP,
    date: '2026-09-10',
    records: [
      { studentId: STUDENT_A, name: '张三', rawValue: 168, examScore: 90 },
      { studentId: STUDENT_B, name: '李四', rawValue: 132, status: 'exempt', examScore: null }
    ]
  })
  const skipLater = session({
    id: 'pe-test-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa05',
    testItemId: ITEM_SKIP,
    date: '2026-10-15',
    records: [{ studentId: STUDENT_A, name: '张三', rawValue: 180, examScore: 95 }]
  })

  const parsed = parsePeTestSessions([runA, runB, runC, skip, skipLater])
  assert(parsed[0].importSource === 'manual', 'Z. 无 v0.17 metadata 仍可读')

  const growth = summarizeStudentGrowth(parsed, STUDENT_A, BUILTIN_TEST_ITEMS, [student(STUDENT_A, '张三')], [classRecord()])
  assert(growth, '成长档案存在')
  assert(growth.validCount === 5, 'A. valid 计数')
  assert(growth.absentCount === 0, '张三无缺考')
  const liGrowth = summarizeStudentGrowth(parsed, STUDENT_B, BUILTIN_TEST_ITEMS, [student(STUDENT_B, '李四')], [classRecord()])
  assert(liGrowth?.absentCount === 1 && liGrowth.exemptCount === 1, 'A. absent / exempt 计数')

  const single = summarizeSingleTest(runA, parsed, BUILTIN_TEST_ITEMS.find((item) => item.id === ITEM_1000), [classRecord()], [
    fakeStandard(20, 'male-1000m', ITEM_1000)
  ])
  assert(single.averageScoreText !== '0', 'B. null 分不进平均为 0')
  assert(single.scoredCount === 1, 'B. 仅有分人数')
  assert(single.bands?.counts.excellent === 1, 'S. 20分制 18 进入优秀')
  assert(classifyScoreBand(12, 20) === 'pass', 'T. 20分制 12 及格')
  assert(classifyScoreBand(90, 100) === 'excellent', 'R. 100分制 90 优秀')
  assert(single.performance.absent === 1, '缺考计入本次表现')
  assert(single.performance.first === 1, 'H. 首次测试')

  const noFull = summarizeSingleTest(runA, parsed, BUILTIN_TEST_ITEMS.find((item) => item.id === ITEM_1000), [classRecord()], [])
  assert(noFull.bands === null && noFull.bandBlockedReason, 'U. 无法确认满分不生成区间')
  assert(noFull.averageScoreText !== '—', '无满分仍显示平均分')

  const vsSkip = compareWithPreviousResult(skipLater, STUDENT_A, parsed)
  assert(vsSkip.kind === 'improved' && vsSkip.deltaRaw === 12, 'E. higherBetter 进步')
  const vsRun = compareWithPreviousResult(runB, STUDENT_A, parsed)
  assert(vsRun.kind === 'improved' && vsRun.deltaRaw === -7, 'D. lowerBetter 进步')

  const height = session({
    id: 'pe-test-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa06',
    testItemId: 'test-item-builtin-height',
    date: '2026-09-10',
    direction: 'neutral',
    records: [{ studentId: STUDENT_A, name: '张三', rawValue: 160 }]
  })
  const height2 = session({
    id: 'pe-test-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa07',
    testItemId: 'test-item-builtin-height',
    date: '2026-10-15',
    direction: 'neutral',
    records: [{ studentId: STUDENT_A, name: '张三', rawValue: 162 }]
  })
  assert(compareWithPreviousResult(height2, STUDENT_A, [height, height2]).kind === 'incomparable', 'F. neutral 不判断进退')
  assert(detectPersonalBest(height2, STUDENT_A, [height, height2]) === false, 'G. neutral 不计算 PB')

  assert(detectPersonalBest(runC, STUDENT_A, parsed) === true, 'G/X. 当前刷新 PB（不含本次历史）')
  assert(detectPersonalBest(runA, STUDENT_A, parsed) === false, 'H. 首次不是刷新 PB')

  const vsWrongItem = compareWithPreviousResult(skipLater, STUDENT_A, parsed)
  assert(vsWrongItem.previousRaw === 168, 'I. 上次只取同项目')
  const afterAbsent = session({
    id: 'pe-test-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa08',
    testItemId: ITEM_1000,
    date: '2026-12-01',
    records: [{ studentId: STUDENT_B, name: '李四', rawValue: 250, examScore: 10, examItemId: 'male-1000m' }]
  })
  const vsAfterAbsent = compareWithPreviousResult(afterAbsent, STUDENT_B, [...parsed, afterAbsent])
  assert(vsAfterAbsent.kind === 'first', 'J. 缺考不作为上一次有效成绩')

  const hist1000 = buildStudentItemHistory(parsed, STUDENT_A, ITEM_1000, BUILTIN_TEST_ITEMS)
  const histSkip = buildStudentItemHistory(parsed, STUDENT_A, ITEM_SKIP, BUILTIN_TEST_ITEMS)
  assert(hist1000 && histSkip && hist1000.points.every((item) => item.sessionId !== skip.id), 'K. 不同项目不合并')

  const trend = summarizeClassItemTrend(parsed, CLASS_ID, ITEM_1000, BUILTIN_TEST_ITEMS)
  assert(trend.points[0].validN === 1, 'L. n 为有效 raw 样本')
  const emptyDay = session({
    id: 'pe-test-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa09',
    testItemId: ITEM_1000,
    date: '2026-12-20',
    records: [{ studentId: STUDENT_A, name: '张三', rawValue: null, status: 'absent' }]
  })
  const trendEmpty = summarizeClassItemTrend([...parsed, emptyDay], CLASS_ID, ITEM_1000, BUILTIN_TEST_ITEMS)
  assert(trendEmpty.points.some((item) => item.validN === 0 && item.averageRaw === null && item.averageRawText === '—'), 'M. n=0 无虚假平均')

  const deletedGrowth = summarizeStudentGrowth(parsed, STUDENT_A, BUILTIN_TEST_ITEMS, [], [])
  assert(deletedGrowth?.name === '张三' && deletedGrowth.isHistorical, 'N. 无 live Student 仍显示历史')
  const transferred = summarizeStudentGrowth(
    parsed,
    STUDENT_A,
    BUILTIN_TEST_ITEMS,
    [student(STUDENT_A, '张三', { status: 'transferred' })],
    [classRecord()]
  )
  assert(transferred && !transferred.isHistorical && transferred.validCount === 5, 'O. transferred 历史仍在')

  const imported = {
    ...runA,
    importSource: 'exam-batch' as const,
    id: 'pe-test-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa10'
  }
  imported.records = runA.records.map((row) => ({ ...row, id: row.id.replace('aa01', 'aa10'), testSessionId: imported.id }))
  const importedSummary = summarizeSingleTest(imported, [imported], BUILTIN_TEST_ITEMS.find((item) => item.id === ITEM_1000), [classRecord()], [
    fakeStandard(20, 'male-1000m', ITEM_1000)
  ])
  const manualSummary = summarizeSingleTest(runA, [runA], BUILTIN_TEST_ITEMS.find((item) => item.id === ITEM_1000), [classRecord()], [
    fakeStandard(20, 'male-1000m', ITEM_1000)
  ])
  assert(importedSummary.statuses.valid === manualSummary.statuses.valid && importedSummary.bands?.counts.excellent === 1, 'P. 导入与手工同一套 analytics')

  assert(detectScoringStandardChange([runA, runB, runC]) === true, 'Q. 评分标准版本不同')
  assert(detectScoringStandardChange([runA, runB]) === false, '同版本不提示')

  const decline1 = session({
    id: 'pe-test-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa11',
    testItemId: ITEM_1000,
    date: '2026-07-01',
    records: [{ studentId: STUDENT_A, name: '张三', rawValue: 220 }]
  })
  const decline2 = session({
    id: 'pe-test-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa12',
    testItemId: ITEM_1000,
    date: '2026-08-01',
    records: [{ studentId: STUDENT_A, name: '张三', rawValue: 230 }]
  })
  const decline3 = session({
    id: 'pe-test-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa13',
    testItemId: ITEM_1000,
    date: '2026-09-01',
    records: [{ studentId: STUDENT_A, name: '张三', rawValue: 240 }]
  })
  const watch = buildStudentAttentionSignals(STUDENT_A, [decline1, decline2, decline3], BUILTIN_TEST_ITEMS, { today: '2026-09-10' })
  assert(watch.some((item) => item.title === '近期连续退步'), 'V. 连续2次退步')

  const up = buildStudentAttentionSignals(STUDENT_A, [runA, runB, runC], BUILTIN_TEST_ITEMS, { today: '2026-11-20' })
  assert(up.some((item) => item.title === '近期持续进步'), 'W. 连续2次进步')
  assert(up.some((item) => item.title === '刷新个人最佳'), 'X. PB 信号')

  const absentVs = compareWithPreviousResult(runA, STUDENT_B, parsed)
  assert(absentVs.kind === 'incomparable', 'Y. 缺考不计作退步')

  assert(resolveExamItemFullScore(runA, runA.records[0], [fakeStandard(20, 'male-1000m', ITEM_1000)]) === 20, '满分取 scoreRule/item 较小值')
  assert(indexPeTests(parsed).byStudentId.get(STUDENT_A)?.length === 5, '内存 index 不写盘')

  const scoredNullNotBanded = summarizeSingleTest(
    session({
      id: 'pe-test-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa14',
      testItemId: ITEM_1000,
      date: '2026-09-10',
      examStandardId: 'std-20',
      records: [
        { studentId: STUDENT_A, name: '张三', rawValue: 245, examScore: 18, examItemId: 'male-1000m' },
        { studentId: STUDENT_B, name: '李四', rawValue: 250, examScore: null, examItemId: 'male-1000m' }
      ]
    }),
    parsed,
    BUILTIN_TEST_ITEMS.find((item) => item.id === ITEM_1000),
    [classRecord()],
    [fakeStandard(20, 'male-1000m', ITEM_1000)]
  )
  const bandTotal = scoredNullNotBanded.bands ? Object.values(scoredNullNotBanded.bands.counts).reduce((sum, item) => sum + item, 0) : 0
  assert(bandTotal === 1, 'C. score null 不进入分数分布')

  return 'v0.18.0 analytics self-check passed'
}

export function runV0180AnalyticsSelfCheckOrThrow(): string {
  return runV0180AnalyticsSelfCheck()
}
