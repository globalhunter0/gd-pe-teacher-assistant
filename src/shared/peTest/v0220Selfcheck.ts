import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { ClassRecord } from '../class/types'
import { listBuiltinExamStandards } from '../examStandard/catalog'
import type { StudentRecord } from '../student/types'
import { BUILTIN_TEST_ITEMS } from './builtinItems'
import {
  applyQuickEntry,
  applyQuickEntryUndo,
  captureRecordState,
  countQuickEntryProgress,
  firstUnenteredRecordId,
  isGroupComplete,
  parseQuickEntryInput,
  pendingStudentIds,
  pushRecentEntry,
  pushUndoEntry,
  recordMatchesSearch,
  recentEntryFromRecord,
  uniqueStudentIds,
  visibleQuickEntryRecords
} from './quickEntry'
import { createPeTestId, createPeTestRecordId, parsePeTestSessions } from './validate'
import type { PETestSession, TestItem } from './types'
import { runV0210PeTestQuickEntrySelfCheck } from './v0210Selfcheck'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function readSrc(relative: string): string {
  return readFileSync(resolve(process.cwd(), relative), 'utf8')
}

const NOW = '2026-09-11T04:00:00.000Z'
const CLASS_ID = 'class-c215d4a4-bbe5-4aaa-8aaa-aaaaaaaa0220'
const DATE = '2026-09-11'

