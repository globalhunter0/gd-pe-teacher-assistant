import { dialog } from 'electron'
import { randomUUID } from 'node:crypto'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { basename, extname } from 'node:path'
import * as XLSX from 'xlsx'
import { buildExamExportSheets, defaultExportFileName } from '../shared/examBatch/exportSheets'
import { worksheetRowsToSnapshot } from '../shared/examBatch/readSheet'
import type {
  ExamExportPayload,
  ExamExportResult,
  ExamPickResult,
  ExamSheetSnapshot,
  ExamWorkbookSavePayload
} from '../shared/examBatch/types'
import { getMainWindow } from './mainWindow'

const MAX_FILE_BYTES = 12 * 1024 * 1024
const MAX_DATA_ROWS = 8000
const ALLOWED_EXTENSIONS = new Set(['.xlsx', '.xls'])

interface ImportSession {
  sessionId: string
  filePath: string
  fileName: string
  sheets: string[]
}

let session: ImportSession | null = null

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

export function clearExamBatchSession(): void {
  session = null
}

export async function pickExamExcel(): Promise<ExamPickResult> {
  const owner = getMainWindow()
  const options = {
    title: '选择成绩 Excel',
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
    throw new Error('Excel 文件超过 12MB，请缩小后再导入')
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

export async function loadExamSheet(sessionId: unknown, sheetName: unknown): Promise<ExamSheetSnapshot> {
  if (!session || typeof sessionId !== 'string' || session.sessionId !== sessionId) {
    throw new Error('请先选择 Excel 文件')
  }
  if (typeof sheetName !== 'string' || !session.sheets.includes(sheetName)) {
    throw new Error('请选择有效的工作表')
  }

  const workbook = await readWorkbook(session.filePath)
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) {
    throw new Error('工作表不存在')
  }

  const displayed = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: false,
    defval: '',
    blankrows: true
  })
  const rawTable = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: '',
    blankrows: true
  })

  const snapshot = worksheetRowsToSnapshot(displayed, rawTable, session.fileName, sheetName)
  if (snapshot.rows.length > MAX_DATA_ROWS) {
    throw new Error(`数据行超过 ${MAX_DATA_ROWS} 行，请拆分后再导入`)
  }

  return snapshot
}

export async function exportExamWorkbook(payload: ExamExportPayload): Promise<ExamExportResult> {
  const sheets = buildExamExportSheets(payload.rows, payload.meta, payload.layout)
  const workbook = XLSX.utils.book_new()
  for (const sheet of sheets) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheet.rows), sheet.name)
  }

  const owner = getMainWindow()
  const options = {
    title: '导出成绩换算结果',
    defaultPath: defaultExportFileName(payload.meta),
    filters: [{ name: 'Excel 文件', extensions: ['xlsx'] }]
  }
  const saved = owner ? await dialog.showSaveDialog(owner, options) : await dialog.showSaveDialog(options)
  if (saved.canceled || !saved.filePath) {
    return { canceled: true }
  }

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer
  await writeFile(saved.filePath, buffer)
  return { canceled: false, filePath: saved.filePath }
}

export async function saveExamWorkbook(payload: ExamWorkbookSavePayload): Promise<ExamExportResult> {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    typeof payload.defaultFileName !== 'string' ||
    payload.defaultFileName.trim() === '' ||
    !Array.isArray(payload.sheets) ||
    payload.sheets.length === 0
  ) {
    throw new Error('模板内容无效')
  }

  const workbook = XLSX.utils.book_new()
  for (const sheet of payload.sheets) {
    if (typeof sheet.name !== 'string' || sheet.name.trim() === '' || !Array.isArray(sheet.rows)) {
      throw new Error('模板工作表无效')
    }
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheet.rows), sheet.name.slice(0, 31))
  }

  const owner = getMainWindow()
  const options = {
    title: '保存成绩登记模板',
    defaultPath: payload.defaultFileName,
    filters: [{ name: 'Excel 文件', extensions: ['xlsx'] }]
  }
  const saved = owner ? await dialog.showSaveDialog(owner, options) : await dialog.showSaveDialog(options)
  if (saved.canceled || !saved.filePath) {
    return { canceled: true }
  }

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer
  await writeFile(saved.filePath, buffer)
  return { canceled: false, filePath: saved.filePath }
}
