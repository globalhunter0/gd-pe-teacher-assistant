import type { Semester } from '../class/types'
import { cellToDisplayString, parseImportedGender } from './importMapping'
import type { StudentImportMapping } from './importTypes'
import { extractClassLabelFromText, parseClassLabel } from './classLabel'
import {
  FEMALE_GENDER_VALUES,
  lookupHeaderAlias,
  MALE_GENDER_VALUES,
  normalizeHeaderKey,
  ROSTER_SHEET_NAME_HINTS,
  SKIP_SHEET_NAME_PATTERN
} from './detectAliases'
import type {
  DetectConfidence,
  DetectedClassContext,
  DetectedColumn,
  DetectedRosterTable,
  DetectedWorkbook,
  WorkbookSheetInput
} from './detectTypes'
import type { IncomingStudentRow } from './rosterTypes'

const HEADER_SCAN_ROWS = 20
const CONTENT_SAMPLE = 40

export function applyMerges(
  rows: string[][],
  merges: Array<{ s: { r: number; c: number }; e: { r: number; c: number } }> = []
): string[][] {
  const next = rows.map((row) => [...row])
  for (const merge of merges) {
    const value = next[merge.s.r]?.[merge.s.c] ?? ''
    for (let rowIndex = merge.s.r; rowIndex <= merge.e.r; rowIndex += 1) {
      while (next.length <= rowIndex) {
        next.push([])
      }
      for (let colIndex = merge.s.c; colIndex <= merge.e.c; colIndex += 1) {
        while (next[rowIndex].length <= colIndex) {
          next[rowIndex].push('')
        }
        if (next[rowIndex][colIndex] === '') {
          next[rowIndex][colIndex] = value
        }
      }
    }
  }
  return next
}

function isRowEmpty(cells: string[]): boolean {
  return cells.every((cell) => cell.trim() === '')
}

function padRow(cells: string[], width: number): string[] {
  return Array.from({ length: width }, (_item, index) => cells[index] ?? '')
}

function tableWidth(rows: string[][]): number {
  return Math.max(1, ...rows.map((row) => row.length))
}

function looksLikeChineseName(value: string): boolean {
  return /^[\u4e00-\u9fff]{2,4}$/.test(value) && !/班$/.test(value)
}

function looksLikeGender(value: string): boolean {
  const key = value.trim().toLowerCase()
  return MALE_GENDER_VALUES.has(key) || FEMALE_GENDER_VALUES.has(key)
}

function looksLikeStudentNo(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9\-_]{0,19}$/.test(value.trim())
}

function looksLikeClassLabel(value: string): boolean {
  return parseClassLabel(value).parseable || /班$/.test(value.replace(/\s+/g, ''))
}

function looksLikeStudentDataRow(cells: string[]): boolean {
  const filled = cells.map((cell) => cell.trim()).filter((cell) => cell !== '')
  if (filled.length === 0) {
    return false
  }
  const names = filled.filter((cell) => looksLikeChineseName(cell)).length
  const genders = filled.filter((cell) => looksLikeGender(cell)).length
  return names >= 1 || (genders >= 1 && filled.length >= 2)
}

function isTitleLike(row: string[]): boolean {
  const filled = row.map((cell) => cell.trim()).filter((cell) => cell !== '')
  if (filled.length === 0) {
    return true
  }
  if (filled.length === 1 && filled[0].length >= 8 && lookupHeaderAlias(filled[0]) === null) {
    return true
  }
  if (filled.some((cell) => /名单|花名册|学生信息|学年/.test(cell)) && filled.filter((cell) => lookupHeaderAlias(cell)).length < 2) {
    return true
  }
  return false
}

function aliasHits(row: string[]): number {
  return row.filter((cell) => lookupHeaderAlias(cell) !== null).length
}

