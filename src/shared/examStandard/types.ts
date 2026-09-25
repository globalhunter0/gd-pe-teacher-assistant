import type { TestUnit, TestValueType, TimeInputMode } from '../peTest/types'

export type ExamType = 'middle_school_exam' | 'gaokao_sports'

export type ExamStandardStatus = 'verified' | 'partial' | 'draft' | 'deprecated'

export type ExamRuleStatus = 'verified' | 'partial' | 'draft'

export type ExamScoreTableStatus = 'verified' | 'partial' | 'missing'

export type ExamCandidateGroup = 'regular' | 'returning' | 'repeat'

export type ExamGender = 'male' | 'female' | 'all'

export type ExamItemRequirement = 'required' | 'optional' | 'grouped'

export type ExamItemCategory =
  | 'endurance'
  | 'speed'
  | 'strength'
  | 'skill'
  | 'swim'
  | 'flexibility'
  | 'other'

export type ExamComponentKind =
  | 'process'
  | 'onsite'
  | 'bonus'
  | 'basic_quality'
  | 'special_foundation'
  | 'other'

export type ExamGroupCombine = 'single' | 'sum' | 'average' | 'max'

export type ExamDirection = 'higherBetter' | 'lowerBetter'

export type ExamRounding = 'none' | 'round0' | 'round1'

export type ScoreMode = 'step' | 'linear'

export type ExamItemVerification = 'verified_supported' | 'verified_unsupported' | 'unverified'

export interface ScoreTableEntry {
  score: number
  threshold: number
}

export interface ThresholdScoreRule {
  kind: 'thresholdTable'
  scoreMode: ScoreMode
  maxScore: number
  minScore: number
  entries: ScoreTableEntry[]
  /** 官方插值精度：汕头为十分之一；缺省百分之一（广州/佛山/珠海）。 */
  scorePrecision?: 1 | 2
}

export interface UnsupportedScoreRule {
  kind: 'unsupported'
  reason: string
  maxScore: number
  minScore: number
}

export type ScoreRule = ThresholdScoreRule | UnsupportedScoreRule

export interface ExamItemDefinition {
  id: string
  itemKey: string
  name: string
  gender: ExamGender
  requirement: ExamItemRequirement
  category: ExamItemCategory
  valueType: TestValueType
  timeInputMode: TimeInputMode
  unit: TestUnit
  customUnitLabel: string
  direction: ExamDirection
  decimalPlaces: number
  maxScore: number
  testItemBuiltinKey: string | null
  testItemId: string | null
  verification: ExamItemVerification
  scoreRule: ScoreRule
  /** 官方 PDF 文件页序，便于回核。广州中考等无页码时可省略。 */
  sourcePage?: number | null
  /** 表头/常用别名，用于 Excel 列识别。不改变评分表。 */
  aliases?: string[]
}

export interface SelectionRule {
  mode: 'all' | 'pickN'
  n: number
}

export interface ExamGroup {
  id: string
  title: string
  selection: SelectionRule
  combine: ExamGroupCombine
  itemIds: string[]
}

export interface ExamComponent {
  id: string
  kind: ExamComponentKind
  title: string
  maxScore: number
  weight: number
  groupIds: string[]
}

export interface ExamScoringModel {
  rounding: ExamRounding
}

export interface ExamStandard {
  /** Excel 国家体测适配器的显式年级；不扩展城市标准目录。 */
  importGrade?: import('../class/types').Grade
  id: string
  examType: ExamType
  regionCode: 'CN-GD'
  cityCode: string
  citySlug: string
  cityName: string
  yearFrom: number
  yearTo: number
  policyLabel: string
  policyPeriod: string
  title: string
  sourceAuthority: string
  sourceTitle: string
  sourceUrl: string | null
  policySourceTitle: string
  policySourceUrl: string | null
  publishedAt: string | null
  effectiveFrom: string | null
  effectiveTo: string | null
  status: ExamStandardStatus
  /** 长期考试方案是否已核验；与年度评分表分开。 */
  ruleStatus: ExamRuleStatus
  /** 当年项目评分表是否完整可换算。 */
  scoreTableStatus: ExamScoreTableStatus
  schemeLabel: string
  scoreYear: number | null
  applicableGroups: ExamCandidateGroup[]
  enrollmentCohort: string | null
  calculationNotes: string
  notes: string
  totalMaxScore: number
  scoring: ExamScoringModel
  items: ExamItemDefinition[]
  groups: ExamGroup[]
  components: ExamComponent[]
  createdAt: string
  updatedAt: string
}

export interface GdCity {
  cityCode: string
  citySlug: string
  cityName: string
}

export const EXAM_TYPES: ExamType[] = ['middle_school_exam', 'gaokao_sports']

export const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  middle_school_exam: '体育中考',
  gaokao_sports: '体育高考（省统考）'
}

export const EXAM_STATUS_LABELS: Record<ExamStandardStatus, string> = {
  verified: '已核验',
  partial: '部分核验',
  draft: '资料核验中',
  deprecated: '已过期'
}

export const EXAM_RULE_STATUS_LABELS: Record<ExamRuleStatus, string> = {
  verified: '考试方案已核验',
  partial: '考试方案部分核验',
  draft: '考试方案待核验'
}

export const EXAM_SCORE_TABLE_STATUS_LABELS: Record<ExamScoreTableStatus, string> = {
  verified: '年度评分表已核验',
  partial: '年度评分表部分核验',
  missing: '年度评分表待完整核验'
}

export const EXAM_CANDIDATE_GROUP_LABELS: Record<ExamCandidateGroup, string> = {
  regular: '普通应届生',
  returning: '外地返中山生',
  repeat: '往届生'
}

export const EXAM_ITEM_VERIFICATION_LABELS: Record<ExamItemVerification, string> = {
  verified_supported: '已核验，可自动换算',
  verified_unsupported: '已核验，暂不支持自动换算',
  unverified: '尚未核验评分表'
}

export const SCORE_MODE_LABELS: Record<ScoreMode, string> = {
  step: '命中档位给分',
  linear: '5分档线性插值'
}

export const EXAM_GENDER_LABELS: Record<ExamGender, string> = {
  male: '男',
  female: '女',
  all: '不限'
}
