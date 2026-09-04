import type { Grade, Semester } from '../class/types'

export interface TeachingPlanWeek {
  id: string
  weekNumber: number
  title: string
  contents: string
  objectives: string
  notes: string
}

export interface TeachingPlan {
  id: string
  name: string
  academicYear: string
  semester: Semester
  grade: Grade
  startDate: string | null
  endDate: string | null
  totalWeeks: number
  notes: string
  createdAt: string
  updatedAt: string
  weeks: TeachingPlanWeek[]
}
