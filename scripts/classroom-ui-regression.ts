import assert from 'node:assert/strict'
import Editor from '../src/renderer/src/components/PeSessionEditor'
import Page from '../src/renderer/src/pages/PeLessonRecordsPage'
import { contexts, resetHooks, render, nodes, textOf } from './ui-hook-harness'
import { buildPeSession } from '../src/renderer/src/data/peSession/buildSession'
import { parsePeSessions } from '../src/shared/peSession/validate'
import { markPeSessionCompleted } from '../src/shared/peSession/sessionStatus'

const klass: any = { id: 'class-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', className: '1班', grade: '初一', status: 'active', academicYear: '2026-2027', semester: '第一学期' }
const student: any = { id: 'student-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', classId: klass.id, name: '原姓名', studentNo: '01', status: 'active' }
const lesson: any = { id: 'w5-p1', weekday: 5, period: 1, classId: klass.id, courseType: 'regular', team: '初一1班' }
const prefill: any = { classId: klass.id, date: '2026-09-25', period: 1, scheduleLessonId: lesson.id, lessonType: 'regular', teamSnapshot: '', startTimeSnapshot: '', endTimeSnapshot: '' }
const session = parsePeSessions([buildPeSession({ classRecord: klass, activeStudents: [student], topic: '', ...prefill })])[0]
const ready = (data: any) => ({ loading: false, error: null, ...data })
const flush = () => new Promise<void>(resolve => setImmediate(resolve))
const button = (tree: any, label: string) => nodes(tree).find(node => node.type === 'button' && textOf(node.props.children) === label)
function setup() {
  resetHooks()
  contexts.Class = ready({ classes: [klass] })
  contexts.Student = ready({ students: [student] })
  contexts.TeachingPlan = ready({ plans: [] })
  contexts.Schedule = ready({ items: [lesson] })
  contexts.PeSession = ready({ sessions: [], upsertSession: async () => {}, deleteSession: async () => {} })
  contexts.PeTest = ready({ sessions: [], upsertSession: async () => {} })
  contexts.TestItem = ready({ items: [] })
}
let count = 0
async function check(name: string, fn: () => Promise<void>) { await fn(); count++; console.log(`PASS UI ${name}`) }

async function main() {
  for (const source of ['Class', 'Student', 'Schedule', 'TeachingPlan', 'PeSession']) {
    await check(`${source} 慢加载不创建、就绪后仅创建一次`, async () => {
      setup(); contexts[source].loading = true
      let created = 0
      contexts.PeSession.createSession = async (item: any) => { created++; assert.equal(item.records.length, 1); return item }
      const props = { prefill, onPrefillConsumed() {}, openSessionId: null, onOpenSessionConsumed() {} }
      render(Page, props); await flush(); assert.equal(created, 0)
      contexts[source].loading = false
      render(Page, props); await flush(); render(Page, props); await flush()
      assert.equal(created, 1)
    })
  }
  await check('加载失败明确提示且不创建', async () => {
    setup(); contexts.Student.error = '模拟名单读取失败'
    let created = false; contexts.PeSession.createSession = async () => { created = true }
    const props = { prefill, onPrefillConsumed() {}, openSessionId: null, onOpenSessionConsumed() {} }
    render(Page, props); await flush()
    assert(textOf(render(Page, props)).includes('模拟名单读取失败')); assert(!created)
  })
  await check('已有课堂在学生全部转出后仍打开原快照', async () => {
    setup(); contexts.PeSession.sessions = [session]; contexts.Student.students = []
    contexts.PeSession.createSession = async () => { throw new Error('不应创建') }
    const props = { prefill, onPrefillConsumed() {}, openSessionId: null, onOpenSessionConsumed() {} }
    render(Page, props); await flush()
    const result = render(Page, props)
    assert.equal(result.props.session.id, session.id)
  })
  for (const label of ['保存', '完成本节']) for (const fails of [false, true]) {
    await check(`${label}${fails ? '失败' : '成功'}反馈与重复点击`, async () => {
      setup()
      let resolve!: () => void, reject!: (reason: Error) => void, calls = 0
      const pending = new Promise<void>((ok, bad) => { resolve = ok; reject = bad })
      const props = { session, onBack() {}, onSave: async () => { calls++; await pending } }
      let tree = render(Editor, props)
      button(tree, label).props.onClick(); button(tree, label).props.onClick()
      tree = render(Editor, props)
      assert.equal(calls, 1)
      assert(!textOf(tree).includes('本节课堂已标记完成'))
      assert(!textOf(tree).includes('课堂记录已保存'))
      if (fails) reject(new Error('模拟磁盘写入失败')); else resolve()
      await flush(); tree = render(Editor, props)
      if (fails) {
        assert(textOf(tree).includes('模拟磁盘写入失败'))
        assert(button(tree, '完成本节')); assert(!button(tree, '重新打开'))
        assert(!textOf(tree).includes('课堂记录已保存'))
      } else {
        assert(textOf(tree).includes(label === '保存' ? '课堂记录已保存' : '本节课堂已标记完成'))
        if (label === '完成本节') assert(button(tree, '重新打开'))
      }
    })
  }
  await check('completed 行编辑禁用，重开失败保持 completed', async () => {
    setup()
    const props = { session: markPeSessionCompleted(session), onBack() {}, onSave: async () => { throw new Error('重开保存失败') } }
    let tree = render(Editor, props)
    const note = nodes(tree).find(node => node.props.className === 'row-note')
    assert(note.props.disabled)
    note.props.onChange({ target: { value: '不得修改' } })
    tree = render(Editor, props)
    assert.equal(nodes(tree).find(node => node.props.className === 'row-note').props.value, '')
    button(tree, '重新打开').props.onClick(); await flush()
    tree = render(Editor, props); assert(button(tree, '重新打开')); assert(textOf(tree).includes('重开保存失败'))
  })
  await check('批量考勤、备注、标签属于草稿，显式保存后才反馈成功', async () => {
    setup(); let persisted: any
    const props = { session, onBack() {}, onSave: async (item: any) => { persisted = structuredClone(item) } }
    let tree = render(Editor, props)
    nodes(tree).find(node => node.props['aria-label'] === '全选').props.onChange()
    tree = render(Editor, props); button(tree, '缺勤').props.onClick()
    tree = render(Editor, props)
    nodes(tree).find(node => node.props.className === 'row-note').props.onChange({ target: { value: '课堂备注' } })
    tree = render(Editor, props); button(tree, '添加标签').props.onClick()
    tree = render(Editor, props)
    nodes(tree).find(node => node.type === 'label' && node.props.className === 'tag-option').props.children[0].props.onChange()
    assert.equal(persisted, undefined)
    tree = render(Editor, props); button(tree, '保存').props.onClick(); await flush()
    assert.equal(persisted.records[0].attendanceStatus, 'absent')
    assert.equal(persisted.records[0].note, '课堂备注')
    assert.equal(persisted.records[0].performanceTags.length, 1)
  })
  console.log(`classroom UI regression: ${count} checks passed`)
}
main().catch(error => { console.error(error); process.exitCode = 1 })
