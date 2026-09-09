import type { Grade, Semester } from '../class/types'
import type { StudentImportMapping } from './importTypes'

export type DetectConfidence = 'high' | 'medium' | 'low'

export type DetectedFieldKey = 'name' | 'studentNo' | 'gender' | 'className' | 'notes' | 'grade' | 'serial' | null

export interface DetectedColumn {
  index: number
  header: string
  field: DetectedFieldKey
  confidence: DetectConfidence
  reason: string
}

export interface DetectedClassContext {
  classRaw: string
  grade: Grade | null
  className: string
  source: 'column' | 'sheet' | 'title' | 'filename'
  confidence: DetectConfidence
}

export interface DetectedRosterTable {
  sheetName: string
  headerRowIndex: number
  dataStartRowIndex: number
  headerRowNumber: number
  columns: DetectedColumn[]
  mapping: StudentImportMapping
  gradeColumnIndex: number | null
  classNumberColumnIndex: number | null
  classContext: DetectedClassContext | null
  dataRows: Array<{ excelRow: number; cells: string[] }>
  rowCount: number
  confidence: DetectConfidence
  warnings: string[]
  ambiguities: string[]
  headerCandidates: Array<{ rowIndex: number; score: number }>
}

export interface SkippedSheet {
  sheetName: string
  reason: string
}

export interface DetectedWorkbook {
  fileName: string
  tables: DetectedRosterTable[]
  skippedSheets: SkippedSheet[]
  overallConfidence: DetectConfidence
  warnings: string[]
  ambiguities: string[]
  needsClassConfirmation: boolean
  needsColumnMapping: boolean
  suggestedAcademicYear: string | null
  suggestedSemester: Semester | null
}

export interface WorkbookSheetInput {
  name: string
  rows: string[][]
  merges?: Array<{ s: { r: number; c: number }; e: { r: number; c: number } }>
}
