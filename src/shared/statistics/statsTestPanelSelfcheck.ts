import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { ClassRecord } from '../class/types'
import { NATIONAL_FITNESS_2014_ID } from '../nationalFitness/catalog'
import { BUILTIN_TEST_ITEMS } from '../peTest/builtinItems'
import {
  findTeacherVisibleDuplicates,
  MIDDLE_LONG_RUN_GROUP_ID,
  parseTeacherTestSelection
} from '../peTest/groupedItems'
import { classroomScoringSnapshots } from '../peTest/scoringBasis'
import { createPeTestId, createPeTestRecordId, parsePeTestSessions } from '../peTest/validate'
import type { PETestRecord, PETestSession, TestRecordStatus } from '../peTest/types'
import type { StudentRecord } from '../student/types'
import { buildStudentItemHistory, summarizeClassItemTrend, summarizeStudentGrowth } from './analytics'
import {
  filterTests,
  selectPeTestSessionByActualItem,
  summarizeTestSession
} from './tests'
import { resolveDateRange } from './dateRange'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function readSrc(relative: string): string {
  return readFileSync(resolve(process.cwd(), relative), 'utf8')
}

const NOW = '2026-09-14T03:00:00.000Z'
const DATE = '2026-09-14'
const DATE2 = '2026-09-21'
const CLASS_ID = 'class-e215d4a4-bbe5-4aaa-8aaa-aaaaaaaa0e10'
const ITEM_800 = 'test-item-builtin-run-800m'
const ITEM_1000 = 'test-item-builtin-run-1000m'

function student(seq: string, no: string, name: string, gender: StudentRecord['gender']): StudentRecord {
  return {
    id: `student-e215d4a4-bbe5-4aaa-8aaa-aaaaaaaa0e${seq}`,
    classId: CLASS_ID,
    studentNo: no,
    name,
    gender,
    status: 'active',
    notes: '',
    createdAt: NOW,
    updatedAt: NOW
  }
}

const CLASS: ClassRecord = {
  id: CLASS_ID,
  className: '初一9班',
  grade: '初一',
  academicYear: '2025-2026',
  semester: '第一学期',
  studentCount: 8,
  notes: 'stats panel actual-item fixture',
  status: 'active',
  createdAt: NOW,
  updatedAt: NOW
}

const CAI = student('01', '1', '蔡雅棋', 'female')
const CHEN_KX = student('02', '2', '陈可欣', 'female')
const CHEN_LY = student('03', '3', '陈礼源', 'male')
const GIRL_PENDING = student('04', '4', '女未录入', 'female')
const BOY_PENDING = student('05', '5', '男未录入', 'male')
const GIRL_ABSENT = student('06', '6', '女缺测', 'female')
const BOY_EXEMPT = student('07', '7', '男免测', 'male')
const GIRL_INVALID = student('08', '8', '女无效', 'female')

function rec(
  sessionId: string,
  person: StudentRecord,
  status: TestRecordStatus,
  rawValue: number | null,
  extra: Partial<PETestRecord> = {}
): PETestRecord {
  const run800 = BUILTIN_TEST_ITEMS.find((item) => item.id === ITEM_800)!
  const run1000 = BUILTIN_TEST_ITEMS.find((item) => item.id === ITEM_1000)!
  const actual = person.gender === 'female' ? run800 : run1000
  return {
    id: createPeTestRecordId(),
    testSessionId: sessionId,
    studentId: person.id,
    nameSnapshot: person.name,
    studentNoSnapshot: person.studentNo,
    genderSnapshot: person.gender,
    rawValue,
    status,
    note: '',
    createdAt: NOW,
    updatedAt: NOW,
    examScore: extra.examScore ?? null,
    rawOriginal: '',
    examItemId: extra.examItemId ?? null,
    resolvedTestItemId: actual.id,
    baseScore: extra.baseScore ?? null,
    bonusScore: extra.bonusScore ?? null,
    scoreOutcome: extra.scoreOutcome ?? null,
    officialMinimumScore: extra.officialMinimumScore ?? null
  }
}

