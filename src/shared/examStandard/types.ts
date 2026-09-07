import type { TestUnit, TestValueType, TimeInputMode } from '../peTest/types'

export type ExamType = 'middle_school_exam' | 'gaokao_sports'

export type ExamStandardStatus = 'verified' | 'draft' | 'deprecated'

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
  draft: '未核验',
  deprecated: '已过期'
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
