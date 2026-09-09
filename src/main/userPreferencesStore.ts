import { defaultUserPreferences, parseUserPreferences, USER_PREFERENCES_FILE, type UserPreferences } from '../shared/userPreferences'
import { loadJsonDocumentFile, writeJsonDocumentAtomic } from '../shared/persistence/jsonFile'
import { userJsonPath } from './userJsonFile'

export function getUserPreferencesFilePath(): string {
  return userJsonPath(USER_PREFERENCES_FILE)
}

export async function loadUserPreferences(): Promise<UserPreferences> {
  return loadJsonDocumentFile(getUserPreferencesFilePath(), parseUserPreferences, defaultUserPreferences())
}

export async function saveUserPreferences(input: unknown): Promise<UserPreferences> {
  const next = parseUserPreferences(input)
  await writeJsonDocumentAtomic(getUserPreferencesFilePath(), next)
  return next
}
