export type { CourseType, Period, ScheduleItem, Weekday } from '@shared/schedule/types'
export {
  COURSE_TYPE_LABELS,
  PERIODS,
  WEEKDAYS,
  WEEKDAY_LABELS
} from '@shared/schedule/types'
export { DEFAULT_SCHEDULE as WEEKLY_SCHEDULE } from '@shared/schedule/defaultSchedule'
export { getDefaultSlotTime, PERIOD_TIMES } from '@shared/schedule/periodTimes'
export { parseScheduleItems } from '@shared/schedule/validate'
