import type { ExamGender, ExamStandard } from '../examStandard/types'
import type { ImportColumn } from '../student/importTypes'

export type ExamBatchLayout = 'wide' | 'long'

export type ExamBatchRowStatus =
  | 'success'
  | 'unrecognized_student_field'
  | 'unrecognized_gender'
  | 'unrecognized_item'
  | 'invalid_raw_value'
  | 'unsupported_item'
  | 'no_verified_standard'
  | 'no_score_table'
  | 'ambiguous_item'
  | 'header_used_as_value'

export const EXAM_BATCH_STATUS_LABELS: Record<ExamBatchRowStatus, string> = {
  success: '成功',
  unrecognized_student_field: '缺少学生信息',
  unrecognized_gender: '无法识别性别',
  unrecognized_item: '无法识别项目',
  invalid_raw_value: '成绩格式无法识别',
  unsupported_item: '暂不支持自动换算',
  no_verified_standard: '无已核验标准',
  no_score_table: '无可用换算表',
  ambiguous_item: '项目匹配不唯一',
  header_used_as_value: '成绩列取到了表头'
}

export type MappingConfidence = 'high' | 'medium' | 'none'

export type ExamColumnRole =
  | { kind: 'ignore'; sourceColumn: number; sourceHeader: string }
  | { kind: 'studentNo'; sourceColumn: number; sourceHeader: string }
  | { kind: 'studentName'; sourceColumn: number; sourceHeader: string }
  | { kind: 'gender'; sourceColumn: number; sourceHeader: string }
  | { kind: 'className'; sourceColumn: number; sourceHeader: string }
  | { kind: 'itemName'; sourceColumn: number; sourceHeader: string }
  | { kind: 'rawValue'; sourceColumn: number; sourceHeader: string }
  | { kind: 'examItem'; itemId: string; sourceColumn: number; sourceHeader: string }
  | { kind: 'examItemKey'; itemKey: string; sourceColumn: number; sourceHeader: string }

export interface ExamColumnMapping {
  layout: ExamBatchLayout
  columns: ExamColumnRole[]
}

export interface SuggestedColumnBinding {
  index: number
  title: string
  role: ExamColumnRole
  label: string
  confidence: MappingConfidence
  candidates: Array<{ itemId: string; name: string }>
}

export interface ExcelDataRow {
  excelRow: number
  cells: string[]
  raw: unknown[]
}

export interface ExamSheetSnapshot {
  fileName: string
  sheetName: string
  headerRowNumber: number
  columns: ImportColumn[]
  rows: ExcelDataRow[]
}

export interface BatchAssessmentRow {
  sourceRow: number
  studentNo: string
  studentName: string
  className: string
  gender: Exclude<ExamGender, 'all'> | null
  examStandardId: string
  examItemId: string | null
  examItemName: string
  rawValueOriginal: string
  rawValueNormalized: string | null
  rawValueParsed: number | null
  score: number | null
  status: ExamBatchRowStatus
  message: string
}

export interface BatchConvertSummary {
  studentCount: number
  recordCount: number
  successCount: number
  errorCount: number
}

export interface BatchConvertResult {
  rows: BatchAssessmentRow[]
  summary: BatchConvertSummary
}

export interface ExamExportMeta {
  examTypeLabel: string
  regionName: string
  standardTitle: string
  policyLabel: string
  yearLabel: string
  statusLabel: string
  sourceTitle: string
  sourceUrl: string | null
  exportedAt: string
  fileBaseName: string
}

export type ExamPickResult =
  | { canceled: true }
  | {
      canceled: false
      sessionId: string
      fileName: string
      sheets: string[]
    }

export type ExamExportResult = { canceled: true } | { canceled: false; filePath: string }

export interface ExamWorkbookSavePayload {
  defaultFileName: string
  sheets: Array<{ name: string; rows: Array<Array<string | number>> }>
}

export interface ExamExportPayload {
  meta: ExamExportMeta
  layout: ExamBatchLayout
  rows: BatchAssessmentRow[]
  standard: Pick<ExamStandard, 'id' | 'title'>
}
