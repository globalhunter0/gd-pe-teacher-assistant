import { convertExamBatch } from '../examBatch/convert'
import type { ExamColumnMapping } from '../examBatch/types'
import { listBuiltinExamStandards } from './catalog'
import { cityCoverageStatus, listGuangdongCityCoverage } from './coverage'
import { foshanClockToSeconds } from './data/foshanTables'
import { GD_CITIES } from './regions'
import {
  calculateExamScore,
  findApplicableStandard,
  itemSupportsAutoScore,
  parseExamPerformanceInput,
  standardAllowsOfficialConvert
} from './score'
import type { ExamItemDefinition, ExamStandard } from './types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function scoreOf(standard: ExamStandard, itemId: string, rawValue: number, gender: 'male' | 'female'): number {
  const result = calculateExamScore({
    standard,
    itemId,
    rawValue,
    gender,
    officialOnly: true
  })
  assert(result.ok, `${itemId} 换算失败：${'message' in result ? result.message : ''}`)
  return result.score
}

function requireItem(standard: ExamStandard, itemId: string): ExamItemDefinition {
  const found = standard.items.find((entry) => entry.id === itemId)
  if (!found) {
    throw new Error(`缺少项目 ${itemId}`)
  }
  return found
}

function tableEntries(item: ExamItemDefinition): Array<{ score: number; threshold: number }> {
  assert(item.scoreRule.kind === 'thresholdTable' && item.scoreRule.entries.length > 0, `${item.id} 缺少官方评分表`)
  return [...item.scoreRule.entries]
}

function sameNumber(left: number, right: number): boolean {
  return Math.abs(left - right) < 1e-9
}

function truncateDown2(value: number): number {
  return Math.floor(value * 100 + 1e-8) / 100
}

/** 官方：分段分值，实际评分按每一分值计算到百分之一。 */
function officialLinearExpected(item: ExamItemDefinition, rawValue: number): number {
  const entries = [...tableEntries(item)].sort((a, b) => a.score - b.score)
  const exact = entries.find((entry) => sameNumber(entry.threshold, rawValue))
  if (exact) {
    return exact.score
  }
  const worst = entries[0]
  const best = entries[entries.length - 1]
  if (item.direction === 'lowerBetter') {
    if (rawValue <= best.threshold) {
      return best.score
    }
    if (rawValue > worst.threshold) {
      return item.scoreRule.minScore
    }
    for (let index = 0; index < entries.length - 1; index += 1) {
      const lower = entries[index]
      const higher = entries[index + 1]
      if (rawValue < lower.threshold && rawValue > higher.threshold) {
        return truncateDown2(
          lower.score + ((higher.score - lower.score) * (lower.threshold - rawValue)) / (lower.threshold - higher.threshold)
        )
      }
    }
  } else {
    if (rawValue >= best.threshold) {
      return best.score
    }
    if (rawValue < worst.threshold) {
      return item.scoreRule.minScore
    }
    for (let index = 0; index < entries.length - 1; index += 1) {
      const lower = entries[index]
      const higher = entries[index + 1]
      if (rawValue > lower.threshold && rawValue < higher.threshold) {
        return truncateDown2(
          lower.score + ((higher.score - lower.score) * (rawValue - lower.threshold)) / (higher.threshold - lower.threshold)
        )
      }
    }
  }
  return item.scoreRule.minScore
}

function assertTableMatches(item: ExamItemDefinition, expected: Array<[number, number]>): void {
  const entries = tableEntries(item).sort((a, b) => b.score - a.score)
  assert(entries.length === expected.length, `${item.id} 档位数 ${entries.length} 与官方 ${expected.length} 不一致`)
  const scores = new Set<number>()
  for (let index = 0; index < expected.length; index += 1) {
    const [score, threshold] = expected[index]
    assert(entries[index].score === score && sameNumber(entries[index].threshold, threshold), `${item.id} ${score} 分档阈值应为 ${threshold}，实际 ${entries[index].threshold}`)
    assert(!scores.has(score), `${item.id} 分数档重复 ${score}`)
    scores.add(score)
  }
  const ordered = [...entries].sort((a, b) => a.score - b.score)
  for (let index = 1; index < ordered.length; index += 1) {
    const prev = ordered[index - 1]
    const current = ordered[index]
    if (item.direction === 'lowerBetter') {
      assert(current.threshold < prev.threshold, `${item.id} 越低越好时更高分档阈值必须更小`)
    } else {
      assert(current.threshold > prev.threshold, `${item.id} 越高越好时更高分档阈值必须更大`)
    }
  }
}

