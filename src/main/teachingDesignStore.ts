import { parseTeachingDesigns } from '../shared/teachingDesign/validate'
import type { TeachingDesign } from '../shared/teachingDesign/types'
import { loadUserJsonItems, saveUserJsonItems, userJsonPath } from './userJsonFile'

export function getTeachingDesignFilePath(): string {
  return userJsonPath('teaching-designs.json')
}

export async function loadTeachingDesigns(): Promise<TeachingDesign[]> {
  return loadUserJsonItems('teaching-designs.json', parseTeachingDesigns)
}

export async function saveTeachingDesigns(input: unknown): Promise<TeachingDesign[]> {
  const items = parseTeachingDesigns(input)
  return saveUserJsonItems('teaching-designs.json', items)
}
