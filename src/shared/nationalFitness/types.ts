import type { Grade, SchoolStage } from '../class/types'
import type { ExamGender } from '../examStandard/types'
import type { TestDirection, TestUnit, TestValueType, TimeInputMode } from '../peTest/types'

export const NATIONAL_STUDENT_FITNESS_FAMILY = 'national_student_fitness' as const

export type NationalStudentFitnessFamily = typeof NATIONAL_STUDENT_FITNESS_FAMILY

export const NATIONAL_FITNESS_FAMILY_LABEL = '国家学生体质健康标准'

export type NationalFitnessCatalogStatus = 'not_catalogued'

export type NationalFitnessTableStatus = 'missing' | 'pending-verification'

export type NationalFitnessStage = SchoolStage

export type NationalFitnessDirection = TestDirection | 'derived'

export type NationalFitnessItemRole = 'bmi-source' | 'derived-evaluation' | 'measured'

export type NationalFitnessBonusCategory = 'rope-skip' | 'strength' | 'endurance'

export interface NationalFitnessItemDefinition {
  itemKey: string
  name: string
  grades: Grade[]
  gender: ExamGender
  genderExclusive: boolean
  role: NationalFitnessItemRole
  isDerived: boolean
  derivedFromBuiltinKeys: readonly string[] | null
  unit: TestUnit
  unitLabel: string
  direction: NationalFitnessDirection
  valueType: TestValueType
  timeInputMode: TimeInputMode
  testItemBuiltinKey: string | null
  testItemId: string | null
  bonusApplicable: boolean
  bonusCategory: NationalFitnessBonusCategory | null
  bonusMax: null
  participatesInComposite: boolean
  weightPercent: number | null
  scoreTable: null
  bonusTable: null
  weight: null
  notes: string
}

export type NationalFitnessPlannedItem = NationalFitnessItemDefinition

export const NATIONAL_FITNESS_SCORE_MODEL = {
  standardScoreFullMark: 100,
  additionalScoreFullMark: 20,
  yearTotalFullMark: 120
} as const

export interface NationalFitnessStandardMetadata {
  id: string
  family: NationalStudentFitnessFamily
  standardName: string
  version: string
  authority: string
  sourceDocument: string
  sourceUrl: string | null
  publishedAt: string | null
  effectiveFrom: string | null
  effectiveTo: string | null
  status: NationalFitnessCatalogStatus
  scoreTableStatus: 'missing'
  stages: NationalFitnessStage[]
  intendedGrades: Grade[]
  intendedGenders: Array<Exclude<ExamGender, 'all'>>
  intendedItems: NationalFitnessItemDefinition[]
  scoreTables: readonly never[]
  bonusTables: readonly never[]
  weights: readonly never[]
  notes: string
}

export const NATIONAL_FITNESS_SCORE_TABLE_MISSING = '评分表待权威数据核验'
