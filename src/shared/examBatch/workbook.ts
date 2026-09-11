import { calculateExamScore, formatExamRawValue } from '../examStandard/score'
import type { ExamItemDefinition, ExamStandard } from '../examStandard/types'
import {
  columnAutoConfirmed,
  detectExamItemColumn,
  isGenericRawHeader,
  isIgnoredExamHeader,
  isProjectLabelHeader,
  type DetectedExamItemColumn
} from './detectExamItemColumn'
import type {
  BatchAssessmentRow,
  BatchConvertResult,
  ExamColumnMapping,
  ExamColumnRole,
  ExamExportMeta,
  ExamSheetSnapshot,
  ExcelDataRow
} from './types'
import { parseExamBatchGender } from './parseGender'
import {
  detectExamNonScoreLabel,
  isBlankExamCell,
  nonScoreLabelFromBatchRow,
  nonScoreRecordMessage,
  parseExamBatchRawValue,
  type ExamNonScoreLabel
} from './parseRaw'
import { coerceExamSnapshot } from './readSheet'
import { isDeclaredScoreHeader } from './declaredScores'

const NAME_ALIASES = ['姓名', '学生姓名', '名字']
const STUDENT_NO_ALIASES = ['学号', '学籍号', '编号']
const SERIAL_ALIASES = ['序号']
const GENDER_ALIASES = ['性别', '男女']
const CLASS_ALIASES = ['班级', '行政班', '班别']

function aliasesHit(title: string, aliases: string[]): boolean {
  const exact = title.replace(/\u3000/g, ' ').trim()
  const normalized = exact.replace(/\s+/g, '').toLowerCase()
  return aliases.some((alias) => exact === alias || alias.replace(/\s+/g, '').toLowerCase() === normalized)
}

function indexesMatching(titles: string[], aliases: string[]): number[] {
  return titles.flatMap((title, index) => (aliasesHit(title, aliases) ? [index] : []))
}

function source(index: number, titles: string[]): { sourceColumn: number; sourceHeader: string } {
  return { sourceColumn: index, sourceHeader: titles[index] ?? '' }
}

export interface ProjectScoreGroup {
  mappingId: string
  projectColumnIndex: number | null
  resultColumnIndex: number
  mixedLabels: boolean
  detected: DetectedExamItemColumn
}

export interface WorkbookDetection {
  mapping: ExamColumnMapping
  projectGroups: ProjectScoreGroup[]
  itemColumns: DetectedExamItemColumn[]
  ignoredColumns: Array<{ index: number; header: string; reason: string }>
  genericRawIndexes: number[]
  issues: string[]
  identityReady: boolean
  autoReady: boolean
}

export function projectGroupMappingId(projectColumnIndex: number | null, resultColumnIndex: number): string {
  return `p${projectColumnIndex ?? 'h'}-r${resultColumnIndex}`
}

export function updateProjectGroupOverride(
  current: Record<string, string>,
  mappingId: string,
  itemId: string
): Record<string, string> {
  if (!itemId) {
    const next = { ...current }
    delete next[mappingId]
    return next
  }
  return { ...current, [mappingId]: itemId }
}

function inferFromProjectCells(
  labels: string[],
  standard: ExamStandard,
  resultColumnIndex: number,
  originalHeader: string
): { mixed: boolean; detected: DetectedExamItemColumn } {
  const unique = [...new Set(labels.map((label) => label.replace(/\u3000/g, ' ').trim()).filter((label) => label !== ''))]
  if (unique.length === 0) {
    return { mixed: false, detected: detectExamItemColumn(originalHeader, standard, resultColumnIndex) }
  }
  const matched = unique.map((label) => detectExamItemColumn(label, standard, resultColumnIndex))
  const confirmed = matched.filter((item) => columnAutoConfirmed(item))
  const keys = new Set(confirmed.map((item) => item.matchedItemKey).filter((key): key is string => Boolean(key)))
  if (confirmed.length === unique.length && keys.size === 1) {
    return { mixed: false, detected: confirmed[0] }
  }
  if (confirmed.length > 0 && keys.size > 1) {
    return { mixed: true, detected: confirmed[0] }
  }
  if (unique.length === 1) {
    return { mixed: false, detected: matched[0] }
  }
  return { mixed: true, detected: confirmed[0] ?? matched[0] ?? detectExamItemColumn(originalHeader, standard, resultColumnIndex) }
}

