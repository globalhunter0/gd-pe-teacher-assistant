import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { readFileSync } from 'node:fs'
import { createDataBackup, restoreDataBackup } from '../backup/service'
import { readJsonItemsFile, writeJsonDocumentAtomic, writeJsonItemsAtomic } from '../persistence/jsonFile'
import { applyQuickEntry } from './quickEntry'
import { resolveQuickEntryStatusShortcut } from './quickEntry/shortcuts'
import {
  countIncompletePeTestSessions,
  countPeTestSessionProgress,
  isPeTestSessionCompleted,
  markPeTestSessionCompleted,
  reopenPeTestSession
} from './sessionLifecycle'
import { BUILTIN_TEST_ITEMS } from './builtinItems'
import { createPeTestId, createPeTestRecordId, parsePeTestSessions } from './validate'
import type { PETestRecord, PETestSession, TestItem } from './types'

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

function readSrc(relative: string): string {
  return readFileSync(resolve(process.cwd(), relative), 'utf8')
}

const NOW = '2026-09-21T02:00:00.000Z'
const CLASS_ID = 'class-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
const STUDENT_1 = 'student-aaaaaaaa-bbbb-4ccc-8ddd-aaaaaaaaaaa1'
const STUDENT_2 = 'student-aaaaaaaa-bbbb-4ccc-8ddd-aaaaaaaaaaa2'
const STUDENT_3 = 'student-aaaaaaaa-bbbb-4ccc-8ddd-aaaaaaaaaaa3'

function item(key: string): TestItem {
  const found = BUILTIN_TEST_ITEMS.find((entry) => entry.builtinKey === key)
  if (!found) {
    throw new Error(`missing item ${key}`)
  }
  return found
}

function rec(sessionId: string, studentId: string, status: PETestRecord['status'], rawValue: number | null): PETestRecord {
  return {
    id: createPeTestRecordId(),
    testSessionId: sessionId,
    studentId,
    nameSnapshot: '学生',
    studentNoSnapshot: '01',
    genderSnapshot: 'male',
    rawValue,
    status,
    note: '',
    createdAt: NOW,
    updatedAt: NOW,
    examScore: null,
    rawOriginal: '',
    examItemId: null
  }
}

function baseSession(records: PETestRecord[], extra?: Partial<PETestSession>): PETestSession {
  const run = item('run-1000m')
  const id = records[0]?.testSessionId ?? createPeTestId()
  return {
    id,
    classId: CLASS_ID,
    testItemId: run.id,
    date: '2026-09-21',
    title: '测试',
    notes: '',
    classNameSnapshot: '1班',
    gradeSnapshot: '初一',
    testItemNameSnapshot: run.name,
    unitSnapshot: run.unit,
    customUnitLabelSnapshot: run.customUnitLabel,
    directionSnapshot: run.direction,
    valueTypeSnapshot: run.valueType,
    timeInputModeSnapshot: run.timeInputMode,
    createdAt: NOW,
    updatedAt: NOW,
    records: records.map((row) => ({ ...row, testSessionId: id })),
    importSource: 'manual',
    examStandardId: null,
    scoringCitySnapshot: '',
    scoringVersionSnapshot: '',
    testGroupId: null,
    status: 'in_progress',
    completedAt: null,
    ...extra
  }
}

function parseAny(input: unknown): unknown[] {
  if (!Array.isArray(input)) {
    throw new Error('not array')
  }
  return input
}

