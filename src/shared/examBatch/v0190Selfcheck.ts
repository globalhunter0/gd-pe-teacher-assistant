import { listBuiltinExamStandards } from '../examStandard/catalog'
import { BUILTIN_TEST_ITEMS } from '../peTest/builtinItems'
import { parsePeTestSessions } from '../peTest/validate'
import type { ClassRecord } from '../class/types'
import type { StudentRecord } from '../student/types'
import type { PETestSession } from '../peTest/types'
import { worksheetRowsToSnapshot } from './readSheet'
import * as XLSX from 'xlsx'
import { buildExamBatchPeTestImportPayload, PE_TEST_PRIMARY_IMPORT_LABEL, PE_TEST_WRITE_PIPELINE } from './peTestImport/entry'
import { executeImportExamBatchToPeTests } from './peTestImport/execute'
import { mapExamRowToPeTestStatus } from './peTestImport/mapRecordStatus'
import { matchExcelStudent } from './peTestImport/matchStudent'
import { resolveExamItemToTestItem } from './peTestImport/resolveTestItem'
import { compareDeclaredScoreWithEngine, detectDeclaredScoreColumns, isDeclaredScoreHeader } from './declaredScores'
import { convertWorkbookExamBatch, detectWorkbookColumns, displayBatchStatus, updateProjectGroupOverride } from './workbook'
import { summarizeSingleTest } from '../statistics/analytics'

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
    'temp-v0190.xlsx',
    'Sheet1'
  )
}

const CLASS_ID = 'class-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const STU_A = 'student-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const STU_B = 'student-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const NOW = '2026-09-11T00:00:00.000Z'

function classRecord(): ClassRecord {
  return {
    id: CLASS_ID,
    className: '初一9班',
    grade: '初一',
    academicYear: '2025-2026',
    semester: '第一学期',
    studentCount: 2,
    notes: '',
    status: 'active',
    createdAt: NOW,
    updatedAt: NOW
  }
}

function student(id: string, name: string, studentNo: string, extra: Partial<StudentRecord> = {}): StudentRecord {
  return {
    id,
    classId: CLASS_ID,
    studentNo,
    name,
    gender: 'male',
    status: 'active',
    notes: '',
    createdAt: NOW,
    updatedAt: NOW,
    ...extra
  }
}

