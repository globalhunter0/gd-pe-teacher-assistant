import { JUNIOR_GRADES, PRIMARY_GRADES, SENIOR_GRADES, type Grade } from '../class/types'
import type { ExamGender } from '../examStandard/types'
import type { NationalFitnessBonusCategory } from './types'

const P12: Grade[] = ['一年级', '二年级']
const P34: Grade[] = ['三年级', '四年级']
const P56: Grade[] = ['五年级', '六年级']
const SECONDARY: Grade[] = [...JUNIOR_GRADES, ...SENIOR_GRADES]

export interface NationalFitnessCoverageRow {
  grades: Grade[]
  gender: ExamGender
  itemKey: string
  weightPercent: number
  supportsBonus: boolean
  bonusCategory: NationalFitnessBonusCategory | null
}

export const NATIONAL_FITNESS_COVERAGE: NationalFitnessCoverageRow[] = [
  { grades: [...PRIMARY_GRADES, ...SECONDARY], gender: 'all', itemKey: 'height', weightPercent: 0, supportsBonus: false, bonusCategory: null },
  { grades: [...PRIMARY_GRADES, ...SECONDARY], gender: 'all', itemKey: 'weight', weightPercent: 0, supportsBonus: false, bonusCategory: null },
  { grades: P12, gender: 'all', itemKey: 'bmi', weightPercent: 15, supportsBonus: false, bonusCategory: null },
  { grades: P12, gender: 'all', itemKey: 'vital-capacity', weightPercent: 15, supportsBonus: false, bonusCategory: null },
  { grades: P12, gender: 'all', itemKey: '50m', weightPercent: 20, supportsBonus: false, bonusCategory: null },
  { grades: P12, gender: 'all', itemKey: 'sit-and-reach', weightPercent: 30, supportsBonus: false, bonusCategory: null },
  { grades: P12, gender: 'all', itemKey: 'skip-1min', weightPercent: 20, supportsBonus: true, bonusCategory: 'rope-skip' },

  { grades: P34, gender: 'all', itemKey: 'bmi', weightPercent: 15, supportsBonus: false, bonusCategory: null },
  { grades: P34, gender: 'all', itemKey: 'vital-capacity', weightPercent: 15, supportsBonus: false, bonusCategory: null },
  { grades: P34, gender: 'all', itemKey: '50m', weightPercent: 20, supportsBonus: false, bonusCategory: null },
  { grades: P34, gender: 'all', itemKey: 'sit-and-reach', weightPercent: 20, supportsBonus: false, bonusCategory: null },
  { grades: P34, gender: 'all', itemKey: 'skip-1min', weightPercent: 20, supportsBonus: true, bonusCategory: 'rope-skip' },
  { grades: P34, gender: 'all', itemKey: 'sit-up-1min', weightPercent: 10, supportsBonus: false, bonusCategory: null },

  { grades: P56, gender: 'all', itemKey: 'bmi', weightPercent: 15, supportsBonus: false, bonusCategory: null },
  { grades: P56, gender: 'all', itemKey: 'vital-capacity', weightPercent: 15, supportsBonus: false, bonusCategory: null },
  { grades: P56, gender: 'all', itemKey: '50m', weightPercent: 20, supportsBonus: false, bonusCategory: null },
  { grades: P56, gender: 'all', itemKey: 'sit-and-reach', weightPercent: 10, supportsBonus: false, bonusCategory: null },
  { grades: P56, gender: 'all', itemKey: 'skip-1min', weightPercent: 10, supportsBonus: true, bonusCategory: 'rope-skip' },
  { grades: P56, gender: 'all', itemKey: 'sit-up-1min', weightPercent: 20, supportsBonus: false, bonusCategory: null },
  { grades: P56, gender: 'all', itemKey: 'shuttle-50m-8', weightPercent: 10, supportsBonus: false, bonusCategory: null },

  { grades: SECONDARY, gender: 'all', itemKey: 'bmi', weightPercent: 15, supportsBonus: false, bonusCategory: null },
  { grades: SECONDARY, gender: 'all', itemKey: 'vital-capacity', weightPercent: 15, supportsBonus: false, bonusCategory: null },
  { grades: SECONDARY, gender: 'all', itemKey: '50m', weightPercent: 20, supportsBonus: false, bonusCategory: null },
  { grades: SECONDARY, gender: 'all', itemKey: 'sit-and-reach', weightPercent: 10, supportsBonus: false, bonusCategory: null },
  { grades: SECONDARY, gender: 'all', itemKey: 'standing-long-jump', weightPercent: 10, supportsBonus: false, bonusCategory: null },
  { grades: SECONDARY, gender: 'male', itemKey: 'pull-up', weightPercent: 10, supportsBonus: true, bonusCategory: 'strength' },
  { grades: SECONDARY, gender: 'female', itemKey: 'sit-up-1min', weightPercent: 10, supportsBonus: true, bonusCategory: 'strength' },
  { grades: SECONDARY, gender: 'male', itemKey: 'run-1000m', weightPercent: 20, supportsBonus: true, bonusCategory: 'endurance' },
  { grades: SECONDARY, gender: 'female', itemKey: 'run-800m', weightPercent: 20, supportsBonus: true, bonusCategory: 'endurance' }
]

export function coverageRowsFor(grade: Grade): NationalFitnessCoverageRow[] {
  return NATIONAL_FITNESS_COVERAGE.filter((row) => row.grades.includes(grade))
}
