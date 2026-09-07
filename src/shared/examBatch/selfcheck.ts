import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as XLSX from 'xlsx'
import { listBuiltinExamStandards } from '../examStandard/catalog'
import { itemSupportsAutoScore } from '../examStandard/score'
import { suggestColumnMapping } from './columnMapping'
import { buildBatchAssessmentRows, convertExamBatch } from './convert'
import { buildExamExportSheets } from './exportSheets'
import { matchExamItem } from './matchExamItem'
import { parseExamBatchGender } from './parseGender'
import { parseBatchRawValue, parseExamBatchRawValue } from './parseRaw'
import { objectRowsToExcelData, snapshotRowAsObject, worksheetRowsToSnapshot } from './readSheet'
import {
  buildExamTemplatePayload,
  examTemplateFileBaseName,
  EXAM_TEMPLATE_GUIDE_SHEET,
  EXAM_TEMPLATE_IDENTITY_HEADERS,
  EXAM_TEMPLATE_SCORE_SHEET,
  EXAM_TEMPLATE_VERSION,
  isOfficialExamTemplateHeaders,
  templateItemColumns
} from './template'
import type { ExamColumnMapping, ExcelDataRow } from './types'

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

function snapshotFromAoa(aoa: unknown[][]): ReturnType<typeof worksheetRowsToSnapshot> {
  const sheet = XLSX.utils.aoa_to_sheet(aoa)
  return worksheetRowsToSnapshot(
    XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: '', blankrows: true }),
    XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: '', blankrows: true }),
    'school.xlsx',
    'Sheet1'
  )
}

function convertAoa(standard: ReturnType<typeof listBuiltinExamStandards>[number], aoa: unknown[][]) {
  const snapshot = snapshotFromAoa(aoa)
  const titles = snapshot.columns.map((column) => column.title)
  const mapping = suggestColumnMapping(titles, standard).mapping
  return {
    snapshot,
    mapping,
    result: buildBatchAssessmentRows(standard, mapping, snapshot)
  }
}

