import { convertExamBatch } from '../examBatch/convert'
import type { ExamColumnMapping } from '../examBatch/types'
import { listBuiltinExamStandards } from './catalog'
import { cityCoverageStatus, listGuangdongCityCoverage } from './coverage'
import { shantouClockToSeconds } from './data/shantouTables'
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

function truncateDown1(value: number): number {
  return Math.floor(value * 10 + 1e-8) / 10
}

function officialLinearExpected(item: ExamItemDefinition, rawValue: number): number {
  assert(item.scoreRule.kind === 'thresholdTable', `${item.id} 不是对照表`)
  const entries = [...tableEntries(item)].sort((a, b) => a.score - b.score)
  const exact = entries.find((entry) => sameNumber(entry.threshold, rawValue))
  if (exact) {
    return exact.score
  }
  const worst = entries[0]
  const best = entries[entries.length - 1]
  const minScore = item.scoreRule.minScore
  if (item.direction === 'lowerBetter') {
    if (rawValue <= best.threshold) {
      return best.score
    }
    if (rawValue > worst.threshold) {
      return minScore
    }
    for (let index = 0; index < entries.length - 1; index += 1) {
      const lower = entries[index]
      const higher = entries[index + 1]
      if (rawValue < lower.threshold && rawValue > higher.threshold) {
        return truncateDown1(
          lower.score + ((higher.score - lower.score) * (lower.threshold - rawValue)) / (lower.threshold - higher.threshold)
        )
      }
    }
  } else {
    if (rawValue >= best.threshold) {
      return best.score
    }
    if (rawValue < worst.threshold) {
      return minScore
    }
    for (let index = 0; index < entries.length - 1; index += 1) {
      const lower = entries[index]
      const higher = entries[index + 1]
      if (rawValue > lower.threshold && rawValue < higher.threshold) {
        return truncateDown1(
          lower.score + ((higher.score - lower.score) * (rawValue - lower.threshold)) / (higher.threshold - lower.threshold)
        )
      }
    }
  }
  return minScore
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
    const better = best.threshold - 1
    const worse = worst.threshold + 1
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

const CLOCK = shantouClockToSeconds

export function runShantouScoringSelfCheck(): string {
  const builtins = listBuiltinExamStandards()
  const shantou = builtins.find((item) => item.id === 'cn-gd-shantou-middle-2026')
  const guangzhou = builtins.find((item) => item.id === 'cn-gd-guangzhou-middle-2024-2026')
  const jiangmen = builtins.find((item) => item.id === 'cn-gd-jiangmen-middle-2026')
  const foshan = builtins.find((item) => item.id === 'cn-gd-foshan-middle-2026')
  const zhuhai = builtins.find((item) => item.id === 'cn-gd-zhuhai-middle-2026')
  const shenzhen = builtins.find((item) => item.id === 'cn-gd-shenzhen-middle-2026')
  const dongguan = builtins.find((item) => item.id === 'cn-gd-dongguan-middle-2026-2027')
  const zhanjiang = builtins.find((item) => item.id === 'cn-gd-zhanjiang-middle-2026')
  const zhongshan = builtins.find((item) => item.id === 'cn-gd-zhongshan-middle-cohort-2023')

  assert(shantou, '汕头2026版本缺失')
  assert(shantou.sourceUrl?.includes('shantou.gov.cn'), '汕头缺少市政府官方来源')
  assert(shantou.policySourceUrl?.includes('144641'), '汕头缺少实施方案Word附件')
  assert(shantou.totalMaxScore === 70, '汕头总分不是70')
  assert(shantou.status === 'verified' && shantou.scoreTableStatus === 'verified', '汕头状态不正确')

  const convertible = shantou.items.filter((item) => itemSupportsAutoScore(item))
  const blocked = shantou.items.filter((item) => !itemSupportsAutoScore(item))
  assert(shantou.items.length === 10, `汕头项目数应为10，实际 ${shantou.items.length}`)
  assert(convertible.length === 9, `可自动换算项目应为9，实际 ${convertible.length}`)
  assert(blocked.every((item) => item.id === 'national-fitness'), '除国标外出现不可换算项')
  assert(
    convertible.every(
      (item) =>
        item.verification === 'verified_supported' &&
        item.scoreRule.kind === 'thresholdTable' &&
        item.scoreRule.scorePrecision === 1 &&
        item.scoreRule.entries.length > 0
    ),
    '存在宣称可换算但评分表不完整或精度不是十分之一的项目'
  )

  const male1000 = requireItem(shantou, 'male-1000m')
  const female800 = requireItem(shantou, 'female-800m')
  const pullUp = requireItem(shantou, 'male-pull-up')
  assert(male1000.maxScore === 120 && male1000.timeInputMode === 'minutesSeconds' && male1000.decimalPlaces === 1, '1000米属性不正确')
  assert(female800.gender === 'female', '800米必须限女生')
  assert(requireItem(shantou, 'rope-skip-1min').gender === 'all', '跳绳应男女共用')
  assert(!tableEntries(pullUp).some((entry) => entry.score === 70 || entry.score === 60), '引体向上把官方空档补成了猜测数据')

  assertTableMatches(male1000, [
    [120, CLOCK("2'57")],
    [115, CLOCK("3'07")],
    [110, CLOCK("3'17")],
    [105, CLOCK("3'27")],
    [100, CLOCK("3'37")],
    [95, CLOCK("3'45")],
    [90, CLOCK("3'53")],
    [85, CLOCK("4'01")],
    [80, CLOCK("4'09")],
    [75, CLOCK("4'17")],
    [70, CLOCK("4'25")],
    [65, CLOCK("4'30")],
    [60, CLOCK("4'35")],
    [55, CLOCK("4'40")],
    [50, CLOCK("4'45")],
    [45, CLOCK("4'50")],
    [40, CLOCK("4'55")],
    [35, CLOCK("5'00")],
    [30, CLOCK("5'05")],
    [25, 360]
  ])
  assertTableMatches(pullUp, [
    [120, 21],
    [115, 19],
    [110, 17],
    [105, 15],
    [100, 13],
    [95, 11],
    [90, 10],
    [85, 9],
    [80, 8],
    [75, 7],
    [65, 6],
    [55, 5],
    [45, 4],
    [35, 3],
    [25, 1]
  ])

  assert(scoreOf(shantou, 'male-1000m', CLOCK("2'57"), 'male') === 120, '1000米120分档')
  assert(scoreOf(shantou, 'male-1000m', CLOCK("3'37"), 'male') === 100, '1000米100分档')
  assert(scoreOf(shantou, 'male-1000m', CLOCK("3'40"), 'male') === 98.1, '1000米3:40应按十分之一插值为98.1')
  assert(scoreOf(shantou, 'female-800m', CLOCK("3'22"), 'female') === 100, '800米100分档')
  assert(scoreOf(shantou, 'rope-skip-1min', 179, 'male') === 100, '跳绳100分档')
  assert(scoreOf(shantou, 'rope-skip-1min', 177, 'female') === 99.3, '跳绳177应按十分之一插值')
  assert(scoreOf(shantou, 'male-pull-up', 1, 'male') === 25, '引体向上规范完成1次=25')
  assert(scoreOf(shantou, 'male-standing-long-jump', 1.95, 'male') === 0, '立定跳远无25分距离档，低于30分档为0')

  for (const item of convertible) {
    sampleConvertibleItem(shantou, item)
  }

  assert(parseExamPerformanceInput('3:37', male1000) === 217, '1000米 3:37')
  assert(parseExamPerformanceInput("3'40", male1000) === 220, "1000米 3'40")
  assert(parseExamPerformanceInput('3.40', male1000) === 220, '1000米 3.40=3分40秒')
  assert(parseExamPerformanceInput('3.42', male1000) === 222, '1000米 3.42不得当3.42秒')
  assert(parseExamPerformanceInput('2.45', requireItem(shantou, 'male-standing-long-jump')) === 2.45, '跳远 2.45是米')

  for (const item of convertible.filter((entry) => entry.gender === 'male')) {
    const mismatch = calculateExamScore({
      standard: shantou,
      itemId: item.id,
      rawValue: tableEntries(item)[0].threshold,
      gender: 'female',
      officialOnly: true
    })
    assert(!mismatch.ok, `${item.id} 女生误用了男生表`)
  }
  for (const item of convertible.filter((entry) => entry.gender === 'female')) {
    const mismatch = calculateExamScore({
      standard: shantou,
      itemId: item.id,
      rawValue: tableEntries(item)[0].threshold,
      gender: 'male',
      officialOnly: true
    })
    assert(!mismatch.ok, `${item.id} 男生误用了女生表`)
  }
  assert(!calculateExamScore({ standard: shantou, itemId: 'male-1000m', rawValue: 217, gender: 'female', officialOnly: true }).ok, '女生不得用1000米')
  assert(!calculateExamScore({ standard: shantou, itemId: 'female-800m', rawValue: 202, gender: 'male', officialOnly: true }).ok, '男生不得用800米')
  assert(!calculateExamScore({ standard: shantou, itemId: 'male-pull-up', rawValue: 13, gender: 'female', officialOnly: true }).ok, '女生不得用引体向上')

  const titles = ['姓名', '学号', '班级', '性别', '项目', '成绩']
  const batch = convertExamBatch(
    shantou,
    longMapping(),
    [
      { excelRow: 2, cells: ['甲', '1', '1班', '男', '1000米跑', '3:37'], raw: ['甲', '1', '1班', '男', '1000米跑', '3:37'] },
      { excelRow: 3, cells: ['乙', '2', '1班', '女', '800米跑', '3:22'], raw: ['乙', '2', '1班', '女', '800米跑', '3:22'] },
      { excelRow: 4, cells: ['丙', '3', '1班', '男', '一分钟跳绳', '177'], raw: ['丙', '3', '1班', '男', '一分钟跳绳', '177'] },
      { excelRow: 5, cells: ['丁', '4', '1班', '男', '引体向上', '13'], raw: ['丁', '4', '1班', '男', '引体向上', '13'] }
    ],
    titles
  )
  assert(batch.rows.every((row) => row.examStandardId === shantou.id), '批量未绑定汕头2026')
  assert(batch.rows[0]?.score === 100 && batch.rows[0]?.examItemId === 'male-1000m', '批量1000米')
  assert(batch.rows[1]?.score === 100, '批量800米')
  assert(batch.rows[2]?.score === 99.3, '批量跳绳必须用汕头十分之一插值')
  assert(batch.rows[3]?.score === 100, '批量引体向上')

  const raw1000 = CLOCK("3'40")
  const gz = calculateExamScore({ standard: guangzhou!, itemId: 'male-1000m', rawValue: raw1000, gender: 'male', officialOnly: true })
  const jm = calculateExamScore({ standard: jiangmen!, itemId: 'male-1000m', rawValue: raw1000, gender: 'male', officialOnly: true })
  const fs = calculateExamScore({ standard: foshan!, itemId: 'male-1000m', rawValue: raw1000, gender: 'male', officialOnly: true })
  const zh = calculateExamScore({ standard: zhuhai!, itemId: 'male-1000m', rawValue: raw1000, gender: 'male', officialOnly: true })
  const st = calculateExamScore({ standard: shantou, itemId: 'male-1000m', rawValue: raw1000, gender: 'male', officialOnly: true })
  assert(st.ok && st.score === 98.1, '汕头3:40')
  assert(gz.ok && gz.score === 98.12, '广州3:40应为百分之一98.12，与汕头十分之一不同')
  assert(fs.ok && fs.score === 100, '佛山3:40')
  assert(zh.ok && zh.score === 100, '珠海3:40')
  assert(jm.ok && jm.score !== 98.1 && jm.score !== 100, '江门3:40不得串成汕头或满分')

  const ropeSt = scoreOf(shantou, 'rope-skip-1min', 177, 'male')
  const ropeZh = calculateExamScore({ standard: zhuhai!, itemId: 'rope-skip-1min', rawValue: 177, gender: 'male', officialOnly: true })
  const ropeFs = calculateExamScore({ standard: foshan!, itemId: 'rope-skip-1min', rawValue: 177, gender: 'male', officialOnly: true })
  assert(ropeZh.ok && ropeFs.ok && ropeSt === 99.3 && ropeZh.score === 94.33 && ropeFs.score === 95, '跳绳跨城市必须分表')

  assert(standardAllowsOfficialConvert(shantou), '汕头应允许自动换算')
  assert(guangzhou && standardAllowsOfficialConvert(guangzhou), '广州不受影响')
  assert(jiangmen && standardAllowsOfficialConvert(jiangmen), '江门不受影响')
  assert(foshan && standardAllowsOfficialConvert(foshan), '佛山不受影响')
  assert(zhuhai && standardAllowsOfficialConvert(zhuhai), '珠海不受影响')
  assert(shenzhen?.status === 'partial' && shenzhen.scoreTableStatus === 'partial', '深圳状态被改')
  assert(dongguan?.status === 'partial' && dongguan.scoreTableStatus === 'partial', '东莞状态被改')
  assert(zhanjiang?.status === 'partial' && zhanjiang.scoreTableStatus === 'partial', '湛江状态被改')
  assert(zhongshan && zhongshan.scoreTableStatus === 'missing' && !standardAllowsOfficialConvert(zhongshan), '中山状态被改')
  const coverage = listGuangdongCityCoverage(builtins)
  assert(coverage.length === GD_CITIES.length && GD_CITIES.length === 21, '21市覆盖丢失')
  assert(cityCoverageStatus(builtins, 'shantou') === 'verified', '汕头覆盖状态')
  assert(findApplicableStandard(builtins, { examType: 'middle_school_exam', citySlug: 'shantou', year: 2026 })?.id === shantou.id, '2026查找')

  return 'shantou scoring standards self-check passed'
}

export function runShantouScoringSelfCheckOrThrow(): string {
  return runShantouScoringSelfCheck()
}