export function detectWorkbookColumns(
  titles: string[],
  standard: ExamStandard,
  dataRows: ExcelDataRow[] = []
): WorkbookDetection {
  const roles: ExamColumnRole[] = titles.map((_title, index) => ({ kind: 'ignore', ...source(index, titles) }))
  const issues: string[] = []
  const used = new Set<number>()

  function bind(index: number, kind: 'studentName' | 'studentNo' | 'gender' | 'className' | 'rawValue'): void {
    roles[index] = { kind, ...source(index, titles) }
    used.add(index)
  }

  const nameHits = indexesMatching(titles, NAME_ALIASES)
  const noHits = indexesMatching(titles, STUDENT_NO_ALIASES)
  const serialHits = indexesMatching(titles, SERIAL_ALIASES)
  const genderHits = indexesMatching(titles, GENDER_ALIASES)
  const classHits = indexesMatching(titles, CLASS_ALIASES)

  if (nameHits.length === 1) bind(nameHits[0], 'studentName')
  else if (nameHits.length > 1) issues.push('姓名列重复，需要手动指定')
  else issues.push('未识别到姓名列')

  if (noHits.length === 1) bind(noHits[0], 'studentNo')
  else if (noHits.length > 1) issues.push('学号列重复，需要手动指定')
  else if (serialHits.length === 1) bind(serialHits[0], 'studentNo')

  if (genderHits.length === 1) bind(genderHits[0], 'gender')
  else if (genderHits.length > 1) issues.push('性别列重复，需要手动指定')
  else issues.push('未识别到性别列')

  if (classHits.length === 1) bind(classHits[0], 'className')

  const projectGroups: ProjectScoreGroup[] = []
  const ignoredColumns: WorkbookDetection['ignoredColumns'] = []
  const genericRawIndexes: number[] = []

  function labelsInColumn(index: number): string[] {
    return dataRows.map((row) => (row.cells[index] ?? '').replace(/\u3000/g, ' ').trim()).filter((label) => label !== '')
  }

  function pushGroup(projectColumnIndex: number | null, resultColumnIndex: number, detected: DetectedExamItemColumn, mixedLabels: boolean): void {
    const mappingId = projectGroupMappingId(projectColumnIndex, resultColumnIndex)
    projectGroups.push({ mappingId, projectColumnIndex, resultColumnIndex, mixedLabels, detected })
    used.add(resultColumnIndex)
    if (projectColumnIndex !== null) {
      used.add(projectColumnIndex)
    }
  }

  for (let index = 0; index < titles.length; index += 1) {
    if (used.has(index)) {
      continue
    }
    const title = titles[index] ?? ''
    const nextTitle = titles[index + 1] ?? ''
    if (isProjectLabelHeader(title) && isGenericRawHeader(nextTitle)) {
      const inferred = inferFromProjectCells(labelsInColumn(index), standard, index + 1, title)
      pushGroup(index, index + 1, inferred.detected, inferred.mixed)
      bind(index + 1, 'rawValue')
      index += 1
      continue
    }
    if (isIgnoredExamHeader(title) || isDeclaredScoreHeader(title)) {
      ignoredColumns.push({
        index,
        header: title,
        reason: isDeclaredScoreHeader(title) ? '已声明得分列，第一版按原始成绩换算，不覆盖 Excel 得分' : '非评分列 / 已忽略'
      })
      used.add(index)
      continue
    }
    if (isGenericRawHeader(title)) {
      genericRawIndexes.push(index)
      bind(index, 'rawValue')
      pushGroup(null, index, detectExamItemColumn(title, standard, index), false)
      continue
    }
    const detected = detectExamItemColumn(title, standard, index)
    if (columnAutoConfirmed(detected) || detected.matchType === 'ambiguous') {
      pushGroup(null, index, detected, false)
      if (detected.matchedItemKey) {
        roles[index] = { kind: 'examItemKey', itemKey: detected.matchedItemKey, ...source(index, titles) }
      } else if (detected.matchedItemId) {
        roles[index] = { kind: 'examItem', itemId: detected.matchedItemId, ...source(index, titles) }
      }
      continue
    }
    ignoredColumns.push({ index, header: title, reason: detected.reason || '非评分列 / 已忽略' })
    used.add(index)
  }

  const itemColumns = projectGroups.map((group) => ({
    ...group.detected,
    columnIndex: group.resultColumnIndex,
    originalHeader: titles[group.projectColumnIndex ?? group.resultColumnIndex] ?? group.detected.originalHeader
  }))
  const identityReady = roles.some((role) => role.kind === 'studentName') && roles.some((role) => role.kind === 'gender')
  const autoReady =
    identityReady &&
    projectGroups.length > 0 &&
    projectGroups.some((group) => columnAutoConfirmed(group.detected) || group.mixedLabels)

  return {
    mapping: { layout: projectGroups.some((group) => group.projectColumnIndex !== null) ? 'long' : 'wide', columns: roles },
    projectGroups,
    itemColumns,
    ignoredColumns,
    genericRawIndexes,
    issues,
    identityReady,
    autoReady
  }
}

