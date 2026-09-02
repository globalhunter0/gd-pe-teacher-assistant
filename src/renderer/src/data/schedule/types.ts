export type Weekday = 1 | 2 | 3 | 4 | 5

export type Period = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export type CourseType = 'regular' | 'big'

export interface ScheduleItem {
  id: string
  weekday: Weekday
  period: Period
  startTime: string
  endTime: string
  team: string
  courseType: CourseType
}

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  1: '星期一',
  2: '星期二',
  3: '星期三',
  4: '星期四',
  5: '星期五'
}

export const COURSE_TYPE_LABELS: Record<CourseType, string> = {
  regular: '体育与健康',
  big: '大体育课'
}

export const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5]

export const PERIODS: Period[] = [1, 2, 3, 4, 5, 6, 7, 8]
