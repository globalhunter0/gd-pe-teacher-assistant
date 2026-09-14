import { NATIONAL_FITNESS_2014_ID } from '../catalog'
import type { NationalFitnessScoreTable } from './types'

import { K12_NATIONAL_FITNESS_BASE_TABLES } from './k12BaseTables'

/**
 * 生产环境官方基础单项评分表。
 * 仅含《国家学生体质健康标准（2014年修订）》表1-1～表1-16 的 K-12 列，不含附加分。
 */
export const OFFICIAL_NATIONAL_FITNESS_SCORE_TABLES: readonly NationalFitnessScoreTable[] = K12_NATIONAL_FITNESS_BASE_TABLES

export function listOfficialNationalFitnessScoreTables(): readonly NationalFitnessScoreTable[] {
  return OFFICIAL_NATIONAL_FITNESS_SCORE_TABLES
}

export function findOfficialNationalFitnessScoreTable(query: {
  grade: string
  gender: string
  itemId: string
  standardId?: string
  tables?: readonly NationalFitnessScoreTable[]
}): NationalFitnessScoreTable | undefined {
  const standardId = query.standardId ?? NATIONAL_FITNESS_2014_ID
  const tables = query.tables ?? OFFICIAL_NATIONAL_FITNESS_SCORE_TABLES
  return tables.find(
    (table) =>
      table.standardId === standardId &&
      table.grade === query.grade &&
      table.gender === query.gender &&
      table.itemId === query.itemId
  )
}