function cellAt(row: { cells: string[] }, index: number | undefined): string {
  if (index === undefined || !Number.isInteger(index) || index < 0) {
    return ''
  }
  return row.cells[index] ?? ''
}

function rawAt(row: { raw: unknown[] }, index: number | undefined): unknown {
  if (index === undefined || !Number.isInteger(index) || index < 0) {
    return undefined
  }
  return row.raw[index]
}

function roleIndex(mapping: ExamColumnMapping, kind: ExamColumnRole['kind']): number | undefined {
  const role = mapping.columns.find((entry) => entry.kind === kind)
  return role ? role.sourceColumn : undefined
}

function looksLikeNoteRow(cells: string[]): boolean {
  const text = cells.join('').replace(/\s/g, '')
  return /^(说明|备注|注[:：]|合计|本表)/.test(text)
}

function originalOf(display: string, raw: unknown): string {
  const trimmedDisplay = display.replace(/\u3000/g, ' ').trim()
  if (trimmedDisplay !== '') {
    return trimmedDisplay
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return String(raw)
  }
  if (typeof raw === 'string') {
    return raw.replace(/\u3000/g, ' ').trim()
  }
  return ''
}

function adjacentStatusNonScore(
  row: ExcelDataRow,
  resultColumnIndex: number,
  ignoredColumns: WorkbookDetection['ignoredColumns']
): ExamNonScoreLabel | null {
  const next = ignoredColumns.find((column) => column.index === resultColumnIndex + 1)
  if (!next || !next.header.includes('状态')) {
    return null
  }
  return detectExamNonScoreLabel(cellAt(row, next.index)) ?? detectExamNonScoreLabel(rawAt(row, next.index))
}

