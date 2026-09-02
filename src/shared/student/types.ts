export type StudentGender = 'male' | 'female' | 'unspecified'

export type StudentStatus = 'active' | 'transferred'

export interface StudentRecord {
  id: string
  classId: string
  studentNo: string
  name: string
  gender: StudentGender
  status: StudentStatus
  notes: string
  createdAt: string
  updatedAt: string
}

export const STUDENT_GENDERS: StudentGender[] = ['male', 'female', 'unspecified']

export const STUDENT_STATUSES: StudentStatus[] = ['active', 'transferred']

export const STUDENT_GENDER_LABELS: Record<StudentGender, string> = {
  male: '男',
  female: '女',
  unspecified: '未填写'
}

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  active: '在读',
  transferred: '已转出'
}
