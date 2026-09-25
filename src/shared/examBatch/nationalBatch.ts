import { JUNIOR_GRADES, type Grade } from '../class/types'
import type { ExamStandard } from '../examStandard/types'
import { NATIONAL_FITNESS_2014_ID } from '../nationalFitness/catalog'
import { JUNIOR_NATIONAL_FITNESS_ITEMS } from '../nationalFitness/items'
import { listNationalFitnessItemsFor } from '../nationalFitness/apply'
import { BUILTIN_TEST_ITEMS } from '../peTest/builtinItems'
import { deriveNationalFitnessBmi } from '../nationalFitness/bmi'
import { explicitColumnUnit } from '../peTest/measurement'
import { parseExamBatchRawValue } from './parseRaw'
import { prepareExamHeader } from './detectExamItemColumn'
import type { ExamSheetSnapshot } from './types'

export function withDerivedBmi(snapshot: ExamSheetSnapshot, standard: ExamStandard): ExamSheetSnapshot {
  if (standard.id !== NATIONAL_FITNESS_2014_ID) return snapshot
  const headers = snapshot.columns.map(column => prepareExamHeader(column.title).toLowerCase())
  if (headers.some(header => header === 'bmi' || header === '体重指数')) return snapshot
  const height = headers.indexOf('身高'), weight = headers.indexOf('体重')
  if (height < 0 || weight < 0) return snapshot
  const parse = (row: ExamSheetSnapshot['rows'][number], index: number, key: string) => parseExamBatchRawValue(row.cells[index], row.raw[index], standard.items.find(item => item.itemKey === key)!, explicitColumnUnit(snapshot.columns[index].title))
  return { ...snapshot, columns: [...snapshot.columns, { index: snapshot.columns.length, title: 'BMI' }], rows: snapshot.rows.map(row => {
    const h = parse(row, height, 'height'), w = parse(row, weight, 'weight')
    const bmi = h.ok && w.ok ? deriveNationalFitnessBmi(h.value, w.value) : null
    const value = bmi?.ok ? Math.round(bmi.bmi * 10) / 10 : ''
    return { ...row, cells: [...row.cells, String(value)], raw: [...row.raw, value] }
  }) }
}

/** Import descriptor only. All scores come from the existing official national engine. */
export function nationalBatchStandard(grade: Grade): ExamStandard {
  if (!JUNIOR_GRADES.includes(grade)) throw new Error('国家体测 Excel V1 仅支持初中年级')
  return {
    id: NATIONAL_FITNESS_2014_ID, importGrade: grade, examType: 'middle_school_exam',
    regionCode: 'CN-GD', cityCode: 'CN', citySlug: 'national-fitness', cityName: '国家体测',
    yearFrom: 2014, yearTo: 2014, policyLabel: '国家学生体质健康标准（2014年修订）',
    policyPeriod: '2014', title: `国家体测 · ${grade}`, sourceAuthority: '教育部',
    sourceTitle: '教体艺〔2014〕5号', sourceUrl: null, policySourceTitle: '教体艺〔2014〕5号',
    policySourceUrl: null, publishedAt: '2014-07-07', effectiveFrom: '2014', effectiveTo: null,
    status: 'verified', ruleStatus: 'verified', scoreTableStatus: 'verified', schemeLabel: '国家体测（初中）',
    scoreYear: 2014, applicableGroups: ['regular'], enrollmentCohort: null,
    calculationNotes: '按显式年级、性别调用国家体测引擎；身高体重仅保存原始值。', notes: '', totalMaxScore: 120,
    scoring: { rounding: 'none' }, groups: [], components: [], createdAt: '', updatedAt: '',
    items: JUNIOR_NATIONAL_FITNESS_ITEMS.map(spec => {
      const item = BUILTIN_TEST_ITEMS.find(entry => entry.builtinKey === spec.itemKey)!
      const male = listNationalFitnessItemsFor(grade, 'male').some(entry => entry.itemKey === spec.itemKey)
      const female = listNationalFitnessItemsFor(grade, 'female').some(entry => entry.itemKey === spec.itemKey)
      return {
        id: spec.itemKey, itemKey: spec.itemKey, name: spec.name, gender: male && female ? 'all' : male ? 'male' : 'female',
        requirement: 'required', category: 'other', valueType: item.valueType, timeInputMode: item.timeInputMode,
        unit: item.unit, customUnitLabel: item.customUnitLabel, direction: item.direction === 'neutral' ? 'higherBetter' : item.direction,
        decimalPlaces: item.decimalPlaces, maxScore: spec.bonusApplicable ? 120 : 100,
        testItemBuiltinKey: item.builtinKey, testItemId: item.id, verification: 'verified_supported',
        scoreRule: { kind: 'unsupported', reason: '由国家体测引擎按年级评分', maxScore: 100, minScore: 0 },
        aliases: spec.itemKey === 'bmi' ? ['BMI', '体重指数'] : [item.name, spec.name]
      }
    })
  }
}
