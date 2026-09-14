import { MIDDLE_LONG_RUN_GROUP_ID } from '../peTest/groupedItems'
import { BUILTIN_TEST_ITEMS } from '../peTest/builtinItems'
import { createPeTestId, createPeTestRecordId } from '../peTest/validate'
import type { PETestRecord, PETestSession, TestRecordStatus } from '../peTest/types'
import type { StudentGender } from '../student/types'
import {
  buildStudentItemHistory,
  compareWithPreviousResult,
  detectPersonalBest,
  summarizeSingleTest
} from './analytics'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

const CLASS_ID = 'class-c215d4a4-bbe5-4aaa-8aaa-aaaaaaaa0c10'
const BOY_ID = 'student-c215d4a4-bbe5-4aaa-8aaa-aaaaaaaa0c01'
const GIRL_ID = 'student-c215d4a4-bbe5-4aaa-8aaa-aaaaaaaa0c02'
const OTHER_ID = 'student-c215d4a4-bbe5-4aaa-8aaa-aaaaaaaa0c03'
const ITEM_1000 = 'test-item-builtin-run-1000m'
const ITEM_800 = 'test-item-builtin-run-800m'
const EMPTY_CLASSES: never[] = []

function runItem(key: 'run-1000m' | 'run-800m') {
  const found = BUILTIN_TEST_ITEMS.find((entry) => entry.builtinKey === key)
  assert(found, `缺少 ${key}`)
  return found
}

function rec(
  sessionId: string,
  studentId: string,
  name: string,
  gender: StudentGender,
  status: TestRecordStatus,
  rawValue: number | null,
  resolvedTestItemId: string
): PETestRecord {
  const now = '2026-09-14T08:00:00.000Z'
  return {
    id: createPeTestRecordId(),
    testSessionId: sessionId,
    studentId,
    nameSnapshot: name,
    studentNoSnapshot: studentId.slice(-2),
    genderSnapshot: gender,
    rawValue,
    status,
    note: '',
    createdAt: now,
    updatedAt: now,
    examScore: status === 'valid' && rawValue !== null ? 90 : null,
    rawOriginal: '',
    examItemId: null,
    resolvedTestItemId,
    baseScore: null,
    bonusScore: null,
    scoreOutcome: null,
    officialMinimumScore: null
  }
}

function sessionOf(
  date: string,
  records: PETestRecord[],
  options: { testItemId: string; testGroupId?: string | null; createdAt?: string } = { testItemId: ITEM_1000 }
): PETestSession {
  const item = BUILTIN_TEST_ITEMS.find((entry) => entry.id === options.testItemId) ?? runItem('run-1000m')
  const id = records[0]?.testSessionId ?? createPeTestId()
  const createdAt = options.createdAt ?? `${date}T08:00:00.000Z`
  return {
    id,
    classId: CLASS_ID,
    testItemId: item.id,
    date,
    title: `${item.name} ${date}`,
    notes: '',
    classNameSnapshot: '初一9班',
    gradeSnapshot: '初一',
    testItemNameSnapshot: options.testGroupId ? '800米 / 1000米' : item.name,
    unitSnapshot: item.unit,
    customUnitLabelSnapshot: '',
    directionSnapshot: item.direction,
    valueTypeSnapshot: item.valueType,
    timeInputModeSnapshot: item.timeInputMode,
    createdAt,
    updatedAt: createdAt,
    records: records.map((row) => ({ ...row, testSessionId: id })),
    importSource: 'manual',
    examStandardId: null,
    scoringCitySnapshot: '',
    scoringVersionSnapshot: '',
    testGroupId: options.testGroupId ?? null
  }
}

function make(date: string, studentId: string, name: string, gender: StudentGender, status: TestRecordStatus, raw: number | null, itemId: string, extra?: { other?: PETestRecord; testGroupId?: string | null }) {
  const sid = createPeTestId()
  const rows = [rec(sid, studentId, name, gender, status, raw, itemId)]
  if (extra?.other) {
    rows.push({ ...extra.other, testSessionId: sid })
  }
  return sessionOf(date, rows, { testItemId: itemId, testGroupId: extra?.testGroupId })
}

