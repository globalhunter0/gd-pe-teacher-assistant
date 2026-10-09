import type { Period } from './types'

// 作息由用户课表提供，不预设学校时间。
export const PERIOD_TIMES: Partial<Record<Period, { startTime: string; endTime: string }>> = {}
export function getDefaultSlotTime(_period: Period): { startTime: string; endTime: string } {
  return { startTime: '', endTime: '' }
}
