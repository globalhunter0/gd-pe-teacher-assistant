import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../shared/appApi'
import { parseUserPreferences } from '../shared/userPreferences'
import { loadUserPreferences, saveUserPreferences } from './userPreferencesStore'

export function registerUserPreferencesIpc(): void {
  ipcMain.handle(IPC_CHANNELS.userPreferences.get, async () => {
    return loadUserPreferences()
  })

  ipcMain.handle(IPC_CHANNELS.userPreferences.save, async (_event, input: unknown) => {
    return saveUserPreferences(parseUserPreferences(input))
  })
}
