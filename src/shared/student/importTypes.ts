import type { ClassRecord } from '../class/types'
import type { StudentGender, StudentRecord } from './types'

export type ImportRowStatus = 'importable' | 'warning' | 'error' | 'duplicate'

export interface StudentImportMapping {
  className: number | null
  studentNo: number | null
  name: number | null
  gender: number | null
  notes: number | null
}

export interface ImportColumn {
  index: number
  title: string
}

export interface ImportPreviewRow {
  excelRow: number
  studentNo: string
  name: string
  gender: StudentGender
  notes: string
  status: ImportRowStatus
  message: string
}

export interface ImportPreviewResult {
  fileName: string
  sheetName: string
  headerRowNumber: number
  columns: ImportColumn[]
  suggestedMapping: StudentImportMapping
  totalRows: number
  importable: number
  warning: number
  error: number
  duplicate: number
  rows: ImportPreviewRow[]
}

export interface ImportCommitResult {
  students: StudentRecord[]
  classes?: ClassRecord[]
  imported: number
  warningImported: number
  skippedDuplicate: number
  skippedError: number
  createdClassCount?: number
  createdStudentCount?: number
  updatedStudentCount?: number
  removedFromRosterCount?: number
}

export type ImportPickResult =
  | { canceled: true }
  | {
      canceled: false
      sessionId: string
      fileName: string
      sheets: string[]
    }
