import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { BUILTIN_TEST_ITEMS } from './builtinItems'
import { compareToPrevious } from './compare'
import { getResultDirection, isValidPeTestHistoryResult, peTestHistoryStatusLabel } from './studentHistory'
import { createPeTestId, createPeTestRecordId, parsePeTestSessions } from './validate'
import {
  buildStudentItemHistory,
  compareWithPreviousResult,
  summarizeStudentGrowth
} from '../statistics/analytics'
import type { PETestRecord, PETestSession, TestItem } from './types'
import type { ClassRecord } from '../class/types'
import type { StudentRecord } from '../student'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function readSrc(relative: string): string {
  return readFileSync(resolve(process.cwd(), relative), 'utf8')
}

const NOW = '2026-09-21T06:00:00.000Z'
const CLASS_A = 'class-cccccccc-bbbb-4ccc-8ddd-eeeeeeeeeeee'
const CLASS_B = 'class-cccccccc-bbbb-4ccc-8ddd-ffffffffffff'
const STUDENT = 'student-cccccccc-bbbb-4ccc-8ddd-aaaaaaaaaaaa'

function item(key: string): TestItem {
  const found = BUILTIN_TEST_ITEMS.find((entry) => entry.builtinKey === key)
  if (!found) {
    throw new Error(`missing ${key}`)
  }
  return found
}

function student(classId: string, extra?: Partial<StudentRecord>): StudentRecord {
  return {
    id: STUDENT,
    classId,
    studentNo: '09',
    name: '测试生',
    gender: 'male',
    status: 'active',
    notes: '',
    createdAt: NOW,
    updatedAt: NOW,
    ...extra
  }
}

function classRec(id: string, name: string, extra?: Partial<ClassRecord>): ClassRecord {
  return {
    id,
    grade: '初一',
    className: name,
    academicYear: '2025-2026',
    semester: '第一学期',
    studentCount: 40,
    status: 'active',
    notes: '',
    createdAt: NOW,
    updatedAt: NOW,
    ...extra
  }
}

function rec(
  sessionId: string,
  status: PETestRecord['status'],
  rawValue: number | null,
  extra?: Partial<PETestRecord>
): PETestRecord {
  return {
    id: createPeTestRecordId(),
    testSessionId: sessionId,
    studentId: STUDENT,
    nameSnapshot: '测试生',
    studentNoSnapshot: '09',
    genderSnapshot: 'male',
    rawValue,
    status,
    note: '',
    createdAt: NOW,
    updatedAt: NOW,
    examScore: null,
    rawOriginal: '',
    examItemId: null,
    ...extra
  }
}

function sessionFor(
  testItem: TestItem,
  date: string,
  record: PETestRecord,
  extra?: Partial<PETestSession>
): PETestSession {
  const id = record.testSessionId || createPeTestId()
  return {
    id,
    classId: CLASS_A,
    testItemId: testItem.id,
    date,
    title: `${testItem.name}-${date}`,
    notes: '',
    classNameSnapshot: '9班',
    gradeSnapshot: '初一',
    testItemNameSnapshot: testItem.name,
    unitSnapshot: testItem.unit,
    customUnitLabelSnapshot: testItem.customUnitLabel,
    directionSnapshot: testItem.direction,
    valueTypeSnapshot: testItem.valueType,
    timeInputModeSnapshot: testItem.timeInputMode,
    createdAt: `${date}T01:00:00.000Z`,
    updatedAt: `${date}T01:00:00.000Z`,
    records: [{ ...record, testSessionId: id }],
    importSource: 'manual',
    examStandardId: null,
    scoringCitySnapshot: '',
    scoringVersionSnapshot: '',
    testGroupId: null,
    status: 'completed',
    completedAt: `${date}T02:00:00.000Z`,
    ...extra
  }
}

