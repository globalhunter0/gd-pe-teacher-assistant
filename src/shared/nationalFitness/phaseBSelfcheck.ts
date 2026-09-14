import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { listBuiltinExamStandards } from '../examStandard/catalog'
import { calculateExamScore, findApplicableStandard } from '../examStandard/score'
import { GENDER_LINKED_TEST_GROUPS, MIDDLE_LONG_RUN_GROUP_ID, resolveActualTestItem } from '../peTest/groupedItems'
import { BUILTIN_TEST_ITEMS } from '../peTest/builtinItems'
import type { Grade } from '../class/types'
import type { StudentGender } from '../student/types'
import { listNationalFitnessBmiSourceItems, listNationalFitnessEvaluationItems, resolveNationalFitnessItem } from './apply'
import { deriveNationalFitnessBmi } from './bmi'
import { NATIONAL_FITNESS_2014_ID, getNationalFitness2014, isNationalFitnessStandardId, nationalFitnessAllowsOfficialConvert } from './catalog'
import { gradeKeyFromSnapshot, nationalLabelForGrade, parseJuniorGradeInput } from './grades'
import { JUNIOR_NATIONAL_FITNESS_ITEMS } from './items'
import { calculateNationalFitnessItemScore } from './score'
import { NATIONAL_FITNESS_SCORE_TABLE_MISSING } from './types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function builtinId(key: string): string {
  const found = BUILTIN_TEST_ITEMS.find((item) => item.builtinKey === key)
  assert(found, key)
  return found.id
}

function evalKeys(grade: Grade, gender: StudentGender): string {
  return listNationalFitnessEvaluationItems(grade, gender)
    .map((item) => item.itemKey)
    .join(',')
}

const MALE_EVAL = 'bmi,vital-capacity,50m,sit-and-reach,standing-long-jump,pull-up,run-1000m'
const FEMALE_EVAL = 'bmi,vital-capacity,50m,sit-and-reach,standing-long-jump,sit-up-1min,run-800m'

