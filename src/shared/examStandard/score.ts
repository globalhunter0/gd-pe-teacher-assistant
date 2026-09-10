import { formatRawValue, parseScoreInput, usesMinuteFormat } from '../peTest/scoreFormat'
import type { ExamGender, ExamItemDefinition, ExamStandard, ExamStandardStatus } from './types'

export const OFFICIAL_SCORE_UNAVAILABLE = '当前没有可用于正式换算的已核验评分标准。'
export const OFFICIAL_SCORE_UNSUPPORTED = '官方标准已核验，当前版本暂不支持自动换算。'
export const OFFICIAL_SCORE_PARTIAL = '该城市/版本评分表尚未完整核验，暂不支持完整自动换算。'
export const OFFICIAL_SCORE_SCHEME_ONLY = '考试方案已核验，但年度评分表尚未完整核验，暂不支持完整自动换算。'

export function standardAllowsOfficialConvert(standard: ExamStandard): boolean {
  return standard.status === 'verified' && standard.scoreTableStatus === 'verified'
}

export type ExamScoreErrorCode =
  | 'NOT_VERIFIED'
  | 'DEPRECATED_DEFAULT'
  | 'NO_TABLE'
  | 'UNSUPPORTED_MODEL'
  | 'ITEM_NOT_FOUND'
  | 'GENDER_MISMATCH'
  | 'INVALID_VALUE'

export interface CalculateExamScoreInput {
  standard: ExamStandard
  itemId: string
  rawValue: number
  gender: Exclude<ExamGender, 'all'>
  officialOnly?: boolean
}

export interface ExamScoreSuccess {
  ok: true
  score: number
  maxScore: number
  minScore: number
  rawValue: number
  formattedRawValue: string
  matchedThreshold: number | null
  standardId: string
  standardTitle: string
  policyLabel: string
  status: ExamStandardStatus
  sourceTitle: string
  sourceUrl: string | null
  itemId: string
  itemName: string
}

export interface ExamScoreFailure {
  ok: false
  code: ExamScoreErrorCode
  message: string
}

export type CalculateExamScoreResult = ExamScoreSuccess | ExamScoreFailure

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function truncateDownDigits(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.floor(value * factor + 1e-8) / factor
}

function interpolatedScore(value: number, item: ExamItemDefinition): number {
  const digits = item.scoreRule.kind === 'thresholdTable' ? (item.scoreRule.scorePrecision ?? 2) : 2
  return truncateDownDigits(value, digits)
}

function sameNumber(left: number, right: number): boolean {
  return Math.abs(left - right) < 1e-9
}

export function itemAppliesToGender(item: ExamItemDefinition, gender: Exclude<ExamGender, 'all'>): boolean {
  return item.gender === 'all' || item.gender === gender
}

function capScore(score: number, item: ExamItemDefinition): number {
  return clamp(score, item.scoreRule.minScore, Math.min(item.scoreRule.maxScore, item.maxScore))
}

export function itemSupportsAutoScore(item: ExamItemDefinition): boolean {
  return (
    item.verification === 'verified_supported' &&
    item.scoreRule.kind === 'thresholdTable' &&
    item.scoreRule.entries.length > 0
  )
}

function scoreFromStepTable(rawValue: number, item: ExamItemDefinition): { score: number; matchedThreshold: number | null } {
  if (item.scoreRule.kind !== 'thresholdTable') {
    return { score: item.scoreRule.minScore, matchedThreshold: null }
  }
  const entries = [...item.scoreRule.entries].sort((a, b) => b.score - a.score || a.threshold - b.threshold)
  for (const entry of entries) {
    const matched =
      item.direction === 'higherBetter' ? rawValue >= entry.threshold : rawValue <= entry.threshold
    if (matched) {
      return { score: capScore(entry.score, item), matchedThreshold: entry.threshold }
    }
  }

  return { score: item.scoreRule.minScore, matchedThreshold: null }
}

