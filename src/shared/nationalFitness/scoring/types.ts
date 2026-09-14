import type { Grade } from '../../class/types'
import type { ExamGender } from '../../examStandard/types'
import type { TestUnit } from '../../peTest/types'
import { NATIONAL_FITNESS_2014_ID } from '../catalog'
import type { NationalFitnessBonusCategory } from '../types'

export const NATIONAL_FITNESS_SCORE_TABLE_VERIFIED = '官方评分表已核验'

export type NationalFitnessScoreVerification = 'verified' | 'pending'

export type NationalFitnessScoreRuleKind = 'range' | 'higherBetter' | 'lowerBetter'

export type NationalFitnessScoreValueKind = 'number' | 'time'

export interface NationalFitnessRangeBand {
  min: number | null
  max: number | null
  minInclusive: boolean
  maxInclusive: boolean
  score: number
}

export interface NationalFitnessThresholdBand {
  threshold: number
  inclusive: boolean
  score: number
}

export interface NationalFitnessScoreTableSource {
  standardName: string
  version: string
  authority: string
  sourceDocument: string
  documentNo?: string
  tableNo?: string
  tableName?: string
  itemId?: string
  grade?: Grade
  gender?: Exclude<ExamGender, 'all'>
}

export interface NationalFitnessScoreTable {
  id: string
  standardId: typeof NATIONAL_FITNESS_2014_ID | string
  grade: Grade
  gender: Exclude<ExamGender, 'all'>
  itemId: string
  unit: TestUnit
  unitLabel: string
  valueKind: NationalFitnessScoreValueKind
  ruleKind: NationalFitnessScoreRuleKind
  maxBaseScore: number
  minBaseScore: number
  rangeEntries: NationalFitnessRangeBand[]
  thresholdEntries: NationalFitnessThresholdBand[]
  bonusCategory: NationalFitnessBonusCategory | null
  source: NationalFitnessScoreTableSource | null
  verificationStatus: NationalFitnessScoreVerification
}

export const NATIONAL_FITNESS_BELOW_OFFICIAL_MINIMUM = 'BELOW_OFFICIAL_MINIMUM' as const

/** 文案中的分值必须来自当前官方表实际最低公布档，不得全局写死为 10。 */
export function nationalFitnessBelowOfficialMinimumMessage(officialMinimumScore: number): string {
  return `低于官方评分表最低档（${officialMinimumScore}分档）`
}

export type NationalFitnessScoreErrorCode =
  | 'GRADE_UNSUPPORTED'
  | 'GENDER_UNSPECIFIED'
  | 'GENDER_MISMATCH'
  | 'ITEM_NOT_FOUND'
  | 'NO_TABLE'
  | 'NOT_VERIFIED'
  | 'INVALID_VALUE'
  | 'NO_MATCH'
  | typeof NATIONAL_FITNESS_BELOW_OFFICIAL_MINIMUM

export interface CalculateNationalFitnessScoreInput {
  grade: Grade
  gender: import('../../student/types').StudentGender
  itemId?: string
  itemKey?: string
  testItemId?: string | null
  testItemBuiltinKey?: string | null
  rawValue?: number
  rawInput?: string
  tables?: readonly NationalFitnessScoreTable[]
  bonusTables?: readonly NationalFitnessBonusTable[]
}

export interface NationalFitnessMatchedRule {
  ruleKind: NationalFitnessScoreRuleKind
  score: number
  range?: NationalFitnessRangeBand
  threshold?: NationalFitnessThresholdBand
}

export type NationalFitnessOfficialBonusTableId = '2-1' | '2-2' | '2-3' | '2-4' | '2-5' | '2-6'

export type NationalFitnessBonusIncrementKind = 'extraCount' | 'fasterBySeconds'

export interface NationalFitnessBonusBand {
  extra: number
  bonusScore: number
}

export interface NationalFitnessBonusTableSource {
  standardName: string
  version: string
  authority: string
  sourceDocument: string
  documentNo: string
  publishedAt: string
  tableNo: string
  tableName: string
  officialTableId: NationalFitnessOfficialBonusTableId
}

export interface NationalFitnessBonusTable {
  id: string
  officialTableId: NationalFitnessOfficialBonusTableId
  standardId: typeof NATIONAL_FITNESS_2014_ID | string
  itemId: string
  gender: Exclude<ExamGender, 'all'>
  grades: Grade[]
  incrementKind: NationalFitnessBonusIncrementKind
  extraUnitLabel: string
  maxBonus: number
  entries: NationalFitnessBonusBand[]
  source: NationalFitnessBonusTableSource
  verificationStatus: NationalFitnessScoreVerification
}

export interface NationalFitnessBonusBinding {
  grade: Grade
  gender: Exclude<ExamGender, 'all'>
  itemId: string
  officialTableId: NationalFitnessOfficialBonusTableId
  table: NationalFitnessBonusTable
}

export interface NationalFitnessMatchedBonusRule {
  officialTableId: NationalFitnessOfficialBonusTableId
  incrementKind: NationalFitnessBonusIncrementKind
  extraValue: number
  bonusScore: number
  band: NationalFitnessBonusBand | null
  base100Threshold: number
}

export interface CalculateNationalFitnessScoreSuccess {
  ok: true
  rawValue: number
  formattedRawValue: string
  baseScore: number
  bonusScore: number
  finalItemScore: number
  matchedRule: NationalFitnessMatchedRule
  matchedBaseRule: NationalFitnessMatchedRule
  matchedBonusRule: NationalFitnessMatchedBonusRule | null
  verificationStatus: 'verified'
  tableId: string
  itemId: string
  itemName: string
  grade: Grade
  gender: Exclude<ExamGender, 'all'>
  maxBaseScore: number
}

export interface CalculateNationalFitnessScoreFailure {
  ok: false
  code: Exclude<NationalFitnessScoreErrorCode, typeof NATIONAL_FITNESS_BELOW_OFFICIAL_MINIMUM>
  message: string
  verificationStatus: NationalFitnessScoreVerification | 'unavailable'
  rawValue: number | null
}

/** 成绩差于该表已公布最低档。不是官方 0 分。 */
export interface CalculateNationalFitnessScoreBelowOfficialMinimum {
  ok: false
  code: typeof NATIONAL_FITNESS_BELOW_OFFICIAL_MINIMUM
  reason: typeof NATIONAL_FITNESS_BELOW_OFFICIAL_MINIMUM
  matched: false
  message: string
  verificationStatus: 'verified'
  rawValue: number
  formattedRawValue: string
  /** 当前年级/性别/项目官方表 entries 中实际存在的最低 score，不是全局 10。 */
  officialMinimumScore: number
  tableId: string
  itemId: string
  itemName: string
  grade: Grade
  gender: Exclude<ExamGender, 'all'>
}

export type CalculateNationalFitnessScoreResult =
  | CalculateNationalFitnessScoreSuccess
  | CalculateNationalFitnessScoreBelowOfficialMinimum
  | CalculateNationalFitnessScoreFailure

export type CalculateNationalFitnessItemScoreInput = CalculateNationalFitnessScoreInput
