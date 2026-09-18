import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseScheduleItems, scheduleSlotId, workbenchClockStatus } from '../schedule'
import { DEFAULT_SCHEDULE } from '../schedule/defaultSchedule'
import type { ScheduleItem } from '../schedule/types'
import type { PEClassSession, PEStudentRecord, PeLessonType } from './types'
import {
  findExistingPeSession,
  findPeSessionById,
  findSessionForWorkbenchLesson,
  resolveWorkbenchLessonRecord
} from './workbenchToday'
import { findDuplicateSession } from './validate'

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

const CLASS_A = 'class-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
const CLASS_B = 'class-bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee'
const STUDENT_A = 'student-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
const SESSION_LINKED = 'pe-session-aaaaaaaa-bbbb-4ccc-8ddd-111111111111'
const SESSION_OLD = 'pe-session-aaaaaaaa-bbbb-4ccc-8ddd-222222222222'
const SESSION_EXTRA = 'pe-session-aaaaaaaa-bbbb-4ccc-8ddd-333333333333'
const SESSION_DELETED_CLASS = 'pe-session-aaaaaaaa-bbbb-4ccc-8ddd-444444444444'
const RECORD_A = 'pe-record-aaaaaaaa-bbbb-4ccc-8ddd-aaaaaaaaaaa1'
const RECORD_B = 'pe-record-aaaaaaaa-bbbb-4ccc-8ddd-aaaaaaaaaaa2'
const RECORD_C = 'pe-record-aaaaaaaa-bbbb-4ccc-8ddd-aaaaaaaaaaa3'
const RECORD_D = 'pe-record-aaaaaaaa-bbbb-4ccc-8ddd-aaaaaaaaaaa4'
const TODAY = '2026-09-18'
const LESSON_ID = scheduleSlotId(1, 3)

function studentRecord(id: string, sessionId: string): PEStudentRecord {
  return {
    id,
    sessionId,
    studentId: STUDENT_A,
    nameSnapshot: '张三',
    studentNoSnapshot: 'A01',
    attendanceStatus: 'normal',
    performanceTags: [],
    note: '',
    createdAt: '2026-09-18T00:00:00.000Z',
    updatedAt: '2026-09-18T00:00:00.000Z'
  }
}

function session(options: {
  id: string
  classId: string
  date?: string
  period: number
  scheduleLessonId: string | null
  lessonType?: PeLessonType
  recordId: string
  classNameSnapshot?: string
}): PEClassSession {
  return {
    id: options.id,
    classId: options.classId,
    date: options.date ?? TODAY,
    period: options.period,
    scheduleLessonId: options.scheduleLessonId,
    lessonType: options.lessonType ?? 'regular',
    topic: '',
    notes: '',
    classNameSnapshot: options.classNameSnapshot ?? '1班',
    gradeSnapshot: '初一',
    teamSnapshot: '团队1',
    startTimeSnapshot: '10:00',
    endTimeSnapshot: '10:40',
    createdAt: '2026-09-18T00:00:00.000Z',
    updatedAt: '2026-09-18T00:00:00.000Z',
    records: [studentRecord(options.recordId, options.id)]
  }
}

function todayLesson(patch: Partial<ScheduleItem> = {}): ScheduleItem {
  const parsed = parseScheduleItems([
    {
      weekday: 1,
      period: 3,
      startTime: '10:00',
      endTime: '10:40',
      team: '团队1',
      courseType: 'regular',
      classId: CLASS_A
    }
  ])[0]
  return { ...parsed, ...patch }
}

function endedNow(): Date {
  return new Date(2026, 8, 18, 12, 0, 0)
}

function readSrc(relativeFromShared: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', relativeFromShared), 'utf8')
}

