export type {
  BatchAssessmentRow,
  BatchConvertResult,
  BatchConvertSummary,
  ExamColumnMapping,
  ExamColumnRole,
  ExamExportMeta,
  ExamExportPayload,
  ExamExportResult,
  ExamPickResult,
  ExamSheetSnapshot,
  ExamWorkbookSavePayload,
  ExcelDataRow,
  MappingConfidence,
  SuggestedColumnBinding
} from './types'
export { EXAM_BATCH_STATUS_LABELS } from './types'
export { convertExamBatch, buildBatchAssessmentRows } from './convert'
export {
  AUTO_SCORE_CREDIBILITY,
  MISSING_TABLE_HINT,
  NO_AUTO_SCORE_CREDIBILITY,
  buildSingleItemExportSheets,
  buildWorkbookExportSheets,
  convertSingleItemExamBatch,
  convertWorkbookExamBatch,
  detectSingleItemColumns,
  detectWorkbookColumns,
  displayBatchStatus,
  formatNormalizedResult,
  itemAutoScoreLabel,
  singleItemExportFileName,
  singleItemPreviewSummary
} from './singleItem'
export {
  detectExamItemColumn,
  columnAutoConfirmed,
  columnNeedsConfirmation,
  isGenericRawHeader,
  isIgnoredExamHeader
} from './detectExamItemColumn'
export type {
  DetectedExamItemColumn,
  ExamItemMatchType
} from './detectExamItemColumn'
export type { WorkbookDetection, ProjectScoreGroup } from './workbook'
export { workbookItemSummaries, workbookStudentGroups, updateProjectGroupOverride, projectGroupMappingId } from './workbook'
export {
  matchExcelStudent,
  mapExamRowToPeTestStatus,
  resolveExamItemToTestItem,
  findDuplicatePeTests,
  mergePeTestsAtomically,
  planExamBatchPeTestImport,
  buildExamBatchPeTestImportPayload,
  PE_TEST_PRIMARY_IMPORT_LABEL,
  PE_TEST_WRITE_PIPELINE
} from './peTestImport'
export type {
  DuplicateTestAction,
  ImportExamBatchToPeTestsPayload,
  PlannedPeTestImport,
  StudentMatchResult,
  ExamBatchPeTestImportResult
} from './peTestImport'
export { emptyMapping, mappingFromPayload, normalizeExamColumnMapping, roleLabel, suggestColumnMapping } from './columnMapping'
export { buildExamExportSheets, defaultExportFileName } from './exportSheets'
export { detectDeclaredScoreColumns, compareDeclaredScoreWithEngine, isDeclaredScoreHeader } from './declaredScores'
export { parseExamBatchGender } from './parseGender'
export {
  parseExamBatchRawValue,
  parseBatchRawValue,
  expectedRawFormat,
  detectExamNonScoreLabel,
  isBlankExamCell,
  nonScoreRecordMessage
} from './parseRaw'
export { coerceExamSnapshot, objectRowsToExcelData, snapshotRowAsObject, worksheetRowsToSnapshot } from './readSheet'
export {
  buildExamTemplatePayload,
  examTemplateFileBaseName,
  examTemplateScoreHeaders,
  EXAM_TEMPLATE_GUIDE_SHEET,
  EXAM_TEMPLATE_IDENTITY_HEADERS,
  EXAM_TEMPLATE_SCORE_SHEET,
  EXAM_TEMPLATE_VERSION,
  isOfficialExamTemplateHeaders,
  sanitizeTemplateFileName,
  templateItemColumns
} from './template'
