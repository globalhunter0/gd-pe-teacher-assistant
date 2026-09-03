import { dialog } from 'electron'
import { randomUUID } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { basename, extname } from 'node:path'
import * as XLSX from 'xlsx'
import {
  buildImportPreviewRows,
  cellToDisplayString,
  mappingFromPayload,
  suggestImportMapping,
  summarizeImportRows
} from '../shared/student/importMapping'
import type {
  ImportColumn,
  ImportCommitResult,
  ImportPickResult,
  ImportPreviewResult,
  StudentImportMapping
} from '../shared/student/importTypes'
import { createStudentId } from '../shared/student/validate'
import { loadClasses } from './classStore'
import { getMainWindow } from './mainWindow'
import { loadStudents, saveStudents } from './studentStore'

const MAX_FILE_BYTES = 5 * 1024 * 1024
const MAX_DATA_ROWS = 800
const ALLOWED_EXTENSIONS = new Set(['.xlsx', '.xls'])

interface ImportSession {
  sessionId: string
  filePath: string
  fileName: string
  sheets: string[]
}

interface ParsedSheet {
  headerRowNumber: number
  columns: ImportColumn[]
  rows: Array<{ excelRow: number; cells: string[] }>
}

let session: ImportSession | null = null

function isRowEmpty(cells: string[]): boolean {
  return cells.every((cell) => cell === '')
}

function listVisibleSheets(workbook: XLSX.WorkBook): string[] {
  const meta = workbook.Workbook?.Sheets
  const visible = workbook.SheetNames.filter((_name, index) => {
    const hidden = meta?.[index]?.Hidden
    return hidden !== 1 && hidden !== 2
  })

  return visible.length > 0 ? visible : [...workbook.SheetNames]
}

async function readWorkbook(filePath: string): Promise<XLSX.WorkBook> {
  const buffer = await readFile(filePath)
  return XLSX.read(buffer, {
    type: 'buffer',
    cellNF: true,
    cellText: true,
    cellDates: false
  })
}

function parseSheet(workbook: XLSX.WorkBook, sheetName: string): ParsedSheet {
  if (!workbook.SheetNames.includes(sheetName)) {
    throw new Error('工作表不存在')
  }

  const sheet = workbook.Sheets[sheetName]
  if (!sheet) {
    throw new Error('工作表不存在')
  }

  const table = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: false,
    defval: '',
    blankrows: true
  })

  const normalized = table.map((row) => {
    const source = Array.isArray(row) ? row : []
    return source.map((cell) => cellToDisplayString(cell))
  })

  const headerIndex = normalized.findIndex((row) => !isRowEmpty(row))
  if (headerIndex < 0) {
    throw new Error('未找到表头，请确认工作表中有内容')
  }

  const headerCells = normalized[headerIndex]
  const columnCount = Math.max(headerCells.length, ...normalized.slice(headerIndex + 1).map((row) => row.length), 1)
  const columns: ImportColumn[] = Array.from({ length: columnCount }, (_item, index) => {
    const title = headerCells[index] ?? ''
    return {
      index,
      title: title === '' ? `列${index + 1}` : title
    }
  })

  const rows: ParsedSheet['rows'] = []
  for (let index = headerIndex + 1; index < normalized.length; index += 1) {
    const cells = Array.from({ length: columnCount }, (_item, columnIndex) => normalized[index][columnIndex] ?? '')
    if (isRowEmpty(cells)) {
      continue
    }

    rows.push({
      excelRow: index + 1,
      cells
    })
  }

  if (rows.length > MAX_DATA_ROWS) {
    throw new Error(`数据行超过 ${MAX_DATA_ROWS} 行，请拆分后再导入`)
  }

  return {
    headerRowNumber: headerIndex + 1,
    columns,
    rows
  }
}

async function requireSession(sessionId: unknown): Promise<ImportSession> {
  if (!session || typeof sessionId !== 'string' || session.sessionId !== sessionId) {
    throw new Error('请先选择 Excel 文件')
  }

  return session
}

