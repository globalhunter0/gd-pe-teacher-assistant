import { GRADES, JUNIOR_GRADES, PRIMARY_GRADES, SENIOR_GRADES, type Grade } from '../class/types'
import { listBuiltinExamStandards } from '../examStandard/catalog'
import { calculateExamScore } from '../examStandard/score'
import { BUILTIN_TEST_ITEMS } from '../peTest/builtinItems'
import { GENDER_LINKED_TEST_GROUPS, MIDDLE_LONG_RUN_GROUP_ID, resolveActualTestItem } from '../peTest/groupedItems'
import type { StudentGender } from '../student/types'
import { listNationalFitnessEvaluationItems, resolveNationalFitnessItem, sumNationalFitnessWeightPercent } from './apply'
import { NATIONAL_FITNESS_2014_ID, getNationalFitness2014, isNationalFitnessStandardId } from './catalog'
import { calculateNationalFitnessItemScore } from './score'
import { buildNationalFitnessScoreTableManifest } from './manifest'
import { NATIONAL_FITNESS_ITEM_SPECS } from './items'
import { NATIONAL_FITNESS_SCORE_TABLE_MISSING } from './types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function evalKeys(grade: Grade, gender: StudentGender): string {
  return listNationalFitnessEvaluationItems(grade, gender)
    .map((item) => item.itemKey)
    .join(',')
}

const P12 = 'bmi,vital-capacity,50m,sit-and-reach,skip-1min'
const P34 = 'bmi,vital-capacity,50m,sit-and-reach,skip-1min,sit-up-1min'
const P56 = 'bmi,vital-capacity,50m,sit-and-reach,skip-1min,sit-up-1min,shuttle-50m-8'
const MALE_SEC = 'bmi,vital-capacity,50m,sit-and-reach,standing-long-jump,pull-up,run-1000m'
const FEMALE_SEC = 'bmi,vital-capacity,50m,sit-and-reach,standing-long-jump,sit-up-1min,run-800m'

const FORBIDDEN = ['投沙包', '踢毽子', '台阶试验', '握力体重指数', '肺活量体重指数', '身高标准体重', '选测']