function scoreHeaderRow(rows: string[][], rowIndex: number, width: number): number {
  const row = padRow(rows[rowIndex] ?? [], width)
  if (isRowEmpty(row) || isTitleLike(row)) {
    return -50
  }
  let score = aliasHits(row) * 12
  const fields = row.map((cell) => lookupHeaderAlias(cell)?.field)
  if (fields.includes('name')) {
    score += 16
  }
  if (fields.includes('gender')) {
    score += 8
  }
  if (fields.includes('className')) {
    score += 8
  }
  if (fields.includes('studentNo')) {
    score += 10
  }
  if (fields.includes('serial') && !fields.includes('studentNo')) {
    score += 2
  }
  const filled = row.filter((cell) => cell.trim() !== '')
  const stringLike = filled.filter((cell) => Number.isNaN(Number(cell))).length
  if (filled.length > 0 && stringLike / filled.length >= 0.6) {
    score += 6
  }
  if (filled.length <= 1) {
    score -= 12
  }
  let nextIndex = rowIndex + 1
  while (nextIndex < rows.length && isRowEmpty(padRow(rows[nextIndex] ?? [], width))) {
    nextIndex += 1
  }
  if (nextIndex < rows.length && looksLikeStudentDataRow(padRow(rows[nextIndex] ?? [], width))) {
    score += 18
  }
  if (nextIndex < rows.length && aliasHits(padRow(rows[nextIndex] ?? [], width)) >= 3) {
    score -= 8
  }
  return score
}

export function detectRosterTable(rows: string[][]): {
  headerRowIndex: number
  dataStartRowIndex: number
  candidates: Array<{ rowIndex: number; score: number }>
  ambiguities: string[]
} | null {
  const width = tableWidth(rows)
  const limit = Math.min(HEADER_SCAN_ROWS, rows.length)
  const candidates: Array<{ rowIndex: number; score: number }> = []
  for (let index = 0; index < limit; index += 1) {
    const score = scoreHeaderRow(rows, index, width)
    if (score >= 16) {
      candidates.push({ rowIndex: index, score })
    }
  }
  candidates.sort((a, b) => b.score - a.score || a.rowIndex - b.rowIndex)
  if (candidates.length === 0) {
    return null
  }
  const best = candidates[0]
  const second = candidates[1]
  const ambiguities: string[] = []
  if (second && best.score - second.score <= 2 && best.rowIndex !== second.rowIndex) {
    ambiguities.push(`表头第${best.rowIndex + 1}行与第${second.rowIndex + 1}行分数接近`)
  }
  let dataStart = best.rowIndex + 1
  while (dataStart < rows.length && isRowEmpty(padRow(rows[dataStart] ?? [], width))) {
    dataStart += 1
  }
  return {
    headerRowIndex: best.rowIndex,
    dataStartRowIndex: dataStart,
    candidates: candidates.slice(0, 4),
    ambiguities
  }
}

function contentFieldGuess(values: string[]): { field: DetectedColumn['field']; score: number } | null {
  const filled = values.map((item) => item.trim()).filter((item) => item !== '')
  if (filled.length < 3) {
    return null
  }
  const nameHits = filled.filter((item) => looksLikeChineseName(item)).length / filled.length
  const genderHits = filled.filter((item) => looksLikeGender(item)).length / filled.length
  const classHits = filled.filter((item) => looksLikeClassLabel(item)).length / filled.length
  const noHits = filled.filter((item) => looksLikeStudentNo(item)).length / filled.length
  const sequential = filled.every((item, index) => item === String(index + 1) || item === String(index))
  if (genderHits >= 0.7) {
    return { field: 'gender', score: genderHits }
  }
  if (classHits >= 0.7) {
    return { field: 'className', score: classHits }
  }
  if (nameHits >= 0.7) {
    return { field: 'name', score: nameHits }
  }
  if (noHits >= 0.8 && !sequential) {
    return { field: 'studentNo', score: noHits }
  }
  return null
}

