export type { TeachingPlan, TeachingPlanWeek } from './types'
export {
  MAX_PLAN_WEEKS,
  MIN_PLAN_WEEKS,
  copyTeachingPlan,
  createEmptyWeeks,
  createTeachingPlanId,
  createTeachingPlanWeekId,
  parseTeachingPlans,
  plansMatchingClassContext,
  renumberWeeks
} from './validate'
export {
  currentWeekNumberForDate,
  resolveUniqueCurrentWeekPrefill
} from './prefill'
export type { TeachingPlanPrefillResult, TeachingPlanPrefillStatus } from './prefill'
export {
  buildWeeklyTeachingTask,
  emptyWeeklyTeachingTask,
  resolveCurrentTeachingWeek,
  resolveTeachingPlansForClass
} from './weeklyTask'
export type { ClassPlanContext, WeeklyTeachingTask, WeeklyTeachingTaskStatus } from './weeklyTask'
