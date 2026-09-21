import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createDataBackup, restoreDataBackup } from '../backup/service'
import { readJsonItemsFile, writeJsonItemsAtomic } from '../persistence/jsonFile'
import {
  isPeSessionCompleted,
  markPeSessionCompleted,
  reopenPeSession,
  resolvePeSessionStatus
} from './sessionStatus'
import { resolveWorkbenchLessonRecord, workbenchActionLabel } from './workbenchToday'
import { parsePeSessions } from './validate'
import type { PEClassSession, PEStudentRecord } from './types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function readSrc(relative: string): string {
  return readFileSync(resolve(process.cwd(), relative), 'utf8')
}

function parseAny(input: unknown): unknown[] {
  if (!Array.isArray(input)) {
    throw new Error('expected array')
  }
  return input
}

const NOW = '2026-09-21T12:00:00.000Z'
const CLASS_ID = 'class-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
const SESSION_ID = 'pe-session-aaaaaaaa-bbbb-4ccc-8ddd-cccccccccccc'
const STUDENT_ID = 'student-aaaaaaaa-bbbb-4ccc-8ddd-ddddddddddd1'
const RECORD_ID = 'pe-record-aaaaaaaa-bbbb-4ccc-8ddd-ddddddddddd1'
const LESSON_ID = 'slot-1-3'

function studentRecord(overrides: Partial<PEStudentRecord> = {}): PEStudentRecord {
  return {
    id: RECORD_ID,
    sessionId: SESSION_ID,
    studentId: STUDENT_ID,
    nameSnapshot: '张三',
    studentNoSnapshot: '01',
    attendanceStatus: 'normal',
    performanceTags: [],
    note: '',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides
  }
}

function baseSession(overrides: Partial<PEClassSession> = {}): PEClassSession {
  return {
    id: SESSION_ID,
    classId: CLASS_ID,
    date: '2026-09-21',
    period: 3,
    scheduleLessonId: LESSON_ID,
    lessonType: 'regular',
    topic: '速度',
    notes: '',
    classNameSnapshot: '1班',
    gradeSnapshot: '初一',
    teamSnapshot: '团队1',
    startTimeSnapshot: '10:00',
    endTimeSnapshot: '10:40',
    createdAt: NOW,
    updatedAt: NOW,
    records: [studentRecord()],
    ...overrides
  }
}

