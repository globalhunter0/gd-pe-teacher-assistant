import type { CourseType } from '../schedule/types'
import type { PeLessonType } from './types'

export function mapScheduleCourseType(courseType: CourseType): PeLessonType {
  if (courseType === 'big') {
    return 'large'
  }

  if (courseType === 'regular') {
    return 'regular'
  }

  return 'extra'
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
