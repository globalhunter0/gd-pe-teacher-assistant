import { ipcMain } from 'electron'
import { getClassDeleteBlockers, parseClassRecords } from '../shared/class/validate'
import { loadClasses, saveClasses } from './classStore'
import { loadPeSessions } from './peSessionStore'
import { loadPeTests } from './peTestStore'
import { loadSchedule, saveSchedule } from './scheduleStore'
import { loadStudents } from './studentStore'
import { dropMissingScheduleClassLinks } from '../shared/schedule/validate'

export function registerClassIpc(): void {
  ipcMain.handle('classes:get', async () => {
    return loadClasses()
  })

  ipcMain.handle('classes:save', async (_event, items: unknown) => {
    const next = parseClassRecords(items)
    const current = await loadClasses()
    const nextIds = new Set(next.map((item) => item.id))
    const students = await loadStudents()
    const sessions = await loadPeSessions()
    const tests = await loadPeTests()

    for (const item of current) {
      if (nextIds.has(item.id)) {
        continue
      }

      const blockers = getClassDeleteBlockers(item.id, students, sessions, tests)
      if (blockers.length > 0) {
        throw new Error(blockers.join('；'))
      }
    }

    const saved = await saveClasses(next)
    const schedule = await loadSchedule()
    const knownClassIds = new Set(saved.map((item) => item.id))
    const stripped = dropMissingScheduleClassLinks(schedule, knownClassIds)
    const scheduleChanged = JSON.stringify(stripped) !== JSON.stringify(schedule)
    if (scheduleChanged) {
      await saveSchedule(stripped)
    }
    return saved
  })
}
