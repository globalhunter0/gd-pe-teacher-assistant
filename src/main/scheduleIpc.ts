import { IPC_CHANNELS } from '../shared/appApi'
import { handleCollectionSave } from './collectionIpc'
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
  ipcMain.handle(IPC_CHANNELS.schedule.get, async () => {
    return loadSchedule()
  })

  handleCollectionSave(IPC_CHANNELS.schedule.save, loadSchedule, async (_event, items: unknown) => {
    const submitted = parseScheduleItems(items)
    const [current, trainingTeams] = await Promise.all([
      loadSchedule(),
      loadTrainingTeams()
    ])
    assertScheduleTrainingTeamSelections(current, submitted, trainingTeams)
    return saveSchedule(submitted)
  })

  ipcMain.handle(IPC_CHANNELS.schedule.importPick, async () => pickScheduleExcel())
  ipcMain.handle(IPC_CHANNELS.schedule.importAnalyze, async (_event, sessionId: unknown) => analyzeScheduleExcel(sessionId))
  ipcMain.handle(
    IPC_CHANNELS.schedule.importPreview,
    async (_event, sessionId: unknown, mapping: unknown, resolutions: unknown) =>
      previewScheduleExcel(sessionId, mapping, resolutions)
  )
  ipcMain.handle(
    IPC_CHANNELS.schedule.importCommit,
    async (_event, sessionId: unknown, mapping: unknown, resolutions: unknown) =>
      commitScheduleExcel(sessionId, mapping, resolutions)
  )
  ipcMain.handle(IPC_CHANNELS.schedule.importCancel, async () => {
    clearScheduleImportSession()
  })
}
