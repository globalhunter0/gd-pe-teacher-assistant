export type Grade = '初一' | '初二' | '初三'

export type Semester = '第一学期' | '第二学期'

export interface ClassRecord {
  id: string
  className: string
  grade: Grade
  academicYear: string
  semester: Semester
  studentCount: number
  notes: string
  createdAt: string
  updatedAt: string
}

export const GRADES: Grade[] = ['初一', '初二', '初三']

export const SEMESTERS: Semester[] = ['第一学期', '第二学期']

export const DEFAULT_ACADEMIC_YEAR = '2026-2027'