function longMapping(): ExamColumnMapping {
  return {
    layout: 'long',
    columns: [
      { kind: 'studentName', sourceColumn: 0, sourceHeader: '姓名' },
      { kind: 'studentNo', sourceColumn: 1, sourceHeader: '学号' },
      { kind: 'className', sourceColumn: 2, sourceHeader: '班级' },
      { kind: 'gender', sourceColumn: 3, sourceHeader: '性别' },
      { kind: 'itemName', sourceColumn: 4, sourceHeader: '项目' },
      { kind: 'rawValue', sourceColumn: 5, sourceHeader: '成绩' }
    ]
  }
}

function sampleConvertibleItem(standard: ExamStandard, item: ExamItemDefinition): void {
  const gender = item.gender === 'female' ? 'female' : 'male'
  const entries = tableEntries(item).sort((a, b) => b.score - a.score)
  const best = entries[0]
  const mid = entries[Math.floor(entries.length / 2)]
  const worst = entries[entries.length - 1]
  assert(scoreOf(standard, item.id, best.threshold, gender) === best.score, `${item.id} 满分档`)
  assert(scoreOf(standard, item.id, mid.threshold, gender) === mid.score, `${item.id} 中间档`)
  assert(scoreOf(standard, item.id, worst.threshold, gender) === worst.score, `${item.id} 最低有效档`)

  if (item.direction === 'lowerBetter') {
    const better = best.threshold - (item.valueType === 'time' ? 1 : 0.01)
    const worse = worst.threshold + (item.valueType === 'time' ? 1 : 0.01)
    assert(scoreOf(standard, item.id, better, gender) === best.score, `${item.id} 优于满分档`)
    assert(scoreOf(standard, item.id, worse, gender) === item.scoreRule.minScore, `${item.id} 超出最差档`)
    if (entries.length >= 2) {
      const next = entries[1]
      const between = (best.threshold + next.threshold) / 2
      const expected = officialLinearExpected(item, between)
      assert(scoreOf(standard, item.id, between, gender) === expected, `${item.id} 相邻档插值 ${between} 应为 ${expected}`)
    }
  } else {
    const better = best.threshold + 1
    const worse = worst.threshold - 1
    assert(scoreOf(standard, item.id, better, gender) === best.score, `${item.id} 优于满分档`)
    assert(scoreOf(standard, item.id, worse, gender) === item.scoreRule.minScore, `${item.id} 低于最低档`)
    if (entries.length >= 2) {
      const next = entries[1]
      const between = (best.threshold + next.threshold) / 2
      if (between !== best.threshold && between !== next.threshold) {
        const expected = officialLinearExpected(item, between)
        assert(scoreOf(standard, item.id, between, gender) === expected, `${item.id} 相邻档插值 ${between} 应为 ${expected}`)
      }
    }
  }
}

const CLOCK = foshanClockToSeconds

