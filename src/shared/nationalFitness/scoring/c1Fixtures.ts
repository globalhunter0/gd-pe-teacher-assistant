import { NATIONAL_FITNESS_2014_ID } from '../catalog'
import type { NationalFitnessScoreTable } from './types'

const C1_FIXTURE_SOURCE = {
  standardName: '国家学生体质健康标准（2014年修订）',
  version: '2014年修订',
  authority: '教育部',
  sourceDocument: 'Phase C1 引擎自检夹具，不是官方评分表，禁止写入生产仓库',
  documentNo: 'C1-FIXTURE',
  tableNo: '表C1-fixture',
  tableName: 'Phase C1 引擎自检夹具'
} as const

function base(
  rest: Omit<NationalFitnessScoreTable, 'standardId' | 'source' | 'bonusCategory' | 'minBaseScore' | 'maxBaseScore'> & {
    verificationStatus: NationalFitnessScoreTable['verificationStatus']
    source?: NationalFitnessScoreTable['source']
  }
): NationalFitnessScoreTable {
  return {
    standardId: NATIONAL_FITNESS_2014_ID,
    bonusCategory: null,
    minBaseScore: 60,
    maxBaseScore: 100,
    ...rest,
    source: rest.source === undefined
      ? { ...C1_FIXTURE_SOURCE, itemId: rest.itemId, grade: rest.grade, gender: rest.gender }
      : rest.source
  }
}

/** 仅供 Phase C1 自检。不得并入 OFFICIAL_NATIONAL_FITNESS_SCORE_TABLES。 */
export const C1_ENGINE_FIXTURE_TABLES: NationalFitnessScoreTable[] = [
  base({
    id: 'c1-fixture-bmi-g7-male',
    grade: '初一',
    gender: 'male',
    itemId: 'bmi',
    unit: 'other',
    unitLabel: 'kg/m²',
    valueKind: 'number',
    ruleKind: 'range',
    rangeEntries: [
      { min: null, max: 18, minInclusive: true, maxInclusive: false, score: 80 },
      { min: 18, max: 24, minInclusive: true, maxInclusive: true, score: 100 },
      { min: 24, max: 28, minInclusive: false, maxInclusive: true, score: 80 },
      { min: 28, max: null, minInclusive: false, maxInclusive: true, score: 60 }
    ],
    thresholdEntries: [],
    verificationStatus: 'verified'
  }),
  base({
    id: 'c1-fixture-sit-g7-female',
    grade: '初一',
    gender: 'female',
    itemId: 'sit-and-reach',
    unit: 'cm',
    unitLabel: 'cm',
    valueKind: 'number',
    ruleKind: 'higherBetter',
    rangeEntries: [],
    thresholdEntries: [
      { threshold: -6, inclusive: true, score: 60 },
      { threshold: 0, inclusive: true, score: 80 },
      { threshold: 11, inclusive: true, score: 100 }
    ],
    verificationStatus: 'verified'
  }),
  base({
    id: 'c1-fixture-50m-g7-male',
    grade: '初一',
    gender: 'male',
    itemId: '50m',
    unit: 's',
    unitLabel: '秒',
    valueKind: 'time',
    ruleKind: 'lowerBetter',
    rangeEntries: [],
    thresholdEntries: [
      { threshold: 8, inclusive: true, score: 100 },
      { threshold: 9, inclusive: true, score: 80 },
      { threshold: 11, inclusive: true, score: 60 }
    ],
    verificationStatus: 'verified'
  }),
  base({
    id: 'c1-fixture-1000-g7-male',
    grade: '初一',
    gender: 'male',
    itemId: 'run-1000m',
    unit: 's',
    unitLabel: '秒',
    valueKind: 'time',
    ruleKind: 'lowerBetter',
    rangeEntries: [],
    thresholdEntries: [
      { threshold: 220, inclusive: true, score: 100 },
      { threshold: 225, inclusive: true, score: 80 },
      { threshold: 240, inclusive: true, score: 60 }
    ],
    verificationStatus: 'verified'
  }),
  base({
    id: 'c1-fixture-50m-g7-male-pending',
    grade: '初二',
    gender: 'male',
    itemId: '50m',
    unit: 's',
    unitLabel: '秒',
    valueKind: 'time',
    ruleKind: 'lowerBetter',
    rangeEntries: [],
    thresholdEntries: [
      { threshold: 8, inclusive: true, score: 100 },
      { threshold: 9, inclusive: true, score: 80 }
    ],
    verificationStatus: 'pending'
  })
]
