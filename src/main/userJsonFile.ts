import { join } from 'node:path'
import { loadJsonItemsFile, writeJsonItemsAtomic } from '../shared/persistence/jsonFile'
import { getUserDataRoot } from './userDataPaths'
import type { BUSINESS_JSON_FILES } from '../shared/persistence/businessFiles'
type BusinessFileName = typeof BUSINESS_JSON_FILES[number]

export function userJsonPath(fileName: BusinessFileName): string {
  return join(getUserDataRoot(), fileName)
}

export async function loadUserJsonItems<T>(
  fileName: BusinessFileName,
  parse: (input: unknown) => T[],
  ifMissing: T[] = []
): Promise<T[]> {
  return loadJsonItemsFile(userJsonPath(fileName), parse, ifMissing)
}

export async function saveUserJsonItems<T>(fileName: BusinessFileName, items: T[], expectedItems?: T[]): Promise<T[]> {
  await writeJsonItemsAtomic(join(getUserDataRoot(), fileName), items, expectedItems)
  return items
}
