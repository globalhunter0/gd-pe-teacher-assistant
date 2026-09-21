import type { ClassRecord } from '../class'
import { isScheduleSpecialEventText } from './specialEvent'
import type { ScheduleItem, Weekday } from './types'
import { workbenchListedClass, workbenchUsesTrainingTeam } from './workbench'

export type ScheduleClassroomBlockReason =
  | 'not-today'
  | 'empty'
  | 'special-event'
  | 'not-pe-class'
  | 'training-only'
  | 'unbound'

export type ScheduleClassroomEligibility =
  | { eligible: false; reason: ScheduleClassroomBlockReason }
  | { eligible: true }

export function resolveScheduleClassroomEligibility(
  lesson: ScheduleItem | undefined,
  options: {
    cellWeekday: Weekday
    todayWeekday: Weekday | null
    classes: ReadonlyArray<Pick<ClassRecord, 'id' | 'status'>>
  }
): ScheduleClassroomEligibility {
  if (!lesson) {
    return { eligible: false, reason: 'empty' }
  }

  if (options.todayWeekday === null || options.cellWeekday !== options.todayWeekday) {
    return { eligible: false, reason: 'not-today' }
  }

  if (isScheduleSpecialEventText(lesson.team)) {
    return { eligible: false, reason: 'special-event' }
  }

  if (lesson.courseType !== 'regular' && lesson.courseType !== 'big') {
    return { eligible: false, reason: 'not-pe-class' }
  }

  if (workbenchUsesTrainingTeam(lesson) || (Boolean(lesson.trainingTeamId) && !lesson.classId)) {
    return { eligible: false, reason: 'training-only' }
  }

  if (!workbenchListedClass(lesson, options.classes)) {
    return { eligible: false, reason: 'unbound' }
  }

  return { eligible: true }
}

export function shouldShowScheduleUnboundHint(
  lesson: ScheduleItem | undefined,
  eligibility: ScheduleClassroomEligibility
): boolean {
  return Boolean(lesson) && !eligibility.eligible && eligibility.reason === 'unbound' && !lesson?.classId
}
