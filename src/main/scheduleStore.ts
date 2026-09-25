import { parseScheduleItems } from '../shared/schedule/validate'
import type { ScheduleItem } from '../shared/schedule/types'
import { loadUserJsonItems, saveUserJsonItems, userJsonPath } from './userJsonFile'

export function getScheduleFilePath(): string {
  return userJsonPath('schedule.json')
}

export async function loadSchedule(): Promise<ScheduleItem[]> {
  return loadUserJsonItems('schedule.json', parseScheduleItems, '课表')
}

export async function saveSchedule(input: unknown): Promise<ScheduleItem[]> {
  const items = parseScheduleItems(input)
  return saveUserJsonItems('schedule.json', items)
}
