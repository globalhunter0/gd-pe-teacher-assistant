import { ipcMain } from 'electron'
import { loadClasses } from './classStore'
import {
  clearImportSession,
  commitStudentExcel,
  inspectSheetHeaders,
  pickStudentExcel,
  previewStudentExcel
} from './studentImport'
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
