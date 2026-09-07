import { parseClassRecords } from '../shared/class/validate'
import type { ClassRecord } from '../shared/class/types'
import { loadUserJsonItems, saveUserJsonItems, userJsonPath } from './userJsonFile'

export function getClassFilePath(): string {
  return userJsonPath('classes.json')
}

export async function loadClasses(): Promise<ClassRecord[]> {
  return loadUserJsonItems('classes.json', parseClassRecords, '班级')
}

export async function saveClasses(input: unknown): Promise<ClassRecord[]> {
  const items = parseClassRecords(input)
  return saveUserJsonItems('classes.json', items)
}
