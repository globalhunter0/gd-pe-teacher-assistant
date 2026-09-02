import { ipcMain } from 'electron'
import { loadClasses, saveClasses } from './classStore'

export function registerClassIpc(): void {
  ipcMain.handle('classes:get', async () => {
    return loadClasses()
  })

  ipcMain.handle('classes:save', async (_event, items: unknown) => {
    return saveClasses(items)
  })
}
