import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { listBuiltinExamStandards } from '../examStandard/catalog'
import { calculateExamScore } from '../examStandard/score'
import { BUILTIN_TEST_ITEMS } from '../peTest/builtinItems'
import { GENDER_LINKED_TEST_GROUPS, MIDDLE_LONG_RUN_GROUP_ID, resolveActualTestItem } from '../peTest/groupedItems'
import { calculateNationalFitnessScore } from './scoring/engine'
import { capNationalFitnessYearTotals } from './scoring/composite'
import { findOfficialNationalFitnessScoreTable, listOfficialNationalFitnessScoreTables } from './scoring/officialTables'
import {
  findOfficialNationalFitnessBonusTable,
  listOfficialNationalFitnessBonusBindings,
  listOfficialNationalFitnessBonusTables
} from './scoring/officialBonusTables'
import { NATIONAL_FITNESS_BELOW_OFFICIAL_MINIMUM } from './scoring/types'
import { NATIONAL_FITNESS_2014_ID } from './catalog'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function readSrc(relative: string): string {
  return readFileSync(resolve(process.cwd(), relative), 'utf8')
}

function score(grade: Parameters<typeof calculateNationalFitnessScore>[0]['grade'], gender: 'male' | 'female', itemId: string, rawValue: number) {
  return calculateNationalFitnessScore({ grade, gender, itemId, rawValue })
}

function threshold100(grade: Parameters<typeof calculateNationalFitnessScore>[0]['grade'], gender: 'male' | 'female', itemId: string): number {
  const table = findOfficialNationalFitnessScoreTable({ grade, gender, itemId, standardId: NATIONAL_FITNESS_2014_ID })
  const band = table?.thresholdEntries.find((entry) => entry.score === 100)
  assert(band, `${grade}${gender}${itemId} 缺少基础100分档`)
  return band.threshold
}

