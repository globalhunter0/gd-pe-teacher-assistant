import { ipcMain } from 'electron'
import { getStudentDeleteBlockers, parseStudentRecords } from '../shared/student/validate'
import { loadClasses } from './classStore'
import {
  clearImportSession,
  commitStudentExcel,
  inspectSheetHeaders,
  pickStudentExcel,
  previewStudentExcel
} from './studentImport'
import { loadPeSessions } from './peSessionStore'
import { loadStudents, saveStudents } from './studentStore'

export function registerStudentIpc(): void {
  ipcMain.handle('students:get', async () => {
    return loadStudents()
  })

  ipcMain.handle('students:save', async (_event, items: unknown) => {
    const classes = await loadClasses()
    const knownClassIds = new Set(classes.map((item) => item.id))
    const next = parseStudentRecords(items, { knownClassIds })
    const current = await loadStudents()
    const nextIds = new Set(next.map((item) => item.id))
    const sessions = await loadPeSessions()

    for (const item of current) {
      if (nextIds.has(item.id)) {
        continue
      }

      const blockers = getStudentDeleteBlockers(item.id, sessions)
      if (blockers.length > 0) {
        throw new Error(blockers.join('；'))
      }
    }

    return saveStudents(next, knownClassIds)
  })

  ipcMain.handle('students:importPick', async () => {
    return pickStudentExcel()
  })

  ipcMain.handle('students:importHeaders', async (_event, sessionId: unknown, sheetName: unknown) => {
    return inspectSheetHeaders(sessionId, sheetName)
  })

  ipcMain.handle(
    'students:importPreview',
    async (_event, sessionId: unknown, sheetName: unknown, mapping: unknown, classId: unknown) => {
      return previewStudentExcel(sessionId, sheetName, mapping, classId)
    }
  )

  ipcMain.handle(
    'students:importCommit',
    async (_event, sessionId: unknown, sheetName: unknown, mapping: unknown, classId: unknown) => {
      return commitStudentExcel(sessionId, sheetName, mapping, classId)
    }
  )

  ipcMain.handle('students:importCancel', async () => {
    clearImportSession()
  })
}
