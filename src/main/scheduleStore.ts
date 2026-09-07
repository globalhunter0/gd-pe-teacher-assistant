import { DEFAULT_SCHEDULE } from '../shared/schedule/defaultSchedule'
import { parseScheduleItems } from '../shared/schedule/validate'
import type { ScheduleItem } from '../shared/schedule/types'
import { loadUserJsonItems, saveUserJsonItems, userJsonPath } from './userJsonFile'

export function getScheduleFilePath(): string {
  return userJsonPath('schedule.json')
}

function cloneDefault(): ScheduleItem[] {
  return DEFAULT_SCHEDULE.map((item) => ({ ...item }))
}

export async function loadSchedule(): Promise<ScheduleItem[]> {
  return loadUserJsonItems('schedule.json', parseScheduleItems, '课表', cloneDefault())
}

export async function saveSchedule(input: unknown): Promise<ScheduleItem[]> {
  const items = parseScheduleItems(input)
  return saveUserJsonItems('schedule.json', items)
}
