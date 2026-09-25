import { join } from 'node:path'
import { loadJsonItemsFile, writeJsonItemsAtomic } from '../shared/persistence/jsonFile'
import { getUserDataRoot } from './userDataPaths'

export function userJsonPath(fileName: string): string {
  return join(getUserDataRoot(), fileName)
}

export async function loadUserJsonItems<T>(
  fileName: string,
  parse: (input: unknown) => T[],
  _label: string,
  ifMissing: T[] = []
): Promise<T[]> {
  return loadJsonItemsFile(userJsonPath(fileName), parse, ifMissing)
}

export async function saveUserJsonItems<T>(fileName: string, items: T[], expectedItems?: T[]): Promise<T[]> {
  await writeJsonItemsAtomic(join(getUserDataRoot(), fileName), items, expectedItems)
  return items
}
