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
  OFFICIAL_SCORE_PARTIAL,
  OFFICIAL_SCORE_SCHEME_ONLY,
  OFFICIAL_SCORE_UNAVAILABLE,
  OFFICIAL_SCORE_UNSUPPORTED,
  itemSupportsAutoScore,
  parseExamPerformanceInput,
  scoreFromThresholdTable,
  standardAllowsOfficialConvert
} from './score'
export { BUILTIN_EXAM_STANDARDS, assertBuiltinExamCatalog, listBuiltinExamStandards } from './catalog'
export {
  assertExamCatalogIntegrity,
  assertExamStandardIntegrity,
  runExamTableIntegritySelfCheck,
  runExamTableIntegritySelfCheckOrThrow
} from './integrity'
export {
  CITY_COVERAGE_LABELS,
  cityCoverageStatus,
  coverageTone,
  listGuangdongCityCoverage,
  statusBadgeTone,
  statusDisplayLabel
} from './coverage'
export type { CityCoverageRow, CityCoverageStatus } from './coverage'
export { GD_CITIES, GD_PROVINCE, findGdCity, standardsForCity, verifiedStandardsForCity } from './regions'
export type {
  ExamCandidateGroup,
  ExamComponent,
  ExamGender,
  ExamGroup,
  ExamItemDefinition,
  ExamItemVerification,
  ExamRuleStatus,
  ExamScoreTableStatus,
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
  EXAM_CANDIDATE_GROUP_LABELS,
  EXAM_GENDER_LABELS,
  EXAM_ITEM_VERIFICATION_LABELS,
  EXAM_RULE_STATUS_LABELS,
  EXAM_SCORE_TABLE_STATUS_LABELS,
  EXAM_STATUS_LABELS,
  EXAM_TYPE_LABELS,
  EXAM_TYPES,
  SCORE_MODE_LABELS
} from './types'
export { attachExamItemAliases, aliasesForItem } from './itemAliases'

