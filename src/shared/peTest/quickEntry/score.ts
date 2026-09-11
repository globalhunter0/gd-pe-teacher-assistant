import { resolveExamItemToTestItem } from '../../examBatch/peTestImport/resolveTestItem'
import { calculateExamScore, itemAppliesToGender } from '../../examStandard/score'
import type { ExamItemDefinition, ExamStandard } from '../../examStandard/types'
import type { StudentGender } from '../../student/types'
import type { TestItem } from '../types'
import { convertPeTestRawToExamRaw } from './units'

export const QUICK_ENTRY_NO_SCORE_HINT = '暂无可用评分标准'

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
  return hits[0] ?? null
}

export function scoreQuickEntryRaw(options: {
  standard: ExamStandard | null
  testItem: TestItem
  gender: StudentGender
  rawValue: number
}): { examScore: number | null; examItemId: string | null; noScoreHint: string | null } {
  if (!options.standard) {
    return { examScore: null, examItemId: null, noScoreHint: QUICK_ENTRY_NO_SCORE_HINT }
  }
  const examItem = resolveExamItemForQuickEntry(options.standard, options.testItem, options.gender)
  if (!examItem) {
    return { examScore: null, examItemId: null, noScoreHint: QUICK_ENTRY_NO_SCORE_HINT }
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
    return { examScore: null, examItemId: examItem.id, noScoreHint: QUICK_ENTRY_NO_SCORE_HINT }
  }
  return { examScore: scored.score, examItemId: examItem.id, noScoreHint: null }
}
