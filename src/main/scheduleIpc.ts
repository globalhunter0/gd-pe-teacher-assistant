import { ipcMain } from 'electron'
import {
  analyzeScheduleExcel,
  clearScheduleImportSession,
  commitScheduleExcel,
  pickScheduleExcel,
  previewScheduleExcel
} from './scheduleImport'
import { loadSchedule, saveSchedule } from './scheduleStore'
import {
  assertScheduleTrainingTeamSelections,
  parseScheduleItems
} from '../shared/schedule/validate'
import { loadTrainingTeams } from './trainingStore'

export function registerScheduleIpc(): void {
  ipcMain.handle('schedule:get', async () => {
    return loadSchedule()
  })

  ipcMain.handle('schedule:save', async (_event, items: unknown) => {
    const submitted = parseScheduleItems(items)
    const [current, trainingTeams] = await Promise.all([
      loadSchedule(),
      loadTrainingTeams()
    ])
    assertScheduleTrainingTeamSelections(current, submitted, trainingTeams)
    return saveSchedule(submitted)
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