function formatNormalizedResult(item: ExamItemDefinition, parsed: number | null, formatted: string | null): string {
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

function resolveColumnItem(
  standard: ExamStandard,
  column: DetectedExamItemColumn,
  gender: 'male' | 'female' | null,
  confirmedItemId?: string
): ExamItemDefinition | null {
  if (confirmedItemId) {
    return standard.items.find((item) => item.id === confirmedItemId) ?? null
  }
  if (gender === 'male' && column.maleItemId) {
    return standard.items.find((item) => item.id === column.maleItemId) ?? null
  }
  if (gender === 'female' && column.femaleItemId) {
    return standard.items.find((item) => item.id === column.femaleItemId) ?? null
  }
  if (column.matchedItemId) {
    return standard.items.find((item) => item.id === column.matchedItemId) ?? null
  }
  if (column.matchedItemKey && gender) {
    return (
      standard.items.find((item) => item.itemKey === column.matchedItemKey && (item.gender === 'all' || item.gender === gender)) ??
      null
    )
  }
  return null
}

function scoreCell(
  standard: ExamStandard,
  item: ExamItemDefinition,
  gender: 'male' | 'female',
  display: string,
  raw: unknown,
  identity: Omit<BatchAssessmentRow, 'status' | 'message' | 'score' | 'rawValueNormalized' | 'rawValueParsed' | 'examItemId' | 'examItemName' | 'rawValueOriginal'>,
  fallbackNonScore?: ExamNonScoreLabel | null
): BatchAssessmentRow {
  const original = originalOf(display, raw)
  const base: BatchAssessmentRow = {
    ...identity,
    examItemId: item.id,
    examItemName: item.name,
    rawValueOriginal: original,
    rawValueNormalized: null,
    rawValueParsed: null,
    score: null,
    status: 'invalid_raw_value',
    message: ''
  }
  const blank = isBlankExamCell(display, raw) && original === ''
  const nonScore =
    detectExamNonScoreLabel(original) ??
    detectExamNonScoreLabel(display) ??
    detectExamNonScoreLabel(raw) ??
    (blank ? fallbackNonScore ?? null : null)
  if (nonScore) {
    return {
      ...base,
      rawValueOriginal: original || nonScore,
      status: 'non_score_record',
      message: nonScoreRecordMessage(nonScore)
    }
  }
  if (blank) {
    return {
      ...base,
      status: 'non_score_record',
      message: nonScoreRecordMessage('未测')
    }
  }
  const parsed = parseExamBatchRawValue(display, raw, item)
  if (!parsed.ok) {
    return { ...base, status: 'invalid_raw_value', message: '成绩格式无法识别' }
  }
  const normalized = formatNormalizedResult(item, parsed.value, formatExamRawValue(parsed.value, item))
  const scored = calculateExamScore({
    standard,
    itemId: item.id,
    rawValue: parsed.value,
    gender,
    officialOnly: true
  })
  if (!scored.ok) {
    if (scored.code === 'GENDER_MISMATCH') {
      return { ...base, rawValueNormalized: normalized, rawValueParsed: parsed.value, status: 'not_applicable', message: '' }
    }
    const noTable =
      scored.code === 'NOT_VERIFIED' ||
      scored.code === 'NO_TABLE' ||
      scored.code === 'DEPRECATED_DEFAULT' ||
      scored.code === 'UNSUPPORTED_MODEL'
    return {
      ...base,
      rawValueNormalized: normalized,
      rawValueParsed: parsed.value,
      status: noTable ? 'no_score_table' : 'invalid_raw_value',
      message: noTable ? '当前项目暂无完整官方评分表' : '成绩格式无法识别'
    }
  }
  return {
    ...base,
    rawValueNormalized: formatNormalizedResult(item, scored.rawValue, scored.formattedRawValue),
    rawValueParsed: scored.rawValue,
    score: scored.score,
    status: 'success',
    message: ''
  }
}

function resolveGroupItem(
  standard: ExamStandard,
  group: ProjectScoreGroup,
  row: ExcelDataRow,
  gender: 'male' | 'female' | null,
  options?: { genericItemId?: string; confirmedColumns?: Record<number, string>; groupOverrides?: Record<string, string> }
): ExamItemDefinition | null {
  const overrideId = options?.groupOverrides?.[group.mappingId] || options?.confirmedColumns?.[group.resultColumnIndex]
  if (overrideId) {
    return standard.items.find((entry) => entry.id === overrideId) ?? null
  }
  if (group.mixedLabels && group.projectColumnIndex !== null) {
    const label = cellAt(row, group.projectColumnIndex)
    const detected = detectExamItemColumn(label, standard, group.resultColumnIndex)
    return resolveColumnItem(standard, detected, gender)
  }
  if (
    group.projectColumnIndex === null &&
    !columnAutoConfirmed(group.detected) &&
    group.detected.matchType !== 'ambiguous' &&
    options?.genericItemId
  ) {
    return standard.items.find((entry) => entry.id === options.genericItemId) ?? null
  }
  return resolveColumnItem(standard, group.detected, gender, options?.confirmedColumns?.[group.resultColumnIndex])
}

function groupDisplayName(group: ProjectScoreGroup, snapshot: ExamSheetSnapshot, item: ExamItemDefinition | null): string {
  if (item) return item.name
  if (group.detected.matchedItemName) return group.detected.matchedItemName
  const headerIndex = group.projectColumnIndex ?? group.resultColumnIndex
  return snapshot.columns[headerIndex]?.title || '成绩'
}

export function convertWorkbookExamBatch(
  standard: ExamStandard,
  snapshot: ExamSheetSnapshot,
  detection: WorkbookDetection,
  options?: { genericItemId?: string; confirmedColumns?: Record<number, string>; groupOverrides?: Record<string, string> }
): BatchConvertResult {
  const prepared = coerceExamSnapshot(snapshot)
  const nameIndex = roleIndex(detection.mapping, 'studentName')
  const noIndex = roleIndex(detection.mapping, 'studentNo')
  const classIndex = roleIndex(detection.mapping, 'className')
  const genderIndex = roleIndex(detection.mapping, 'gender')
  const groups = detection.projectGroups.length > 0
    ? detection.projectGroups
    : [
        ...detection.itemColumns.map((column) => ({
          mappingId: projectGroupMappingId(null, column.columnIndex),
          projectColumnIndex: null,
          resultColumnIndex: column.columnIndex,
          mixedLabels: false,
          detected: column
        })),
        ...detection.genericRawIndexes.map((columnIndex) => ({
          mappingId: projectGroupMappingId(null, columnIndex),
          projectColumnIndex: null,
          resultColumnIndex: columnIndex,
          mixedLabels: false,
          detected: detectExamItemColumn(snapshot.columns[columnIndex]?.title ?? '成绩', standard, columnIndex)
        }))
      ]
  const rows: BatchAssessmentRow[] = []

  for (const row of prepared.rows) {
    const studentName = cellAt(row, nameIndex)
    const studentNo = cellAt(row, noIndex)
    const className = cellAt(row, classIndex)
    const genderRaw = cellAt(row, genderIndex)
    const anyValue = groups.some((group) => originalOf(cellAt(row, group.resultColumnIndex), rawAt(row, group.resultColumnIndex)) !== '')
    if (studentName === '' && !anyValue && looksLikeNoteRow(row.cells)) {
      continue
    }
    if (studentName === '' && !anyValue && genderRaw === '') {
      continue
    }

    const gender = parseExamBatchGender(genderRaw)
    const identity = {
      sourceRow: row.excelRow,
      studentNo,
      studentName,
      className,
      gender,
      examStandardId: standard.id
    }

    for (const group of groups) {
      const display = cellAt(row, group.resultColumnIndex)
      const raw = rawAt(row, group.resultColumnIndex)
      const original = originalOf(display, raw)
      const item = resolveGroupItem(standard, group, row, gender, options)
      const examItemName = groupDisplayName(group, snapshot, item)

      if (studentName === '') {
        if (original === '') continue
        rows.push({
          ...identity,
          examItemId: item?.id ?? null,
          examItemName,
          sourceColumn: group.resultColumnIndex,
          rawValueOriginal: original,
          rawValueNormalized: null,
          rawValueParsed: null,
          score: null,
          status: 'needs_review',
          message: '缺少姓名'
        })
        continue
      }
      if (!gender) {
        if (original === '') continue
        rows.push({
          ...identity,
          examItemId: item?.id ?? null,
          examItemName,
          sourceColumn: group.resultColumnIndex,
          rawValueOriginal: original,
          rawValueNormalized: null,
          rawValueParsed: null,
          score: null,
          status: 'unrecognized_gender',
          message: '性别无法识别'
        })
        continue
      }
      if (!item) {
        if (original === '') continue
        rows.push({
          ...identity,
          examItemId: null,
          examItemName,
          sourceColumn: group.resultColumnIndex,
          rawValueOriginal: original,
          rawValueNormalized: null,
          rawValueParsed: null,
          score: null,
          status: 'not_applicable',
          message: ''
        })
        continue
      }
      if (item.gender !== 'all' && item.gender !== gender) {
        if (original === '') continue
        rows.push({
          ...identity,
          examItemId: item.id,
          examItemName: item.name,
          sourceColumn: group.resultColumnIndex,
          rawValueOriginal: original,
          rawValueNormalized: null,
          rawValueParsed: null,
          score: null,
          status: 'not_applicable',
          message: ''
        })
        continue
      }
      rows.push(
        scoreCell(standard, item, gender, display, raw, { ...identity, sourceColumn: group.resultColumnIndex }, adjacentStatusNonScore(row, group.resultColumnIndex, detection.ignoredColumns))
      )
    }
  }

  const students = new Set(rows.map((row) => `${row.studentNo}|${row.studentName}|${row.className}`))
  const scored = rows.filter((row) => row.status !== 'not_applicable')
  const successCount = scored.filter((row) => row.status === 'success').length
  const errorCount = scored.filter((row) => row.status !== 'success' && row.status !== 'non_score_record').length
  return {
    rows,
    summary: {
      studentCount: students.size,
      recordCount: scored.length,
      successCount,
      errorCount
    }
  }
}

export function displayBatchStatus(row: BatchAssessmentRow): '成功' | '无法评分' | '待检查' | '不适用' | ExamNonScoreLabel {
  if (row.status === 'success') return '成功'
  if (row.status === 'needs_review') return '待检查'
  if (row.status === 'not_applicable') return '不适用'
  if (row.status === 'non_score_record') {
    return nonScoreLabelFromBatchRow(row) ?? '未测'
  }
  return '无法评分'
}

export function workbookStudentGroups(rows: BatchAssessmentRow[]): Array<{
  sourceRow: number
  studentName: string
  studentNo: string
  gender: BatchAssessmentRow['gender']
  cells: BatchAssessmentRow[]
  successCount: number
  nonScoreCount: number
  errorCount: number
}> {
  const map = new Map<number, BatchAssessmentRow[]>()
  for (const row of rows) {
    const list = map.get(row.sourceRow) ?? []
    list.push(row)
    map.set(row.sourceRow, list)
  }
  return [...map.entries()].map(([sourceRow, cells]) => {
    const first = cells[0]
    const counted = cells.filter((cell) => cell.status !== 'not_applicable')
    return {
      sourceRow,
      studentName: first.studentName,
      studentNo: first.studentNo,
      gender: first.gender,
      cells,
      successCount: counted.filter((cell) => cell.status === 'success').length,
      nonScoreCount: counted.filter((cell) => cell.status === 'non_score_record').length,
      errorCount: counted.filter((cell) => cell.status !== 'success' && cell.status !== 'non_score_record').length
    }
  })
}

export function workbookItemSummaries(rows: BatchAssessmentRow[]): Array<{
  columnIndex: number
  name: string
  total: number
  success: number
  nonScore: number
  error: number
}> {
  const map = new Map<string, { columnIndex: number; name: string; total: number; success: number; nonScore: number; error: number }>()
  for (const row of rows) {
    if (row.status === 'not_applicable') {
      continue
    }
    const key = `${row.sourceColumn ?? row.examItemName}|${row.examItemName}`
    const current = map.get(key) ?? {
      columnIndex: row.sourceColumn ?? -1,
      name: row.examItemName,
      total: 0,
      success: 0,
      nonScore: 0,
      error: 0
    }
    current.total += 1
    if (row.status === 'success') current.success += 1
    else if (row.status === 'non_score_record') current.nonScore += 1
    else current.error += 1
    map.set(key, current)
  }
  return [...map.values()]
}

export function buildWorkbookExportSheets(
  snapshot: ExamSheetSnapshot,
  rows: BatchAssessmentRow[],
  detection: WorkbookDetection,
  meta: ExamExportMeta & { cityName: string; versionLabel: string; credibility: string }
): Array<{ name: string; rows: Array<Array<string | number>> }> {
  const itemIndexes = new Set(
    detection.projectGroups.length > 0
      ? detection.projectGroups.map((group) => group.resultColumnIndex)
      : [
          ...detection.itemColumns.filter((column) => columnAutoConfirmed(column)).map((column) => column.columnIndex),
          ...detection.genericRawIndexes
        ]
  )
  const header: string[] = []
  snapshot.columns.forEach((column) => {
    header.push(column.title)
    if (itemIndexes.has(column.index)) {
      header.push(`${column.title}_换算分`, `${column.title}_评分状态`, `${column.title}_说明`)
    }
  })

  const byRow = new Map<number, BatchAssessmentRow[]>()
  for (const row of rows) {
    const list = byRow.get(row.sourceRow) ?? []
    list.push(row)
    byRow.set(row.sourceRow, list)
  }

  const body = snapshot.rows.map((excelRow) => {
    const scored = byRow.get(excelRow.excelRow) ?? []
    const cells: Array<string | number> = []
    snapshot.columns.forEach((column, index) => {
      cells.push(excelRow.cells[index] ?? '')
      if (itemIndexes.has(column.index)) {
        const hit = scored.find((entry) => entry.sourceColumn === column.index)
        cells.push(hit?.score ?? '', hit ? displayBatchStatus(hit) : '', hit?.message ?? '')
      }
    })
    return cells
  })

  return [
    { name: '评分结果', rows: [header, ...body] },
    {
      name: '换算说明',
      rows: [
        ['评分城市', meta.cityName],
        ['规则版本', meta.versionLabel],
        ['评分时间', meta.exportedAt],
        ['可信度', meta.credibility],
        ['标准名称', meta.standardTitle],
        ['官方来源', meta.sourceTitle],
        ['来源链接', meta.sourceUrl ?? ''],
        ['识别项目', (detection.projectGroups.length > 0 ? detection.projectGroups.map((group) => group.detected.matchedItemName || group.detected.originalHeader) : detection.itemColumns.filter((column) => columnAutoConfirmed(column)).map((column) => column.matchedItemName || column.originalHeader)).join('、')],
        [],
        ['说明', '未覆盖原始 Excel。原始列全部保留，并在每个识别项目旁追加换算分、评分状态和说明。空白换算分表示未自动换算或该格不适用，不是程序故障。']
      ]
    }
  ]
}
