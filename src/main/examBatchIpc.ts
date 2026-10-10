import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../shared/appApi'
import { clearExamBatchSession, exportExamWorkbook, loadExamSheet, pickExamExcel, saveExamWorkbook } from './examBatchImport'
import type { ExamExportPayload, ExamWorkbookSavePayload } from '../shared/examBatch/types'

export function registerExamBatchIpc(): void {
  ipcMain.handle(IPC_CHANNELS.examBatch.pick, async () => pickExamExcel())
  ipcMain.handle(IPC_CHANNELS.examBatch.loadSheet, async (_event, sessionId: unknown, sheetName: unknown) => {
    return loadExamSheet(sessionId, sheetName)
  })
  ipcMain.handle(IPC_CHANNELS.examBatch.cancel, async () => {
    clearExamBatchSession()
  })
  ipcMain.handle(IPC_CHANNELS.examBatch.export, async (_event, payload: ExamExportPayload) => {
    return exportExamWorkbook(payload)
  })
  ipcMain.handle(IPC_CHANNELS.examBatch.saveWorkbook, async (_event, payload: ExamWorkbookSavePayload) => {
    return saveExamWorkbook(payload)
  })
}