export async function runV0270P03SessionStatusSelfCheckOrThrow(): Promise<string> {
  // 1. 老 session 无 status 可 parse
  const legacyRaw = [
    {
      id: SESSION_ID,
      classId: CLASS_ID,
      date: '2026-09-21',
      period: 3,
      scheduleLessonId: LESSON_ID,
      lessonType: 'regular',
      topic: '旧课',
      notes: '旧备注',
      classNameSnapshot: '1班',
      gradeSnapshot: '初一',
      teamSnapshot: '',
      startTimeSnapshot: '',
      endTimeSnapshot: '',
      createdAt: NOW,
      updatedAt: NOW,
      records: [
        {
          id: RECORD_ID,
          sessionId: SESSION_ID,
          studentId: STUDENT_ID,
          nameSnapshot: '张三',
          studentNoSnapshot: '01',
          attendanceStatus: 'normal',
          performanceTags: [],
          note: '',
          createdAt: NOW,
          updatedAt: NOW
        }
      ]
    }
  ]
  const legacy = parsePeSessions(legacyRaw)
  assert(legacy[0].status === undefined, '1. 老数据不注入 status')
  assert(resolvePeSessionStatus(legacy[0]) === 'in_progress', '2. 缺 status => 记录中')
  assert(!isPeSessionCompleted(legacy[0]), '3. 缺 status 不得视为已完成')

  // 4–6. 工作台三态
  const lesson = { id: LESSON_ID, period: 3 as const, classId: CLASS_ID }
  assert(resolveWorkbenchLessonRecord([], lesson, '2026-09-21').status === 'unrecorded', '4. 无记录=未记录')
  assert(
    resolveWorkbenchLessonRecord([legacy[0]], lesson, '2026-09-21').status === 'in_progress',
    '5. 有记录无 status=记录中'
  )
  const completed = markPeSessionCompleted(legacy[0], NOW, '本节完成情况良好')
  assert(completed.status === 'completed' && completed.completedAt === NOW, '6a. mark 完成写入字段')
  assert(completed.notes === '本节完成情况良好', '6b. 小结写入 notes')
  assert(
    resolveWorkbenchLessonRecord([completed], lesson, '2026-09-21').status === 'completed',
    '6c. 工作台显示已完成'
  )

  // 7. 空新建（仅有名单默认）仍是记录中，不是已完成
  const fresh = baseSession({ status: 'in_progress', completedAt: null, topic: '', notes: '' })
  assert(resolvePeSessionStatus(fresh) === 'in_progress', '7. 新建课堂=记录中')

  // 8. 完成 → 再打开 → 再完成
  const roundTrip = parsePeSessions(JSON.parse(JSON.stringify([completed])) as unknown)
  assert(roundTrip[0].status === 'completed', '8a. 完成状态可保存再读')
  const reopened = reopenPeSession(roundTrip[0], '2026-09-21T13:00:00.000Z')
  assert(reopened.status === 'in_progress' && reopened.completedAt === null, '8b. 重新打开恢复记录中')
  assert(reopened.notes === '本节完成情况良好', '8c. 重新打开不丢小结')
  const doneAgain = markPeSessionCompleted(reopened, '2026-09-21T14:00:00.000Z')
  assert(doneAgain.status === 'completed', '8d. 可再次完成')

  // 9. 按钮文案
  assert(workbenchActionLabel('unrecorded') === '开始课堂', '9a')
  assert(workbenchActionLabel('in_progress') === '继续记录', '9b')
  assert(workbenchActionLabel('completed') === '查看记录', '9c')

  // 10. 考勤/参与/测评字段不被完成状态破坏
  const withParticipation = baseSession({
    status: 'completed',
    completedAt: NOW,
    records: [
      studentRecord({
        attendanceStatus: 'late',
        participationStatus: 'observer',
        note: '脚踝不适见习',
        performanceTags: ['engaged']
      })
    ]
  })
  const parsedDone = parsePeSessions([withParticipation])[0]
  assert(parsedDone.records[0].attendanceStatus === 'late', '10a. attendance 保留')
  assert(parsedDone.records[0].participationStatus === 'observer', '10b. participation 保留')
  assert(parsedDone.records[0].note === '脚踝不适见习', '10c. note 保留')
  assert(parsedDone.records[0].performanceTags[0] === 'engaged', '10d. tags 保留')

  // 11. backup/restore
  const root = mkdtempSync(join(tmpdir(), 'v0270-p03-'))
  const archive = join(root, 'backup.zip')
  try {
    await writeJsonItemsAtomic(join(root, 'pe-sessions.json'), [withParticipation])
    await createDataBackup(root, archive, '0.27.0-selfcheck')
    await writeJsonItemsAtomic(join(root, 'pe-sessions.json'), [])
    await restoreDataBackup(root, archive, { appVersion: '0.27.0-selfcheck' })
    const restored = parsePeSessions(await readJsonItemsFile(join(root, 'pe-sessions.json'), parseAny))
    assert(
      restored[0]?.status === 'completed' &&
        restored[0]?.completedAt === NOW &&
        restored[0]?.records[0]?.participationStatus === 'observer',
      '11. backup/restore 保留 status/completedAt/参与'
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }

  // 12. UI / 无新 JSON / 不碰测试成绩
  const editor = readSrc('src/renderer/src/components/PeSessionEditor.tsx')
  assert(editor.includes('完成本节') && editor.includes('重新打开'), '12a. 编辑器有完成/重开')
  assert(editor.includes('markPeSessionCompleted') && editor.includes('reopenPeSession'), '12b. 走共享生命周期')
  assert(!editor.includes('classroom-status.json'), '12c. 无新状态 JSON')
  const quiz = readSrc('src/shared/peTest/classroomQuiz.ts')
  assert(!quiz.includes('resolvePeSessionStatus') && !quiz.includes('markPeSessionCompleted'), '12d. 测评不依赖课堂完成状态')

  // 13. 非法 status 拒绝
  let rejected = false
  try {
    parsePeSessions([{ ...baseSession(), status: 'done' }])
  } catch {
    rejected = true
  }
  assert(rejected, '13. 非法 status 拒绝')

  return 'v0.27.0 P0-3 session status self-check passed'
}