export async function runV0190PeTestImportEntrySelfCheck(): Promise<string> {
  assert(PE_TEST_PRIMARY_IMPORT_LABEL === '导入成绩', 'A. 体育测试主入口文案为导入成绩')
  assert(PE_TEST_WRITE_PIPELINE.write === 'executeImportExamBatchToPeTests', '不得另造写入器')
  assert(PE_TEST_WRITE_PIPELINE.detect === 'detectWorkbookColumns', 'T. 复用识别引擎')
  assert(PE_TEST_WRITE_PIPELINE.score === 'convertWorkbookExamBatch', 'T. 复用评分引擎')

  const guangzhou = listBuiltinExamStandards().find((item) => item.id === 'cn-gd-guangzhou-middle-2024-2026')
  assert(guangzhou, '广州标准')
  const zhang = student(STU_A, '张三', '1')
  const li = student(STU_B, '李四', '2')

  const singleAoa = [
    ['姓名', '学号', '性别', '1000米'],
    ['张三', '1', '男', '3:40'],
    ['李四', '2', '男', '缺考']
  ]
  const singleSnap = snapshotFromAoa(singleAoa)
  const singleDetect = detectWorkbookColumns(singleSnap.columns.map((column) => column.title), guangzhou)
  const single = convertWorkbookExamBatch(guangzhou, singleSnap, singleDetect)
  assert(single.rows.filter((row) => row.examItemId === 'male-1000m').length === 2, 'B. 单项目导入识别')
  const absent = single.rows.find((row) => row.studentName === '李四')
  const absentMap = mapExamRowToPeTestStatus(absent!)
  assert(absent?.status === 'non_score_record' && absentMap.peStatus === 'absent' && absentMap.examScore === null, 'G. 缺考 score null')

  const dualAoa = [
    ['姓名', '学号', '性别', '1000米', '一分钟跳绳'],
    ['张三', '1', '男', '3:40', '168'],
    ['李四', '2', '男', '3:50', '免考']
  ]
  const dualSnap = snapshotFromAoa(dualAoa)
  const dualDetect = detectWorkbookColumns(dualSnap.columns.map((column) => column.title), guangzhou)
  assert(dualDetect.projectGroups.length === 2, 'C. 双项目列独立')
  const dual = convertWorkbookExamBatch(guangzhou, dualSnap, dualDetect)
  assert(dual.rows.some((row) => row.examItemId === 'male-1000m') && dual.rows.some((row) => row.examItemId === 'rope-skip-1min'), 'C. 双项目评分')
  const exempt = dual.rows.find((row) => row.studentName === '李四' && row.examItemId === 'rope-skip-1min')
  assert(mapExamRowToPeTestStatus(exempt!).peStatus === 'exempt' && exempt?.score == null, 'H. 免考 score null')

  const tripleAoa = [
    ['姓名', '学号', '性别', '1000米', '跳绳', '立定跳远'],
    ['张三', '1', '男', '3:40', '168', '2.35'],
    ['李四', '2', '男', '', '160', '2.10']
  ]
  const tripleSnap = snapshotFromAoa(tripleAoa)
  const tripleDetect = detectWorkbookColumns(tripleSnap.columns.map((column) => column.title), guangzhou)
  assert(tripleDetect.projectGroups.length === 3, 'D. 三个项目独立识别')
  const triple = convertWorkbookExamBatch(guangzhou, tripleSnap, tripleDetect)
  const blank = triple.rows.find((row) => row.studentName === '李四' && row.examItemId === 'male-1000m')
  assert(blank?.status === 'non_score_record' && mapExamRowToPeTestStatus(blank).peStatus === 'pending' && blank.score == null, 'I. 空白/未测 score null')
  const badAoa = [
    ['姓名', '学号', '性别', '1000米'],
    ['张三', '1', '男', 'abc']
  ]
  const bad = convertWorkbookExamBatch(
    guangzhou,
    snapshotFromAoa(badAoa),
    detectWorkbookColumns(['姓名', '学号', '性别', '1000米'], guangzhou)
  )
  assert(bad.rows[0].status === 'invalid_raw_value', 'J. 异常才进入 error')
  assert(mapExamRowToPeTestStatus(bad.rows[0]).blockImport === true, 'J. 异常阻止入库')

  const g1 = dualDetect.projectGroups[0]
  const g2 = dualDetect.projectGroups[1]
  const isolated = updateProjectGroupOverride({}, g2.mappingId, 'rope-skip-1min')
  const restored = updateProjectGroupOverride(isolated, g1.mappingId, 'male-1000m')
  assert(restored[g2.mappingId] === 'rope-skip-1min' && restored[g1.mappingId] === 'male-1000m', 'E/F. 每列 mapping 独立')

  const byNo = matchExcelStudent({
    classId: CLASS_ID,
    students: [zhang, li],
    excelRow: 2,
    studentNo: '1',
    studentName: '张三',
    gender: 'male'
  })
  assert(byNo.kind === 'studentNo' && byNo.student?.id === STU_A, 'K. 学号匹配')
  const sameName = student('student-cccccccc-cccc-4ccc-8ccc-cccccccccccc', '张三', '9')
  const conflict = matchExcelStudent({
    classId: CLASS_ID,
    students: [zhang, sameName],
    excelRow: 2,
    studentNo: '',
    studentName: '张三',
    gender: 'male'
  })
  assert(conflict.kind === 'needs_confirm', 'L. 同名冲突阻止')

  const examRope = guangzhou.items.find((item) => item.id === 'rope-skip-1min')
  assert(examRope, '跳绳考试项目')
  assert(resolveExamItemToTestItem(examRope, BUILTIN_TEST_ITEMS)?.builtinKey === 'skip-1min', 'M. 跳绳 alias → TestItem')
  assert(detectWorkbookColumns(['姓名', '性别', '一分钟跳绳'], guangzhou).projectGroups[0]?.detected.matchedItemKey === 'rope-skip-1min', 'M. 一分钟跳绳识别')
  assert(detectWorkbookColumns(['姓名', '性别', '跳绳'], guangzhou).projectGroups[0]?.detected.matchedItemKey === 'rope-skip-1min', 'M. 跳绳别名')

  assert(isDeclaredScoreHeader('1000米得分'), '得分列可识别')
  const declared = detectDeclaredScoreColumns(['姓名', '1000米', '1000米得分'])
  assert(declared.length === 1 && declared[0].scoreHeader === '1000米得分', '得分列不作为独立项目')
  const withScoreDetect = detectWorkbookColumns(['姓名', '性别', '1000米', '1000米得分'], guangzhou)
  assert(withScoreDetect.projectGroups.length === 1, '得分列不进入项目 mapping')
  assert(compareDeclaredScoreWithEngine(80, 90).kind === 'mismatch', 'Excel得分不一致提示')
  assert(compareDeclaredScoreWithEngine(90, 90).kind === 'match', '得分一致')

  const payload = buildExamBatchPeTestImportPayload({
    classId: CLASS_ID,
    testDate: '2026-09-11',
    standard: guangzhou,
    duplicateAction: 'cancel',
    rows: dual.rows
  })
  const viaStandards = buildExamBatchPeTestImportPayload({
    classId: CLASS_ID,
    testDate: '2026-09-11',
    standard: guangzhou,
    duplicateAction: 'cancel',
    rows: dual.rows
  })
  assert(JSON.stringify(payload) === JSON.stringify(viaStandards), 'T. 两入口同一 payload')

  let stored: PETestSession[] = []
  let writes = 0
  const stores = {
    loadClasses: async () => [classRecord()],
    loadStudents: async () => [zhang, li],
    loadTestItems: async () => [...BUILTIN_TEST_ITEMS],
    loadPeTests: async () => stored,
    savePeTests: async (items: PETestSession[]) => {
      writes += 1
      stored = parsePeTestSessions(items)
      return stored
    },
    nowIso: NOW
  }

  const imported = await executeImportExamBatchToPeTests(payload, stores)
  assert(writes === 1, 'Q. 原子写入一次')
  assert(imported.createdCount === 2, 'C/R. 双项目 → 2 个 PE Test')
  assert(stored.length === 2, 'R. 导入后可读')
  const analysis = summarizeSingleTest(
    stored[0],
    stored,
    BUILTIN_TEST_ITEMS.find((item) => item.id === stored[0].testItemId),
    [classRecord()]
  )
  assert(analysis.rosterCount >= 1 && analysis.statuses.valid + analysis.statuses.absent + analysis.statuses.exempt >= 1, 'S. v0.18 测试分析可读导入测试')

  writes = 0
  let duplicateBlocked = false
  try {
    await executeImportExamBatchToPeTests(payload, stores)
  } catch {
    duplicateBlocked = true
  }
  assert(duplicateBlocked && writes === 0, 'N. 重复测试被识别且不写')

  writes = 0
  let skippedAll = false
  try {
    await executeImportExamBatchToPeTests({ ...payload, duplicateAction: 'skip' }, stores)
  } catch {
    skippedAll = true
  }
  assert(skippedAll && writes === 0, 'O. skip existing 两项都已存在时不写')

  writes = 0
  stored = stored.filter((session) => session.testItemId !== resolveExamItemToTestItem(examRope!, BUILTIN_TEST_ITEMS)?.id)
  const skippedRope = await executeImportExamBatchToPeTests({ ...payload, duplicateAction: 'skip' }, stores)
  assert(writes === 1 && skippedRope.createdCount === 1, 'O. skip 仅创建不存在项目')

  const triplePayload = buildExamBatchPeTestImportPayload({
    classId: CLASS_ID,
    testDate: '2026-09-12',
    standard: guangzhou,
    duplicateAction: 'cancel',
    rows: triple.rows
  })
  writes = 0
  const tripleImported = await executeImportExamBatchToPeTests(triplePayload, stores)
  assert(tripleImported.createdCount === 3 && writes === 1, 'D. 三项目一次原子写入')

  const hiddenAbsentSnap = snapshotFromAoa([
    ['姓名', '学号', '性别', '1000米'],
    ['张三', '1', '男', '3:40'],
    ['李四', '2', '男', '']
  ])
  const liHidden = hiddenAbsentSnap.rows.find((row) => row.cells[0] === '李四')
  assert(liHidden, '缺考隐式格存在')
  liHidden.cells[3] = ''
  liHidden.raw[3] = '缺考'
  const hiddenConverted = convertWorkbookExamBatch(
    guangzhou,
    hiddenAbsentSnap,
    detectWorkbookColumns(hiddenAbsentSnap.columns.map((column) => column.title), guangzhou)
  )
  const hiddenRow = hiddenConverted.rows.find((row) => row.studentName === '李四')
  const hiddenMap = mapExamRowToPeTestStatus(hiddenRow!)
  assert(hiddenRow?.rawValueOriginal === '缺考' && hiddenMap.peStatus === 'absent' && hiddenMap.examScore === null, 'Excel 缺考不得变成 pending')
  assert(displayBatchStatus(hiddenRow!) === '缺考', '缺考展示保持缺考')

  const statusAoa = [
    ['姓名', '学号', '性别', '1000米', '状态', '一分钟跳绳'],
    ['张三', '1', '男', '3:40', '正常', 168],
    ['李四', '2', '男', '', '缺考', 160]
  ]
  const statusSnap = snapshotFromAoa(statusAoa)
  const statusDetect = detectWorkbookColumns(statusSnap.columns.map((column) => column.title), guangzhou)
  const statusConverted = convertWorkbookExamBatch(guangzhou, statusSnap, statusDetect)
  const statusRun = statusConverted.rows.find((row) => row.studentName === '李四' && row.examItemId === 'male-1000m')
  const statusRope = statusConverted.rows.find((row) => row.studentName === '李四' && row.examItemId === 'rope-skip-1min')
  assert(mapExamRowToPeTestStatus(statusRun!).peStatus === 'absent' && statusRun?.score == null, '成绩格空白但状态列缺考 → absent')
  assert(mapExamRowToPeTestStatus(statusRope!).peStatus === 'valid', '仅缺考格为 absent，其它格保持成绩')

  const previewRows = [
    ...Array.from({ length: 46 }, (_item, index) => ({
      ...hiddenConverted.rows[0],
      sourceRow: index + 2,
      studentName: `学生${index}`,
      studentNo: String(index + 1),
      status: 'success' as const,
      score: 80,
      rawValueOriginal: '3:40',
      rawValueParsed: 220,
      message: ''
    })),
    hiddenRow!,
    {
      ...hiddenRow!,
      sourceRow: 99,
      studentName: '王五',
      studentNo: '99',
      examItemId: 'rope-skip-1min',
      examItemName: '一分钟跳绳',
      rawValueOriginal: '缺考',
      status: 'non_score_record' as const,
      score: null,
      message: '原始记录为缺考，未参与评分'
    }
  ]
  const previewMapped = previewRows.map((row) => mapExamRowToPeTestStatus(row))
  assert(previewMapped.filter((item) => item.peStatus === 'valid').length === 46, '预览有效 46')
  assert(previewMapped.filter((item) => item.peStatus === 'absent').length === 2, '预览缺考 2')
  assert(previewMapped.filter((item) => item.peStatus === 'exempt').length === 0, '预览免考 0')
  assert(previewMapped.filter((item) => item.peStatus === 'pending' && !item.skipCell).length === 0, '预览未测 0')
  assert(previewMapped.filter((item) => item.peStatus === 'invalid').length === 0, '预览异常 0')

  const emptyOriginalAbsent = mapExamRowToPeTestStatus({
    ...hiddenRow!,
    rawValueOriginal: '',
    status: 'non_score_record',
    message: '原始记录为缺考，未参与评分'
  })
  assert(emptyOriginalAbsent.peStatus === 'absent' && emptyOriginalAbsent.examScore === null, 'message 缺考不得映射成 pending')

  writes = 0
  const absentPayload = buildExamBatchPeTestImportPayload({
    classId: CLASS_ID,
    testDate: '2026-09-14',
    standard: guangzhou,
    duplicateAction: 'cancel',
    rows: hiddenConverted.rows
  })
  const absentImported = await executeImportExamBatchToPeTests(absentPayload, stores)
  assert(writes === 1 && absentImported.absentCount === 1, '写入汇总缺考 1')
  const writtenAbsent = stored.flatMap((session) => session.records).find((record) => record.studentId === STU_B && record.rawOriginal === '缺考')
  assert(writtenAbsent?.status === 'absent' && writtenAbsent.examScore === null && writtenAbsent.rawValue == null, '写入后仍为 absent / examScore null')

  return 'v0.19.0 pe-test import entry self-check passed'
}

export async function runV0190PeTestImportEntrySelfCheckOrThrow(): Promise<string> {
  return runV0190PeTestImportEntrySelfCheck()
}
