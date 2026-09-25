import type { Grade } from '../../class/types'
import { resolveExamItemToTestItem } from '../../examBatch/peTestImport/resolveTestItem'
import { calculateExamScore, itemAppliesToGender } from '../../examStandard/score'
import type { ExamItemDefinition, ExamStandard } from '../../examStandard/types'
import { isNationalFitnessStandardId } from '../../nationalFitness/catalog'
import { calculateNationalFitnessScore } from '../../nationalFitness/scoring/engine'
import type { StudentGender } from '../../student/types'
import { emptyClassroomScoreFields } from '../scoringBasis'
import type { PeTestScoreOutcome, TestItem } from '../types'
import { convertPeTestRawToExamRaw } from './units'

export const QUICK_ENTRY_NO_SCORE_HINT = '暂无可用评分标准'

export interface ClassroomItemScoreResult {
  examScore: number | null
  examItemId: string | null
  noScoreHint: string | null
  baseScore: number | null
  bonusScore: number | null
  scoreOutcome: PeTestScoreOutcome | null
  officialMinimumScore: number | null
}

function none(hint: string | null): ClassroomItemScoreResult {
  return { ...emptyClassroomScoreFields(), noScoreHint: hint }
}

export function resolveExamItemForQuickEntry(
  standard: ExamStandard,
  testItem: TestItem,
  gender: StudentGender
): ExamItemDefinition | null {
  if (gender !== 'male' && gender !== 'female') {
    return null
  }
  const hits = standard.items.filter((item) => {
    if (!itemAppliesToGender(item, gender)) {
      return false
    }
    return resolveExamItemToTestItem(item, [testItem])?.id === testItem.id
  })
  return hits.length === 1 ? hits[0] : null
}

function scoreNationalFitnessRaw(options: {
  grade: Grade
  testItem: TestItem
  gender: StudentGender
  rawValue: number
}): ClassroomItemScoreResult {
  if (options.gender !== 'male' && options.gender !== 'female') {
    return none(QUICK_ENTRY_NO_SCORE_HINT)
  }
  const scored = calculateNationalFitnessScore({
    itemKey: options.testItem.builtinKey ?? undefined,
    grade: options.grade,
    gender: options.gender,
    testItemId: options.testItem.id,
    testItemBuiltinKey: options.testItem.builtinKey,
    rawValue: options.rawValue
  })
  if (!scored.ok) {
    if (scored.code === 'BELOW_OFFICIAL_MINIMUM') {
      return {
        examScore: null,
        examItemId: scored.itemId,
        noScoreHint: scored.message,
        baseScore: null,
        bonusScore: null,
        scoreOutcome: 'below_official_minimum',
        officialMinimumScore: scored.officialMinimumScore
      }
    }
    return none(QUICK_ENTRY_NO_SCORE_HINT)
  }
  return {
    examScore: scored.finalItemScore,
    examItemId: scored.itemId,
    noScoreHint: null,
    baseScore: scored.baseScore,
    bonusScore: scored.bonusScore,
    scoreOutcome: 'official',
    officialMinimumScore: null
  }
}

export function scoreQuickEntryRaw(options: {
  standard: ExamStandard | null
  testItem: TestItem
  gender: StudentGender
  rawValue: number
  examStandardId?: string | null
  grade?: Grade
}): ClassroomItemScoreResult {
  const basisId = options.examStandardId !== undefined ? options.examStandardId : options.standard?.id ?? null
  if (options.gender !== 'male' && options.gender !== 'female') return none('性别未知，不能评分')
  if (options.testItem.genderRule !== 'all' && options.testItem.genderRule !== options.gender) return none('项目与性别不匹配')
  if (basisId && isNationalFitnessStandardId(basisId)) {
    if (!options.grade) {
      return none(QUICK_ENTRY_NO_SCORE_HINT)
    }
    return scoreNationalFitnessRaw({
      grade: options.grade,
      testItem: options.testItem,
      gender: options.gender,
      rawValue: options.rawValue
    })
  }
  if (!options.standard) {
    return none(options.examStandardId === null ? null : QUICK_ENTRY_NO_SCORE_HINT)
  }
  const examItem = resolveExamItemForQuickEntry(options.standard, options.testItem, options.gender)
  if (!examItem) {
    return none(QUICK_ENTRY_NO_SCORE_HINT)
  }
  const examRaw = convertPeTestRawToExamRaw(options.testItem.unit, examItem.unit, options.rawValue)
  const scored = calculateExamScore({
    standard: options.standard,
    itemId: examItem.id,
    rawValue: examRaw,
    gender: options.gender === 'male' || options.gender === 'female' ? options.gender : 'male',
    officialOnly: true
  })
  if (!scored.ok) {
    return { ...none(QUICK_ENTRY_NO_SCORE_HINT), examItemId: examItem.id }
  }
  return {
    examScore: scored.score,
    examItemId: examItem.id,
    noScoreHint: null,
    baseScore: scored.score,
    bonusScore: 0,
    scoreOutcome: 'official',
    officialMinimumScore: null
  }
}
