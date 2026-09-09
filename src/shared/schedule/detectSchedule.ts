import { applyMerges } from '../student/detectRoster'
import { cellToDisplayString } from '../student/importMapping'
import type { DetectConfidence } from '../student/detectTypes'
import type { WorkbookSheetInput } from '../student/detectTypes'
import { lookupScheduleHeaderAlias, SCHEDULE_SHEET_NAME_HINTS, SKIP_SCHEDULE_SHEET_PATTERN } from './detectAliases'
import type { DetectedScheduleColumn, DetectedScheduleTable, DetectedScheduleWorkbook } from './detectTypes'
import type { IncomingScheduleRow, ScheduleImportMapping } from './importTypes'
import { getDefaultSlotTime } from './periodTimes'
import type { CourseType, Period, Weekday } from './types'

const HEADER_SCAN_ROWS = 20

function isRowEmpty(cells: string[]): boolean {
  return cells.every((cell) => cell.trim() === '')
}

function padRow(cells: string[], width: number): string[] {
  return Array.from({ length: width }, (_item, index) => cells[index] ?? '')
}

function tableWidth(rows: string[][]): number {
  return Math.max(1, ...rows.map((row) => row.length))
}

function lowestConfidence(values: DetectConfidence[]): DetectConfidence {
  if (values.includes('low')) {
    return 'low'
  }
  if (values.includes('medium')) {
    return 'medium'
  }
  return 'high'
}

export function parseWeekdayCell(raw: string): Weekday | null {
  const text = raw.replace(/\s+/g, '')
  if (text === '') {
    return null
  }
  const named: Array<[RegExp, Weekday]> = [
    [/(星期|周|礼拜)?一|星期1|周1/, 1],
    [/(星期|周|礼拜)?二|星期2|周2/, 2],
    [/(星期|周|礼拜)?三|星期3|周3/, 3],
    [/(星期|周|礼拜)?四|星期4|周4/, 4],
    [/(星期|周|礼拜)?五|星期5|周5/, 5]
  ]
  for (const [pattern, weekday] of named) {
    if (pattern.test(text)) {
      return weekday
    }
  }
  if (/^[1-5]$/.test(text)) {
    return Number(text) as Weekday
  }
  return null
}

export function parsePeriodCell(raw: string): Period | null {
  const text = raw.replace(/\s+/g, '')
  const match = text.match(/第?\s*([1-8一二三四五六七八])\s*节?/)
  if (!match) {
    return null
  }
  const token = match[1]
  const mapped: Record<string, Period> = {
    '1': 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8
  }
  return mapped[token] ?? null
}

export function parseCourseTypeCell(raw: string): CourseType {
  const text = raw.replace(/\s+/g, '')
  if (/大体育|大课/.test(text)) {
    return 'big'
  }
  if (/其他|其它/.test(text)) {
    return 'other'
  }
  return 'regular'
}

