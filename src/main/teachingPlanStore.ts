import { parseTeachingPlans } from '../shared/teachingPlan/validate'
import type { TeachingPlan } from '../shared/teachingPlan/types'
import { loadUserJsonItems, saveUserJsonItems, userJsonPath } from './userJsonFile'

export function getTeachingPlanFilePath(): string {
  return userJsonPath('teaching-plans.json')
}

export async function loadTeachingPlans(): Promise<TeachingPlan[]> {
  return loadUserJsonItems('teaching-plans.json', parseTeachingPlans)
}

export async function saveTeachingPlans(input: unknown): Promise<TeachingPlan[]> {
  const items = parseTeachingPlans(input)
  return saveUserJsonItems('teaching-plans.json', items)
}
