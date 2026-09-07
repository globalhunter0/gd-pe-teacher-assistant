import { cellToDisplayString } from '../student/importMapping'
import type { ImportColumn } from '../student/importTypes'
import type { ExcelDataRow, ExamSheetSnapshot } from './types'

export function isRowEmpty(cells: string[]): boolean {
  return cells.every((cell) => cell === '')
}

export function worksheetRowsToSnapshot(
  displayed: unknown[][],
  rawTable: unknown[][],
  fileName: string,
  sheetName: string
): ExamSheetSnapshot {
  const normalized = displayed.map((row) => {
    const source = Array.isArray(row) ? row : []
    return source.map((cell) => cellToDisplayString(cell))
  })

  const headerIndex = pickHeaderRowIndex(normalized)
  if (headerIndex < 0) {
    throw new Error('未找到表头，请确认工作表中有内容')
  }

  const headerCells = normalized[headerIndex]
  const columnCount = Math.max(headerCells.length, ...normalized.slice(headerIndex + 1).map((row) => row.length), 1)
  const columns: ImportColumn[] = Array.from({ length: columnCount }, (_item, index) => {
    const title = headerCells[index] ?? ''
    return { index, title: title === '' ? `列${index + 1}` : title }
  })
  const headers = columns.map((column) => column.title)

  const rows: ExcelDataRow[] = []
  for (let index = headerIndex + 1; index < normalized.length; index += 1) {
    const cells = Array.from({ length: columnCount }, (_item, columnIndex) => normalized[index][columnIndex] ?? '')
    if (isRowEmpty(cells)) {
      continue
    }
    if (looksLikeHeaderRow(cells, headers)) {
      continue
    }
    const rawSource = Array.isArray(rawTable[index]) ? rawTable[index] : []
    rows.push({
      excelRow: index + 1,
      cells,
      raw: Array.from({ length: columnCount }, (_item, columnIndex) => {
        const header = headers[columnIndex] ?? ''
        const display = cells[columnIndex] ?? ''
        const rawValue = rawSource[columnIndex]
        if (typeof rawValue === 'string') {
          const text = rawValue.replace(/\u3000/g, ' ').trim()
          const headerText = header.replace(/\u3000/g, ' ').trim()
          if (text !== '' && text === headerText && display.replace(/\u3000/g, ' ').trim() !== headerText) {
            const numeric = Number(display)
            if (display.trim() !== '' && Number.isFinite(numeric) && !display.includes(':') && !display.includes("'")) {
              return numeric
            }
            return display
          }
        }
        return rawValue === undefined || rawValue === '' ? display : rawValue
      })
    })
  }

  return {
    fileName,
    sheetName,
    headerRowNumber: headerIndex + 1,
    columns,
    rows
  }
}

export function objectRowsToExcelData(records: Array<Record<string, unknown>>): {
  titles: string[]
  rows: ExcelDataRow[]
} {
  if (records.length === 0) {
    return { titles: [], rows: [] }
  }
  const titles = Object.keys(records[0])
  const rows: ExcelDataRow[] = records.map((record, index) => ({
    excelRow: index + 2,
    cells: titles.map((title) => cellToDisplayString(record[title])),
    raw: titles.map((title) => record[title])
  }))
  return { titles, rows }
}

function readIndexed(source: unknown, index: number, title: string): unknown {
  if (Array.isArray(source)) {
    return source[index]
  }
  if (source && typeof source === 'object') {
    const record = source as Record<string, unknown>
    if (title !== '' && title in record) {
      return record[title]
    }
    if (index in record) {
      return record[index]
    }
    if (String(index) in record) {
      return record[String(index)]
    }
  }
  return undefined
}

function isSameHeader(value: unknown, header: string): boolean {
  if (typeof value !== 'string') {
    return false
  }
  return value.replace(/\u3000/g, ' ').trim() === header.replace(/\u3000/g, ' ').trim() && header.trim() !== ''
}

