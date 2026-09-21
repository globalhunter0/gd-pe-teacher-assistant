import type { ClassRecord } from '../class'
import type { TeachingPlan, TeachingPlanWeek } from './types'
import { plansMatchingClassContext } from './validate'

export type TeachingPlanPrefillStatus = 'prefilled' | 'none' | 'ambiguous' | 'no-week'

export interface TeachingPlanPrefillResult {
  status: TeachingPlanPrefillStatus
  topic: string
  notes: string
  objectives: string
  weekNumber: number | null
  weekId: string | null
  planId: string | null
}

function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) {
    return null
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

/** Week index (1-based) relative to plan startDate for the given calendar day. */
export function currentWeekNumberForDate(
  startDate: string | null,
  weekCount: number,
  onDate: string | Date = new Date()
): number | null {
  if (!startDate || !Number.isInteger(weekCount) || weekCount < 1) {
    return null
  }
  const start = parseLocalDate(startDate)
  if (!start) {
    return null
  }

  let dayStart: number
  if (typeof onDate === 'string') {
    const parsed = parseLocalDate(onDate)
    if (!parsed) {
      return null
    }
    dayStart = parsed.getTime()
  } else {
    dayStart = new Date(onDate.getFullYear(), onDate.getMonth(), onDate.getDate()).getTime()
  }

  const diff = Math.floor((dayStart - start.getTime()) / 86400000)
  if (diff < 0) {
    return null
  }
  const week = Math.floor(diff / 7) + 1
  if (week < 1 || week > weekCount) {
    return null
  }
  return week
}

function findWeek(plan: TeachingPlan, weekNumber: number): TeachingPlanWeek | undefined {
  return plan.weeks.find((week) => week.weekNumber === weekNumber)
}

/**
 * Read-only prefill for a new PE classroom session from the unique matching
 * teaching plan's current week. Never mutates TeachingPlan. Does not guess
 * when multiple plans match.
 */
export function resolveUniqueCurrentWeekPrefill(
  plans: ReadonlyArray<TeachingPlan>,
  classRecord: Pick<ClassRecord, 'grade' | 'academicYear' | 'semester'>,
  onDate: string | Date = new Date()
): TeachingPlanPrefillResult {
  const matched = plansMatchingClassContext(plans, {
    grade: classRecord.grade,
    academicYear: classRecord.academicYear,
    semester: classRecord.semester
  })

  if (matched.length === 0) {
    return {
      status: 'none',
      topic: '',
      notes: '',
      objectives: '',
      weekNumber: null,
      weekId: null,
      planId: null
    }
  }

  if (matched.length > 1) {
    return {
      status: 'ambiguous',
      topic: '',
      notes: '',
      objectives: '',
      weekNumber: null,
      weekId: null,
      planId: null
    }
  }

  const plan = matched[0]
  const weekNumber = currentWeekNumberForDate(plan.startDate, plan.weeks.length, onDate)
  if (weekNumber == null) {
    return {
      status: 'no-week',
      topic: '',
      notes: '',
      objectives: '',
      weekNumber: null,
      weekId: null,
      planId: plan.id
    }
  }

  const week = findWeek(plan, weekNumber)
  if (!week) {
    return {
      status: 'no-week',
      topic: '',
      notes: '',
      objectives: '',
      weekNumber,
      weekId: null,
      planId: plan.id
    }
  }

  const topic = week.title.trim()
  const notes = week.contents.trim()
  const objectives = week.objectives.trim()
  if (!topic && !notes && !objectives) {
    return {
      status: 'none',
      topic: '',
      notes: '',
      objectives: '',
      weekNumber,
      weekId: week.id,
      planId: plan.id
    }
  }

  return {
    status: 'prefilled',
    topic,
    notes,
    objectives,
    weekNumber,
    weekId: week.id,
    planId: plan.id
  }
}
