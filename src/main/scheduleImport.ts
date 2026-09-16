import { dialog } from 'electron'
import { randomUUID } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { basename, extname } from 'node:path'
import * as XLSX from 'xlsx'
import { cellToDisplayString } from '../shared/student/importMapping'
import type { ImportPickResult } from '../shared/student/importTypes'
import {
  detectScheduleWorkbook,
  extractScheduleWorkbook,
  mappingFromSchedulePayload
} from '../shared/schedule/detectSchedule'
import type { DetectedScheduleWorkbook } from '../shared/schedule/detectTypes'
import type { ScheduleImportCommitResult, ScheduleImportMapping, ScheduleSyncResolutions } from '../shared/schedule/importTypes'
import { applyScheduleSync, buildSchedulePreview, emptyScheduleResolutions } from '../shared/schedule/reconcile'
import { getMainWindow } from './mainWindow'
import { loadSchedule, saveSchedule } from './scheduleStore'

const MAX_FILE_BYTES = 5 * 1024 * 1024
const MAX_DATA_ROWS = 80
const ALLOWED_EXTENSIONS = new Set(['.xlsx', '.xls'])

interface ScheduleImportSession {
  sessionId: string
  fileName: string
  sheets: string[]
  detection: DetectedScheduleWorkbook
}

let session: ScheduleImportSession | null = null

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

function workbookToSheets(
  workbook: XLSX.WorkBook,
  sheetNames: string[]
): Array<{ name: string; rows: string[][]; merges: Array<{ s: { r: number; c: number }; e: { r: number; c: number } }> }> {
  return sheetNames.map((name) => {
    const sheet = workbook.Sheets[name]
    const table = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: false,
      defval: '',
      blankrows: true
    })
    const rows = table.map((row) => {
      const source = Array.isArray(row) ? row : []
      return source.map((cell) => cellToDisplayString(cell))
    })
    return {
      name,
      rows,
      merges: sheet?.['!merges'] ? [...sheet['!merges']] : []
    }
  })
}

async function requireSession(sessionId: unknown): Promise<ScheduleImportSession> {
  if (!session || typeof sessionId !== 'string' || session.sessionId !== sessionId) {
    throw new Error('请先选择课表 Excel 文件')
  }
  return session
}

function optionalMapping(input: unknown): ScheduleImportMapping | null {
  if (input === undefined || input === null || input === '' || input === 'auto') {
    return null
  }
  return mappingFromSchedulePayload(input)
}

function parseResolutions(input: unknown): ScheduleSyncResolutions {
  if (input === undefined || input === null) {
    return emptyScheduleResolutions()
  }
  if (typeof input !== 'object') {
    throw new Error('课表同步确认项格式不正确')
  }
  const record = input as Record<string, unknown>
  const slotChoices =
    record.slotChoices && typeof record.slotChoices === 'object'
      ? (record.slotChoices as ScheduleSyncResolutions['slotChoices'])
      : {}
  const clearLinks =
    record.clearLinks && typeof record.clearLinks === 'object' ? (record.clearLinks as Record<string, boolean>) : {}
  return {
    slotChoices,
    clearLinks,
    acknowledgeRemoves: record.acknowledgeRemoves === true
  }
}

export function clearScheduleImportSession(): void {
  session = null
}

export async function pickScheduleExcel(): Promise<ImportPickResult> {
  const owner = getMainWindow()
  const options = {
    title: '选择课表 Excel',
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

  const fileName = basename(filePath)
  const detection = detectScheduleWorkbook(fileName, workbookToSheets(workbook, sheets))
  session = {
    sessionId: randomUUID(),
    fileName,
    sheets,
    detection
  }
  return {
    canceled: false,
    sessionId: session.sessionId,
    fileName: session.fileName,
    sheets: session.sheets
  }
}

export async function analyzeScheduleExcel(sessionId: unknown): Promise<DetectedScheduleWorkbook> {
  return (await requireSession(sessionId)).detection
}

export async function previewScheduleExcel(
  sessionId: unknown,
  mappingInput: unknown,
  resolutionsInput: unknown
) {
  const currentSession = await requireSession(sessionId)
  const mapping = optionalMapping(mappingInput)
  const extraction = extractScheduleWorkbook(currentSession.detection, mapping)
  const incoming = extraction.rows
  if (incoming.length > MAX_DATA_ROWS) {
    throw new Error(`课表行超过 ${MAX_DATA_ROWS} 行，请拆分后再导入`)
  }
  const current = await loadSchedule()
  const preview = buildSchedulePreview(current, incoming, {
    fileName: currentSession.fileName,
    resolutions: parseResolutions(resolutionsInput)
  })
  return {
    ...preview,
    canCommit: incoming.length > 0 && preview.canCommit,
    blockingReasons:
      incoming.length > 0
        ? preview.blockingReasons
        : [...preview.blockingReasons, '未识别到可导入课程；请查看工作表、表头与跳过原因'],
    importSummary: extraction.summary
  }
}

export async function commitScheduleExcel(
  sessionId: unknown,
  mappingInput: unknown,
  resolutionsInput: unknown
): Promise<ScheduleImportCommitResult> {
  const currentSession = await requireSession(sessionId)
  const mapping = optionalMapping(mappingInput)
  const extraction = extractScheduleWorkbook(currentSession.detection, mapping)
  const incoming = extraction.rows
  if (incoming.length === 0) {
    const skipDetails = extraction.summary.skipped
      .slice(0, 3)
      .map((item) => `${item.sheetName} 第${item.excelRow}行：${item.reason}`)
      .join('；')
    throw new Error(
      `未能识别可导入课程。${skipDetails || '请确认工作表中包含节次、时间和星期表头，或手动指定列。'}`
    )
  }
  if (incoming.length > MAX_DATA_ROWS) {
    throw new Error(`课表行超过 ${MAX_DATA_ROWS} 行，请拆分后再导入`)
  }
  const resolutions = parseResolutions(resolutionsInput)
  const current = await loadSchedule()
  const preview = buildSchedulePreview(current, incoming, {
    fileName: currentSession.fileName,
    resolutions
  })
  const target = applyScheduleSync(current, incoming, resolutions)
  const saved = await saveSchedule(target)
  clearScheduleImportSession()
  return {
    items: saved,
    keep: preview.totals.keep,
    create: preview.totals.create,
    update: preview.totals.update,
    remove: preview.totals.remove,
    recognized: extraction.summary.recognizedCount,
    specialEventCount: extraction.summary.specialEventCount,
    skipped: extraction.summary.skipped.length
  }
}