/** 把 IPC / 对象行收成与预览一致的二维 cells，成绩不得等于表头。 */
export function coerceExamDataRow(row: ExcelDataRow, columns: ImportColumn[]): ExcelDataRow {
  const cells = columns.map((column) => {
    const fromCells = readIndexed(row.cells, column.index, column.title)
    const fromRaw = readIndexed(row.raw, column.index, column.title)
    const display = cellToDisplayString(fromCells ?? '')
    if (!isSameHeader(display, column.title) && display !== '') {
      return display
    }
    if (typeof fromRaw === 'number' && Number.isFinite(fromRaw)) {
      return cellToDisplayString(fromRaw)
    }
    const rawDisplay = cellToDisplayString(fromRaw ?? '')
    if (!isSameHeader(rawDisplay, column.title) && rawDisplay !== '') {
      return rawDisplay
    }
    return display
  })
  const raw = columns.map((column, index) => {
    const fromRaw = readIndexed(row.raw, column.index, column.title)
    const fromCells = readIndexed(row.cells, column.index, column.title)
    if (typeof fromRaw === 'number' && Number.isFinite(fromRaw)) {
      return fromRaw
    }
    if (typeof fromRaw === 'string' && isSameHeader(fromRaw, column.title)) {
      if (typeof fromCells === 'number' && Number.isFinite(fromCells)) {
        return fromCells
      }
      const numeric = Number(cells[index])
      if (cells[index] !== '' && !isSameHeader(cells[index], column.title) && Number.isFinite(numeric)) {
        return numeric
      }
      return cells[index]
    }
    if (fromRaw !== undefined && fromRaw !== '') {
      return fromRaw
    }
    const numeric = Number(cells[index])
    if (cells[index] !== '' && !isSameHeader(cells[index], column.title) && Number.isFinite(numeric) && !cells[index].includes(':')) {
      return numeric
    }
    return cells[index]
  })
  return { excelRow: row.excelRow, cells, raw }
}

export function coerceExamSnapshot(snapshot: ExamSheetSnapshot): ExamSheetSnapshot {
  return {
    ...snapshot,
    rows: snapshot.rows.map((row) => coerceExamDataRow(row, snapshot.columns))
  }
}

export function snapshotRowAsObject(snapshot: ExamSheetSnapshot, row: ExcelDataRow): Record<string, unknown> {
  const coerced = coerceExamDataRow(row, snapshot.columns)
  const record: Record<string, unknown> = {}
  snapshot.columns.forEach((column) => {
    const rawValue = coerced.raw[column.index]
    const cellValue = coerced.cells[column.index]
    record[column.title] = typeof rawValue === 'number' && Number.isFinite(rawValue) ? rawValue : cellValue
  })
  return record
}

function pickHeaderRowIndex(rows: string[][]): number {
  let bestIndex = -1
  let bestScore = -1
  for (let index = 0; index < Math.min(rows.length, 10); index += 1) {
    if (isRowEmpty(rows[index])) {
      continue
    }
    const score = headerLikeness(rows[index])
    if (score > bestScore) {
      bestScore = score
      bestIndex = index
    }
  }
  return bestIndex
}

function headerLikeness(cells: string[]): number {
  const markers = ['姓名', '学号', '性别', '班级', '项目', '成绩', '米', '跳绳', '跳远', '铅球', '实心球']
  return cells.reduce((sum, cell) => {
    const text = cell.replace(/\u3000/g, ' ').trim()
    if (text === '') {
      return sum
    }
    return sum + (markers.some((marker) => text.includes(marker)) ? 2 : 0)
  }, 0)
}

function looksLikeHeaderRow(cells: string[], headers: string[]): boolean {
  const comparable = cells.filter((cell) => cell !== '')
  if (comparable.length === 0) {
    return false
  }
  const matches = comparable.filter((cell, index) => cell === headers[index] || headers.includes(cell)).length
  return matches >= Math.max(2, Math.ceil(comparable.length * 0.6))
}
