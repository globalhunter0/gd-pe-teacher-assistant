import { parsePeSessions } from '../shared/peSession/validate'
import type { PEClassSession } from '../shared/peSession/types'
import { loadUserJsonItems, saveUserJsonItems, userJsonPath } from './userJsonFile'

export function getPeSessionFilePath(): string {
  return userJsonPath('pe-sessions.json')
}

export async function loadPeSessions(): Promise<PEClassSession[]> {
  return loadUserJsonItems('pe-sessions.json', parsePeSessions, '课堂记录')
}

export async function savePeSessions(
  input: unknown,
  knownClassIds: ReadonlySet<string>
): Promise<PEClassSession[]> {
  const items = parsePeSessions(input, { knownClassIds })
  return saveUserJsonItems('pe-sessions.json', items)
}
