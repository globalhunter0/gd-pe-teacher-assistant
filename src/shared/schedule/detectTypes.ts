import type { DetectConfidence } from '../student/detectTypes'
import type { ScheduleImportField, ScheduleImportMapping } from './importTypes'

export interface DetectedScheduleColumn {
  index: number
  header: string
  field: ScheduleImportField | null
  confidence: DetectConfidence
  reason: string
}

export interface DetectedScheduleTable {
  sheetName: string
  headerRowIndex: number
  headerRowNumber: number
  columns: DetectedScheduleColumn[]
  mapping: ScheduleImportMapping
  dataRows: Array<{ excelRow: number; cells: string[] }>
  rowCount: number
  confidence: DetectConfidence
  warnings: string[]
}

export interface DetectedScheduleWorkbook {
  fileName: string
  tables: DetectedScheduleTable[]
  skippedSheets: Array<{ sheetName: string; reason: string }>
  overallConfidence: DetectConfidence
  warnings: string[]
  needsColumnMapping: boolean
}
