import type { ExamStandard, ExamItemDefinition } from '../examStandard/types'
import { calculateExamScore } from '../examStandard/score'
import { isNationalFitnessStandardId } from '../nationalFitness/catalog'
import { BUILTIN_TEST_ITEMS } from '../peTest/builtinItems'
import { resolveExamItemToTestItem } from './peTestImport/resolveTestItem'
import { scoreQuickEntryRaw } from '../peTest/quickEntry/score'
import { convertPeTestRawToExamRaw } from '../peTest/quickEntry/units'
import { parseQuickEntryInput } from '../peTest/quickEntry/parse'
import type { BatchAssessmentRow } from './types'

/** Shared scoring/persistence shape. Batch parsed values use the declared standard's unit. */
export function scoreImported(standard: ExamStandard, item: ExamItemDefinition, gender: 'male' | 'female', raw: number): Pick<BatchAssessmentRow, 'score' | 'baseScore' | 'bonusScore' | 'scoreOutcome' | 'officialMinimumScore' | 'status' | 'message'> {
  const testItem = resolveExamItemToTestItem(item, BUILTIN_TEST_ITEMS)
  if (!testItem) {
    const result = calculateExamScore({ standard, itemId: item.id, gender, rawValue: raw, officialOnly: true })
    return result.ok
      ? { score: result.score, baseScore: result.score, bonusScore: 0, scoreOutcome: 'official', officialMinimumScore: null, status: 'success', message: '' }
      : { score: null, status: 'unsupported_item', message: result.message }
  }
  let value: number
  try { value = convertPeTestRawToExamRaw(item.unit, testItem.unit, raw) }
  catch { return { score: null, status: 'invalid_raw_value', message: '项目与评分单位不一致' } }
  const checked = parseQuickEntryInput(testItem.valueType === 'time' ? `${value}秒` : String(value), testItem)
  if (!checked.ok || checked.needsConfirm) return { score: null, status: 'invalid_raw_value', message: checked.ok ? checked.warning ?? '需确认' : checked.message }
  if (isNationalFitnessStandardId(standard.id) && ['height', 'weight'].includes(item.itemKey)) {
    return { score: null, baseScore: null, bonusScore: null, scoreOutcome: null, officialMinimumScore: null, status: 'success', message: 'BMI来源数据，不单独评分' }
  }
  const result = scoreQuickEntryRaw({ standard, examStandardId: standard.id, grade: standard.importGrade, testItem, gender, rawValue: value })
  const { examScore: score, noScoreHint, examItemId: _id, ...fields } = result
  return { ...fields, score, status: score !== null || result.scoreOutcome === 'below_official_minimum' ? 'success' : 'no_score_table', message: noScoreHint ?? '' }
}
