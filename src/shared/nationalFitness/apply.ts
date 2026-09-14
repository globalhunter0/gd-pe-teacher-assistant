import { GRADE_STAGE, type Grade } from '../class/types'
import type { StudentGender } from '../student/types'
import { coverageRowsFor, type NationalFitnessCoverageRow } from './coverage'
import { isNationalFitnessGrade } from './grades'
import { findNationalFitnessItemSpec, findNationalFitnessItemSpecByTestItem } from './items'
import type { NationalFitnessItemDefinition } from './types'

export type NationalFitnessLookupFailureCode =
  | 'GRADE_UNSUPPORTED'
  | 'GENDER_UNSPECIFIED'
  | 'GENDER_MISMATCH'
  | 'ITEM_NOT_FOUND'

export type NationalFitnessLookupResult =
  | { ok: true; item: NationalFitnessItemDefinition }
  | { ok: false; code: NationalFitnessLookupFailureCode; message: string }

const PRIMARY_EVAL_ORDER = [
  'bmi',
  'vital-capacity',
  '50m',
  'sit-and-reach',
  'skip-1min',
  'sit-up-1min',
  'shuttle-50m-8'
]

const SECONDARY_EVAL_ORDER = [
  'bmi',
  'vital-capacity',
  '50m',
  'sit-and-reach',
  'standing-long-jump',
  'pull-up',
  'sit-up-1min',
  'run-1000m',
  'run-800m'
]

function itemMatchesGender(row: NationalFitnessCoverageRow, gender: Exclude<StudentGender, 'unspecified'>): boolean {
  return row.gender === 'all' || row.gender === gender
}

function evalOrder(grade: Grade): string[] {
  return GRADE_STAGE[grade] === 'primary' ? PRIMARY_EVAL_ORDER : SECONDARY_EVAL_ORDER
}

function hydrate(spec: NationalFitnessItemDefinition, row: NationalFitnessCoverageRow, grade: Grade): NationalFitnessItemDefinition {
  return {
    ...spec,
    grades: [grade],
    gender: row.gender,
    genderExclusive: row.gender !== 'all',
    bonusApplicable: row.supportsBonus,
    bonusCategory: row.bonusCategory,
    weightPercent: row.weightPercent
  }
}

export function listNationalFitnessItemsFor(grade: Grade, gender: StudentGender): NationalFitnessItemDefinition[] {
  if (!isNationalFitnessGrade(grade) || gender === 'unspecified') {
    return []
  }
  const order = ['height', 'weight', ...evalOrder(grade)]
  const rows = coverageRowsFor(grade).filter((row) => itemMatchesGender(row, gender))
  const items: NationalFitnessItemDefinition[] = []
  for (const key of order) {
    const row = rows.find((entry) => entry.itemKey === key)
    const spec = findNationalFitnessItemSpec(key)
    if (!row || !spec) {
      continue
    }
    items.push(hydrate(spec, row, grade))
  }
  return items
}

export function listNationalFitnessEvaluationItems(grade: Grade, gender: StudentGender): NationalFitnessItemDefinition[] {
  return listNationalFitnessItemsFor(grade, gender).filter((item) => item.role !== 'bmi-source')
}

export function listNationalFitnessBmiSourceItems(grade: Grade, gender: StudentGender): NationalFitnessItemDefinition[] {
  return listNationalFitnessItemsFor(grade, gender).filter((item) => item.role === 'bmi-source')
}

export function sumNationalFitnessWeightPercent(grade: Grade, gender: StudentGender): number {
  return listNationalFitnessEvaluationItems(grade, gender).reduce((sum, item) => sum + (item.weightPercent ?? 0), 0)
}

export interface ResolveNationalFitnessItemQuery {
  grade: Grade
  gender: StudentGender
  itemKey?: string
  testItemId?: string | null
  testItemBuiltinKey?: string | null
}

export function resolveNationalFitnessItem(query: ResolveNationalFitnessItemQuery): NationalFitnessLookupResult {
  if (!isNationalFitnessGrade(query.grade)) {
    return { ok: false, code: 'GRADE_UNSUPPORTED', message: '年级快照不在国家体测 12 年级范围内' }
  }
  if (query.gender === 'unspecified') {
    return { ok: false, code: 'GENDER_UNSPECIFIED', message: '无法确定项目，请先完善性别' }
  }

  const gender = query.gender
  const spec = query.itemKey
    ? findNationalFitnessItemSpec(query.itemKey)
    : findNationalFitnessItemSpecByTestItem({
        testItemId: query.testItemId,
        testItemBuiltinKey: query.testItemBuiltinKey
      })
  if (!spec) {
    return { ok: false, code: 'ITEM_NOT_FOUND', message: '该年级没有对应的国家体测项目' }
  }

  const gradeRows = coverageRowsFor(query.grade).filter((row) => row.itemKey === spec.itemKey)
  if (gradeRows.length === 0) {
    return { ok: false, code: 'ITEM_NOT_FOUND', message: '该年级没有对应的国家体测项目' }
  }
  const matched = gradeRows.find((row) => itemMatchesGender(row, gender))
  if (!matched) {
    return { ok: false, code: 'GENDER_MISMATCH', message: '该项目不适用所选性别' }
  }
  return { ok: true, item: hydrate(spec, matched, query.grade) }
}
