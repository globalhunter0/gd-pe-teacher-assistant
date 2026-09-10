import { convertExamBatch } from '../examBatch/convert'
import type { ExamColumnMapping } from '../examBatch/types'
import { listBuiltinExamStandards } from './catalog'
import { cityCoverageStatus, listGuangdongCityCoverage } from './coverage'
import { zhaoqingDotTimeToSeconds } from './data/zhaoqingTables'
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
    assert(
      entries[index].score === score && sameNumber(entries[index].threshold, threshold),
      `${item.id} ${score} 分档阈值应为 ${threshold}，实际 ${entries[index].threshold}`
    )
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

const CLOCK = zhaoqingDotTimeToSeconds

export function runZhaoqingScoringSelfCheck(): string {
  const builtins = listBuiltinExamStandards()
  const zhaoqing = builtins.find((item) => item.id === 'cn-gd-zhaoqing-middle-2026')
  const maoming = builtins.find((item) => item.id === 'cn-gd-maoming-middle-2026')
  const yangjiang = builtins.find((item) => item.id === 'cn-gd-yangjiang-middle-2026')
  const zhongshan = builtins.find((item) => item.id === 'cn-gd-zhongshan-middle-cohort-2023')
  const guangzhou = builtins.find((item) => item.id === 'cn-gd-guangzhou-middle-2024-2026')
  const shaoguan = builtins.find((item) => item.id === 'cn-gd-shaoguan-middle-2026')
  const shantou = builtins.find((item) => item.id === 'cn-gd-shantou-middle-2026')
  const jiangmen = builtins.find((item) => item.id === 'cn-gd-jiangmen-middle-2026')
  const foshan = builtins.find((item) => item.id === 'cn-gd-foshan-middle-2026')
  const zhuhai = builtins.find((item) => item.id === 'cn-gd-zhuhai-middle-2026')
  const shenzhen = builtins.find((item) => item.id === 'cn-gd-shenzhen-middle-2026')
  const dongguan = builtins.find((item) => item.id === 'cn-gd-dongguan-middle-2026-2027')
  const zhanjiang = builtins.find((item) => item.id === 'cn-gd-zhanjiang-middle-2026')

  assert(zhaoqing, '肇庆2026版本缺失')
  assert(zhaoqing.sourceUrl?.includes('zhaoqing.gov.cn/zqjyj'), '肇庆缺少市教育局官方来源')
  assert(zhaoqing.sourceTitle.includes('肇教体〔2026〕3号'), '肇庆来源文件名不正确')
  assert(zhaoqing.policySourceUrl?.includes('293422/3203608.doc'), '肇庆缺少附件1官方Word')
  assert(zhaoqing.totalMaxScore === 70, '肇庆总分必须是70')
  const onsite = zhaoqing.components.filter((item) => item.kind === 'onsite').reduce((sum, item) => sum + item.maxScore, 0)
  const process = zhaoqing.components.filter((item) => item.kind === 'process').reduce((sum, item) => sum + item.maxScore, 0)
  assert(onsite === 55 && process === 15, '肇庆必须是统一考试55+素质综合评价15')
  assert(zhaoqing.groups.some((group) => group.id === 'group-required'), '必考结构缺失')
  assert(zhaoqing.groups.some((group) => group.id === 'group-fitness'), '体能结构缺失')
  assert(zhaoqing.groups.some((group) => group.id === 'group-skill'), '技能结构缺失')
  assert(zhaoqing.status === 'verified' && zhaoqing.ruleStatus === 'verified' && zhaoqing.scoreTableStatus === 'verified', '肇庆方案/评分表状态不正确')
  assert(standardAllowsOfficialConvert(zhaoqing), '肇庆应允许已核验项目自动换算')
  assert(!zhaoqing.notes.includes('一类项目'), '不得套用广州三类结构')
  assert(zhaoqing.notes.includes('3203608.doc'), '应记录已打开的2026评分附件')
  assert(!zhaoqing.notes.includes('套用2021'), '不得暗示沿用2021第三方表')

  const convertible = zhaoqing.items.filter((item) => itemSupportsAutoScore(item))
  const blocked = zhaoqing.items.filter((item) => !itemSupportsAutoScore(item))
  assert(zhaoqing.items.length === 21, `肇庆项目数应为21，实际 ${zhaoqing.items.length}`)
  assert(convertible.length === 19, `可自动换算项目应为19，实际 ${convertible.length}`)
  assert(blocked.every((item) => item.id === 'national-fitness' || item.id === 'pe-class-eval'), '过程性项目以外出现不可换算项')
  assert(
    convertible.every((item) => item.verification === 'verified_supported' && item.scoreRule.kind === 'thresholdTable'),
    '存在宣称可换算但评分表不完整的项目'
  )
  assert(!convertible.some((item) => item.scoreRule.kind === 'thresholdTable' && item.scoreRule.scoreMode !== 'linear'), '肇庆现场表必须按官方每一分值做线性插值')

  const male1000 = requireItem(zhaoqing, 'male-1000m')
  const female800 = requireItem(zhaoqing, 'female-800m')
  const maleSwim = requireItem(zhaoqing, 'male-100m-swim')
  const femaleSwim = requireItem(zhaoqing, 'female-100m-swim')
  const malePull = requireItem(zhaoqing, 'male-pull-up')
  assert(male1000.gender === 'male' && male1000.unit === 's' && male1000.direction === 'lowerBetter', '1000米属性不正确')
  assert(female800.gender === 'female' && female800.direction === 'lowerBetter', '800米属性不正确')
  assert(maleSwim.gender === 'male' && femaleSwim.gender === 'female', '游泳必须分男女表')
  assert(malePull.gender === 'male' && malePull.scoreRule.kind === 'thresholdTable' && malePull.scoreRule.entries.length === 12, '引体向上不得把空档0次补成45–5分')
  assert(requireItem(zhaoqing, 'female-sit-up').gender === 'female', '仰卧起坐必须限女生')
  assert(requireItem(zhaoqing, 'male-50m').timeInputMode === 'seconds', '50米应为秒')
  assert(requireItem(zhaoqing, 'male-football').decimalPlaces === 1, '足球应保留1位')

  assertTableMatches(male1000, [
    [100, CLOCK(3.37)],
    [95, CLOCK(3.45)],
    [90, CLOCK(3.55)],
    [85, CLOCK(4.02)],
    [80, CLOCK(4.09)],
    [75, CLOCK(4.15)],
    [70, CLOCK(4.21)],
    [65, CLOCK(4.26)],
    [60, CLOCK(4.32)],
    [55, CLOCK(4.37)],
    [50, CLOCK(4.42)],
    [45, CLOCK(4.47)],
    [40, CLOCK(4.52)],
    [35, CLOCK(4.56)],
    [30, CLOCK(5.01)],
    [25, CLOCK(5.05)],
    [20, CLOCK(5.09)],
    [15, CLOCK(5.12)],
    [10, CLOCK(5.14)],
    [5, CLOCK(5.16)],
    [0, CLOCK(5.19)]
  ])
  assertTableMatches(female800, [
    [100, CLOCK(3.22)],
    [95, CLOCK(3.31)],
    [90, CLOCK(3.4)],
    [85, CLOCK(3.46)],
    [80, CLOCK(3.52)],
    [75, CLOCK(3.57)],
    [70, CLOCK(4.03)],
    [65, CLOCK(4.09)],
    [60, CLOCK(4.14)],
    [55, CLOCK(4.2)],
    [50, CLOCK(4.26)],
    [45, CLOCK(4.31)],
    [40, CLOCK(4.37)],
    [35, CLOCK(4.41)],
    [30, CLOCK(4.46)],
    [25, CLOCK(4.5)],
    [20, CLOCK(4.54)],
    [15, CLOCK(4.57)],
    [10, CLOCK(4.59)],
    [5, CLOCK(5.01)],
    [0, CLOCK(5.04)]
  ])
  assertTableMatches(maleSwim, [
    [100, CLOCK(2.18)],
    [95, CLOCK(2.3)],
    [90, CLOCK(2.42)],
    [85, CLOCK(2.54)],
    [80, CLOCK(3.06)],
    [75, CLOCK(3.14)],
    [70, CLOCK(3.22)],
    [65, CLOCK(3.3)],
    [60, CLOCK(3.36)],
    [55, CLOCK(3.42)],
    [50, CLOCK(3.48)],
    [45, CLOCK(3.54)],
    [40, CLOCK(4.0)],
    [35, CLOCK(4.06)],
    [30, CLOCK(4.11)],
    [25, CLOCK(4.16)],
    [20, CLOCK(4.21)],
    [15, CLOCK(4.26)],
    [10, CLOCK(4.31)],
    [5, CLOCK(4.34)],
    [0, CLOCK(4.37)]
  ])
  assertTableMatches(requireItem(zhaoqing, 'rope-skip-1min'), [
    [100, 194],
    [95, 179],
    [90, 164],
    [85, 156],
    [80, 148],
    [75, 140],
    [70, 132],
    [65, 124],
    [60, 116],
    [55, 108],
    [50, 100],
    [45, 92],
    [40, 84],
    [35, 76],
    [30, 68],
    [25, 60],
    [20, 52],
    [15, 44],
    [10, 36],
    [5, 28],
    [0, 20]
  ])
  assertTableMatches(malePull, [
    [100, 11],
    [95, 10],
    [90, 9],
    [85, 8],
    [80, 7],
    [75, 6],
    [70, 5],
    [65, 4],
    [60, 3],
    [55, 2],
    [50, 1],
    [0, 0]
  ])

  for (const item of convertible) {
    sampleConvertibleItem(zhaoqing, item)
  }

  assert(parseExamPerformanceInput('3.37', male1000) === CLOCK(3.37), '3.37 分秒解析失败')
  assert(parseExamPerformanceInput('3:37', male1000) === CLOCK(3.37), '3:37 解析失败')
  assert(parseExamPerformanceInput('7.30', requireItem(zhaoqing, 'male-50m')) === 7.3, '50米秒值解析失败')

  const female1000 = calculateExamScore({
    standard: zhaoqing,
    itemId: 'male-1000m',
    rawValue: CLOCK(3.37),
    gender: 'female',
    officialOnly: true
  })
  assert(!female1000.ok, '肇庆男女项目隔离被破坏')
  const male800 = calculateExamScore({
    standard: zhaoqing,
    itemId: 'female-800m',
    rawValue: CLOCK(3.22),
    gender: 'male',
    officialOnly: true
  })
  assert(!male800.ok, '女生800米不得给男生换算')

  const titles = ['姓名', '学号', '班级', '性别', '项目', '成绩']
  const batch = convertExamBatch(
    zhaoqing,
    longMapping(),
    [
      { excelRow: 2, cells: ['甲', '1', '1班', '男', '1000米跑', '3:37'], raw: ['甲', '1', '1班', '男', '1000米跑', '3:37'] },
      { excelRow: 3, cells: ['乙', '2', '1班', '女', '1000米跑', '3:37'], raw: ['乙', '2', '1班', '女', '1000米跑', '3:37'] },
      { excelRow: 4, cells: ['丙', '3', '1班', '男', '一分钟跳绳', '194'], raw: ['丙', '3', '1班', '男', '一分钟跳绳', '194'] },
      { excelRow: 5, cells: ['丁', '4', '1班', '女', '50米跑', '7.90'], raw: ['丁', '4', '1班', '女', '50米跑', '7.90'] }
    ],
    titles
  )
  assert(batch.rows.every((row) => row.examStandardId === zhaoqing.id), '批量未绑定肇庆2026')
  assert(batch.rows[0]?.score === 100 && batch.rows[0]?.examItemId === 'male-1000m', '批量1000米')
  assert(batch.rows[1]?.score == null, '女生不得套用男生1000米')
  assert(batch.rows[2]?.score === 100, '批量跳绳')
  assert(batch.rows[3]?.score === 100, '批量女生50米')

  const raw1000 = CLOCK(3.37)
  const gz = calculateExamScore({ standard: guangzhou!, itemId: 'male-1000m', rawValue: raw1000, gender: 'male', officialOnly: true })
  const sg = calculateExamScore({ standard: shaoguan!, itemId: 'male-1000m', rawValue: raw1000, gender: 'male', officialOnly: true })
  const st = calculateExamScore({ standard: shantou!, itemId: 'male-1000m', rawValue: raw1000, gender: 'male', officialOnly: true })
  const zq = calculateExamScore({ standard: zhaoqing, itemId: 'male-1000m', rawValue: raw1000, gender: 'male', officialOnly: true })
  assert(zq.ok && zq.score === 100, '肇庆3.37应为100')
  assert(gz.ok && sg.ok && st.ok, '对照城市1000米应仍可换算')
  assert(gz.score !== sg.score || st.score !== sg.score, '对照城市必须仍分表')
  assert(zhaoqing.id !== guangzhou!.id && zhaoqing.id !== shaoguan!.id && zhaoqing.id !== shantou!.id, '肇庆不得串用广州韶关汕头版本')
  assert(zhaoqing.id !== maoming?.id, '肇庆不得覆盖茂名')

  const mm = calculateExamScore({
    standard: maoming!,
    itemId: 'male-1000m',
    rawValue: raw1000,
    gender: 'male',
    officialOnly: true
  })
  assert(!mm.ok, '茂名不得因肇庆核验而被打开自动换算')

  assert(maoming && maoming.ruleStatus === 'verified' && maoming.scoreTableStatus === 'missing', '茂名状态被改')
  assert(yangjiang && yangjiang.status === 'partial' && yangjiang.ruleStatus === 'partial' && yangjiang.scoreTableStatus === 'missing', '阳江状态被改')
  assert(zhongshan && zhongshan.ruleStatus === 'verified' && zhongshan.scoreTableStatus === 'missing', '中山状态被改')
  assert(!standardAllowsOfficialConvert(maoming!) && !standardAllowsOfficialConvert(yangjiang!) && !standardAllowsOfficialConvert(zhongshan!), '已完成城市换算被误开')
  assert(guangzhou && standardAllowsOfficialConvert(guangzhou), '广州不受影响')
  assert(jiangmen && standardAllowsOfficialConvert(jiangmen), '江门不受影响')
  assert(foshan && standardAllowsOfficialConvert(foshan), '佛山不受影响')
  assert(zhuhai && standardAllowsOfficialConvert(zhuhai), '珠海不受影响')
  assert(shantou && standardAllowsOfficialConvert(shantou), '汕头不受影响')
  assert(shaoguan && standardAllowsOfficialConvert(shaoguan), '韶关不受影响')
  assert(shenzhen?.status === 'partial' && shenzhen.scoreTableStatus === 'partial', '深圳状态被改')
  assert(dongguan?.status === 'partial' && dongguan.scoreTableStatus === 'partial', '东莞状态被改')
  assert(zhanjiang?.status === 'partial' && zhanjiang.scoreTableStatus === 'partial', '湛江状态被改')

  const coverage = listGuangdongCityCoverage(builtins)
  assert(coverage.length === GD_CITIES.length && GD_CITIES.length === 21, '21市覆盖丢失')
  assert(cityCoverageStatus(builtins, 'zhaoqing') === 'verified', '肇庆覆盖状态应为已核验')
  assert(cityCoverageStatus(builtins, 'maoming') === 'scheme_verified', '茂名覆盖状态被改')
  assert(cityCoverageStatus(builtins, 'yangjiang') === 'partial', '阳江覆盖状态被改')
  assert(cityCoverageStatus(builtins, 'zhongshan') === 'scheme_verified', '中山覆盖状态被改')
  assert(
    findApplicableStandard(builtins, { examType: 'middle_school_exam', citySlug: 'zhaoqing', year: 2026 })?.id === zhaoqing.id,
    '默认查找应命中肇庆2026'
  )

  return 'zhaoqing scoring standards self-check passed'
}

export function runZhaoqingScoringSelfCheckOrThrow(): string {
  return runZhaoqingScoringSelfCheck()
}
