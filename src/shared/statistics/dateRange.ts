import { formatLocalDate } from '../peTest/validate'

export type StatsRangeKind = 'days30' | 'days90' | 'all' | 'custom'

export interface ResolvedDateRange {
  start: string | null
  end: string | null
}

export const STATS_RANGE_OPTIONS: Array<{ kind: StatsRangeKind; label: string }> = [
  { kind: 'days30', label: '最近30天' },
  { kind: 'days90', label: '最近90天' },
  { kind: 'all', label: '全部' },
  { kind: 'custom', label: '自定义' }
]

function shiftDays(base: Date, days: number): Date {
  const next = new Date(base.getFullYear(), base.getMonth(), base.getDate())
  next.setDate(next.getDate() + days)
  return next
}

export function resolveDateRange(
  kind: StatsRangeKind,
  customStart: string,
  customEnd: string,
  today: Date = new Date()
): ResolvedDateRange {
  if (kind === 'all') {
    return { start: null, end: null }
  }

  if (kind === 'custom') {
    const start = customStart.trim() === '' ? null : customStart
    const end = customEnd.trim() === '' ? null : customEnd
    if (start && end && start > end) {
      return { start: end, end: start }
    }
    return { start, end }
  }

  const end = formatLocalDate(today)
  const start = formatLocalDate(shiftDays(today, kind === 'days30' ? -29 : -89))
  return { start, end }
}

export function inDateRange(date: string, range: ResolvedDateRange): boolean {
  if (range.start && date < range.start) {
    return false
  }

  if (range.end && date > range.end) {
    return false
  }

  return true
}
