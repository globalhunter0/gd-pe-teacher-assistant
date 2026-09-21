import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { applyQuickEntry } from './quickEntry'
import { pendingStudentIds, visibleQuickEntryRecords } from './quickEntry/roster'
import {
  buildPeTestSessionExportPayload,
  buildPeTestSessionExportRows,
  cloneSessionForExportGuard,
  escapeExcelText,
  peTestExportFileBaseName,
  peTestExportStatusLabel
} from './exportSession'
import { countPeTestSessionProgress, markPeTestSessionCompleted } from './sessionLifecycle'
import { BUILTIN_TEST_ITEMS } from './builtinItems'
import { createPeTestId, createPeTestRecordId, parsePeTestSessions } from './validate'
import { formatTestScore } from '../statistics/tests'
import type { PETestRecord, PETestSession, TestItem } from './types'

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

function readSrc(relative: string): string {
  return readFileSync(resolve(process.cwd(), relative), 'utf8')
}

const NOW = '2026-09-21T03:00:00.000Z'
const CLASS_ID = 'class-bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee'
const STUDENT_1 = 'student-bbbbbbbb-bbbb-4ccc-8ddd-aaaaaaaaaaa1'
const STUDENT_2 = 'student-bbbbbbbb-bbbb-4ccc-8ddd-aaaaaaaaaaa2'
const STUDENT_3 = 'student-bbbbbbbb-bbbb-4ccc-8ddd-aaaaaaaaaaa3'

function item(key: string): TestItem {
  const found = BUILTIN_TEST_ITEMS.find((entry) => entry.builtinKey === key)
  if (!found) {
    throw new Error(`missing item ${key}`)
  }
  return found
}

function rec(
  sessionId: string,
  studentId: string,
  status: PETestRecord['status'],
  rawValue: number | null,
  extra?: Partial<PETestRecord>
): PETestRecord {
  return {
    id: createPeTestRecordId(),
    testSessionId: sessionId,
    studentId,
    nameSnapshot: studentId === STUDENT_1 ? '甲' : studentId === STUDENT_2 ? '乙' : '丙',
    studentNoSnapshot: studentId === STUDENT_1 ? '01' : studentId === STUDENT_2 ? '02' : '03',
    genderSnapshot: 'male',
    rawValue,
    status,
    note: '',
    createdAt: NOW,
    updatedAt: NOW,
    examScore: null,
    rawOriginal: '',
    examItemId: null,
    ...extra
  }
}

function baseSession(records: PETestRecord[], extra?: Partial<PETestSession>): PETestSession {
  const run = item('run-1000m')
  const id = records[0]?.testSessionId ?? createPeTestId()
  return {
    id,
    classId: CLASS_ID,
    testItemId: run.id,
    date: '2026-09-21',
    title: '测试',
    notes: '',
    classNameSnapshot: '9班',
    gradeSnapshot: '初一',
    testItemNameSnapshot: run.name,
    unitSnapshot: run.unit,
    customUnitLabelSnapshot: run.customUnitLabel,
    directionSnapshot: run.direction,
    valueTypeSnapshot: run.valueType,
    timeInputModeSnapshot: run.timeInputMode,
    createdAt: NOW,
    updatedAt: NOW,
    records: records.map((row) => ({ ...row, testSessionId: id })),
    importSource: 'manual',
    examStandardId: null,
    scoringCitySnapshot: '',
    scoringVersionSnapshot: '',
    testGroupId: null,
    status: 'in_progress',
    completedAt: null,
    ...extra
  }
}

