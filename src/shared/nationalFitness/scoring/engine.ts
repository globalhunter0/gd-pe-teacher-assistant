import type { ExamScoreFailure } from '../../examStandard/score'
import { resolveNationalFitnessItem } from '../apply'
import { NATIONAL_FITNESS_2014_ID } from '../catalog'
import { NATIONAL_FITNESS_SCORE_TABLE_MISSING } from '../types'
import { findOfficialNationalFitnessScoreTable, listOfficialNationalFitnessScoreTables } from './officialTables'
import { findOfficialNationalFitnessBonusTable, listOfficialNationalFitnessBonusTables } from './officialBonusTables'
import { matchBonusByExtra, matchHigherBetter, matchLowerBetter, rangeContains } from './match'
import { formatNationalFitnessRawValue, parseNationalFitnessRawValue } from './time'
import {
  NATIONAL_FITNESS_BELOW_OFFICIAL_MINIMUM,
  nationalFitnessBelowOfficialMinimumMessage,
  type CalculateNationalFitnessScoreFailure,
  type CalculateNationalFitnessScoreInput,
  type CalculateNationalFitnessScoreResult,
  type NationalFitnessBonusTable,
  type NationalFitnessMatchedBonusRule,
  type NationalFitnessMatchedRule,
  type NationalFitnessScoreTable
} from './types'

function fail(
  code: CalculateNationalFitnessScoreFailure['code'],
  message: string,
  verificationStatus: CalculateNationalFitnessScoreFailure['verificationStatus'] = 'unavailable',
  rawValue: number | null = null
): CalculateNationalFitnessScoreFailure {
  return { ok: false, code, message, verificationStatus, rawValue }
}

function officialMinimumPublishedScore(table: NationalFitnessScoreTable): number {
  return Math.min(...table.thresholdEntries.map((entry) => entry.score))
}

function base100Threshold(table: NationalFitnessScoreTable): number | null {
  const band = table.thresholdEntries.find((entry) => entry.score === 100)
  return band ? band.threshold : null
}

function applyOfficialBonus(input: {
  rawValue: number
  baseTable: NationalFitnessScoreTable
  grade: NationalFitnessScoreTable['grade']
  gender: NationalFitnessScoreTable['gender']
  itemId: string
  bonusTables: readonly NationalFitnessBonusTable[]
}): { bonusScore: number; matchedBonusRule: NationalFitnessMatchedBonusRule | null } {
  const bonusTable = findOfficialNationalFitnessBonusTable({
    grade: input.grade,
    gender: input.gender,
    itemId: input.itemId,
    tables: input.bonusTables
  })
  if (!bonusTable || bonusTable.verificationStatus !== 'verified' || !bonusTable.source) {
    return { bonusScore: 0, matchedBonusRule: null }
  }
  const threshold100 = base100Threshold(input.baseTable)
  if (threshold100 == null) {
    return { bonusScore: 0, matchedBonusRule: null }
  }
  const extraValue =
    bonusTable.incrementKind === 'fasterBySeconds' ? threshold100 - input.rawValue : input.rawValue - threshold100
  const band = extraValue > 0 ? matchBonusByExtra(bonusTable.entries, extraValue) : null
  const bonusScore = Math.min(bonusTable.maxBonus, band?.bonusScore ?? 0)
  return {
    bonusScore,
    matchedBonusRule: {
      officialTableId: bonusTable.officialTableId,
      incrementKind: bonusTable.incrementKind,
      extraValue,
      bonusScore,
      band: band ?? null,
      base100Threshold: threshold100
    }
  }
}