export function runV0260P03StudentHistorySelfCheckOrThrow(): string {
  const page = readSrc('src/renderer/src/pages/ClassStudentsPage.tsx')
  const panel = readSrc('src/renderer/src/components/StudentPeTestHistoryPanel.tsx')
  assert(page.includes('测试成绩') && page.includes('StudentPeTestHistoryPanel'), '班级学生详情入口')
  assert(panel.includes('体育测试历史') && panel.includes('summarizeStudentGrowth'), '历史面板复用派生')
  assert(!panel.includes('student-history.json') && !panel.includes('trend.json'), '无平行持久化')

  assert(getResultDirection({ direction: 'lowerBetter' }) === 'lowerBetter', '3. 计时方向 helper')
  assert(getResultDirection({ directionSnapshot: 'higherBetter' }) === 'higherBetter', '4/5. 距离/次数方向')
  assert(peTestHistoryStatusLabel('pending') === '未测' && peTestHistoryStatusLabel('absent') === '缺考', '状态中文')
  assert(!isValidPeTestHistoryResult('absent', null) && !isValidPeTestHistoryResult('pending', null), '11/12. 缺考未测无效')

  const sprint = item('50m')
  const jump = item('standing-long-jump')
  const skip = item('skip-1min')
  const run = item('run-1000m')

  const s1 = sessionFor(sprint, '2026-09-01', rec(createPeTestId(), 'valid', 8.4))
  const s2 = sessionFor(sprint, '2026-09-08', rec(createPeTestId(), 'absent', null))
  const s3 = sessionFor(sprint, '2026-09-15', rec(createPeTestId(), 'valid', 8.1))
  const s4 = sessionFor(sprint, '2026-09-21', rec(createPeTestId(), 'valid', 8.3))
  const j1 = sessionFor(jump, '2026-09-02', rec(createPeTestId(), 'valid', 210))
  const j2 = sessionFor(jump, '2026-09-16', rec(createPeTestId(), 'valid', 218))
  const k1 = sessionFor(skip, '2026-09-03', rec(createPeTestId(), 'valid', 160))
  const k2 = sessionFor(skip, '2026-09-17', rec(createPeTestId(), 'valid', 168))
  const r1 = sessionFor(run, '2026-09-04', rec(createPeTestId(), 'valid', 228))
  const r2 = sessionFor(run, '2026-09-18', rec(createPeTestId(), 'valid', 222))

  const all = [s1, s2, s3, s4, j1, j2, k1, k2, r1, r2]
  const growth = summarizeStudentGrowth(all, STUDENT, BUILTIN_TEST_ITEMS, [student(CLASS_A)], [classRec(CLASS_A, '9班')])
  assert(growth && growth.items.length === 4, '2. 多个不同项目')

  const hist50 = buildStudentItemHistory(all, STUDENT, sprint.id, BUILTIN_TEST_ITEMS)
  assert(hist50 && hist50.testCount === 4 && hist50.validCount === 3, '1. 同项目多次含缺考')
  assert(hist50.recentRawText.includes('8.3'), '7. 最近成绩正确')
  assert(hist50.bestRawText.includes('8.1'), '6. PB 计时越小越好')
  assert(hist50.previousRawText.includes('8.1'), '8. 上一次有效成绩（跳过缺考后）')
  assert(hist50.changeKind === 'declined', '9. 8.1→8.3 计时为下降')
  assert(hist50.points.some((p) => p.statusLabel === '缺考' && p.rawText === '缺考'), '缺考显示')
  assert(hist50.points.every((p) => p.status !== 'absent' || !p.isPersonalBest), '11. 缺考不参与 PB')

  const gapVs = compareWithPreviousResult(s3, STUDENT, [s1, s2, s3])
  assert(gapVs.kind === 'improved' && gapVs.previousRaw === 8.4, '13. 缺考不打断最近两次有效')

  const histJump = buildStudentItemHistory(all, STUDENT, jump.id, BUILTIN_TEST_ITEMS)
  assert(histJump && histJump.bestRawText.includes('218') && histJump.changeKind === 'improved', '4. 跳远越大越好 + 进步')

  const histSkip = buildStudentItemHistory(all, STUDENT, skip.id, BUILTIN_TEST_ITEMS)
  assert(histSkip && histSkip.changeKind === 'improved' && histSkip.bestRawText.includes('168'), '5. 跳绳越大越好')

  const histRun = buildStudentItemHistory(all, STUDENT, run.id, BUILTIN_TEST_ITEMS)
  assert(histRun && histRun.recentRawText.includes(':'), '14. 1000m 时间格式')
  assert(histRun.bestRawText.includes('3:42') || histRun.bestRawText.includes('3:42'), '14. PB 为 3:42')
  assert(histRun.changeText.includes('秒') || histRun.changeKind === 'improved', '14. 变化用秒解释')

  const same = compareToPrevious(8.1, 8.1, 'lowerBetter', 'time', 2, false, '秒')
  assert(same && same.kind === 'same', '10. 持平正确')

  const onlyOne = buildStudentItemHistory(
    [sessionFor(sprint, '2026-08-01', rec(createPeTestId(), 'valid', 8.5))],
    STUDENT,
    sprint.id,
    BUILTIN_TEST_ITEMS
  )
  assert(onlyOne && onlyOne.bestRawText === onlyOne.recentRawText && onlyOne.changeKind === 'first', '18. 仅一次有效稳定')

  const empty = summarizeStudentGrowth([], STUDENT, BUILTIN_TEST_ITEMS, [student(CLASS_A)], [classRec(CLASS_A, '9班')])
  assert(empty === null, '19. 无成绩空态')

  const transferredSessions = all.map((row, index) =>
    index < 4 ? row : { ...row, classId: CLASS_B, classNameSnapshot: '2班' }
  )
  const afterTransfer = summarizeStudentGrowth(
    transferredSessions,
    STUDENT,
    BUILTIN_TEST_ITEMS,
    [student(CLASS_B)],
    [classRec(CLASS_A, '9班'), classRec(CLASS_B, '2班')]
  )
  assert(afterTransfer && afterTransfer.items.some((item) => item.testItemId === sprint.id && item.validCount === 3), '15. 转班后历史保留')

  const archivedClass = classRec(CLASS_A, '9班', { status: 'deleted' })
  const archivedGrowth = summarizeStudentGrowth(all, STUDENT, BUILTIN_TEST_ITEMS, [student(CLASS_B)], [archivedClass, classRec(CLASS_B, '2班')])
  assert(archivedGrowth && archivedGrowth.validCount >= 8, '16. archived 班级测试仍可统计')

  const aliasA = sessionFor(sprint, '2026-07-01', rec(createPeTestId(), 'valid', 8.6), {
    testItemNameSnapshot: '50m'
  })
  const aliasB = sessionFor(sprint, '2026-07-08', rec(createPeTestId(), 'valid', 8.2), {
    testItemNameSnapshot: '50 米'
  })
  const aliasHist = buildStudentItemHistory([aliasA, aliasB], STUDENT, sprint.id, BUILTIN_TEST_ITEMS)
  assert(aliasHist && aliasHist.testCount === 2 && aliasHist.validCount === 2, '17. canonical id 不重复分组')

  const pendingOnly = buildStudentItemHistory(
    [sessionFor(sprint, '2026-06-01', rec(createPeTestId(), 'pending', null), { status: 'in_progress', completedAt: null })],
    STUDENT,
    sprint.id,
    BUILTIN_TEST_ITEMS
  )
  assert(pendingOnly && pendingOnly.validCount === 0 && pendingOnly.bestRawText === '—', '12. 未测不参与 PB')
  assert(pendingOnly.points[0].statusLabel === '未测', '进行中未测可显示')

  const legacySessionId = createPeTestId()
  const legacyJson = [
    {
      id: legacySessionId,
      classId: CLASS_A,
      testItemId: sprint.id,
      date: '2026-05-01',
      title: '旧',
      notes: '',
      classNameSnapshot: '9班',
      gradeSnapshot: '初一',
      testItemNameSnapshot: sprint.name,
      unitSnapshot: sprint.unit,
      customUnitLabelSnapshot: '',
      directionSnapshot: sprint.direction,
      valueTypeSnapshot: sprint.valueType,
      timeInputModeSnapshot: sprint.timeInputMode,
      createdAt: NOW,
      updatedAt: NOW,
      records: [
        {
          id: createPeTestRecordId(),
          testSessionId: legacySessionId,
          studentId: STUDENT,
          nameSnapshot: '测试生',
          studentNoSnapshot: '09',
          genderSnapshot: 'male',
          rawValue: 8.9,
          status: 'valid',
          note: '',
          createdAt: NOW,
          updatedAt: NOW
        }
      ],
      importSource: 'manual',
      examStandardId: null,
      scoringCitySnapshot: '',
      scoringVersionSnapshot: ''
    }
  ]
  const legacy = parsePeTestSessions(legacyJson)
  const legacyHist = buildStudentItemHistory(legacy, STUDENT, sprint.id, BUILTIN_TEST_ITEMS)
  assert(legacyHist && legacyHist.validCount === 1, '20. 旧数据兼容')

  return 'v0.26.0 P0-3 student history self-check passed'
}
