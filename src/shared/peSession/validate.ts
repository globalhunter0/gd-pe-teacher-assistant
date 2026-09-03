import type { Grade } from '../class/types'
import { GRADES } from '../class/types'
import type {
  AttendanceStatus,
  PEClassSession,
  PEStudentRecord,
  PeLessonType,
  PerformanceTag
} from './types'
import { ATTENDANCE_STATUSES, PE_LESSON_TYPES, PERFORMANCE_TAGS } from './types'

const SESSION_ID_PATTERN =
  /^pe-session-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const RECORD_ID_PATTERN =
  /^pe-record-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const CLASS_ID_PATTERN = /^class-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const STUDENT_ID_PATTERN =
  /^student-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export interface ParsePeSessionOptions {
  knownClassIds?: ReadonlySet<string>
}

export function createPeSessionId(): string {
  return `pe-session-${crypto.randomUUID()}`
}

export function createPeRecordId(): string {
  return `pe-record-${crypto.randomUUID()}`
}

function isLessonType(value: unknown): value is PeLessonType {
  return PE_LESSON_TYPES.includes(value as PeLessonType)
}

function isAttendance(value: unknown): value is AttendanceStatus {
  return ATTENDANCE_STATUSES.includes(value as AttendanceStatus)
}

function isTag(value: unknown): value is PerformanceTag {
  return PERFORMANCE_TAGS.includes(value as PerformanceTag)
}

function isGrade(value: unknown): value is Grade {
  return GRADES.includes(value as Grade)
}

function parsePeriod(value: unknown): number {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 1) {
    return value
  }

  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const parsed = Number(value.trim())
    if (Number.isInteger(parsed) && parsed >= 1) {
      return parsed
    }
  }

  throw new Error('节次必须是正整数')
}

function parseTags(value: unknown): PerformanceTag[] {
  if (value === undefined || value === null) {
    return []
  }

  if (!Array.isArray(value)) {
    throw new Error('课堂表现格式不正确')
  }

  const tags: PerformanceTag[] = []
  const seen = new Set<PerformanceTag>()
  for (const item of value) {
    if (!isTag(item)) {
      throw new Error('课堂表现标签不正确')
    }
    if (!seen.has(item)) {
      seen.add(item)
      tags.push(item)
    }
  }

  return tags
}

function parseRecord(entry: unknown, sessionId: string): PEStudentRecord {
  if (typeof entry !== 'object' || entry === null) {
    throw new Error('学生课堂记录格式不正确')
  }

  const record = entry as Record<string, unknown>
  const id = record.id
  const studentId = record.studentId
  const nameSnapshot = record.nameSnapshot
  const studentNoSnapshot = typeof record.studentNoSnapshot === 'string' ? record.studentNoSnapshot.trim() : ''
  const attendanceStatus = record.attendanceStatus
  const note = record.note
  const createdAt = record.createdAt
  const updatedAt = record.updatedAt
  const recordSessionId = record.sessionId ?? sessionId

  if (typeof id !== 'string' || !RECORD_ID_PATTERN.test(id)) {
    throw new Error('学生课堂记录 ID 不正确')
  }

  if (typeof recordSessionId !== 'string' || recordSessionId !== sessionId) {
    throw new Error('学生课堂记录与课堂不匹配')
  }

  if (typeof studentId !== 'string' || !STUDENT_ID_PATTERN.test(studentId)) {
    throw new Error('学生课堂记录缺少有效学生')
  }

  if (typeof nameSnapshot !== 'string' || nameSnapshot.trim().length === 0) {
    throw new Error('学生姓名快照不能为空')
  }

  if (!isAttendance(attendanceStatus)) {
    throw new Error('考勤状态不正确')
  }

  if (typeof createdAt !== 'string' || typeof updatedAt !== 'string') {
    throw new Error('学生课堂记录时间字段不正确')
  }

  return {
    id,
    sessionId,
    studentId,
    nameSnapshot: nameSnapshot.trim(),
    studentNoSnapshot,
    attendanceStatus,
    performanceTags: parseTags(record.performanceTags),
    note: typeof note === 'string' ? note.trim() : '',
    createdAt,
    updatedAt
  }
}

