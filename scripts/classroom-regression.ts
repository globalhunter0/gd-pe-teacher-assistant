import assert from 'node:assert/strict'
import fs, { readFile } from 'node:fs/promises'
import { syncBuiltinESMExports } from 'node:module'
import { join } from 'node:path'
import { registerClassIpc } from '../src/main/classIpc'
import { registerStudentIpc } from '../src/main/studentIpc'
import { registerScheduleIpc } from '../src/main/scheduleIpc'
import { registerTeachingPlanIpc } from '../src/main/teachingPlanIpc'
import { registerPeSessionIpc } from '../src/main/peSessionIpc'
import { registerPeTestIpc } from '../src/main/peTestIpc'
import { loadJsonItemsFile, writeJsonItemsAtomic } from '../src/shared/persistence/jsonFile'
import { buildPeSession } from '../src/renderer/src/data/peSession/buildSession'
import { markPeSessionCompleted, reopenPeSession } from '../src/shared/peSession/sessionStatus'
import { findExistingPeSession, resolveWorkbenchLessonRecord } from '../src/shared/peSession/workbenchToday'
import { resolveScheduleClassroomEligibility } from '../src/shared/schedule/classroomEligibility'
import { buildClassroomPeTestSession } from '../src/shared/peTest/classroomQuiz'
import { createEmptyWeeks } from '../src/shared/teachingPlan/validate'
import { deriveWeeklyPlanExecution } from '../src/shared/teachingPlan/execution'
import { runStagedJsonWrites } from '../src/shared/importTransaction/stagedWrite'
import type { ClassRecord } from '../src/shared/class/types'
import type { StudentRecord } from '../src/shared/student/types'
import type { PEClassSession } from '../src/shared/peSession/types'
import type { ScheduleItem } from '../src/shared/schedule/types'

const root = process.env.GDPE_TEST_ROOT!
assert(root && root.includes('gdpe-classroom-check-'))
const handlers = () => (globalThis as unknown as { __handlers: Map<string, (...args: unknown[]) => Promise<any>> }).__handlers
const invoke = (channel: string, ...args: unknown[]) => handlers().get(channel)!({}, ...structuredClone(args))
const now = '2026-09-25T00:00:00.000Z'
const klass: ClassRecord = { id: 'class-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', className: '1班', grade: '初一', academicYear: '2026-2027', semester: '第一学期', studentCount: 1, status: 'active', notes: '', createdAt: now, updatedAt: now }
const pupil: StudentRecord = { id: 'student-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', classId: klass.id, name: '原姓名', studentNo: '01', gender: 'male', status: 'active', notes: '', createdAt: now, updatedAt: now }
const lesson: ScheduleItem = { id: 'w5-p1', weekday: 5, period: 1, startTime: '08:00', endTime: '08:40', team: '初一1班', courseType: 'regular', classId: klass.id }
const make = (patch: Partial<PEClassSession> = {}) => ({ ...buildPeSession({ classRecord: klass, activeStudents: [pupil], date: '2026-09-25', period: 1, lessonType: 'regular', topic: '', scheduleLessonId: lesson.id, teamSnapshot: lesson.team, startTimeSnapshot: lesson.startTime, endTimeSnapshot: lesson.endTime }), ...patch })
let passed = 0
async function check(name: string, run: () => Promise<void> | void) { await run(); passed++; console.log(`PASS ${name}`) }
async function save(items: PEClassSession[]) { const before = await invoke('peSessions:get'); return invoke('peSessions:save', items, before) }

