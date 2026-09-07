import { ipcMain } from 'electron'
import { clearExamBatchSession, exportExamWorkbook, loadExamSheet, pickExamExcel, saveExamWorkbook } from './examBatchImport'
import type { ExamExportPayload, ExamWorkbookSavePayload } from '../shared/examBatch/types'

export function registerExamBatchIpc(): void {
  ipcMain.handle('examBatch:pick', async () => pickExamExcel())
  ipcMain.handle('examBatch:loadSheet', async (_event, sessionId: unknown, sheetName: unknown) => {
    return loadExamSheet(sessionId, sheetName)
  })
  ipcMain.handle('examBatch:cancel', async () => {
    clearExamBatchSession()
  })
  ipcMain.handle('examBatch:export', async (_event, payload: ExamExportPayload) => {
    return exportExamWorkbook(payload)
  })
  ipcMain.handle('examBatch:saveWorkbook', async (_event, payload: ExamWorkbookSavePayload) => {
    return saveExamWorkbook(payload)
  })
}
