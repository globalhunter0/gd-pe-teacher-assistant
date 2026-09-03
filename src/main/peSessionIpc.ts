import { ipcMain } from 'electron'
import { loadClasses } from './classStore'
import { loadPeSessions, savePeSessions } from './peSessionStore'

export function registerPeSessionIpc(): void {
  ipcMain.handle('peSessions:get', async () => {
    return loadPeSessions()
  })

  ipcMain.handle('peSessions:save', async (_event, items: unknown) => {
    const classes = await loadClasses()
    const knownClassIds = new Set(classes.map((item) => item.id))
    return savePeSessions(items, knownClassIds)
  })
}
