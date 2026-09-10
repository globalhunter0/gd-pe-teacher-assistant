import { calculateExamScore, formatExamRawValue, itemSupportsAutoScore } from '../examStandard/score'
import type { ExamItemDefinition, ExamStandard } from '../examStandard/types'
import { normalizeExamColumnMapping } from './columnMapping'
import { matchExamItem } from './matchExamItem'
import { parseExamBatchGender } from './parseGender'
import { detectExamNonScoreLabel, nonScoreRecordMessage, parseExamBatchRawValue } from './parseRaw'
import { coerceExamDataRow, coerceExamSnapshot } from './readSheet'
import type {
  BatchAssessmentRow,
  BatchConvertResult,
  ExamColumnMapping,
  ExamColumnRole,
  ExcelDataRow,
  ExamSheetSnapshot
} from './types'

function cellAt(row: ExcelDataRow, index: number | undefined): string {
  if (index === undefined || !Number.isInteger(index) || index < 0) {
    return ''
  }
  return row.cells[index] ?? ''
}

function rawAt(row: ExcelDataRow, index: number | undefined): unknown {
  if (index === undefined || !Number.isInteger(index) || index < 0) {
    return undefined
  }
  return row.raw[index]
}

function sourceIndex(role: ExamColumnRole | undefined, fallbackIndex?: number): number | undefined {
  if (role && Number.isInteger(role.sourceColumn) && role.sourceColumn >= 0) {
    return role.sourceColumn
  }
  return fallbackIndex
}

function textOf(value: unknown): string {
  if (typeof value === 'string') {
    return value.replace(/\u3000/g, ' ').trim()
  }
  return ''
}

function isHeaderText(value: unknown, ...headers: string[]): boolean {
  const text = textOf(value)
  if (text === '') {
    return false
  }
  return headers.some((header) => header.replace(/\u3000/g, ' ').trim() === text)
}

function originalFrom(raw: unknown, display: string): string {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return String(raw)
  }
  if (typeof raw === 'string' && raw.trim() !== '') {
    return raw.trim()
  }
  return display
}

/**
 * Preview uses `cells` (formatted). Convert must not prefer a raw string that is
 * actually the column header / item name — that is the v0.10.1 wide-table bug.
 * Numeric raw is still used for parsing (Excel 4.2, date serials).
 */
function pickScoreCell(
  row: ExcelDataRow,
  columnIndex: number | undefined,
  sourceHeader: string,
  itemName = ''
): { original: string; display: string; raw: unknown } {
  const display = cellAt(row, columnIndex)
  const raw = rawAt(row, columnIndex)
  const labels = [sourceHeader, itemName]
  const numericRaw = typeof raw === 'number' && Number.isFinite(raw) ? raw : undefined
  const previewIsHeader = isHeaderText(display, ...labels)
  const original = previewIsHeader && numericRaw !== undefined ? String(numericRaw) : display.trim()
  const parseRaw = isHeaderText(raw, ...labels) ? (numericRaw ?? original) : (numericRaw ?? raw ?? original)
  return {
    original,
    display: original || display,
    raw: parseRaw
  }
}

function scoreColumnIndex(role: ExamColumnRole, fallbackIndex: number, titles: string[]): number | undefined {
  if (role.sourceHeader) {
    const byHeader = titles.indexOf(role.sourceHeader)
    if (byHeader >= 0) {
      return byHeader
    }
  }
  return sourceIndex(role, fallbackIndex)
}

function assertOriginalNotHeader(row: BatchAssessmentRow, sourceHeader: string): void {
  if (row.status === 'header_used_as_value') {
    return
  }
  if (row.rawValueOriginal === '' || sourceHeader === '') {
    return
  }
  if (row.rawValueOriginal.replace(/\u3000/g, ' ').trim() !== sourceHeader.replace(/\u3000/g, ' ').trim()) {
    return
  }
  console.error(`Batch conversion invariant violated: rawValueOriginal equals sourceHeader (${sourceHeader})`, row)
}

