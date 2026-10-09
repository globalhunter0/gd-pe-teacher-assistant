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
import { klass, pupil, team, trainingMember, trainingSession, trainingResult } from './rc-smoke-fixtures'

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
  await invoke('trainingMembers:save', members)
  const session = { ...trainingSession, planId: null, attendance: [{ ...trainingSession.attendance[0], studentId: manual.studentId, nameSnapshot: manual.nameSnapshot }] }
  await invoke('trainingSessions:save', [session])
  await invoke('trainingResults:save', [{ ...trainingResult, studentId: manual.studentId, studentNameSnapshot: manual.nameSnapshot }])
  assert.equal((await invoke('trainingResults:get'))[0].studentId, manual.studentId)
  const left = members.map((m: any) => m.id === manual.id ? { ...m, status: 'left', leftAt: new Date().toISOString() } : m)
  await invoke('trainingMembers:save', left)
  assert.equal(currentRosterStudents(team.id, await invoke('trainingMembers:get'), [pupil, second]).length, 2)
  console.log('PASS 连续添加、手动队员持久化、重复保护、签到成绩及退出')

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
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