export function detectRosterColumns(
  headerCells: string[],
  dataRows: string[][]
): { columns: DetectedColumn[]; mapping: StudentImportMapping; gradeColumnIndex: number | null; classNumberColumnIndex: number | null } {
  const columns: DetectedColumn[] = headerCells.map((header, index) => {
    const alias = lookupHeaderAlias(header)
    if (!alias) {
      return { index, header, field: null, confidence: 'low', reason: '表头无已知别名' }
    }
    if (alias.field === 'serial') {
      return { index, header, field: 'serial', confidence: 'low', reason: '序号默认不作为学号' }
    }
    return {
      index,
      header,
      field: alias.field,
      confidence: alias.confidence,
      reason: `表头命中${alias.field}`
    }
  })

  const sample = dataRows.slice(0, CONTENT_SAMPLE)
  for (const column of columns) {
    if (column.field && column.confidence === 'high') {
      continue
    }
    const values = sample.map((row) => row[column.index] ?? '')
    const guess = contentFieldGuess(values)
    if (!guess) {
      continue
    }
    if (!column.field) {
      column.field = guess.field
      column.confidence = guess.score >= 0.85 ? 'medium' : 'low'
      column.reason = '根据列内容推断'
    } else if (column.field === guess.field && column.confidence === 'medium') {
      column.confidence = 'high'
      column.reason = '表头与内容一致'
    }
  }

  const used = new Set<number>()
  function pick(field: DetectedColumn['field']): number | null {
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

  const name = pick('name')
  const studentNoPreferred = pick('studentNo')
  const serial = pick('serial')
  const mapping: StudentImportMapping = {
    name,
    studentNo: studentNoPreferred ?? serial,
    gender: pick('gender'),
    className: pick('className'),
    notes: pick('notes')
  }

  return {
    columns,
    mapping,
    gradeColumnIndex: pick('grade'),
    classNumberColumnIndex: columns.find((item) => normalizeHeaderKey(item.header) === '班' && mapping.className !== item.index)?.index ?? null
  }
}

function titleText(rows: string[][], headerRowIndex: number): string {
  return rows
    .slice(0, headerRowIndex)
    .flat()
    .map((cell) => cell.trim())
    .filter((cell) => cell !== '')
    .join(' ')
}

export function detectClassContext(options: {
  mapping: StudentImportMapping
  sheetName: string
  fileName: string
  titleText: string
  classValues: string[]
}): DetectedClassContext | null {
  if (options.mapping.className !== null) {
    const distinct = [...new Set(options.classValues.map((item) => item.trim()).filter((item) => item !== ''))]
    if (distinct.length === 1) {
      const parsed = parseClassLabel(distinct[0])
      return {
        classRaw: distinct[0],
        grade: parsed.grade,
        className: parsed.className,
        source: 'column',
        confidence: parsed.parseable ? 'high' : 'medium'
      }
    }
    if (distinct.length > 1) {
      return {
        classRaw: distinct[0],
        grade: null,
        className: '',
        source: 'column',
        confidence: 'high'
      }
    }
  }

  const sheetParsed = extractClassLabelFromText(options.sheetName) ?? parseClassLabel(options.sheetName)
  if (sheetParsed.parseable) {
    return {
      classRaw: `${sheetParsed.grade}${sheetParsed.className}`,
      grade: sheetParsed.grade,
      className: sheetParsed.className,
      source: 'sheet',
      confidence: 'high'
    }
  }

  const titleParsed = extractClassLabelFromText(options.titleText)
  if (titleParsed?.parseable) {
    return {
      classRaw: `${titleParsed.grade}${titleParsed.className}`,
      grade: titleParsed.grade,
      className: titleParsed.className,
      source: 'title',
      confidence: 'medium'
    }
  }

  const fileParsed = extractClassLabelFromText(options.fileName.replace(/\.(xlsx|xls)$/i, ''))
  if (fileParsed?.parseable) {
    return {
      classRaw: `${fileParsed.grade}${fileParsed.className}`,
      grade: fileParsed.grade,
      className: fileParsed.className,
      source: 'filename',
      confidence: 'medium'
    }
  }

  return null
}

function detectYearSemester(text: string): { academicYear: string | null; semester: Semester | null } {
  let academicYear: string | null = null
  const range = text.match(/(20\d{2})\s*[-–~至到]\s*(20\d{2})/)
  if (range) {
    academicYear = `${range[1]}-${range[2]}`
  } else {
    const year = text.match(/(20\d{2})\s*学年/)
    if (year) {
      academicYear = `${year[1]}-${Number(year[1]) + 1}`
    }
  }
  let semester: Semester | null = null
  if (/第一学期|上学期/.test(text)) {
    semester = '第一学期'
  } else if (/第二学期|下学期/.test(text)) {
    semester = '第二学期'
  }
  return { academicYear, semester }
}

function sheetShouldSkip(name: string, table: DetectedRosterTable | null): string | null {
  if (SKIP_SHEET_NAME_PATTERN.test(name)) {
    return '说明/统计/封面类工作表'
  }
  if (!table || table.mapping.name === null) {
    if (!ROSTER_SHEET_NAME_HINTS.test(name)) {
      return '未识别到学生名单表头'
    }
    return '未识别到姓名列'
  }
  return null
}

function lowestConfidence(items: DetectConfidence[]): DetectConfidence {
  if (items.includes('low')) {
    return 'low'
  }
  if (items.includes('medium')) {
    return 'medium'
  }
  return 'high'
}

function headerEquals(cells: string[], header: string[]): boolean {
  const width = Math.max(cells.length, header.length)
  const left = padRow(cells, width).map((item) => normalizeHeaderKey(item))
  const right = padRow(header, width).map((item) => normalizeHeaderKey(item))
  return left.every((item, index) => item === right[index]) && left.some((item) => item !== '')
}

export function detectStudentRosterWorkbook(fileName: string, sheets: WorkbookSheetInput[]): DetectedWorkbook {
  const warnings: string[] = []
  const ambiguities: string[] = []
  const skippedSheets: DetectedWorkbook['skippedSheets'] = []
  const tables: DetectedRosterTable[] = []
  let suggestedAcademicYear: string | null = null
  let suggestedSemester: Semester | null = null

  for (const sheet of sheets) {
    const rows = applyMerges(
      sheet.rows.map((row) => row.map((cell) => cellToDisplayString(cell))),
      sheet.merges
    )
    const located = detectRosterTable(rows)
    if (!located) {
      skippedSheets.push({ sheetName: sheet.name, reason: sheetShouldSkip(sheet.name, null) ?? '未找到表头' })
      continue
    }
    const width = tableWidth(rows)
    const headerCells = padRow(rows[located.headerRowIndex] ?? [], width)
    const dataRows: Array<{ excelRow: number; cells: string[] }> = []
    for (let index = located.dataStartRowIndex; index < rows.length; index += 1) {
      const cells = padRow(rows[index] ?? [], width)
      if (isRowEmpty(cells) || headerEquals(cells, headerCells)) {
        continue
      }
      dataRows.push({ excelRow: index + 1, cells })
    }
    const detectedCols = detectRosterColumns(
      headerCells,
      dataRows.map((item) => item.cells)
    )
    const classValues =
      detectedCols.mapping.className !== null
        ? dataRows.map((item) => item.cells[detectedCols.mapping.className!] ?? '')
        : []
    const title = titleText(rows, located.headerRowIndex)
    const yearHint = detectYearSemester(`${title} ${sheet.name} ${fileName}`)
    if (!suggestedAcademicYear && yearHint.academicYear) {
      suggestedAcademicYear = yearHint.academicYear
    }
    if (!suggestedSemester && yearHint.semester) {
      suggestedSemester = yearHint.semester
    }
    const classContext = detectClassContext({
      mapping: detectedCols.mapping,
      sheetName: sheet.name,
      fileName,
      titleText: title,
      classValues
    })
    const nameCol = detectedCols.columns.find((item) => item.index === detectedCols.mapping.name)
    const table: DetectedRosterTable = {
      sheetName: sheet.name,
      headerRowIndex: located.headerRowIndex,
      dataStartRowIndex: located.dataStartRowIndex,
      headerRowNumber: located.headerRowIndex + 1,
      columns: detectedCols.columns,
      mapping: detectedCols.mapping,
      gradeColumnIndex: detectedCols.gradeColumnIndex,
      classNumberColumnIndex: detectedCols.classNumberColumnIndex,
      classContext,
      dataRows,
      rowCount: dataRows.length,
      confidence: lowestConfidence([
        nameCol?.confidence ?? 'low',
        detectedCols.mapping.className !== null || classContext ? 'high' : 'low'
      ]),
      warnings: located.ambiguities,
      ambiguities: located.ambiguities,
      headerCandidates: located.candidates
    }
    const skip = sheetShouldSkip(sheet.name, table)
    if (skip) {
      skippedSheets.push({ sheetName: sheet.name, reason: skip })
      continue
    }
    if (table.mapping.studentNo !== null) {
      const studentNoCol = table.columns.find((item) => item.index === table.mapping.studentNo)
      if (studentNoCol?.field === 'serial') {
        table.warnings.push('仅有序号列，已作为学号（低置信度）')
        table.confidence = lowestConfidence([table.confidence, 'low'])
      }
    }
    tables.push(table)
    ambiguities.push(...table.ambiguities)
    warnings.push(...table.warnings)
  }

  const needsColumnMapping = tables.length === 0 || tables.some((item) => item.mapping.name === null)
  const needsClassConfirmation = tables.some((item) => {
    if (item.mapping.className !== null) {
      return false
    }
    if (item.classContext && item.classContext.confidence !== 'low' && item.classContext.className) {
      return false
    }
    return true
  })

  if (tables.length > 1) {
    warnings.push(`识别到 ${tables.length} 个名单工作表，将一次导入`)
  }

  return {
    fileName,
    tables,
    skippedSheets,
    overallConfidence: tables.length === 0 ? 'low' : lowestConfidence(tables.map((item) => item.confidence)),
    warnings,
    ambiguities: [...new Set(ambiguities)],
    needsClassConfirmation,
    needsColumnMapping,
    suggestedAcademicYear,
    suggestedSemester
  }
}

function cellAt(cells: string[], index: number | null): string {
  if (index === null || index < 0) {
    return ''
  }
  return (cells[index] ?? '').trim()
}

export function buildIncomingFromDetectedWorkbook(
  detection: DetectedWorkbook,
  mappingOverride?: StudentImportMapping | null
): IncomingStudentRow[] {
  const incoming: IncomingStudentRow[] = []
  detection.tables.forEach((table, tableIndex) => {
    const mapping: StudentImportMapping = {
      name: mappingOverride?.name ?? table.mapping.name,
      studentNo: mappingOverride?.studentNo ?? table.mapping.studentNo,
      gender: mappingOverride?.gender ?? table.mapping.gender,
      className: mappingOverride?.className ?? table.mapping.className,
      notes: mappingOverride?.notes ?? table.mapping.notes
    }
    if (mapping.name === null) {
      return
    }
    for (const row of table.dataRows) {
      const genderResult = parseImportedGender(cellAt(row.cells, mapping.gender))
      let classRaw = cellAt(row.cells, mapping.className)
      if (table.gradeColumnIndex !== null) {
        const grade = cellAt(row.cells, table.gradeColumnIndex)
        const classPart = classRaw || cellAt(row.cells, table.classNumberColumnIndex)
        if (grade && !parseClassLabel(classRaw).parseable) {
          classRaw = `${grade}${classPart}`
        }
      }
      if (classRaw === '' && table.classContext?.classRaw) {
        classRaw = table.classContext.classRaw
      }
      incoming.push({
        excelRow: tableIndex * 10000 + row.excelRow,
        classRaw,
        studentNo: cellAt(row.cells, mapping.studentNo),
        name: cellAt(row.cells, mapping.name),
        gender: genderResult.gender,
        notes: cellAt(row.cells, mapping.notes)
      })
    }
  })
  return incoming
}

export function detectionColumns(detection: DetectedWorkbook): { columns: Array<{ index: number; title: string }>; mapping: StudentImportMapping } {
  const table = detection.tables[0]
  if (!table) {
    return {
      columns: [],
      mapping: { className: null, studentNo: null, name: null, gender: null, notes: null }
    }
  }
  return {
    columns: table.columns.map((item) => ({ index: item.index, title: item.header || `列${item.index + 1}` })),
    mapping: table.mapping
  }
}
