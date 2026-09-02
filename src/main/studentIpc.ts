import { ipcMain } from 'electron'
import { loadClasses } from './classStore'
import { loadStudents, saveStudents } from './studentStore'

export function registerStudentIpc(): void {
  ipcMain.handle('students:get', async () => {
    return loadStudents()
  })

  ipcMain.handle('students:save', async (_event, items: unknown) => {
    const classes = await loadClasses()
    const knownClassIds = new Set(classes.map((item) => item.id))
    return saveStudents(items, knownClassIds)
  })
}