export function runNationalFitnessPhaseBSelfCheck(): string {
  assert(nationalLabelForGrade('初一') === '七年级', '年级映射 初一=七年级')
  assert(nationalLabelForGrade('初二') === '八年级', '年级映射 初二=八年级')
  assert(nationalLabelForGrade('初三') === '九年级', '年级映射 初三=九年级')
  assert(parseJuniorGradeInput('七年级') === '初一' && gradeKeyFromSnapshot('初二') === '初二', 'gradeSnapshot 即 gradeKey')

  assert(evalKeys('初一', 'male') === MALE_EVAL, 'A. 七年级男项目目录')
  assert(evalKeys('初一', 'female') === FEMALE_EVAL, 'B. 七年级女项目目录')
  assert(evalKeys('初二', 'male') === MALE_EVAL && evalKeys('初二', 'female') === FEMALE_EVAL, 'C. 八年级男/女')
  assert(evalKeys('初三', 'male') === MALE_EVAL && evalKeys('初三', 'female') === FEMALE_EVAL, 'D. 九年级男/女')

  const g7male = listNationalFitnessEvaluationItems('初一', 'male')
  const g7female = listNationalFitnessEvaluationItems('初一', 'female')
  assert(g7male.some((item) => item.itemKey === 'run-1000m') && g7male.every((item) => item.itemKey !== 'run-800m'), 'E. 男生有1000无800')
  assert(g7female.some((item) => item.itemKey === 'run-800m') && g7female.every((item) => item.itemKey !== 'run-1000m'), 'F. 女生有800无1000')
  assert(g7male.some((item) => item.itemKey === 'pull-up'), 'G. 男生引体向上')
  assert(g7female.some((item) => item.itemKey === 'sit-up-1min'), 'H. 女生1分钟仰卧起坐')

  const femalePull = resolveNationalFitnessItem({ grade: '初一', gender: 'female', itemKey: 'pull-up' })
  const maleSitUp = resolveNationalFitnessItem({ grade: '初一', gender: 'male', itemKey: 'sit-up-1min' })
  const male800 = resolveNationalFitnessItem({ grade: '初一', gender: 'male', itemKey: 'run-800m' })
  const female1000 = resolveNationalFitnessItem({ grade: '初一', gender: 'female', itemKey: 'run-1000m' })
  assert(!femalePull.ok && femalePull.code === 'GENDER_MISMATCH', 'L. 女生引体向上 fail-closed')
  assert(!maleSitUp.ok && maleSitUp.code === 'GENDER_MISMATCH', 'L. 男生仰卧起坐 fail-closed')
  assert(!male800.ok && male800.code === 'GENDER_MISMATCH', 'L. 男生800 fail-closed 不回退1000')
  assert(!female1000.ok && female1000.code === 'GENDER_MISMATCH', 'L. 女生1000 fail-closed 不回退800')
  assert(listNationalFitnessEvaluationItems('初一', 'unspecified').length === 0, 'L. 性别不明无目录')

  const bmi = JUNIOR_NATIONAL_FITNESS_ITEMS.find((item) => item.itemKey === 'bmi')
  assert(bmi?.direction === 'derived' && bmi.isDerived, 'I. BMI derived')
  assert(bmi.testItemId === null && bmi.testItemBuiltinKey === null, 'I. BMI 不是重复日常项目')
  const height = JUNIOR_NATIONAL_FITNESS_ITEMS.find((item) => item.itemKey === 'height')
  const weight = JUNIOR_NATIONAL_FITNESS_ITEMS.find((item) => item.itemKey === 'weight')
  assert(height?.direction === 'neutral' && weight?.direction === 'neutral', 'I. 身高体重 neutral')
  assert(height.testItemId === builtinId('height') && weight.testItemId === builtinId('weight'), 'G. 复用身高体重 testItemId')
  const sources = listNationalFitnessBmiSourceItems('初一', 'male').map((item) => item.itemKey).join(',')
  assert(sources === 'height,weight', 'BMI 源项目')
  const derived = deriveNationalFitnessBmi(170, 65)
  assert(derived.ok && derived.unitLabel === 'kg/m²' && Math.abs(derived.bmi - 65 / (1.7 * 1.7)) < 1e-9, 'BMI 派生无评分')

  const run50 = JUNIOR_NATIONAL_FITNESS_ITEMS.find((item) => item.itemKey === '50m')
  assert(run50?.direction === 'lowerBetter' && run50.unit === 's', 'J/M. 50米 lowerBetter 秒')
  const run800 = JUNIOR_NATIONAL_FITNESS_ITEMS.find((item) => item.itemKey === 'run-800m')
  const run1000 = JUNIOR_NATIONAL_FITNESS_ITEMS.find((item) => item.itemKey === 'run-1000m')
  assert(run800?.direction === 'lowerBetter' && run1000?.direction === 'lowerBetter', 'K. 800/1000 lowerBetter')
  assert(run800?.unit === 's' && run1000?.unit === 's', 'M. 800/1000 底层秒')
  assert(run800.testItemId === builtinId('run-800m') && run1000.testItemId === builtinId('run-1000m'), 'G. 复用800/1000')

  const vital = JUNIOR_NATIONAL_FITNESS_ITEMS.find((item) => item.itemKey === 'vital-capacity')
  const reach = JUNIOR_NATIONAL_FITNESS_ITEMS.find((item) => item.itemKey === 'sit-and-reach')
  const jump = JUNIOR_NATIONAL_FITNESS_ITEMS.find((item) => item.itemKey === 'standing-long-jump')
  const pull = JUNIOR_NATIONAL_FITNESS_ITEMS.find((item) => item.itemKey === 'pull-up')
  const sitUp = JUNIOR_NATIONAL_FITNESS_ITEMS.find((item) => item.itemKey === 'sit-up-1min')
  assert(vital?.direction === 'higherBetter' && vital.unit === 'ml', 'L/M. 肺活量')
  assert(reach?.direction === 'higherBetter' && reach.unit === 'cm', 'L/M. 坐位体前屈')
  assert(jump?.direction === 'higherBetter' && jump.unit === 'cm', 'L/M. 立定跳远')
  assert(pull?.direction === 'higherBetter' && pull.unit === 'times' && pull.testItemId === builtinId('pull-up'), 'L/M. 引体')
  assert(sitUp?.direction === 'higherBetter' && sitUp.unit === 'times' && sitUp.testItemId === builtinId('sit-up-1min'), 'L/M. 仰卧')
  assert(height.unit === 'cm' && weight.unit === 'kg' && bmi.unitLabel === 'kg/m²', 'M. 形态单位')

  const group = GENDER_LINKED_TEST_GROUPS.find((item) => item.id === MIDDLE_LONG_RUN_GROUP_ID)
  const daily1000 = BUILTIN_TEST_ITEMS.find((item) => item.builtinKey === 'run-1000m')
  const daily800 = BUILTIN_TEST_ITEMS.find((item) => item.builtinKey === 'run-800m')
  assert(group && daily1000 && daily800, 'N. 组合项目存在')
  const maleResolved = resolveActualTestItem(
    { testGroupId: MIDDLE_LONG_RUN_GROUP_ID, testItemId: daily1000.id },
    { genderSnapshot: 'male', resolvedTestItemId: null }
  )
  const femaleResolved = resolveActualTestItem(
    { testGroupId: MIDDLE_LONG_RUN_GROUP_ID, testItemId: daily1000.id },
    { genderSnapshot: 'female', resolvedTestItemId: null }
  )
  assert(maleResolved.ok && maleResolved.item.id === daily1000.id, 'N. 组合男→1000')
  assert(femaleResolved.ok && femaleResolved.item.id === daily800.id, 'N. 组合女→800')
  const maleNf = resolveNationalFitnessItem({
    grade: '初一',
    gender: 'male',
    testItemId: maleResolved.ok ? maleResolved.item.id : null
  })
  const femaleNf = resolveNationalFitnessItem({
    grade: '初一',
    gender: 'female',
    testItemId: femaleResolved.ok ? femaleResolved.item.id : null
  })
  assert(maleNf.ok && maleNf.item.itemKey === 'run-1000m', 'N. 国标定位男1000')
  assert(femaleNf.ok && femaleNf.item.itemKey === 'run-800m', 'N. 国标定位女800')

  const scored = calculateNationalFitnessItemScore({
    grade: '初一',
    gender: 'male',
    itemKey: 'run-1000m',
    rawValue: 220
  })
  assert(!scored.ok && scored.code === 'NO_TABLE' && scored.message === NATIONAL_FITNESS_SCORE_TABLE_MISSING, 'O. 无表拒绝换算')
  assert(!('score' in scored), 'O. 失败结果不含 score')
  assert(nationalFitnessAllowsOfficialConvert() === false, 'O. 禁止官方换算')

  const examStandards = listBuiltinExamStandards()
  assert(examStandards.every((item) => !isNationalFitnessStandardId(item.id)), 'P. 国标未进入考试 catalog')
  const gz = examStandards.find((item) => item.id === 'cn-gd-guangzhou-middle-2024-2026')
  assert(gz, 'R. 广州中考存在')
  const disguised = calculateExamScore({
    standard: { ...gz, id: NATIONAL_FITNESS_2014_ID },
    itemId: 'male-1000m',
    rawValue: 217,
    gender: 'male',
    officialOnly: true
  })
  assert(!disguised.ok && disguised.code === 'NO_TABLE', 'P. 即使带中考表也不能用国标 id 换算')
  const zhongkao = calculateExamScore({
    standard: gz,
    itemId: 'male-1000m',
    rawValue: 217,
    gender: 'male',
    officialOnly: true
  })
  assert(zhongkao.ok && zhongkao.score === 100, 'R. 中考评分不变')
  const zhongkaoPick = findApplicableStandard(examStandards, { examType: 'middle_school_exam', citySlug: 'guangzhou', year: 2026 })
  assert(zhongkaoPick?.id === gz.id && zhongkaoPick.examType === 'middle_school_exam', 'P. 查找中考不会落到国标')

  const gaokao = examStandards.find((item) => item.id === 'cn-gd-gaokao-sports-2026')
  assert(gaokao?.examType === 'gaokao_sports', 'S. 高考标准仍在')
  const gaokaoPick = findApplicableStandard(examStandards, { examType: 'gaokao_sports', year: 2026 })
  assert(gaokaoPick?.id === gaokao.id, 'Q. 查找高考不会落到国标')

  const catalogJson = JSON.stringify(getNationalFitness2014())
  assert(!/"score"\s*:/.test(catalogJson) && !/"threshold"\s*:/.test(catalogJson), '无评分数字字段')
  assert(!/"entries"\s*:/.test(catalogJson) && !/"maxScore"\s*:/.test(catalogJson), '无评分表结构')
  assert(
    JUNIOR_NATIONAL_FITNESS_ITEMS.every((item) => item.scoreTable === null && item.bonusTable === null && item.weight === null),
    '项目级无评分数字'
  )
  assert(!JUNIOR_NATIONAL_FITNESS_ITEMS.some((item) => item.itemKey.startsWith('national-fitness-')), 'H. 未复制 national-fitness-* 日常项目')

  const standardsPage = readFileSync(resolve(process.cwd(), 'src/renderer/src/pages/ExamStandardsPage.tsx'), 'utf8')
  assert(standardsPage.includes('nationalLabelForGrade'), 'UI 年级入口')
  assert(
    standardsPage.includes('JUNIOR_GRADE_OPTIONS') || standardsPage.includes('NATIONAL_FITNESS_STAGE_OPTIONS'),
    'UI 年级/学段入口'
  )
  assert(standardsPage.includes('NATIONAL_FITNESS_SCORE_TABLE_MISSING'), 'UI 未收录提示')
  assert(standardsPage.includes('用于 BMI'), 'UI 身高体重说明')
  assert(!standardsPage.includes('calculateExamScore(') || standardsPage.includes('browseTab === NATIONAL_STUDENT_FITNESS_FAMILY'), 'UI 国标页不换算')

  return 'national-fitness Phase B self-check passed'
}

export function runNationalFitnessPhaseBSelfCheckOrThrow(): string {
  return runNationalFitnessPhaseBSelfCheck()
}
