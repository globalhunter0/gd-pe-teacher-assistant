import type { ClassRecord } from '../class'
import type { ScheduleItem } from '../schedule/types'
import type { TeachingPlan, TeachingPlanWeek } from './types'
import { plansMatchingClassContext } from './validate'
import { currentWeekNumberForDate } from './prefill'

export type WeeklyTeachingTaskStatus = 'ready' | 'none' | 'ambiguous' | 'no-week'

export interface WeeklyTeachingTask {
  status: WeeklyTeachingTaskStatus
  weekNumber: number | null
  weekId: string | null
  title: string
  contents: string
  objectives: string
  planId: string | null
  planName: string | null
  todayLessonCount: number
  matchedPlanCount: number
}

export type ClassPlanContext = Pick<ClassRecord, 'grade' | 'academicYear' | 'semester'>

/** 与班级年级 / 学年 / 学期匹配的教学计划（复用既有匹配规则）。 */
export function resolveTeachingPlansForClass(
  plans: ReadonlyArray<TeachingPlan>,
  context: ClassPlanContext
): TeachingPlan[] {
  return plansMatchingClassContext(plans, context)
}

export function resolveCurrentTeachingWeek(
  plan: Pick<TeachingPlan, 'startDate' | 'weeks'>,
  onDate: string | Date = new Date()
): { weekNumber: number; week: TeachingPlanWeek } | null {
  const weekNumber = currentWeekNumberForDate(plan.startDate, plan.weeks.length, onDate)
  if (weekNumber == null) {
    return null
  }
  const week = plan.weeks.find((item) => item.weekNumber === weekNumber)
  if (!week) {
    return null
  }
  return { weekNumber, week }
}

function contextKey(context: ClassPlanContext): string {
  return `${context.grade}|${context.academicYear}|${context.semester}`
}

/**
 * 工作台「本周教学任务」：按今日课表绑定班级聚合。
 * - 0 份匹配：none
 * - 多份不同计划：ambiguous（不随机猜）
 * - 唯一计划但日期不在教学周：no-week
 * - 唯一计划且有当前周：ready
 * 继续复用 currentWeekNumberForDate / plansMatchingClassContext，不另写周次算法。
 */
export function buildWeeklyTeachingTask(options: {
  plans: ReadonlyArray<TeachingPlan>
  classes: ReadonlyArray<ClassRecord>
  todayLessons: ReadonlyArray<Pick<ScheduleItem, 'id' | 'classId'>>
  onDate?: string | Date
}): WeeklyTeachingTask {
  const onDate = options.onDate ?? new Date()
  const classById = new Map(options.classes.map((item) => [item.id, item]))

  const todayBound: ClassRecord[] = []
  for (const lesson of options.todayLessons) {
    if (!lesson.classId) {
      continue
    }
    const clazz = classById.get(lesson.classId)
    if (clazz) {
      todayBound.push(clazz)
    }
  }

  const contexts = new Map<string, ClassPlanContext>()
  for (const clazz of todayBound) {
    contexts.set(contextKey(clazz), {
      grade: clazz.grade,
      academicYear: clazz.academicYear,
      semester: clazz.semester
    })
  }

  // 今日无绑定课时时，回退到全部在列班级的上下文，仍不阻断上课。
  if (contexts.size === 0) {
    for (const clazz of options.classes) {
      contexts.set(contextKey(clazz), {
        grade: clazz.grade,
        academicYear: clazz.academicYear,
        semester: clazz.semester
      })
    }
  }

  type Candidate = {
    plan: TeachingPlan
    weekNumber: number | null
    week: TeachingPlanWeek | null
    context: ClassPlanContext
  }

  const candidates: Candidate[] = []
  for (const context of contexts.values()) {
    const matched = resolveTeachingPlansForClass(options.plans, context)
    if (matched.length === 0) {
      continue
    }
    if (matched.length > 1) {
      return {
        status: 'ambiguous',
        weekNumber: null,
        weekId: null,
        title: '',
        contents: '',
        objectives: '',
        planId: null,
        planName: null,
        todayLessonCount: options.todayLessons.filter((lesson) => Boolean(lesson.classId)).length,
        matchedPlanCount: matched.length
      }
    }
    const plan = matched[0]
    const current = resolveCurrentTeachingWeek(plan, onDate)
    candidates.push({
      plan,
      weekNumber: current?.weekNumber ?? null,
      week: current?.week ?? null,
      context
    })
  }

  if (candidates.length === 0) {
    return {
      status: 'none',
      weekNumber: null,
      weekId: null,
      title: '',
      contents: '',
      objectives: '',
      planId: null,
      planName: null,
      todayLessonCount: 0,
      matchedPlanCount: 0
    }
  }

  const planIds = new Set(candidates.map((item) => item.plan.id))
  if (planIds.size > 1) {
    return {
      status: 'ambiguous',
      weekNumber: null,
      weekId: null,
      title: '',
      contents: '',
      objectives: '',
      planId: null,
      planName: null,
      todayLessonCount: options.todayLessons.filter((lesson) => Boolean(lesson.classId)).length,
      matchedPlanCount: planIds.size
    }
  }

  const primary = candidates[0]
  const todayLessonCount = options.todayLessons.filter((lesson) => {
    if (!lesson.classId) {
      return false
    }
    const clazz = classById.get(lesson.classId)
    if (!clazz) {
      return false
    }
    return (
      clazz.grade === primary.context.grade &&
      clazz.academicYear === primary.context.academicYear &&
      clazz.semester === primary.context.semester
    )
  }).length

  if (primary.week == null || primary.weekNumber == null) {
    return {
      status: 'no-week',
      weekNumber: null,
      weekId: null,
      title: '',
      contents: '',
      objectives: '',
      planId: primary.plan.id,
      planName: primary.plan.name,
      todayLessonCount,
      matchedPlanCount: 1
    }
  }

  return {
    status: 'ready',
    weekNumber: primary.weekNumber,
    weekId: primary.week.id,
    title: primary.week.title.trim(),
    contents: primary.week.contents.trim(),
    objectives: primary.week.objectives.trim(),
    planId: primary.plan.id,
    planName: primary.plan.name,
    todayLessonCount,
    matchedPlanCount: 1
  }
}

export function emptyWeeklyTeachingTask(): WeeklyTeachingTask {
  return {
    status: 'none',
    weekNumber: null,
    weekId: null,
    title: '',
    contents: '',
    objectives: '',
    planId: null,
    planName: null,
    todayLessonCount: 0,
    matchedPlanCount: 0
  }
}
