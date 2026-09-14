import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { listBuiltinExamStandards } from '../examStandard/catalog'
import { calculateExamScore } from '../examStandard/score'
import { BUILTIN_TEST_ITEMS } from '../peTest/builtinItems'
import { GENDER_LINKED_TEST_GROUPS, MIDDLE_LONG_RUN_GROUP_ID, resolveActualTestItem } from '../peTest/groupedItems'
import { listNationalFitnessEvaluationItems, resolveNationalFitnessItem } from './apply'
import { calculateNationalFitnessScore } from './scoring/engine'
import { calculateNationalFitnessItemScore } from './score'
import {
  NATIONAL_FITNESS_BELOW_OFFICIAL_MINIMUM,
  nationalFitnessBelowOfficialMinimumMessage
} from './scoring/types'
import { listOfficialNationalFitnessScoreTables } from './scoring/officialTables'
import { validateNationalFitnessScoreTables } from './scoring/validator'
import { buildNationalFitnessCompletenessMatrix, listPendingNationalFitnessTables, summarizeNationalFitnessCompleteness } from './scoring/completeness'
import { NATIONAL_FITNESS_SCORE_TABLE_MISSING } from './types'
import { parseNationalFitnessRawValue } from './scoring/time'
import { findNationalFitnessItemSpec } from './items'
import { GRADES } from '../class/types'

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

