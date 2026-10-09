import { mergeBuiltinTrainingItems } from '../shared/trainingTeam/builtinItems'
import {
  parseTrainingItems,
  parseTrainingMembers,
  parseTrainingPlans,
  parseTrainingResults,
  parseTrainingSessions,
  parseTrainingTeams
} from '../shared/trainingTeam/validate'
import type {
  TrainingItem,
  TrainingPlan,
  TrainingResult,
  TrainingSession,
  TrainingTeam,
  TrainingTeamMember
} from '../shared/trainingTeam/types'
import { loadUserJsonItems, saveUserJsonItems, userJsonPath } from './userJsonFile'

let trainingItemsLoad: Promise<TrainingItem[]> | undefined

export function getTrainingTeamFilePath(): string {
  return userJsonPath('training-teams.json')
}

export function getTrainingMemberFilePath(): string {
  return userJsonPath('training-members.json')
}

export function getTrainingSessionFilePath(): string {
  return userJsonPath('training-sessions.json')
}

export function getTrainingPlanFilePath(): string {
  return userJsonPath('training-plans.json')
}

export function getTrainingItemFilePath(): string {
  return userJsonPath('training-items.json')
}

export function getTrainingResultFilePath(): string {
  return userJsonPath('training-results.json')
}

export async function loadTrainingTeams(): Promise<TrainingTeam[]> {
  return loadUserJsonItems('training-teams.json', parseTrainingTeams, '训练队')
}

export async function saveTrainingTeams(input: unknown): Promise<TrainingTeam[]> {
  const items = parseTrainingTeams(input)
  return saveUserJsonItems('training-teams.json', items)
}

export async function loadTrainingMembers(): Promise<TrainingTeamMember[]> {
  const teams = await loadTrainingTeams()
  return loadUserJsonItems('training-members.json', (input) => parseTrainingMembers(input, { knownTeamIds: new Set(teams.map((item) => item.id)) }), '训练队员')
}

export async function saveTrainingMembers(input: unknown, knownStudentIds: ReadonlySet<string>): Promise<TrainingTeamMember[]> {
  const teams = await loadTrainingTeams()
  const items = parseTrainingMembers(input, {
    knownTeamIds: new Set(teams.map((item) => item.id)),
    knownStudentIds
  })
  return saveUserJsonItems('training-members.json', items)
}

export async function loadTrainingPlans(): Promise<TrainingPlan[]> {
  const teams = await loadTrainingTeams()
  return loadUserJsonItems(
    'training-plans.json',
    (input) =>
      parseTrainingPlans(input, {
        knownTeamIds: new Set(teams.map((item) => item.id))
      }),
    '训练计划'
  )
}

export async function saveTrainingPlans(input: unknown): Promise<TrainingPlan[]> {
  const teams = await loadTrainingTeams()
  const plans = parseTrainingPlans(input, {
    knownTeamIds: new Set(teams.map((item) => item.id))
  })
  return saveUserJsonItems('training-plans.json', plans)
}

export async function loadTrainingSessions(): Promise<TrainingSession[]> {
  const [teams, plans] = await Promise.all([
    loadTrainingTeams(),
    loadTrainingPlans()
  ])
  return loadUserJsonItems(
    'training-sessions.json',
    (input) =>
      parseTrainingSessions(input, {
        knownTeamIds: new Set(teams.map((item) => item.id)),
        knownPlanIds: new Set(plans.map((item) => item.id))
      }),
    '训练记录'
  )
}

export async function saveTrainingSessions(input: unknown): Promise<TrainingSession[]> {
  const [teams, plans] = await Promise.all([
    loadTrainingTeams(),
    loadTrainingPlans()
  ])
  const items = parseTrainingSessions(input, {
    knownTeamIds: new Set(teams.map((item) => item.id)),
    knownPlanIds: new Set(plans.map((item) => item.id))
  })
  return saveUserJsonItems('training-sessions.json', items)
}

async function loadTrainingItemsOnce(): Promise<TrainingItem[]> {
  const loaded = await loadUserJsonItems('training-items.json', parseTrainingItems, '训练项目')
  const merged = mergeBuiltinTrainingItems(loaded)
  if (merged.length !== loaded.length) {
    await saveUserJsonItems('training-items.json', merged)
  }
  return merged
}

/** Startup and IPC may request items concurrently; coalesce to one merge/save pass. */
export async function loadTrainingItems(): Promise<TrainingItem[]> {
  if (!trainingItemsLoad) {
    trainingItemsLoad = loadTrainingItemsOnce().finally(() => {
      trainingItemsLoad = undefined
    })
  }
  return trainingItemsLoad
}

export async function saveTrainingItems(input: unknown): Promise<TrainingItem[]> {
  const items = mergeBuiltinTrainingItems(parseTrainingItems(input))
  return saveUserJsonItems('training-items.json', items)
}

export async function loadTrainingResults(): Promise<TrainingResult[]> {
  const [teams, items, sessions] = await Promise.all([loadTrainingTeams(), loadTrainingItems(), loadTrainingSessions()])
  return loadUserJsonItems(
    'training-results.json',
    (input) =>
      parseTrainingResults(input, {
        knownTeamIds: new Set(teams.map((item) => item.id)),
        knownItemIds: new Set(items.map((item) => item.id)),
        knownSessionIds: new Set(sessions.map((item) => item.id))
      }),
    '训练成绩'
  )
}

export async function saveTrainingResults(input: unknown, knownStudentIds: ReadonlySet<string>): Promise<TrainingResult[]> {
  const [teams, items, sessions] = await Promise.all([loadTrainingTeams(), loadTrainingItems(), loadTrainingSessions()])
  const members = await loadTrainingMembers()
  const athleteIds = new Set([...knownStudentIds, ...members.filter((item) => item.source === 'manual').map((item) => item.studentId)])
  const parsed = parseTrainingResults(input, {
    knownTeamIds: new Set(teams.map((item) => item.id)),
    knownItemIds: new Set(items.map((item) => item.id)),
    knownSessionIds: new Set(sessions.map((item) => item.id)),
    knownStudentIds: athleteIds
  })
  return saveUserJsonItems('training-results.json', parsed)
}
