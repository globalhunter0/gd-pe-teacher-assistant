import type { Period } from './types'

export const PERIOD_TIMES: Partial<Record<Period, { startTime: string; endTime: string }>> = {
  2: { startTime: '08:50', endTime: '09:30' },
  3: { startTime: '10:00', endTime: '10:40' },
  4: { startTime: '10:50', endTime: '11:30' },
  5: { startTime: '11:40', endTime: '12:20' },
  6: { startTime: '14:15', endTime: '14:55' },
  7: { startTime: '15:10', endTime: '15:50' },
  8: { startTime: '16:05', endTime: '16:45' }
}

export function getDefaultSlotTime(period: Period): { startTime: string; endTime: string } {
  return PERIOD_TIMES[period] ?? { startTime: '08:00', endTime: '08:40' }
}