export function runNationalFitnessPhaseBPlusSelfCheck(): string {
  assert(evalKeys('一年级', 'male') === P12 && evalKeys('一年级', 'female') === P12, '小学1年级')
  assert(evalKeys('二年级', 'male') === P12 && evalKeys('二年级', 'female') === P12, '小学2年级')
  assert(evalKeys('三年级', 'male') === P34 && evalKeys('三年级', 'female') === P34, '小学3年级')
  assert(evalKeys('四年级', 'male') === P34 && evalKeys('四年级', 'female') === P34, '小学4年级')
  assert(evalKeys('五年级', 'male') === P56 && evalKeys('五年级', 'female') === P56, '小学5年级')
  assert(evalKeys('六年级', 'male') === P56 && evalKeys('六年级', 'female') === P56, '小学6年级')

  for (const grade of JUNIOR_GRADES.concat(SENIOR_GRADES)) {
    assert(evalKeys(grade, 'male') === MALE_SEC, `${grade}男`)
    assert(evalKeys(grade, 'female') === FEMALE_SEC, `${grade}女`)
  }

  for (const grade of PRIMARY_GRADES) {
    const keys = evalKeys(grade, 'male')
    assert(!keys.includes('run-800m') && !keys.includes('run-1000m'), `${grade}无800/1000`)
    assert(!keys.includes('standing-long-jump') && !keys.includes('pull-up'), `${grade}无跳远/引体`)
    const skip = listNationalFitnessEvaluationItems(grade, 'female').find((item) => item.itemKey === 'skip-1min')
    assert(skip?.bonusApplicable, `${grade}跳绳 bonus`)
  }
  assert(!evalKeys('一年级', 'male').includes('sit-up-1min') && evalKeys('三年级', 'male').includes('sit-up-1min'), '1-2无仰卧 3-4有仰卧')
  assert(evalKeys('五年级', 'male').includes('shuttle-50m-8'), '5-6有50×8')
  assert(resolveNationalFitnessItem({ grade: '三年级', gender: 'male', itemKey: 'sit-up-1min' }).ok, '小学男可测仰卧')
  assert(!resolveNationalFitnessItem({ grade: '初一', gender: 'male', itemKey: 'sit-up-1min' }).ok, '初中男不可测仰卧')

  for (const grade of GRADES) {
    for (const gender of ['male', 'female'] as const) {
      assert(sumNationalFitnessWeightPercent(grade, gender) === 100, `${grade}${gender} 权重合计100`)
    }
  }

  const bmi = NATIONAL_FITNESS_ITEM_SPECS.find((item) => item.itemKey === 'bmi')
  assert(bmi?.isDerived && bmi.direction === 'derived', 'BMI derived')
  const skip = NATIONAL_FITNESS_ITEM_SPECS.find((item) => item.itemKey === 'skip-1min')
  const shuttle = NATIONAL_FITNESS_ITEM_SPECS.find((item) => item.itemKey === 'shuttle-50m-8')
  assert(skip?.unit === 'times' && skip.direction === 'higherBetter' && skip.testItemId === 'test-item-builtin-skip-1min', '跳绳单位')
  assert(shuttle?.unit === 's' && shuttle.direction === 'lowerBetter' && shuttle.testItemId === 'test-item-builtin-shuttle-50m-8', '50×8 秒 lowerBetter')
  assert(BUILTIN_TEST_ITEMS.some((item) => item.builtinKey === 'shuttle-50m-8'), '新增唯一 canonical 50×8')
  assert(!NATIONAL_FITNESS_ITEM_SPECS.some((item) => item.itemKey.startsWith('national-fitness-')), '无重复 national-fitness-* 项目')

  const highMale = listNationalFitnessEvaluationItems('高一', 'male')
  const highFemale = listNationalFitnessEvaluationItems('高一', 'female')
  assert(highMale.some((item) => item.itemKey === 'run-1000m' && item.bonusApplicable), '高中男1000 bonus')
  assert(highMale.some((item) => item.itemKey === 'pull-up' && item.bonusApplicable), '高中男引体 bonus')
  assert(highFemale.some((item) => item.itemKey === 'run-800m' && item.bonusApplicable), '高中女800 bonus')
  assert(highFemale.some((item) => item.itemKey === 'sit-up-1min' && item.bonusApplicable), '高中女仰卧 bonus')
  assert(!resolveNationalFitnessItem({ grade: '高一', gender: 'female', itemKey: 'pull-up' }).ok, '高中女引体 fail-closed')
  assert(!resolveNationalFitnessItem({ grade: '高一', gender: 'male', itemKey: 'run-800m' }).ok, '高中男800 fail-closed')

  const manifest = buildNationalFitnessScoreTableManifest()
  assert(manifest.length === 156, `manifest 条目 ${manifest.length}`)
  assert(
    manifest.every((entry) => entry.scoreTableStatus === 'pending-verification'),
    'manifest 全部 pending 非 verified'
  )
  assert(
    manifest.every((entry) => entry.standardId === NATIONAL_FITNESS_2014_ID && entry.version === '2014年修订'),
    'manifest 标准身份'
  )
  const g7male1000 = manifest.filter((entry) => entry.grade === '初一' && entry.gender === 'male' && entry.itemKey === 'run-1000m')
  const g10male1000 = manifest.filter((entry) => entry.grade === '高一' && entry.gender === 'male' && entry.itemKey === 'run-1000m')
  assert(g7male1000.length === 1 && g10male1000.length === 1, '1000米按年级分表占位')

  const catalogText = JSON.stringify(getNationalFitness2014())
  for (const word of FORBIDDEN) {
    assert(!catalogText.includes(word), `旧版污染：${word}`)
  }
  assert(!/"threshold"\s*:/.test(catalogText) && !/"entries"\s*:/.test(catalogText), '无评分阈值')

  const scored = calculateNationalFitnessItemScore({ grade: '一年级', gender: 'male', itemKey: '50m', rawValue: 10 })
  assert(!scored.ok && scored.code === 'NO_TABLE' && scored.message === NATIONAL_FITNESS_SCORE_TABLE_MISSING, '小学无表 fail-closed')
  const highScored = calculateNationalFitnessItemScore({ grade: '高三', gender: 'female', itemKey: 'run-800m', rawValue: 220 })
  assert(!highScored.ok && highScored.code === 'NO_TABLE', '高中无表 fail-closed')

  const examStandards = listBuiltinExamStandards()
  assert(examStandards.every((item) => !isNationalFitnessStandardId(item.id)), '国标未进入考试 catalog')
  const gz = examStandards.find((item) => item.id === 'cn-gd-guangzhou-middle-2024-2026')
  assert(gz, '广州中考')
  const zhongkao = calculateExamScore({
    standard: gz,
    itemId: 'male-1000m',
    rawValue: 217,
    gender: 'male',
    officialOnly: true
  })
  assert(zhongkao.ok && zhongkao.score === 100, '中考回归')
  assert(examStandards.some((item) => item.id === 'cn-gd-gaokao-sports-2026' && item.examType === 'gaokao_sports'), '高考回归')

  const run1000 = BUILTIN_TEST_ITEMS.find((item) => item.builtinKey === 'run-1000m')
  const run800 = BUILTIN_TEST_ITEMS.find((item) => item.builtinKey === 'run-800m')
  assert(run1000 && run800 && GENDER_LINKED_TEST_GROUPS[0]?.id === MIDDLE_LONG_RUN_GROUP_ID, '组合存在')
  const male = resolveActualTestItem(
    { testGroupId: MIDDLE_LONG_RUN_GROUP_ID, testItemId: run1000.id },
    { genderSnapshot: 'male', resolvedTestItemId: null }
  )
  const female = resolveActualTestItem(
    { testGroupId: MIDDLE_LONG_RUN_GROUP_ID, testItemId: run1000.id },
    { genderSnapshot: 'female', resolvedTestItemId: null }
  )
  assert(male.ok && male.item.id === run1000.id && female.ok && female.item.id === run800.id, '800/1000组合不变')
  const mapped = resolveNationalFitnessItem({ grade: '高二', gender: 'male', testItemId: male.ok ? male.item.id : null })
  assert(mapped.ok && mapped.item.itemKey === 'run-1000m', '高中组合定位年级表')

  return 'national-fitness Phase B+ self-check passed'
}

export function runNationalFitnessPhaseBPlusSelfCheckOrThrow(): string {
  return runNationalFitnessPhaseBPlusSelfCheck()
}
