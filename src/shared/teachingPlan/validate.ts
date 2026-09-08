import type { Grade, Semester } from '../class/types'
import { GRADES, SEMESTERS } from '../class/types'
import type { TeachingPlan, TeachingPlanWeek } from './types'

const PLAN_ID = /^teaching-plan-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const WEEK_ID = /^teaching-plan-week-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const YEAR_PATTERN = /^\d{4}-\d{4}$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export const MIN_PLAN_WEEKS = 1
export const MAX_PLAN_WEEKS = 30

export function createTeachingPlanId(): string {
  return `teaching-plan-${crypto.randomUUID()}`
}

export function createTeachingPlanWeekId(): string {
  return `teaching-plan-week-${crypto.randomUUID()}`
}

function isGrade(value: unknown): value is Grade {
  return GRADES.includes(value as Grade)
}

function isSemester(value: unknown): value is Semester {
  return SEMESTERS.includes(value as Semester)
}

function parseOptionalDate(value: unknown, label: string): string | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) {
    throw new Error(`${label}格式应为 YYYY-MM-DD`)
  }

  return value
}

export function createEmptyWeeks(count: number): TeachingPlanWeek[] {
  if (!Number.isInteger(count) || count < MIN_PLAN_WEEKS || count > MAX_PLAN_WEEKS) {
    throw new Error(`总周数必须是 ${MIN_PLAN_WEEKS} 到 ${MAX_PLAN_WEEKS} 的整数`)
  }

  return Array.from({ length: count }, (_, index) => ({
    id: createTeachingPlanWeekId(),
    weekNumber: index + 1,
    title: '',
    contents: '',
    objectives: '',
    notes: ''
  }))
}

export function renumberWeeks(weeks: TeachingPlanWeek[]): TeachingPlanWeek[] {
  return weeks.map((week, index) => ({ ...week, weekNumber: index + 1 }))
}

export function copyTeachingPlan(plan: TeachingPlan): TeachingPlan {
  const now = new Date().toISOString()
  return {
    ...plan,
    id: createTeachingPlanId(),
    name: `${plan.name} 副本`,
    createdAt: now,
    updatedAt: now,
    weeks: plan.weeks.map((week) => ({
      id: createTeachingPlanWeekId(),
      weekNumber: week.weekNumber,
      title: week.title,
      contents: week.contents,
      objectives: week.objectives,
      notes: week.notes
    }))
  }
}

function parseWeek(entry: unknown): TeachingPlanWeek {
  if (typeof entry !== 'object' || entry === null) {
    throw new Error('周计划格式不正确')
  }

  const record = entry as Record<string, unknown>
  if (typeof record.id !== 'string' || !WEEK_ID.test(record.id)) {
    throw new Error('周计划 ID 不正确')
  }

  if (typeof record.weekNumber !== 'number' || !Number.isInteger(record.weekNumber) || record.weekNumber < 1) {
    throw new Error('周次必须是正整数')
  }

  return {
    id: record.id,
    weekNumber: record.weekNumber,
    title: typeof record.title === 'string' ? record.title.trim() : '',
    contents: typeof record.contents === 'string' ? record.contents.trim() : '',
    objectives: typeof record.objectives === 'string' ? record.objectives.trim() : '',
    notes: typeof record.notes === 'string' ? record.notes.trim() : ''
  }
}

export function parseTeachingPlans(input: unknown): TeachingPlan[] {
  if (!Array.isArray(input)) {
    throw new Error('教学计划数据格式不正确')
  }

  const plans = input.map((entry) => {
    if (typeof entry !== 'object' || entry === null) {
      throw new Error('教学计划格式不正确')
    }

    const record = entry as Record<string, unknown>
    if (typeof record.id !== 'string' || !PLAN_ID.test(record.id)) {
      throw new Error('教学计划 ID 不正确')
    }

    if (typeof record.name !== 'string' || record.name.trim() === '') {
      throw new Error('教学计划名称不能为空')
    }

    if (typeof record.academicYear !== 'string' || !YEAR_PATTERN.test(record.academicYear.trim())) {
      throw new Error('学年格式应为 YYYY-YYYY')
    }

    if (!isSemester(record.semester) || !isGrade(record.grade)) {
      throw new Error('学期或年级不正确')
    }

    const startDate = parseOptionalDate(record.startDate, '开始日期')
    const endDate = parseOptionalDate(record.endDate, '结束日期')
    if (startDate && endDate && startDate > endDate) {
      throw new Error('开始日期不能晚于结束日期')
    }

    if (typeof record.createdAt !== 'string' || typeof record.updatedAt !== 'string') {
      throw new Error('教学计划时间字段不正确')
    }

    if (!Array.isArray(record.weeks) || record.weeks.length === 0) {
      throw new Error('教学计划必须包含至少一个周次')
    }

    if (record.weeks.length > MAX_PLAN_WEEKS) {
      throw new Error(`周次不能超过 ${MAX_PLAN_WEEKS} 周`)
    }

    const weeks = record.weeks.map((item) => parseWeek(item)).sort((a, b) => a.weekNumber - b.weekNumber)
    const ids = new Set<string>()
    for (let index = 0; index < weeks.length; index += 1) {
      const week = weeks[index]
      if (ids.has(week.id)) {
        throw new Error('同一计划中周次 ID 不能重复')
      }
      ids.add(week.id)
      if (week.weekNumber !== index + 1) {
        throw new Error('周次必须从 1 连续编号')
      }
    }

    const totalWeeks = record.totalWeeks
    if (typeof totalWeeks !== 'number' || !Number.isInteger(totalWeeks) || totalWeeks !== weeks.length) {
      throw new Error('总周数必须与周安排条数一致')
    }

    const plan: TeachingPlan = {
      id: record.id,
      name: record.name.trim(),
      academicYear: record.academicYear.trim(),
      semester: record.semester,
      grade: record.grade,
      startDate,
      endDate,
      totalWeeks,
      notes: typeof record.notes === 'string' ? record.notes.trim() : '',
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      weeks
    }

    return plan
  })

  const planIds = new Set<string>()
  for (const plan of plans) {
    if (planIds.has(plan.id)) {
      throw new Error('教学计划 ID 不能重复')
    }
    planIds.add(plan.id)
  }

  return plans.sort(
    (a, b) =>
      b.academicYear.localeCompare(a.academicYear) ||
      a.semester.localeCompare(b.semester, 'zh-CN') ||
      a.grade.localeCompare(b.grade, 'zh-CN') ||
      a.name.localeCompare(b.name, 'zh-CN')
  )
}

export function plansMatchingClassContext(
  plans: ReadonlyArray<TeachingPlan>,
  context: { grade: Grade; academicYear: string; semester: Semester }
): TeachingPlan[] {
  return plans.filter(
    (plan) =>
      plan.grade === context.grade &&
      plan.academicYear === context.academicYear &&
      plan.semester === context.semester
  )
}
