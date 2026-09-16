import { ipcMain } from 'electron'
import {
  applyTrainingTeamSafeDelete,
  checkTrainingTeamSafeDelete,
  hasTrainingTeamIdentityRefs,
  parseTrainingTeams
} from '../shared/trainingTeam/validate'
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
    const next = parseTrainingTeams(items)
    const current = await loadTrainingTeams()
    const nextIds = new Set(next.map((item) => item.id))
    const members = await loadTrainingMembers()
    const sessions = await loadTrainingSessions()
    const results = await loadTrainingResults()
    for (const team of current) {
      if (nextIds.has(team.id)) {
        continue
      }
      if (hasTrainingTeamIdentityRefs(team.id, next, members, sessions, results)) {
        throw new Error('该训练队仍有历史引用，不能从存储中移除。请使用删除队伍（保留历史）。')
      }
    }
    const saved = await saveTrainingTeams(next)
    const schedule = await loadSchedule()
    const knownTeamIds = new Set(saved.map((item) => item.id))
    const stripped = dropMissingScheduleTrainingTeamLinks(schedule, knownTeamIds)
    if (JSON.stringify(stripped) !== JSON.stringify(schedule)) {
      await saveSchedule(stripped)
    }
    return saved
  })
  ipcMain.handle('trainingTeams:deleteCheck', async (_event, teamId: unknown) => {
    if (typeof teamId !== 'string') {
      throw new Error('训练队编号不正确')
    }
    const [teams, members, sessions, results, schedule] = await Promise.all([
      loadTrainingTeams(),
      loadTrainingMembers(),
      loadTrainingSessions(),
      loadTrainingResults(),
      loadSchedule()
    ])
    return checkTrainingTeamSafeDelete(teams, members, teamId, sessions, results, schedule)
  })

  ipcMain.handle('trainingTeams:safeDelete', async (_event, teamId: unknown) => {
    if (typeof teamId !== 'string') {
      throw new Error('训练队编号不正确')
    }
    const [teams, members, sessions, results, schedule] = await Promise.all([
      loadTrainingTeams(),
      loadTrainingMembers(),
      loadTrainingSessions(),
      loadTrainingResults(),
      loadSchedule()
    ])
    const next = applyTrainingTeamSafeDelete(
      teams,
      members,
      teamId,
      new Date().toISOString(),
      sessions,
      results,
      schedule
    )

    // 队员先退出，再更新队伍；历史 session/result 文件从不参与删除写入。
    const savedMembers =
      JSON.stringify(next.members) === JSON.stringify(members)
        ? members
        : await saveTrainingMembers(next.members, new Set((await loadStudents()).map((item) => item.id)))
    const savedTeams =
      JSON.stringify(next.teams) === JSON.stringify(teams)
        ? teams
        : await saveTrainingTeams(next.teams)

    return { ...next, teams: savedTeams, members: savedMembers }
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