export function calculateNationalFitnessScore(input: CalculateNationalFitnessScoreInput): CalculateNationalFitnessScoreResult {
  const itemKey = input.itemId ?? input.itemKey
  const resolved = resolveNationalFitnessItem({
    grade: input.grade,
    gender: input.gender,
    itemKey,
    testItemId: input.testItemId,
    testItemBuiltinKey: input.testItemBuiltinKey
  })
  if (!resolved.ok) {
    const code =
      resolved.code === 'GENDER_MISMATCH' || resolved.code === 'GENDER_UNSPECIFIED'
        ? resolved.code
        : resolved.code === 'GRADE_UNSUPPORTED'
          ? 'GRADE_UNSUPPORTED'
          : 'ITEM_NOT_FOUND'
    return fail(code, resolved.message)
  }

  const item = resolved.item
  let rawValue = input.rawValue
  if (input.rawInput !== undefined) {
    try {
      rawValue = parseNationalFitnessRawValue(input.rawInput, item)
    } catch (error) {
      return fail('INVALID_VALUE', error instanceof Error ? error.message : '成绩不正确')
    }
  }
  if (rawValue === undefined || !Number.isFinite(rawValue)) {
    return fail('INVALID_VALUE', '成绩不正确')
  }
  if (item.itemKey === 'bmi') {
    rawValue = Math.round(rawValue * 10) / 10
  }

  const tables = input.tables ?? listOfficialNationalFitnessScoreTables()
  const table = findOfficialNationalFitnessScoreTable({
    grade: input.grade,
    gender: input.gender,
    itemId: item.itemKey,
    standardId: NATIONAL_FITNESS_2014_ID,
    tables
  })
  if (!table) {
    return fail('NO_TABLE', NATIONAL_FITNESS_SCORE_TABLE_MISSING, 'unavailable', rawValue)
  }
  if (table.verificationStatus !== 'verified') {
    return fail('NOT_VERIFIED', NATIONAL_FITNESS_SCORE_TABLE_MISSING, table.verificationStatus, rawValue)
  }
  if (!table.source) {
    return fail('NOT_VERIFIED', '已核验评分表必须带来源说明', 'pending', rawValue)
  }

  let matched: NationalFitnessMatchedRule | null = null
  if (table.ruleKind === 'range') {
    const band = table.rangeEntries.find((entry) => rangeContains(entry, rawValue))
    if (band) {
      matched = { ruleKind: 'range', score: band.score, range: band }
    }
  } else if (table.ruleKind === 'higherBetter') {
    const band = matchHigherBetter(table.thresholdEntries, rawValue)
    if (band) {
      matched = { ruleKind: 'higherBetter', score: band.score, threshold: band }
    }
  } else {
    const band = matchLowerBetter(table.thresholdEntries, rawValue)
    if (band) {
      matched = { ruleKind: 'lowerBetter', score: band.score, threshold: band }
    }
  }

  if (!matched) {
    if (table.ruleKind === 'range') {
      return fail('NO_MATCH', '成绩未落入官方 BMI 区间', table.verificationStatus, rawValue)
    }
    const officialMinimumScore = officialMinimumPublishedScore(table)
    return {
      ok: false,
      code: NATIONAL_FITNESS_BELOW_OFFICIAL_MINIMUM,
      reason: NATIONAL_FITNESS_BELOW_OFFICIAL_MINIMUM,
      matched: false,
      message: nationalFitnessBelowOfficialMinimumMessage(officialMinimumScore),
      verificationStatus: 'verified',
      rawValue,
      formattedRawValue: formatNationalFitnessRawValue(rawValue, item),
      officialMinimumScore,
      tableId: table.id,
      itemId: item.itemKey,
      itemName: item.name,
      grade: input.grade,
      gender: input.gender === 'unspecified' ? 'male' : input.gender
    }
  }

  const baseScore = Math.min(table.maxBaseScore, matched.score)
  const bonusTables = input.bonusTables ?? listOfficialNationalFitnessBonusTables()
  const applied = applyOfficialBonus({
    rawValue,
    baseTable: table,
    grade: table.grade,
    gender: table.gender,
    itemId: item.itemKey,
    bonusTables
  })
  const bonusScore = applied.bonusScore
  return {
    ok: true,
    rawValue,
    formattedRawValue: formatNationalFitnessRawValue(rawValue, item),
    baseScore,
    bonusScore,
    finalItemScore: baseScore + bonusScore,
    matchedRule: matched,
    matchedBaseRule: matched,
    matchedBonusRule: applied.matchedBonusRule,
    verificationStatus: 'verified',
    tableId: table.id,
    itemId: item.itemKey,
    itemName: item.name,
    grade: input.grade,
    gender: input.gender === 'unspecified' ? 'male' : input.gender,
    maxBaseScore: table.maxBaseScore
  }
}

/** Phase B 兼容入口：生产官方表为空时继续 fail-closed，不返回 0 分。 */
export function calculateNationalFitnessItemScore(input: {
  grade: CalculateNationalFitnessScoreInput['grade']
  gender: CalculateNationalFitnessScoreInput['gender']
  itemKey?: string
  testItemId?: string | null
  testItemBuiltinKey?: string | null
  rawValue?: number
}): ExamScoreFailure {
  const result = calculateNationalFitnessScore(input)
  if (result.ok) {
    return { ok: false, code: 'NO_TABLE', message: NATIONAL_FITNESS_SCORE_TABLE_MISSING }
  }
  const code =
    result.code === 'NOT_VERIFIED' ||
    result.code === 'NO_TABLE' ||
    result.code === 'NO_MATCH' ||
    result.code === 'BELOW_OFFICIAL_MINIMUM'
      ? 'NO_TABLE'
      : result.code === 'INVALID_VALUE'
        ? 'INVALID_VALUE'
        : result.code === 'GENDER_MISMATCH' || result.code === 'GENDER_UNSPECIFIED'
          ? 'GENDER_MISMATCH'
          : 'ITEM_NOT_FOUND'
  return { ok: false, code, message: result.message }
}