export function runNationalFitnessPhaseC2SelfCheck(): string {
  const tables = listOfficialNationalFitnessScoreTables()
  assert(tables.length === 156, `K-12 应有 156 张基础表，实际 ${tables.length}`)
  assert(tables.every((item) => item.verificationStatus === 'verified' && item.source?.documentNo === '教体艺〔2014〕5号'), '全部基础表 verified 且文号正确')
  assert(!tables.some((item) => item.source?.tableNo?.includes('表2')), 'C2 不含附加分表')
  const issues = validateNationalFitnessScoreTables(tables)
  assert(issues.length === 0, `validator：${issues.map((item) => `${item.tableId}:${item.message}`).join(';')}`)

  const bmi = score('一年级', 'male', 'bmi', 18.1)
  const bmiLow = score('一年级', 'male', 'bmi', 13.4)
  const bmiLowNext = score('一年级', 'male', 'bmi', 13.5)
  const bmiOver = score('一年级', 'male', 'bmi', 18.2)
  const bmiObese = score('一年级', 'male', 'bmi', 20.4)
  const bmiGapRound = score('一年级', 'male', 'bmi', 18.14)
  assert(bmi.ok && bmi.baseScore === 100, 'A. BMI 正常上限 18.1 → 100')
  assert(bmiLow.ok && bmiLow.baseScore === 80, 'B. BMI ≤13.4 低体重 80')
  assert(bmiLowNext.ok && bmiLowNext.baseScore === 100, 'B. BMI 13.5 正常 100')
  assert(bmiOver.ok && bmiOver.baseScore === 80, 'B. BMI 18.2 超重 80')
  assert(bmiObese.ok && bmiObese.baseScore === 60, 'B. BMI ≥20.4 肥胖 60')
  assert(bmiGapRound.ok && bmiGapRound.baseScore === 100, 'B. 18.14 四舍五入到 18.1 正常')

  const vital = score('三年级', 'male', 'vital-capacity', 2300)
  const vitalMid = score('三年级', 'male', 'vital-capacity', 2299)
  assert(vital.ok && vital.baseScore === 100, 'C. 肺活量 2300 → 100')
  assert(vitalMid.ok && vitalMid.baseScore === 95, 'C. 2299 未达 100 档')

  const run100 = score('一年级', 'male', '50m', 10.2)
  const runBefore = score('一年级', 'male', '50m', 10.1)
  const runAfter = score('一年级', 'male', '50m', 10.3)
  assert(run100.ok && run100.baseScore === 100, 'D. 50米 10.2 → 100')
  assert(runBefore.ok && runBefore.baseScore === 100, 'D. 快于满分仍 100')
  assert(runAfter.ok && runAfter.baseScore === 95, 'D. 10.3 → 95')

  const reach = score('一年级', 'male', 'sit-and-reach', -1.2)
  assert(reach.ok && reach.rawValue === -1.2 && reach.baseScore === 40, 'E. 坐位体前屈负数 -1.2 → 40')

  const skip = score('一年级', 'male', 'skip-1min', 109)
  assert(skip.ok && skip.baseScore === 100, 'F. 跳绳 109 → 100')
  const sit = score('三年级', 'female', 'sit-up-1min', 46)
  assert(sit.ok && sit.baseScore === 100, 'G. 仰卧起坐 46 → 100')

  const shuttle = score('五年级', 'male', 'shuttle-50m-8', 96)
  assert(shuttle.ok && shuttle.rawValue === 96 && shuttle.baseScore === 100, 'H. 50×8 1:36 → 96秒 100')
  const specShuttle = findNationalFitnessItemSpec('shuttle-50m-8')
  assert(specShuttle && parseNationalFitnessRawValue('1:36', specShuttle) === 96, 'H. 时间解析 1:36 → 96')

  const jump = score('初一', 'male', 'standing-long-jump', 225)
  assert(jump.ok && jump.baseScore === 100, 'I. 立定跳远 225 → 100')
  const pull = score('初一', 'male', 'pull-up', 13)
  const pullOne = score('初一', 'male', 'pull-up', 1)
  const pullZero = score('初一', 'male', 'pull-up', 0)
  assert(pull.ok && pull.baseScore === 100, 'J. 引体 13 → 100')
  assert(pullOne.ok && pullOne.baseScore === 30 && pullOne.matchedRule.score === 30, 'A. 引体 1 次命中当前生产表最低公布档（30分），不是伪造 0')
  assert(
    !pullZero.ok &&
      pullZero.code === NATIONAL_FITNESS_BELOW_OFFICIAL_MINIMUM &&
      pullZero.matched === false &&
      pullZero.reason === NATIONAL_FITNESS_BELOW_OFFICIAL_MINIMUM &&
      pullZero.rawValue === 0 &&
      pullZero.officialMinimumScore === 30 &&
      pullZero.message === nationalFitnessBelowOfficialMinimumMessage(30) &&
      !('baseScore' in pullZero),
    'B. 引体 0 次 BELOW_OFFICIAL_MINIMUM，不返回官方 0 分'
  )

  const run50min = score('一年级', 'male', '50m', 13.6)
  const run50below = score('一年级', 'male', '50m', 13.7)
  assert(run50min.ok && run50min.baseScore === 10, 'C. 一年级男 50米 13.6 → 官方 10 分档')
  assert(
    !run50below.ok &&
      run50below.code === NATIONAL_FITNESS_BELOW_OFFICIAL_MINIMUM &&
      run50below.officialMinimumScore === 10 &&
      run50below.message === nationalFitnessBelowOfficialMinimumMessage(10) &&
      !('baseScore' in run50below),
    'D. 一年级男 50米 13.7 差于 10 分档，不返回官方 0 分'
  )
  const run50mid = score('一年级', 'male', '50m', 12.6)
  const run50good = score('一年级', 'male', '50m', 10.6)
  assert(run50mid.ok && run50mid.baseScore === 60, 'E. 60 分档不受影响')
  assert(run50good.ok && run50good.baseScore === 80, 'E. 80 分档不受影响')

  const run800 = score('初一', 'female', 'run-800m', 215)
  const run800b = score('初一', 'female', 'run-800m', 216)
  assert(run800.ok && run800.baseScore === 100, 'K. 800米 3:35 → 100')
  assert(run800b.ok && run800b.baseScore === 95, 'K. 3:36 → 95')
  const run1000 = score('初一', 'male', 'run-1000m', 235)
  const run1000b = calculateNationalFitnessScore({ grade: '初一', gender: 'male', itemId: 'run-1000m', rawInput: '3:56' })
  assert(run1000.ok && run1000.baseScore === 100, 'L. 1000米 3:55 → 100')
  assert(run1000b.ok && run1000b.rawValue === 236 && run1000b.baseScore === 95, 'L. 3:56 → 95')

  assert(!score('初一', 'female', 'pull-up', 13).ok, 'M. 女不串男引体')
  assert(!score('初一', 'male', 'run-800m', 215).ok, 'M. 男不串女800')
  const g1bmi = score('一年级', 'male', 'bmi', 15.4)
  const g7bmi = score('初一', 'male', 'bmi', 15.4)
  assert(g1bmi.ok && g1bmi.baseScore === 100, 'N. 一年级 BMI 15.4 正常')
  assert(g7bmi.ok && g7bmi.baseScore === 80, 'N. 初一 BMI 15.4 低体重，年级不串')

  assert(!resolveNationalFitnessItem({ grade: '一年级', gender: 'male', itemKey: 'pull-up' }).ok, 'O. 小学无引体')
  assert(!resolveNationalFitnessItem({ grade: '一年级', gender: 'male', itemKey: 'run-1000m' }).ok, 'O. 小学无1000')
  assert(listNationalFitnessEvaluationItems('五年级', 'male').some((item) => item.itemKey === 'shuttle-50m-8'), 'O. 五年级有50×8')
  assert(listNationalFitnessEvaluationItems('初一', 'male').every((item) => item.itemKey !== 'skip-1min'), 'P. 初中无跳绳')
  assert(listNationalFitnessEvaluationItems('高三', 'female').some((item) => item.itemKey === 'run-800m'), 'P. 高中女800')

  for (const table of tables) {
    const sample = table.ruleKind === 'range' ? 20 : table.thresholdEntries[0]?.threshold
    if (sample == null) continue
    const result = calculateNationalFitnessScore({ grade: table.grade, gender: table.gender, itemId: table.itemId, rawValue: sample })
    if (result.ok) {
      assert(result.baseScore <= 100 && result.bonusScore === 0 && result.finalItemScore === result.baseScore, 'Q. 基础分≤100 且无附加分')
    }
  }

  const pendingLike = calculateNationalFitnessScore({
    grade: '初一',
    gender: 'male',
    itemId: 'bmi',
    rawValue: 20,
    tables: tables.map((item) => (item.itemId === 'bmi' && item.grade === '初一' && item.gender === 'male' ? { ...item, verificationStatus: 'pending' as const } : item))
  })
  assert(!pendingLike.ok && pendingLike.code === 'NOT_VERIFIED', 'R. pending 不评分')

  const engineSrc = readSrc('src/shared/nationalFitness/scoring/engine.ts')
  assert(!engineSrc.includes('calculateExamScore'), 'S. 不调用中考引擎')
  assert(!engineSrc.includes('gaokaoSports') && !readSrc('src/shared/nationalFitness/scoring/k12BaseTables.ts').includes('middle_school_exam'), 'T. 不引用高考/中考表')

  const run1000Item = BUILTIN_TEST_ITEMS.find((item) => item.builtinKey === 'run-1000m')
  const run800Item = BUILTIN_TEST_ITEMS.find((item) => item.builtinKey === 'run-800m')
  assert(run1000Item && run800Item, '800/1000 日常项')
  const male = resolveActualTestItem({ testGroupId: MIDDLE_LONG_RUN_GROUP_ID, testItemId: run1000Item.id }, { genderSnapshot: 'male', resolvedTestItemId: null })
  const female = resolveActualTestItem({ testGroupId: MIDDLE_LONG_RUN_GROUP_ID, testItemId: run1000Item.id }, { genderSnapshot: 'female', resolvedTestItemId: null })
  assert(GENDER_LINKED_TEST_GROUPS[0]?.id === MIDDLE_LONG_RUN_GROUP_ID, 'U. 组合仍在')
  assert(male.ok && female.ok && male.item.id === run1000Item.id && female.item.id === run800Item.id, 'U. 男1000 女800')

  const gz = listBuiltinExamStandards().find((item) => item.id === 'cn-gd-guangzhou-middle-2024-2026')
  assert(gz, '广州中考')
  const zhongkao = calculateExamScore({ standard: gz, itemId: 'male-1000m', rawValue: 217, gender: 'male', officialOnly: true })
  assert(zhongkao.ok && zhongkao.score === 100, '中考不被国标表影响')
  assert(listBuiltinExamStandards().some((item) => item.examType === 'gaokao_sports'), '高考仍在')
  assert(!calculateNationalFitnessItemScore({ grade: '初一', gender: 'male', itemKey: '50m', rawValue: 8 }).ok, '课堂入口仍不自动国标评分')
  const pullItem = BUILTIN_TEST_ITEMS.find((item) => item.builtinKey === 'pull-up')
  assert(pullItem?.minValue === 0, '课堂引体允许录入并保存 0 次')
  assert(
    !calculateNationalFitnessItemScore({ grade: '初一', gender: 'male', itemKey: 'pull-up', rawValue: 0 }).ok,
    '课堂不把低于表底写成考试官方 0 分'
  )

  const matrix = buildNationalFitnessCompletenessMatrix()
  const summary = summarizeNationalFitnessCompleteness(matrix)
  assert(summary.expected === 156 && summary.catalog === 156, 'completeness 应有 156')
  assert(summary.verified === 156 && summary.pending === 0 && summary.autoScoring === 156, 'C2 基础表全部 verified')
  assert(summary.na === 108 && summary.total === 264, 'N/A 108 / 全矩阵 264')
  assert(listPendingNationalFitnessTables(matrix).length === 0, '无 pending')
  assert(GRADES.length === 12, '12 年级')

  const page = readSrc('src/renderer/src/pages/ExamStandardsPage.tsx')
  assert(page.includes('NATIONAL_FITNESS_SCORE_TABLE_VERIFIED'), 'UI verified')
  assert(page.includes('calculateNationalFitnessScore'), 'UI 接入评分函数')
  assert(page.includes('教体艺〔2014〕5号') || page.includes('documentNo'), 'UI 文号')
  assert(page.includes('NATIONAL_FITNESS_BELOW_OFFICIAL_MINIMUM'), 'UI 低于官方最低档')
  assert(page.includes('nationalFitnessBelowOfficialMinimumMessage(nationalScoreResult.officialMinimumScore)'), 'UI 按当前表 officialMinimumScore 动态文案')
  assert(!page.includes('低于官方评分表最低档（10分档）'), 'UI 不硬编码 10 分档')
  assert(!engineSrc.includes('officialMinimumScore = 10'), '最低公布分不硬编码 10')
  assert(!engineSrc.includes('score: 0'), '引擎不再把表底外成绩写成官方 0 分')

  return 'national-fitness Phase C2 self-check passed'
}

export function runNationalFitnessPhaseC2SelfCheckOrThrow(): string {
  return runNationalFitnessPhaseC2SelfCheck()
}
