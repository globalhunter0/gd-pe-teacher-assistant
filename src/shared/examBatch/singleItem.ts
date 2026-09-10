import { itemSupportsAutoScore, standardAllowsOfficialConvert } from '../examStandard/score'
import type { ExamItemDefinition, ExamStandard } from '../examStandard/types'
import { isGenericRawHeader } from './detectExamItemColumn'
import { normalizeExamLabel } from './matchExamItem'
import type { ExamColumnMapping, ExamColumnRole, ExamExportMeta, ExamSheetSnapshot, MappingConfidence } from './types'
import { buildWorkbookExportSheets, convertWorkbookExamBatch, detectWorkbookColumns, displayBatchStatus } from './workbook'

export { displayBatchStatus } from './workbook'
export { convertWorkbookExamBatch, detectWorkbookColumns, buildWorkbookExportSheets } from './workbook'

export const MISSING_TABLE_HINT = '该城市/版本暂无完整官方评分表，暂不支持自动换算'
export const AUTO_SCORE_CREDIBILITY = '依据已核验官方评分标准自动换算'
export const NO_AUTO_SCORE_CREDIBILITY = '暂无完整官方评分标准，未自动换算'

export type SingleItemDisplayStatus = '成功' | '无法评分' | '待检查' | '不适用'

export interface SingleItemColumnSuggestion {
  index: number
  title: string
  role: ExamColumnRole
  label: string
  confidence: MappingConfidence
}

export interface SingleItemDetection {
  mapping: ExamColumnMapping
  suggestions: SingleItemColumnSuggestion[]
  autoReady: boolean
  issues: string[]
}

const NAME_ALIASES = ['姓名', '学生姓名', '名字']
const STUDENT_NO_ALIASES = ['学号', '学籍号', '编号']
const SERIAL_ALIASES = ['序号']
const GENDER_ALIASES = ['性别', '男女']
const RAW_ALIASES = ['成绩', '原始成绩', '测试成绩', '成绩值', '测试结果']
const RAW_BLOCKLIST = ['最终分', '得分', '分数', '换算分', '评分']

function aliasesHit(title: string, aliases: string[]): boolean {
  const exact = title.replace(/\u3000/g, ' ').trim()
  const normalized = normalizeExamLabel(exact)
  return aliases.some((alias) => exact === alias || normalizeExamLabel(alias) === normalized)
}

function indexesMatching(titles: string[], aliases: string[]): number[] {
  return titles.flatMap((title, index) => (aliasesHit(title, aliases) ? [index] : []))
}

function source(index: number, titles: string[]): { sourceColumn: number; sourceHeader: string } {
  return { sourceColumn: index, sourceHeader: titles[index] ?? '' }
}

export function itemAutoScoreLabel(standard: ExamStandard, item: ExamItemDefinition): string {
  if (itemSupportsAutoScore(item) && standardAllowsOfficialConvert(standard)) {
    return '可自动评分'
  }
  if (standard.scoreTableStatus === 'partial') {
    return '部分核验'
  }
  return '暂无官方完整评分表'
}

export function singleItemExportFileName(sourceFileName: string): string {
  const trimmed = sourceFileName.replace(/\.(xlsx|xls)$/i, '').trim()
  const base = trimmed === '' ? '成绩' : trimmed
  return `${base}_评分结果.xlsx`
}

export function formatNormalizedResult(item: ExamItemDefinition, parsed: number | null, formatted: string | null): string {
  if (parsed == null) {
    return formatted ?? ''
  }
  if (item.valueType === 'time') {
    return `${parsed}秒`
  }
  if (item.unit === 'times') {
    return `${parsed}次`
  }
  return formatted ?? String(parsed)
}