function student(seq: string, no: string, name: string, gender: StudentRecord['gender']): StudentRecord {
  return {
    id: `student-c215d4a4-bbe5-4aaa-8aaa-aaaaaaaa02${seq}`,
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

const FIXTURE_CLASS: ClassRecord = {
  id: CLASS_ID,
  className: '初一测试班',
  grade: '初一',
  academicYear: '2025-2026',
  semester: '第一学期',
  studentCount: 10,
  notes: 'v0.22.0 temp fixture',
  status: 'active',
  createdAt: NOW,
  updatedAt: NOW
}

const FIXTURE_STUDENTS: StudentRecord[] = [
  student('01', '1', '林一', 'male'),
  student('02', '2', '林二', 'male'),
  student('03', '3', '陈三', 'male'),
  student('04', '4', '林四', 'female'),
  student('05', '5', '黄五', 'male'),
  student('06', '6', '林六', 'male'),
  student('07', '18', '林十八', 'male'),
  student('08', '8', '赵八', 'male'),
  student('09', '9', '钱九', 'female'),
  student('10', '10', '孙十', 'male')
]

function item(key: string): TestItem {
  const found = BUILTIN_TEST_ITEMS.find((entry) => entry.builtinKey === key)
  assert(found, `缺少内置项目 ${key}`)
  return found
}

function makeSession(testItem: TestItem): PETestSession {
  const id = createPeTestId()
  return {
    id,
    classId: CLASS_ID,
    testItemId: testItem.id,
    date: DATE,
    title: `${FIXTURE_CLASS.className} · ${testItem.name} · ${DATE}`,
    notes: '',
    classNameSnapshot: FIXTURE_CLASS.className,
    gradeSnapshot: FIXTURE_CLASS.grade,
    testItemNameSnapshot: testItem.name,
    unitSnapshot: testItem.unit,
    customUnitLabelSnapshot: testItem.customUnitLabel,
    directionSnapshot: testItem.direction,
    valueTypeSnapshot: testItem.valueType,
    timeInputModeSnapshot: testItem.timeInputMode,
    createdAt: NOW,
    updatedAt: NOW,
    records: FIXTURE_STUDENTS.map((entry) => ({
      id: createPeTestRecordId(),
      testSessionId: id,
      studentId: entry.id,
      nameSnapshot: entry.name,
      studentNoSnapshot: entry.studentNo,
      genderSnapshot: entry.gender,
      rawValue: null,
      status: 'pending',
      note: '',
      createdAt: NOW,
      updatedAt: NOW,
      examScore: null,
      rawOriginal: '',
      examItemId: null
    })),
    importSource: 'manual',
    examStandardId: null,
    scoringCitySnapshot: '',
    scoringVersionSnapshot: ''
  }
}

export function runV0220PeTestFieldEntrySelfCheck(): string {
  const panel = readSrc('src/renderer/src/components/PeQuickEntryPanel.tsx')
  const testsPage = readSrc('src/renderer/src/pages/PeTestsPage.tsx')
  const applySrc = readSrc('src/shared/peTest/quickEntry/apply.ts')
  const scoreEngine = readSrc('src/shared/examStandard/score.ts')
  const thisSrc = readSrc('src/shared/peTest/v0220Selfcheck.ts')

  assert(runV0210PeTestQuickEntrySelfCheck().includes('passed'), 'A. v0.21 连续录入仍正常')
  assert(testsPage.includes('<PeQuickEntryPanel') && !testsPage.includes('PeFieldEntryPanel'), 'V. 不新增第二套 Quick Entry')
  assert(panel.includes('applyQuickEntry') && panel.includes('resolveQuickEntryStatusShortcut'), '复用 v0.21 引擎')

  const run1000 = item('run-1000m')
  const guangzhou = listBuiltinExamStandards().find((entry) => entry.id === 'cn-gd-guangzhou-middle-2024-2026')
  assert(guangzhou, '广州标准')
  let session = makeSession(run1000)
  const first = session.records[0]
  const second = session.records[1]
  const third = session.records[2]

  const enter1 = applyQuickEntry({
    session,
    testItem: run1000,
    recordId: first.id,
    action: { type: 'score', input: '342' },
    standard: guangzhou,
    nowIso: NOW
  })
  assert(enter1.ok && enter1.nextRecordId === second.id, 'A/S. 保存成功才自动下一人')
  session = enter1.session

  const pendingOnly = visibleQuickEntryRecords(session.records, { tab: 'pending', query: '', groupStudentIds: null })
  const recordedOnly = visibleQuickEntryRecords(session.records, { tab: 'recorded', query: '', groupStudentIds: null })
  assert(pendingOnly.every((item) => item.status === 'pending') && pendingOnly.length === 9, 'B. 未录筛选')
  assert(recordedOnly.length === 1 && recordedOnly[0].id === first.id, 'C. 已录筛选')

  const byName = visibleQuickEntryRecords(session.records, { tab: 'all', query: '林', groupStudentIds: null })
  const byNo = visibleQuickEntryRecords(session.records, { tab: 'all', query: '18', groupStudentIds: null })
  assert(byName.length >= 4 && byName.every((item) => item.nameSnapshot.includes('林')), 'C. 姓名搜索')
  assert(byNo.length === 1 && byNo[0].studentNoSnapshot === '18', 'D. 学号搜索')
  assert(recordMatchesSearch(session.records[6], '18'), 'D. 学号 18')
  assert(panel.includes('setCurrentId(record.id)'), 'E. 点击学生可切换')

  const groupIds = uniqueStudentIds([first.studentId, third.studentId, session.records[4].studentId])
  assert(groupIds.length === 3, 'F. 分组选择不重复 studentId')
  const groupPending = pendingStudentIds(session.records).filter((id) => groupIds.includes(id))
  assert(!groupPending.includes(first.studentId), 'F. 已录默认不进新组')

  const groupEnter = applyQuickEntry({
    session,
    testItem: run1000,
    recordId: third.id,
    action: { type: 'score', input: '345' },
    standard: guangzhou,
    nowIso: NOW,
    scopeStudentIds: groupIds
  })
  assert(groupEnter.ok, 'G. 分组录入')
  session = groupEnter.session
  assert(groupEnter.nextRecordId === session.records[4].id, 'J. 组内自动下一人')
  assert(groupEnter.nextRecordId !== second.id, 'J. 不会跳到组外 pending')
  assert(session.id === enter1.session.id && session.records.length === 10, 'G/H. 同一学生不复制，写入原 PE Test')

  const groupLast = applyQuickEntry({
    session,
    testItem: run1000,
    recordId: session.records[4].id,
    action: { type: 'absent' },
    standard: guangzhou,
    nowIso: NOW,
    scopeStudentIds: groupIds
  })
  session = groupLast.session
  assert(isGroupComplete(session.records, groupIds), 'H. 本组完成逻辑')
  assert(session.records[0].rawValue === 222 && session.records[2].rawValue === 225, 'I. 分组结束后全班成绩仍在')

  let store = parsePeTestSessions([session])
  store = parsePeTestSessions([...store.filter((item) => item.id !== session.id), session])
  assert(store.length === 1, 'X. 不新增第二套存储 / Q. 不重复 PE Test')

  const recent = pushRecentEntry(
    [],
    recentEntryFromRecord(session.records[0], '3:42')
  )
  const recent2 = pushRecentEntry(recent, recentEntryFromRecord(session.records[2], '3:45'))
  assert(recent2[0].name === '陈三' && recent2.length === 2, 'K. 最近录入正确')

  const beforeModify = captureRecordState(session.records[0])
  const modify = applyQuickEntry({
    session,
    testItem: run1000,
    recordId: first.id,
    action: { type: 'score', input: '324' },
    standard: guangzhou,
    nowIso: NOW
  })
  session = modify.session
  const undoModify = applyQuickEntryUndo(
    session,
    {
      sessionId: session.id,
      recordId: first.id,
      studentId: first.studentId,
      before: beforeModify,
      after: captureRecordState(session.records[0])
    },
    NOW
  )
  assert(undoModify.ok && undoModify.session.records[0].rawValue === 222, 'L/P. 撤销已有成绩修改可恢复旧成绩')
  session = undoModify.session
  assert(session.records.length === 10 && parsePeTestSessions([session]).length === 1, 'Q. 撤销不生成重复 PE Test')

  const absentTarget = session.records[1]
  const beforeAbsent = captureRecordState(absentTarget)
  const absented = applyQuickEntry({
    session,
    testItem: run1000,
    recordId: absentTarget.id,
    action: { type: 'absent' },
    standard: guangzhou,
    nowIso: NOW
  })
  session = absented.session
  const undoAbsent = applyQuickEntryUndo(
    session,
    {
      sessionId: session.id,
      recordId: absentTarget.id,
      studentId: absentTarget.studentId,
      before: beforeAbsent,
      after: captureRecordState(session.records[1])
    },
    NOW
  )
  assert(undoAbsent.ok && undoAbsent.session.records[1].status === 'pending' && undoAbsent.session.records[1].examScore === null, 'M. 撤销缺考')
  session = undoAbsent.session

  const beforeExempt = captureRecordState(session.records[5])
  const exempted = applyQuickEntry({
    session,
    testItem: run1000,
    recordId: session.records[5].id,
    action: { type: 'exempt' },
    standard: guangzhou,
    nowIso: NOW
  })
  session = exempted.session
  const undoExempt = applyQuickEntryUndo(
    session,
    {
      sessionId: session.id,
      recordId: session.records[5].id,
      studentId: session.records[5].studentId,
      before: beforeExempt,
      after: captureRecordState(session.records[5])
    },
    NOW
  )
  assert(undoExempt.ok && undoExempt.session.records[5].status === 'pending', 'N. 撤销免考')
  session = undoExempt.session

  const scoredAgain = applyQuickEntry({
    session,
    testItem: run1000,
    recordId: session.records[7].id,
    action: { type: 'score', input: '350' },
    standard: guangzhou,
    nowIso: NOW
  })
  session = scoredAgain.session
  const beforePending = captureRecordState(session.records[7])
  const toPending = applyQuickEntry({
    session,
    testItem: run1000,
    recordId: session.records[7].id,
    action: { type: 'pending' },
    standard: guangzhou,
    nowIso: NOW
  })
  session = toPending.session
  const undoPending = applyQuickEntryUndo(
    session,
    {
      sessionId: session.id,
      recordId: session.records[7].id,
      studentId: session.records[7].studentId,
      before: beforePending,
      after: captureRecordState(session.records[7])
    },
    NOW
  )
  assert(undoPending.ok && undoPending.session.records[7].status === 'valid', 'O. 撤销 pending 恢复原成绩')

  const stay = applyQuickEntry({
    session: undoPending.session,
    testItem: run1000,
    recordId: second.id,
    action: { type: 'score', input: 'abc' },
    standard: guangzhou,
    nowIso: NOW
  })
  assert(!stay.ok && stay.nextRecordId === second.id, 'R. 非法输入不会自动下一人')
  assert(!parseQuickEntryInput('abc', run1000).ok, 'R. 无法解析')

  assert(panel.includes('当前：') && panel.includes('studentNoSnapshot'), 'T. 当前学生信息正确')
  const stats = countQuickEntryProgress(undoPending.session.records)
  assert(stats.total === 10 && stats.pending + stats.recorded === 10, 'U. 统计正确')
  assert(firstUnenteredRecordId(undoPending.session.records) !== first.id, '未录优先')
  assert(panel.includes('Ctrl') || panel.includes("key.toLowerCase() === 'z'"), 'K. Ctrl+Z')
  assert(pushUndoEntry([], {
    sessionId: session.id,
    recordId: first.id,
    studentId: first.studentId,
    before: beforeModify,
    after: beforeModify
  }).length === 1, '撤销栈')

  assert(!panel.includes('createStudent') && panel.includes('useStudents'), 'W. 不新增第二套 Student')
  assert(!applySrc.includes('writeFile') && panel.includes('upsertSession'), 'X. 复用 PE Test 数据层')
  assert(!scoreEngine.includes('v0.22') && panel.includes('calculateExamScore') === false, 'Y. 不修改评分引擎')
  assert(panel.includes('calculateExamScore') === false, '评分仍走 quickEntry/score')
  assert(!panel.includes('writeFileSync') && !applySrc.includes('writeFileSync'), 'Z. 不修改真实 AppData')
  assert(FIXTURE_CLASS.className === '初一测试班', '临时 fixture')

  return 'v0.22.0 pe-test field entry self-check passed'
}

export function runV0220PeTestFieldEntrySelfCheckOrThrow(): string {
  return runV0220PeTestFieldEntrySelfCheck()
}
