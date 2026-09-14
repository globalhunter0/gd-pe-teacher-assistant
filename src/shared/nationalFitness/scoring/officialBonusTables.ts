import { JUNIOR_GRADES, PRIMARY_GRADES, SENIOR_GRADES, type Grade } from '../../class/types'
import { NATIONAL_FITNESS_2014_ID } from '../catalog'
import type {
  NationalFitnessBonusBand,
  NationalFitnessBonusBinding,
  NationalFitnessBonusTable,
  NationalFitnessBonusTableSource,
  NationalFitnessOfficialBonusTableId
} from './types'

const SECONDARY_GRADES: Grade[] = [...JUNIOR_GRADES, ...SENIOR_GRADES]

const SOURCE_CORE = {
  standardName: '国家学生体质健康标准（2014年修订）',
  version: '2014年修订',
  authority: '教育部',
  sourceDocument: '教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）',
  documentNo: '教体艺〔2014〕5号',
  publishedAt: '2014-07-07'
} as const

function source(
  officialTableId: NationalFitnessOfficialBonusTableId,
  tableNo: string,
  tableName: string
): NationalFitnessBonusTableSource {
  return { ...SOURCE_CORE, officialTableId, tableNo, tableName }
}

/** 表2-1、表2-2 官方增量（超过基础100分的次数）。两表规则经人工核验相同，不是互推。 */
const SKIP_BONUS_ENTRIES: NationalFitnessBonusBand[] = [
  { extra: 2, bonusScore: 1 },
  { extra: 4, bonusScore: 2 },
  { extra: 6, bonusScore: 3 },
  { extra: 8, bonusScore: 4 },
  { extra: 10, bonusScore: 5 },
  { extra: 12, bonusScore: 6 },
  { extra: 14, bonusScore: 7 },
  { extra: 16, bonusScore: 8 },
  { extra: 18, bonusScore: 9 },
  { extra: 20, bonusScore: 10 },
  { extra: 22, bonusScore: 11 },
  { extra: 24, bonusScore: 12 },
  { extra: 26, bonusScore: 13 },
  { extra: 28, bonusScore: 14 },
  { extra: 30, bonusScore: 15 },
  { extra: 32, bonusScore: 16 },
  { extra: 34, bonusScore: 17 },
  { extra: 36, bonusScore: 18 },
  { extra: 38, bonusScore: 19 },
  { extra: 40, bonusScore: 20 }
]

const PULL_UP_BONUS_ENTRIES: NationalFitnessBonusBand[] = [
  { extra: 1, bonusScore: 1 },
  { extra: 2, bonusScore: 2 },
  { extra: 3, bonusScore: 3 },
  { extra: 4, bonusScore: 4 },
  { extra: 5, bonusScore: 5 },
  { extra: 6, bonusScore: 6 },
  { extra: 7, bonusScore: 7 },
  { extra: 8, bonusScore: 8 },
  { extra: 9, bonusScore: 9 },
  { extra: 10, bonusScore: 10 }
]

const SIT_UP_BONUS_ENTRIES: NationalFitnessBonusBand[] = [
  { extra: 2, bonusScore: 1 },
  { extra: 4, bonusScore: 2 },
  { extra: 6, bonusScore: 3 },
  { extra: 7, bonusScore: 4 },
  { extra: 8, bonusScore: 5 },
  { extra: 9, bonusScore: 6 },
  { extra: 10, bonusScore: 7 },
  { extra: 11, bonusScore: 8 },
  { extra: 12, bonusScore: 9 },
  { extra: 13, bonusScore: 10 }
]

const RUN_1000_BONUS_ENTRIES: NationalFitnessBonusBand[] = [
  { extra: 4, bonusScore: 1 },
  { extra: 8, bonusScore: 2 },
  { extra: 12, bonusScore: 3 },
  { extra: 16, bonusScore: 4 },
  { extra: 20, bonusScore: 5 },
  { extra: 23, bonusScore: 6 },
  { extra: 26, bonusScore: 7 },
  { extra: 29, bonusScore: 8 },
  { extra: 32, bonusScore: 9 },
  { extra: 35, bonusScore: 10 }
]

const RUN_800_BONUS_ENTRIES: NationalFitnessBonusBand[] = [
  { extra: 5, bonusScore: 1 },
  { extra: 10, bonusScore: 2 },
  { extra: 15, bonusScore: 3 },
  { extra: 20, bonusScore: 4 },
  { extra: 25, bonusScore: 5 },
  { extra: 30, bonusScore: 6 },
  { extra: 35, bonusScore: 7 },
  { extra: 40, bonusScore: 8 },
  { extra: 45, bonusScore: 9 },
  { extra: 50, bonusScore: 10 }
]

/**
 * 官方附加分评分表共 6 张（表2-1～表2-6）。
 * 不含基础100分阈值；阈值只从 C2 基础评分表读取。
 */
