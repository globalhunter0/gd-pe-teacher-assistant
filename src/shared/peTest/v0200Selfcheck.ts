import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { listBuiltinExamStandards } from '../examStandard/catalog'
import { PE_TEST_PRIMARY_IMPORT_LABEL, PE_TEST_WRITE_PIPELINE, mapExamRowToPeTestStatus } from '../examBatch'
import { convertWorkbookExamBatch, detectWorkbookColumns } from '../examBatch/workbook'
import { worksheetRowsToSnapshot } from '../examBatch/readSheet'
import { executeImportExamBatchToPeTests } from '../examBatch/peTestImport/execute'
import { findDuplicatePeTests } from '../examBatch/peTestImport/planImport'
import { BUILTIN_TEST_ITEMS } from '../peTest/builtinItems'
import { parsePeTestSessions } from '../peTest/validate'
import { summarizeSingleTest } from '../statistics/analytics'
import type { ClassRecord } from '../class/types'
import type { StudentRecord } from '../student/types'
import type { PETestSession } from '../peTest/types'
import * as XLSX from 'xlsx'
import {
  PE_TEST_CENTER_DEFAULT_TAB,
  PE_TEST_CENTER_TABS,
  resolvePeTestCenterNavigation
} from './center'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function snapshotFromAoa(aoa: unknown[][]) {
  const sheet = XLSX.utils.aoa_to_sheet(aoa)
  return worksheetRowsToSnapshot(
    XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: '', blankrows: true }),
    XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: '', blankrows: true }),
    'temp-v0200.xlsx',
    'Sheet1'
  )
}

function readSrc(relative: string): string {
  return readFileSync(resolve(process.cwd(), relative), 'utf8')
}

