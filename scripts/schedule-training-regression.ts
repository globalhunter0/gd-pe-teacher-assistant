import assert from 'node:assert/strict'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { writeJsonItemsAtomic } from '../src/shared/persistence/jsonFile'
import { registerTrainingIpc } from '../src/main/trainingIpc'
import { currentRosterStudents } from '../src/shared/trainingTeam/roster'
import { detectScheduleWorkbook, extractScheduleWorkbook } from '../src/shared/schedule/detectSchedule'
import { applyScheduleSync, emptyScheduleResolutions } from '../src/shared/schedule/reconcile'
import { parseScheduleItems } from '../src/shared/schedule/validate'
import { saveSchedule, loadSchedule } from '../src/main/scheduleStore'
import { loadTrainingItems, loadTrainingResults } from '../src/main/trainingStore'
import { withExclusiveDataAccess } from '../src/shared/persistence/writeGate'
import { klass, pupil, team, trainingMember, trainingPlan, trainingSession, trainingResult } from './rc-smoke-fixtures'

async function main() {
  const root = process.env.GDPE_TEST_ROOT!
  assert(root.includes('gdpe-schedule-training-'))
  await writeJsonItemsAtomic(join(root, 'classes.json'), [klass])
  const second = { ...pupil, id: `student-${randomUUID()}`, studentNo: '02', name: '第二名学生' }
  await writeJsonItemsAtomic(join(root, 'students.json'), [pupil, second])
  await writeJsonItemsAtomic(join(root, 'training-teams.json'), [team])
  registerTrainingIpc()
  const handlers = (globalThis as any).__handlers as Map<string, Function>
  const invoke = (channel: string, ...args: unknown[]): Promise<any> => handlers.get(channel)!({}, ...structuredClone(args))
  await invoke('trainingMembers:add', [trainingMember])
  await invoke('trainingMembers:add', [{ ...trainingMember, id: `training-member-${randomUUID()}`, studentId: second.id, nameSnapshot: second.name }])
  const manual = { ...trainingMember, id: `training-member-${randomUUID()}`, studentId: `student-${randomUUID()}`, source: 'manual', nameSnapshot: '外班队员', classNameSnapshot: '八年级9班' }
  await invoke('trainingMembers:add', [manual])
  const members = await invoke('trainingMembers:get')
  assert.equal(members.length, 3)
  assert.equal(members.find((m: any) => m.id === manual.id).source, 'manual')
  assert.equal(currentRosterStudents(team.id, members, [pupil, second]).length, 3)
  await assert.rejects(invoke('trainingMembers:add', [{ ...manual, id: `training-member-${randomUUID()}` }]), /重复/)
  assert.equal((await invoke('trainingMembers:get')).length, 3)
  await invoke('trainingMembers:save', members, members)
  const session = { ...trainingSession, planId: null, attendance: [{ ...trainingSession.attendance[0], studentId: manual.studentId, nameSnapshot: manual.nameSnapshot }] }
  await invoke('trainingSessions:save', [session], [])
  await invoke('trainingResults:save', [{ ...trainingResult, studentId: manual.studentId, studentNameSnapshot: manual.nameSnapshot }], [])
  assert.equal((await invoke('trainingResults:get'))[0].studentId, manual.studentId)
  const left = members.map((m: any) => m.id === manual.id ? { ...m, status: 'left', leftAt: new Date().toISOString() } : m)
  await invoke('trainingMembers:save', left, members)
  assert.equal(currentRosterStudents(team.id, await invoke('trainingMembers:get'), [pupil, second]).length, 2)
  console.log('PASS 连续添加、手动队员持久化、重复保护、签到成绩及退出')

  const sessionsBefore = await invoke('trainingSessions:get')
  await assert.rejects(invoke('trainingSessions:save', [], []), /DATA_CONFLICT/)
  await assert.rejects(invoke('trainingSessions:save', []), /DATA_CONFLICT/)
  assert.deepEqual(await invoke('trainingSessions:get'), sessionsBefore)
  const staleTeams = await invoke('trainingTeams:get')
  await invoke('trainingTeams:save', staleTeams.map((t: any) => ({ ...t, notes: '第一次修改' })), staleTeams)
  await assert.rejects(invoke('trainingTeams:save', staleTeams.map((t: any) => ({ ...t, coach: '覆盖者' })), staleTeams), /DATA_CONFLICT/)
  assert.deepEqual((await invoke('trainingTeams:get')).map((t: any) => [t.notes, t.coach]), [['第一次修改', team.coach]])
  assert(!handlers.has('trainingPlans:completeWithSession'))
  console.log('PASS 训练队集合保存拒绝过期或缺失的 expected，且不写盘')

  const snapshot = async () => ({
    plans: await invoke('trainingPlans:get'),
    sessions: await invoke('trainingSessions:get'),
    results: await invoke('trainingResults:get')
  })
  const newPlan = () => ({ ...trainingPlan, id: `training-plan-${randomUUID()}`, status: 'planned' })
  const sessionFor = (planId: string) => ({ ...trainingSession, id: `training-session-${randomUUID()}`, planId, attendance: [{ ...trainingSession.attendance[0], id: `training-attendance-${randomUUID()}` }] })
  const resultFor = (sessionId: string) => ({ ...trainingResult, id: `training-result-${randomUUID()}`, sessionId })

  const planned = newPlan()
  await invoke('trainingPlans:save', [...(await invoke('trainingPlans:get')), planned], await invoke('trainingPlans:get'))
  const unrelated = (await invoke('trainingResults:get')).length
  const fromPlan = sessionFor(planned.id)
  const recorded = await invoke('trainingSessions:record', fromPlan, [resultFor(fromPlan.id)])
  assert.equal(recorded.plans.find((p: any) => p.id === planned.id).status, 'completed')
  assert(recorded.sessions.some((s: any) => s.id === fromPlan.id))
  assert.equal(recorded.results.length, unrelated + 1)
  assert.deepEqual(await snapshot(), { plans: recorded.plans, sessions: recorded.sessions, results: recorded.results })
  console.log('PASS 从计划开始的训练：计划完成、训练记录、当堂成绩一次写入')

  const failingPlan = newPlan()
  await invoke('trainingPlans:save', [...(await invoke('trainingPlans:get')), failingPlan], await invoke('trainingPlans:get'))
  const beforeFailure = await snapshot()
  const failing = sessionFor(failingPlan.id)
  await assert.rejects(invoke('trainingSessions:record', failing, [{ ...resultFor(failing.id), itemId: `training-item-${randomUUID()}` }]), /训练成绩项目不存在/)
  assert.deepEqual(await snapshot(), beforeFailure)
  assert.equal(beforeFailure.plans.find((p: any) => p.id === failingPlan.id).status, 'planned')
  await assert.rejects(invoke('trainingSessions:record', failing, [resultFor(fromPlan.id)]), /绑定/)
  assert.deepEqual(await snapshot(), beforeFailure)
  console.log('PASS 成绩写入失败时训练记录与计划均未残留')

  const edited = await invoke('trainingSessions:record', { ...fromPlan, title: '修改后的训练' }, [])
  assert.equal(edited.sessions.filter((s: any) => s.id === fromPlan.id).length, 1)
  assert.equal(edited.sessions.find((s: any) => s.id === fromPlan.id).title, '修改后的训练')
  assert.equal(edited.plans.find((p: any) => p.id === planned.id).status, 'completed')
  assert(!edited.results.some((r: any) => r.sessionId === fromPlan.id))
  assert.equal(edited.results.length, unrelated)
  console.log('PASS 编辑已有训练只替换本次绑定成绩，其他成绩保留')

  const detection = detectScheduleWorkbook('学校课表.xlsx', [{ name: '课表', rows: [
    ['节次', '时间', '星期一', '星期六', '星期日'],
    ['第九节', '17:20–18:05', '体育', '篮球', ''],
    ['第12节', '20:00–20:35', '', '', '体能'],
    ['第十三节', '', '课外训练', '', '']
  ], merges: [] }])
  const extracted = extractScheduleWorkbook(detection)
  assert.equal(extracted.rows.length, 4)
  assert.equal(extracted.rows[0].startTime, '17:20')
  assert.equal(extracted.rows[2].weekday, 7)
  assert.equal(extracted.rows[3].startTime, '')
  const schedule = applyScheduleSync([], extracted.rows, { ...emptyScheduleResolutions(), acknowledgeRemoves: true })
  await saveSchedule(schedule)
  assert.deepEqual(await loadSchedule(), parseScheduleItems(schedule))
  assert.throws(() => parseScheduleItems([{ ...schedule[0], startTime: '25:10' }]), /时间/)
  const noTime = extractScheduleWorkbook(detectScheduleWorkbook('无作息.xlsx', [{ name: '课表', rows: [['节次', '星期一', '星期二'], ['第1节', '体育', '体育']], merges: [] }]))
  assert.equal(noTime.rows.length, 2)
  assert(noTime.rows.every((row) => row.startTime === '' && row.endTime === ''))
  console.log('PASS 自定义作息、第9–13节、周末、缺少时间及保存重载')

  const [itemsA, itemsB, resultsFromLoad] = await Promise.all([
    loadTrainingItems(),
    loadTrainingItems(),
    loadTrainingResults()
  ])
  assert(itemsA.length > 0)
  assert.deepEqual(itemsA, itemsB)
  assert(resultsFromLoad.length >= 0)
  console.log('PASS 启动并行加载训练项目只合并一次内置项，不因写锁忙碌误失败')

  let releaseHold!: () => void
  const hold = withExclusiveDataAccess(() => new Promise<void>((done) => { releaseHold = done }))
  const queuedAdd = invoke('trainingMembers:add', [{
    ...manual,
    id: `training-member-${randomUUID()}`,
    studentId: `student-${randomUUID()}`,
    nameSnapshot: '排队队员'
  }])
  await new Promise((resolve) => setTimeout(resolve, 30))
  let addSettled = false
  void queuedAdd.then(() => { addSettled = true })
  await new Promise((resolve) => setTimeout(resolve, 0))
  assert(!addSettled, '写锁忙碌时应排队等待')
  releaseHold()
  await hold
  await queuedAdd
  assert.equal((await invoke('trainingMembers:get')).some((m: { nameSnapshot: string }) => m.nameSnapshot === '排队队员'), true)
  console.log('PASS 写锁忙碌时训练写入排队提交，不立即失败')
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