function scoreFromLinearTable(rawValue: number, item: ExamItemDefinition): { score: number; matchedThreshold: number | null } {
  if (item.scoreRule.kind !== 'thresholdTable') {
    return { score: item.scoreRule.minScore, matchedThreshold: null }
  }
  const entries = [...item.scoreRule.entries].sort((a, b) => a.score - b.score)
  if (entries.length === 0) {
    return { score: item.scoreRule.minScore, matchedThreshold: null }
  }

  const exact = entries.find((entry) => sameNumber(entry.threshold, rawValue))
  if (exact) {
    return { score: capScore(exact.score, item), matchedThreshold: exact.threshold }
  }

  const worst = entries[0]
  const best = entries[entries.length - 1]

  if (item.direction === 'lowerBetter') {
    if (rawValue <= best.threshold) {
      return { score: capScore(best.score, item), matchedThreshold: best.threshold }
    }
    if (rawValue > worst.threshold) {
      return { score: item.scoreRule.minScore, matchedThreshold: null }
    }

    for (let index = 0; index < entries.length - 1; index += 1) {
      const lower = entries[index]
      const higher = entries[index + 1]
      if (rawValue < lower.threshold && rawValue > higher.threshold) {
        const interpolated =
          lower.score + ((higher.score - lower.score) * (lower.threshold - rawValue)) / (lower.threshold - higher.threshold)
        return { score: capScore(interpolatedScore(interpolated, item), item), matchedThreshold: null }
      }
    }
  } else {
    if (rawValue >= best.threshold) {
      return { score: capScore(best.score, item), matchedThreshold: best.threshold }
    }
    if (rawValue < worst.threshold) {
      return { score: item.scoreRule.minScore, matchedThreshold: null }
    }

    for (let index = 0; index < entries.length - 1; index += 1) {
      const lower = entries[index]
      const higher = entries[index + 1]
      if (rawValue > lower.threshold && rawValue < higher.threshold) {
        const interpolated =
          lower.score + ((higher.score - lower.score) * (rawValue - lower.threshold)) / (higher.threshold - lower.threshold)
        return { score: capScore(interpolatedScore(interpolated, item), item), matchedThreshold: null }
      }
    }
  }

  return { score: item.scoreRule.minScore, matchedThreshold: null }
}

export function scoreFromThresholdTable(rawValue: number, item: ExamItemDefinition): { score: number; matchedThreshold: number | null } {
  if (item.scoreRule.kind !== 'thresholdTable') {
    return { score: item.scoreRule.minScore, matchedThreshold: null }
  }
  if (item.scoreRule.scoreMode === 'linear') {
    return scoreFromLinearTable(rawValue, item)
  }
  return scoreFromStepTable(rawValue, item)
}

export function parseExamPerformanceInput(text: string, item: ExamItemDefinition): number {
  return parseScoreInput(text, item.valueType, item.timeInputMode)
}

export function formatExamRawValue(rawValue: number, item: ExamItemDefinition): string {
  return formatRawValue(
    rawValue,
    item.valueType,
    item.decimalPlaces,
    usesMinuteFormat(item.timeInputMode, item.valueType)
  )
}

