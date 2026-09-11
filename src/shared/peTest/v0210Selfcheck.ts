import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { ClassRecord } from '../class/types'
import { listBuiltinExamStandards } from '../examStandard/catalog'
import { calculateExamScore } from '../examStandard/score'
import type { ExamStandard } from '../examStandard/types'
import type { StudentRecord } from '../student/types'
import { BUILTIN_TEST_ITEMS } from './builtinItems'
import {
  applyQuickEntry,
  adjacentRecordId,
  countQuickEntryProgress,
  convertPeTestRawToExamRaw,
  firstUnenteredRecordId,
  parseQuickEntryInput,
  resolveQuickEntryStatusShortcut,
  scoreQuickEntryRaw
} from './quickEntry'
import { activeStudentsOfClass, findExistingPeTestsForQuickEntry } from './quickEntry/prepare'
import { resolveExamItemForQuickEntry } from './quickEntry/score'
import { createPeTestId, createPeTestRecordId, parsePeTestSessions } from './validate'
import type { PETestSession, TestItem } from './types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function readSrc(relative: string): string {
  return readFileSync(resolve(process.cwd(), relative), 'utf8')
}

const NOW = '2026-09-11T02:00:00.000Z'
const CLASS_ID = 'class-b215d4a4-bbe5-4aaa-8aaa-aaaaaaaa0210'
const DATE = '2026-09-11'

