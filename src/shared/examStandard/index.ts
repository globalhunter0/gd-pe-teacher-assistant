export type {
  CalculateExamScoreInput,
  CalculateExamScoreResult,
  ExamScoreFailure,
  ExamScoreSuccess,
  FindExamItemMappingQuery,
  FindStandardQuery
} from './score'
export {
  calculateExamScore,
  findApplicableStandard,
  findExamItemMapping,
  formatExamRawValue,
  itemAppliesToGender,
  OFFICIAL_SCORE_UNAVAILABLE,
  OFFICIAL_SCORE_UNSUPPORTED,
  itemSupportsAutoScore,
  parseExamPerformanceInput,
  scoreFromThresholdTable
} from './score'
export { BUILTIN_EXAM_STANDARDS, assertBuiltinExamCatalog, listBuiltinExamStandards } from './catalog'
export {
  assertExamCatalogIntegrity,
  assertExamStandardIntegrity,
  runExamTableIntegritySelfCheck,
  runExamTableIntegritySelfCheckOrThrow
} from './integrity'
export { GD_CITIES, GD_PROVINCE, findGdCity, standardsForCity, verifiedStandardsForCity } from './regions'
export type {
  ExamComponent,
  ExamGender,
  ExamGroup,
  ExamItemDefinition,
  ExamItemVerification,
  ExamStandard,
  ExamStandardStatus,
  ExamType,
  GdCity,
  ScoreMode,
  ScoreRule,
  ScoreTableEntry,
  SelectionRule
} from './types'
export {
  EXAM_GENDER_LABELS,
  EXAM_ITEM_VERIFICATION_LABELS,
  EXAM_STATUS_LABELS,
  EXAM_TYPE_LABELS,
  EXAM_TYPES,
  SCORE_MODE_LABELS
} from './types'
export { attachExamItemAliases, aliasesForItem } from './itemAliases'

