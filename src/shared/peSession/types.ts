import type { Grade } from '../class/types'

export type PeLessonType = 'regular' | 'large' | 'extra'

/** 课堂工作流状态：创建后为记录中，教师显式完成后为已完成。 */
export type PeSessionStatus = 'in_progress' | 'completed'

/** 考勤：学生是否到课。含历史兼容值 observer（旧数据见习写在考勤里）。 */
export type AttendanceStatus = 'normal' | 'absent' | 'leave' | 'late' | 'observer'

/** 课堂参与：到课后的身体/参与情况（与考勤正交）。 */
export type ParticipationStatus = 'normal' | 'observer' | 'unwell' | 'injured'

export type PerformanceTag = 'engaged' | 'excellent' | 'improved' | 'discipline' | 'unequipped'

export interface PEStudentRecord {
  id: string
  sessionId: string
  studentId: string
  nameSnapshot: string
  studentNoSnapshot: string
  attendanceStatus: AttendanceStatus
  /**
   * 课堂参与状态。旧 JSON 缺省；缺省时由 attendanceStatus===observer 兼容为见习。
   */
  participationStatus?: ParticipationStatus
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
  /** 整节课备注 / 课堂小结（完成时可补充）。 */
  notes: string
  classNameSnapshot: string
  gradeSnapshot: Grade
  teamSnapshot: string
  startTimeSnapshot: string
  endTimeSnapshot: string
  /**
   * 课堂完成状态。旧 JSON 缺省；缺省视为 in_progress（记录中），不得当作已完成。
   */
  status?: PeSessionStatus
  completedAt?: string | null
  /**
   * 创建时关联的教学计划 / 周次（可选）。历史快照：topic/notes/objectivesSnapshot 不随计划修改而变。
   */
  teachingPlanId?: string | null
  teachingPlanWeekId?: string | null
  /** 创建时从周计划 objectives 快照；只读展示，不回写 TeachingPlan。 */
  objectivesSnapshot?: string
  createdAt: string
  updatedAt: string
  records: PEStudentRecord[]
}

export const PE_LESSON_TYPES: PeLessonType[] = ['regular', 'large', 'extra']

export const PE_SESSION_STATUSES: PeSessionStatus[] = ['in_progress', 'completed']

export const PE_SESSION_STATUS_LABELS: Record<PeSessionStatus, string> = {
  in_progress: '记录中',
  completed: '已完成'
}

export const ATTENDANCE_STATUSES: AttendanceStatus[] = ['normal', 'absent', 'leave', 'late', 'observer']

/** 编辑器用考勤选项（不含历史兼容的 observer，见习改走参与状态）。 */
export const ATTENDANCE_EDIT_STATUSES: Array<Exclude<AttendanceStatus, 'observer'>> = [
  'normal',
  'absent',
  'leave',
  'late'
]

export const PARTICIPATION_STATUSES: ParticipationStatus[] = ['normal', 'observer', 'unwell', 'injured']

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

export const PARTICIPATION_LABELS: Record<ParticipationStatus, string> = {
  normal: '正常',
  observer: '见习',
  unwell: '身体不适',
  injured: '受伤'
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
