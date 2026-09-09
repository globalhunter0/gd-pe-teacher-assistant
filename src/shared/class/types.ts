export type Grade = '初一' | '初二' | '初三'

export type Semester = '第一学期' | '第二学期'

export type ClassStatus = 'active' | 'deleted'

export interface ClassRecord {
  id: string
  className: string
  grade: Grade
  academicYear: string
  semester: Semester
  studentCount: number
  notes: string
  status: ClassStatus
  createdAt: string
  updatedAt: string
}

export const GRADES: Grade[] = ['初一', '初二', '初三']

export const SEMESTERS: Semester[] = ['第一学期', '第二学期']

export const CLASS_STATUSES: ClassStatus[] = ['active', 'deleted']

export const CLASS_STATUS_LABELS: Record<ClassStatus, string> = {
  active: '当前班级',
  deleted: '已删除'
}

export const DEFAULT_ACADEMIC_YEAR = '2026-2027'
