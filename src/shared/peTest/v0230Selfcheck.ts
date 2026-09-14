import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as XLSX from 'xlsx'
import type { ClassRecord } from '../class/types'
import { listBuiltinExamStandards } from '../examStandard/catalog'
import { convertWorkbookExamBatch, detectWorkbookColumns } from '../examBatch/workbook'
import { worksheetRowsToSnapshot } from '../examBatch/readSheet'
import { executeImportExamBatchToPeTests } from '../examBatch/peTestImport/execute'
import { buildExamBatchPeTestImportPayload } from '../examBatch/peTestImport/entry'
import { findDuplicatePeTests } from '../examBatch/peTestImport/planImport'
import { resolveExamItemToTestItem } from '../examBatch/peTestImport/resolveTestItem'
import type { StudentRecord } from '../student/types'
import { BUILTIN_TEST_ITEMS } from './builtinItems'
import { applyQuickEntry } from './quickEntry'
import { parseQuickEntryInput } from './quickEntry/parse'
import { buildPeTestClosure, canMarkTestComplete, filterPeTestDetailRows } from './detail'
import { createPeTestId, createPeTestRecordId, parsePeTestSessions } from './validate'
import type { PETestRecord, PETestSession, TestItem, TestRecordStatus } from './types'
import { classifyScoreBand, summarizeSingleTest } from '../statistics/analytics'
import { calculateExamScore } from '../examStandard/score'
import {
  actualTestItemName,
  findTeacherVisibleDuplicates,
  GENDER_LINKED_TEST_GROUPS,
  MIDDLE_LONG_RUN_GROUP_ID,
  parseTeacherTestSelection,
  resolveActualTestItem,
  resolveLinkedTestItem,
  teacherSelectableTestOptions,
  UNRESOLVED_LINKED_ITEM_MESSAGE
} from './groupedItems'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function readSrc(relative: string): string {
  return readFileSync(resolve(process.cwd(), relative), 'utf8')
}

const NOW = '2026-09-11T06:00:00.000Z'
const CLASS_ID = 'class-d215d4a4-bbe5-4aaa-8aaa-aaaaaaaa0230'
const DATE = '2026-09-11'

function student(seq: string, no: string, name: string, gender: StudentRecord['gender'], status: StudentRecord['status'] = 'active'): StudentRecord {
  return {
    id: `student-d215d4a4-bbe5-4aaa-8aaa-aaaaaaaa02${seq}`,
    classId: CLASS_ID,
    studentNo: no,
    name,
    gender,
    status,
    notes: '',
    createdAt: NOW,
    updatedAt: NOW
  }
}

const CLASS: ClassRecord = {
  id: CLASS_ID,
  className: '初一9班',
  grade: '初一',
  academicYear: '2025-2026',
  semester: '第一学期',
  studentCount: 4,
  notes: 'v0.23.0 temp fixture',
  status: 'active',
  createdAt: NOW,
  updatedAt: NOW
}

function item(key: string): TestItem {
  const found = BUILTIN_TEST_ITEMS.find((entry) => entry.builtinKey === key)
  assert(found, key)
  return found
}

function rec(
  sessionId: string,
  student: StudentRecord,
  status: TestRecordStatus,
  rawValue: number | null,
  examScore: number | null
): PETestRecord {
  return {
    id: createPeTestRecordId(),
    testSessionId: sessionId,
    studentId: student.id,
    nameSnapshot: student.name,
    studentNoSnapshot: student.studentNo,
    genderSnapshot: student.gender,
    rawValue,
    status,
    note: '',
    createdAt: NOW,
    updatedAt: NOW,
    examScore,
    rawOriginal: '',
    examItemId: null
  }
}

function sessionOf(records: PETestRecord[], extra?: Partial<PETestSession>): PETestSession {
  const run = item('run-1000m')
  const id = records[0]?.testSessionId ?? createPeTestId()
  return {
    id,
    classId: CLASS_ID,
    testItemId: run.id,
    date: DATE,
    title: '初一9班 · 1000米',
    notes: '',
    classNameSnapshot: CLASS.className,
    gradeSnapshot: CLASS.grade,
    testItemNameSnapshot: run.name,
    unitSnapshot: run.unit,
    customUnitLabelSnapshot: run.customUnitLabel,
    directionSnapshot: run.direction,
    valueTypeSnapshot: run.valueType,
    timeInputModeSnapshot: run.timeInputMode,
    createdAt: NOW,
    updatedAt: NOW,
    records,
    importSource: 'manual',
    examStandardId: 'cn-gd-guangzhou-middle-2024-2026',
    scoringCitySnapshot: '广州',
    scoringVersionSnapshot: '2024–2026',
    ...extra
  }
}

