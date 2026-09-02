import { ipcMain } from 'electron'
import { getClassDeleteBlockers, parseClassRecords } from '../shared/class/validate'
import { loadClasses, saveClasses } from './classStore'
import { loadStudents } from './studentStore'

export function registerClassIpc(): void {
  ipcMain.handle('classes:get', async () => {
    return loadClasses()
  })

  ipcMain.handle('classes:save', async (_event, items: unknown) => {
    const next = parseClassRecords(items)
    const current = await loadClasses()
    const nextIds = new Set(next.map((item) => item.id))
    const students = await loadStudents()

    for (const item of current) {
      if (nextIds.has(item.id)) {
        continue
      }

      const blockers = getClassDeleteBlockers(item.id, students)
      if (blockers.length > 0) {
        throw new Error(blockers.join('；'))
      }
    }

    return saveClasses(next)
  })
}
