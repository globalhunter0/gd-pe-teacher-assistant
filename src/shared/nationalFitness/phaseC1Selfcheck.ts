import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { listBuiltinExamStandards } from '../examStandard/catalog'
import { calculateExamScore } from '../examStandard/score'
import { BUILTIN_TEST_ITEMS } from '../peTest/builtinItems'
import { GENDER_LINKED_TEST_GROUPS, MIDDLE_LONG_RUN_GROUP_ID, resolveActualTestItem } from '../peTest/groupedItems'
import { calculateNationalFitnessScore } from './scoring/engine'
import { calculateNationalFitnessItemScore } from './score'
import { NATIONAL_FITNESS_BELOW_OFFICIAL_MINIMUM } from './scoring/types'
import { C1_ENGINE_FIXTURE_TABLES } from './scoring/c1Fixtures'
import { listOfficialNationalFitnessScoreTables } from './scoring/officialTables'
import { parseNationalFitnessRawValue } from './scoring/time'
import { validateNationalFitnessScoreTable, validateNationalFitnessScoreTables } from './scoring/validator'
import { buildNationalFitnessCompletenessMatrix, summarizeNationalFitnessCompleteness } from './scoring/completeness'
import { findNationalFitnessItemSpec } from './items'
import { NATIONAL_FITNESS_SCORE_TABLE_MISSING } from './types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function readSrc(relative: string): string {
  return readFileSync(resolve(process.cwd(), relative), 'utf8')
}

function score(partial: Parameters<typeof calculateNationalFitnessScore>[0]) {
  return calculateNationalFitnessScore({ ...partial, tables: C1_ENGINE_FIXTURE_TABLES })
}