function findRole(mapping: ExamColumnMapping, kind: ExamColumnRole['kind']): ExamColumnRole | undefined {
  return mapping.columns.find((role) => role.kind === kind)
}

function fail(
  base: Omit<BatchAssessmentRow, 'status' | 'message' | 'score'> & { score?: number | null },
  status: BatchAssessmentRow['status'],
  message: string
): BatchAssessmentRow {
  return {
    ...base,
    rawValueNormalized: base.rawValueNormalized ?? null,
    rawValueParsed: base.rawValueParsed ?? null,
    score: null,
    status,
    message
  }
}

function resolveItem(
  standard: ExamStandard,
  mappingRole: ExamColumnRole | null,
  itemLabel: string,
  gender: ReturnType<typeof parseExamBatchGender>
): { item: ExamItemDefinition | null; status?: BatchAssessmentRow['status']; message?: string } {
  if (mappingRole?.kind === 'examItem') {
    const item = standard.items.find((entry) => entry.id === mappingRole.itemId) ?? null
    return item ? { item } : { item: null, status: 'unrecognized_item', message: '无法识别对应考试项目' }
  }

  if (mappingRole?.kind === 'examItemKey') {
    if (!gender) {
      return { item: null, status: 'unrecognized_gender', message: '缺少性别，无法确定评分表' }
    }
    const item = standard.items.find(
      (entry) => entry.itemKey === mappingRole.itemKey && (entry.gender === 'all' || entry.gender === gender)
    )
    if (!item) {
      return { item: null, status: 'unrecognized_item', message: '无法识别对应考试项目' }
    }
    return { item }
  }

  const match = matchExamItem(itemLabel, standard, gender)
  if (match.status === 'unmatched') {
    return { item: null, status: 'unrecognized_item', message: '无法识别对应考试项目' }
  }
  if (match.status === 'ambiguous') {
    return { item: null, status: 'ambiguous_item', message: '存在多个候选项目，请手动选择' }
  }
  return { item: match.item }
}

