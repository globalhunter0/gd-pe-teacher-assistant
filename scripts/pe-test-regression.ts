import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeJsonItemsAtomic } from '../src/shared/persistence/jsonFile'
import assert from 'node:assert/strict'
import * as XLSX from 'xlsx'
import { worksheetRowsToSnapshot } from '../src/shared/examBatch/readSheet'
import { BUILTIN_TEST_ITEMS } from '../src/shared/peTest/builtinItems'
import { buildPeTestSession } from '../src/renderer/src/data/peTest/buildSession'
import { applyPeTestEdits } from '../src/shared/peTest/editSession'
import { applyQuickEntry } from '../src/shared/peTest/quickEntry/apply'
import { parseMeasurement } from '../src/shared/peTest/measurement'
import { parseQuickEntryInput } from '../src/shared/peTest/quickEntry/parse'
import { scoreQuickEntryRaw } from '../src/shared/peTest/quickEntry/score'
import { nationalBatchStandard, withDerivedBmi } from '../src/shared/examBatch/nationalBatch'
import { convertWorkbookExamBatch, detectWorkbookColumns } from '../src/shared/examBatch/workbook'
import { convertExamBatch } from '../src/shared/examBatch/convert'
import { suggestColumnMapping } from '../src/shared/examBatch/columnMapping'
import { buildExamBatchPeTestImportPayload } from '../src/shared/examBatch/peTestImport/entry'
import { planExamBatchPeTestImport, findDuplicatePeTests, mergePeTestsAtomically } from '../src/shared/examBatch/peTestImport/planImport'
import { executeImportExamBatchToPeTests } from '../src/shared/examBatch/peTestImport/execute'
import { matchExcelStudent } from '../src/shared/examBatch/peTestImport/matchStudent'
import { listBuiltinExamStandards } from '../src/shared/examStandard/catalog'
import { parsePeTestSessions } from '../src/shared/peTest/validate'
import { assertPeTestSaveIdentity } from '../src/shared/peTest/saveIdentity'
import { buildPeTestSessionExportRows, buildPeTestSessionExportPayload } from '../src/shared/peTest/exportSession'
import { buildPeTestClosure } from '../src/shared/peTest/detail'
import { findTeacherVisibleDuplicates, GENDER_LINKED_TEST_GROUPS } from '../src/shared/peTest/groupedItems'
import { assertCollectionUnchanged } from '../src/shared/persistence/collectionConflict'
import { calculateNationalFitnessScore } from '../src/shared/nationalFitness/scoring/engine'
import type { ClassRecord } from '../src/shared/class/types'
import type { StudentRecord } from '../src/shared/student/types'
import type { PETestSession } from '../src/shared/peTest/types'
import type { ExamSheetSnapshot } from '../src/shared/examBatch/types'