export function runExamBatchSelfCheck(): void {
  const standards = listBuiltinExamStandards()
  const guangzhou = standards.find((item) => item.id === 'cn-gd-guangzhou-middle-2024-2026')
  const gaokao = standards.find((item) => item.id === 'cn-gd-gaokao-sports-2026')
  if (!guangzhou || !gaokao) {
    throw new Error('缺少考试标准')
  }

  assert(parseExamBatchGender('男') === 'male', '性别 男')
  assert(parseExamBatchGender('女性') === 'female', '性别 女性')
  assert(parseExamBatchGender('M') === 'male', '性别 M')
  assert(parseExamBatchGender('female') === 'female', '性别 female')
  assert(parseExamBatchGender('未知') === null, '未知性别不得猜测')

  const run1000 = matchExamItem('1000米', guangzhou, 'male')
  assert(run1000.status === 'matched' && run1000.item.id === 'male-1000m', '1000米别名')
  const swim = matchExamItem('100米', guangzhou, 'male')
  assert(swim.status === 'unmatched' || (swim.status === 'matched' && swim.item.itemKey !== 'swim-100m'), '100米不得误匹配游泳')
  const swimExact = matchExamItem('100米游泳', guangzhou, 'male')
  assert(swimExact.status === 'matched' && swimExact.item.itemKey === 'swim-100m', '100米游泳')
  const jump = matchExamItem('立定跳远', guangzhou, 'female')
  assert(jump.status === 'matched' && jump.item.id === 'female-standing-long-jump', '立定跳远按性别')

  const male1000 = guangzhou.items.find((item) => item.id === 'male-1000m')
  const longJump = guangzhou.items.find((item) => item.id === 'male-standing-long-jump')
  const female800 = guangzhou.items.find((item) => item.id === 'female-800m')
  const rope = guangzhou.items.find((item) => item.id === 'rope-skip-1min')
  const shot = guangzhou.items.find((item) => item.id === 'male-shot-put')
  const gaokao100 = gaokao.items.find((item) => item.id === 'male-100m')
  if (!male1000 || !longJump || !female800 || !rope || !shot || !gaokao100) {
    throw new Error('广州或高考项目缺失')
  }
  const sprint50 = { ...gaokao100, id: 'sprint-50m-fixture', itemKey: 'run-50m', name: '50米', timeInputMode: 'seconds' as const }

  const timeParsed = parseExamBatchRawValue("3:45", '3:45', male1000)
  assert(timeParsed.ok && timeParsed.value === 225, '3:45 解析')
  const altTime = parseExamBatchRawValue("3'45", "3'45", male1000)
  assert(altTime.ok && altTime.value === 225, "3'45 解析")
  const seconds = parseExamBatchRawValue('225', 225, male1000)
  assert(seconds.ok && seconds.value === 225, '总秒数解析')
  const dotNumber = parseBatchRawValue(4.32, male1000)
  assert(dotNumber.ok && dotNumber.value === 272, '4.32(number) → 272')
  const dotString = parseBatchRawValue('4.32', male1000)
  assert(dotString.ok && dotString.value === 272, '"4.32" → 272')
  const colon = parseBatchRawValue('4:32', male1000)
  assert(colon.ok && colon.value === 272, '"4:32" → 272')
  const quote = parseBatchRawValue("4'32", male1000)
  assert(quote.ok && quote.value === 272, "4'32 → 272")
  const total = parseBatchRawValue(272, male1000)
  assert(total.ok && total.value === 272, '272 → 272')
  const excelDroppedZero = parseBatchRawValue(4.2, male1000)
  assert(excelDroppedZero.ok && excelDroppedZero.value === 260, '4.20 Excel number 4.2 → 260')
  const eightHundred = parseBatchRawValue(3.42, female800)
  assert(eightHundred.ok && eightHundred.value === 222, '800米 3.42(number) → 222')
  const sprintNumber = parseBatchRawValue(7.82, sprint50)
  assert(sprintNumber.ok && sprintNumber.value === 7.82, '50米 7.82(number) 不得当成分秒')
  const sprintString = parseBatchRawValue('7.82', sprint50)
  assert(sprintString.ok && sprintString.value === 7.82, '50米 "7.82"')
  const gaokaoSeconds = parseBatchRawValue(11.48, gaokao100)
  assert(gaokaoSeconds.ok && gaokaoSeconds.value === 11.48, '高考100米 11.48(number)')
  const ropeNumber = parseBatchRawValue(171, rope)
  assert(ropeNumber.ok && ropeNumber.value === 171, '跳绳 171(number)')
  const ropeString = parseBatchRawValue('171', rope)
  assert(ropeString.ok && ropeString.value === 171, '跳绳 "171"')
  const numberParsed = parseExamBatchRawValue('2.35', 2.35, longJump)
  assert(numberParsed.ok && numberParsed.value === 2.35, '立定跳远 2.35')
  const shotParsed = parseBatchRawValue(10.38, shot)
  assert(shotParsed.ok && shotParsed.value === 10.38, '铅球 10.38(number)')
  const formattedDateButRawNumber = parseExamBatchRawValue('1900/1/4', 4.32, male1000)
  assert(formattedDateButRawNumber.ok && formattedDateButRawNumber.value === 272, '优先使用 Excel 原始数字')
  const invalid = parseExamBatchRawValue('3.75', '3.75', male1000)
  assert(!invalid.ok, '3.75 不得当成有效长跑')
  assert(invalid.ok === false && invalid.message.includes('预期格式'), '失败信息应包含预期格式')
  const excelTime = parseExamBatchRawValue('0.002604', 225 / 86400, male1000)
  assert(excelTime.ok && Math.abs(excelTime.value - 225) < 0.05, 'Excel 时间序列解析')

  const wideTitles = ['学号', '姓名', '性别', '班级', '1000米', '立定跳远', '实心球']
  const wideSuggest = suggestColumnMapping(wideTitles, guangzhou)
  assert(wideSuggest.mapping.layout === 'wide', '宽表布局')
  assert(wideSuggest.mapping.columns[0].kind === 'studentNo', '学号列')
  assert(wideSuggest.mapping.columns[1].kind === 'studentName', '姓名列')
  assert(wideSuggest.mapping.columns[4].kind === 'examItemKey', '1000米列')

  const longTitles = ['学号', '姓名', '性别', '班级', '项目', '成绩']
  const longSuggest = suggestColumnMapping(longTitles, guangzhou)
  assert(longSuggest.mapping.layout === 'long', '长表布局')
  assert(longSuggest.mapping.columns[4].kind === 'itemName', '项目列')
  assert(longSuggest.mapping.columns[5].kind === 'rawValue', '成绩列')

  const schoolAoa = [
    ['姓名', '学号', '性别', '状态', '1000米', '一分钟跳绳'],
    ['蔡文轩', 1, '男', '正常', 4.32, 171],
    ['测试学生2', 2, '男', '正常', 4.2, 176]
  ]
  const schoolEndToEnd = convertAoa(guangzhou, schoolAoa)
  const schoolTitles = schoolEndToEnd.snapshot.columns.map((column) => column.title)
  assert(schoolTitles[4] === '1000米' && schoolTitles[5] === '一分钟跳绳', '端到端表头')
  const map1000 = schoolEndToEnd.mapping.columns[4]
  const mapRope = schoolEndToEnd.mapping.columns[5]
  assert(map1000.kind === 'examItemKey' && map1000.sourceColumn === 4 && map1000.sourceHeader === '1000米', '1000米列必须保存 sourceColumn=4 与 sourceHeader')
  assert(mapRope.kind === 'examItemKey' && mapRope.sourceColumn === 5 && mapRope.sourceHeader === '一分钟跳绳', '跳绳列必须保存 sourceColumn=5')
  const caiRun = schoolEndToEnd.result.rows.find((row) => row.studentName === '蔡文轩' && row.examItemId === 'male-1000m')
  const caiRope = schoolEndToEnd.result.rows.find((row) => row.studentName === '蔡文轩' && row.examItemId === 'rope-skip-1min')
  const stu2Run = schoolEndToEnd.result.rows.find((row) => row.studentName === '测试学生2' && row.examItemId === 'male-1000m')
  const stu2Rope = schoolEndToEnd.result.rows.find((row) => row.studentName === '测试学生2' && row.examItemId === 'rope-skip-1min')
  assert(caiRun?.rawValueOriginal === '4.32', `蔡文轩1000米 rawValueOriginal 应为 4.32，实际 ${caiRun?.rawValueOriginal}`)
  assert(caiRope?.rawValueOriginal === '171', `蔡文轩跳绳 rawValueOriginal 应为 171，实际 ${caiRope?.rawValueOriginal}`)
  assert(stu2Run?.rawValueOriginal === '4.2' || stu2Run?.rawValueOriginal === '4.20', `测试学生2 1000米应为 4.20，实际 ${stu2Run?.rawValueOriginal}`)
  assert(stu2Rope?.rawValueOriginal === '176', `测试学生2 跳绳应为 176，实际 ${stu2Rope?.rawValueOriginal}`)
  assert(caiRun?.rawValueParsed === 272, '4.32 → 272秒')
  assert(stu2Run?.rawValueParsed === 260, '4.20 → 260秒')
  assert(caiRope?.rawValueParsed === 171 && stu2Rope?.rawValueParsed === 176, '跳绳次数')
  assert(caiRun?.rawValueOriginal !== map1000.sourceHeader && caiRun?.rawValueOriginal !== '1000米跑', '蔡文轩不得把表头当成绩')

  const wrongIndexMapping: ExamColumnMapping = {
    layout: 'wide',
    columns: schoolEndToEnd.mapping.columns.map((role) =>
      role.kind === 'examItemKey' ? { ...role, sourceColumn: 0 } : role
    )
  }
  const recovered = buildBatchAssessmentRows(guangzhou, wrongIndexMapping, schoolEndToEnd.snapshot)
  assert(
    recovered.rows.find((row) => row.studentName === '蔡文轩' && row.examItemId === 'male-1000m')?.rawValueOriginal === '4.32',
    'sourceColumn 错误时仍应按 sourceHeader 取 4.32（与 UI 同一入口）'
  )

  const poisoned = convertExamBatch(
    guangzhou,
    schoolEndToEnd.mapping,
    [
      {
        excelRow: 2,
        cells: ['蔡文轩', '1', '男', '正常', '4.32', '171'],
        raw: ['蔡文轩', 1, '男', '正常', '1000米', '一分钟跳绳']
      }
    ],
    schoolTitles
  )
  assert(
    poisoned.rows.find((row) => row.examItemId === 'male-1000m')?.rawValueOriginal === '4.32',
    'raw 为表头时必须改用预览 cells 中的 4.32'
  )
  assert(
    poisoned.rows.find((row) => row.examItemId === 'rope-skip-1min')?.rawValueOriginal === '171',
    'raw 为表头时必须改用预览 cells 中的 171'
  )

  const wideRows: ExcelDataRow[] = [
    { excelRow: 2, cells: ['001', '张三', '男', '七1班', '3:45', '2.35', '8.6'], raw: ['001', '张三', '男', '七1班', '3:45', 2.35, 8.6] },
    { excelRow: 3, cells: ['002', '李四', '男', '七1班', '3.75', '2.10', ''], raw: ['002', '李四', '男', '七1班', '3.75', 2.1, ''] },
    { excelRow: 4, cells: ['003', '王五', '不明', '七1班', '3:40', '2.20', '7.1'], raw: ['003', '王五', '不明', '七1班', '3:40', 2.2, 7.1] }
  ]
  const wideResult = convertExamBatch(guangzhou, wideSuggest.mapping, wideRows)
  const zhang1000 = wideResult.rows.find((row) => row.studentName === '张三' && row.examItemId === 'male-1000m')
  assert(zhang1000?.status === 'success' && zhang1000.score === 95, '广州 linear 1000米 3:45')
  const fourMin = convertExamBatch(guangzhou, wideSuggest.mapping, [
    { excelRow: 9, cells: ['009', '线性', '男', '七1班', '4:00', '2.35', '8.6'], raw: [] }
  ]).rows.find((row) => row.examItemId === 'male-1000m')
  assert(fourMin?.status === 'success' && fourMin.score === 86.42, '广州 linear 1000米 4:00')
  const liInvalid = wideResult.rows.find((row) => row.studentName === '李四' && row.rawValueOriginal === '3.75')
  assert(liInvalid?.status === 'invalid_raw_value', '无效成绩')
  const liJump = wideResult.rows.find((row) => row.studentName === '李四' && row.examItemId === 'male-standing-long-jump')
  assert(liJump?.status === 'success', '同一行其他项目仍换算')
  const wang = wideResult.rows.filter((row) => row.studentName === '王五')
  assert(wang.every((row) => row.status === 'unrecognized_gender'), '无法识别性别不得评分')

  const fixture = objectRowsToExcelData([
    { 姓名: '测试学生', 性别: '男', '1000米': 4.32, '一分钟跳绳': 171 }
  ])
  const fixtureMap = suggestColumnMapping(fixture.titles, guangzhou).mapping
  assert(fixtureMap.layout === 'wide', '对象宽表应为宽表')
  assert(fixtureMap.columns[2].kind === 'examItemKey' && fixtureMap.columns[2].sourceHeader === '1000米', '1000米列必须保存 sourceHeader')
  assert(fixtureMap.columns[2].sourceColumn === 2, '1000米列 sourceColumn')
  const fixtureResult = convertExamBatch(guangzhou, fixtureMap, fixture.rows, fixture.titles)
  assert(fixtureResult.rows.length === 2, `对象宽表应展开2条，实际 ${fixtureResult.rows.length}`)
  const fixtureRun = fixtureResult.rows.find((row) => row.examItemId === 'male-1000m')
  const fixtureRope = fixtureResult.rows.find((row) => row.examItemId === 'rope-skip-1min')
  assert(fixtureRun?.studentName === '测试学生' && fixtureRun.rawValueOriginal === '4.32', '对象宽表 1000米 rawValueOriginal')
  assert(fixtureRun?.rawValueParsed === 272, '对象宽表 1000米 normalized 272')
  assert(fixtureRope?.rawValueOriginal === '171', '对象宽表 跳绳 rawValueOriginal')
  assert(fixtureRope?.rawValueParsed === 171, '对象宽表 跳绳 normalized 171')
  assert(fixtureRun?.rawValueOriginal !== fixtureMap.columns[2].sourceHeader, '成绩不得等于表头')
  assert(fixtureRope?.rawValueOriginal !== fixtureMap.columns[3].sourceHeader, '跳绳成绩不得等于表头')

  const headerAsValueRows: ExcelDataRow[] = [
    { excelRow: 2, cells: ['测试学生', '男', '1000米', '一分钟跳绳'], raw: ['测试学生', '男', '1000米', '一分钟跳绳'] }
  ]
  const headerAsValue = convertExamBatch(guangzhou, fixtureMap, headerAsValueRows, fixture.titles)
  assert(
    headerAsValue.rows.every((row) => row.status === 'header_used_as_value'),
    '表头当成绩必须被 self-check 抓住'
  )

  const unsourcedMapping = {
    layout: 'wide',
    columns: [
      { kind: 'studentName' },
      { kind: 'gender' },
      { kind: 'examItemKey', itemKey: 'run-1000m' },
      { kind: 'examItemKey', itemKey: 'rope-skip-1min' }
    ]
  } as ExamColumnMapping
  const unsourcedResult = convertExamBatch(guangzhou, unsourcedMapping, fixture.rows, fixture.titles)
  assert(unsourcedResult.rows.find((row) => row.examItemId === 'male-1000m')?.rawValueOriginal === '4.32', '缺少 sourceColumn 时仍按列下标取值')
  assert(unsourcedResult.rows.find((row) => row.examItemId === 'rope-skip-1min')?.rawValueOriginal === '171', '缺少 sourceColumn 时跳绳仍取单元格')

  const longObject = objectRowsToExcelData([
    { 姓名: '李冠灏', 性别: '男', 项目: '1000米', 成绩: 4.32 },
    { 姓名: '李冠灏', 性别: '男', 项目: '一分钟跳绳', 成绩: 171 }
  ])
  const longObjectMap = suggestColumnMapping(longObject.titles, guangzhou).mapping
  assert(longObjectMap.layout === 'long', '长表对象布局')
  const longObjectResult = convertExamBatch(guangzhou, longObjectMap, longObject.rows, longObject.titles)
  assert(longObjectResult.rows.length === 2, '长表两条')
  assert(longObjectResult.rows[0]?.rawValueOriginal === '4.32' && longObjectResult.rows[0]?.rawValueParsed === 272, '长表 4.32 → 272')
  assert(longObjectResult.rows[1]?.rawValueOriginal === '171' && longObjectResult.rows[1]?.rawValueParsed === 171, '长表 171 → 171')

  const liguanhaoSheet = XLSX.utils.aoa_to_sheet([
    ['姓名', '性别', '1000米', '一分钟跳绳'],
    ['李冠灏', '男', 4.32, 171]
  ])
  const liguanhaoSnapshot = worksheetRowsToSnapshot(
    XLSX.utils.sheet_to_json<unknown[]>(liguanhaoSheet, { header: 1, raw: false, defval: '', blankrows: true }),
    XLSX.utils.sheet_to_json<unknown[]>(liguanhaoSheet, { header: 1, raw: true, defval: '', blankrows: true }),
    'school.xlsx',
    'Sheet1'
  )
  const firstObject = snapshotRowAsObject(liguanhaoSnapshot, liguanhaoSnapshot.rows[0])
  assert(firstObject['姓名'] === '李冠灏' || firstObject['姓名'] === '李冠灏', 'SheetJS 姓名')
  assert(Number(firstObject['1000米']) === 4.32, `SheetJS 1000米应为 4.32，实际 ${String(firstObject['1000米'])}`)
  assert(Number(firstObject['一分钟跳绳']) === 171, `SheetJS 跳绳应为 171，实际 ${String(firstObject['一分钟跳绳'])}`)
  const liguanhaoMap = suggestColumnMapping(
    liguanhaoSnapshot.columns.map((column) => column.title),
    guangzhou
  ).mapping
  const liguanhaoRows = convertExamBatch(
    guangzhou,
    liguanhaoMap,
    liguanhaoSnapshot.rows,
    liguanhaoSnapshot.columns.map((column) => column.title)
  ).rows
  assert(liguanhaoRows.length === 2, '李冠灏应生成2条')
  const liRun = liguanhaoRows.find((row) => row.examItemId === 'male-1000m')
  const liRope = liguanhaoRows.find((row) => row.examItemId === 'rope-skip-1min')
  assert(liRun?.studentName === '李冠灏' && liRun.rawValueOriginal === '4.32' && liRun.rawValueParsed === 272, '李冠灏 1000米 4.32 → 272')
  assert(liRope?.studentName === '李冠灏' && liRope.rawValueOriginal === '171' && liRope.rawValueParsed === 171, '李冠灏 跳绳 171 → 171')
  assert(liRun?.rawValueOriginal !== '1000米' && liRope?.rawValueOriginal !== '一分钟跳绳', '不得把项目名当成绩')

  const titledSheet = XLSX.utils.aoa_to_sheet([
    ['八年级体育成绩'],
    ['姓名', '性别', '1000米跑', '一分钟跳绳'],
    ['李冠灏', '男', 4.32, 171]
  ])
  const titledSnapshot = worksheetRowsToSnapshot(
    XLSX.utils.sheet_to_json<unknown[]>(titledSheet, { header: 1, raw: false, defval: '', blankrows: true }),
    XLSX.utils.sheet_to_json<unknown[]>(titledSheet, { header: 1, raw: true, defval: '', blankrows: true }),
    'school.xlsx',
    'Sheet1'
  )
  assert(titledSnapshot.columns.some((column) => column.title.includes('1000')), '标题行不得被当成表头')
  const titledConverted = convertExamBatch(
    guangzhou,
    suggestColumnMapping(
      titledSnapshot.columns.map((column) => column.title),
      guangzhou
    ).mapping,
    titledSnapshot.rows,
    titledSnapshot.columns.map((column) => column.title)
  )
  assert(titledConverted.rows.find((row) => row.examItemId === 'male-1000m')?.rawValueOriginal === '4.32', '跳过标题行后 4.32 仍是成绩')

  const runSamples = [4.32, 4.2, 3.49, 3.4]
  const ropeSamples = [171, 176, 140, 178]
  const school24Aoa: unknown[][] = [
    ['姓名', '学号', '性别', '状态', '1000米', '一分钟跳绳'],
    ...Array.from({ length: 24 }, (_item, index) => [
      index === 0 ? '蔡文轩' : `学生${index + 1}`,
      index + 1,
      '男',
      '正常',
      runSamples[index % 4],
      ropeSamples[index % 4]
    ])
  ]
  const school24End = convertAoa(guangzhou, school24Aoa)
  const school24Result = school24End.result
  assert(school24Result.summary.recordCount === 48, `24×2 应为48条，实际 ${school24Result.summary.recordCount}`)
  const originals = school24Result.rows.map((row) => row.rawValueOriginal)
  for (const expected of ['4.32', '4.2', '3.49', '3.4', '171', '176', '140', '178']) {
    assert(originals.includes(expected), `24×2 原始成绩应包含 ${expected}`)
  }
  assert(!originals.includes('1000米') && !originals.includes('一分钟跳绳') && !originals.includes('1000米跑'), '24×2 不得把项目名当成绩')
  const parsedRuns = school24Result.rows.filter((row) => row.examItemId === 'male-1000m')
  const parsedRopes = school24Result.rows.filter((row) => row.examItemId === 'rope-skip-1min')
  assert(parsedRuns.some((row) => row.rawValueOriginal === '4.32' && row.rawValueParsed === 272), '4.32 → 272')
  assert(parsedRuns.some((row) => row.rawValueOriginal === '4.2' && row.rawValueParsed === 260), '4.20 → 260')
  assert(parsedRuns.some((row) => row.rawValueOriginal === '3.49' && row.rawValueParsed === 229), '3.49 → 229')
  assert(parsedRuns.some((row) => row.rawValueOriginal === '3.4' && row.rawValueParsed === 220), '3.40 → 220')
  assert(parsedRopes.some((row) => row.rawValueOriginal === '171' && row.rawValueParsed === 171), '171 → 171')
  assert(parsedRopes.some((row) => row.rawValueOriginal === '176' && row.rawValueParsed === 176), '176 → 176')
  assert(parsedRopes.some((row) => row.rawValueOriginal === '140' && row.rawValueParsed === 140), '140 → 140')
  assert(parsedRopes.some((row) => row.rawValueOriginal === '178' && row.rawValueParsed === 178), '178 → 178')
  const parseErrors = school24Result.rows.filter((row) => row.status === 'invalid_raw_value' || row.status === 'header_used_as_value')
  assert(parseErrors.length === 0, `24×2 不得出现解析/表头错位：${parseErrors.map((row) => row.message).join(';')}`)
  const noTable = school24Result.rows.filter((row) => row.status === 'no_score_table' || row.status === 'unsupported_item')
  const scored = school24Result.rows.filter((row) => row.status === 'success')
  console.log(
    `[examBatch self-check] 24×2 status success=${scored.length} no_table/unsupported=${noTable.length} other=${school24Result.summary.errorCount - noTable.length}`
  )

  const longRows: ExcelDataRow[] = [
    { excelRow: 2, cells: ['001', '张三', '男', '七1班', '1000米', '3:45'], raw: [] },
    { excelRow: 3, cells: ['001', '张三', '男', '七1班', '立定跳远', '2.35'], raw: [] },
    { excelRow: 4, cells: ['004', '赵六', '女', '七1班', '体育素质综合评价', '20'], raw: [] }
  ]
  const longResult = convertExamBatch(guangzhou, longSuggest.mapping, longRows)
  assert(longResult.rows[0].status === 'success' && longResult.rows[0].score === 95, '长表 1000米')
  assert(longResult.rows[1].status === 'success', '长表立定跳远')
  assert(longResult.rows[2].status === 'unsupported_item', 'unsupported 项目')

  const gaokaoTitles = ['姓名', '性别', '100米']
  const gaokaoMap = suggestColumnMapping(gaokaoTitles, gaokao)
  const gaokaoRows: ExcelDataRow[] = [{ excelRow: 2, cells: ['周七', '男', '11.48'], raw: [] }]
  const gaokaoResult = convertExamBatch(gaokao, gaokaoMap.mapping, gaokaoRows)
  assert(gaokaoResult.rows[0].status === 'success' && gaokaoResult.rows[0].score === 75, '体育高考 step 11.48')
  const gaokaoMid = convertExamBatch(gaokao, gaokaoMap.mapping, [{ excelRow: 2, cells: ['周七', '男', '11.50'], raw: [] }])
  assert(gaokaoMid.rows[0].score === 74, '体育高考中间值不得插值')

  const schoolRunTitles = ['学号', '姓名', '性别', '1000米跑', '一分钟跳绳']
  const schoolMapping = suggestColumnMapping(schoolRunTitles, guangzhou).mapping
  const schoolRows: ExcelDataRow[] = Array.from({ length: 24 }, (_item, index) => ({
    excelRow: index + 2,
    cells: [String(index + 1), `学生${index + 1}`, '男', '4.32', '171'],
    raw: [String(index + 1), `学生${index + 1}`, '男', 4.32, 171]
  }))
  const schoolResult = convertExamBatch(guangzhou, schoolMapping, schoolRows)
  assert(schoolResult.summary.recordCount === 48, `24×2 应为48条，实际 ${schoolResult.summary.recordCount}`)
  assert(
    schoolResult.rows.every((row) => row.status !== 'invalid_raw_value'),
    '24×2 不得误报成绩格式无法识别'
  )
  assert(schoolResult.summary.successCount === 48, `24×2 应全部进入评分，成功 ${schoolResult.summary.successCount}`)

  const itemNames = ['1000米', '立定跳远', '实心球', '足球', '篮球', '乒乓球', '引体向上', '推铅球', '三级连续蛙跳', '一分钟跳绳']
  const batchTitles = ['学号', '姓名', '性别', '班级', ...itemNames]
  const batchMapping = suggestColumnMapping(batchTitles, guangzhou).mapping
  const batchRows: ExcelDataRow[] = Array.from({ length: 500 }, (_item, index) => ({
    excelRow: index + 2,
    cells: [String(index + 1), `学生${index + 1}`, '男', '测试班', '3:45', '2.35', '8.6', '47.3', '8.5', '40', '12', '8.0', '6.8', '180'],
    raw: []
  }))
  const started = Date.now()
  const batch = convertExamBatch(guangzhou, batchMapping, batchRows)
  const elapsed = Date.now() - started
  assert(batch.summary.recordCount === 5000, `5000条记录，实际 ${batch.summary.recordCount}`)
  console.log(`exam batch 5000-row convert: ${elapsed}ms`)
  assert(elapsed < 5000, `5000条耗时过长：${elapsed}ms`)

  const sheets = buildExamExportSheets(wideResult.rows, {
    examTypeLabel: '体育中考',
    regionName: '广州',
    standardTitle: guangzhou.title,
    policyLabel: guangzhou.policyLabel,
    yearLabel: '2024-2026',
    statusLabel: '已核验',
    sourceTitle: guangzhou.sourceTitle,
    sourceUrl: guangzhou.sourceUrl,
    exportedAt: '2026-09-07T00:00:00.000Z',
    fileBaseName: '广州2024-2026体育中考_成绩换算_2026-09-07'
  }, 'wide')
  assert(sheets.map((sheet) => sheet.name).join(',') === '成绩汇总,成绩明细,异常记录,换算说明', '四个工作表')
  assert(sheets[1].rows[0].includes('原始成绩') && sheets[1].rows[0].includes('换算分数'), '明细表头')
  assert(sheets[1].rows.length === wideResult.rows.length + 1, '明细行数')
  assert(sheets[2].rows.length === wideResult.rows.filter((row) => row.status !== 'success').length + 1, '异常行数')
  assert(String(sheets[3].rows[10]?.[1] ?? '').includes('所选评分标准'), '换算说明')

  const workbook = XLSX.utils.book_new()
  for (const sheet of sheets) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheet.rows), sheet.name)
  }
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer
  const reread = XLSX.read(buffer, { type: 'buffer' })
  assert(reread.SheetNames.length === 4, '回读4个Sheet')
  const detail = XLSX.utils.sheet_to_json<string[]>(reread.Sheets['成绩明细'], { header: 1 })
  const header = (detail[0] ?? []).map(String)
  assert(header.includes('原始成绩') && header.includes('换算分数'), '回读表头')
  assert(detail.length === wideResult.rows.length + 1, '回读行数')
  const zhangLine = detail.find((row) => String(row[2]) === '张三' && String(row[5]).includes('1000'))
  assert(zhangLine && Number(zhangLine[8]) === 95, '回读分数')

  runExamTemplateRoundTripSelfCheck(guangzhou, gaokao)
}