export const OFFICIAL_NATIONAL_FITNESS_BONUS_TABLES: readonly NationalFitnessBonusTable[] = [
  {
    id: 'nf2014-bonus-2-1',
    officialTableId: '2-1',
    standardId: NATIONAL_FITNESS_2014_ID,
    itemId: 'skip-1min',
    gender: 'male',
    grades: [...PRIMARY_GRADES],
    incrementKind: 'extraCount',
    extraUnitLabel: '次',
    maxBonus: 20,
    entries: SKIP_BONUS_ENTRIES,
    source: source('2-1', '表2-1', '男生1分钟跳绳评分表'),
    verificationStatus: 'verified'
  },
  {
    id: 'nf2014-bonus-2-2',
    officialTableId: '2-2',
    standardId: NATIONAL_FITNESS_2014_ID,
    itemId: 'skip-1min',
    gender: 'female',
    grades: [...PRIMARY_GRADES],
    incrementKind: 'extraCount',
    extraUnitLabel: '次',
    maxBonus: 20,
    entries: SKIP_BONUS_ENTRIES,
    source: source('2-2', '表2-2', '女生1分钟跳绳评分表'),
    verificationStatus: 'verified'
  },
  {
    id: 'nf2014-bonus-2-3',
    officialTableId: '2-3',
    standardId: NATIONAL_FITNESS_2014_ID,
    itemId: 'pull-up',
    gender: 'male',
    grades: [...SECONDARY_GRADES],
    incrementKind: 'extraCount',
    extraUnitLabel: '次',
    maxBonus: 10,
    entries: PULL_UP_BONUS_ENTRIES,
    source: source('2-3', '表2-3', '男生引体向上评分表'),
    verificationStatus: 'verified'
  },
  {
    id: 'nf2014-bonus-2-4',
    officialTableId: '2-4',
    standardId: NATIONAL_FITNESS_2014_ID,
    itemId: 'sit-up-1min',
    gender: 'female',
    grades: [...SECONDARY_GRADES],
    incrementKind: 'extraCount',
    extraUnitLabel: '次',
    maxBonus: 10,
    entries: SIT_UP_BONUS_ENTRIES,
    source: source('2-4', '表2-4', '女生1分钟仰卧起坐评分表'),
    verificationStatus: 'verified'
  },
  {
    id: 'nf2014-bonus-2-5',
    officialTableId: '2-5',
    standardId: NATIONAL_FITNESS_2014_ID,
    itemId: 'run-1000m',
    gender: 'male',
    grades: [...SECONDARY_GRADES],
    incrementKind: 'fasterBySeconds',
    extraUnitLabel: '秒',
    maxBonus: 10,
    entries: RUN_1000_BONUS_ENTRIES,
    source: source('2-5', '表2-5', '男生1000米跑评分表'),
    verificationStatus: 'verified'
  },
  {
    id: 'nf2014-bonus-2-6',
    officialTableId: '2-6',
    standardId: NATIONAL_FITNESS_2014_ID,
    itemId: 'run-800m',
    gender: 'female',
    grades: [...SECONDARY_GRADES],
    incrementKind: 'fasterBySeconds',
    extraUnitLabel: '秒',
    maxBonus: 10,
    entries: RUN_800_BONUS_ENTRIES,
    source: source('2-6', '表2-6', '女生800米跑评分表'),
    verificationStatus: 'verified'
  }
]

export function listOfficialNationalFitnessBonusTables(): readonly NationalFitnessBonusTable[] {
  return OFFICIAL_NATIONAL_FITNESS_BONUS_TABLES
}

export function findOfficialNationalFitnessBonusTable(query: {
  grade: string
  gender: string
  itemId: string
  tables?: readonly NationalFitnessBonusTable[]
}): NationalFitnessBonusTable | undefined {
  const tables = query.tables ?? OFFICIAL_NATIONAL_FITNESS_BONUS_TABLES
  return tables.find(
    (table) =>
      table.gender === query.gender &&
      table.itemId === query.itemId &&
      table.grades.includes(query.grade as Grade) &&
      table.verificationStatus === 'verified'
  )
}

/** 由 6 张官方表展开的年级/性别/项目组合，不是 36 张独立官方表。 */
export function listOfficialNationalFitnessBonusBindings(
  tables: readonly NationalFitnessBonusTable[] = OFFICIAL_NATIONAL_FITNESS_BONUS_TABLES
): NationalFitnessBonusBinding[] {
  const bindings: NationalFitnessBonusBinding[] = []
  for (const table of tables) {
    for (const grade of table.grades) {
      bindings.push({
        grade,
        gender: table.gender,
        itemId: table.itemId,
        officialTableId: table.officialTableId,
        table
      })
    }
  }
  return bindings
}