export function runV0260P02MakeupExportSelfCheckOrThrow(): string {
  const detail = readSrc('src/renderer/src/components/PeTestDetailPanel.tsx')
  const page = readSrc('src/renderer/src/pages/PeTestsPage.tsx')
  const panel = readSrc('src/renderer/src/components/PeQuickEntryPanel.tsx')
  const exportSrc = readSrc('src/shared/peTest/exportSession.ts')

  assert(detail.includes('补录未测学生') && detail.includes('onMakeupPending'), '详情页补测入口')
  assert(detail.includes('导出成绩') && detail.includes('onExportScores'), '详情页导出入口')
  assert(detail.includes('无未测学生'), '未测为 0 时禁用提示')
  assert(page.includes('rosterTab: \'pending\'') && page.includes('buildPeTestSessionExportPayload'), '页面接补测与导出')
  assert(page.includes('examBatch.saveWorkbook'), '复用 examBatch.saveWorkbook，无第二套 Excel 架构')
  assert(panel.includes('initialRosterTab') && panel.includes('initialGroupStudentIds'), '快速录入支持名单范围')
  assert(exportSrc.includes('escapeExcelText') && exportSrc.includes('classifyScoreBand'), '导出防注入且复用等级')
  assert(exportSrc.includes('formatPeTestItemScoreText') && exportSrc.includes('formatTestScore'), '导出复用评分展示')

  const sid = createPeTestId()
  const r1 = rec(sid, STUDENT_1, 'valid', 222, { examScore: 80 })
  const r2 = rec(sid, STUDENT_2, 'pending', null)
  const r3 = rec(sid, STUDENT_3, 'absent', null)
  let session = baseSession([r1, r2, r3])

  const pendingIds = pendingStudentIds(session.records)
  assert(pendingIds.length === 1 && pendingIds[0] === STUDENT_2, '1. 未测学生筛选正确')
  const pendingVisible = visibleQuickEntryRecords(session.records, {
    tab: 'pending',
    query: '',
    groupStudentIds: null
  })
  assert(pendingVisible.length === 1 && pendingVisible[0].studentId === STUDENT_2, '1. 未测可见列表')

  const run = item('run-1000m')
  const beforeId = session.id
  const beforeCount = session.records.length
  const entered = applyQuickEntry({
    session,
    testItem: run,
    recordId: r2.id,
    action: { type: 'score', input: '3.42' },
    standard: null,
    nowIso: NOW
  })
  assert(entered.ok, '补录 apply ok')
  session = entered.session
  assert(session.id === beforeId, '5. 原测试 session 不被复制')
  assert(session.records.length === beforeCount, '4. 同一学生不生成重复成绩记录')
  assert(session.records.filter((row) => row.studentId === STUDENT_2).length === 1, '4. 学生记录唯一')
  const measuredRow = session.records.find((row) => row.studentId === STUDENT_2)
  assert(measuredRow?.status === 'valid', '2. 补录后 unmeasured → measured')
  assert(countPeTestSessionProgress(session.records).unmeasured === 0, '2. 统计未测归零')
  assert(countPeTestSessionProgress(session.records).measured === 2, '7. 已测状态正确')

  const absentOnly = baseSession([rec(createPeTestId(), STUDENT_3, 'absent', null)])
  const absentedId = absentOnly.records[0].id
  const afterAbsentScore = applyQuickEntry({
    session: absentOnly,
    testItem: run,
    recordId: absentedId,
    action: { type: 'score', input: '3.40' },
    standard: null,
    nowIso: NOW
  })
  assert(afterAbsentScore.ok, '缺考补测 apply')
  assert(afterAbsentScore.session.records.length === 1, '4. 缺考补测不新增记录')
  assert(afterAbsentScore.session.records[0].status === 'valid', '3. 缺考学生补测后 absent → measured')
  assert(afterAbsentScore.session.records[0].rawValue !== null, '有效成绩覆盖缺考')
  assert(countPeTestSessionProgress(afterAbsentScore.session.records).absent === 0, '3. 不再计缺考')

  const exportSession = baseSession([
    rec(sid, STUDENT_1, 'valid', 222, { nameSnapshot: '=注入甲', note: '+危险备注', examScore: 85 }),
    rec(sid, STUDENT_2, 'pending', null, { nameSnapshot: '乙' }),
    rec(sid, STUDENT_3, 'absent', null, { nameSnapshot: '丙' })
  ])
  const snapshot = JSON.stringify(exportSession)
  const rows = buildPeTestSessionExportRows(exportSession, { testItem: run, items: BUILTIN_TEST_ITEMS })
  assert(rows.length === 3, '6. 导出数据人数正确')
  assert(JSON.stringify(exportSession) === snapshot, '13. 导出不改变测试数据')
  assert(peTestExportStatusLabel('valid') === '已测', '7. 导出已测状态')
  assert(peTestExportStatusLabel('pending') === '未测', '8. 导出未测状态')
  assert(peTestExportStatusLabel('absent') === '缺考', '9. 导出缺考状态')
  assert(rows.find((row) => row.状态 === '已测'), '7. 行状态已测')
  assert(rows.find((row) => row.状态 === '未测'), '8. 行状态未测')
  assert(rows.find((row) => row.状态 === '缺考'), '9. 行状态缺考')

  const pendingRow = rows.find((row) => row.状态 === '未测')
  const absentRow = rows.find((row) => row.状态 === '缺考')
  assert(pendingRow?.原始成绩 === '—' && pendingRow.换算分 === '—' && pendingRow.等级 === '—', '未测无虚假分')
  assert(absentRow?.原始成绩 === '—' && absentRow.换算分 === '—' && absentRow.等级 === '—', '缺考无虚假 0 分')

  const measuredExport = rows.find((row) => row.状态 === '已测')
  const expectedRaw = formatTestScore(222, exportSession, run)
  assert(measuredExport?.原始成绩 === expectedRaw, '10. 原始成绩格式正确')
  assert(expectedRaw.includes(':'), '11. 800/1000 时间显示为分:秒')
  assert(measuredExport?.原始成绩 === '3:42', '11. 222 秒导出为 3:42')

  assert(escapeExcelText('=注入甲').startsWith("'"), '16. 姓名防公式注入')
  assert(escapeExcelText('+危险').startsWith("'"), '16. 备注防公式注入')
  assert(escapeExcelText('普通中文') === '普通中文', '16. 普通中文不被破坏')
  assert(measuredExport?.姓名.startsWith("'"), '16. 导出行已转义')

  const payload = buildPeTestSessionExportPayload(exportSession, { testItem: run })
  assert(payload.defaultFileName.endsWith('.xlsx'), '文件名带 xlsx')
  assert(payload.defaultFileName.includes('初一9班'), '文件名含班级')
  assert(payload.defaultFileName.includes('1000米') || payload.defaultFileName.includes('体育测试'), '文件名含项目')
  assert(!/[\\/:*?"<>|]/.test(payload.defaultFileName.replace(/\.xlsx$/, '')), '文件名清理非法字符')
  assert(payload.sheets[0].rows[0].includes('换算分') && payload.sheets[0].rows[0].includes('等级'), '表头中文业务字段')
  assert(!JSON.stringify(payload.sheets).includes(STUDENT_1), '不导出内部 studentId')

  const inProgressPayload = buildPeTestSessionExportPayload(exportSession)
  assert(inProgressPayload.sheets[0].rows.length === 4, '14. 进行中可导出')
  const completed = markPeTestSessionCompleted(exportSession, NOW)
  const completedPayload = buildPeTestSessionExportPayload(completed)
  assert(completedPayload.sheets[0].rows.length === 4, '15. 已完成可导出')
  assert(completed.status === 'completed' && completed.completedAt === NOW, '15. 导出构造不改完成态语义')

  const guard = cloneSessionForExportGuard(completed)
  buildPeTestSessionExportRows(guard)
  assert(guard.status === completed.status && guard.completedAt === completed.completedAt, '13. clone 导出不改 status')

  const sprint = item('50m')
  const sprintSession = baseSession(
    [rec(createPeTestId(), STUDENT_1, 'valid', 8.2, { examScore: 90 })],
    {
      testItemId: sprint.id,
      testItemNameSnapshot: sprint.name,
      unitSnapshot: sprint.unit,
      valueTypeSnapshot: sprint.valueType,
      timeInputModeSnapshot: sprint.timeInputMode,
      directionSnapshot: sprint.direction
    }
  )
  const sprintRows = buildPeTestSessionExportRows(sprintSession, { testItem: sprint })
  assert(sprintRows[0].原始成绩 === formatTestScore(8.2, sprintSession, sprint), '10. 50m 原始成绩')
  assert(sprintRows[0].单位 === '秒', '50m 单位为秒')

  const fileName = peTestExportFileBaseName(sprintSession)
  assert(fileName.includes('50米') || fileName.includes(sprint.name.replace(/\s/g, '')), '单项目文件名')

  const legacyJson = [
    {
      id: sid,
      classId: CLASS_ID,
      testItemId: run.id,
      date: '2026-09-01',
      title: '旧测试',
      notes: '',
      classNameSnapshot: '9班',
      gradeSnapshot: '初一',
      testItemNameSnapshot: run.name,
      unitSnapshot: run.unit,
      customUnitLabelSnapshot: '',
      directionSnapshot: run.direction,
      valueTypeSnapshot: run.valueType,
      timeInputModeSnapshot: run.timeInputMode,
      createdAt: NOW,
      updatedAt: NOW,
      records: [
        {
          id: createPeTestRecordId(),
          testSessionId: sid,
          studentId: STUDENT_1,
          nameSnapshot: '旧生',
          studentNoSnapshot: '1',
          genderSnapshot: 'male',
          rawValue: 240,
          status: 'valid',
          note: '',
          createdAt: NOW,
          updatedAt: NOW
        },
        {
          id: createPeTestRecordId(),
          testSessionId: sid,
          studentId: STUDENT_2,
          nameSnapshot: '未测生',
          studentNoSnapshot: '2',
          genderSnapshot: 'female',
          rawValue: null,
          status: 'pending',
          note: '',
          createdAt: NOW,
          updatedAt: NOW
        }
      ],
      importSource: 'manual',
      examStandardId: null,
      scoringCitySnapshot: '',
      scoringVersionSnapshot: ''
    }
  ]
  const legacy = parsePeTestSessions(legacyJson)
  assert(legacy[0].status === 'in_progress', '17. 旧测试缺 status 兼容为进行中')
  const legacyRows = buildPeTestSessionExportRows(legacy[0], { testItem: run })
  assert(legacyRows.length === 2, '17. 旧测试可导出')
  assert(legacyRows.some((row) => row.状态 === '已测') && legacyRows.some((row) => row.状态 === '未测'), '17. 旧测试状态正确')

  return 'v0.26.0 P0-2 makeup + export self-check passed'
}