export function calculateExamScore(input: CalculateExamScoreInput): CalculateExamScoreResult {
  const officialOnly = input.officialOnly !== false
  if (officialOnly && (input.standard.status === 'partial' || input.standard.scoreTableStatus !== 'verified')) {
    const message =
      input.standard.ruleStatus === 'verified' ? OFFICIAL_SCORE_SCHEME_ONLY : OFFICIAL_SCORE_PARTIAL
    return { ok: false, code: 'NOT_VERIFIED', message }
  }
  if (officialOnly && input.standard.status !== 'verified') {
    return { ok: false, code: 'NOT_VERIFIED', message: OFFICIAL_SCORE_UNAVAILABLE }
  }
  if (officialOnly && input.standard.status === 'deprecated') {
    return { ok: false, code: 'DEPRECATED_DEFAULT', message: OFFICIAL_SCORE_UNAVAILABLE }
  }

  const item = input.standard.items.find((entry) => entry.id === input.itemId)
  if (!item) {
    return { ok: false, code: 'ITEM_NOT_FOUND', message: '找不到该考试项目' }
  }
  if (!itemAppliesToGender(item, input.gender)) {
    return { ok: false, code: 'GENDER_MISMATCH', message: '该项目不适用所选性别' }
  }
  if (item.verification === 'unverified') {
    return { ok: false, code: 'NO_TABLE', message: OFFICIAL_SCORE_UNAVAILABLE }
  }
  if (item.verification === 'verified_unsupported' || item.scoreRule.kind === 'unsupported') {
    return { ok: false, code: 'UNSUPPORTED_MODEL', message: OFFICIAL_SCORE_UNSUPPORTED }
  }
  if (item.scoreRule.entries.length === 0) {
    return { ok: false, code: 'NO_TABLE', message: OFFICIAL_SCORE_UNAVAILABLE }
  }
  if (!Number.isFinite(input.rawValue)) {
    return { ok: false, code: 'INVALID_VALUE', message: '成绩不正确' }
  }

  const scored = scoreFromThresholdTable(input.rawValue, item)
  return {
    ok: true,
    score: scored.score,
    maxScore: Math.min(item.maxScore, item.scoreRule.maxScore),
    minScore: item.scoreRule.minScore,
    rawValue: input.rawValue,
    formattedRawValue: formatExamRawValue(input.rawValue, item),
    matchedThreshold: scored.matchedThreshold,
    standardId: input.standard.id,
    standardTitle: input.standard.title,
    policyLabel: input.standard.policyLabel,
    status: input.standard.status,
    sourceTitle: input.standard.sourceTitle,
    sourceUrl: input.standard.sourceUrl,
    itemId: item.id,
    itemName: item.name
  }
}

export interface FindStandardQuery {
  examType: ExamStandard['examType']
  citySlug?: string
  year?: number
  statuses?: ExamStandardStatus[]
  applicableGroup?: ExamStandard['applicableGroups'][number]
  enrollmentCohort?: string
}

export function findApplicableStandard(
  standards: readonly ExamStandard[],
  query: FindStandardQuery
): ExamStandard | undefined {
  const statuses = query.statuses ?? ['verified']
  const group = query.applicableGroup ?? 'regular'
  const matched = standards.filter((item) => {
    if (item.examType !== query.examType) {
      return false
    }
    if (!statuses.includes(item.status)) {
      return false
    }
    if (query.citySlug && item.citySlug !== query.citySlug) {
      return false
    }
    if (query.year !== undefined && (query.year < item.yearFrom || query.year > item.yearTo)) {
      return false
    }
    if (!item.applicableGroups.includes(group)) {
      return false
    }
    if (query.enrollmentCohort && item.enrollmentCohort !== query.enrollmentCohort) {
      return false
    }
    return true
  })

  return matched.sort((a, b) => b.yearFrom - a.yearFrom || a.id.localeCompare(b.id))[0]
}

export interface FindExamItemMappingQuery {
  gender?: Exclude<ExamGender, 'all'>
  itemKey?: string
  testItemBuiltinKey?: string
  testItemId?: string
}

export function findExamItemMapping(
  standard: ExamStandard,
  query: FindExamItemMappingQuery
): ExamItemDefinition | undefined {
  return standard.items.find((item) => {
    if (query.gender && !itemAppliesToGender(item, query.gender)) {
      return false
    }
    if (query.itemKey && item.itemKey !== query.itemKey) {
      return false
    }
    if (query.testItemBuiltinKey && item.testItemBuiltinKey !== query.testItemBuiltinKey) {
      return false
    }
    if (query.testItemId && item.testItemId !== query.testItemId) {
      return false
    }
    return Boolean(query.itemKey || query.testItemBuiltinKey || query.testItemId)
  })
}
