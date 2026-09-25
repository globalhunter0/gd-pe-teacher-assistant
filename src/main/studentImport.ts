import { assertCollectionUnchanged } from '../shared/persistence/collectionConflict'
import { dialog } from 'electron'
import { randomUUID } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { basename, extname } from 'node:path'
import * as XLSX from 'xlsx'
import { emptyImportTransactionReport, runStagedJsonWrites } from '../shared/importTransaction'
import { cellToDisplayString, mappingFromPayload } from '../shared/student/importMapping'
import type {
  ImportColumn,
  ImportCommitResult,
  ImportPickResult,
  StudentImportMapping
} from '../shared/student/importTypes'
import type { DetectedWorkbook } from '../shared/student/detectTypes'
import {
  buildIncomingFromDetectedWorkbook,
  detectStudentRosterWorkbook,
  detectionColumns
} from '../shared/student/detectRoster'
import type { RosterPreviewResult, RosterResolutions } from '../shared/student/rosterTypes'
import { applyRosterSync, buildRosterPreview } from '../shared/student/roster'
import { parseStudentRecords } from '../shared/student/validate'
import { DEFAULT_ACADEMIC_YEAR, SEMESTERS, type Semester } from '../shared/class/types'
import { parseClassRecords } from '../shared/class/validate'
import { loadClasses, saveClasses } from './classStore'
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
  detection: DetectedWorkbook
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

async function requireSession(sessionId: unknown): Promise<ImportSession> {
  if (!session || typeof sessionId !== 'string' || session.sessionId !== sessionId) {
    throw new Error('请先选择 Excel 文件')
  }
  return session
}

function parseSemester(value: unknown): Semester {
  if (typeof value === 'string' && (SEMESTERS as readonly string[]).includes(value)) {
    return value as Semester
  }
  return '第一学期'
}

function parseResolutions(input: unknown): RosterResolutions {
  if (input === undefined || input === null) {
    return { classChoices: {}, rowChoices: {} }
  }
  if (typeof input !== 'object') {
    throw new Error('名单确认项格式不正确')
  }
  const record = input as Record<string, unknown>
  const classChoices =
    record.classChoices && typeof record.classChoices === 'object'
      ? (record.classChoices as RosterResolutions['classChoices'])
      : {}
  const rowChoices =
    record.rowChoices && typeof record.rowChoices === 'object'
      ? (record.rowChoices as RosterResolutions['rowChoices'])
      : {}
  return { classChoices, rowChoices }
}

function optionalMapping(input: unknown): StudentImportMapping | null {
  if (input === undefined || input === null || input === '' || input === 'auto') {
    return null
  }
  return mappingFromPayload(input)
}