export function runNationalFitnessPhaseC3SelfCheck(): string {
  const official = listOfficialNationalFitnessBonusTables()
  assert(official.length === 6, '官方附加分表应为 6 张，不是 36 张')
  assert(
    official.every((table) => table.verificationStatus === 'verified' && table.source.documentNo === '教体艺〔2014〕5号'),
    '6 张附加分表均 verified'
  )
  assert(
    official.map((table) => table.officialTableId).join(',') === '2-1,2-2,2-3,2-4,2-5,2-6',
    'Z. officialTableId 为 2-1～2-6'
  )
  assert(
    official.every((table) => table.source.publishedAt === '2014-07-07' && table.source.authority === '教育部'),
    '来源教育部 / 2014-07-07'
  )
  const bindings = listOfficialNationalFitnessBonusBindings()
  assert(bindings.length === 36, '程序展开 36 条年级/性别/项目组合，不是 36 张官方表')
  assert(
    bindings.every((binding) => official.some((table) => table === binding.table)),
    '组合记录引用 6 张官方表，不复制基础100分'
  )
  assert(!JSON.stringify(official).includes('"grade":'), '附加分官方表不内嵌单一年级基础100分')

  const skip100 = threshold100('一年级', 'male', 'skip-1min')
  const skipAt100 = score('一年级', 'male', 'skip-1min', skip100)
  const skipFirst = score('一年级', 'male', 'skip-1min', skip100 + 2)
  const skipMax = score('一年级', 'male', 'skip-1min', skip100 + 40)
  const skipOver = score('一年级', 'male', 'skip-1min', skip100 + 80)
  assert(skipAt100.ok && skipAt100.baseScore === 100 && skipAt100.bonusScore === 0, 'A/R. 跳绳刚好100 → bonus 0')
  assert(skipFirst.ok && skipFirst.baseScore === 100 && skipFirst.bonusScore === 1 && skipFirst.finalItemScore === 101, 'B/S. 100分阈值+2次 → +1')
  assert(skipMax.ok && skipMax.bonusScore === 20 && skipMax.matchedBonusRule?.officialTableId === '2-1', 'C/T. +40次 → +20')
  assert(skipOver.ok && skipOver.bonusScore === 20, 'K. 超过最高档仍 20')

  const pull100 = threshold100('初一', 'male', 'pull-up')
  const pullBonus = score('初一', 'male', 'pull-up', pull100 + 1)
  const pullCap = score('初一', 'male', 'pull-up', pull100 + 20)
  const pullZero = score('初一', 'male', 'pull-up', 0)
  assert(pullBonus.ok && pullBonus.baseScore === 100 && pullBonus.bonusScore === 1 && pullBonus.matchedBonusRule?.officialTableId === '2-3', 'D/U. 引体 100+1 → +1')
  assert(pullCap.ok && pullCap.bonusScore === 10, 'K. 引体附加分上限 10')
  assert(!pullZero.ok && pullZero.code === NATIONAL_FITNESS_BELOW_OFFICIAL_MINIMUM && !('bonusScore' in pullZero), 'M. BELOW_OFFICIAL_MINIMUM 不变')

  const run1000_100 = threshold100('初一', 'male', 'run-1000m')
  const run1000b = score('初一', 'male', 'run-1000m', run1000_100 - 4)
  assert(run1000b.ok && run1000b.baseScore === 100 && run1000b.bonusScore === 1 && run1000b.matchedBonusRule?.officialTableId === '2-5', 'E/V. 1000米快4秒 → +1')

  const sit100 = threshold100('初一', 'female', 'sit-up-1min')
  const sitBonus = score('初一', 'female', 'sit-up-1min', sit100 + 2)
  assert(sitBonus.ok && sitBonus.bonusScore === 1 && sitBonus.matchedBonusRule?.officialTableId === '2-4', 'F/X. 仰卧 100+2 → +1')

  const run800_100 = threshold100('初一', 'female', 'run-800m')
  const run800b = score('初一', 'female', 'run-800m', run800_100 - 5)
  assert(run800b.ok && run800b.bonusScore === 1 && run800b.matchedBonusRule?.officialTableId === '2-6', 'G/W. 800米快5秒 → +1')

  const senior1000 = threshold100('高一', 'male', 'run-1000m')
  const senior800 = threshold100('高一', 'female', 'run-800m')
  const high1000 = score('高一', 'male', 'run-1000m', senior1000 - 4)
  const high800 = score('高一', 'female', 'run-800m', senior800 - 5)
  assert(high1000.ok && high1000.bonusScore === 1 && high1000.matchedBonusRule?.officialTableId === '2-5', 'H. 高中男1000 附加分')
  assert(high800.ok && high800.bonusScore === 1 && high800.matchedBonusRule?.officialTableId === '2-6', 'H. 高中女800 附加分')

  const fast50 = score('一年级', 'male', '50m', 10.1)
  const bmi = score('一年级', 'male', 'bmi', 18.1)
  assert(fast50.ok && fast50.baseScore === 100 && fast50.bonusScore === 0 && fast50.matchedBonusRule === null, 'I/Y. 非附加分项目超过100仍 bonus 0')
  assert(bmi.ok && bmi.baseScore === 100 && bmi.bonusScore === 0, 'N. BMI 不变且无附加分')

  const run1000Item = BUILTIN_TEST_ITEMS.find((item) => item.builtinKey === 'run-1000m')
  const run800Item = BUILTIN_TEST_ITEMS.find((item) => item.builtinKey === 'run-800m')
  assert(run1000Item && run800Item, '800/1000 日常项')
  const maleGroup = resolveActualTestItem({ testGroupId: MIDDLE_LONG_RUN_GROUP_ID, testItemId: run1000Item.id }, { genderSnapshot: 'male', resolvedTestItemId: null })
  const femaleGroup = resolveActualTestItem({ testGroupId: MIDDLE_LONG_RUN_GROUP_ID, testItemId: run1000Item.id }, { genderSnapshot: 'female', resolvedTestItemId: null })
  assert(GENDER_LINKED_TEST_GROUPS[0]?.id === MIDDLE_LONG_RUN_GROUP_ID, 'J. 组合仍在')
  assert(maleGroup.ok && femaleGroup.ok, 'J. 组合可解析')
  const maleFromGroup = calculateNationalFitnessScore({
    grade: '初一',
    gender: 'male',
    testItemId: maleGroup.ok ? maleGroup.item.id : null,
    rawValue: run1000_100 - 4
  })
  const femaleFromGroup = calculateNationalFitnessScore({
    grade: '初一',
    gender: 'female',
    testItemId: femaleGroup.ok ? femaleGroup.item.id : null,
    rawValue: run800_100 - 5
  })
  assert(maleFromGroup.ok && maleFromGroup.itemId === 'run-1000m' && maleFromGroup.bonusScore === 1 && maleFromGroup.matchedBonusRule?.officialTableId === '2-5', 'J. 男组合走表2-5')
  assert(femaleFromGroup.ok && femaleFromGroup.itemId === 'run-800m' && femaleFromGroup.bonusScore === 1 && femaleFromGroup.matchedBonusRule?.officialTableId === '2-6', 'J. 女组合走表2-6')
  assert(!official.some((table) => table.itemId.includes('800') && table.itemId.includes('1000')), 'J. 无组合ID虚假附加分表')

  const capped = capNationalFitnessYearTotals({
    standardScore: 100,
    bonusScore: skipMax.ok ? skipMax.bonusScore + (pullCap.ok ? pullCap.bonusScore : 0) : 0
  })
  assert(capped.bonusScore === 20 && capped.standardScore === 100 && capped.totalScore === 120, 'L. 学年附加分≤20 总分≤120')

  assert(!findOfficialNationalFitnessBonusTable({ grade: '一年级', gender: 'male', itemId: '50m' }), '50米无附加分表')
  assert(listOfficialNationalFitnessScoreTables().every((table) => !table.source?.tableNo?.includes('表2')), '基础仓库仍不含表2')

  const gz = listBuiltinExamStandards().find((item) => item.id === 'cn-gd-guangzhou-middle-2024-2026')
  assert(gz, '广州中考')
  const zhongkao = calculateExamScore({ standard: gz, itemId: 'male-1000m', rawValue: 217, gender: 'male', officialOnly: true })
  assert(zhongkao.ok && zhongkao.score === 100, '中考不被国标附加分影响')

  const page = readSrc('src/renderer/src/pages/ExamStandardsPage.tsx')
  assert(page.includes('【基础评分表】') && page.includes('【附加分评分表】'), 'UI 分区')
  assert(page.includes('以下数值表示超过基础100分成绩后的增量。'), 'UI 增量说明')
  assert(page.includes('该项目无官方附加分'), 'UI 非附加分项目说明')
  assert(page.includes('比100分成绩快') && page.includes('超过100分成绩'), 'UI 避免把增量当成原始成绩')

  const primarySkip = bindings.filter((item) => item.itemId === 'skip-1min')
  const juniorPull = bindings.filter((item) => item.grade === '初一' || item.grade === '初二' || item.grade === '初三')
  const senior = bindings.filter((item) => item.grade === '高一' || item.grade === '高二' || item.grade === '高三')
  assert(primarySkip.length === 12, '小学跳绳 6年级×2性别')
  assert(juniorPull.length === 12, '初中 12 条组合')
  assert(senior.length === 12, '高中 12 条组合')
  assert(official.every((table) => table.verificationStatus === 'verified'), '无 pending 附加分表')

  return 'national-fitness Phase C3 self-check passed'
}

export function runNationalFitnessPhaseC3SelfCheckOrThrow(): string {
  return runNationalFitnessPhaseC3SelfCheck()
}
