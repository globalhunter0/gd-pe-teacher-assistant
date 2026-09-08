import type { Grade } from '../class/types'

export type PeLessonType = 'regular' | 'large' | 'extra'

export type AttendanceStatus = 'normal' | 'absent' | 'leave' | 'late' | 'observer'

export type PerformanceTag = 'engaged' | 'excellent' | 'improved' | 'discipline' | 'unequipped'

export interface PEStudentRecord {
  id: string
  sessionId: string
  studentId: string
  nameSnapshot: string
  studentNoSnapshot: string
  attendanceStatus: AttendanceStatus
  performanceTags: PerformanceTag[]
  note: string
  createdAt: string
  updatedAt: string
}

export interface PEClassSession {
  id: string
  classId: string
  date: string
  period: number
  scheduleLessonId: string | null
  lessonType: PeLessonType
  topic: string
  notes: string
  classNameSnapshot: string
  gradeSnapshot: Grade
  teamSnapshot: string
  startTimeSnapshot: string
  endTimeSnapshot: string
  createdAt: string
  updatedAt: string
  records: PEStudentRecord[]
}

export const PE_LESSON_TYPES: PeLessonType[] = ['regular', 'large', 'extra']

export const ATTENDANCE_STATUSES: AttendanceStatus[] = ['normal', 'absent', 'leave', 'late', 'observer']

export const PERFORMANCE_TAGS: PerformanceTag[] = [
  'engaged',
  'excellent',
  'improved',
  'discipline',
  'unequipped'
]

export const COMMON_PERIODS = [1, 2, 3, 4, 5, 6, 7, 8]

export const PE_LESSON_TYPE_LABELS: Record<PeLessonType, string> = {
  regular: '常规体育课',
  large: '年级大课',
  extra: '补课 / 临时课'
}

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  normal: '正常',
  absent: '缺勤',
  leave: '请假',
  late: '迟到',
  observer: '见习'
}

export const PERFORMANCE_TAG_LABELS: Record<PerformanceTag, string> = {
  engaged: '积极参与',
  excellent: '动作优秀',
  improved: '进步明显',
  discipline: '纪律提醒',
  unequipped: '未带体育装备'
}

export interface PeSessionPrefill {
  date: string
  period: number
  scheduleLessonId: string
  lessonType: PeLessonType
  teamSnapshot: string
  startTimeSnapshot: string
  endTimeSnapshot: string
  classId?: string
}
