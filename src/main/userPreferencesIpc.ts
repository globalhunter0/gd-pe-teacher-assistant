import { ipcMain } from 'electron'
import { parseUserPreferences } from '../shared/userPreferences'
import { loadUserPreferences, saveUserPreferences } from './userPreferencesStore'

export function registerUserPreferencesIpc(): void {
  ipcMain.handle('userPreferences:get', async () => {
    return loadUserPreferences()
  })

  ipcMain.handle('userPreferences:save', async (_event, input: unknown) => {
    return saveUserPreferences(parseUserPreferences(input))
  })
}