function groupedSession(date: string, records: PETestRecord[], id?: string): PETestSession {
  const run1000 = BUILTIN_TEST_ITEMS.find((item) => item.id === ITEM_1000)!
  const sessionId = id ?? createPeTestId()
  const snaps = classroomScoringSnapshots(NATIONAL_FITNESS_2014_ID)
  return {
    id: sessionId,
    classId: CLASS_ID,
    testItemId: run1000.id,
    date,
    title: `初一9班 · 800米 / 1000米 · ${date}`,
    notes: '',
    classNameSnapshot: CLASS.className,
    gradeSnapshot: CLASS.grade,
    testItemNameSnapshot: '800米 / 1000米',
    unitSnapshot: run1000.unit,
    customUnitLabelSnapshot: '',
    directionSnapshot: run1000.direction,
    valueTypeSnapshot: run1000.valueType,
    timeInputModeSnapshot: run1000.timeInputMode,
    createdAt: `${date}T08:00:00.000Z`,
    updatedAt: `${date}T08:00:00.000Z`,
    records: records.map((row) => ({ ...row, testSessionId: sessionId })),
    importSource: 'manual',
    examStandardId: NATIONAL_FITNESS_2014_ID,
    scoringCitySnapshot: snaps.scoringCitySnapshot,
    scoringVersionSnapshot: snaps.scoringVersionSnapshot,
    testGroupId: MIDDLE_LONG_RUN_GROUP_ID
  }
}

function pageView(session: PETestSession, actualItemId: string) {
  const view = selectPeTestSessionByActualItem(session, actualItemId, BUILTIN_TEST_ITEMS)
  const item = BUILTIN_TEST_ITEMS.find((entry) => entry.id === actualItemId)
  return {
    view,
    summary: summarizeTestSession(view, item),
    names: view.records.map((row) => row.nameSnapshot)
  }
}