export function parsePeSessions(input: unknown, options: ParsePeSessionOptions = {}): PEClassSession[] {
  if (!Array.isArray(input)) {
    throw new Error('体育课记录格式不正确')
  }

  const sessions = input.map((entry) => {
    if (typeof entry !== 'object' || entry === null) {
      throw new Error('课堂记录条目格式不正确')
    }

    const record = entry as Record<string, unknown>
    const id = record.id
    const classId = record.classId
    const date = record.date
    const period = parsePeriod(record.period)
    const scheduleLessonId =
      record.scheduleLessonId === null || record.scheduleLessonId === undefined || record.scheduleLessonId === ''
        ? null
        : record.scheduleLessonId
    const lessonType = record.lessonType
    const topic = record.topic
    const notes = record.notes
    const classNameSnapshot = record.classNameSnapshot
    const gradeSnapshot = record.gradeSnapshot
    const teamSnapshot = record.teamSnapshot
    const startTimeSnapshot = record.startTimeSnapshot
    const endTimeSnapshot = record.endTimeSnapshot
    const createdAt = record.createdAt
    const updatedAt = record.updatedAt

    if (typeof id !== 'string' || !SESSION_ID_PATTERN.test(id)) {
      throw new Error('课堂记录 ID 不正确')
    }

    if (typeof classId !== 'string' || !CLASS_ID_PATTERN.test(classId)) {
      throw new Error('课堂所属班级不正确')
    }

    if (options.knownClassIds && !options.knownClassIds.has(classId)) {
      throw new Error('所属班级不存在，请先在班级管理中创建班级')
    }

    if (typeof date !== 'string' || !DATE_PATTERN.test(date)) {
      throw new Error('课堂日期格式应为 YYYY-MM-DD')
    }

    if (scheduleLessonId !== null && typeof scheduleLessonId !== 'string') {
      throw new Error('课表关联不正确')
    }

    if (!isLessonType(lessonType)) {
      throw new Error('课程类型不正确')
    }

    if (typeof classNameSnapshot !== 'string' || classNameSnapshot.trim().length === 0) {
      throw new Error('班级名称快照不能为空')
    }

    if (!isGrade(gradeSnapshot)) {
      throw new Error('年级快照不正确')
    }

    if (typeof createdAt !== 'string' || typeof updatedAt !== 'string') {
      throw new Error('课堂时间字段不正确')
    }

    if (!Array.isArray(record.records) || record.records.length === 0) {
      throw new Error('课堂必须包含学生记录')
    }

    const records = record.records.map((item) => parseRecord(item, id))
    const studentIds = new Set<string>()
    for (const item of records) {
      if (studentIds.has(item.studentId)) {
        throw new Error('同一课堂中学生不能重复')
      }
      studentIds.add(item.studentId)
    }

    const session: PEClassSession = {
      id,
      classId,
      date,
      period,
      scheduleLessonId,
      lessonType,
      topic: typeof topic === 'string' ? topic.trim() : '',
      notes: typeof notes === 'string' ? notes.trim() : '',
      classNameSnapshot: classNameSnapshot.trim(),
      gradeSnapshot,
      teamSnapshot: typeof teamSnapshot === 'string' ? teamSnapshot.trim() : '',
      startTimeSnapshot: typeof startTimeSnapshot === 'string' ? startTimeSnapshot.trim() : '',
      endTimeSnapshot: typeof endTimeSnapshot === 'string' ? endTimeSnapshot.trim() : '',
      createdAt,
      updatedAt,
      records
    }

    return session
  })

  const ids = new Set<string>()
  const keys = new Set<string>()
  for (const session of sessions) {
    if (ids.has(session.id)) {
      throw new Error('课堂记录 ID 不能重复')
    }
    ids.add(session.id)

    const key = `${session.classId}|${session.date}|${session.period}`
    if (keys.has(key)) {
      throw new Error(`同一班级同一天同一节次已有课堂记录：${session.date} 第${session.period}节`)
    }
    keys.add(key)
  }

  return sessions.sort(
    (a, b) => b.date.localeCompare(a.date) || a.period - b.period || a.classNameSnapshot.localeCompare(b.classNameSnapshot, 'zh-CN')
  )
}

export function findDuplicateSession(
  sessions: ReadonlyArray<Pick<PEClassSession, 'id' | 'classId' | 'date' | 'period'>>,
  classId: string,
  date: string,
  period: number,
  excludeId?: string
): PEClassSession | Pick<PEClassSession, 'id' | 'classId' | 'date' | 'period'> | undefined {
  return sessions.find(
    (item) => item.classId === classId && item.date === date && item.period === period && item.id !== excludeId
  )
}

export function countAttendance(records: ReadonlyArray<Pick<PEStudentRecord, 'attendanceStatus'>>): Record<AttendanceStatus, number> {
  const counts: Record<AttendanceStatus, number> = {
    normal: 0,
    absent: 0,
    leave: 0,
    late: 0,
    observer: 0
  }

  for (const record of records) {
    counts[record.attendanceStatus] += 1
  }

  return counts
}
