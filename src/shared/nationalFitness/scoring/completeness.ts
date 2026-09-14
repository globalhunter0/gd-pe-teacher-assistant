import { GRADES, type Grade } from '../../class/types'
import type { ExamGender } from '../../examStandard/types'
import { listNationalFitnessEvaluationItems } from '../apply'
import { NATIONAL_FITNESS_ITEM_SPECS } from '../items'
import { stageForGrade } from '../grades'
import { listOfficialNationalFitnessScoreTables } from './officialTables'
import type { NationalFitnessScoreTable } from './types'

export type NationalFitnessAutoScoringStatus = 'available' | 'unavailable'

export type NationalFitnessCompletenessStatus = 'verified' | 'pending' | 'missing' | 'na'

export interface NationalFitnessCompletenessCell {
  grade: Grade
  gender: Exclude<ExamGender, 'all'>
  itemId: string
  catalog: boolean
  scoreTable: boolean
  verified: boolean
  autoScoring: NationalFitnessAutoScoringStatus
  tableId: string | null
  verificationStatus: NationalFitnessCompletenessStatus
}

const EVAL_ITEM_KEYS = NATIONAL_FITNESS_ITEM_SPECS.filter((item) => item.role !== 'bmi-source').map((item) => item.itemKey)

export function buildNationalFitnessCompletenessMatrix(
  tables: readonly NationalFitnessScoreTable[] = listOfficialNationalFitnessScoreTables()
): NationalFitnessCompletenessCell[] {
  const cells: NationalFitnessCompletenessCell[] = []
  for (const grade of GRADES) {
    for (const gender of ['male', 'female'] as const) {
      const catalogKeys = new Set(listNationalFitnessEvaluationItems(grade, gender).map((item) => item.itemKey))
      for (const itemId of EVAL_ITEM_KEYS) {
        const catalog = catalogKeys.has(itemId)
        const table = tables.find((entry) => entry.grade === grade && entry.gender === gender && entry.itemId === itemId)
        if (!catalog) {
          cells.push({
            grade,
            gender,
            itemId,
            catalog: false,
            scoreTable: false,
            verified: false,
            autoScoring: 'unavailable',
            tableId: null,
            verificationStatus: 'na'
          })
          continue
        }
        const verified = table?.verificationStatus === 'verified' && table.source !== null
        cells.push({
          grade,
          gender,
          itemId,
          catalog: true,
          scoreTable: Boolean(table),
          verified,
          autoScoring: verified ? 'available' : 'unavailable',
          tableId: table?.id ?? null,
          verificationStatus: table ? table.verificationStatus : 'missing'
        })
      }
    }
  }
  return cells
}

export function listPendingNationalFitnessTables(cells = buildNationalFitnessCompletenessMatrix()): NationalFitnessCompletenessCell[] {
  return cells.filter((cell) => cell.catalog && !cell.verified)
}

export function summarizeNationalFitnessCompleteness(cells = buildNationalFitnessCompletenessMatrix()): {
  total: number
  expected: number
  catalog: number
  scoreTable: number
  verified: number
  pending: number
  na: number
  autoScoring: number
  byStage: Record<string, { total: number; expected: number; verified: number; autoScoring: number; pending: number; na: number }>
} {
  const byStage: Record<string, { total: number; expected: number; verified: number; autoScoring: number; pending: number; na: number }> = {
    primary: { total: 0, expected: 0, verified: 0, autoScoring: 0, pending: 0, na: 0 },
    junior: { total: 0, expected: 0, verified: 0, autoScoring: 0, pending: 0, na: 0 },
    senior: { total: 0, expected: 0, verified: 0, autoScoring: 0, pending: 0, na: 0 }
  }
  for (const cell of cells) {
    const stage = stageForGrade(cell.grade)
    byStage[stage].total += 1
    if (cell.catalog) {
      byStage[stage].expected += 1
    }
    if (cell.verified) {
      byStage[stage].verified += 1
    }
    if (cell.autoScoring === 'available') {
      byStage[stage].autoScoring += 1
    }
    if (cell.verificationStatus === 'na') {
      byStage[stage].na += 1
    }
    if (cell.catalog && !cell.verified) {
      byStage[stage].pending += 1
    }
  }
  return {
    total: cells.length,
    expected: cells.filter((cell) => cell.catalog).length,
    catalog: cells.filter((cell) => cell.catalog).length,
    scoreTable: cells.filter((cell) => cell.scoreTable).length,
    verified: cells.filter((cell) => cell.verified).length,
    pending: cells.filter((cell) => cell.catalog && !cell.verified).length,
    na: cells.filter((cell) => cell.verificationStatus === 'na').length,
    autoScoring: cells.filter((cell) => cell.autoScoring === 'available').length,
    byStage
  }
}