export function parseTimeCell(raw: string): string | null {
  const text = raw.replace(/\s+/g, '').replace(/：/g, ':')
  if (text === '') {
    return null
  }
  const match = text.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) {
    return null
  }
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) {
    return null
  }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function detectColumns(headerCells: string[], dataRows: string[][]): {
  columns: DetectedScheduleColumn[]
  mapping: ScheduleImportMapping
} {
  const columns: DetectedScheduleColumn[] = headerCells.map((header, index) => {
    const alias = lookupScheduleHeaderAlias(header)
    if (!alias) {
      return { index, header, field: null, confidence: 'low', reason: '表头无已知别名' }
    }
    return {
      index,
      header,
      field: alias.field,
      confidence: alias.confidence,
      reason: `表头命中${alias.field}`
    }
  })

  const sample = dataRows.slice(0, 30)
  for (const column of columns) {
    if (column.field && column.confidence === 'high') {
      continue
    }
    const values = sample.map((row) => row[column.index] ?? '')
    const weekdayHits = values.filter((item) => parseWeekdayCell(item) !== null).length / Math.max(1, values.filter((item) => item.trim()).length)
    const periodHits = values.filter((item) => parsePeriodCell(item) !== null).length / Math.max(1, values.filter((item) => item.trim()).length)
    const timeHits = values.filter((item) => parseTimeCell(item) !== null).length / Math.max(1, values.filter((item) => item.trim()).length)
    if (!column.field && weekdayHits >= 0.7) {
      column.field = 'weekday'
      column.confidence = 'medium'
      column.reason = '根据列内容推断星期'
    } else if (!column.field && periodHits >= 0.7) {
      column.field = 'period'
      column.confidence = 'medium'
      column.reason = '根据列内容推断节次'
    } else if (!column.field && timeHits >= 0.7 && !columns.some((item) => item.field === 'startTime')) {
      column.field = 'startTime'
      column.confidence = 'medium'
      column.reason = '根据列内容推断时间'
    }
  }

  const used = new Set<number>()
  function pick(field: keyof ScheduleImportMapping): number | null {
    const rank = { high: 3, medium: 2, low: 1 }
    const matches = columns
      .filter((item) => item.field === field && !used.has(item.index))
      .sort((a, b) => rank[b.confidence] - rank[a.confidence] || a.index - b.index)
    const chosen = matches[0]
    if (!chosen) {
      return null
    }
    used.add(chosen.index)
    return chosen.index
  }

  const mapping: ScheduleImportMapping = {
    weekday: pick('weekday'),
    period: pick('period'),
    startTime: pick('startTime'),
    endTime: pick('endTime'),
    team: pick('team'),
    courseType: pick('courseType')
  }

  return { columns, mapping }
}

function headerScore(cells: string[]): number {
  const fields = new Set(
    cells
      .map((cell) => lookupScheduleHeaderAlias(cell)?.field)
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
  )
  let score = 0
  if (fields.has('weekday')) {
    score += 4
  }
  if (fields.has('period')) {
    score += 4
  }
  if (fields.has('team')) {
    score += 3
  }
  if (fields.has('startTime')) {
    score += 1
  }
  if (fields.has('endTime')) {
    score += 1
  }
  return score
}

function detectHeaderRow(rows: string[][]): { headerRowIndex: number; score: number } | null {
  let best: { headerRowIndex: number; score: number } | null = null
  const limit = Math.min(HEADER_SCAN_ROWS, rows.length)
  for (let index = 0; index < limit; index += 1) {
    const score = headerScore(rows[index] ?? [])
    if (score >= 8 && (!best || score > best.score)) {
      best = { headerRowIndex: index, score }
    }
  }
  return best
}

function cellAt(cells: string[], index: number | null): string {
  if (index === null || index < 0) {
    return ''
  }
  return (cells[index] ?? '').trim()
}