export function runHistoryCompareSelfCheck(): string {
  const first = make('2026-09-01', BOY_ID, '陈礼源', 'male', 'valid', 240, ITEM_1000)
  const firstSummary = summarizeSingleTest(first, [first], runItem('run-1000m'), EMPTY_CLASSES)
  const firstVs = compareWithPreviousResult(first, BOY_ID, [first])
  assert(firstVs.kind === 'first' && firstVs.previousRaw === null, '1. 首次有效：较上次为首次')
  assert(firstSummary.performance.first === 1, '1. 首次计入首次有效测试')
  assert(firstSummary.performance.improved === 0 && firstSummary.performance.declined === 0 && firstSummary.performance.same === 0, '1. 首次不得同时计入进退持平')
  assert(detectPersonalBest(first, BOY_ID, [first]) === false, '1. 首次不计入刷新个人最佳')

  const improved = make('2026-09-14', BOY_ID, '陈礼源', 'male', 'valid', 222, ITEM_1000)
  const improvedAll = [first, improved]
  const improvedVs = compareWithPreviousResult(improved, BOY_ID, improvedAll)
  const improvedSummary = summarizeSingleTest(improved, improvedAll, runItem('run-1000m'), EMPTY_CLASSES)
  assert(improvedVs.kind === 'improved' && improvedVs.previousRaw === 240 && improvedVs.currentRaw === 222, '2. 较上次进步：与紧邻有效 4:00 比，时间减少')
  assert(improvedVs.deltaRaw === -18, '2. 1000米 3:42 相对 4:00 为 -18 秒')
  assert(improvedSummary.performance.improved === 1 && improvedSummary.performance.first === 0, '2. 进步计入较上次进步，不再计首次')
  assert(detectPersonalBest(improved, BOY_ID, improvedAll) === true, '5. 3:42 刷新历史最佳')
  assert(improvedSummary.performance.personalBest === 1, '5. 本次表现计入个人最佳')

  const declined = make('2026-09-21', BOY_ID, '陈礼源', 'male', 'valid', 250, ITEM_1000)
  const declinedAll = [first, improved, declined]
  const declinedVs = compareWithPreviousResult(declined, BOY_ID, declinedAll)
  const declinedSummary = summarizeSingleTest(declined, declinedAll, runItem('run-1000m'), EMPTY_CLASSES)
  assert(declinedVs.kind === 'declined' && declinedVs.previousRaw === 222, '3. 较上次退步：与紧邻 3:42 比，不得与首次 4:00 比')
  assert(declinedVs.deltaRaw === 28, '3. 时间增加=退步')
  assert(declinedSummary.performance.declined === 1 && declinedSummary.performance.improved === 0 && declinedSummary.performance.first === 0, '3. 退步不与进步/首次同时计')
  assert(detectPersonalBest(declined, BOY_ID, declinedAll) === false, '5. 退步未刷新个人最佳')

  const same = make('2026-09-28', BOY_ID, '陈礼源', 'male', 'valid', 250, ITEM_1000)
  const sameVs = compareWithPreviousResult(same, BOY_ID, [...declinedAll, same])
  const sameSummary = summarizeSingleTest(same, [...declinedAll, same], runItem('run-1000m'), EMPTY_CLASSES)
  assert(sameVs.kind === 'same' && sameVs.previousRaw === 250, '4. 持平：与紧邻有效成绩相等')
  assert(sameSummary.performance.same === 1 && sameSummary.performance.improved === 0 && sameSummary.performance.declined === 0 && sameSummary.performance.first === 0, '4. 持平不得同时计进退首次')
  assert(detectPersonalBest(same, BOY_ID, [...declinedAll, same]) === false, '4. 持平不刷新个人最佳')

  const pending = make('2026-09-07', BOY_ID, '陈礼源', 'male', 'pending', null, ITEM_1000)
  const absent = make('2026-09-08', BOY_ID, '陈礼源', 'male', 'absent', null, ITEM_1000)
  const exempt = make('2026-09-09', BOY_ID, '陈礼源', 'male', 'exempt', null, ITEM_1000)
  const afterGap = make('2026-09-14', BOY_ID, '陈礼源', 'male', 'valid', 222, ITEM_1000)
  const gapAll = [first, pending, absent, exempt, afterGap]
  const gapVs = compareWithPreviousResult(afterGap, BOY_ID, gapAll)
  assert(gapVs.kind === 'improved' && gapVs.previousRaw === 240, '6. 未测/缺考/免考夹在两次有效之间被跳过，仍与上一条有效比，不得误判为首次')

  const otherBoy = rec(createPeTestId(), OTHER_ID, '其他男生', 'male', 'valid', 200, ITEM_1000)
  const mixed = sessionOf('2026-09-10', [rec(createPeTestId(), BOY_ID, '陈礼源', 'male', 'pending', null, ITEM_1000), otherBoy], {
    testItemId: ITEM_1000
  })
  const afterOther = make('2026-09-14', BOY_ID, '陈礼源', 'male', 'valid', 222, ITEM_1000)
  const vsIgnoreOther = compareWithPreviousResult(afterOther, BOY_ID, [first, mixed, afterOther])
  assert(vsIgnoreOther.previousRaw === 240 && vsIgnoreOther.kind === 'improved', '不得与其他学生成绩比较')

  const girl800 = make('2026-09-10', GIRL_ID, '女生', 'female', 'valid', 200, ITEM_800, { testGroupId: MIDDLE_LONG_RUN_GROUP_ID })
  const boy1000Later = make('2026-09-14', BOY_ID, '陈礼源', 'male', 'valid', 222, ITEM_1000, { testGroupId: MIDDLE_LONG_RUN_GROUP_ID })
  const vsWrongItem = compareWithPreviousResult(boy1000Later, BOY_ID, [first, girl800, boy1000Later])
  assert(vsWrongItem.previousRaw === 240 && vsWrongItem.kind === 'improved', '800米不得作为男生1000米的上次')

  const histFirst240Best200Recent222 = [
    first,
    make('2026-09-10', BOY_ID, '陈礼源', 'male', 'valid', 200, ITEM_1000),
    make('2026-09-14', BOY_ID, '陈礼源', 'male', 'valid', 222, ITEM_1000)
  ]
  const vsLast = compareWithPreviousResult(histFirst240Best200Recent222[2], BOY_ID, histFirst240Best200Recent222)
  const growth = buildStudentItemHistory(histFirst240Best200Recent222, BOY_ID, ITEM_1000, BUILTIN_TEST_ITEMS)
  assert(vsLast.kind === 'declined' && vsLast.previousRaw === 200, '较上次相对紧邻 3:20，为退步')
  assert(growth && growth.vsFirstKind === 'improved', '相较首次仍对比首次 4:00，为进步，算法不与较上次合并')
  assert(growth.vsFirstText.includes('进步'), '学生成长页相较首次文案保持进步语义')
  assert(detectPersonalBest(histFirst240Best200Recent222[2], BOY_ID, histFirst240Best200Recent222) === false, '最近 3:42 未刷新已被 3:20 占据的个人最佳')

  return 'history compare self-check passed'
}

export function runHistoryCompareSelfCheckOrThrow(): string {
  return runHistoryCompareSelfCheck()
}