const now = '2026-09-25T00:00:00.000Z'
const klass: ClassRecord = { id: 'class-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', className: '1班', grade: '初一', academicYear: '2026-2027', semester: '第一学期', studentCount: 2, notes: '', status: 'active', createdAt: now, updatedAt: now }
const male: StudentRecord = { id: 'student-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', classId: klass.id, name: '张三', studentNo: '01', gender: 'male', status: 'active', notes: '', createdAt: now, updatedAt: now }
const female: StudentRecord = { ...male, id: 'student-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', name: '李四', studentNo: '02', gender: 'female' }
const item = (key: string) => BUILTIN_TEST_ITEMS.find(entry => entry.builtinKey === key)!
const national = nationalBatchStandard('初一')
const city = listBuiltinExamStandards().find(entry => entry.citySlug === 'guangzhou' && entry.status === 'verified')!
const create = (key: string, students = [male, female], standard = national) => buildPeTestSession({ classRecord: klass, testItem: item(key), activeStudents: students, date: '2026-09-25', title: '测试', notes: '', examStandardId: standard.id })
function sheet(headers: string[], values: unknown[][]): ExamSheetSnapshot {
  return { fileName: 'fixture.xlsx', sheetName: '成绩', headerRowNumber: 1, columns: headers.map((title, index) => ({ title, index })), rows: values.map((raw, index) => ({ excelRow: index + 2, raw, cells: raw.map(value => value == null ? '' : String(value)) })) }
}
function batch(key: string, value: unknown, gender = '男', standard = national, header = item(key).name) {
  const snapshot = sheet(['学号', '姓名', '性别', '班级', header], [[gender === '女' ? '02' : '01', gender === '女' ? '李四' : '张三', gender, '1班', value]])
  return convertWorkbookExamBatch(standard, snapshot, detectWorkbookColumns(snapshot.columns.map(column => column.title), standard, snapshot.rows))
}
function plan(rows: ReturnType<typeof batch>['rows'], standard = national, existing: PETestSession[] = []) {
  return planExamBatchPeTestImport(buildExamBatchPeTestImportPayload({ classId: klass.id, testDate: '2026-09-25', standard, rows, duplicateAction: 'cancel' }), { classRecord: klass, students: [male, female], testItems: BUILTIN_TEST_ITEMS, existingSessions: existing, standard, nowIso: now })
}
const check = async (name: string, fn: () => unknown | Promise<unknown>) => { await fn(); count++; console.log(`PASS ${name}`) }
let count = 0
async function main() {
  for (const [key, person] of [['run-1000m', male], ['run-800m', female]] as const) {
    for (const input of ['342', '3.42', '3:42', 342, 3.42]) await check(`${key} 三入口 ${JSON.stringify(input)}`, () => {
      const draft = create(key, [person])
      const quick = applyQuickEntry({ session: draft, testItem: item(key), recordId: draft.records[0].id, action: { type: 'score', input: String(input) }, standard: null, nowIso: now })
      assert(quick.ok)
      const manual = applyPeTestEdits({ draft, inputs: { [draft.records[0].id]: String(input) }, changedIds: new Set([draft.records[0].id]), testItem: item(key), items: BUILTIN_TEST_ITEMS, standard: null, nowIso: now })
      const imported = plan(batch(key, input, person.gender === 'male' ? '男' : '女').rows)
      assert(imported.ok, imported.errors.join(';'))
      for (const record of [quick.session.records[0], manual.records[0], imported.sessions[0].records[0]]) {
        assert.equal(record.rawValue, 222); assert.equal(record.examScore, quick.session.records[0].examScore)
        assert.equal(record.resolvedTestItemId, item(key).id)
        for (const field of ['baseScore', 'bonusScore', 'scoreOutcome', 'officialMinimumScore', 'examItemId'] as const) assert.equal(record[field], quick.session.records[0][field])
        assert.equal(record.rawOriginal, String(input))
      }
    })
  }
  for (const [input, seconds] of [['315', 195], ['405', 245], ['430', 270], ['512', 312], ['3.05', 185], ['3:05', 185], ['342秒', 342]] as const) await check(`长跑解析 ${input}`, () => {
    assert.equal(parseMeasurement(input, item('run-1000m')), seconds)
    assert.equal(batch('run-1000m', input).rows[0].rawValueParsed, seconds)
  })
  for (const unit of ['秒', '总秒数', 'seconds']) for (const value of [342, '342']) await check(`Excel显式${unit} ${typeof value}`, () => {
    assert.equal(batch('run-1000m', value, '男', national, `1000米跑（${unit}）`).rows[0].rawValueParsed, 342)
  })
  for (const value of ['375', '3.75', '3:75', '3.4', '3.425']) await check(`非法分秒 ${value}`, () => {
    assert(!parseQuickEntryInput(value, item('run-1000m')).ok)
    assert.equal(batch('run-1000m', value).summary.errorCount, 1)
  })
  await check('Excel数值不自动补位或舍入', () => { assert.equal(batch('run-1000m', 3.4).summary.errorCount, 1); assert.equal(batch('run-1000m', 3.425).summary.errorCount, 1) })
  for (const value of [8, 8.1, 8.25, '8.25']) await check(`50米秒数 ${JSON.stringify(value)}`, () => {
    assert.equal(parseMeasurement(String(value), item('50m')), Number(value))
    assert.equal(batch('50m', value).rows[0].rawValueParsed, Number(value))
  })
  await check('50米825不当MMSS且拒绝明显异常', () => { assert.equal(parseMeasurement('825', item('50m')), 825); assert(!parseQuickEntryInput('825', item('50m')).ok); assert.equal(batch('50m', 825).summary.errorCount, 1) })
  for (const [key, input, raw] of [['standing-long-jump', '245cm', 245], ['height', '1.65m', 165], ['weight', '50kg', 50], ['vital-capacity', '3500ml', 3500], ['pull-up', '10次', 10], ['sit-and-reach', '-5.5cm', -5.5], ['bmi', '18.5', 18.5]] as const) await check(`单位 ${key}`, () => {
    const result = batch(key, input)
    assert.equal(result.summary.errorCount, 0, JSON.stringify(result.rows))
    const planned = plan(result.rows); assert(planned.ok, planned.errors.join(';')); assert.equal(planned.sessions[0].records[0].rawValue, raw)
    assert.equal(parseMeasurement(input, item(key)), raw)
  })
  await check('中考米制跳远入库厘米制并保留评分', () => {
    const result = batch('standing-long-jump', 245, '男', city, '立定跳远(cm)')
    const planned = plan(result.rows, city); assert(planned.ok, planned.errors.join(';'))
    assert.equal(planned.sessions[0].unitSnapshot, 'cm'); assert.equal(planned.sessions[0].records[0].rawValue, 245)
    const score = scoreQuickEntryRaw({ standard: city, testItem: item('standing-long-jump'), gender: 'male', rawValue: 245 })
    assert.equal(planned.sessions[0].records[0].examScore, score.examScore)
  })
  for (const [input, status] of [['A', 'absent'], ['a', 'absent'], ['absent', 'absent'], ['缺考', 'absent'], ['exempt', 'exempt'], ['免考', 'exempt'], ['pending', 'pending'], ['未测', 'pending'], ['', 'pending']] as const) await check(`三入口状态 ${input || '空值'}`, () => {
    const draft = create('50m', [male])
    const quick = applyQuickEntry({ session: draft, testItem: item('50m'), recordId: draft.records[0].id, action: { type: 'score', input }, standard: null, nowIso: now })
    assert(quick.ok)
    const manual = applyPeTestEdits({ draft, inputs: { [draft.records[0].id]: input }, changedIds: new Set([draft.records[0].id]), testItem: item('50m'), items: BUILTIN_TEST_ITEMS, standard: null, nowIso: now })
    const imported = plan(batch('50m', input).rows); assert(imported.ok, imported.errors.join(';'))
    for (const record of [quick.session.records[0], manual.records[0], imported.sessions[0].records[0]]) { assert.equal(record.status, status); assert.equal(record.rawValue, null); assert.equal(record.examScore, null) }
  })
  await check('未识别Excel列明确失败', () => { const result = batch('50m', 8, '男', national, '未知项目'); assert.equal(result.rows[0].status, 'unrecognized_item'); assert(!plan(result.rows).ok) })
  await check('9项成功+1项未知不能全部成功', () => {
    const snapshot = sheet(['姓名', '性别', '身高', '体重', 'BMI', '50米', '肺活量', '坐位体前屈', '立定跳远', '引体向上', '1000米跑', '未知项目'], [['张三', '男', 165, 50, 18.4, 8, 3500, 18, 230, 12, '342', 7]])
    const result = convertWorkbookExamBatch(national, snapshot, detectWorkbookColumns(snapshot.columns.map(c => c.title), national, snapshot.rows))
    assert.equal(result.summary.successCount, 9); assert.equal(result.summary.errorCount, 1)
  })
  for (const key of ['run-800m', 'run-1000m']) await check(`${key} 禁止错误性别`, () => { assert.equal(batch(key, '342', key === 'run-800m' ? '男' : '女').summary.errorCount, 1) })
  await check('未知性别无评分', () => { assert.equal(batch('run-1000m', '342', '未知').summary.errorCount, 1); assert.equal(scoreQuickEntryRaw({ standard: null, examStandardId: national.id, grade: '初一', testItem: item('50m'), gender: 'unspecified', rawValue: 8 }).examScore, null) })
  const match = (overrides: Partial<Parameters<typeof matchExcelStudent>[0]>) => matchExcelStudent({ classId: klass.id, students: [male, female], excelRow: 2, studentNo: male.studentNo, studentName: male.name, gender: male.gender, ...overrides })
  for (const overrides of [{ studentName: '其他人' }, { gender: 'female' as const }, { studentId: female.id }, { studentNo: '' , students: [male, { ...male, id: female.id }] }]) await check(`身份冲突 ${JSON.stringify(overrides)}`, () => assert.equal(match(overrides).kind, 'needs_confirm'))
  await check('跨班同学号不串班', () => { assert.equal(match({ students: [{ ...male, id: female.id, classId: 'other' }, male] }).student?.id, male.id); assert(!plan(batch('50m', 8).rows.map(row => ({ ...row, className: '2班' }))).ok) })
  await check('同一源行身份不一致拒绝整批', () => { const rows = batch('50m', 8).rows; assert(!plan([...rows, { ...rows[0], studentName: '其他人' }]).ok) })
  await check('入库拒绝伪造预览得分', () => assert(!plan(batch('50m', 8).rows.map(row => ({ ...row, score: 999 }))).ok))
  await check('国家体测年级不一致拒绝', () => assert(!plan(batch('50m', 8, '男', nationalBatchStandard('初二')).rows).ok))
  for (const override of [{ studentId: female.id }, { sourceClassId: 'other' }, { sourceGrade: '初三' }]) await check(`源身份字段冲突 ${JSON.stringify(override)}`, () => assert(!plan(batch('50m', 8).rows.map(row => ({ ...row, ...override }))).ok))
  await check('同名项目多个候选不自动评分', () => {
    const ambiguous = { ...national, items: [...national.items, { ...national.items.find(i => i.itemKey === '50m')!, id: 'other-sprint', itemKey: 'other-sprint' }] }
    assert.equal(batch('50m', 8, '男', ambiguous).summary.errorCount, 1)
  })
  await check('长表成绩列明确秒优先于MMSS', () => {
    const snapshot = sheet(['姓名', '性别', '项目', '成绩(秒)'], [['张三', '男', '1000米跑', 342]])
    const result = convertWorkbookExamBatch(national, snapshot, detectWorkbookColumns(snapshot.columns.map(c => c.title), national, snapshot.rows))
    assert.equal(result.rows[0].rawValueParsed, 342)
  })
  for (const grade of ['初一', '初二', '初三'] as const) for (const gender of ['male', 'female'] as const) await check(`国家体测全项目 ${grade} ${gender}`, () => {
    const standard = nationalBatchStandard(grade)
    const values: Record<string, string> = { height: '165', weight: '50', bmi: '18.4', '50m': '8', 'vital-capacity': '3500', 'sit-and-reach': '18', 'standing-long-jump': '230', 'pull-up': '12', 'sit-up-1min': '45', 'run-1000m': '342', 'run-800m': '342' }
    for (const exam of standard.items.filter(entry => entry.gender === 'all' || entry.gender === gender)) {
      const result = batch(exam.itemKey, values[exam.itemKey], gender === 'male' ? '男' : '女', standard)
      assert.equal(result.summary.errorCount, 0, `${exam.itemKey}: ${JSON.stringify(result.rows)}`)
      if (!['height', 'weight'].includes(exam.itemKey)) {
        const scored = calculateNationalFitnessScore({ grade, gender, itemKey: exam.itemKey, rawValue: result.rows[0].rawValueParsed! })
        assert(scored.ok); assert.equal(result.rows[0].score, scored.finalItemScore)
      }
    }
  })
  await check('身高米+体重kg派生BMI、三项均可入库', () => {
    const snapshot = withDerivedBmi(sheet(['学号', '姓名', '性别', '身高(m)', '体重(kg)'], [['01', '张三', '男', 1.65, 50]]), national)
    const converted = convertWorkbookExamBatch(national, snapshot, detectWorkbookColumns(snapshot.columns.map(c => c.title), national, snapshot.rows))
    const planned = plan(converted.rows); assert(planned.ok, planned.errors.join(';')); assert.equal(planned.sessions.length, 3)
    assert.equal(planned.sessions.find(s => s.testItemId === item('bmi').id)!.records[0].rawValue, 18.4)
  })
  const original = create('run-1000m', [male, { ...female, gender: 'male' }])
  original.records = original.records.map((r, index) => ({ ...r, rawValue: index ? 222 : 342, rawOriginal: index ? '3.42' : '342', status: 'valid', examScore: 71 + index, baseScore: 70 + index, bonusScore: 1, scoreOutcome: 'official' }))
  for (const title of ['仅打开保存', '修改标题', '修改备注', '评分表改变']) await check(`历史保护 ${title}`, () => {
    const draft = { ...original, title, notes: '备注', records: original.records.map(r => ({ ...r, note: '备注' })) }
    const saved = applyPeTestEdits({ draft, inputs: { [draft.records[0].id]: '342' }, changedIds: new Set(), testItem: item('run-1000m'), items: BUILTIN_TEST_ITEMS, standard: { ...city, items: [] }, nowIso: now })
    assert.deepEqual(saved.records, draft.records); assert.equal(saved.records[0].rawValue, 342)
  })
  await check('只改一人完整保留另一人成绩', () => {
    const saved = applyPeTestEdits({ draft: original, inputs: { [original.records[0].id]: '342' }, changedIds: new Set([original.records[0].id]), testItem: item('run-1000m'), items: BUILTIN_TEST_ITEMS, standard: null, nowIso: now })
    assert.equal(saved.records[0].rawValue, 222); assert.deepEqual(saved.records[1], original.records[1])
  })
  await check('学生改名转班升级改性别后历史页面导出一致', () => {
    const changed = [{ ...male, name: '新姓名', gender: 'female' as const, classId: 'other' }, { ...female, gender: 'male' as const }]
    assertPeTestSaveIdentity([original], [original], changed, BUILTIN_TEST_ITEMS)
    const closure = buildPeTestClosure({ session: original, allSessions: [original], testItem: item('run-1000m'), classes: [{ ...klass, grade: '初三', className: '新班' }] })
    const exported = buildPeTestSessionExportRows(original)
    assert.equal(closure.classLabel, exported[0].班级)
    assert.equal(exported[0].姓名, male.name); assert.equal(exported[0].性别, '男')
    for (let i = 0; i < closure.rows.length; i++) { assert.equal(closure.rows[i].rawText, exported[i].原始成绩); assert.equal(closure.rows[i].scoreText, exported[i].换算分) }
  })
  await check('未知新学生及跨班写入拒绝', () => assert.throws(() => assertPeTestSaveIdentity([original], [], [{ ...male, classId: 'other' }], BUILTIN_TEST_ITEMS)))
  await check('历史身份快照不可替换', () => assert.throws(() => assertPeTestSaveIdentity([{ ...original, records: original.records.map(r => ({ ...r, genderSnapshot: 'female' })) }], [original], [male, female], BUILTIN_TEST_ITEMS)))
  await check('并发旧版本不能覆盖其他学生最新成绩', () => { const latest = structuredClone(original); latest.records[1].rawValue = 300; assert.throws(() => assertCollectionUnchanged([latest], [original]), /DATA_CONFLICT/); assert.equal(latest.records[1].rawValue, 300) })
  await check('组合与拆分项目双向重复检测', () => {
    const group = { ...original, testGroupId: GENDER_LINKED_TEST_GROUPS[0].id }
    assert.equal(findDuplicatePeTests([group], klass.id, group.date, item('run-800m').id).length, 1)
    assert.equal(findTeacherVisibleDuplicates([original], klass.id, original.date, { kind: 'group', group: GENDER_LINKED_TEST_GROUPS[0], anchor: item('run-1000m') }).length, 1)
    assert(!plan(batch('run-1000m', '342').rows, national, [group]).ok)
  })
  await check('重复导入及空值不能覆盖历史', () => {
    const planned = plan(batch('run-1000m', '342').rows); assert(planned.ok)
    const old = structuredClone(planned.sessions)
    assert(!plan(batch('run-1000m', '').rows, national, old).ok)
    const merged = mergePeTestsAtomically(old, planned.sessions, 'skip'); assert(merged.ok); assert.deepEqual(merged.next, old)
  })
  await check('旧版列映射路径长跑也按MMSS', () => {
    const snapshot = sheet(['姓名', '性别', '1000米跑'], [['张三', '男', 342]])
    const titles = snapshot.columns.map(c => c.title), mapping = suggestColumnMapping(titles, national).mapping
    assert.equal(convertExamBatch(national, mapping, snapshot.rows, titles).rows[0].rawValueParsed, 222)
  })
  await check('旧版映射未知项目不得静默跳过', () => {
    const snapshot = sheet(['姓名', '性别', '50米', '未知项目'], [['张三', '男', 8, 7]])
    const titles = snapshot.columns.map(c => c.title)
    assert.equal(convertExamBatch(national, suggestColumnMapping(titles, national).mapping, snapshot.rows, titles).summary.errorCount, 1)
  })
  await check('真实XLSX序列化、读取、入库、历史导出往返', () => {
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['学号', '姓名', '性别', '1000米跑(总秒数)', 'BMI'], ['01', '张三', '男', 342, 18.4]]), '成绩')
    const loaded = XLSX.read(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }), { type: 'buffer' }).Sheets['成绩']
    const snapshot = worksheetRowsToSnapshot(XLSX.utils.sheet_to_json(loaded, { header: 1, raw: false }), XLSX.utils.sheet_to_json(loaded, { header: 1, raw: true }), 'fixture.xlsx', '成绩')
    const rows = convertWorkbookExamBatch(national, snapshot, detectWorkbookColumns(snapshot.columns.map(c => c.title), national, snapshot.rows)).rows
    const imported = plan(rows); assert(imported.ok, imported.errors.join(';'))
    assert.equal(imported.sessions.find(s => s.testItemId === item('run-1000m').id)!.records[0].rawValue, 342)
    for (const session of imported.sessions) {
      const output = buildPeTestSessionExportPayload(session)
      const wb = XLSX.utils.book_new()
      for (const entry of output.sheets) XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(entry.rows), entry.name)
      const reread = XLSX.read(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }), { type: 'buffer' })
      const values: unknown[][] = XLSX.utils.sheet_to_json(reread.Sheets[reread.SheetNames[0]], { header: 1 })
      assert(values.flat().includes('张三')); assert(values.flat().includes(buildPeTestSessionExportRows(session)[0].原始成绩))
    }
  })
  await check('缺考免考未测残留0分不纳入统计', () => {
    const draft = create('50m', [male])
    const scored = { ...draft.records[0], status: 'valid' as const, rawValue: 8, examScore: 90, baseScore: 90 }
    draft.records = [scored, ...(['absent', 'exempt', 'pending'] as const).map((status, i) => ({ ...scored, id: `${scored.id}-${i}`, status, rawValue: null, examScore: 0 }))]
    const closure = buildPeTestClosure({ session: draft, allSessions: [draft], testItem: item('50m'), classes: [klass] })
    assert.equal(closure.summary.scoredCount, 1); assert.equal(closure.summary.averageScoreText, '90'); assert.equal(closure.passCount, 1)
    assert.equal(closure.summary.bands?.counts.improve, 0)
    const exported = buildPeTestSessionExportRows(draft)
    assert(exported.slice(1).every(row => row.换算分 === '—'))
  })
  for (const fail of [false, true]) await check(`国家体测事务${fail ? '失败回滚' : '成功落盘并拒绝重复'}`, async () => {
    const directory = await mkdtemp(join(tmpdir(), 'gdpe-pe-import-'))
    const path = join(directory, 'pe-tests.json')
    await writeJsonItemsAtomic(path, [])
    const read = async () => parsePeTestSessions(JSON.parse(await readFile(path, 'utf8')).items)
    let writes = 0
    try {
    const rows = batch('50m', 8).rows
    const payload = buildExamBatchPeTestImportPayload({ classId: klass.id, testDate: '2026-09-25', standard: national, rows, duplicateAction: 'cancel' })
    const stores = { loadClasses: async () => [klass], loadStudents: async () => [male, female], loadTestItems: async () => BUILTIN_TEST_ITEMS, loadPeTests: read, savePeTests: async (next: PETestSession[]) => { const parsed = parsePeTestSessions(next); await writeJsonItemsAtomic(path, parsed); if (fail && ++writes === 1) throw new Error('模拟暂存后失败'); return parsed }, nowIso: now }
    if (fail) { await assert.rejects(executeImportExamBatchToPeTests(payload, stores), /已回滚/); assert.deepEqual(await read(), []) }
    else { const result = await executeImportExamBatchToPeTests(payload, stores); assert.equal(result.validCount, 1); const before = await read(); await assert.rejects(executeImportExamBatchToPeTests(payload, stores)); assert.deepEqual(await read(), before) }
    } finally { await rm(directory, { recursive: true, force: true }) }
  })
  console.log(`PE V1 regression: ${count} passed`)
}
main().catch(error => { console.error(error); process.exitCode = 1 })