export function runNationalFitnessPhaseC1SelfCheck(): string {
  const bmi18 = score({ grade: '初一', gender: 'male', itemId: 'bmi', rawValue: 18 })
  const bmi17 = score({ grade: '初一', gender: 'male', itemId: 'bmi', rawValue: 17.9 })
  const bmi24 = score({ grade: '初一', gender: 'male', itemId: 'bmi', rawValue: 24 })
  const bmi24next = score({ grade: '初一', gender: 'male', itemId: 'bmi', rawValue: 24.1 })
  const bmi28 = score({ grade: '初一', gender: 'male', itemId: 'bmi', rawValue: 28 })
  const bmi29 = score({ grade: '初一', gender: 'male', itemId: 'bmi', rawValue: 29 })
  assert(bmi18.ok && bmi18.baseScore === 100, 'A. BMI 18 闭区间 100')
  assert(bmi17.ok && bmi17.baseScore === 80, 'A. BMI <18 → 80')
  assert(bmi24.ok && bmi24.baseScore === 100, 'A. BMI 24 闭区间 100')
  assert(bmi24next.ok && bmi24next.baseScore === 80, 'A. BMI 24.1 → 80')
  assert(bmi28.ok && bmi28.baseScore === 80, 'A. BMI 28 闭区间 80')
  assert(bmi29.ok && bmi29.baseScore === 60, 'A. BMI >28 → 60')

  const reachNeg = score({ grade: '初一', gender: 'female', itemId: 'sit-and-reach', rawValue: -6 })
  const reachZero = score({ grade: '初一', gender: 'female', itemId: 'sit-and-reach', rawValue: 0 })
  const reachMid = score({ grade: '初一', gender: 'female', itemId: 'sit-and-reach', rawValue: 5 })
  const reachTop = score({ grade: '初一', gender: 'female', itemId: 'sit-and-reach', rawValue: 11 })
  assert(reachNeg.ok && reachNeg.baseScore === 60, 'D. 坐位体前屈负数')
  assert(reachZero.ok && reachZero.baseScore === 80, 'B. 0cm → 80')
  assert(reachMid.ok && reachMid.baseScore === 80, 'B. higherBetter 未达下一档')
  assert(reachTop.ok && reachTop.baseScore === 100, 'B. 11cm → 100')

  const runFast = score({ grade: '初一', gender: 'male', itemId: '50m', rawValue: 8 })
  const runMid = score({ grade: '初一', gender: 'male', itemId: '50m', rawValue: 8.01 })
  const runSlow = score({ grade: '初一', gender: 'male', itemId: '50m', rawValue: 11 })
  assert(runFast.ok && runFast.baseScore === 100, 'C. 50米 8秒 100')
  assert(runMid.ok && runMid.baseScore === 80, 'C. LOWER_IS_BETTER 边界')
  assert(runSlow.ok && runSlow.baseScore === 60, 'C. 11秒 60')
  const runBelow = score({ grade: '初一', gender: 'male', itemId: '50m', rawValue: 11.01 })
  assert(
    !runBelow.ok &&
      runBelow.code === NATIONAL_FITNESS_BELOW_OFFICIAL_MINIMUM &&
      runBelow.officialMinimumScore === 60 &&
      !('baseScore' in runBelow),
    'C. 夹具 50米差于最低公布档不返回 0'
  )
  const reachBelow = score({ grade: '初一', gender: 'female', itemId: 'sit-and-reach', rawValue: -6.1 })
  assert(
    !reachBelow.ok && reachBelow.code === NATIONAL_FITNESS_BELOW_OFFICIAL_MINIMUM && !('baseScore' in reachBelow),
    'B. 夹具 higherBetter 差于最低档不返回 0'
  )

  const spec1000 = findNationalFitnessItemSpec('run-1000m')
  assert(spec1000, '1000 spec')
  const seconds = parseNationalFitnessRawValue('3:45', spec1000)
  assert(seconds === 225, 'E. 3:45 → 225 秒')
  const timeScore = score({ grade: '初一', gender: 'male', itemId: 'run-1000m', rawInput: '3:45' })
  const time220 = score({ grade: '初一', gender: 'male', itemId: 'run-1000m', rawValue: 220 })
  assert(timeScore.ok && timeScore.rawValue === 225 && timeScore.baseScore === 80, 'F. 225秒边界 80')
  assert(time220.ok && time220.baseScore === 100, 'F. 220秒 100')

  const pending = score({ grade: '初二', gender: 'male', itemId: '50m', rawValue: 8 })
  assert(!pending.ok && pending.code === 'NOT_VERIFIED' && pending.verificationStatus === 'pending', 'G. pending 不能评分')
  assert(!('baseScore' in pending), 'G. pending 不返回分数')

  const femalePull = calculateNationalFitnessScore({ grade: '初一', gender: 'female', itemId: 'pull-up', rawValue: 10, tables: C1_ENGINE_FIXTURE_TABLES })
  const male800 = calculateNationalFitnessScore({ grade: '初一', gender: 'male', itemId: 'run-800m', rawValue: 220, tables: C1_ENGINE_FIXTURE_TABLES })
  assert(!femalePull.ok && femalePull.code === 'GENDER_MISMATCH', 'H. 女不串男引体')
  assert(!male800.ok && male800.code === 'GENDER_MISMATCH', 'H. 男不串女800')

  const primaryPull = calculateNationalFitnessScore({ grade: '一年级', gender: 'male', itemId: 'pull-up', rawValue: 10, tables: C1_ENGINE_FIXTURE_TABLES })
  const grade2withG7table = calculateNationalFitnessScore({ grade: '初二', gender: 'male', itemId: 'bmi', rawValue: 20, tables: C1_ENGINE_FIXTURE_TABLES })
  assert(!primaryPull.ok && primaryPull.code === 'ITEM_NOT_FOUND', 'I. 小学无引体')
  assert(!grade2withG7table.ok && (grade2withG7table.code === 'NO_TABLE' || grade2withG7table.code === 'NOT_VERIFIED'), 'I. 不按相邻年级推算')

  const engineSrc = readSrc('src/shared/nationalFitness/scoring/engine.ts')
  assert(!engineSrc.includes('calculateExamScore'), 'J. 引擎不调用 calculateExamScore')
  assert(!engineSrc.includes('guangzhou') && !engineSrc.includes('gaokaoSports'), 'J/K. 引擎不引用中考高考表')
  assert(!readSrc('src/shared/nationalFitness/scoring/officialTables.ts').includes('listBuiltinExamStandards'), 'J. 官方仓库不引用考试 catalog')

  const official = listOfficialNationalFitnessScoreTables()
  assert(official.length >= 0, '官方仓库可读')
  const fixtureScore = calculateNationalFitnessScore({ grade: '初一', gender: 'male', itemId: 'bmi', rawValue: 20, tables: C1_ENGINE_FIXTURE_TABLES })
  assert(fixtureScore.ok && fixtureScore.baseScore === 100, '夹具评分仍可用')
  const itemScore = calculateNationalFitnessItemScore({ grade: '初一', gender: 'male', itemKey: 'run-1000m', rawValue: 220 })
  assert(!itemScore.ok && itemScore.code === 'NO_TABLE' && itemScore.message === NATIONAL_FITNESS_SCORE_TABLE_MISSING, 'B 兼容入口仍 fail-closed')

  const matrix = buildNationalFitnessCompletenessMatrix(C1_ENGINE_FIXTURE_TABLES)
  const summary = summarizeNationalFitnessCompleteness(matrix)
  assert(summary.catalog === 156, 'completeness 156 catalog')
  const withFixtures = summarizeNationalFitnessCompleteness(buildNationalFitnessCompletenessMatrix(C1_ENGINE_FIXTURE_TABLES))
  assert(withFixtures.scoreTable === 5 && withFixtures.verified === 4 && withFixtures.autoScoring === 4, '夹具 completeness')

  const okIssues = validateNationalFitnessScoreTables(C1_ENGINE_FIXTURE_TABLES.filter((item) => item.verificationStatus === 'verified'))
  assert(okIssues.length === 0, `夹具 verified 表应通过 validator：${okIssues.map((item) => item.message).join(';')}`)
  const overlap = validateNationalFitnessScoreTable({
    ...C1_ENGINE_FIXTURE_TABLES[0],
    id: 'bad-overlap',
    rangeEntries: [
      { min: 18, max: 24, minInclusive: true, maxInclusive: true, score: 100 },
      { min: 24, max: 28, minInclusive: true, maxInclusive: true, score: 80 }
    ]
  })
  assert(overlap.some((item) => item.code === 'OVERLAP'), 'validator 检出 RANGE 重叠')
  const badDir = validateNationalFitnessScoreTable({
    ...C1_ENGINE_FIXTURE_TABLES[2],
    id: 'bad-dir',
    thresholdEntries: [
      { threshold: 8, inclusive: true, score: 60 },
      { threshold: 11, inclusive: true, score: 100 }
    ]
  })
  assert(badDir.some((item) => item.code === 'DIRECTION'), 'validator 检出 LOWER 方向错误')
  const noSource = validateNationalFitnessScoreTable({
    ...C1_ENGINE_FIXTURE_TABLES[0],
    id: 'bad-source',
    source: null,
    verificationStatus: 'verified'
  })
  assert(noSource.some((item) => item.code === 'SOURCE'), 'validator 要求 verified 带来源')

  const gz = listBuiltinExamStandards().find((item) => item.id === 'cn-gd-guangzhou-middle-2024-2026')
  assert(gz, '广州中考')
  const zhongkao = calculateExamScore({ standard: gz, itemId: 'male-1000m', rawValue: 217, gender: 'male', officialOnly: true })
  assert(zhongkao.ok && zhongkao.score === 100, '中考不被国标引擎影响')
  assert(listBuiltinExamStandards().some((item) => item.examType === 'gaokao_sports'), '高考仍在')

  const run1000 = BUILTIN_TEST_ITEMS.find((item) => item.builtinKey === 'run-1000m')
  const run800 = BUILTIN_TEST_ITEMS.find((item) => item.builtinKey === 'run-800m')
  assert(run1000 && run800, '800/1000 日常项')
  const male = resolveActualTestItem(
    { testGroupId: MIDDLE_LONG_RUN_GROUP_ID, testItemId: run1000.id },
    { genderSnapshot: 'male', resolvedTestItemId: null }
  )
  const female = resolveActualTestItem(
    { testGroupId: MIDDLE_LONG_RUN_GROUP_ID, testItemId: run1000.id },
    { genderSnapshot: 'female', resolvedTestItemId: null }
  )
  assert(GENDER_LINKED_TEST_GROUPS[0]?.id === MIDDLE_LONG_RUN_GROUP_ID, 'L. 组合仍在')
  assert(male.ok && male.item.id === run1000.id && female.ok && female.item.id === run800.id, 'L. 男1000 女800')

  const page = readSrc('src/renderer/src/pages/ExamStandardsPage.tsx')
  assert(page.includes('NATIONAL_FITNESS_SCORE_TABLE_VERIFIED') || page.includes('官方评分表已核验'), 'UI verified 文案')
  assert(page.includes('NATIONAL_FITNESS_SCORE_TABLE_MISSING'), 'UI pending 文案')
  assert(page.includes('buildNationalFitnessCompletenessMatrix') || page.includes('summarizeNationalFitnessCompleteness'), 'UI completeness')

  return 'national-fitness Phase C1 self-check passed'
}

export function runNationalFitnessPhaseC1SelfCheckOrThrow(): string {
  return runNationalFitnessPhaseC1SelfCheck()
}
