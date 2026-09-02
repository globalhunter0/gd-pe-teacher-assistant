import { WEEKLY_SCHEDULE } from './scheduleData'
import type { Period, ScheduleItem, Weekday } from './types'

export interface ScheduleRepository {
  listAll(): ScheduleItem[]
  listByWeekday(weekday: Weekday): ScheduleItem[]
  findBySlot(weekday: Weekday, period: Period): ScheduleItem | undefined
}

export const localScheduleRepository: ScheduleRepository = {
  listAll() {
    return WEEKLY_SCHEDULE
  },

  listByWeekday(weekday) {
    return WEEKLY_SCHEDULE.filter((item) => item.weekday === weekday).sort(
      (a, b) => a.period - b.period
    )
  },

  findBySlot(weekday, period) {
    return WEEKLY_SCHEDULE.find((item) => item.weekday === weekday && item.period === period)
  }
}