export function runFoshanScoringSelfCheck(): string {
  const builtins = listBuiltinExamStandards()
  const foshan2026 = builtins.find((item) => item.id === 'cn-gd-foshan-middle-2026')
  const foshan2025 = builtins.find((item) => item.id === 'cn-gd-foshan-middle-2025')
  const guangzhou = builtins.find((item) => item.id === 'cn-gd-guangzhou-middle-2024-2026')
  const jiangmen = builtins.find((item) => item.id === 'cn-gd-jiangmen-middle-2026')
  const shenzhen = builtins.find((item) => item.id === 'cn-gd-shenzhen-middle-2026')
  const dongguan = builtins.find((item) => item.id === 'cn-gd-dongguan-middle-2026-2027')
  const zhanjiang = builtins.find((item) => item.id === 'cn-gd-zhanjiang-middle-2026')
  const zhongshan = builtins.find((item) => item.id === 'cn-gd-zhongshan-middle-cohort-2023')

  assert(foshan2026 && foshan2025, '佛山2025/2026版本缺失')
  assert(foshan2026.sourceUrl?.includes('edu.foshan.gov.cn'), '佛山2026缺少官方来源')
  assert(foshan2026.policySourceUrl?.includes('7115135.pdf'), '佛山2026缺少附件PDF来源')
  assert(foshan2026.totalMaxScore === 60, '1. 佛山总分不是60')

  const convertible = foshan2026.items.filter((item) => itemSupportsAutoScore(item))
  const blocked = foshan2026.items.filter((item) => !itemSupportsAutoScore(item))
  assert(foshan2026.items.length === 25, `佛山2026项目数应变为25，实际 ${foshan2026.items.length}`)
  assert(convertible.length === 23, `可自动换算项目应为23，实际 ${convertible.length}`)
  assert(blocked.every((item) => item.id === 'national-fitness' || item.id === 'pe-class-eval'), '过程性项目以外出现不可换算项')
  assert(
    convertible.every((item) => item.verification === 'verified_supported' && item.scoreRule.kind === 'thresholdTable' && item.scoreRule.entries.length > 0),
    '存在宣称可换算但评分表不完整的项目，应降为 partial'
  )

  const male1000 = requireItem(foshan2026, 'male-1000m')
  const female800 = requireItem(foshan2026, 'female-800m')
  const maleSwim = requireItem(foshan2026, 'male-100m-swim')
  const femaleSwim = requireItem(foshan2026, 'female-100m-swim')
  const rope = requireItem(foshan2026, 'rope-skip-1min')
  const basketballMale = requireItem(foshan2026, 'male-basketball-dribble')
  const basketballFemale = requireItem(foshan2026, 'female-basketball-dribble')

  assert(male1000.gender === 'male' && male1000.unit === 's' && male1000.direction === 'lowerBetter' && male1000.timeInputMode === 'minutesSeconds', '1000米属性不正确')
  assert(female800.gender === 'female' && female800.unit === 's' && female800.direction === 'lowerBetter', '800米属性不正确')
  assert(maleSwim.gender === 'male' && femaleSwim.gender === 'female' && maleSwim.timeInputMode === 'minutesSeconds', '游泳属性不正确')
  assert(rope.gender === 'all' && rope.unit === 'times' && rope.direction === 'higherBetter', '跳绳属性不正确')
  assert(requireItem(foshan2026, 'male-medicine-ball').unit === 'm' && requireItem(foshan2026, 'male-standing-long-jump').unit === 'm', '跳跃/投掷单位不是米')
  assert(basketballMale.timeInputMode === 'seconds' && basketballFemale.direction === 'lowerBetter', '篮球运球应是秒、越低越好')
  assert(requireItem(foshan2026, 'male-pull-up').gender === 'male', '引体向上必须限男生')

  assertTableMatches(male1000, [
    [100, CLOCK('3:40')],
    [95, CLOCK('3:50')],
    [90, CLOCK('4:00')],
    [85, CLOCK('4:08')],
    [80, CLOCK('4:16')],
    [75, CLOCK('4:21')],
    [70, CLOCK('4:28')],
    [65, CLOCK('4:34')],
    [60, CLOCK('4:40')],
    [55, CLOCK('4:45')],
    [50, CLOCK('4:50')],
    [45, CLOCK('4:55')],
    [40, CLOCK('5:00')],
    [35, CLOCK('5:04')],
    [30, CLOCK('5:09')],
    [25, CLOCK('5:12')],
    [20, CLOCK('5:17')],
    [15, CLOCK('5:19')],
    [10, CLOCK('5:21')],
    [5, CLOCK('5:23')],
    [0, CLOCK('5:25')]
  ])
  assertTableMatches(female800, [
    [100, CLOCK('3:25')],
    [95, CLOCK('3:35')],
    [90, CLOCK('3:45')],
    [85, CLOCK('3:51')],
    [80, CLOCK('3:57')],
    [75, CLOCK('4:02')],
    [70, CLOCK('4:09')],
    [65, CLOCK('4:15')],
    [60, CLOCK('4:21')],
    [55, CLOCK('4:27')],
    [50, CLOCK('4:33')],
    [45, CLOCK('4:39')],
    [40, CLOCK('4:45')],
    [35, CLOCK('4:50')],
    [30, CLOCK('4:55')],
    [25, CLOCK('5:00')],
    [20, CLOCK('5:03')],
    [15, CLOCK('5:05')],
    [10, CLOCK('5:07')],
    [5, CLOCK('5:09')],
    [0, CLOCK('5:10')]
  ])
  assertTableMatches(rope, [
    [100, 182],
    [95, 177],
    [90, 172],
    [85, 167],
    [80, 162],
    [75, 157],
    [70, 152],
    [65, 147],
    [60, 142],
    [55, 132],
    [50, 122],
    [45, 112],
    [40, 102],
    [35, 92],
    [30, 82],
    [25, 72],
    [20, 62],
    [15, 52],
    [10, 42],
    [5, 32],
    [0, 22]
  ])
  assertTableMatches(requireItem(foshan2026, 'male-basketball-shot'), [
    [100, 5],
    [90, 4],
    [80, 3],
    [65, 2],
    [50, 1]
  ])
  assertTableMatches(requireItem(foshan2026, 'male-pull-up'), [
    [100, 15],
    [95, 14],
    [90, 13],
    [85, 12],
    [80, 11],
    [75, 10],
    [70, 9],
    [65, 8],
    [60, 7],
    [55, 6],
    [50, 5],
    [40, 4],
    [30, 3],
    [20, 2],
    [10, 1],
    [0, 0]
  ])

  const gz1000 = guangzhou?.items.find((item) => item.id === 'male-1000m')
  assert(
    gz1000?.scoreRule.kind === 'thresholdTable' && male1000.scoreRule.kind === 'thresholdTable' && !sameNumber(gz1000.scoreRule.entries[0].threshold, CLOCK('3:40')),
    '佛山1000米误用广州满分档'
  )
  const gzRope = guangzhou?.items.find((item) => item.itemKey === 'rope-skip-1min')
  assert(gzRope?.scoreRule.kind === 'thresholdTable' && scoreOf(foshan2026, 'rope-skip-1min', 177, 'male') === 95, '佛山跳绳中间档')
  const gzRope177 = calculateExamScore({
    standard: guangzhou!,
    itemId: gzRope!.id,
    rawValue: 177,
    gender: 'male',
    officialOnly: true
  })
  assert(gzRope177.ok && gzRope177.score !== 95, '广州跳绳177次不应与佛山95分相同，否则无法证明未串表')

  for (const item of convertible) {
    sampleConvertibleItem(foshan2026, item)
  }

  assert(scoreOf(foshan2025, 'rope-skip-1min', 151, 'male') === 81, '官方插值：2025跳绳151次=81分')
  assert(scoreOf(foshan2026, 'rope-skip-1min', 180, 'male') === 98, '2026跳绳180次应按官方百分之一插值为98')
  assert(scoreOf(foshan2026, 'male-1000m', CLOCK('3:45'), 'male') === 97.5, '1000米3:45应按官方插值为97.5')

  assert(parseExamPerformanceInput('3:40', male1000) === 220, '1000米 3:40')
  assert(parseExamPerformanceInput("3'40", male1000) === 220, "1000米 3'40")
  assert(parseExamPerformanceInput('3.40', male1000) === 220, '1000米 3.40=3分40秒')
  assert(parseExamPerformanceInput('3.42', male1000) === 222, '1000米 3.42必须是3分42秒')
  assert(parseExamPerformanceInput('220秒', male1000) === 220, '1000米纯秒')
  assert(parseExamPerformanceInput('3:25', female800) === 205, '800米 3:25')
  assert(parseExamPerformanceInput('2:30', maleSwim) === 150, '游泳 2:30')
  let oneDigitDotFailed = false
  try {
    parseExamPerformanceInput('3.4', male1000)
  } catch {
    oneDigitDotFailed = true
  }
  assert(oneDigitDotFailed, '1000米 3.4 一位小数不得当成分秒')
  assert(parseExamPerformanceInput('17', basketballMale) === 17, '篮球运球纯秒')
  assert(parseExamPerformanceInput('17.5', basketballMale) === 17.5, '篮球运球允许小数秒')
  assert(parseExamPerformanceInput('3.42', basketballMale) === 3.42, '篮球运球 3.42 是3.42秒，不是3分42秒')
  assert(scoreOf(foshan2026, 'male-1000m', parseExamPerformanceInput('3.40', male1000), 'male') === 100, '3.40 换算')
  assert(scoreOf(foshan2026, 'male-basketball-dribble', parseExamPerformanceInput('3.42', basketballMale), 'male') === 100, '篮球3.42秒仍优于满分档')

  for (const item of convertible.filter((entry) => entry.gender === 'male')) {
    const mismatch = calculateExamScore({
      standard: foshan2026,
      itemId: item.id,
      rawValue: tableEntries(item)[0].threshold,
      gender: 'female',
      officialOnly: true
    })
    assert(!mismatch.ok, `${item.id} 女生误用了男生表`)
  }
  for (const item of convertible.filter((entry) => entry.gender === 'female')) {
    const mismatch = calculateExamScore({
      standard: foshan2026,
      itemId: item.id,
      rawValue: tableEntries(item)[0].threshold,
      gender: 'male',
      officialOnly: true
    })
    assert(!mismatch.ok, `${item.id} 男生误用了女生表`)
  }
  assert(!calculateExamScore({ standard: foshan2026, itemId: 'male-1000m', rawValue: 220, gender: 'female', officialOnly: true }).ok, '女生不得用1000米')
  assert(!calculateExamScore({ standard: foshan2026, itemId: 'female-800m', rawValue: 205, gender: 'male', officialOnly: true }).ok, '男生不得用800米')
  assert(scoreOf(foshan2026, 'rope-skip-1min', 182, 'female') === 100, '跳绳男女共用表')

  const titles = ['姓名', '学号', '班级', '性别', '项目', '成绩']
  const batch = convertExamBatch(
    foshan2026,
    longMapping(),
    [
      { excelRow: 2, cells: ['甲', '1', '1班', '男', '1000米跑', '3:40'], raw: ['甲', '1', '1班', '男', '1000米跑', '3:40'] },
      { excelRow: 3, cells: ['乙', '2', '1班', '女', '800米跑', '3:25'], raw: ['乙', '2', '1班', '女', '800米跑', '3:25'] },
      { excelRow: 4, cells: ['丙', '3', '1班', '男', '一分钟跳绳', '177'], raw: ['丙', '3', '1班', '男', '一分钟跳绳', '177'] },
      { excelRow: 5, cells: ['丁', '4', '1班', '女', '一分钟跳绳', '177'], raw: ['丁', '4', '1班', '女', '一分钟跳绳', '177'] }
    ],
    titles
  )
  assert(batch.rows.every((row) => row.examStandardId === foshan2026.id), '批量换算未绑定佛山2026')
  assert(batch.rows[0]?.score === 100 && batch.rows[0]?.examItemId === 'male-1000m', '批量1000米')
  assert(batch.rows[1]?.score === 100 && batch.rows[1]?.examItemId === 'female-800m', '批量800米')
  assert(batch.rows[2]?.score === 95 && batch.rows[3]?.score === 95, '批量跳绳必须用佛山177=95，不能用广州插值')
  const gzBatch = convertExamBatch(
    guangzhou!,
    longMapping(),
    [{ excelRow: 2, cells: ['丙', '3', '1班', '男', '一分钟跳绳', '177'], raw: ['丙', '3', '1班', '男', '一分钟跳绳', '177'] }],
    titles
  )
  assert(gzBatch.rows[0]?.score !== 95, '广州同成绩不得碰巧等于佛山95，否则无法验收串表')

  assert(foshan2026.ruleStatus === 'verified' && foshan2026.scoreTableStatus === 'verified', '佛山2026状态不正确')
  assert(standardAllowsOfficialConvert(foshan2026), '佛山2026应允许自动换算')
  assert(guangzhou && standardAllowsOfficialConvert(guangzhou), '广州不受影响')
  assert(jiangmen && standardAllowsOfficialConvert(jiangmen), '江门不受影响')
  assert(shenzhen?.status === 'partial' && shenzhen.scoreTableStatus === 'partial', '深圳状态被改')
  assert(dongguan?.status === 'partial' && dongguan.scoreTableStatus === 'partial', '东莞状态被改')
  assert(zhanjiang?.status === 'partial' && zhanjiang.scoreTableStatus === 'partial' && !standardAllowsOfficialConvert(zhanjiang), '湛江状态被改')
  assert(zhongshan && zhongshan.scoreTableStatus === 'missing' && !standardAllowsOfficialConvert(zhongshan), '中山换算被误开')
  const coverage = listGuangdongCityCoverage(builtins)
  assert(coverage.length === GD_CITIES.length && GD_CITIES.length === 21, '21市覆盖丢失')
  assert(cityCoverageStatus(builtins, 'foshan') === 'verified', '佛山覆盖状态')
  assert(findApplicableStandard(builtins, { examType: 'middle_school_exam', citySlug: 'foshan', year: 2026 })?.id === foshan2026.id, '2026查找')
  assert(findApplicableStandard(builtins, { examType: 'middle_school_exam', citySlug: 'foshan', year: 2025 })?.id === foshan2025.id, '2025被覆盖')

  return 'foshan scoring standards self-check passed'
}

export function runFoshanScoringSelfCheckOrThrow(): string {
  return runFoshanScoringSelfCheck()
}
