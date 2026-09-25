export type {
  DuplicateTestAction,
  ExamBatchPeTestImportResult,
  ExamToPeTestStatusMap,
  ImportExamBatchToPeTestsPayload,
  PlanImportContext,
  PlannedPeTestImport,
  StudentMatchKind,
  StudentMatchResult
} from './types'
export { matchExcelStudent } from './matchStudent'
export { mapExamRowToPeTestStatus } from './mapRecordStatus'
export { resolveExamItemToTestItem } from './resolveTestItem'
export { findDuplicatePeTests, mergePeTestsAtomically, planExamBatchPeTestImport } from './planImport'
// The executor uses Node persistence; main-process callers import ./execute directly.
export type { ExamBatchPeTestImportStores } from './execute'
export { buildExamBatchPeTestImportPayload, PE_TEST_PRIMARY_IMPORT_LABEL, PE_TEST_WRITE_PIPELINE } from './entry'
