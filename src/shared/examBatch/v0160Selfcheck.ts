import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as XLSX from 'xlsx'
import { listBuiltinExamStandards } from '../examStandard/catalog'
import { calculateExamScore, parseExamPerformanceInput } from '../examStandard/score'
import { parseExamBatchGender } from './parseGender'
import { worksheetRowsToSnapshot } from './readSheet'
import {
  AUTO_SCORE_CREDIBILITY,
  NO_AUTO_SCORE_CREDIBILITY,
  buildSingleItemExportSheets,
  convertSingleItemExamBatch,
  detectSingleItemColumns,
  displayBatchStatus,
  singleItemExportFileName,
  singleItemPreviewSummary
} from './singleItem'
import { detectExamItemColumn } from './detectExamItemColumn'
import { buildWorkbookExportSheets, convertWorkbookExamBatch, detectWorkbookColumns, updateProjectGroupOverride } from './workbook'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function snapshotFromAoa(aoa: unknown[][], fileName = 'temp-batch.xlsx') {
  const sheet = XLSX.utils.aoa_to_sheet(aoa)
  return worksheetRowsToSnapshot(
    XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: '', blankrows: true }),
    XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: '', blankrows: true }),
    fileName,
    'Sheet1'
  )
}

function convertAoa(
  standard: ReturnType<typeof listBuiltinExamStandards>[number],
  itemId: string,
  aoa: unknown[][]
) {
  const item = standard.items.find((entry) => entry.id === itemId)
  assert(item, `${standard.id} 缺少项目 ${itemId}`)
  const snapshot = snapshotFromAoa(aoa)
  const detection = detectSingleItemColumns(snapshot.columns.map((column) => column.title))
  return {
    snapshot,
    detection,
    item,
    result: convertSingleItemExamBatch(standard, item, snapshot, detection.mapping)
  }
}