function student(seq: string, no: string, name: string, gender: StudentRecord['gender']): StudentRecord {
  return {
    id: `student-b215d4a4-bbe5-4aaa-8aaa-aaaaaaaa02${seq}`,
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
  notes: 'v0.21.0 temp fixture',
  status: 'active',
  createdAt: NOW,
  updatedAt: NOW
}

const FIXTURE_STUDENTS: StudentRecord[] = [
  student('01', '1', '林一', 'male'),
  student('02', '2', '林二', 'male'),
  student('03', '3', '林三', 'male'),
  student('04', '4', '林四', 'female'),
  student('05', '5', '林五', 'male'),
  student('06', '6', '林六', 'male'),
  student('07', '7', '林七', 'male'),
  student('08', '8', '林八', 'male'),
  student('09', '9', '林九', 'female'),
  student('10', '10', '林十', 'male')
]

function item(key: string): TestItem {
  const found = BUILTIN_TEST_ITEMS.find((entry) => entry.builtinKey === key)
  assert(found, `缺少内置项目 ${key}`)
  return found
}

function makeSession(testItem: TestItem, students: StudentRecord[]): PETestSession {
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
    records: students.map((entry) => ({
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

function upsertInMemory(store: PETestSession[], session: PETestSession): PETestSession[] {
  return parsePeTestSessions([...store.filter((entry) => entry.id !== session.id), session])
}

export function runV0210PeTestQuickEntrySelfCheck(): string {
  const testsPage = readSrc('src/renderer/src/pages/PeTestsPage.tsx')
  const editor = readSrc('src/renderer/src/components/PeTestEditor.tsx')
  const panel = readSrc('src/renderer/src/components/PeQuickEntryPanel.tsx')
  const parseSrc = readSrc('src/shared/peTest/quickEntry/parse.ts')
  const applySrc = readSrc('src/shared/peTest/quickEntry/apply.ts')
  const scoreSrc = readSrc('src/shared/peTest/quickEntry/score.ts')
  const thisSrc = readSrc('src/shared/peTest/v0210Selfcheck.ts')

  assert(testsPage.includes('快速录入') && testsPage.includes('<PeQuickEntryPanel'), 'A. Quick Entry 入口存在')
  assert(editor.includes('快速录入成绩') && editor.includes('onRequestQuickEntry'), 'A. 打开/编辑入口')
  assert(testsPage.includes('<PeQuickEntryPanel') && editor.includes('onRequestQuickEntry') && panel.includes('applyQuickEntry'), '同一套 Quick Entry 流程')

  const loaded = activeStudentsOfClass(FIXTURE_STUDENTS, CLASS_ID)
  assert(loaded.length === 10 && loaded[0].name === '林一' && FIXTURE_CLASS.className === '初一测试班', 'B. 班级学生正确加载')

  assert(item('run-1000m').name === '1000米' && item('50m').name === '50米', 'C. 项目来自现有 catalog')
  assert(!panel.includes('BUILTIN_TEST_ITEMS =') && !parseSrc.includes('const CATALOG'), 'W. 不新增第二套项目 catalog')

  const run1000 = item('run-1000m')
  const parsed342 = parseQuickEntryInput('342', run1000)
  assert(parsed342.ok && parsed342.rawValue === 222 && parsed342.display.startsWith('3:42'), 'D. 342 解析为 3:42 / 222秒')
  const parsedClock = parseQuickEntryInput('3:42', run1000)
  assert(parsedClock.ok && parsedClock.rawValue === 222, 'E. 3:42 解析为 222秒')
  assert(!parseQuickEntryInput('3', run1000).ok, 'V. 1000米输入 3 不静默保存')

  const sprint = item('50m')
  const parsed78 = parseQuickEntryInput('7.8', sprint)
  assert(parsed78.ok && parsed78.rawValue === 7.8, 'F. 50米 7.8')
  assert(!parseQuickEntryInput('800', sprint).ok, 'V. 50米 800 不静默保存')

  const ropeItem = item('skip-1min')
  const parsedSkip = parseQuickEntryInput('168', ropeItem)
  assert(parsedSkip.ok && parsedSkip.rawValue === 168, 'G. 跳绳 168')
  assert(!parseQuickEntryInput('3.42', ropeItem).ok, 'V. 跳绳小数异常')

  const jump = item('standing-long-jump')
  const parsedJump = parseQuickEntryInput('235', jump)
  assert(parsedJump.ok && parsedJump.rawValue === 235, 'H. 立定跳远 235')
  assert(convertPeTestRawToExamRaw('cm', 'm', 235) === 2.35, '立定跳远按现有单位换算到米')

  const guangzhou = listBuiltinExamStandards().find((entry) => entry.id === 'cn-gd-guangzhou-middle-2024-2026')
  assert(guangzhou, '广州标准')

  let store: PETestSession[] = []
  let session = makeSession(run1000, FIXTURE_STUDENTS)
  store = upsertInMemory(store, session)
  const firstId = firstUnenteredRecordId(session.records)
  assert(firstId === session.records[0].id, '默认第一名未录入')

  const existing = findExistingPeTestsForQuickEntry(store, CLASS_ID, DATE, run1000.id)
  assert(existing.length === 1, '已有测试可继续')

  const enter1 = applyQuickEntry({
    session,
    testItem: run1000,
    recordId: firstId!,
    action: { type: 'score', input: '342' },
    standard: guangzhou,
    nowIso: NOW
  })
  assert(enter1.ok, 'E. Enter 保存')
  session = enter1.session
  store = upsertInMemory(store, session)
  const saved1 = session.records.find((entry) => entry.id === firstId)!
  assert(saved1.rawValue === 222 && saved1.status === 'valid', '保存原始成绩 222 秒')
  assert(enter1.nextRecordId !== firstId, 'I. Enter 后自动下一人')
  assert(enter1.focusAgain === true && panel.includes('inputRef.current?.focus()') && panel.includes('autoFocus'), 'J. 输入框自动重新聚焦')

  const engine = calculateExamScore({
    standard: guangzhou,
    itemId: resolveExamItemForQuickEntry(guangzhou, run1000, 'male')!.id,
    rawValue: 222,
    gender: 'male',
    officialOnly: true
  })
  assert(engine.ok && saved1.examScore === engine.score, 'Q. 自动评分调用现有评分引擎')
  assert(!scoreSrc.includes('MALE_1000M') && !panel.includes('linearRule'), 'X. 不新增第二套评分引擎')

  const secondId = enter1.nextRecordId!
  const modifySame = applyQuickEntry({
    session,
    testItem: run1000,
    recordId: firstId!,
    action: { type: 'score', input: '3:40' },
    standard: guangzhou,
    nowIso: NOW
  })
  assert(modifySame.ok, 'Q. 修改已有成绩')
  session = modifySame.session
  store = upsertInMemory(store, session)
  assert(store.length === 1 && session.records.length === 10, 'O. 修改不新增重复记录')
  const again = applyQuickEntry({
    session,
    testItem: run1000,
    recordId: firstId!,
    action: { type: 'score', input: '345' },
    standard: guangzhou,
    nowIso: NOW
  })
  session = again.session
  store = upsertInMemory(store, session)
  assert(store.length === 1 && store[0].records.filter((entry) => entry.studentId === saved1.studentId).length === 1, 'P. 连续修改同一学生不重复 PE Test')

  const absent = applyQuickEntry({
    session,
    testItem: run1000,
    recordId: secondId,
    action: { type: 'absent' },
    standard: guangzhou,
    nowIso: NOW
  })
  session = absent.session
  const absentRec = session.records.find((entry) => entry.id === secondId)!
  assert(absentRec.status === 'absent' && absentRec.examScore === null && absentRec.rawValue === null, 'K. absent 保持 null')

  const thirdId = absent.nextRecordId!
  const exempt = applyQuickEntry({
    session,
    testItem: run1000,
    recordId: thirdId,
    action: { type: 'exempt' },
    standard: guangzhou,
    nowIso: NOW
  })
  session = exempt.session
  const exemptRec = session.records.find((entry) => entry.id === thirdId)!
  assert(exemptRec.status === 'exempt' && exemptRec.examScore === null, 'L. exempt 保持 null')

  const fourthId = exempt.nextRecordId!
  const pending = applyQuickEntry({
    session,
    testItem: run1000,
    recordId: fourthId,
    action: { type: 'pending' },
    standard: guangzhou,
    nowIso: NOW
  })
  session = pending.session
  const pendingRec = session.records.find((entry) => entry.id === fourthId)!
  assert(pendingRec.status === 'pending' && pendingRec.examScore === null, 'M. pending 保持 null')

  assert(resolveQuickEntryStatusShortcut({ key: 'A', code: 'KeyA', inputText: '' }) === 'absent', 'A 触发 absent')
  assert(resolveQuickEntryStatusShortcut({ key: 'a', code: 'KeyA', inputText: '' }) === 'absent', 'a 触发 absent')
  assert(resolveQuickEntryStatusShortcut({ key: 'E', code: 'KeyE', inputText: '' }) === 'exempt', 'E 触发 exempt')
  assert(resolveQuickEntryStatusShortcut({ key: 'e', code: 'KeyE', inputText: '' }) === 'exempt', 'e 触发 exempt')
  assert(resolveQuickEntryStatusShortcut({ key: 'P', code: 'KeyP', inputText: '' }) === 'pending', 'P 触发 pending')
  assert(resolveQuickEntryStatusShortcut({ key: 'p', code: 'KeyP', inputText: '' }) === 'pending', 'p 触发 pending')
  assert(resolveQuickEntryStatusShortcut({ key: 'A', code: 'KeyA', inputText: '342' }) === null, '非空不得误触发 A')
  assert(resolveQuickEntryStatusShortcut({ key: 'a', code: 'KeyA', inputText: '7.8' }) === null, '非空不得误触发 a')
  assert(resolveQuickEntryStatusShortcut({ key: 'e', code: 'KeyE', inputText: '168' }) === null, '非空不得误触发 e')
  assert(resolveQuickEntryStatusShortcut({ key: 'P', code: 'KeyP', inputText: '3:42' }) === null, '非空不得误触发 P')
  assert(panel.includes('resolveQuickEntryStatusShortcut') && panel.includes('event.code'), '快捷键走大小写无关解析')

  const skipAct = applyQuickEntry({
    session,
    testItem: run1000,
    recordId: fourthId,
    action: { type: 'skip' },
    standard: guangzhou,
    nowIso: NOW
  })
  session = skipAct.session
  const skipped = session.records.find((entry) => entry.id === fourthId)!
  assert(skipped.status === 'pending' && skipAct.nextRecordId !== fourthId, 'N. 跳过保持 pending')

  const clicked = adjacentRecordId(session.records, firstId!, 1)
  assert(clicked === session.records[1].id, 'T. 点击/切换学生')
  assert(adjacentRecordId(session.records, session.records[1].id, -1) === session.records[0].id, 'U. 上一名/下一名')

  const noScore = scoreQuickEntryRaw({
    standard: null,
    testItem: run1000,
    gender: 'male',
    rawValue: 222
  })
  assert(noScore.examScore === null && noScore.noScoreHint === '暂无可用评分标准', 'R. 无 verified 评分标准不伪造得分')

  const unverified: ExamStandard = { ...guangzhou, status: 'partial', scoreTableStatus: 'partial' }
  const blocked = scoreQuickEntryRaw({
    standard: unverified,
    testItem: run1000,
    gender: 'male',
    rawValue: 222
  })
  assert(blocked.examScore === null, 'R. fail-closed')

  let sprintSession = makeSession(sprint, FIXTURE_STUDENTS)
  const sprintEnter = applyQuickEntry({
    session: sprintSession,
    testItem: sprint,
    recordId: sprintSession.records[0].id,
    action: { type: 'score', input: '7.8' },
    standard: guangzhou,
    nowIso: NOW
  })
  assert(sprintEnter.ok && sprintEnter.session.records[0].rawValue === 7.8, 'F. 50米正确保存')
  const beforeBad = sprintEnter.session
  const badSprint = applyQuickEntry({
    session: beforeBad,
    testItem: sprint,
    recordId: sprintSession.records[1].id,
    action: { type: 'score', input: '800' },
    standard: guangzhou,
    nowIso: NOW
  })
  assert(!badSprint.ok && beforeBad.records[1].rawValue === null, 'V. 异常输入不写入')

  const skipSession = makeSession(ropeItem, FIXTURE_STUDENTS)
  const skipEnter = applyQuickEntry({
    session: skipSession,
    testItem: ropeItem,
    recordId: skipSession.records[0].id,
    action: { type: 'score', input: '168' },
    standard: guangzhou,
    nowIso: NOW
  })
  assert(skipEnter.ok && skipEnter.session.records[0].rawValue === 168, 'G. 跳绳正确保存')

  const jumpSession = makeSession(jump, FIXTURE_STUDENTS)
  const jumpEnter = applyQuickEntry({
    session: jumpSession,
    testItem: jump,
    recordId: jumpSession.records[0].id,
    action: { type: 'score', input: '235' },
    standard: guangzhou,
    nowIso: NOW
  })
  assert(jumpEnter.ok && jumpEnter.session.records[0].rawValue === 235, 'H. 立定跳远正确保存')
  const jumpItem = resolveExamItemForQuickEntry(guangzhou, jump, 'male')
  if (jumpItem) {
    const expected = calculateExamScore({
      standard: guangzhou,
      itemId: jumpItem.id,
      rawValue: 2.35,
      gender: 'male',
      officialOnly: true
    })
    assert(expected.ok && jumpEnter.session.records[0].examScore === expected.score, 'Q. 跳远按米评分')
  }

  store = upsertInMemory(store, session)
  const progress = countQuickEntryProgress(session.records)
  assert(progress.total === 10 && progress.absent === 1 && progress.exempt === 1, 'S. 已录/未录/缺考/免考统计')
  assert(progress.recorded === progress.total - progress.pending, 'S. 已录 = 总人数 - 未录')

  assert(applySrc.includes("status: parsed.needsConfirm ? 'invalid' : 'valid'"), 'Enter 保存状态')
  assert(panel.includes("upsertSession") && !panel.includes('writeFile') && !panel.includes('pe-tests.json'), 'Y. 复用 PE Test 数据层，Renderer 不直接写 JSON')
  assert(!readSrc('src/shared/peTest/quickEntry/apply.ts').includes('sqlite') && !testsPage.toLowerCase().includes('sqlite'), 'Y. 不新增 SQLite')
  assert(!panel.includes('Android') && !panel.includes('微信小程序'), '不开发手机 App')
  assert(thisSrc.includes('初一测试班') && thisSrc.includes('temp fixture'), '临时 fixture')
  assert(!panel.includes('writeFileSync') && !applySrc.includes('writeFileSync'), 'Z. 不修改真实 AppData')
  assert(panel.includes('pe-quick-layout') && readSrc('src/renderer/src/styles/global.css').includes('minmax(0, 1fr)'), '响应式结构')

  return 'v0.21.0 pe-test quick entry self-check passed'
}

export function runV0210PeTestQuickEntrySelfCheckOrThrow(): string {
  return runV0210PeTestQuickEntrySelfCheck()
}
