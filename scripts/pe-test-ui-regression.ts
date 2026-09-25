import assert from 'node:assert/strict'
import Editor from '../src/renderer/src/components/PeTestEditor'
import Quick from '../src/renderer/src/components/PeQuickEntryPanel'
import ImportPage from '../src/renderer/src/pages/ExamBatchPage'
import { contexts, resetHooks, render, nodes, textOf } from './ui-hook-harness'
import { buildPeTestSession } from '../src/renderer/src/data/peTest/buildSession'
import { BUILTIN_TEST_ITEMS } from '../src/shared/peTest/builtinItems'

const klass: any = { id: 'class-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', className: '1班', grade: '初一', status: 'active' }
const male: any = { id: 'student-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', classId: klass.id, name: '张三', studentNo: '1', gender: 'male', status: 'active' }
const item = BUILTIN_TEST_ITEMS.find(i => i.builtinKey === 'run-1000m')!
const initial = buildPeTestSession({ classRecord: klass, testItem: item, activeStudents: [male, { ...male, id: 'student-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', studentNo: '2' }], date: '2026-09-25', title: '原标题', notes: '' })
initial.records = initial.records.map((r, index) => ({ ...r, rawValue: index ? 222 : 342, rawOriginal: index ? '3.42' : '342', status: 'valid', examScore: 73 + index, baseScore: 73 + index, bonusScore: 0, scoreOutcome: 'official' }))
const flush = () => new Promise<void>(resolve => setImmediate(resolve))
const button = (tree: any, label: string) => nodes(tree).find(node => node.type === 'button' && textOf(node.props.children) === label)
function setup() {
  resetHooks()
  contexts.Class = { classes: [klass] }
  contexts.Student = { students: [male] }
  contexts.TestItem = { items: BUILTIN_TEST_ITEMS }
  contexts.PeTest = { sessions: [initial], upsertSession: async () => {}, reload: async () => {} }
  ;(globalThis as any).window = { setTimeout: () => 0, clearTimeout() {}, addEventListener() {}, removeEventListener() {} }
}
let count = 0
async function check(name: string, action: () => Promise<void>) { setup(); await action(); count++; console.log(`PASS UI ${name}`) }
async function main() {
  for (const change of ['none', 'title', 'note', 'score', 'pending']) await check(`编辑器保存 ${change}`, async () => {
    let saved: any
    const props = { session: initial, testItem: item, historySessions: [initial], onBack() {}, onSave: async (next: any) => { saved = structuredClone(next) } }
    let tree = render(Editor, props)
    if (change === 'title') nodes(tree).find(n => n.type === 'input' && n.props.value === initial.title).props.onChange({ target: { value: '新标题' } })
    if (change === 'note') nodes(tree).find(n => n.props.className === 'row-note').props.onChange({ target: { value: '备注' } })
    if (change === 'score') nodes(tree).find(n => n.props.className === 'score-input').props.onChange({ target: { value: '342' } })
    if (change === 'pending') nodes(tree).find(n => n.type === 'select' && n.props.value === 'valid').props.onChange({ target: { value: 'pending' } })
    tree = render(Editor, props); button(tree, '保存').props.onClick(); await flush()
    assert(saved); assert.deepEqual(saved.records[1], initial.records[1])
    if (change === 'score') { assert.equal(saved.records[0].rawValue, 222); assert.equal(saved.records[0].rawOriginal, '342') }
    else if (change === 'pending') { assert.equal(saved.records[0].rawValue, null); assert.equal(saved.records[0].status, 'pending'); assert.equal(saved.records[0].examScore, null) }
    else { assert.equal(saved.records[0].rawValue, 342); assert.equal(saved.records[0].examScore, 73); assert.equal(saved.records[0].rawOriginal, '342') }
    tree = render(Editor, props); button(tree, '保存').props.onClick(); await flush(); assert.deepEqual(saved.records[1], initial.records[1])
  })
  await check('编辑保存失败无成功提示且保留草稿', async () => {
    const props = { session: initial, testItem: item, historySessions: [initial], onBack() {}, onSave: async () => { throw new Error('模拟失败') } }
    let tree = render(Editor, props)
    nodes(tree).find(n => n.props.className === 'score-input').props.onChange({ target: { value: '405' } })
    tree = render(Editor, props); button(tree, '保存').props.onClick(); await flush(); tree = render(Editor, props)
    assert(textOf(tree).includes('模拟失败')); assert(!textOf(tree).includes('已保存')); assert.equal(nodes(tree).find(n => n.props.className === 'score-input').props.value, '405')
  })
  await check('双击保存只有一次写入', async () => {
    let writes = 0, complete!: () => void
    const props = { session: initial, testItem: item, historySessions: [initial], onBack() {}, onSave: async () => { writes++; await new Promise<void>(resolve => { complete = resolve }) } }
    const tree = render(Editor, props); button(tree, '保存').props.onClick(); button(tree, '保存').props.onClick(); assert.equal(writes, 1); complete(); await flush()
  })
  for (const edit of [false, true]) await check(`快速录入${edit ? '明确重输' : '未编辑回车'}`, async () => {
    let saved: any
    contexts.PeTest.upsertSession = async (next: any, expected: any) => { assert.deepEqual(expected, initial); saved = next }
    const props = { initialSession: initial, onClose() {} }
    let tree = render(Quick, props)
    // Completed roster starts without a selected record; select a visible student.
    const row = nodes(tree).find(n => n.type === 'button' && n.props.onClick && textOf(n.props.children).includes('张三'))
    if (row) row.props.onClick()
    tree = render(Quick, props); tree = render(Quick, props)
    let input = nodes(tree).find(n => n.type === 'input' && n.props.placeholder === '342 或 3:42')
    assert(input, '快速输入框')
    if (edit) { input.props.onChange({ target: { value: '342' } }); tree = render(Quick, props); input = nodes(tree).find(n => n.type === 'input' && n.props.placeholder === '342 或 3:42') }
    input.props.onKeyDown({ key: 'Enter', preventDefault() {}, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false }); await flush()
    assert(saved); assert.equal(saved.records[0].rawValue, edit ? 222 : 342); assert.deepEqual(saved.records[1], initial.records[1])
  })
  await check('国家体测入口可选初中年级', async () => {
    const props = { onBack() {} }
    let tree = render(ImportPage, props)
    const select = nodes(tree).find(n => n.type === 'select' && textOf(n.props.children).includes('国家体测（初中）'))
    select.props.onChange({ target: { value: 'national' } }); tree = render(ImportPage, props)
    assert(nodes(tree).some(n => n.type === 'select' && n.props.value === '初一'))
    assert(textOf(tree).includes('初三'))
    assert.equal(button(tree, '选择 Excel').props.disabled, false)
  })
  console.log(`PE UI regression: ${count} passed`)
}
main().catch(error => { console.error(error); process.exitCode = 1 })
