import { parsePeTestSessions } from '../shared/peTest/validate'
import type { PETestSession } from '../shared/peTest/types'
import { loadUserJsonItems, saveUserJsonItems, userJsonPath } from './userJsonFile'

export function getPeTestFilePath(): string {
  return userJsonPath('pe-tests.json')
}

export async function loadPeTests(): Promise<PETestSession[]> {
  return loadUserJsonItems('pe-tests.json', parsePeTestSessions)
}

export async function savePeTests(
  input: unknown,
  knownClassIds: ReadonlySet<string>,
  knownItemIds: ReadonlySet<string>
): Promise<PETestSession[]> {
  const items = parsePeTestSessions(input, { knownClassIds, knownItemIds })
  return saveUserJsonItems('pe-tests.json', items)
}
