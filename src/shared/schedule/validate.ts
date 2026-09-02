import type { CourseType, Period, ScheduleItem, Weekday } from './types'

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

function normalizeTime(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('上课时间格式不正确')
  }

  const parts = value.split(':')
  if (parts.length < 2) {
    throw new Error('上课时间格式不正确')
  }

  const hours = Number(parts[0])
  const minutes = Number(parts[1])
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    throw new Error('上课时间格式不正确')
  }

  const normalized = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  if (!TIME_PATTERN.test(normalized)) {
    throw new Error('上课时间格式不正确')
  }

  return normalized
}

function isWeekday(value: unknown): value is Weekday {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5
}

function isPeriod(value: unknown): value is Period {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5 || value === 6 || value === 7 || value === 8
}

function isCourseType(value: unknown): value is CourseType {
  return value === 'regular' || value === 'big' || value === 'other'
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function parseScheduleItems(input: unknown): ScheduleItem[] {
  if (!Array.isArray(input)) {
    throw new Error('课表数据格式不正确')
  }

  const items = input.map((entry) => {
    if (typeof entry !== 'object' || entry === null) {
      throw new Error('课表条目格式不正确')
    }

    const record = entry as Record<string, unknown>
    const weekday = record.weekday
    const period = record.period
    const startTime = normalizeTime(record.startTime)
    const endTime = normalizeTime(record.endTime)
    const team = record.team
    const courseType = record.courseType

    if (!isWeekday(weekday) || !isPeriod(period) || !isCourseType(courseType)) {
      throw new Error('课表条目字段不正确')
    }

    if (toMinutes(startTime) >= toMinutes(endTime)) {
      throw new Error('结束时间必须晚于开始时间')
    }

    if (typeof team !== 'string' || team.trim().length === 0) {
      throw new Error('团队名称不能为空')
    }

    const item: ScheduleItem = {
      id: `w${weekday}-p${period}`,
      weekday,
      period,
      startTime,
      endTime,
      team: team.trim(),
      courseType
    }

    return item
  })

  const slots = new Set<string>()
  for (const item of items) {
    if (slots.has(item.id)) {
      throw new Error('同一时间格子不能重复排课')
    }
    slots.add(item.id)
  }

  return items.sort((a, b) => a.weekday - b.weekday || a.period - b.period)
}