function snapshotFromAoa(aoa: unknown[][]) {
  const sheet = XLSX.utils.aoa_to_sheet(aoa)
  return worksheetRowsToSnapshot(
    XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: '', blankrows: true }),
    XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: '', blankrows: true }),
    'temp-v0230.xlsx',
    'Sheet1'
  )
}

export async function runV0230PeTestResultClosureSelfCheck(): Promise<string> {
  const page = readSrc('src/renderer/src/pages/PeTestsPage.tsx')
  const detail = readSrc('src/renderer/src/components/PeTestDetailPanel.tsx')
  const analytics = readSrc('src/shared/statistics/analytics.ts')
  const closureSrc = readSrc('src/shared/peTest/detail.ts')

  assert(page.includes('测试详情') && page.includes('<PeTestDetailPanel'), 'B. 测试详情页')
  assert(detail.includes('继续录入') && detail.includes('查看完整测试分析'), 'J/O. 继续录入与完整分析')
  assert(detail.includes('summarizeSingleTest') === false && closureSrc.includes('summarizeSingleTest'), 'N. 统计复用 analytics')
  assert(!detail.includes('score < 60') && closureSrc.includes('classifyScoreBand'), 'N. 不及格走评分规则')
  assert(page.includes('sessionId: live.id') && page.includes('setQuickEntry'), 'J. 继续录入定位原测试')

  const s1 = student('01', '1', '张三', 'male')
  const s2 = student('02', '2', '李四', 'male')
  const s3 = student('03', '3', '王五', 'male')
  const s4 = student('04', '4', '赵六', 'male')
  const run = item('run-1000m')
  const sid = createPeTestId()
  const allValid = sessionOf([
    rec(sid, s1, 'valid', 222, 95),
    rec(sid, s2, 'valid', 240, 80)
  ])
  const cA = buildPeTestClosure({ session: allValid, allSessions: [allValid], testItem: run, classes: [CLASS] })
  assert(cA.valid === 2 && cA.pending === 0 && cA.complete, 'A. 全部 valid')
  assert(cA.summary.scoredCount === 2, 'H. 有效样本 n')
  assert(cA.summary.averageScoreText !== '0', 'I. 平均分')
  assert(cA.summary.averageScoreText === '87.50', 'I. 平均分 87.50')
  assert(cA.summary.maxScoreText === '95' && cA.summary.minScoreText === '80', 'J. 最高/最低')

  const withAbsent = sessionOf([
    rec(sid, s1, 'valid', 222, 95),
    rec(sid, s2, 'absent', null, null)
  ])
  const cB = buildPeTestClosure({ session: withAbsent, allSessions: [withAbsent], testItem: run, classes: [CLASS] })
  assert(cB.absent === 1 && cB.valid === 1 && cB.summary.scoredCount === 1, 'B/L. valid + absent')
  assert(cB.rows.find((row) => row.record.status === 'absent')?.scoreText === '—', 'E. absent 显示 ——')
  assert(cB.summary.averageScoreText === '95', 'F. absent 不进平均分')

  const withExempt = sessionOf([
    rec(sid, s1, 'valid', 222, 95),
    rec(sid, s2, 'exempt', null, null)
  ])
  const cC = buildPeTestClosure({ session: withExempt, allSessions: [withExempt], testItem: run, classes: [CLASS] })
  assert(cC.exempt === 1 && cC.summary.scoredCount === 1, 'C/M. valid + exempt')
  assert(cC.summary.averageScoreText === '95', 'G. exempt 不进平均分')

  const withPending = sessionOf([
    rec(sid, s1, 'valid', 222, 95),
    rec(sid, s2, 'pending', null, null)
  ])
  const cD = buildPeTestClosure({ session: withPending, allSessions: [withPending], testItem: run, classes: [CLASS] })
  assert(cD.pending === 1 && !cD.complete && !canMarkTestComplete(cD), 'D/K. valid + pending 未完成')
  assert(cD.summary.scoredCount === 1 && cD.summary.minScoreText === '95', 'E. pending 不进最低分')
  assert(cD.rows.find((row) => row.record.status === 'pending')?.scoreText === '—', 'E. pending 不是 0 分')
  assert(filterPeTestDetailRows(cD.rows, 'pending', '').length === 1, '未测筛选')
  assert(filterPeTestDetailRows(cD.rows, 'all', '李').length === 1, 'I. 搜索学生')

  const failSession = sessionOf([
    rec(sid, s1, 'valid', 222, 95),
    rec(sid, s2, 'valid', 400, 42)
  ])
  const cFail = buildPeTestClosure({ session: failSession, allSessions: [failSession], testItem: run, classes: [CLASS] })
  if (cFail.failCount !== null) {
    assert(cFail.failCount === 1 && classifyScoreBand(42, 100) === 'improve', '不及格走 classifyScoreBand')
    assert(filterPeTestDetailRows(cFail.rows, 'fail', '').length === 1, 'H. 不及格筛选')
  }

  let qe = sessionOf([rec(createPeTestId(), s1, 'pending', null, null), rec(createPeTestId(), s2, 'pending', null, null)])
  qe = {
    ...qe,
    records: qe.records.map((row, index) => ({ ...row, testSessionId: qe.id, id: qe.records[index].id }))
  }
  const gz = listBuiltinExamStandards().find((entry) => entry.id === 'cn-gd-guangzhou-middle-2024-2026')
  const entered = applyQuickEntry({
    session: qe,
    testItem: run,
    recordId: qe.records[0].id,
    action: { type: 'score', input: '342' },
    standard: gz ?? null,
    nowIso: NOW
  })
  assert(entered.ok, 'O. 快速录入')
  const afterQe = buildPeTestClosure({
    session: entered.session,
    allSessions: [entered.session],
    testItem: run,
    classes: [CLASS]
  })
  assert(afterQe.valid === 1 && afterQe.pending === 1, 'O. 快速录入后详情统计')
  let store = parsePeTestSessions([entered.session])
  const again = applyQuickEntry({
    session: entered.session,
    testItem: run,
    recordId: entered.session.records[0].id,
    action: { type: 'score', input: '340' },
    standard: gz ?? null,
    nowIso: NOW
  })
  store = parsePeTestSessions([again.session])
  assert(store.length === 1 && store[0].records.length === 2, 'P. 继续录入不新建测试')
  assert(findDuplicatePeTests(store, CLASS_ID, DATE, run.id).length === 1, 'P. 防重复')

  const transferred = student('03', '3', '王五', 'male', 'transferred')
  const deleted = student('04', '4', '赵六', 'male', 'deleted')
  const hist = sessionOf([rec(sid, transferred, 'valid', 222, 90), rec(sid, deleted, 'valid', 230, 88)])
  const cHist = buildPeTestClosure({ session: hist, allSessions: [hist], testItem: run, classes: [CLASS] })
  assert(cHist.roster === 2 && cHist.summary.scoredCount === 2, 'Q. deleted/transferred 历史仍统计快照')

  const otherStd = sessionOf(allValid.records, {
    examStandardId: 'cn-gd-shaoguan-middle-2026',
    scoringCitySnapshot: '韶关',
    scoringVersionSnapshot: '2026'
  })
  const mixed = buildPeTestClosure({
    session: allValid,
    allSessions: [allValid, otherStd],
    testItem: run,
    classes: [CLASS]
  })
  assert(mixed.summary.scoringStandardChanged || mixed.standardLabel.includes('广州'), 'R. 不同标准不混成一份详情')

  const guangzhou = gz
  assert(guangzhou, '广州')
  const mixedSheet = convertWorkbookExamBatch(
    guangzhou,
    snapshotFromAoa([
      ['姓名', '学号', '性别', '1000米'],
      ['张三', '1', '男', '3:42'],
      ['李四', '2', '男', '缺考']
    ]),
    detectWorkbookColumns(['姓名', '学号', '性别', '1000米'], guangzhou)
  )
  let imported: PETestSession[] = []
  const result = await executeImportExamBatchToPeTests(
    buildExamBatchPeTestImportPayload({
      classId: CLASS_ID,
      testDate: DATE,
      standard: guangzhou,
      duplicateAction: 'cancel',
      rows: mixedSheet.rows
    }),
    {
      loadClasses: async () => [CLASS],
      loadStudents: async () => [s1, s2, s3, s4],
      loadTestItems: async () => [...BUILTIN_TEST_ITEMS],
      loadPeTests: async () => imported,
      savePeTests: async (items) => {
        imported = parsePeTestSessions(items)
        return imported
      },
      nowIso: NOW
    }
  )
  assert(result.createdCount >= 1, 'N. Excel 写入')
  const importedSession = imported[0]
  const cImport = buildPeTestClosure({
    session: importedSession,
    allSessions: imported,
    testItem: BUILTIN_TEST_ITEMS.find((entry) => entry.id === importedSession.testItemId),
    classes: [CLASS]
  })
  assert(cImport.absent + cImport.valid >= 1, 'N. Excel 导入后详情统计可读')
  assert(cImport.rows.every((row) => row.record.examScore !== 0 || row.record.status === 'valid'), 'Excel 缺考不是 0')

  const testsPage = page
  const options = teacherSelectableTestOptions(BUILTIN_TEST_ITEMS)
  assert(GENDER_LINKED_TEST_GROUPS.length === 1 && GENDER_LINKED_TEST_GROUPS[0].id === MIDDLE_LONG_RUN_GROUP_ID, 'A. 仅一组组合项目')
  assert(options.some((entry) => entry.label === '800米 / 1000米'), 'A. 组合项目800米/1000米存在')
  assert(!options.some((entry) => entry.kind === 'item' && (entry.item.builtinKey === 'run-800m' || entry.item.builtinKey === 'run-1000m')), '入口不重复显示800/1000')
  assert(testsPage.includes('teacherSelectableTestOptions') && testsPage.includes('teacherOptions'), '入口走选择层')
  const standardsPage = readSrc('src/renderer/src/pages/ExamStandardsPage.tsx')
  assert(BUILTIN_TEST_ITEMS.some((entry) => entry.builtinKey === 'run-800m') && BUILTIN_TEST_ITEMS.some((entry) => entry.builtinKey === 'run-1000m'), 'O. catalog 仍独立 800/1000')
  assert(!standardsPage.includes('teacherSelectableTestOptions'), 'O. 评分标准页面不走组合选择层')

  const run1000 = item('run-1000m')
  const run800 = item('run-800m')
  const group = GENDER_LINKED_TEST_GROUPS[0]
  const maleMap = resolveLinkedTestItem(group, 'male', BUILTIN_TEST_ITEMS)
  const femaleMap = resolveLinkedTestItem(group, 'female', BUILTIN_TEST_ITEMS)
  assert(maleMap.ok && maleMap.item.builtinKey === 'run-1000m', 'B. 男生自动解析1000米')
  assert(femaleMap.ok && femaleMap.item.builtinKey === 'run-800m', 'C. 女生自动解析800米')
  assert(!resolveLinkedTestItem(group, 'unspecified', BUILTIN_TEST_ITEMS).ok, 'L. 性别未知拒绝映射')

  const girl = student('11', '19', '李七', 'female')
  const boy2 = student('12', '20', '周八', 'male')
  const unknown = student('13', '21', '未知', 'unspecified')
  const groupedId = createPeTestId()
  let grouped = sessionOf(
    [rec(groupedId, s1, 'pending', null, null), rec(groupedId, girl, 'pending', null, null), rec(groupedId, boy2, 'pending', null, null)],
    {
      testGroupId: MIDDLE_LONG_RUN_GROUP_ID,
      testItemNameSnapshot: '800米 / 1000米',
      title: '初一9班 · 800米 / 1000米'
    }
  )
  grouped = {
    ...grouped,
    records: grouped.records.map((row) => ({ ...row, testSessionId: grouped.id }))
  }
  assert(guangzhou, '广州标准')
  const parseMale = parseQuickEntryInput('342', run1000)
  const parseFemale = parseQuickEntryInput('342', run800)
  assert(parseMale.ok && parseMale.rawValue === 222 && parseFemale.ok && parseFemale.rawValue === 222, '长跑 parser 复用')

  const maleEnter = applyQuickEntry({
    session: grouped,
    testItem: run1000,
    recordId: grouped.records[0].id,
    action: { type: 'score', input: '342' },
    standard: guangzhou,
    nowIso: NOW,
    items: BUILTIN_TEST_ITEMS
  })
  assert(maleEnter.ok, 'D. 男生342录入')
  const maleRow = maleEnter.session.records[0]
  assert(maleRow.rawValue === 222 && maleRow.resolvedTestItemId === run1000.id, 'D/K. 男→1000米 222秒')
  const maleEngine = calculateExamScore({
    standard: guangzhou,
    itemId: 'male-1000m',
    rawValue: 222,
    gender: 'male',
    officialOnly: true
  })
  assert(maleEngine.ok && maleRow.examScore === maleEngine.score && maleRow.examItemId === 'male-1000m', 'D. 男342走1000米评分')

  const femaleEnter = applyQuickEntry({
    session: maleEnter.session,
    testItem: run1000,
    recordId: maleEnter.session.records[1].id,
    action: { type: 'score', input: '342' },
    standard: guangzhou,
    nowIso: NOW,
    items: BUILTIN_TEST_ITEMS
  })
  assert(femaleEnter.ok, 'E. 女生342录入')
  const femaleRow = femaleEnter.session.records[1]
  assert(femaleRow.rawValue === 222 && femaleRow.resolvedTestItemId === run800.id, 'E/K. 女→800米 222秒')
  const femaleEngine = calculateExamScore({
    standard: guangzhou,
    itemId: 'female-800m',
    rawValue: 222,
    gender: 'female',
    officialOnly: true
  })
  assert(femaleEngine.ok && femaleRow.examScore === femaleEngine.score && femaleRow.examItemId === 'female-800m', 'E. 女342走800米评分')
  assert(femaleEnter.session.records[0].resolvedTestItemId === run1000.id, 'F. 切到女生不污染上一人 testItemId')

  const backMale = applyQuickEntry({
    session: femaleEnter.session,
    testItem: run1000,
    recordId: femaleEnter.session.records[2].id,
    action: { type: 'score', input: '342' },
    standard: guangzhou,
    nowIso: NOW,
    items: BUILTIN_TEST_ITEMS
  })
  assert(
    backMale.ok &&
      backMale.session.records.map((row) => row.resolvedTestItemId).join(',') === `${run1000.id},${run800.id},${run1000.id}`,
    'G. 男→女→男 底层 1000→800→1000'
  )

  const selection = parseTeacherTestSelection(`group:${MIDDLE_LONG_RUN_GROUP_ID}`, BUILTIN_TEST_ITEMS)
  assert(selection?.kind === 'group', '组合选择可解析')
  const visible = findTeacherVisibleDuplicates([backMale.session], CLASS_ID, DATE, selection)
  assert(visible.length === 1, 'H. 组合项目只生成一场老师可见测试')
  assert(new Set(backMale.session.records.map((row) => row.studentId)).size === backMale.session.records.length, 'I. 每名学生一条')
  assert(
    !backMale.session.records.some(
      (row) => row.genderSnapshot === 'male' && row.resolvedTestItemId === run800.id
    ) &&
      !backMale.session.records.some((row) => row.genderSnapshot === 'female' && row.resolvedTestItemId === run1000.id),
    'I. 不会为同一学生同时生成800和1000'
  )

  const groupedClosure = buildPeTestClosure({
    session: backMale.session,
    allSessions: [backMale.session],
    testItem: run1000,
    classes: [CLASS]
  })
  assert(groupedClosure.itemName === '800米 / 1000米', 'J. 测试详情聚合为800米/1000米')
  assert(
    groupedClosure.rows[0].resolvedItemName === run1000.name && groupedClosure.rows[1].resolvedItemName === run800.name,
    'K. 学生成绩仍保留真实底层项目'
  )

  const unknownSession = sessionOf([rec(createPeTestId(), unknown, 'pending', null, null)], {
    testGroupId: MIDDLE_LONG_RUN_GROUP_ID,
    testItemNameSnapshot: '800米 / 1000米'
  })
  const unknownEnter = applyQuickEntry({
    session: unknownSession,
    testItem: run1000,
    recordId: unknownSession.records[0].id,
    action: { type: 'score', input: '342' },
    standard: guangzhou,
    nowIso: NOW,
    items: BUILTIN_TEST_ITEMS
  })
  assert(!unknownEnter.ok && unknownEnter.message === UNRESOLVED_LINKED_ITEM_MESSAGE, 'L. 性别未知 fail-closed')
  assert(unknownEnter.session.records[0].rawValue === null && unknownEnter.session.records[0].examScore === null, 'L. 不自动评分')

  const mixedRaw = summarizeSingleTest(backMale.session, [backMale.session], run1000, [CLASS])
  assert(mixedRaw.averageRawText === '—' && mixedRaw.bestRawText === '—' && mixedRaw.itemName === '800米 / 1000米', 'P. 原始成绩不混算800/1000')
  assert(mixedRaw.averageScoreText !== '—', 'P. 得分可男女合并')

  const col1000 = detectWorkbookColumns(['姓名', '学号', '性别', '1000米'], guangzhou)
  const col800 = detectWorkbookColumns(['姓名', '学号', '性别', '800米'], guangzhou)
  assert(col1000.itemColumns.some((entry) => entry.matchedItemKey === 'run-1000m' || entry.matchedItemId === 'male-1000m'), 'M. Excel 1000米列仍识别')
  assert(col800.itemColumns.some((entry) => entry.matchedItemKey === 'run-800m' || entry.matchedItemId === 'female-800m'), 'N. Excel 800米列仍识别')
  const sheet800 = convertWorkbookExamBatch(
    guangzhou,
    snapshotFromAoa([
      ['姓名', '学号', '性别', '800米'],
      ['李七', '19', '女', '3:42']
    ]),
    col800
  )
  assert(sheet800.rows.some((row) => row.examItemId === 'female-800m' && row.rawValueParsed === 222), 'N. Excel 800米解析')
  const sheet1000 = convertWorkbookExamBatch(
    guangzhou,
    snapshotFromAoa([
      ['姓名', '学号', '性别', '1000米'],
      ['张三', '1', '男', '3:42']
    ]),
    col1000
  )
  assert(sheet1000.rows.some((row) => row.examItemId === 'male-1000m'), 'M. Excel 1000米解析')

  const pendingGirl = rec(createPeTestId(), girl, 'pending', null, null)
  const pendingBoy = rec(createPeTestId(), s1, 'pending', null, null)
  const pendingMixed = sessionOf([pendingGirl, pendingBoy], {
    testGroupId: MIDDLE_LONG_RUN_GROUP_ID,
    testItemId: run1000.id,
    testItemNameSnapshot: '800米 / 1000米'
  })
  const wrongSnapshot = {
    ...pendingMixed,
    records: pendingMixed.records.map((row) => ({ ...row, resolvedTestItemId: run1000.id }))
  }
  const pendingClosure = buildPeTestClosure({
    session: wrongSnapshot,
    allSessions: [wrongSnapshot],
    testItem: run1000,
    classes: [CLASS]
  })
  const girlRow = pendingClosure.rows.find((row) => row.record.studentId === girl.id)
  const boyRow = pendingClosure.rows.find((row) => row.record.studentId === s1.id)
  assert(girlRow?.resolvedItemName === '800米', '1/7. 组合项目未录入女生显示800米')
  assert(boyRow?.resolvedItemName === '1000米', '2/7. 组合项目未录入男生显示1000米')
  const girlActual = resolveActualTestItem(
    wrongSnapshot,
    wrongSnapshot.records.find((row) => row.studentId === girl.id)!,
    BUILTIN_TEST_ITEMS
  )
  assert(girlActual.ok && girlActual.item.builtinKey === 'run-800m', '错误快照1000米仍按性别解析女生800米')

  const mixedIds = [girl, student('21', '1', '女一', 'female'), s1, student('22', '4', '女四', 'female'), student('23', '5', '女五', 'female'), boy2]
  const mixedPending = sessionOf(
    mixedIds.map((entry) => rec(createPeTestId(), entry, 'pending', null, null)),
    { testGroupId: MIDDLE_LONG_RUN_GROUP_ID, testItemId: run1000.id, testItemNameSnapshot: '800米 / 1000米' }
  )
  const mixedNames = mixedPending.records.map((row) => actualTestItemName(mixedPending, row, BUILTIN_TEST_ITEMS))
  assert(
    mixedPending.records.every((row) => {
      const actual = resolveActualTestItem(mixedPending, row, BUILTIN_TEST_ITEMS)
      return actual.ok && actual.item.builtinKey === (row.genderSnapshot === 'male' ? 'run-1000m' : 'run-800m')
    }),
    '5. 男女混合每名学生项目正确分流'
  )
  assert(mixedNames.includes('800米') && mixedNames.includes('1000米'), '5. 混合班同时出现800与1000')

  const qeGirl = applyQuickEntry({
    session: pendingMixed,
    testItem: run1000,
    recordId: pendingMixed.records.find((row) => row.studentId === girl.id)!.id,
    action: { type: 'score', input: '342' },
    standard: guangzhou,
    nowIso: NOW,
    items: BUILTIN_TEST_ITEMS
  })
  assert(qeGirl.ok && qeGirl.session.records.find((row) => row.studentId === girl.id)?.examItemId === 'female-800m', '3. 女生800米评分标准')
  const qeBoy = applyQuickEntry({
    session: qeGirl.ok ? qeGirl.session : pendingMixed,
    testItem: run1000,
    recordId: pendingMixed.records.find((row) => row.studentId === s1.id)!.id,
    action: { type: 'score', input: '342' },
    standard: guangzhou,
    nowIso: NOW,
    items: BUILTIN_TEST_ITEMS
  })
  assert(qeBoy.ok && qeBoy.session.records.find((row) => row.studentId === s1.id)?.examItemId === 'male-1000m', '4. 男生1000米评分标准')
  const scoredGirl = qeGirl.session.records.find((row) => row.studentId === girl.id)!
  const scoredGirlItem = resolveActualTestItem(qeGirl.session, scoredGirl, BUILTIN_TEST_ITEMS)
  assert(scoredGirlItem.ok && scoredGirlItem.item.builtinKey === 'run-800m', '6. 快速录入 actualItem 与解析一致')
  const excelGirlItem = BUILTIN_TEST_ITEMS.find((entry) => entry.builtinKey === 'run-800m')
  const excelBoyItem = BUILTIN_TEST_ITEMS.find((entry) => entry.builtinKey === 'run-1000m')
  assert(
    sheet800.rows.some((row) => row.examItemId === 'female-800m') &&
      excelGirlItem &&
      resolveExamItemToTestItem(
        guangzhou.items.find((entry) => entry.id === 'female-800m')!,
        BUILTIN_TEST_ITEMS
      )?.id === excelGirlItem.id &&
      resolveExamItemToTestItem(
        guangzhou.items.find((entry) => entry.id === 'male-1000m')!,
        BUILTIN_TEST_ITEMS
      )?.id === excelBoyItem?.id,
    '6. Excel 800/1000 列 actualItem 与快速录入一致'
  )

  const solo800 = sessionOf([rec(createPeTestId(), girl, 'valid', 222, 96)], {
    testItemId: run800.id,
    testItemNameSnapshot: run800.name,
    testGroupId: null
  })
  const solo1000 = sessionOf([rec(createPeTestId(), s1, 'valid', 222, 95)], {
    testItemId: run1000.id,
    testItemNameSnapshot: run1000.name,
    testGroupId: null
  })
  const c800 = buildPeTestClosure({ session: solo800, allSessions: [solo800], testItem: run800, classes: [CLASS] })
  const c1000 = buildPeTestClosure({ session: solo1000, allSessions: [solo1000], testItem: run1000, classes: [CLASS] })
  assert(c800.itemName === '800米' && c800.rows[0].resolvedItemName === '800米', '8. 独立800米历史不受影响')
  assert(c1000.itemName === '1000米' && c1000.rows[0].resolvedItemName === '1000米', '9. 独立1000米历史不受影响')

  assert(!page.includes('sqlite') && !detail.includes('writeFileSync'), 'Z. 无 SQLite / 不写文件')
  assert(analytics.includes('classifyScoreBand') && !analytics.includes('v0.23 rewrite'), '未重写 analytics')
  assert(page.includes('<PeQuickEntryPanel'), '复用快速录入')

  return 'v0.23.0 pe-test result closure self-check passed'
}

export async function runV0230PeTestResultClosureSelfCheckOrThrow(): Promise<string> {
  return runV0230PeTestResultClosureSelfCheck()
}