export function detectScheduleWorkbook(fileName: string, sheets: WorkbookSheetInput[]): DetectedScheduleWorkbook {
  const warnings: string[] = []
  const skippedSheets: DetectedScheduleWorkbook['skippedSheets'] = []
  const tables: DetectedScheduleTable[] = []

  for (const sheet of sheets) {
    if (SKIP_SCHEDULE_SHEET_PATTERN.test(sheet.name) && !SCHEDULE_SHEET_NAME_HINTS.test(sheet.name)) {
      skippedSheets.push({ sheetName: sheet.name, reason: '说明类工作表' })
      continue
    }
    const rows = applyMerges(
      sheet.rows.map((row) => row.map((cell) => cellToDisplayString(cell))),
      sheet.merges
    )
    const located = detectHeaderRow(rows)
    if (!located) {
      skippedSheets.push({ sheetName: sheet.name, reason: '未找到课表表头' })
      continue
    }
    const width = tableWidth(rows)
    const headerCells = padRow(rows[located.headerRowIndex] ?? [], width)
    const dataRows: Array<{ excelRow: number; cells: string[] }> = []
    for (let index = located.headerRowIndex + 1; index < rows.length; index += 1) {
      const cells = padRow(rows[index] ?? [], width)
      if (isRowEmpty(cells)) {
        continue
      }
      dataRows.push({ excelRow: index + 1, cells })
    }
    const detected = detectColumns(
      headerCells,
      dataRows.map((item) => item.cells)
    )
    const table: DetectedScheduleTable = {
      sheetName: sheet.name,
      headerRowIndex: located.headerRowIndex,
      headerRowNumber: located.headerRowIndex + 1,
      columns: detected.columns,
      mapping: detected.mapping,
      dataRows,
      rowCount: dataRows.length,
      confidence: lowestConfidence([
        detected.mapping.weekday !== null ? 'high' : 'low',
        detected.mapping.period !== null ? 'high' : 'low',
        detected.mapping.team !== null ? 'high' : 'low'
      ]),
      warnings: []
    }
    tables.push(table)
  }

  if (tables.length > 1) {
    warnings.push(`识别到 ${tables.length} 个课表工作表，将一次导入`)
  }

  return {
    fileName,
    tables,
    skippedSheets,
    overallConfidence: tables.length === 0 ? 'low' : lowestConfidence(tables.map((item) => item.confidence)),
    warnings,
    needsColumnMapping: tables.length === 0 || tables.some((item) => item.mapping.weekday === null || item.mapping.period === null || item.mapping.team === null)
  }
}

export function buildIncomingScheduleRows(
  detection: DetectedScheduleWorkbook,
  mappingOverride?: ScheduleImportMapping | null
): IncomingScheduleRow[] {
  const incoming: IncomingScheduleRow[] = []
  for (const table of detection.tables) {
    const mapping: ScheduleImportMapping = {
      weekday: mappingOverride?.weekday ?? table.mapping.weekday,
      period: mappingOverride?.period ?? table.mapping.period,
      startTime: mappingOverride?.startTime ?? table.mapping.startTime,
      endTime: mappingOverride?.endTime ?? table.mapping.endTime,
      team: mappingOverride?.team ?? table.mapping.team,
      courseType: mappingOverride?.courseType ?? table.mapping.courseType
    }
    if (mapping.weekday === null || mapping.period === null || mapping.team === null) {
      continue
    }
    for (const row of table.dataRows) {
      const weekdayRaw = cellAt(row.cells, mapping.weekday)
      const periodRaw = cellAt(row.cells, mapping.period)
      const teamRaw = cellAt(row.cells, mapping.team)
      if (weekdayRaw === '' && periodRaw === '' && teamRaw === '') {
        continue
      }
      const weekday = parseWeekdayCell(weekdayRaw)
      const period = parsePeriodCell(periodRaw)
      const defaults = period ? getDefaultSlotTime(period) : { startTime: '', endTime: '' }
      incoming.push({
        excelRow: row.excelRow,
        weekdayRaw,
        periodRaw,
        teamRaw,
        weekday,
        period,
        startTime: parseTimeCell(cellAt(row.cells, mapping.startTime)) ?? defaults.startTime,
        endTime: parseTimeCell(cellAt(row.cells, mapping.endTime)) ?? defaults.endTime,
        team: teamRaw.trim(),
        courseType: parseCourseTypeCell(cellAt(row.cells, mapping.courseType))
      })
    }
  }
  return incoming
}

export function mappingFromSchedulePayload(input: unknown): ScheduleImportMapping {
  if (typeof input !== 'object' || input === null) {
    throw new Error('课表列映射格式不正确')
  }
  const record = input as Record<string, unknown>
  function index(key: string): number | null {
    const value = record[key]
    if (value === null || value === undefined || value === '') {
      return null
    }
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
      throw new Error('课表列映射不正确')
    }
    return value
  }
  return {
    weekday: index('weekday'),
    period: index('period'),
    startTime: index('startTime'),
    endTime: index('endTime'),
    team: index('team'),
    courseType: index('courseType')
  }
}
