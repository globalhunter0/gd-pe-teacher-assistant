export type Grade =
  | '一年级'
  | '二年级'
  | '三年级'
  | '四年级'
  | '五年级'
  | '六年级'
  | '初一'
  | '初二'
  | '初三'
  | '高一'
  | '高二'
  | '高三'

export type SchoolStage = 'primary' | 'junior' | 'senior'

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

export const PRIMARY_GRADES: Grade[] = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']
export const JUNIOR_GRADES: Grade[] = ['初一', '初二', '初三']
export const SENIOR_GRADES: Grade[] = ['高一', '高二', '高三']
export const GRADES: Grade[] = [...PRIMARY_GRADES, ...JUNIOR_GRADES, ...SENIOR_GRADES]

export const GRADE_LABELS: Record<Grade, string> = {
  一年级: '小学一年级',
  二年级: '小学二年级',
  三年级: '小学三年级',
  四年级: '小学四年级',
  五年级: '小学五年级',
  六年级: '小学六年级',
  初一: '初一',
  初二: '初二',
  初三: '初三',
  高一: '高一',
  高二: '高二',
  高三: '高三'
}

export const GRADE_STAGE: Record<Grade, SchoolStage> = {
  一年级: 'primary',
  二年级: 'primary',
  三年级: 'primary',
  四年级: 'primary',
  五年级: 'primary',
  六年级: 'primary',
  初一: 'junior',
  初二: 'junior',
  初三: 'junior',
  高一: 'senior',
  高二: 'senior',
  高三: 'senior'
}

export const SEMESTERS: Semester[] = ['第一学期', '第二学期']

export const CLASS_STATUSES: ClassStatus[] = ['active', 'deleted']

export const CLASS_STATUS_LABELS: Record<ClassStatus, string> = {
  active: '当前班级',
  deleted: '已删除'
}

export const DEFAULT_ACADEMIC_YEAR = '2026-2027'