export function runPeSessionWorkbenchSelfCheckOrThrow(): string {
  const lesson = todayLesson()
  assert(lesson.id === LESSON_ID, '今日课表格子 id 必须稳定')

  const emptyMatch = resolveWorkbenchLessonRecord([], lesson, TODAY)
  assert(emptyMatch.status === 'unrecorded', '今天有课且无课堂记录应为未记录')
  assert(emptyMatch.session === undefined, '未记录时不得指向课堂记录')

  const linked = session({
    id: SESSION_LINKED,
    classId: CLASS_A,
    period: 3,
    scheduleLessonId: LESSON_ID,
    recordId: RECORD_A
  })
  const linkedMatch = resolveWorkbenchLessonRecord([linked], lesson, TODAY)
  assert(linkedMatch.status === 'recorded', '有 scheduleLessonId 对应记录应为已记录')
  assert(linkedMatch.session?.id === SESSION_LINKED, '已记录必须指向原记录')

  const clock = workbenchClockStatus(lesson, endedNow(), undefined, undefined)
  assert(clock === 'done', '12:00 时第3节应为已结束')
  const endedUnrecorded = resolveWorkbenchLessonRecord([], lesson, TODAY)
  assert(clock === 'done' && endedUnrecorded.status === 'unrecorded', '已下课但无记录仍为未记录')

  const duplicate = findExistingPeSession([linked], {
    classId: CLASS_B,
    date: TODAY,
    period: 8,
    scheduleLessonId: LESSON_ID
  })
  assert(duplicate?.id === SESSION_LINKED, '同一 scheduleLessonId + 日期不得再创建第二条')
  assert(
    findSessionForWorkbenchLesson([linked], lesson, TODAY)?.id === SESSION_LINKED,
    '继续记录目标必须是原记录'
  )

  const extra = session({
    id: SESSION_EXTRA,
    classId: CLASS_A,
    period: 3,
    scheduleLessonId: null,
    lessonType: 'extra',
    recordId: RECORD_C
  })
  const extraMatch = resolveWorkbenchLessonRecord([extra], lesson, TODAY)
  assert(extraMatch.status === 'unrecorded', '独立补课不得把正常课表格子标成已记录')
  assert(extraMatch.session === undefined, '补课不得成为课表格子的工作台记录')
  assert(
    findExistingPeSession([extra], { classId: CLASS_A, date: TODAY, period: 3, scheduleLessonId: LESSON_ID })?.id ===
      SESSION_EXTRA,
    '同一班级日期节次仍应由底层防重挡住'
  )

  const oldMissingLink = session({
    id: SESSION_OLD,
    classId: CLASS_A,
    period: 3,
    scheduleLessonId: null,
    lessonType: 'regular',
    recordId: RECORD_B
  })
  const oldMatch = resolveWorkbenchLessonRecord([oldMissingLink], lesson, TODAY)
  assert(oldMatch.status === 'recorded', '旧记录缺少 scheduleLessonId 时应兼容匹配')
  assert(oldMatch.session?.id === SESSION_OLD, '旧兼容不得改写历史，只读取已有记录')
  assert(oldMissingLink.scheduleLessonId === null, '兼容匹配不得改写旧记录的 scheduleLessonId')

  const otherDay = session({
    id: SESSION_OLD,
    classId: CLASS_A,
    date: '2026-09-17',
    period: 3,
    scheduleLessonId: LESSON_ID,
    recordId: RECORD_B
  })
  assert(
    resolveWorkbenchLessonRecord([otherDay], lesson, TODAY).status === 'unrecorded',
    '其它日期的同格子记录不得标成今天已记录'
  )

  const deletedClassSession = session({
    id: SESSION_DELETED_CLASS,
    classId: CLASS_B,
    period: 5,
    scheduleLessonId: null,
    lessonType: 'extra',
    recordId: RECORD_D,
    classNameSnapshot: '已删班'
  })
  const opened = findPeSessionById([deletedClassSession], SESSION_DELETED_CLASS)
  assert(opened?.id === SESSION_DELETED_CLASS, '近期记录必须能解析到有效记录')
  assert(opened?.classNameSnapshot === '已删班', '已删班级的历史课堂记录仍应可打开')
  assert(findPeSessionById([], SESSION_DELETED_CLASS) === undefined, '找不到记录时应明确返回空')

  assert(resolveWorkbenchLessonRecord([], todayLesson(), TODAY).status === 'unrecorded', '空课堂记录列表正常')
  assert(findSessionForWorkbenchLesson([], todayLesson(), TODAY) === undefined, '空课表关联查找不得崩溃')
  assert(parseScheduleItems([]).length === 0, '空课表正常')
  assert(DEFAULT_SCHEDULE.every((item) => item.weekday >= 1 && item.weekday <= 5), '默认课表不含周末格子')

  const weekendProbe = workbenchClockStatus(
    { id: 'w1-p1', startTime: '08:00', endTime: '08:40' },
    new Date(2026, 8, 20, 10, 0, 0),
    undefined,
    undefined
  )
  assert(weekendProbe === 'done' || weekendProbe === 'later' || weekendProbe === 'live' || weekendProbe === 'next', '周末调用时钟状态不得抛错')

  const legacyMissingId = session({
    id: SESSION_OLD,
    classId: CLASS_A,
    period: 7,
    scheduleLessonId: null,
    recordId: RECORD_B
  })
  assert(
    resolveWorkbenchLessonRecord([legacyMissingId], lesson, TODAY).status === 'unrecorded',
    '缺少 scheduleLessonId 的其它节次旧记录不得崩溃或误标'
  )

  assert(
    findDuplicateSession([linked], CLASS_A, TODAY, 3)?.id === SESSION_LINKED,
    '原有 class+date+period 防重必须仍有效'
  )

  const dashboard = readSrc('../renderer/src/pages/DashboardPage.tsx')
  assert(dashboard.includes('findSessionForWorkbenchLesson') || dashboard.includes('resolveWorkbenchLessonRecord'), '工作台必须用共享记录状态')
  assert(dashboard.includes('workbenchClockStatus'), '工作台必须把时间状态与记录状态分开')
  assert(dashboard.includes('继续记录'), '已记录课程按钮应为继续记录')
  assert(dashboard.includes('开始课堂'), '未记录课程按钮应为开始课堂')
  assert(dashboard.includes('onOpenSession'), '近期课堂记录必须可打开')
  assert(!dashboard.includes('dashboard-status.json'), '不得派生持久化工作台状态')
  assert(dashboard.includes('今天暂无课程安排'), '空课表/周末必须保持空态文案')

  const app = readSrc('../renderer/src/App.tsx')
  assert(app.includes('openPeSessionId'), '打开已有课堂记录必须复用现有课堂记录页')
  const lessonPage = readSrc('../renderer/src/pages/PeLessonRecordsPage.tsx')
  assert(lessonPage.includes('findExistingPeSession'), '创建链必须走底层防重')
  assert(lessonPage.includes('openSessionId'), '继续记录/近期记录必须打开原记录编辑界面')

  return 'pe-session workbench self-check passed'
}