export async function runV0260PeTestLifecycleSelfCheckOrThrow(): Promise<string> {
  const dashboard = readSrc('src/renderer/src/pages/DashboardPage.tsx')
  assert(dashboard.includes('countIncompletePeTestSessions'), 'Dashboard 待完成测试必须基于 session 生命周期')

  const detail = readSrc('src/renderer/src/components/PeTestDetailPanel.tsx')
  assert(detail.includes('onCompleteTest') && detail.includes('onReopenTest'), '详情页必须持久化完成/重新打开')
  assert(detail.includes('确认完成'), '存在未测时必须确认完成')

  const sid = createPeTestId()
  let session = baseSession([
    rec(sid, STUDENT_1, 'valid', 222),
    rec(sid, STUDENT_2, 'pending', null),
    rec(sid, STUDENT_3, 'absent', null)
  ])
  assert(session.status === 'in_progress' && session.completedAt === null, '1. 新测试默认进行中')

  const progress = countPeTestSessionProgress(session.records)
  assert(progress.measured === 1 && progress.unmeasured === 1 && progress.absent === 1, '5/6/7. 已测/未测/缺考统计')

  session = markPeTestSessionCompleted(session, NOW)
  assert(session.status === 'completed' && session.completedAt === NOW, '2. 完成后持久化 completed')
  assert(isPeTestSessionCompleted(session), 'completed 判定')

  session = reopenPeTestSession(session, NOW)
  assert(session.status === 'in_progress' && session.completedAt === null, '3. 重新打开回到 in_progress')
  assert(session.records[0].rawValue === 222, '12. 重新打开不删除成绩')

  const run = item('run-1000m')
  let qe = baseSession([rec(createPeTestId(), STUDENT_2, 'pending', null)])
  const entered = applyQuickEntry({
    session: qe,
    testItem: run,
    recordId: qe.records[0].id,
    action: { type: 'score', input: '342' },
    standard: null,
    nowIso: NOW
  })
  assert(entered.ok, 'quick entry apply')
  assert(entered.session.records[0].status === 'valid', '7. 补录后进入已测')
  assert(countPeTestSessionProgress(entered.session.records).unmeasured === 0, '7. 补录后不再未测')

  qe = baseSession([rec(createPeTestId(), STUDENT_2, 'pending', null)])
  const absentShortcut = resolveQuickEntryStatusShortcut({ key: 'a', inputText: '' })
  assert(absentShortcut === 'absent', '缺考快捷')
  const markedAbsent = applyQuickEntry({
    session: qe,
    testItem: run,
    recordId: qe.records[0].id,
    action: { type: 'absent' },
    standard: null,
    nowIso: NOW
  })
  assert(markedAbsent.ok && markedAbsent.session.records[0].status === 'absent', '6. 缺考标记')
  const afterScore = applyQuickEntry({
    session: markedAbsent.session,
    testItem: run,
    recordId: markedAbsent.session.records[0].id,
    action: { type: 'score', input: '340' },
    standard: null,
    nowIso: NOW
  })
  assert(afterScore.ok && afterScore.session.records[0].status === 'valid', '8. 缺考录入成绩后为已测')

  const legacyJson = [
    {
      id: sid,
      classId: CLASS_ID,
      testItemId: run.id,
      date: '2026-09-01',
      title: '旧测试',
      notes: '',
      classNameSnapshot: '1班',
      gradeSnapshot: '初一',
      testItemNameSnapshot: run.name,
      unitSnapshot: run.unit,
      customUnitLabelSnapshot: '',
      directionSnapshot: run.direction,
      valueTypeSnapshot: run.valueType,
      timeInputModeSnapshot: run.timeInputMode,
      createdAt: NOW,
      updatedAt: NOW,
      records: [
        {
          id: createPeTestRecordId(),
          testSessionId: sid,
          studentId: STUDENT_1,
          nameSnapshot: '旧',
          studentNoSnapshot: '1',
          genderSnapshot: 'male',
          rawValue: 222,
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
  const legacy = parsePeTestSessions(legacyJson)[0]
  assert(legacy.status === 'in_progress' && legacy.completedAt === null, '9. 旧 JSON 无 status 默认 in_progress')

  const inProgress = baseSession([rec(sid, STUDENT_1, 'valid', 222)])
  const completed = markPeTestSessionCompleted(baseSession([rec(sid, STUDENT_1, 'valid', 222)]))
  assert(countIncompletePeTestSessions([inProgress, completed]) === 1, '11. Dashboard 统计未 completed 场次')

  const root = mkdtempSync(join(tmpdir(), 'gdpe-v0260-pe-lifecycle-'))
  const outside = mkdtempSync(join(tmpdir(), 'gdpe-v0260-pe-artifacts-'))
  try {
    await writeJsonItemsAtomic(join(root, 'pe-tests.json'), [completed])
    await writeJsonItemsAtomic(join(root, 'classes.json'), [{ id: 'class-1' }])
    await writeJsonItemsAtomic(join(root, 'students.json'), [])
    await writeJsonItemsAtomic(join(root, 'schedule.json'), [])
    await writeJsonItemsAtomic(join(root, 'pe-sessions.json'), [])
    await writeJsonItemsAtomic(join(root, 'test-items.json'), [])
    await writeJsonItemsAtomic(join(root, 'teaching-plans.json'), [])
    await writeJsonItemsAtomic(join(root, 'resources.json'), [])
    await writeJsonItemsAtomic(join(root, 'training-teams.json'), [])
    await writeJsonItemsAtomic(join(root, 'training-members.json'), [])
    await writeJsonItemsAtomic(join(root, 'training-plans.json'), [])
    await writeJsonItemsAtomic(join(root, 'training-sessions.json'), [])
    await writeJsonItemsAtomic(join(root, 'training-items.json'), [])
    await writeJsonItemsAtomic(join(root, 'training-results.json'), [])
    await writeJsonDocumentAtomic(join(root, 'settings.json'), { teacherDisplayName: '郁老师' })

    const archive = join(outside, 'pe-test-status.gdpebak')
    await createDataBackup(root, archive, '0.26.0-selfcheck')
    await writeJsonItemsAtomic(join(root, 'pe-tests.json'), [])
    await restoreDataBackup(root, archive, { appVersion: '0.26.0-selfcheck' })
    const restored = parsePeTestSessions(await readJsonItemsFile(join(root, 'pe-tests.json'), parseAny))
    assert(restored[0]?.status === 'completed', '10. backup/restore 保留 completed 状态')
  } finally {
    rmSync(root, { recursive: true, force: true })
    rmSync(outside, { recursive: true, force: true })
  }

  return 'v0.26.0 pe-test lifecycle self-check passed'
}
