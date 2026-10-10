import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { IPC_CHANNELS, type IpcChannel } from '../shared/appApi'
import { runStagedJsonWrites } from '../shared/importTransaction/stagedWrite'
import { assertCollectionUnchanged } from '../shared/persistence/collectionConflict'
import {
  applyTrainingTeamSafeDelete,
  assertTrainingPlanChanges,
  cancelPlannedTrainingPlansForTeams,
  checkTrainingTeamSafeDelete,
  hasTrainingTeamIdentityRefs,
  parseTrainingPlans,
  parseTrainingMembers,
  parseTrainingResults,
  parseTrainingSessions,
  parseTrainingTeams,
  recordTrainingSession
} from '../shared/trainingTeam/validate'
import { loadSchedule } from './scheduleStore'
import { loadStudents } from './studentStore'
import {
  getTrainingItemFilePath,
  getTrainingMemberFilePath,
  getTrainingPlanFilePath,
  getTrainingResultFilePath,
  getTrainingSessionFilePath,
  getTrainingTeamFilePath,
  loadTrainingItems,
  loadTrainingMembers,
  loadTrainingPlans,
  loadTrainingResults,
  loadTrainingSessions,
  loadTrainingTeams,
  saveTrainingItems,
  saveTrainingMembers,
  saveTrainingPlans,
  saveTrainingResults,
  saveTrainingSessions,
  saveTrainingTeams
} from './trainingStore'

/** Keep multi-file training mutations inside the same snapshot/restore boundary.
 * Existing domain validation stays unchanged; only disk commit is coordinated. */
