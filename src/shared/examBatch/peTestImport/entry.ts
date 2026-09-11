import type { ExamStandard } from '../../examStandard/types'
import type { BatchAssessmentRow } from '../types'
import type { DuplicateTestAction, ImportExamBatchToPeTestsPayload } from './types'

/** Excel 只是成绩写入的一种来源；手工录入与未来现场提交共用同一套 PE Test 写入。 */
export const PE_TEST_SCORE_SOURCES = ['manual', 'exam-batch'] as const
export type PeTestScoreSource = (typeof PE_TEST_SCORE_SOURCES)[number]

export const PE_TEST_WRITE_PIPELINE = {
  detect: 'detectWorkbookColumns',
  score: 'convertWorkbookExamBatch',
  matchStudent: 'matchExcelStudent',
  resolveItem: 'resolveExamItemToTestItem',
  write: 'executeImportExamBatchToPeTests'
} as const

export const PE_TEST_PRIMARY_IMPORT_LABEL = '导入成绩'

export function buildExamBatchPeTestImportPayload(input: {
  classId: string
  testDate: string
  standard: Pick<ExamStandard, 'id' | 'examType' | 'cityName' | 'schemeLabel' | 'policyLabel'>
  rows: BatchAssessmentRow[]
  duplicateAction: DuplicateTestAction
}): ImportExamBatchToPeTestsPayload {
  return {
    classId: input.classId,
    testDate: input.testDate,
    examStandardId: input.standard.id,
    scoringCity: input.standard.examType === 'gaokao_sports' ? '广东省' : input.standard.cityName,
    scoringVersion: input.standard.schemeLabel || input.standard.policyLabel,
    duplicateAction: input.duplicateAction,
    rows: input.rows
  }
}