async function buildRosterFromSession(
  current: ImportSession,
  sheetName: string,
  mappingOverride: StudentImportMapping | null,
  context: { academicYear: string; semester: Semester; resolutions: RosterResolutions }
): Promise<{ preview: RosterPreviewResult; incoming: ReturnType<typeof buildIncomingFromDetectedWorkbook> }> {
  let detection = current.detection
  if (sheetName && sheetName !== '*' && sheetName !== 'auto') {
    detection = {
      ...detection,
      tables: detection.tables.filter((item) => item.sheetName === sheetName)
    }
  }
  const incoming = buildIncomingFromDetectedWorkbook(detection, mappingOverride)
  if (incoming.length > MAX_DATA_ROWS) {
    throw new Error(`数据行超过 ${MAX_DATA_ROWS} 行，请拆分后再导入`)
  }
  if (incoming.length === 0) {
    throw new Error('未能识别学生名单。请打开“识别有误？手动调整”后指定姓名列')
  }
  const [classes, students] = await Promise.all([loadClasses(), loadStudents()])
  const preview = buildRosterPreview(incoming, classes, students, {
    fileName: current.fileName,
    sheetName: detection.tables.map((item) => item.sheetName).join('、') || sheetName,
    headerRowNumber: detection.tables[0]?.headerRowNumber ?? 1,
    academicYear: context.academicYear,
    semester: context.semester,
    resolutions: context.resolutions
  })
  return { preview, incoming }
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

  const fileName = basename(filePath)
  const detection = detectStudentRosterWorkbook(fileName, workbookToSheets(workbook, sheets))

  session = {
    sessionId: randomUUID(),
    filePath,
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

export async function analyzeStudentExcel(sessionId: unknown): Promise<DetectedWorkbook> {
  return (await requireSession(sessionId)).detection
}

export async function previewStudentExcel(
  sessionId: unknown,
  sheetName: unknown,
  mappingInput: unknown,
  contextInput: unknown
): Promise<RosterPreviewResult> {
  const current = await requireSession(sessionId)
  const mapping = optionalMapping(mappingInput)
  const contextRecord = contextInput && typeof contextInput === 'object' ? (contextInput as Record<string, unknown>) : {}
  const academicYear =
    typeof contextRecord.academicYear === 'string' && contextRecord.academicYear.trim() !== ''
      ? contextRecord.academicYear.trim()
      : (current.detection.suggestedAcademicYear ?? DEFAULT_ACADEMIC_YEAR)
  const { preview } = await buildRosterFromSession(current, typeof sheetName === 'string' ? sheetName : '', mapping, {
    academicYear,
    semester: parseSemester(contextRecord.semester),
    resolutions: parseResolutions(contextRecord.resolutions)
  })
  return preview
}

export async function commitStudentExcel(
  sessionId: unknown,
  sheetName: unknown,
  mappingInput: unknown,
  contextInput: unknown
): Promise<ImportCommitResult> {
  const current = await requireSession(sessionId)
  const mapping = optionalMapping(mappingInput)
  const contextRecord = contextInput && typeof contextInput === 'object' ? (contextInput as Record<string, unknown>) : {}
  const academicYear =
    typeof contextRecord.academicYear === 'string' && contextRecord.academicYear.trim() !== ''
      ? contextRecord.academicYear.trim()
      : (current.detection.suggestedAcademicYear ?? DEFAULT_ACADEMIC_YEAR)
  const semester = parseSemester(contextRecord.semester)
  const resolutions = parseResolutions(contextRecord.resolutions)

  const { preview, incoming } = await buildRosterFromSession(
    current,
    typeof sheetName === 'string' ? sheetName : '',
    mapping,
    { academicYear, semester, resolutions }
  )
  if (!preview.canCommit) {
    throw new Error('仍有班级匹配或学生身份冲突未确认，不能写入')
  }

  const classes = await loadClasses()
  const students = await loadStudents()
  const planned = applyRosterSync(incoming, classes, students, { academicYear, semester, resolutions })
  const parsedClasses = parseClassRecords(planned.classes)
  const knownClassIds = new Set(parsedClasses.map((item) => item.id))
  const parsedStudents = parseStudentRecords(planned.students, { knownClassIds })
  const previousClasses = classes
  const previousStudents = students
  const previousClassIds = new Set(previousClasses.map((item) => item.id))
  let savedClasses = parsedClasses
  let savedStudents = parsedStudents

  const writeResult = await runStagedJsonWrites([
    {
      name: 'classes.json',
      write: async () => {
        assertCollectionUnchanged(await loadClasses(), previousClasses)
        assertCollectionUnchanged(await loadStudents(), previousStudents)
        savedClasses = await saveClasses(parsedClasses)
      },
      restore: async () => {
        await saveClasses(previousClasses)
      }
    },
    {
      name: 'students.json',
      write: async () => {
        savedStudents = await saveStudents(parsedStudents, knownClassIds)
      },
      restore: async () => {
        await saveStudents(previousStudents, previousClassIds)
      }
    }
  ])

  if (!writeResult.ok) {
    const message =
      writeResult.error instanceof Error ? writeResult.error.message : String(writeResult.error)
    const err = new Error(
      writeResult.rolledBack
        ? `学生导入失败，已回滚到导入前状态（失败阶段：${writeResult.failedStage}）：${message}`
        : `学生导入失败且回滚不完整（失败阶段：${writeResult.failedStage}）：${message}`
    )
    ;(err as Error & { transaction?: unknown }).transaction = emptyImportTransactionReport('students', {
      created: 0,
      updated: 0,
      unchanged: preview.totals.keep,
      skipped: 0,
      conflicts: preview.totals.conflict,
      errors: [message],
      rolledBack: writeResult.rolledBack,
      ok: false
    })
    throw err
  }

  clearImportSession()
  return {
    students: savedStudents,
    classes: savedClasses,
    imported: planned.createdStudentCount + planned.updatedStudentCount,
    warningImported: 0,
    skippedDuplicate: 0,
    skippedError: preview.totals.conflict,
    createdClassCount: planned.createdClassCount,
    createdStudentCount: planned.createdStudentCount,
    updatedStudentCount: planned.updatedStudentCount,
    removedFromRosterCount: planned.removedFromRosterCount,
    transaction: emptyImportTransactionReport('students', {
      created: planned.createdStudentCount + planned.createdClassCount,
      updated: planned.updatedStudentCount,
      unchanged: preview.totals.keep,
      skipped: planned.removedFromRosterCount,
      conflicts: preview.totals.conflict,
      errors: [],
      rolledBack: false,
      ok: true
    })
  }
}

export async function inspectSheetHeaders(
  sessionId: unknown,
  sheetName: unknown
): Promise<{
  columns: ImportColumn[]
  suggestedMapping: StudentImportMapping
  headerRowNumber: number
  detection: DetectedWorkbook
}> {
  const current = await requireSession(sessionId)
  if (typeof sheetName === 'string' && sheetName !== '' && sheetName !== '*') {
    const table = current.detection.tables.find((item) => item.sheetName === sheetName)
    if (table) {
      return {
        columns: table.columns.map((item) => ({ index: item.index, title: item.header || `列${item.index + 1}` })),
        suggestedMapping: table.mapping,
        headerRowNumber: table.headerRowNumber,
        detection: current.detection
      }
    }
  }
  const detected = detectionColumns(current.detection)
  return {
    columns: detected.columns,
    suggestedMapping: detected.mapping,
    headerRowNumber: current.detection.tables[0]?.headerRowNumber ?? 1,
    detection: current.detection
  }
}