export async function runV0200PeTestCenterSelfCheck(): Promise<string> {
  const centerPage = readSrc('src/renderer/src/pages/PeTestCenterPage.tsx')
  const testsPage = readSrc('src/renderer/src/pages/PeTestsPage.tsx')
  const batchPage = readSrc('src/renderer/src/pages/ExamBatchPage.tsx')
  const standardsPage = readSrc('src/renderer/src/pages/ExamStandardsPage.tsx')
  const appSource = readSrc('src/renderer/src/App.tsx')
  const dashboard = readSrc('src/renderer/src/pages/DashboardPage.tsx')
  const navSource = readSrc('src/renderer/src/navigation.ts')

  assert(!navSource.includes("key: 'exams'") && !navSource.includes("label: '评分标准'"), 'A. 左侧评分标准一级入口已删除')
  assert(navSource.includes("key: 'tests'") && navSource.includes('PE_TEST_CENTER_MODULE_LABEL'), 'B. 体育测试一级入口存在')
  assert(PE_TEST_CENTER_DEFAULT_TAB === 'records', 'C. 默认进入测试记录')
  assert(
    PE_TEST_CENTER_TABS.map((item) => item.id).join(',') === 'records,import,standards,tools' &&
      PE_TEST_CENTER_TABS[0].label === '测试记录' &&
      PE_TEST_CENTER_TABS[3].label === '评分工具',
    'D. 四个子页签均可访问'
  )
  assert(centerPage.includes("tab === 'records'") && testsPage.includes('embedded'), 'E. 测试记录功能承接原页')
  assert(testsPage.includes('新建测试') && testsPage.includes('测试分析') && testsPage.includes('导入Excel成绩'), 'E. 测试记录主操作')
  assert(!testsPage.includes('去评分标准页面导入'), 'E. 空状态不含旧逻辑')
  assert(centerPage.includes("entry=\"pe-tests\"") && batchPage.includes("entry === 'pe-tests'"), 'F. 导入成绩复用 v0.19 流程')
  assert(centerPage.includes('<ExamStandardsPage') && standardsPage.includes('查看和管理当前体育测试使用的官方评分规则'), 'G. 评分标准可查看城市规则')
  assert(!standardsPage.includes('评分与模板工具'), 'G. 评分标准页不再放批量工作台')
  assert(centerPage.includes("entry=\"standards-tool\"") && batchPage.includes('ExamTemplateActions'), 'H. 评分工具承接 Excel 批量评分与模板')
  assert(batchPage.includes('buildExamBatchPeTestImportPayload') && batchPage.includes('executeImportExamBatchToPeTests') === false, 'I. 评分工具保存仍走页面原入库调用')
  assert(batchPage.includes('commitSave') && batchPage.includes('peTests.importExamBatch'), 'I. 保存到体育测试仍可用')
  assert(
    PE_TEST_WRITE_PIPELINE.write === 'executeImportExamBatchToPeTests' &&
      PE_TEST_WRITE_PIPELINE.detect === 'detectWorkbookColumns' &&
      PE_TEST_WRITE_PIPELINE.score === 'convertWorkbookExamBatch',
    'J. 两处 PE Test 写入走同一底层'
  )
  assert(!centerPage.includes('executeImportExamBatchToPeTests') && !standardsPage.includes('executeImportExamBatchToPeTests'), 'J. 页面未另造写入器')
  assert(resolvePeTestCenterNavigation('exams')?.tab === 'standards', 'K. 旧评分标准路由重定向')
  assert(resolvePeTestCenterNavigation('/exams')?.tab === 'standards', 'K. /exams')
  assert(resolvePeTestCenterNavigation('/scoring-standard')?.tab === 'standards', 'K. /scoring-standard')
  assert(resolvePeTestCenterNavigation('scoring')?.tab === 'tools' && resolvePeTestCenterNavigation('/exam-batch')?.tab === 'tools', 'L. 旧评分工具路由重定向')
  assert(appSource.includes("activeKey === 'exams'") && appSource.includes("setPeTestTab('standards')"), 'K/L. App 兼容旧 exams 入口')
  assert(navSource.includes("tests: PE_TEST_CENTER_MODULE_LABEL") || navSource.includes('体育测试'), 'U. 导航一级模块名为体育测试')

  const guangzhou = listBuiltinExamStandards().find((item) => item.id === 'cn-gd-guangzhou-middle-2024-2026')
  assert(guangzhou, '广州标准')
  const mixed = convertWorkbookExamBatch(
    guangzhou,
    snapshotFromAoa([
      ['姓名', '学号', '性别', '1000米', '一分钟跳绳'],
      ['张三', '1', '男', '3:40', '168'],
      ['李四', '2', '男', '缺考', '免考'],
      ['王五', '3', '男', '', '160']
    ]),
    detectWorkbookColumns(['姓名', '学号', '性别', '1000米', '一分钟跳绳'], guangzhou)
  )
  const absent = mixed.rows.find((row) => row.studentName === '李四' && row.examItemId === 'male-1000m')
  const exempt = mixed.rows.find((row) => row.studentName === '李四' && row.examItemId === 'rope-skip-1min')
  const pending = mixed.rows.find((row) => row.studentName === '王五' && row.examItemId === 'male-1000m')
  assert(mapExamRowToPeTestStatus(absent!).peStatus === 'absent' && absent?.score == null, 'M. 缺考保持 absent')
  assert(mapExamRowToPeTestStatus(exempt!).peStatus === 'exempt' && exempt?.score == null, 'N. 免考保持 exempt')
  assert(mapExamRowToPeTestStatus(pending!).peStatus === 'pending' && pending?.score == null, 'O. 未测保持 pending')
  assert(mixed.rows.some((row) => row.examItemId === 'male-1000m') && mixed.rows.some((row) => row.examItemId === 'rope-skip-1min'), 'P. 多项目 Excel 识别正常')
  const detect = detectWorkbookColumns(['姓名', '学号', '性别', '1000米', '一分钟跳绳'], guangzhou)
  assert(detect.projectGroups.length === 2 && detect.projectGroups[0].mappingId !== detect.projectGroups[1].mappingId, 'Q. 每列 mapping 独立')

  const CLASS_ID = 'class-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  const NOW = '2026-09-11T00:00:00.000Z'
  const zhang: StudentRecord = {
    id: 'student-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    classId: CLASS_ID,
    studentNo: '1',
    name: '张三',
    gender: 'male',
    status: 'active',
    notes: '',
    createdAt: NOW,
    updatedAt: NOW
  }
  const classRecord: ClassRecord = {
    id: CLASS_ID,
    className: '初一9班',
    grade: '初一',
    academicYear: '2025-2026',
    semester: '第一学期',
    studentCount: 1,
    notes: '',
    status: 'active',
    createdAt: NOW,
    updatedAt: NOW
  }
  let stored: PETestSession[] = []
  const stores = {
    loadClasses: async () => [classRecord],
    loadStudents: async () => [zhang],
    loadTestItems: async () => [...BUILTIN_TEST_ITEMS],
    loadPeTests: async () => stored,
    savePeTests: async (items: PETestSession[]) => {
      stored = parsePeTestSessions(items)
      return stored
    },
    nowIso: NOW
  }
  const { buildExamBatchPeTestImportPayload } = await import('../examBatch/peTestImport/entry')
  const first = await executeImportExamBatchToPeTests(
    buildExamBatchPeTestImportPayload({
      classId: CLASS_ID,
      testDate: '2026-09-20',
      standard: guangzhou,
      duplicateAction: 'cancel',
      rows: mixed.rows.filter((row) => row.studentName === '张三')
    }),
    stores
  )
  assert(first.createdCount >= 1, 'I. 写入 PE Test')
  const dup = findDuplicatePeTests(stored, CLASS_ID, '2026-09-20', stored[0].testItemId)
  assert(dup.length === 1, 'R. 重复测试保护正常')
  const analysis = summarizeSingleTest(
    stored[0],
    stored,
    BUILTIN_TEST_ITEMS.find((item) => item.id === stored[0].testItemId),
    [classRecord]
  )
  assert(analysis.rosterCount >= 1, 'S. 测试分析入口数据可读')
  assert(analysis.statuses.valid + analysis.statuses.absent + analysis.statuses.exempt + analysis.statuses.pending >= 1, 'T. 数据统计读取不受影响')

  assert(!dashboard.includes('评分标准'), 'U. 工作台快捷入口不再出现旧评分标准命名')
  assert(dashboard.includes('体育测试'), 'U. 工作台保留体育测试')
  assert(PE_TEST_PRIMARY_IMPORT_LABEL === '导入成绩', '导入成绩文案')
  assert(!batchPage.includes('function executeImportExamBatchToPeTests'), 'L. 未新增第二套写入')

  return 'v0.20.0 pe-test center self-check passed'
}

export async function runV0200PeTestCenterSelfCheckOrThrow(): Promise<string> {
  return runV0200PeTestCenterSelfCheck()
}