function handleTraining(channel: IpcChannel, handler: (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>): void {
  ipcMain.handle(channel, async (event, ...args: unknown[]) => {
    if (channel.endsWith(':get') || channel.endsWith(':deleteCheck')) return handler(event, ...args)
    let value: unknown
    const result = await runStagedJsonWrites([{ name: channel, restore: async () => {}, write: async () => { value = await handler(event, ...args) } }])
    if (!result.ok) throw result.error
    return value
  })
}

function handleTrainingSave<T>(
  channel: IpcChannel,
  load: () => Promise<T[]>,
  save: (event: IpcMainInvokeEvent, items: unknown) => Promise<T[]>
): void {
  handleTraining(channel, async (event, items: unknown, expected: unknown) => {
    assertCollectionUnchanged(await load(), expected)
    return save(event, items)
  })
}

export function registerTrainingIpc(): void {
  handleTraining(IPC_CHANNELS.trainingTeams.get, async () => loadTrainingTeams())
  handleTrainingSave(IPC_CHANNELS.trainingTeams.save, loadTrainingTeams, async (_event, items: unknown) => {
    const next = parseTrainingTeams(items)
    const current = await loadTrainingTeams()
    const nextIds = new Set(next.map((item) => item.id))
    const members = await loadTrainingMembers()
    const sessions = await loadTrainingSessions()
    const [results, schedule, plans] = await Promise.all([
      loadTrainingResults(),
      loadSchedule(),
      loadTrainingPlans()
    ])
    for (const team of current) {
      if (nextIds.has(team.id)) {
        continue
      }
      if (hasTrainingTeamIdentityRefs(team.id, next, members, sessions, results, schedule, plans)) {
        throw new Error('该训练队仍有历史引用，不能从存储中移除。请使用删除队伍（保留历史）。')
      }
    }
    return saveTrainingTeams(next)
  })
  handleTraining(IPC_CHANNELS.trainingTeams.archive, async (_event, teamId: unknown) => {
    if (typeof teamId !== 'string') {
      throw new Error('训练队编号不正确')
    }
    const [teams, plans] = await Promise.all([
      loadTrainingTeams(),
      loadTrainingPlans()
    ])
    const team = teams.find((item) => item.id === teamId)
    if (!team || team.status === 'deleted') {
      throw new Error('训练队不存在或已删除')
    }
    const now = new Date().toISOString()
    const nextPlans = cancelPlannedTrainingPlansForTeams(
      plans,
      new Set([teamId]),
      now
    )
    const nextTeams = teams.map((item) =>
      item.id === teamId ? { ...item, status: 'archived' as const, updatedAt: now } : item
    )
    const savedPlans = await saveTrainingPlans(nextPlans)
    const savedTeams = await saveTrainingTeams(nextTeams)
    return { teams: savedTeams, plans: savedPlans }
  })
  handleTraining(IPC_CHANNELS.trainingTeams.deleteCheck, async (_event, teamId: unknown) => {
    if (typeof teamId !== 'string') {
      throw new Error('训练队编号不正确')
    }
    const [teams, members, sessions, results, schedule, plans] = await Promise.all([
      loadTrainingTeams(),
      loadTrainingMembers(),
      loadTrainingSessions(),
      loadTrainingResults(),
      loadSchedule(),
      loadTrainingPlans()
    ])
    return checkTrainingTeamSafeDelete(teams, members, teamId, sessions, results, schedule, plans)
  })

  handleTraining(IPC_CHANNELS.trainingTeams.safeDelete, async (_event, teamId: unknown) => {
    if (typeof teamId !== 'string') {
      throw new Error('训练队编号不正确')
    }
    const [teams, members, sessions, results, schedule, plans] = await Promise.all([
      loadTrainingTeams(),
      loadTrainingMembers(),
      loadTrainingSessions(),
      loadTrainingResults(),
      loadSchedule(),
      loadTrainingPlans()
    ])
    const now = new Date().toISOString()
    const next = applyTrainingTeamSafeDelete(
      teams,
      members,
      teamId,
      now,
      sessions,
      results,
      schedule,
      plans
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
    const nextPlans = cancelPlannedTrainingPlansForTeams(
      plans,
      new Set(next.check.affectedTeamIds),
      now
    )
    const savedPlans =
      JSON.stringify(nextPlans) === JSON.stringify(plans)
        ? plans
        : await saveTrainingPlans(nextPlans)

    return { ...next, teams: savedTeams, members: savedMembers, plans: savedPlans }
  })

  handleTraining(IPC_CHANNELS.trainingPlans.get, async () => loadTrainingPlans())
  handleTrainingSave(IPC_CHANNELS.trainingPlans.save, loadTrainingPlans, async (_event, items: unknown) => {
    const [current, teams, sessions] = await Promise.all([
      loadTrainingPlans(),
      loadTrainingTeams(),
      loadTrainingSessions()
    ])
    const next = parseTrainingPlans(items, {
      knownTeamIds: new Set(teams.map((item) => item.id))
    })
    assertTrainingPlanChanges(current, next, teams, sessions)
    return saveTrainingPlans(next)
  })

  handleTraining(IPC_CHANNELS.trainingSessions.record, async (_event, sessionInput: unknown, resultsInput: unknown) => {
    const [plans, sessions, results, teams, students] = await Promise.all([
      loadTrainingPlans(),
      loadTrainingSessions(),
      loadTrainingResults(),
      loadTrainingTeams(),
      loadStudents()
    ])
    const [session] = parseTrainingSessions([sessionInput], {
      knownTeamIds: new Set(teams.map((item) => item.id)),
      knownPlanIds: new Set(plans.map((item) => item.id))
    })
    const next = recordTrainingSession(
      plans,
      sessions,
      results,
      session,
      parseTrainingResults(resultsInput),
      new Date().toISOString()
    )
    // Sessions first: result validation reads the staged session file.
    const savedSessions = await saveTrainingSessions(next.sessions)
    const savedPlans =
      JSON.stringify(next.plans) === JSON.stringify(plans) ? plans : await saveTrainingPlans(next.plans)
    const savedResults = await saveTrainingResults(next.results, new Set(students.map((item) => item.id)))
    return { plans: savedPlans, sessions: savedSessions, results: savedResults }
  })

  handleTraining(IPC_CHANNELS.trainingMembers.add, async (_event, input: unknown) => {
    const [members, students, teams] = await Promise.all([loadTrainingMembers(), loadStudents(), loadTrainingTeams()])
    const additions = parseTrainingMembers(input, {
      knownTeamIds: new Set(teams.filter((team) => team.status === 'active').map((team) => team.id)),
      knownStudentIds: new Set(students.filter((student) => student.status === 'active').map((student) => student.id))
    })
    return saveTrainingMembers([...members, ...additions], new Set(students.map((student) => student.id)))
  })
  handleTraining(IPC_CHANNELS.trainingMembers.get, async () => loadTrainingMembers())
  handleTrainingSave(IPC_CHANNELS.trainingMembers.save, loadTrainingMembers, async (_event, items: unknown) => {
    const students = await loadStudents()
    return saveTrainingMembers(items, new Set(students.map((item) => item.id)))
  })

  handleTraining(IPC_CHANNELS.trainingSessions.get, async () => loadTrainingSessions())
  handleTrainingSave(IPC_CHANNELS.trainingSessions.save, loadTrainingSessions, async (_event, items: unknown) => saveTrainingSessions(items))

  handleTraining(IPC_CHANNELS.trainingItems.get, async () => loadTrainingItems())
  handleTrainingSave(IPC_CHANNELS.trainingItems.save, loadTrainingItems, async (_event, items: unknown) => saveTrainingItems(items))

  handleTraining(IPC_CHANNELS.trainingResults.get, async () => loadTrainingResults())
  handleTrainingSave(IPC_CHANNELS.trainingResults.save, loadTrainingResults, async (_event, items: unknown) => {
    const students = await loadStudents()
    return saveTrainingResults(items, new Set(students.map((item) => item.id)))
  })
}

export function trainingDataPaths(): string[] {
  return [
    getTrainingTeamFilePath(),
    getTrainingMemberFilePath(),
    getTrainingPlanFilePath(),
    getTrainingSessionFilePath(),
    getTrainingItemFilePath(),
    getTrainingResultFilePath()
  ]
}