async function main() {
  await check('事务中首次初始化可读取暂存数据且仅提交最终值', async () => {
    const path = join(root, 'staged-first-load.json')
    const parse = (value: unknown) => { assert(Array.isArray(value)); return value }
    const result = await runStagedJsonWrites([{ name: 'staged-first-load.json', restore: async () => {}, write: async () => {
      assert.deepEqual(await loadJsonItemsFile(path, parse, []), [])
      await writeJsonItemsAtomic(path, [{ saved: true }])
      assert.deepEqual(await loadJsonItemsFile(path, parse, []), [{ saved: true }])
    } }])
    assert(result.ok)
    assert.deepEqual(await loadJsonItemsFile(path, parse, []), [{ saved: true }])
  })
  await check('并发首次初始化不覆盖另一初始化或随后保存', async () => {
    const path = join(root, 'concurrent-initialization.json')
    const parse = (value: unknown) => { assert(Array.isArray(value)); return value }
    const [a, b] = await Promise.all([loadJsonItemsFile(path, parse, [{ value: 'A' }]), loadJsonItemsFile(path, parse, [{ value: 'B' }])])
    assert.deepEqual(a, b)
    await writeJsonItemsAtomic(path, [{ value: 'saved' }], a)
    await assert.rejects(writeJsonItemsAtomic(path, [{ value: 'stale' }], b), /DATA_CONFLICT/)
    assert.deepEqual(await loadJsonItemsFile(path, parse, []), [{ value: 'saved' }])
  })
  for (const register of [registerClassIpc, registerStudentIpc, registerScheduleIpc, registerTeachingPlanIpc, registerPeSessionIpc, registerPeTestIpc]) register()
  await writeJsonItemsAtomic(join(root, 'classes.json'), [klass])
  await writeJsonItemsAtomic(join(root, 'students.json'), [pupil])
  await writeJsonItemsAtomic(join(root, 'schedule.json'), [lesson])
  await check('首次加载、空集合及缺失基线拒绝', async () => {
    assert.deepEqual(await invoke('peSessions:get'), [])
    assert.deepEqual(await invoke('peSessions:save', [], []), [])
    await assert.rejects(invoke('peSessions:save', []), /DATA_CONFLICT/)
  })
  const plan = { ...klass, id: 'teaching-plan-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', name: '测试计划', totalWeeks: 1, weeks: createEmptyWeeks(1), startDate: null, endDate: null }
  await check('教学计划空集合首次创建', async () => {
    const empty = await invoke('teachingPlans:get')
    assert.deepEqual(empty, [])
    await invoke('teachingPlans:save', [plan], empty)
    await assert.rejects(invoke('teachingPlans:save', [], empty), /DATA_CONFLICT/)
  })
  for (const api of ['classes', 'students', 'schedule', 'teachingPlans', 'testItems']) {
    await check(`${api}: A/B 陈旧集合不得覆盖`, async () => {
      const a = await invoke(`${api}:get`), b = await invoke(`${api}:get`)
      await invoke(`${api}:save`, a, a)
      assert(a.length > 0)
        const changed = structuredClone(a)
        if (api === 'schedule') changed[0].team += '更新'
        else if (api === 'testItems') changed[0].isActive = !changed[0].isActive
        else changed[0].notes = 'A 的修改'
        await invoke(`${api}:save`, changed, a)
        await assert.rejects(invoke(`${api}:save`, b, b), /DATA_CONFLICT/)
        assert.deepEqual(await invoke(`${api}:get`), await invoke(`${api}:save`, changed, changed))
    })
  }
  const session = make()
  await check('正常创建、保存后重新打开', async () => {
    const empty = await invoke('peSessions:get')
    const result = await invoke('peSessions:create', session)
    assert.equal(result.sessions.length, 1)
    assert.equal((await invoke('peSessions:get'))[0].id, session.id)
    await assert.rejects(invoke('peSessions:save', [], empty), /DATA_CONFLICT/)
  })
  await check('peSessions: A 成功后 B 的旧记录保存明确冲突', async () => {
    const a = await invoke('peSessions:get'), b = await invoke('peSessions:get')
    const saved = await invoke('peSessions:save', [{ ...a[0], notes: 'A 修改' }], a)
    await assert.rejects(invoke('peSessions:save', [{ ...b[0], notes: 'B 修改' }], b), /DATA_CONFLICT/)
    assert.deepEqual(await invoke('peSessions:get'), saved)
  })
  await check('原子创建连续快速请求返回同一历史课堂', async () => {
    const [a, b] = await Promise.all([invoke('peSessions:create', make()), invoke('peSessions:create', make())])
    assert.equal(a.session.id, session.id); assert.equal(b.session.id, session.id)
    assert.equal((await invoke('peSessions:get')).length, 1)
  })
  await check('重复创建及连续并发保存不产生第二课堂', async () => {
    const base = await invoke('peSessions:get')
    await assert.rejects(invoke('peSessions:save', [...base, make()], base))
    const a = { ...base[0], notes: '并发 A' }, b = { ...base[0], notes: '并发 B' }
    const results = await Promise.allSettled([invoke('peSessions:save', [a], base), invoke('peSessions:save', [b], base)])
    assert.equal(results.filter(result => result.status === 'fulfilled').length, 1)
    assert.equal((await invoke('peSessions:get')).length, 1)
  })
  await check('已有课堂、课表 ID 改变、不同班和不同节次', () => {
    assert.equal(findExistingPeSession([session], { ...session, scheduleLessonId: 'changed' })?.id, session.id)
    assert.equal(findExistingPeSession([session], { ...session, classId: 'another' }), undefined)
    assert.equal(findExistingPeSession([session], { ...session, period: 2 }), undefined)
  })
  await check('普通课、训练队、其他活动和删除班级资格', () => {
    const eligible = (item: ScheduleItem, classes = [klass]) => resolveScheduleClassroomEligibility(item, { cellWeekday: 5, todayWeekday: 5, classes }).eligible
    assert(eligible(lesson)); assert(!eligible({ ...lesson, trainingTeamId: 'team' }))
    assert(!eligible({ ...lesson, courseType: 'other' })); assert(!eligible(lesson, [{ ...klass, status: 'deleted' }]))
  })
  for (const [name, change] of [
    ['转班', { classId: 'class-bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee' }], ['转出', { status: 'transferred' }],
    ['删除', { status: 'deleted' }], ['改名', { name: '新姓名' }]
  ] as const) await check(`上课后学生${name}保留历史`, async () => {
    const before = await readFile(join(root, 'pe-sessions.json'), 'utf8')
    await writeJsonItemsAtomic(join(root, 'students.json'), [{ ...pupil, ...change }])
    const loaded = await invoke('peSessions:get'); assert.equal(loaded[0].records[0].nameSnapshot, '原姓名')
    assert.equal(await readFile(join(root, 'pe-sessions.json'), 'utf8'), before)
  })
  await check('后来转入学生不自动加入历史；陈旧名单创建被拒绝', async () => {
    await writeJsonItemsAtomic(join(root, 'students.json'), [pupil, { ...pupil, id: 'student-bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee', studentNo: '02', name: '新转入' }])
    assert.equal((await invoke('peSessions:get'))[0].records.length, 1)
    await assert.rejects(save([...(await invoke('peSessions:get')), make({ period: 2, scheduleLessonId: null })]), /CLASSROOM_ROSTER_CHANGED/)
    await writeJsonItemsAtomic(join(root, 'students.json'), [pupil])
  })
  await check('删除班级保留旧课堂、禁止新课堂', async () => {
    await writeJsonItemsAtomic(join(root, 'classes.json'), [{ ...klass, status: 'deleted' }])
    assert.equal((await invoke('peSessions:get')).length, 1)
    await assert.rejects(save([...(await invoke('peSessions:get')), make({ period: 2, scheduleLessonId: null })]), /已删除/)
    await writeJsonItemsAtomic(join(root, 'classes.json'), [klass])
  })
  await check('完成、重新打开与工作台真实状态', async () => {
    let current = (await invoke('peSessions:get'))[0]
    await save([markPeSessionCompleted(current)])
    current = (await invoke('peSessions:get'))[0]
    assert.equal(resolveWorkbenchLessonRecord([current], lesson, current.date).status, 'completed')
    await assert.rejects(save([{ ...current, notes: '禁止修改' }]), /先重新打开/)
    await save([reopenPeSession(current)])
    assert.equal((await invoke('peSessions:get'))[0].status, 'in_progress')
  })
  for (const complete of [false, true]) await check(`${complete ? '完成' : '保存'}磁盘失败不更改持久化状态`, async () => {
    const before = await invoke('peSessions:get')
    const originalRename = fs.rename
    fs.rename = async () => { throw Object.assign(new Error('injected disk failure'), { code: 'EACCES' }) }
    syncBuiltinESMExports()
    try { await assert.rejects(invoke('peSessions:save', [complete ? markPeSessionCompleted(before[0]) : { ...before[0], notes: '失败保存' }], before)) }
    finally { fs.rename = originalRename; syncBuiltinESMExports() }
    assert.deepEqual(await invoke('peSessions:get'), before)
  })
  await check('有关联小测的课堂删除被拒绝，成绩和关联原样保留', async () => {
    const current = (await invoke('peSessions:get'))[0]
    const items = await invoke('testItems:get')
    const quiz = buildClassroomPeTestSession({ peSession: current, testItem: items[0] })
    quiz.records[0].rawValue = 150
    quiz.records[0].status = 'valid'
    const saved = await invoke('peTests:save', [quiz], await invoke('peTests:get'))
    await assert.rejects(save([]), /CLASSROOM_HAS_TESTS/)
    assert.deepEqual(await invoke('peTests:get'), saved)
    assert.equal((await invoke('peSessions:get'))[0].id, current.id)
  })
  await check('peTests: A 成功后 B 不得覆盖小测成绩', async () => {
    const a = await invoke('peTests:get'), b = await invoke('peTests:get')
    const changed = structuredClone(a); changed[0].records[0].rawValue = 151
    const saved = await invoke('peTests:save', changed, a)
    await assert.rejects(invoke('peTests:save', b, b), /DATA_CONFLICT/)
    assert.deepEqual(await invoke('peTests:get'), saved)
  })
  await check('跨节次改课表保留旧课堂，新节次创建独立课堂', async () => {
    const before = await invoke('peSessions:get')
    const moved = { ...lesson, id: 'w5-p4', period: 4 }
    await writeJsonItemsAtomic(join(root, 'schedule.json'), [moved])
    const result = await invoke('peSessions:create', make({ period: 4, scheduleLessonId: moved.id }))
    assert.notEqual(result.session.id, before[0].id)
    assert.deepEqual(result.sessions.find((item: PEClassSession) => item.id === before[0].id), before[0])
    assert.equal(resolveWorkbenchLessonRecord(result.sessions, moved, session.date).session?.id, result.session.id)
    await save(before)
    await writeJsonItemsAtomic(join(root, 'schedule.json'), [lesson])
  })
  await check('独立补课与普通课共存，补课重复进入复用，工作台只标记普通课', async () => {
    const before = await invoke('peSessions:get')
    const extra = make({ lessonType: 'extra', scheduleLessonId: null })
    const result = await invoke('peSessions:create', extra)
    assert.equal(result.sessions.length, 2)
    assert.equal((await invoke('peSessions:create', make({ lessonType: 'extra', scheduleLessonId: null }))).session.id, extra.id)
    assert.equal(resolveWorkbenchLessonRecord(result.sessions, lesson, session.date).session?.id, before[0].id)
    await save(before)
  })
  await check('同节次不同班可创建；同班不同节次可创建', async () => {
    const before = await invoke('peSessions:get')
    const other = { ...klass, id: 'class-bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee' }
    const otherStudent = { ...pupil, id: 'student-bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee', classId: other.id }
    await writeJsonItemsAtomic(join(root, 'classes.json'), [klass, other])
    await writeJsonItemsAtomic(join(root, 'students.json'), [pupil, otherStudent])
    const otherSession = buildPeSession({ classRecord: other, activeStudents: [otherStudent], date: session.date, period: 1, lessonType: 'regular', topic: '', scheduleLessonId: null, teamSnapshot: '', startTimeSnapshot: '', endTimeSnapshot: '' })
    await invoke('peSessions:create', otherSession)
    await invoke('peSessions:create', make({ period: 2, scheduleLessonId: null }))
    assert.equal((await invoke('peSessions:get')).length, 3)
    await save(before)
    await writeJsonItemsAtomic(join(root, 'classes.json'), [klass])
    await writeJsonItemsAtomic(join(root, 'students.json'), [pupil])
  })
  await check('主进程拒绝训练队及其他活动新建课堂', async () => {
    for (const patch of [{ trainingTeamId: 'training-team-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' }, { courseType: 'other' }]) {
      await writeJsonItemsAtomic(join(root, 'schedule.json'), [{ ...lesson, ...patch }])
      await assert.rejects(invoke('peSessions:create', make({ date: '2026-10-02' })), /不符合普通课堂/)
    }
    await writeJsonItemsAtomic(join(root, 'schedule.json'), [lesson])
  })
  await check('旧格式无 status 数据加载、首次保存、再打开', async () => {
    const before = await invoke('peSessions:get')
    const legacy = make({ period: 8, scheduleLessonId: null }); delete legacy.status; delete legacy.completedAt
    await fs.writeFile(join(root, 'pe-sessions.json'), JSON.stringify([...before, legacy]))
    const loaded = await invoke('peSessions:get')
    assert.equal(loaded.find((item: PEClassSession) => item.id === legacy.id).status, undefined)
    await invoke('peSessions:save', loaded, loaded)
    assert.deepEqual(await invoke('peSessions:get'), loaded)
    await save(before)
  })
  await check('计划和周次引用保存及完成统计；无关联课堂可删除', async () => {
    const before = await invoke('peSessions:get')
    const created = await invoke('peSessions:create', make({ period: 3, scheduleLessonId: null, teachingPlanId: plan.id, teachingPlanWeekId: plan.weeks[0].id, objectivesSnapshot: '原目标' }))
    const all = created.sessions.map((item: PEClassSession) => item.id === created.session.id ? markPeSessionCompleted(item) : item)
    await save(all)
    const loaded = await invoke('peSessions:get')
    assert.equal(deriveWeeklyPlanExecution({ teachingPlanId: plan.id, teachingPlanWeekId: plan.weeks[0].id, sessions: loaded }).completedCount, 1)
    const testBefore = await invoke('peTests:get')
    await save(before)
    assert.deepEqual(await invoke('peTests:get'), testBefore)
  })
  console.log(`classroom regression: ${passed} checks passed`)
}
main().catch(error => { console.error(error); process.exitCode = 1 })