function runExamTemplateRoundTripSelfCheck(
  guangzhou: ReturnType<typeof listBuiltinExamStandards>[number],
  gaokao: ReturnType<typeof listBuiltinExamStandards>[number]
): void {
  const blank = buildExamTemplatePayload({
    standard: guangzhou,
    generatedAt: '2026-09-07 16:00:00'
  })
  assert(blank.defaultFileName === '体育成绩登记模板_广州_2024-2026.xlsx', `空白模板文件名 ${blank.defaultFileName}`)
  assert(blank.sheets.map((sheet) => sheet.name).join(',') === `${EXAM_TEMPLATE_SCORE_SHEET},${EXAM_TEMPLATE_GUIDE_SHEET}`, '模板两个Sheet')
  const scoreHeaders = blank.sheets[0].rows[0].map(String)
  assert(scoreHeaders.slice(0, 5).join('|') === EXAM_TEMPLATE_IDENTITY_HEADERS.join('|'), '成绩表第一行必须是身份字段')
  assert(isOfficialExamTemplateHeaders(scoreHeaders), '官方模板表头识别')
  assert(!scoreHeaders.includes('项目') && !scoreHeaders.includes('成绩'), '模板不得使用长表“项目/成绩”列')
  assert(new Set(scoreHeaders).size === scoreHeaders.length, '表头不得重复')
  assert(!scoreHeaders.includes('体育素质综合评价'), '无verified换算表的项目不得进入模板')
  assert(scoreHeaders.includes('1000米跑'), '广州1000米跑列')
  assert(scoreHeaders.includes('一分钟跳绳'), '广州一分钟跳绳列')
  assert(blank.sheets[0].rows.length === 1, '空白模板只有表头')

  const guide = blank.sheets[1].rows.map((row) => row.map(String).join(' '))
  assert(guide.some((line) => line.includes('模板版本') && line.includes(EXAM_TEMPLATE_VERSION)), '填写说明含模板版本')
  assert(guide.some((line) => line.includes('地区')), '填写说明含地区')
  assert(guide.some((line) => line.includes('年份')), '填写说明含年份')
  assert(guide.some((line) => line.includes('生成时间')), '填写说明含生成时间')
  assert(guide.some((line) => line.includes('3.39')), '1000米示例 3.39')
  assert(guide.some((line) => line.includes('154')), '跳绳示例 154')
  assert(!guide.some((line) => /\b235\b/.test(line) && line.includes('立定')), '立定跳远示例不得写成厘米235')

  const columns = templateItemColumns(guangzhou)
  assert(
    columns.every((column) => itemSupportsAutoScore(column.sampleItem)),
    '模板项目必须可自动换算'
  )
  const unsupported = guangzhou.items.filter((item) => !itemSupportsAutoScore(item)).map((item) => item.name)
  assert(
    unsupported.every((name) => !scoreHeaders.includes(name)),
    '不支持自动换算的项目不得作为成绩列'
  )

  const classTemplate = buildExamTemplatePayload({
    standard: gaokao,
    className: '初一1班',
    students: [
      { name: '在读生', studentNo: 'A01', className: '初一1班', genderLabel: '男' },
      { name: '未填性别', studentNo: 'A02', className: '初一1班', genderLabel: '' }
    ]
  })
  assert(classTemplate.defaultFileName === '体育成绩登记表_初一1班_广东体育高考_2026.xlsx', classTemplate.defaultFileName)
  assert(classTemplate.sheets[0].rows[1]?.slice(0, 5).join('|') === '在读生|A01|初一1班|男|正常', '按班级写入身份且考生类别默认正常')
  assert(
    classTemplate.sheets[0].rows[1]?.slice(5).every((cell) => cell === ''),
    '按班级模板成绩列保持空白'
  )
  assert(
    buildExamTemplatePayload({ standard: guangzhou, className: '初一1班' }).defaultFileName ===
      '体育成绩登记表_初一1班_广州_2024-2026.xlsx',
    '广州按班级文件名'
  )

  const filledHeaders = [...scoreHeaders]
  const runIndex = filledHeaders.indexOf('1000米跑')
  const ropeIndex = filledHeaders.indexOf('一分钟跳绳')
  assert(runIndex > 4 && ropeIndex > 4, '项目列在身份列之后')
  const filledRow: Array<string | number> = filledHeaders.map(() => '')
  filledRow[0] = '测试学生'
  filledRow[1] = 'T001'
  filledRow[2] = '测试班'
  filledRow[3] = '男'
  filledRow[4] = '正常'
  filledRow[runIndex] = '3.39'
  filledRow[ropeIndex] = '154'

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([filledHeaders, filledRow]), EXAM_TEMPLATE_SCORE_SHEET)
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(blank.sheets[1].rows), EXAM_TEMPLATE_GUIDE_SHEET)
  const scoreSheet = workbook.Sheets[EXAM_TEMPLATE_SCORE_SHEET]
  assert(!scoreSheet?.['!merges'] || scoreSheet['!merges'].length === 0, '成绩登记不得含合并单元格')
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer
  const tempDir = mkdtempSync(join(tmpdir(), 'exam-template-rt-'))
  let diskBuffer: Buffer
  try {
    const tempPath = join(tempDir, blank.defaultFileName)
    writeFileSync(tempPath, buffer)
    diskBuffer = readFileSync(tempPath)
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
  const reread = XLSX.read(diskBuffer, { type: 'buffer', cellNF: true, cellText: true, cellDates: false })
  assert(reread.SheetNames.includes(EXAM_TEMPLATE_SCORE_SHEET), '回读含成绩登记')
  assert(reread.SheetNames.includes(EXAM_TEMPLATE_GUIDE_SHEET), '回读含填写说明')
  const sheet = reread.Sheets[EXAM_TEMPLATE_SCORE_SHEET]
  assert(sheet, '回读成绩登记工作表')
  assert(!sheet['!merges'] || sheet['!merges'].length === 0, '回读后仍无合并单元格')
  const displayed = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: '', blankrows: true })
  const rawTable = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: '', blankrows: true })
  assert(displayed.length >= 2, '成绩登记应只有表头+数据，无标题行')
  assert((displayed[0] as unknown[]).slice(0, 5).map(String).join('|') === EXAM_TEMPLATE_IDENTITY_HEADERS.join('|'), '回读第一行仍是字段名')
  const snapshot = worksheetRowsToSnapshot(displayed, rawTable, blank.defaultFileName, EXAM_TEMPLATE_SCORE_SHEET)
  const titles = snapshot.columns.map((column) => column.title)
  assert(isOfficialExamTemplateHeaders(titles), '回读后仍识别为官方模板')
  const suggested = suggestColumnMapping(titles, guangzhou)
  const candidate = suggested.mapping.columns.find((role) => role.kind === 'examItemKey' && role.itemKey === 'run-1000m')
  const ropeRole = suggested.mapping.columns.find((role) => role.kind === 'examItemKey' && role.itemKey === 'rope-skip-1min')
  assert(candidate, '自动映射 1000米跑')
  assert(ropeRole, '自动映射 一分钟跳绳')
  assert(
    suggested.mapping.columns.find((role) => role.sourceHeader === '考生类别')?.kind === 'ignore',
    '考生类别不得当成绩列'
  )

  const converted = buildBatchAssessmentRows(guangzhou, suggested.mapping, snapshot)
  const runRow = converted.rows.find((row) => row.examItemId === 'male-1000m' || row.examItemName.includes('1000'))
  const ropeRow = converted.rows.find((row) => row.examItemId === 'rope-skip-1min' || row.examItemName.includes('跳绳'))
  if (!runRow) {
    throw new Error('应产出1000米成绩行')
  }
  if (!ropeRow) {
    throw new Error('应产出跳绳成绩行')
  }
  assert(runRow.status === 'success', `1000米应换算成功，实际 ${runRow.status} ${runRow.message}`)
  assert(ropeRow.status === 'success', `跳绳应换算成功，实际 ${ropeRow.status} ${ropeRow.message}`)
  assert(runRow.rawValueOriginal === '3.39', `1000米 rawValueOriginal=${runRow.rawValueOriginal}`)
  assert(ropeRow.rawValueOriginal === '154', `跳绳 rawValueOriginal=${ropeRow.rawValueOriginal}`)
  assert(runRow.rawValueOriginal !== '1000米' && runRow.rawValueOriginal !== '1000米跑', '表头不得进入 rawValueOriginal')
  assert(ropeRow.rawValueOriginal !== '一分钟跳绳', '项目名不得进入 rawValueOriginal')
  assert(runRow.rawValueParsed === 219, `3.39 应解析为 219 秒，实际 ${runRow.rawValueParsed}`)
  assert(runRow.rawValueNormalized === '3:39', `1000米 normalized 应为 3:39（219秒），实际 ${runRow.rawValueNormalized}`)
  assert(ropeRow.rawValueParsed === 154, `154 应解析为 154，实际 ${ropeRow.rawValueParsed}`)
  assert(ropeRow.rawValueNormalized === '154', `跳绳 normalized 应为 154（154次），实际 ${ropeRow.rawValueNormalized}`)
  console.log(
    `[examBatch template round-trip] 1000m original=${runRow.rawValueOriginal} normalized=${runRow.rawValueNormalized} parsed=${runRow.rawValueParsed}`
  )
  console.log(
    `[examBatch template round-trip] rope original=${ropeRow.rawValueOriginal} normalized=${ropeRow.rawValueNormalized} parsed=${ropeRow.rawValueParsed}`
  )

  assert(examTemplateFileBaseName(gaokao) === '体育成绩登记模板_广东体育高考_2026', '高考模板文件名')
}

export function runExamBatchSelfCheckOrThrow(): string {
  runExamBatchSelfCheck()
  return 'exam batch self-check passed'
}
