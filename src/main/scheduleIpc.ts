import { ipcMain } from 'electron'
import {
  analyzeScheduleExcel,
  clearScheduleImportSession,
  commitScheduleExcel,
  pickScheduleExcel,
  previewScheduleExcel
} from './scheduleImport'
import { loadSchedule, saveSchedule } from './scheduleStore'

export function registerScheduleIpc(): void {
  ipcMain.handle('schedule:get', async () => {
    return loadSchedule()
  })

  ipcMain.handle('schedule:save', async (_event, items: unknown) => {
    return saveSchedule(items)
  })

  ipcMain.handle('schedule:importPick', async () => pickScheduleExcel())
  ipcMain.handle('schedule:importAnalyze', async (_event, sessionId: unknown) => analyzeScheduleExcel(sessionId))
  ipcMain.handle(
    'schedule:importPreview',
    async (_event, sessionId: unknown, mapping: unknown, resolutions: unknown) =>
      previewScheduleExcel(sessionId, mapping, resolutions)
  )
  ipcMain.handle(
    'schedule:importCommit',
    async (_event, sessionId: unknown, mapping: unknown, resolutions: unknown) =>
      commitScheduleExcel(sessionId, mapping, resolutions)
  )
  ipcMain.handle('schedule:importCancel', async () => {
    clearScheduleImportSession()
  })
}
