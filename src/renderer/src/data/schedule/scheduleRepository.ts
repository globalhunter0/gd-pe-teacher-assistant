import type { Period, ScheduleItem, Weekday } from './types'

export interface ScheduleRepository {
  listAll(): ScheduleItem[]
  listByWeekday(weekday: Weekday): ScheduleItem[]
  findBySlot(weekday: Weekday, period: Period): ScheduleItem | undefined
}

export function createScheduleRepository(items: ScheduleItem[]): ScheduleRepository {
  return {
    listAll() {
      return items
    },

    listByWeekday(weekday) {
      return items.filter((item) => item.weekday === weekday).sort((a, b) => a.period - b.period)
    },

    findBySlot(weekday, period) {
      return items.find((item) => item.weekday === weekday && item.period === period)
    }
  }
}
