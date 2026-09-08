import { ipcMain } from 'electron'
import { getTrainingTeamDeleteBlockers } from '../shared/trainingTeam/validate'
import { dropMissingScheduleTrainingTeamLinks } from '../shared/schedule/validate'
import { loadSchedule, saveSchedule } from './scheduleStore'
import { loadStudents } from './studentStore'
import {
  getTrainingItemFilePath,
  getTrainingMemberFilePath,
  getTrainingResultFilePath,
  getTrainingSessionFilePath,
  getTrainingTeamFilePath,
  loadTrainingItems,
  loadTrainingMembers,
  loadTrainingResults,
  loadTrainingSessions,
  loadTrainingTeams,
  saveTrainingItems,
  saveTrainingMembers,
  saveTrainingResults,
  saveTrainingSessions,
  saveTrainingTeams
} from './trainingStore'

export function registerTrainingIpc(): void {
  ipcMain.handle('trainingTeams:get', async () => loadTrainingTeams())
  ipcMain.handle('trainingTeams:save', async (_event, items: unknown) => {
    const next = await saveTrainingTeams(items)
    const schedule = await loadSchedule()
    const knownTeamIds = new Set(next.map((item) => item.id))
    const stripped = dropMissingScheduleTrainingTeamLinks(schedule, knownTeamIds)
    if (JSON.stringify(stripped) !== JSON.stringify(schedule)) {
      await saveSchedule(stripped)
    }
    return next
  })
  ipcMain.handle('trainingTeams:deleteCheck', async (_event, teamId: unknown) => {
    if (typeof teamId !== 'string') {
      throw new Error('训练队编号不正确')
    }
    const [teams, members, sessions, results] = await Promise.all([
      loadTrainingTeams(),
      loadTrainingMembers(),
      loadTrainingSessions(),
      loadTrainingResults()
    ])
    return getTrainingTeamDeleteBlockers(teamId, teams, members, sessions, results)
  })

  ipcMain.handle('trainingMembers:get', async () => loadTrainingMembers())
  ipcMain.handle('trainingMembers:save', async (_event, items: unknown) => {
    const students = await loadStudents()
    return saveTrainingMembers(items, new Set(students.map((item) => item.id)))
  })

  ipcMain.handle('trainingSessions:get', async () => loadTrainingSessions())
  ipcMain.handle('trainingSessions:save', async (_event, items: unknown) => saveTrainingSessions(items))

  ipcMain.handle('trainingItems:get', async () => loadTrainingItems())
  ipcMain.handle('trainingItems:save', async (_event, items: unknown) => saveTrainingItems(items))

  ipcMain.handle('trainingResults:get', async () => loadTrainingResults())
  ipcMain.handle('trainingResults:save', async (_event, items: unknown) => {
    const students = await loadStudents()
    return saveTrainingResults(items, new Set(students.map((item) => item.id)))
  })
}

export function trainingDataPaths(): string[] {
  return [
    getTrainingTeamFilePath(),
    getTrainingMemberFilePath(),
    getTrainingSessionFilePath(),
    getTrainingItemFilePath(),
    getTrainingResultFilePath()
  ]
}
