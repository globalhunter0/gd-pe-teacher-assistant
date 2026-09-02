import { PERIOD_TIMES } from '@shared/schedule/periodTimes'
import { createScheduleRepository, type ScheduleRepository } from './scheduleRepository'
import type { CourseType, Period, ScheduleItem, Weekday } from './types'

export type TodayStatus = 'weekend-or-none' | 'not-started' | 'in-class' | 'between' | 'finished'

export interface WeeklySummary {
  total: number
  regularCount: number
  bigCount: number
  otherCount: number
  semesterLabel: string
}

export interface TodayOverview {
  weekday: Weekday | null
  weekdayLabel: string
  lessons: ScheduleItem[]
  lessonCount: number
  currentLesson: ScheduleItem | null
  nextLesson: ScheduleItem | null
  status: TodayStatus
  statusLabel: string
  nextLessonLabel: string
  nextLessonHint: string
}

const WEEKDAY_NAMES = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function currentMinutes(now: Date): number {
  return now.getHours() * 60 + now.getMinutes()
}

function toWeekday(day: number): Weekday | null {
  if (day >= 1 && day <= 5) {
    return day as Weekday
  }
  return null
}

export function formatTimeRange(startTime: string, endTime: string): string {
  const start = startTime.replace(/^0/, '')
  const end = endTime.replace(/^0/, '')
  return `${start}-${end}`
}

export function getPeriodTimeLabel(period: Period): string {
  const slot = PERIOD_TIMES[period]
  if (!slot) {
    return ''
  }
  return formatTimeRange(slot.startTime, slot.endTime)
}

export function createScheduleService(items: ScheduleItem[]) {
  const repository: ScheduleRepository = createScheduleRepository(items)

  function getWeeklySummary(): WeeklySummary {
    const lessons = repository.listAll()
    return {
      total: lessons.length,
      regularCount: lessons.filter((item) => item.courseType === 'regular').length,
      bigCount: lessons.filter((item) => item.courseType === 'big').length,
      otherCount: lessons.filter((item) => item.courseType === 'other').length,
      semesterLabel: '2026学年第一学期'
    }
  }

  function getLessonAt(weekday: Weekday, period: Period): ScheduleItem | undefined {
    return repository.findBySlot(weekday, period)
  }

  function getTodayOverview(now: Date = new Date()): TodayOverview {
    const day = now.getDay()
    const weekday = toWeekday(day)
    const weekdayLabel = WEEKDAY_NAMES[day]

    if (weekday === null) {
      return {
        weekday: null,
        weekdayLabel,
        lessons: [],
        lessonCount: 0,
        currentLesson: null,
        nextLesson: null,
        status: 'weekend-or-none',
        statusLabel: '今日无课程',
        nextLessonLabel: '今日无课程',
        nextLessonHint: weekdayLabel
      }
    }

    const lessons = repository.listByWeekday(weekday)
    if (lessons.length === 0) {
      return {
        weekday,
        weekdayLabel,
        lessons: [],
        lessonCount: 0,
        currentLesson: null,
        nextLesson: null,
        status: 'weekend-or-none',
        statusLabel: '今日无课程',
        nextLessonLabel: '今日无课程',
        nextLessonHint: weekdayLabel
      }
    }

    const minutes = currentMinutes(now)
    const currentLesson =
      lessons.find((item) => minutes >= toMinutes(item.startTime) && minutes <= toMinutes(item.endTime)) ??
      null
    const nextLesson = lessons.find((item) => toMinutes(item.startTime) > minutes) ?? null
    const lastLesson = lessons[lessons.length - 1]
    const firstLesson = lessons[0]

    let status: TodayStatus
    if (minutes < toMinutes(firstLesson.startTime)) {
      status = 'not-started'
    } else if (currentLesson) {
      status = 'in-class'
    } else if (minutes > toMinutes(lastLesson.endTime)) {
      status = 'finished'
    } else {
      status = 'between'
    }

    const statusLabel =
      status === 'in-class' && currentLesson
        ? `正在上课 · ${currentLesson.team}`
        : status === 'not-started'
          ? '尚未上课'
          : status === 'between'
            ? '课间'
            : '今天课程已结束'

    if (nextLesson) {
      return {
        weekday,
        weekdayLabel,
        lessons,
        lessonCount: lessons.length,
        currentLesson,
        nextLesson,
        status,
        statusLabel,
        nextLessonLabel: nextLesson.team,
        nextLessonHint: `第${nextLesson.period}节  ${formatTimeRange(nextLesson.startTime, nextLesson.endTime)}`
      }
    }

    return {
      weekday,
      weekdayLabel,
      lessons,
      lessonCount: lessons.length,
      currentLesson,
      nextLesson: null,
      status,
      statusLabel,
      nextLessonLabel: status === 'finished' || status === 'in-class' ? '今天课程已结束' : '今日无课程',
      nextLessonHint:
        status === 'in-class' && currentLesson
          ? `当前第${currentLesson.period}节，后面没有课`
          : weekdayLabel
    }
  }

  function countByCourseType(courseType: CourseType): number {
    return repository.listAll().filter((item) => item.courseType === courseType).length
  }

  return {
    getWeeklySummary,
    getLessonAt,
    getTodayOverview,
    countByCourseType
  }
}