function scoreRow(
  standard: ExamStandard,
  item: ExamItemDefinition,
  gender: ReturnType<typeof parseExamBatchGender>,
  display: string,
  raw: unknown,
  sourceHeader: string,
  base: Omit<BatchAssessmentRow, 'status' | 'message' | 'score' | 'rawValueNormalized' | 'rawValueParsed' | 'examItemId' | 'examItemName' | 'rawValueOriginal'>,
  examItemName = item.name,
  rawValueOriginal = originalFrom(raw, display)
): BatchAssessmentRow {
  const withItem = {
    ...base,
    examItemId: item.id,
    examItemName,
    rawValueOriginal,
    rawValueNormalized: null as string | null,
    rawValueParsed: null as number | null
  }

  if (isHeaderText(rawValueOriginal, sourceHeader, item.name, examItemName)) {
    return fail(
      withItem,
      'header_used_as_value',
      `成绩列取到了表头“${rawValueOriginal}”，而不是单元格成绩。请检查列映射。`
    )
  }

  if (standard.status === 'partial' || standard.scoreTableStatus !== 'verified') {
    const message =
      standard.ruleStatus === 'verified'
        ? '考试方案已核验，但年度评分表尚未完整核验，暂不支持完整自动换算。'
        : '该城市/版本评分表尚未完整核验，暂不支持完整自动换算。'
    return fail(withItem, 'no_verified_standard', message)
  }
  if (standard.status !== 'verified') {
    return fail(withItem, 'no_verified_standard', '当前没有可用于正式换算的已核验评分标准。')
  }
  if (!gender && item.gender !== 'all') {
    return fail(withItem, 'unrecognized_gender', '无法识别性别，未评分')
  }
  const scoreGender = gender ?? 'male'
  if (item.gender !== 'all' && item.gender !== scoreGender) {
    return fail(withItem, 'unrecognized_gender', '该项目不适用所选性别')
  }

  const nonScore = detectExamNonScoreLabel(rawValueOriginal) ?? detectExamNonScoreLabel(display) ?? detectExamNonScoreLabel(raw)
  if (nonScore) {
    return {
      ...withItem,
      rawValueOriginal: rawValueOriginal || nonScore,
      score: null,
      status: 'non_score_record',
      message: nonScoreRecordMessage(nonScore)
    }
  }

  const parsed = parseExamBatchRawValue(display, raw, item)
  if (!parsed.ok) {
    return fail(withItem, 'invalid_raw_value', parsed.message)
  }

  const normalized = formatExamRawValue(parsed.value, item)
  const parsedItem = {
    ...withItem,
    rawValueNormalized: normalized,
    rawValueParsed: parsed.value
  }

  if (item.scoreRule.kind === 'unsupported' || item.verification === 'verified_unsupported') {
    return fail(parsedItem, 'unsupported_item', '成绩读取成功，但当前版本暂不支持该项目自动换算')
  }
  if (!itemSupportsAutoScore(item)) {
    return fail(parsedItem, 'no_score_table', '成绩读取成功，但当前评分标准暂无可用换算表')
  }

  const scored = calculateExamScore({
    standard,
    itemId: item.id,
    rawValue: parsed.value,
    gender: scoreGender,
    officialOnly: true
  })
  if (!scored.ok) {
    if (scored.code === 'UNSUPPORTED_MODEL') {
      return fail(parsedItem, 'unsupported_item', '成绩读取成功，但当前版本暂不支持该项目自动换算')
    }
    if (scored.code === 'NOT_VERIFIED' || scored.code === 'DEPRECATED_DEFAULT' || scored.code === 'NO_TABLE') {
      return fail(parsedItem, 'no_score_table', '成绩读取成功，但当前评分标准暂无可用换算表')
    }
    if (scored.code === 'GENDER_MISMATCH') {
      return fail(parsedItem, 'unrecognized_gender', scored.message)
    }
    if (scored.code === 'INVALID_VALUE') {
      return fail(parsedItem, 'invalid_raw_value', scored.message)
    }
    return fail(parsedItem, 'unrecognized_item', scored.message)
  }

  return {
    ...parsedItem,
    rawValueNormalized: formatExamRawValue(scored.rawValue, item),
    score: scored.score,
    status: 'success',
    message: ''
  }
}

