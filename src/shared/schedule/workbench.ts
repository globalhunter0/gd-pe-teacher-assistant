import type { ScheduleItem } from './types'
import { isListedClass, type ClassRecord } from '../class'

export type WorkbenchClockStatus = 'done' | 'live' | 'next' | 'later'

export const WORKBENCH_CLOCK_LABELS: Record<WorkbenchClockStatus, string> = {
  done: '已结束',
  live: '进行中',
  next: '下一节',
  later: '未开始'
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/** 工作台只使用行政班。legacy trainingTeamId 可存在于课表文件，但工作台不得依赖。 */
export function workbenchBoundClassId(item: Pick<ScheduleItem, 'classId' | 'trainingTeamId'>): string | undefined {
  return item.classId
}

export function workbenchUsesTrainingTeam(_item: Pick<ScheduleItem, 'classId' | 'trainingTeamId'>): boolean {
  return false
}

export function workbenchListedClass<T extends Pick<ClassRecord, 'id' | 'status'>>(
  item: Pick<ScheduleItem, 'classId' | 'trainingTeamId'>,
  classes: ReadonlyArray<T>
): T | undefined {
  const classId = workbenchBoundClassId(item)
  if (!classId) {
    return undefined
  }
  const match = classes.find((entry) => entry.id === classId)
  return match && isListedClass(match) ? match : undefined
}

/** 只描述时钟位置，不得当作“是否已填写课堂记录”。 */
export function workbenchClockStatus(
  lesson: Pick<ScheduleItem, 'id' | 'startTime' | 'endTime'>,
  now: Date,
  currentId: string | undefined,
  nextId: string | undefined
): WorkbenchClockStatus {
  if (currentId === lesson.id) {
    return 'live'
  }
  if (nextId === lesson.id) {
    return 'next'
  }
  const minutes = now.getHours() * 60 + now.getMinutes()
  if (toMinutes(lesson.endTime) < minutes) {
    return 'done'
  }
  if (toMinutes(lesson.startTime) > minutes) {
    return 'later'
  }
  return 'done'
}