async function buildPreview(
  current: ImportSession,
  sheetName: string,
  mapping: StudentImportMapping,
  classId: string
): Promise<ImportPreviewResult> {
  const classes = await loadClasses()
  if (!classes.some((item) => item.id === classId)) {
    throw new Error('所属班级不存在，请先在班级管理中创建班级')
  }

  const workbook = await readWorkbook(current.filePath)
  if (!current.sheets.includes(sheetName)) {
    throw new Error('请选择有效的工作表')
  }

  const parsed = parseSheet(workbook, sheetName)
  const students = await loadStudents()
  const existingStudentNos = new Set(
    students.filter((item) => item.classId === classId && item.studentNo !== '').map((item) => item.studentNo)
  )
  const rows = buildImportPreviewRows(parsed.rows, mapping, existingStudentNos)
  const summary = summarizeImportRows(rows)

  return {
    fileName: current.fileName,
    sheetName,
    headerRowNumber: parsed.headerRowNumber,
    columns: parsed.columns,
    suggestedMapping: suggestImportMapping(parsed.columns),
    ...summary,
    rows
  }
}

export function clearImportSession(): void {
  session = null
}

export async function pickStudentExcel(): Promise<ImportPickResult> {
  const owner = getMainWindow()
  const options = {
    title: '选择学生名单 Excel',
    properties: ['openFile'] as Array<'openFile'>,
    filters: [{ name: 'Excel 文件', extensions: ['xlsx', 'xls'] }]
  }
  const picked = owner ? await dialog.showOpenDialog(owner, options) : await dialog.showOpenDialog(options)

  if (picked.canceled || !picked.filePaths[0]) {
    return { canceled: true }
  }

  const filePath = picked.filePaths[0]
  const extension = extname(filePath).toLowerCase()
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error('只支持 .xlsx 或 .xls 文件')
  }

  const fileStat = await stat(filePath)
  if (fileStat.size > MAX_FILE_BYTES) {
    throw new Error('Excel 文件超过 5MB，请缩小后再导入')
  }

  const workbook = await readWorkbook(filePath)
  const sheets = listVisibleSheets(workbook)
  if (sheets.length === 0) {
    throw new Error('Excel 中没有可读取的工作表')
  }

  session = {
    sessionId: randomUUID(),
    filePath,
    fileName: basename(filePath),
    sheets
  }

  return {
    canceled: false,
    sessionId: session.sessionId,
    fileName: session.fileName,
    sheets: session.sheets
  }
}

export async function previewStudentExcel(
  sessionId: unknown,
  sheetName: unknown,
  mappingInput: unknown,
  classId: unknown
): Promise<ImportPreviewResult> {
  if (typeof sheetName !== 'string' || sheetName.trim() === '') {
    throw new Error('请选择工作表')
  }

  if (typeof classId !== 'string' || classId.trim() === '') {
    throw new Error('请选择所属班级')
  }

  const current = await requireSession(sessionId)
  const mapping = mappingFromPayload(mappingInput)
  return buildPreview(current, sheetName, mapping, classId)
}

export async function commitStudentExcel(
  sessionId: unknown,
  sheetName: unknown,
  mappingInput: unknown,
  classId: unknown
): Promise<ImportCommitResult> {
  const preview = await previewStudentExcel(sessionId, sheetName, mappingInput, classId)
  const accepted = preview.rows.filter((row) => row.status === 'importable' || row.status === 'warning')

  if (accepted.length === 0) {
    throw new Error('没有可以导入的学生，请先修正 Excel 或已有名单')
  }

  const now = new Date().toISOString()
  const existing = await loadStudents()
  const classes = await loadClasses()
  const knownClassIds = new Set(classes.map((item) => item.id))
  const next = [
    ...existing,
    ...accepted.map((row) => ({
      id: createStudentId(),
      classId: classId as string,
      studentNo: row.studentNo,
      name: row.name,
      gender: row.gender,
      status: 'active' as const,
      notes: row.notes,
      createdAt: now,
      updatedAt: now
    }))
  ]

  const saved = await saveStudents(next, knownClassIds)
  clearImportSession()

  return {
    students: saved,
    imported: accepted.length,
    warningImported: preview.warning,
    skippedDuplicate: preview.duplicate,
    skippedError: preview.error
  }
}

export async function inspectSheetHeaders(
  sessionId: unknown,
  sheetName: unknown
): Promise<{ columns: ImportColumn[]; suggestedMapping: StudentImportMapping; headerRowNumber: number }> {
  if (typeof sheetName !== 'string' || sheetName.trim() === '') {
    throw new Error('请选择工作表')
  }

  const current = await requireSession(sessionId)
  if (!current.sheets.includes(sheetName)) {
    throw new Error('请选择有效的工作表')
  }

  const workbook = await readWorkbook(current.filePath)
  const parsed = parseSheet(workbook, sheetName)
  return {
    columns: parsed.columns,
    suggestedMapping: suggestImportMapping(parsed.columns),
    headerRowNumber: parsed.headerRowNumber
  }
}