export function convertExamBatch(
  standard: ExamStandard,
  mapping: ExamColumnMapping,
  rows: ExcelDataRow[],
  titles: string[] = []
): BatchConvertResult {
  const normalized = normalizeExamColumnMapping(mapping, titles)
  const columnTitles =
    titles.length > 0 ? titles : normalized.columns.map((role, index) => role.sourceHeader || `列${index + 1}`)
  const columns = columnTitles.map((title, index) => ({ index, title }))
  const preparedRows = rows.map((row) => coerceExamDataRow(row, columns))
  const nameRole = findRole(normalized, 'studentName')
  const noRole = findRole(normalized, 'studentNo')
  const classRole = findRole(normalized, 'className')
  const genderRole = findRole(normalized, 'gender')
  const itemRole = findRole(normalized, 'itemName')
  const valueRole = findRole(normalized, 'rawValue')
  const result: BatchAssessmentRow[] = []

  for (const row of preparedRows) {
    const studentName = cellAt(row, sourceIndex(nameRole))
    const studentNo = cellAt(row, sourceIndex(noRole))
    const className = cellAt(row, sourceIndex(classRole))
    const genderRaw = cellAt(row, sourceIndex(genderRole))
    const gender = parseExamBatchGender(genderRaw)
    const identity = {
      sourceRow: row.excelRow,
      studentNo,
      studentName,
      className,
      gender,
      examStandardId: standard.id
    }
    const missingIdentity = studentName === '' && studentNo === ''

    if (normalized.layout === 'long') {
      const itemLabel = cellAt(row, sourceIndex(itemRole))
      const picked = pickScoreCell(row, sourceIndex(valueRole), valueRole?.sourceHeader ?? '', itemLabel)
      const base = {
        ...identity,
        examItemId: null,
        examItemName: itemLabel,
        rawValueOriginal: picked.original,
        rawValueNormalized: null,
        rawValueParsed: null
      }
      if (missingIdentity) {
        result.push(fail(base, 'unrecognized_student_field', '缺少学号或姓名'))
        continue
      }
      if (genderRole && genderRaw !== '' && !gender) {
        result.push(fail(base, 'unrecognized_gender', '无法识别性别，未评分'))
        continue
      }
      const resolved = resolveItem(standard, null, itemLabel, gender)
      if (!resolved.item) {
        result.push(fail(base, resolved.status ?? 'unrecognized_item', resolved.message ?? '无法识别对应考试项目'))
        continue
      }
      result.push(
        scoreRow(
          standard,
          resolved.item,
          gender,
          picked.display,
          picked.raw,
          valueRole?.sourceHeader ?? '',
          identity,
          resolved.item.name,
          picked.original
        )
      )
      continue
    }

    for (const [columnIndex, role] of normalized.columns.entries()) {
      if (role.kind !== 'examItem' && role.kind !== 'examItemKey') {
        continue
      }
      const column = scoreColumnIndex(role, columnIndex, columnTitles)
      const previewEmpty = cellAt(row, column) === '' && (rawAt(row, column) === undefined || rawAt(row, column) === '')
      if (previewEmpty) {
        continue
      }
      const resolved = resolveItem(standard, role, role.sourceHeader, gender)
      const itemName = resolved.item?.name ?? role.sourceHeader
      const picked = pickScoreCell(row, column, role.sourceHeader, itemName)
      const base = {
        ...identity,
        examItemId: role.kind === 'examItem' ? role.itemId : resolved.item?.id ?? null,
        examItemName: role.sourceHeader || itemName,
        rawValueOriginal: picked.original,
        rawValueNormalized: null,
        rawValueParsed: null
      }
      if (missingIdentity) {
        result.push(fail(base, 'unrecognized_student_field', '缺少学号或姓名'))
        continue
      }
      if (genderRole && genderRaw !== '' && !gender) {
        result.push(fail(base, 'unrecognized_gender', '无法识别性别，未评分'))
        continue
      }
      if (!resolved.item) {
        result.push(fail(base, resolved.status ?? 'unrecognized_item', resolved.message ?? '无法识别对应考试项目'))
        continue
      }
      result.push(
        scoreRow(
          standard,
          resolved.item,
          gender,
          picked.display,
          picked.raw,
          role.sourceHeader,
          identity,
          role.sourceHeader || resolved.item.name,
          picked.original
        )
      )
      assertOriginalNotHeader(result[result.length - 1], role.sourceHeader)
    }
  }

  const students = new Set(result.map((row) => `${row.studentNo}|${row.studentName}|${row.className}`))
  const successCount = result.filter((row) => row.status === 'success').length
  const errorCount = result.filter((row) => row.status !== 'success' && row.status !== 'non_score_record' && row.status !== 'not_applicable').length

  return {
    rows: result,
    summary: {
      studentCount: students.size,
      recordCount: result.length,
      successCount,
      errorCount
    }
  }
}

/** ExamBatchPage「开始批量换算」与 self-check 共用的唯一入口。 */
export function buildBatchAssessmentRows(
  standard: ExamStandard,
  mapping: ExamColumnMapping,
  snapshot: ExamSheetSnapshot
): BatchConvertResult {
  const prepared = coerceExamSnapshot(snapshot)
  const titles = prepared.columns.map((column) => column.title)
  const mappingNorm = normalizeExamColumnMapping(mapping, titles)
  const itemColumns = mappingNorm.columns.filter((role) => role.kind === 'examItem' || role.kind === 'examItemKey')
  const result = convertExamBatch(standard, mappingNorm, prepared.rows, titles)

  for (const row of result.rows) {
    const role = itemColumns.find(
      (item) => item.sourceHeader === row.examItemName || (item.kind === 'examItem' && item.itemId === row.examItemId)
    )
    if (role) {
      assertOriginalNotHeader(row, role.sourceHeader)
    }
  }

  return result
}