export function detectSingleItemColumns(titles: string[]): SingleItemDetection {
  const roles: ExamColumnRole[] = titles.map((_title, index) => ({ kind: 'ignore', ...source(index, titles) }))
  const suggestions: SingleItemColumnSuggestion[] = []
  const issues: string[] = []

  function bind(
    index: number,
    kind: 'ignore' | 'studentName' | 'studentNo' | 'gender' | 'rawValue',
    label: string,
    confidence: MappingConfidence
  ): void {
    roles[index] = { kind, ...source(index, titles) }
    suggestions.push({ index, title: titles[index] ?? '', role: roles[index], label, confidence })
  }

  const nameHits = indexesMatching(titles, NAME_ALIASES)
  const noHits = indexesMatching(titles, STUDENT_NO_ALIASES)
  const serialHits = indexesMatching(titles, SERIAL_ALIASES)
  const genderHits = indexesMatching(titles, GENDER_ALIASES)
  const rawHits = indexesMatching(titles, RAW_ALIASES)
  const blockedRaw = indexesMatching(titles, RAW_BLOCKLIST)

  if (nameHits.length === 1) bind(nameHits[0], 'studentName', '姓名', 'high')
  else if (nameHits.length > 1) issues.push('姓名列重复，需要手动指定')
  else issues.push('未识别到姓名列')

  if (noHits.length === 1) bind(noHits[0], 'studentNo', '学号', 'high')
  else if (noHits.length > 1) issues.push('学号列重复，需要手动指定')
  else if (serialHits.length === 1) bind(serialHits[0], 'studentNo', '学号（序号）', 'medium')

  if (genderHits.length === 1) bind(genderHits[0], 'gender', '性别', 'high')
  else if (genderHits.length > 1) issues.push('性别列重复，需要手动指定')
  else issues.push('未识别到性别列')

  if (rawHits.length === 1) bind(rawHits[0], 'rawValue', '成绩', 'high')
  else if (rawHits.length > 1) issues.push('成绩列重复，需要手动指定')
  else if (blockedRaw.length > 0 && rawHits.length === 0) issues.push('识别到得分/分数列，但不能当作原始成绩')
  else issues.push('未识别到原始成绩列')

  const mapping: ExamColumnMapping = { layout: 'long', columns: roles }
  const autoReady =
    issues.length === 0 &&
    roles.some((role) => role.kind === 'studentName') &&
    roles.some((role) => role.kind === 'gender') &&
    roles.some((role) => role.kind === 'rawValue')
  return { mapping, suggestions, autoReady, issues }
}

export function convertSingleItemExamBatch(
  standard: ExamStandard,
  item: ExamItemDefinition,
  snapshot: ExamSheetSnapshot,
  _mapping: ExamColumnMapping
): BatchConvertResultFromWorkbook {
  const detection = detectWorkbookColumns(
    snapshot.columns.map((column) => column.title),
    standard,
    snapshot.rows
  )
  return convertWorkbookExamBatch(standard, snapshot, detection, { genericItemId: item.id })
}

type BatchConvertResultFromWorkbook = ReturnType<typeof convertWorkbookExamBatch>

export function singleItemPreviewSummary(rows: ReturnType<typeof convertWorkbookExamBatch>['rows']): {
  total: number
  success: number
  failed: number
  review: number
} {
  const counted = rows.filter((row) => row.status !== 'not_applicable')
  return {
    total: counted.length,
    success: counted.filter((row) => displayBatchStatus(row) === '成功').length,
    failed: counted.filter((row) => displayBatchStatus(row) === '无法评分').length,
    review: counted.filter((row) => displayBatchStatus(row) === '待检查').length
  }
}

export function buildSingleItemExportSheets(
  snapshot: ExamSheetSnapshot,
  rows: ReturnType<typeof convertWorkbookExamBatch>['rows'],
  meta: ExamExportMeta & { itemName: string; cityName: string; versionLabel: string; credibility: string }
): Array<{ name: string; rows: Array<Array<string | number>> }> {
  const titles = snapshot.columns.map((column) => column.title)
  const genericRawIndexes = snapshot.columns.flatMap((column, index) => (isGenericRawHeader(column.title) ? [index] : []))
  const fromRows = [...new Set(rows.map((row) => row.sourceColumn).filter((index): index is number => index !== undefined))]
  const indexes = genericRawIndexes.length > 0 ? genericRawIndexes : fromRows
  const detection = {
    mapping: { layout: 'long' as const, columns: [] },
    projectGroups: indexes.map((columnIndex) => ({
      mappingId: `pnull-r${columnIndex}`,
      projectColumnIndex: null,
      resultColumnIndex: columnIndex,
      mixedLabels: false,
      detected: {
        columnIndex,
        originalHeader: snapshot.columns[columnIndex]?.title ?? '成绩',
        matchedItemId: null,
        matchedItemKey: null,
        matchedItemName: meta.itemName,
        confidence: 'high' as const,
        matchType: 'exact' as const,
        genderScope: 'all' as const,
        unit: '',
        autoScoreSupported: true,
        scoreTableStatus: 'verified' as const,
        reason: '',
        candidates: [],
        maleItemId: null,
        femaleItemId: null
      }
    })),
    itemColumns: [],
    ignoredColumns: [],
    genericRawIndexes: indexes,
    issues: [],
    identityReady: true,
    autoReady: true
  }
  void titles
  return buildWorkbookExportSheets(snapshot, rows, detection, meta)
}
