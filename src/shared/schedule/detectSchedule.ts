import { applyMerges } from '../student/detectRoster'
import { cellToDisplayString } from '../student/importMapping'
import type { DetectConfidence } from '../student/detectTypes'
import type { WorkbookSheetInput } from '../student/detectTypes'
import { lookupScheduleHeaderAlias, SCHEDULE_SHEET_NAME_HINTS, SKIP_SCHEDULE_SHEET_PATTERN } from './detectAliases'
import type { DetectedScheduleColumn, DetectedScheduleTable, DetectedScheduleWorkbook } from './detectTypes'
import type {
  IncomingScheduleRow,
  ScheduleImportMapping,
  ScheduleImportSummary
} from './importTypes'
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
  const match = text.match(/^第?([1-8一二三四五六七八])节?$/)
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

export function parseTimeRangeCell(raw: string): { startTime: string; endTime: string } | null {
  const normalized = raw
    .replace(/：/g, ':')
    .replace(/[–—~～]/g, '-')
    .replace(/\s*至\s*/g, '-')
    .replace(/\s+/g, '')
  const parts = normalized.split('-')
  if (parts.length !== 2) {
    return null
  }
  const startTime = parseTimeCell(parts[0])
  const endTime = parseTimeCell(parts[1])
  return startTime && endTime ? { startTime, endTime } : null
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

interface LocatedHeader {
  headerRowIndex: number
  score: number
  layout: DetectedScheduleTable['layout']
  grid?: NonNullable<DetectedScheduleTable['grid']>
}

function weeklyGridHeader(cells: string[]): NonNullable<DetectedScheduleTable['grid']> | null {
  const periodColumn = cells.findIndex((cell) => lookupScheduleHeaderAlias(cell)?.field === 'period')
  const timeColumn = cells.findIndex((cell) => /^(时间|上课时间|课程时间|时段)$/.test(cell.replace(/\s+/g, '')))
  const weekdayColumns = cells.flatMap((cell, column) => {
    const weekday = parseWeekdayCell(cell)
    return weekday ? [{ weekday, column }] : []
  })
  if (periodColumn < 0 || timeColumn < 0 || weekdayColumns.length < 2) {
    return null
  }
  return { periodColumn, timeColumn, weekdayColumns }
}

function detectHeaderRow(rows: string[][]): LocatedHeader | null {
  let best: LocatedHeader | null = null
  const limit = Math.min(HEADER_SCAN_ROWS, rows.length)
  for (let index = 0; index < limit; index += 1) {
    const cells = rows[index] ?? []
    const grid = weeklyGridHeader(cells)
    const layout = grid ? 'weekly-grid' : 'row-list'
    const score = grid ? 12 + grid.weekdayColumns.length : headerScore(cells)
    if (score >= 8 && (!best || score > best.score)) {
      best = { headerRowIndex: index, score, layout, grid: grid ?? undefined }
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
  const candidates: Array<{ table: DetectedScheduleTable; score: number }> = []

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
      if (located.layout === 'weekly-grid') {
        const periodRaw = cellAt(cells, located.grid?.periodColumn ?? null)
        if (/本周合计/.test(periodRaw.replace(/\s+/g, ''))) {
          break
        }
      }
      dataRows.push({ excelRow: index + 1, cells })
    }
    const detected = detectColumns(
      headerCells,
      dataRows.map((item) => item.cells)
    )
    const effectiveRows =
      located.layout === 'weekly-grid' || detected.mapping.period === null
        ? dataRows
        : dataRows.filter((row) => {
            const periodRaw = cellAt(row.cells, detected.mapping.period)
            return parsePeriodCell(periodRaw) !== null || isSpecialPeriod(periodRaw)
          })
    const table: DetectedScheduleTable = {
      sheetName: sheet.name,
      layout: located.layout,
      headerRowIndex: located.headerRowIndex,
      headerRowNumber: located.headerRowIndex + 1,
      dataStartRowNumber: effectiveRows[0]?.excelRow ?? null,
      dataEndRowNumber: effectiveRows.at(-1)?.excelRow ?? null,
      columns: detected.columns,
      mapping: detected.mapping,
      grid: located.grid,
      dataRows,
      rowCount: dataRows.length,
      confidence:
        located.layout === 'weekly-grid'
          ? 'high'
          : lowestConfidence([
              detected.mapping.weekday !== null ? 'high' : 'low',
              detected.mapping.period !== null ? 'high' : 'low',
              detected.mapping.team !== null ? 'high' : 'low'
            ]),
      warnings: []
    }
    const contentScore =
      located.layout === 'weekly-grid'
        ? dataRows.reduce(
            (total, row) =>
              total +
              (located.grid?.weekdayColumns.filter(({ column }) => cellAt(row.cells, column) !== '').length ?? 0),
            0
          )
        : dataRows.length
    candidates.push({
      table,
      score: located.score * 100 + contentScore + (SCHEDULE_SHEET_NAME_HINTS.test(sheet.name) ? 20 : 0)
    })
  }

  candidates.sort((a, b) => b.score - a.score)
  const tables = candidates.length > 0 ? [candidates[0].table] : []
  for (const candidate of candidates.slice(1)) {
    skippedSheets.push({ sheetName: candidate.table.sheetName, reason: '已选择更符合课表结构的工作表' })
  }
  if (candidates.length > 1) {
    warnings.push(`识别到 ${candidates.length} 个候选工作表，已选择“${tables[0].sheetName}”`)
  }

  return {
    fileName,
    tables,
    skippedSheets,
    overallConfidence: tables.length === 0 ? 'low' : lowestConfidence(tables.map((item) => item.confidence)),
    warnings,
    needsColumnMapping:
      tables.length === 0 ||
      tables.some(
        (item) =>
          item.layout === 'row-list' &&
          (item.mapping.weekday === null || item.mapping.period === null || item.mapping.team === null)
      )
  }
}

function isSpecialPeriod(raw: string): boolean {
  return /^(大课间(?:[（(]?每天[）)]?)?|课间操|早读|午休|午间|活动)$/.test(raw.replace(/\s+/g, ''))
}

function isFooterOrNote(cells: string[]): boolean {
  const text = cells.join(' ').replace(/\s+/g, '')
  return /本周合计|常规体育课|^\d+节$|说明|备注|已纳入|黄色单元格/.test(text)
}

function isSpecialEventText(text: string): boolean {
  return /升旗|仪式|大课间|课间操|值班|教研|会议|活动/.test(text)
}

export function extractScheduleWorkbook(
  detection: DetectedScheduleWorkbook,
  mappingOverride?: ScheduleImportMapping | null
): { rows: IncomingScheduleRow[]; summary: ScheduleImportSummary } {
  const incoming: IncomingScheduleRow[] = []
  const skipped: ScheduleImportSummary['skipped'] = []
  let specialEventCount = 0

  for (const table of detection.tables) {
    if (table.layout === 'weekly-grid' && table.grid) {
      for (const row of table.dataRows) {
        const periodRaw = cellAt(row.cells, table.grid.periodColumn)
        const period = parsePeriodCell(periodRaw)
        const courseCells = table.grid.weekdayColumns.filter(
          ({ column }) => cellAt(row.cells, column) !== ''
        )
        if (!period) {
          if (courseCells.length > 0) {
            skipped.push({
              sheetName: table.sheetName,
              excelRow: row.excelRow,
              label: periodRaw || courseCells[0]?.weekday.toString() || '特殊时段',
              reason: isSpecialPeriod(periodRaw)
                ? '该行未导入：暂不支持的特殊时段'
                : '该行未导入：无法识别节次'
            })
          }
          continue
        }
        const defaults = getDefaultSlotTime(period)
        const timeRaw = cellAt(row.cells, table.grid.timeColumn)
        const range = parseTimeRangeCell(timeRaw)
        if (timeRaw && !range) {
          skipped.push({
            sheetName: table.sheetName,
            excelRow: row.excelRow,
            label: timeRaw,
            reason: '该行未导入：无法识别时间范围'
          })
          continue
        }
        for (const { weekday, column } of courseCells) {
          const teamRaw = cellAt(row.cells, column)
          if (isSpecialEventText(teamRaw)) {
            specialEventCount += 1
          }
          incoming.push({
            sheetName: table.sheetName,
            excelRow: row.excelRow,
            weekdayRaw: `星期${'一二三四五'[weekday - 1]}`,
            periodRaw,
            teamRaw,
            weekday,
            period,
            startTime: range?.startTime ?? defaults.startTime,
            endTime: range?.endTime ?? defaults.endTime,
            team: teamRaw,
            courseType: parseCourseTypeCell(teamRaw)
          })
        }
      }
      continue
    }

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
      if ((!weekday || !period || !teamRaw) && isFooterOrNote(row.cells)) {
        continue
      }
      if (!period && isSpecialPeriod(periodRaw)) {
        skipped.push({
          sheetName: table.sheetName,
          excelRow: row.excelRow,
          label: periodRaw || teamRaw || '特殊时段',
          reason: '该行未导入：暂不支持的特殊时段'
        })
        continue
      }
      if (!weekday || !period || !teamRaw) {
        skipped.push({
          sheetName: table.sheetName,
          excelRow: row.excelRow,
          label: teamRaw || periodRaw || weekdayRaw || '无法识别的行',
          reason: !period ? '无法识别节次' : !weekday ? '无法识别星期' : '课程内容为空'
        })
        continue
      }
      const defaults = getDefaultSlotTime(period)
      const startRaw = cellAt(row.cells, mapping.startTime)
      const range = parseTimeRangeCell(startRaw)
      if (isSpecialEventText(teamRaw)) {
        specialEventCount += 1
      }
      incoming.push({
        sheetName: table.sheetName,
        excelRow: row.excelRow,
        weekdayRaw,
        periodRaw,
        teamRaw,
        weekday,
        period,
        startTime: range?.startTime ?? parseTimeCell(startRaw) ?? defaults.startTime,
        endTime: range?.endTime ?? parseTimeCell(cellAt(row.cells, mapping.endTime)) ?? defaults.endTime,
        team: teamRaw.trim(),
        courseType: parseCourseTypeCell(cellAt(row.cells, mapping.courseType) || teamRaw)
      })
    }
  }

  return {
    rows: incoming,
    summary: {
      sheetNames: detection.tables.map((table) => table.sheetName),
      headerRows: detection.tables.map((table) => ({
        sheetName: table.sheetName,
        rowNumber: table.headerRowNumber
      })),
      effectiveRanges: detection.tables.map((table) => ({
        sheetName: table.sheetName,
        startRow: table.dataStartRowNumber,
        endRow: table.dataEndRowNumber
      })),
      recognizedCount: incoming.length,
      specialEventCount,
      skipped
    }
  }
}

export function buildIncomingScheduleRows(
  detection: DetectedScheduleWorkbook,
  mappingOverride?: ScheduleImportMapping | null
): IncomingScheduleRow[] {
  return extractScheduleWorkbook(detection, mappingOverride).rows
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