export function runV0160ExcelBatchSelfCheck(): string {
  const standards = listBuiltinExamStandards()
  const guangzhou = standards.find((item) => item.id === 'cn-gd-guangzhou-middle-2024-2026')
  const jieyang = standards.find((item) => item.id === 'cn-gd-jieyang-middle-2026')
  const shenzhen = standards.find((item) => item.id === 'cn-gd-shenzhen-middle-2026')
  const zhaoqing = standards.find((item) => item.id === 'cn-gd-zhaoqing-middle-2026')
  assert(guangzhou && jieyang && shenzhen && zhaoqing, '缺少对照城市标准')

  const male1000 = guangzhou.items.find((item) => item.id === 'male-1000m')
  const female800 = guangzhou.items.find((item) => item.id === 'female-800m')
  const male50 = zhaoqing.items.find((item) => item.id === 'male-50m')
  const rope = guangzhou.items.find((item) => item.id === 'rope-skip-1min')
  assert(male1000 && female800 && male50 && rope, '缺少对照项目')

  assert(parseExamBatchGender('男') === 'male', 'H 性别 男')
  assert(parseExamBatchGender('女性') === 'female', 'H 性别 女性')
  assert(parseExamBatchGender('M') === 'male', 'H 性别 M')
  assert(parseExamBatchGender('F') === 'female', 'H 性别 F')
  assert(parseExamBatchGender('male') === 'male', 'H 性别 male')
  assert(parseExamBatchGender('unknown') === null, 'H 不得默认性别')

  const serialDetect = detectSingleItemColumns(['序号', '学号', '姓名', '性别', '成绩'])
  assert(serialDetect.autoReady, '标准四列应自动识别')
  assert(serialDetect.mapping.columns[1]?.kind === 'studentNo', '有学号时序号不得覆盖学号')
  assert(serialDetect.mapping.columns[0]?.kind === 'ignore', '序号在有学号时应忽略')

  const scoreAsRaw = detectSingleItemColumns(['姓名', '性别', '最终分'])
  assert(!scoreAsRaw.autoReady, '最终分不得当原始成绩')
  assert(scoreAsRaw.mapping.columns.every((role) => role.kind !== 'rawValue'), '分数列不得映射为成绩')

  const aliasDetect = detectSingleItemColumns(['学生姓名', '学籍号', '男女', '测试结果'])
  assert(aliasDetect.autoReady, '同义表头应自动识别')

  const maleAoa = [
    ['姓名', '学号', '性别', '成绩'],
    ['张三', '1', '男', '3:40'],
    ['李四', '2', '未识别', '3:42'],
    ['王五', '3', '男', 'abc'],
    ['', '4', '男', '3:40']
  ]
  const maleBatch = convertAoa(guangzhou, 'male-1000m', maleAoa)
  const expected = calculateExamScore({
    standard: guangzhou,
    itemId: 'male-1000m',
    rawValue: parseExamPerformanceInput('3:40', male1000),
    gender: 'male',
    officialOnly: true
  })
  assert(expected.ok, '广州男1000对照')
  const zhang = maleBatch.result.rows.find((row) => row.studentName === '张三')
  assert(zhang?.status === 'success' && zhang.score === expected.score, 'A. verified 男生应得分')
  assert(zhang?.examStandardId === guangzhou.id, 'A. 必须绑定广州版本')
  assert(zhang?.rawValueOriginal === '3:40', 'J. 原始成绩保留')
  assert(zhang?.rawValueParsed === 220, 'G. 3:40 解析为 220')

  const formats = ['3:40', "3'40", '3.40', '340', '220秒']
  for (const raw of formats) {
    const parsed = parseExamPerformanceInput(raw, male1000)
    assert(parsed === 220, `G. ${raw} 必须与 220 秒一致`)
    const one = convertAoa(guangzhou, 'male-1000m', [['姓名', '性别', '成绩'], ['测', '男', raw]])
    assert(one.result.rows[0]?.rawValueParsed === 220 && one.result.rows[0]?.score === expected.score, `G. ${raw} 换算一致`)
  }

  const femaleExpected = calculateExamScore({
    standard: guangzhou,
    itemId: 'female-800m',
    rawValue: parseExamPerformanceInput('3:20', female800),
    gender: 'female',
    officialOnly: true
  })
  assert(femaleExpected.ok, '广州女800对照')
  const femaleBatch = convertAoa(guangzhou, 'female-800m', [['姓名', '性别', '成绩'], ['小红', '女', '3:20']])
  assert(femaleBatch.result.rows[0]?.status === 'success' && femaleBatch.result.rows[0]?.score === femaleExpected.score, 'B. verified 女生应得分')

  const wrongGender = convertAoa(guangzhou, 'male-1000m', [['姓名', '性别', '成绩'], ['小红', '女', '3:40']])
  assert(wrongGender.result.rows[0]?.score == null && wrongGender.result.rows[0]?.status === 'unrecognized_gender', 'E. 错误性别拒绝')

  const li = maleBatch.result.rows.find((row) => row.studentName === '李四')
  assert(li?.score == null && li?.message === '性别无法识别' && displayBatchStatus(li) === '无法评分', 'E. 非法性别拒绝')
  const wang = maleBatch.result.rows.find((row) => row.studentName === '王五')
  assert(wang?.score == null && wang?.message === '成绩格式无法识别', 'F. 非法成绩拒绝')
  const nameless = maleBatch.result.rows.find((row) => row.studentNo === '4')
  assert(nameless?.status === 'needs_review' && displayBatchStatus(nameless) === '待检查', '缺少姓名待检查')

  const missingBatch = convertAoa(jieyang, 'male-1000m', [['姓名', '性别', '成绩'], ['赵六', '男', '3:40']])
  assert(missingBatch.result.rows[0]?.score == null, 'C. missing 城市 score null')
  assert(missingBatch.result.rows[0]?.examStandardId === jieyang.id, 'I. missing 不得串到广州')
  assert(missingBatch.result.rows[0]?.rawValueParsed === 220, 'C. missing 仍解析成绩')
  assert(Boolean(missingBatch.result.rows[0]?.message), 'C. missing 必须说明无法评分原因')

  const sz1000 = convertAoa(shenzhen, 'male-1000m', [['姓名', '性别', '成绩'], ['甲', '男', '3:40']])
  assert(sz1000.result.rows[0]?.score == null && sz1000.result.rows[0]?.examStandardId === shenzhen.id, 'D. partial 不可评分项目 score null')

  assert(parseExamPerformanceInput('7.80', male50) === 7.8, 'H. 50米 7.80 仍为秒')
  const sprint = convertAoa(zhaoqing, 'male-50m', [['姓名', '性别', '成绩'], ['周七', '男', '7.80']])
  const sprintExpected = calculateExamScore({
    standard: zhaoqing,
    itemId: 'male-50m',
    rawValue: 7.8,
    gender: 'male',
    officialOnly: true
  })
  assert(sprintExpected.ok && sprint.result.rows[0]?.rawValueParsed === 7.8 && sprint.result.rows[0]?.score === sprintExpected.score, 'H. 50米换算')

  const ropeBatch = convertAoa(guangzhou, 'rope-skip-1min', [['姓名', '性别', '成绩'], ['张三', '男', '168']])
  assert(ropeBatch.result.rows[0]?.rawValueParsed === 168, '次数按次数')

  const preview = singleItemPreviewSummary(maleBatch.result.rows)
  assert(preview.total === 4 && preview.success === 1 && preview.failed === 2 && preview.review === 1, 'K. 汇总来自真实预览')

  const meta = {
    examTypeLabel: '中考体育',
    regionName: '广州',
    standardTitle: guangzhou.title,
    policyLabel: guangzhou.policyLabel,
    yearLabel: '2024-2026',
    statusLabel: '已核验',
    sourceTitle: guangzhou.sourceTitle,
    sourceUrl: guangzhou.sourceUrl,
    exportedAt: '2026-09-10T00:00:00.000Z',
    fileBaseName: '班级成绩.xlsx',
    itemName: male1000.name,
    cityName: '广州',
    versionLabel: guangzhou.policyLabel,
    credibility: AUTO_SCORE_CREDIBILITY
  }
  const exportSheets = buildSingleItemExportSheets(maleBatch.snapshot, maleBatch.result.rows, meta)
  const resultSheet = exportSheets[0]
  assert(resultSheet.rows[0]?.some((cell) => String(cell).includes('换算分')), 'J. 导出含换算分列')
  assert(resultSheet.rows[1]?.includes('3:40'), 'J. 导出保留原始成绩')
  assert(resultSheet.rows[1]?.includes(expected.score), 'J. 导出换算分正确')
  assert(resultSheet.rows[2]?.includes('性别无法识别'), 'J. 异常原因保留')
  const noteSheet = exportSheets[1]
  assert(noteSheet.rows.some((row) => row.includes(AUTO_SCORE_CREDIBILITY)), '导出可信度')
  const jieyangExport = buildSingleItemExportSheets(missingBatch.snapshot, missingBatch.result.rows, {
    ...meta,
    cityName: '揭阳',
    credibility: NO_AUTO_SCORE_CREDIBILITY,
    itemName: '1000米跑'
  })
  assert(jieyangExport[1].rows.some((row) => row.includes(NO_AUTO_SCORE_CREDIBILITY)), 'missing 导出不得假装已换算')
  assert(singleItemExportFileName('班级成绩.xlsx') === '班级成绩_评分结果.xlsx', '导出文件名')

  const multiAoa = [
    ['姓名', '性别', '50米', '1000米', '800米', '一分钟跳绳', '立定跳远', '备注', '体育总分', '排名'],
    ['张三', '男', '7.80', '3:40', '3:20', '168', '2.35', '班长', '88', '1'],
    ['小红', '女', '8.20', '3:40', '3:20', '170', '2.10', '请假', '90', '2'],
    ['王五', '男', 'abc', '3:40', '3:20', '160', '2.20', '', '80', '3']
  ]
  const zqDetect = detectWorkbookColumns(multiAoa[0].map(String), zhaoqing)
  assert(zqDetect.itemColumns.filter((column) => column.matchType !== 'unknown').length >= 5, 'A. 应识别多个项目')
  assert(
    zqDetect.ignoredColumns.some((column) => column.header === '备注') &&
      zqDetect.ignoredColumns.some((column) => column.header === '体育总分') &&
      zqDetect.ignoredColumns.some((column) => column.header === '排名'),
    'D. 未知列不得识别成考试项目'
  )
  const multiSnap = snapshotFromAoa(multiAoa)
  const multi = convertWorkbookExamBatch(zhaoqing, multiSnap, zqDetect)
  const zhangMulti = multi.rows.filter((row) => row.studentName === '张三')
  const hongMulti = multi.rows.filter((row) => row.studentName === '小红')
  assert(zhangMulti.some((row) => row.examItemId === 'male-50m' && row.status === 'success'), 'A. 50米可识别并评分')
  assert(zhangMulti.some((row) => row.examItemId === 'male-1000m' && row.status === 'success'), 'B. 男生1000米评分')
  assert(zhangMulti.some((row) => row.examItemName.includes('800') && row.status === 'unrecognized_gender'), 'B. 男生800米数据冲突')
  assert(hongMulti.some((row) => row.examItemId === 'female-800m' && row.status === 'success'), 'B. 女生800米评分')
  assert(hongMulti.some((row) => row.examItemName.includes('1000') && row.status === 'unrecognized_gender'), 'B. 女生1000米数据冲突')
  const wang50 = multi.rows.find((row) => row.studentName === '王五' && row.examItemId === 'male-50m')
  const wang1000 = multi.rows.find((row) => row.studentName === '王五' && row.examItemId === 'male-1000m')
  assert(wang50?.status === 'invalid_raw_value' && wang1000?.status === 'success', 'E. 一格错误不影响其他项目')

  const runCol = detectExamItemColumn('长跑', guangzhou, 3)
  assert(runCol.matchType === 'gender-derived' && runCol.maleItemId === 'male-1000m' && runCol.femaleItemId === 'female-800m', 'C. 长跑按当前规则拆分')
  const enduranceAoa = [
    ['姓名', '性别', '长跑'],
    ['张三', '男', '3:40'],
    ['小红', '女', '3:20']
  ]
  const enduranceDetect = detectWorkbookColumns(['姓名', '性别', '长跑'], guangzhou)
  const endurance = convertWorkbookExamBatch(guangzhou, snapshotFromAoa(enduranceAoa), enduranceDetect)
  assert(endurance.rows.find((row) => row.studentName === '张三')?.examItemId === 'male-1000m', 'C. 男生长跑→1000')
  assert(endurance.rows.find((row) => row.studentName === '小红')?.examItemId === 'female-800m', 'C. 女生长跑→800')

  const heyuan = standards.find((item) => item.id === 'cn-gd-heyuan-middle-2026')
  assert(heyuan, '河源标准')
  const heyuanRun = detectExamItemColumn('长跑', heyuan, 0)
  assert(heyuanRun.matchType === 'unknown', 'C. 无男1000/女800声明时不得拆分')

  assert(detectExamItemColumn('五十米', zhaoqing, 0).matchedItemKey === 'run-50m', 'G. 五十米别名')
  assert(detectExamItemColumn('男子1000米跑', guangzhou, 0).maleItemId === 'male-1000m', 'G. 男子1000米跑')
  assert(detectExamItemColumn('跳绳1分钟', guangzhou, 0).matchedItemKey === 'rope-skip-1min', 'G. 跳绳别名')
  assert(detectExamItemColumn('跳', guangzhou, 0).matchType === 'unknown', 'H. 低置信度不得自动匹配')

  const mixedAoa = [
    ['姓名', '性别', '1000米', '体育素质综合评价'],
    ['张三', '男', '3:40', '10']
  ]
  const mixedDetect = detectWorkbookColumns(['姓名', '性别', '1000米', '体育素质综合评价'], guangzhou)
  const mixed = convertWorkbookExamBatch(guangzhou, snapshotFromAoa(mixedAoa), mixedDetect)
  assert(mixed.rows.find((row) => row.examItemId === 'male-1000m')?.status === 'success', 'F. verified 项目继续评分')
  assert(mixed.rows.find((row) => row.examItemId === 'quality-evaluation')?.score == null, 'F. missing/unsupported 项目 score null')

  const multiExport = buildWorkbookExportSheets(multiSnap, multi.rows, zqDetect, {
    ...meta,
    cityName: '肇庆',
    versionLabel: zhaoqing.policyLabel,
    credibility: AUTO_SCORE_CREDIBILITY
  })
  const header = multiExport[0].rows[0] ?? []
  const fiftyPos = header.findIndex((cell) => cell === '50米')
  assert(fiftyPos >= 0 && header[fiftyPos + 1] === '50米_换算分' && header[fiftyPos + 2] === '50米_评分状态', 'J. 项目旁追加评分列')
  assert(header.includes('备注') && header.includes('体育总分'), 'J. 原列保留')

  const pairAoa = [
    ['姓名', '学号', '性别', '状态', '项目', '成绩', '项目', '成绩'],
    ['张三', '1', '男', '正常', '1000米', '3:39', '一分钟跳绳', 154],
    ['李四', '2', '男', '正常', '1000米', '3:53', '一分钟跳绳', 132]
  ]
  const pairSnap = snapshotFromAoa(pairAoa)
  const pairDetect = detectWorkbookColumns(
    pairSnap.columns.map((column) => column.title),
    guangzhou,
    pairSnap.rows
  )
  assert(pairDetect.projectGroups.length === 2, 'Mode B 应识别 2 个项目组')
  const group1 = pairDetect.projectGroups[0]
  const group2 = pairDetect.projectGroups[1]
  assert(group1.detected.matchedItemKey === 'run-1000m', '组1 应为 1000米')
  assert(group2.detected.matchedItemKey === 'rope-skip-1min', '组2 应为 一分钟跳绳')
  assert(group1.resultColumnIndex !== group2.resultColumnIndex, '两组成绩列不得相同')
  assert(pairDetect.ignoredColumns.some((column) => column.header === '状态'), '状态列必须忽略')
  const pairConverted = convertWorkbookExamBatch(guangzhou, pairSnap, pairDetect)
  const zhangPair = pairConverted.rows.filter((row) => row.studentName === '张三')
  assert(zhangPair.some((row) => row.examItemId === 'male-1000m' && row.status === 'success'), 'Mode B 1000米按统一 parser 评分')
  assert(zhangPair.some((row) => row.examItemId === 'rope-skip-1min' && row.status === 'success'), 'Mode B 跳绳按次数评分')
  const otherItemId = guangzhou.items.find((item) => item.itemKey === 'run-50m')?.id ?? 'male-50m'
  const isolated = updateProjectGroupOverride({}, group2.mappingId, otherItemId)
  assert(isolated[group1.mappingId] === undefined, '修改组2不得写入组1')
  assert(isolated[group2.mappingId] === otherItemId, '组2 override 独立')
  const restored = updateProjectGroupOverride(isolated, group2.mappingId, '')
  assert(restored[group1.mappingId] === undefined && restored[group2.mappingId] === undefined, '改回后组1仍不受影响')
  const overridden = convertWorkbookExamBatch(guangzhou, pairSnap, pairDetect, { groupOverrides: isolated })
  const zhangOver = overridden.rows.filter((row) => row.studentName === '张三')
  assert(zhangOver.some((row) => row.examItemId === 'male-1000m'), '修改组2后组1仍为1000米')
  assert(!zhangOver.some((row) => row.sourceColumn === group2.resultColumnIndex && row.examItemId === 'rope-skip-1min'), '组2 override 后不再用跳绳')

  const mixedLabelAoa = [
    ['姓名', '性别', '项目', '成绩'],
    ['张三', '男', '1000米', '3:39'],
    ['李四', '男', '50米', '7.5']
  ]
  const mixedLabelSnap = snapshotFromAoa(mixedLabelAoa)
  const mixedLabelDetect = detectWorkbookColumns(
    mixedLabelSnap.columns.map((column) => column.title),
    zhaoqing,
    mixedLabelSnap.rows
  )
  assert(mixedLabelDetect.projectGroups[0]?.mixedLabels === true, '同一项目列多项目应进入按行识别')
  const mixedLabel = convertWorkbookExamBatch(zhaoqing, mixedLabelSnap, mixedLabelDetect)
  assert(mixedLabel.rows.find((row) => row.studentName === '张三')?.examItemId === 'male-1000m', '按行：张三 1000米')
  assert(mixedLabel.rows.find((row) => row.studentName === '李四')?.examItemId === 'male-50m', '按行：李四 50米')

  const absentAoa = [
    ['姓名', '学号', '性别', '状态', '项目', '成绩', '项目', '成绩'],
    ['张三', '1', '男', '正常', '1000米', '3:39', '一分钟跳绳', 154],
    ['李四', '2', '男', '正常', '1000米', '缺考', '一分钟跳绳', '缺考'],
    ['王五', '3', '男', '正常', '1000米', '3:53', '一分钟跳绳', 132]
  ]
  const absentSnap = snapshotFromAoa(absentAoa)
  const absentDetect = detectWorkbookColumns(
    absentSnap.columns.map((column) => column.title),
    guangzhou,
    absentSnap.rows
  )
  const absent = convertWorkbookExamBatch(guangzhou, absentSnap, absentDetect)
  const absentRows = absent.rows.filter((row) => row.status === 'non_score_record')
  assert(absent.summary.recordCount === 6, '缺考仍计入成绩单元')
  assert(absent.summary.successCount === 4, '缺考不减少已成功评分')
  assert(absent.summary.errorCount === 0, '缺考不得计入真正异常')
  assert(absentRows.length === 2 && absentRows.every((row) => row.score == null), '缺考 score 必须为 null')
  assert(
    absentRows.every(
      (row) =>
        row.rawValueOriginal === '缺考' &&
        displayBatchStatus(row) === '缺考' &&
        row.message === '原始记录为缺考，未参与评分'
    ),
    '缺考状态与说明'
  )
  const excused = convertAoa(guangzhou, 'male-1000m', [
    ['姓名', '性别', '成绩'],
    ['甲', '男', '免考'],
    ['乙', '男', '请假'],
    ['丙', '男', '未测']
  ])
  assert(
    excused.result.rows.every((row) => row.score == null && row.status === 'non_score_record') &&
      excused.result.summary.errorCount === 0,
    '免考/请假/未测不得补分或记异常'
  )
  const absentExport = buildWorkbookExportSheets(absentSnap, absent.rows, absentDetect, {
    ...meta,
    cityName: '广州',
    versionLabel: guangzhou.policyLabel,
    credibility: AUTO_SCORE_CREDIBILITY
  })
  const liExport = absentExport[0].rows.find((row) => row.includes('李四'))
  assert(
    liExport?.includes('缺考') &&
      liExport.includes('原始记录为缺考，未参与评分') &&
      !liExport.includes('无法评分'),
    '导出保留缺考且换算分为空'
  )

  const dir = mkdtempSync(join(tmpdir(), 'v0160-excel-'))
  try {
    const originalPath = join(dir, 'source.xlsx')
    const originalAoa = [
      ['姓名', '性别', '成绩'],
      ['张三', '男', '3:40']
    ]
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(originalAoa), 'Sheet1')
    const originalBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer
    writeFileSync(originalPath, originalBuffer)
    const exported = buildSingleItemExportSheets(snapshotFromAoa(originalAoa, 'source.xlsx'), convertAoa(guangzhou, 'male-1000m', originalAoa).result.rows, meta)
    const outBook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(outBook, XLSX.utils.aoa_to_sheet(exported[0].rows), '评分结果')
    writeFileSync(join(dir, 'source_评分结果.xlsx'), XLSX.write(outBook, { type: 'buffer', bookType: 'xlsx' }) as Buffer)
    const reread = XLSX.read(readFileSync(originalPath), { type: 'buffer' })
    const rereadRows = XLSX.utils.sheet_to_json<unknown[]>(reread.Sheets.Sheet1, { header: 1 })
    assert(JSON.stringify(rereadRows[1]) === JSON.stringify(['张三', '男', '3:40']) || JSON.stringify(rereadRows[1]).includes('3:40'), 'K. 原 Excel 不被修改')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }

  return 'v0.16.0 excel batch scoring self-check passed'
}

export function runV0160ExcelBatchSelfCheckOrThrow(): string {
  return runV0160ExcelBatchSelfCheck()
}