export function runStatsTestPanelActualItemSelfCheck(): string {
  const panel = readSrc('src/renderer/src/components/StatsTestPanel.tsx')
  const testsPage = readSrc('src/renderer/src/pages/PeTestsPage.tsx')
  assert(panel.includes('selectPeTestSessionByActualItem'), '页面汇总/明细必须走实际项目 selector')
  assert(panel.includes('listedViews') && panel.includes('detailView'), '趋势以外的区块也必须使用切片 session')
  assert(panel.includes('summarizeTestSession(view, testItem)') || panel.includes('summarizeTestSession(session, testItem)'), '汇总调用 selector 切片')
  assert(panel.includes('TestAnalyticsPanel session={detailView}'), '明细分析不得传入整场 session')
  assert(panel.includes('[...detailView.records]'), '学生明细 rows 必须来自 actual-item 切片')
  assert(!panel.includes('items.find((entry) => entry.id === item.testItemId)'), '汇总不得用组合锚点 testItemId 当统计项目')
  assert(testsPage.includes('该班该日该组合项目已有测试，将继续录入同一场，不会新建第二次。'), '同日组合去重文案保留')

  const sid = createPeTestId()
  const session = groupedSession(DATE, [
    rec(sid, CAI, 'valid', 210, { examScore: 101, baseScore: 100, bonusScore: 1, examItemId: 'run-800m', scoreOutcome: 'official' }),
    rec(sid, CHEN_KX, 'valid', 240, { examScore: 80, baseScore: 80, bonusScore: 0, examItemId: 'run-800m', scoreOutcome: 'official' }),
    rec(sid, CHEN_LY, 'valid', 240, { examScore: 95, baseScore: 95, bonusScore: 0, examItemId: 'run-1000m', scoreOutcome: 'official' }),
    rec(sid, GIRL_PENDING, 'pending', null),
    rec(sid, BOY_PENDING, 'pending', null),
    rec(sid, GIRL_ABSENT, 'absent', null),
    rec(sid, BOY_EXEMPT, 'exempt', null),
    rec(sid, GIRL_INVALID, 'invalid', 400)
  ])

  const parsed = parsePeTestSessions([session])
  const run800 = BUILTIN_TEST_ITEMS.find((item) => item.id === ITEM_800)!
  const run1000 = BUILTIN_TEST_ITEMS.find((item) => item.id === ITEM_1000)!
  const range = resolveDateRange('all', '', '')

  const listed800 = filterTests(parsed, CLASS_ID, ITEM_800, range, BUILTIN_TEST_ITEMS)
  const listed1000 = filterTests(parsed, CLASS_ID, ITEM_1000, range, BUILTIN_TEST_ITEMS)
  assert(listed800.length === 1 && listed1000.length === 1, '组合测试在800/1000下都能找到同一场 session')
  assert(listed800[0].title.includes('800米 / 1000米'), '测试名称仍是组合课堂测试')

  const trend1000 = summarizeClassItemTrend(parsed, CLASS_ID, ITEM_1000, BUILTIN_TEST_ITEMS)
  assert(trend1000.points[0]?.validN === 1, '1. 1000米 trend n=1')
  assert(trend1000.points[0]?.averageRawText === '4:00', '3. 1000米 trend 平均原始=4:00')
  assert(trend1000.points[0]?.averageScoreText === '95', '1000米 trend 平均分=95')

  const view1000 = pageView(parsed[0], ITEM_1000)
  assert(view1000.summary.statuses.valid === 1, '2. 1000米 summary valid=1')
  assert(view1000.summary.average === '4:00', '3. 1000米 summary 平均=4:00')
  assert(view1000.summary.best === '4:00', '4. 1000米 summary 最好=4:00')
  assert(view1000.names.includes('陈礼源'), '5. 1000米明细含陈礼源')
  assert(!view1000.names.includes('蔡雅棋') && !view1000.names.includes('陈可欣'), '5. 1000米明细不含女生')
  assert(view1000.summary.statuses.pending === 1 && view1000.summary.statuses.exempt === 1, '11. 1000米未录入/免测按男生')
  assert(!view1000.names.includes('女未录入') && !view1000.names.includes('女缺测'), '11. 1000米不含女生未录入/缺测')

  const trend800 = summarizeClassItemTrend(parsed, CLASS_ID, ITEM_800, BUILTIN_TEST_ITEMS)
  assert(trend800.points[0]?.validN === 2, '6. 800米 trend n=2')
  assert(trend800.points[0]?.averageRawText === '3:45', '8. 800米 trend 平均原始=3:45')
  assert(trend800.points[0]?.averageScoreText === '90.50', '800米 trend 平均分=90.50')

  const view800 = pageView(parsed[0], ITEM_800)
  assert(view800.summary.statuses.valid === 2, '7. 800米 summary valid=2')
  assert(view800.summary.average === '3:45', '8. 800米 summary 平均=3:45')
  assert(view800.summary.best === '3:30', '9. 800米 summary 最好=3:30')
  assert(view800.names.includes('蔡雅棋') && view800.names.includes('陈可欣'), '10. 800米明细含两名女生')
  assert(!view800.names.includes('陈礼源'), '10. 800米明细不含男生')
  assert(view800.summary.statuses.pending === 1 && view800.summary.statuses.absent === 1 && view800.summary.statuses.invalid === 1, '11. 800米状态按女生')
  assert(!view800.names.includes('男未录入') && !view800.names.includes('男免测'), '11. 800米不含男生未录入/免测')

  const selection = parseTeacherTestSelection(`group:${MIDDLE_LONG_RUN_GROUP_ID}`, BUILTIN_TEST_ITEMS)
  assert(selection?.kind === 'group', '组合选择可解析')
  const sameDay = findTeacherVisibleDuplicates(parsed, CLASS_ID, DATE, selection)
  assert(sameDay.length === 1 && sameDay[0].id === parsed[0].id, '12. 同日同班同组合继续已有 session')
  const otherDay = findTeacherVisibleDuplicates(parsed, CLASS_ID, DATE2, selection)
  assert(otherDay.length === 0, '13. 不同日期必须可新建 session')

  const later = groupedSession(
    DATE2,
    [
      rec(createPeTestId(), CAI, 'valid', 220, {
        examScore: 95,
        baseScore: 95,
        bonusScore: 0,
        examItemId: 'run-800m',
        scoreOutcome: 'official'
      })
    ],
    createPeTestId()
  )
  const both = parsePeTestSessions([parsed[0], later])
  const hist = buildStudentItemHistory(both, CAI.id, ITEM_800, BUILTIN_TEST_ITEMS)
  assert(hist && hist.testCount === 2 && hist.points[0].rawValue === 210 && hist.points[1].rawValue === 220, '14. 新日期不覆盖旧成绩')
  const growth = summarizeStudentGrowth(both, CAI.id, BUILTIN_TEST_ITEMS, [CAI], [CLASS])
  assert(growth?.items[0]?.name === '800米', '15. 蔡雅棋历史项目=800米')
  assert(hist.points[0].examScore === 101 && hist.points[0].scoreText.includes('100 + 1 = 101'), '15. 蔡雅棋 101 不变')
  assert(hist.points.every((point) => point.standardLabel.includes('国家学生体质健康标准')), '16. 评分体系仍隔离显示')
  assert(run800.name === '800米' && run1000.name === '1000米', 'catalog 800/1000 仍在')

  return 'stats test panel actual-item selector self-check passed'
}

export function runStatsTestPanelActualItemSelfCheckOrThrow(): string {
  return runStatsTestPanelActualItemSelfCheck()
}
