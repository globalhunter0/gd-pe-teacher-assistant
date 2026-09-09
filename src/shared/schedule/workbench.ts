import type { ScheduleItem } from './types'
import { isListedClass, type ClassRecord } from '../class'

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
