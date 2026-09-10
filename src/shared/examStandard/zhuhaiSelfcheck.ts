import { convertExamBatch } from '../examBatch/convert'
import type { ExamColumnMapping } from '../examBatch/types'
import { listBuiltinExamStandards } from './catalog'
import { cityCoverageStatus, listGuangdongCityCoverage } from './coverage'
import { zhuhaiClockToSeconds } from './data/zhuhaiTables'
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
      return minScore
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
  return minScore
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

const CLOCK = zhuhaiClockToSeconds

export function runZhuhaiScoringSelfCheck(): string {
  const builtins = listBuiltinExamStandards()
  const zhuhai = builtins.find((item) => item.id === 'cn-gd-zhuhai-middle-2026')
  const guangzhou = builtins.find((item) => item.id === 'cn-gd-guangzhou-middle-2024-2026')
  const jiangmen = builtins.find((item) => item.id === 'cn-gd-jiangmen-middle-2026')
  const foshan = builtins.find((item) => item.id === 'cn-gd-foshan-middle-2026')
  const shenzhen = builtins.find((item) => item.id === 'cn-gd-shenzhen-middle-2026')
  const dongguan = builtins.find((item) => item.id === 'cn-gd-dongguan-middle-2026-2027')
  const zhanjiang = builtins.find((item) => item.id === 'cn-gd-zhanjiang-middle-2026')
  const zhongshan = builtins.find((item) => item.id === 'cn-gd-zhongshan-middle-cohort-2023')

  assert(zhuhai, '珠海2026版本缺失')
  assert(zhuhai.sourceUrl?.includes('zhuhai.gov.cn'), '珠海缺少市政府官方来源')
  assert(zhuhai.policySourceUrl?.includes('441710'), '珠海缺少附件3评分标准来源')
  assert(zhuhai.totalMaxScore === 60, '珠海总分不是60')
  assert(zhuhai.status === 'verified' && zhuhai.scoreTableStatus === 'verified', '珠海状态不正确')

  const convertible = zhuhai.items.filter((item) => itemSupportsAutoScore(item))
  const blocked = zhuhai.items.filter((item) => !itemSupportsAutoScore(item))
  assert(zhuhai.items.length === 19, `珠海项目数应为19，实际 ${zhuhai.items.length}`)
  assert(convertible.length === 15, `可自动换算项目应为15，实际 ${convertible.length}`)
  assert(
    blocked.every((item) =>
      ['male-100m-swim', 'female-100m-swim', 'sport-participation', 'national-fitness'].includes(item.id)
    ),
    '除游泳与过程性项目外出现不可换算项'
  )
  assert(
    convertible.every(
      (item) => item.verification === 'verified_supported' && item.scoreRule.kind === 'thresholdTable' && item.scoreRule.entries.length > 0
    ),
    '存在宣称可换算但评分表不完整的项目'
  )

  const male1000 = requireItem(zhuhai, 'male-1000m')
  const female800 = requireItem(zhuhai, 'female-800m')
  const basketballMale = requireItem(zhuhai, 'male-basketball-dribble')
  assert(male1000.maxScore === 110 && male1000.direction === 'lowerBetter' && male1000.timeInputMode === 'minutesSeconds', '1000米属性不正确')
  assert(female800.gender === 'female' && female800.unit === 's', '800米属性不正确')
  assert(requireItem(zhuhai, 'male-200m').timeInputMode === 'seconds', '200米应按秒解析')
  assert(requireItem(zhuhai, 'rope-skip-1min').gender === 'all', '跳绳应男女共用')
  assert(basketballMale.timeInputMode === 'seconds', '篮球运球应是秒')

  assert(scoreOf(zhuhai, 'male-1000m', CLOCK("3'05"), 'male') === 110, '1000米超100满分档')
  assert(scoreOf(zhuhai, 'male-1000m', CLOCK("3'40"), 'male') === 100, '1000米100分档')
  assert(scoreOf(zhuhai, 'male-1000m', CLOCK("3'42"), 'male') === 98, '1000米3:42官方插值应为98')
  assert(scoreOf(zhuhai, 'female-800m', CLOCK("3'25"), 'female') === 100, '800米100分档')
  assert(scoreOf(zhuhai, 'rope-skip-1min', 194, 'male') === 100, '跳绳100分档')
  assert(scoreOf(zhuhai, 'rope-skip-1min', 177, 'female') === 94.33, '跳绳177应按珠海表插值')
  assert(scoreOf(zhuhai, 'male-basketball-dribble', 60, 'male') === 0, '篮球1:00=0分')
  assert(scoreOf(zhuhai, 'female-basketball-dribble', 62, 'female') === 5, '篮球女1:02=5分')

  for (const item of convertible) {
    sampleConvertibleItem(zhuhai, item)
  }

  assert(parseExamPerformanceInput('3:40', male1000) === 220, '1000米 3:40')
  assert(parseExamPerformanceInput("3'40", male1000) === 220, "1000米 3'40")
  assert(parseExamPerformanceInput('3.42', male1000) === 222, '1000米 3.42=3分42秒')
  assert(parseExamPerformanceInput('26.4', requireItem(zhuhai, 'male-200m')) === 26.4, '200米 26.4是秒')
  assert(parseExamPerformanceInput('3.42', basketballMale) === 3.42, '篮球 3.42是秒不是分秒')
  assert(parseExamPerformanceInput('1:00', basketballMale) === 60, '篮球 1:00=60秒')

  for (const item of convertible.filter((entry) => entry.gender === 'male')) {
    const mismatch = calculateExamScore({
      standard: zhuhai,
      itemId: item.id,
      rawValue: tableEntries(item)[0].threshold,
      gender: 'female',
      officialOnly: true
    })
    assert(!mismatch.ok, `${item.id} 女生误用了男生表`)
  }
  for (const item of convertible.filter((entry) => entry.gender === 'female')) {
    const mismatch = calculateExamScore({
      standard: zhuhai,
      itemId: item.id,
      rawValue: tableEntries(item)[0].threshold,
      gender: 'male',
      officialOnly: true
    })
    assert(!mismatch.ok, `${item.id} 男生误用了女生表`)
  }
  assert(!calculateExamScore({ standard: zhuhai, itemId: 'male-1000m', rawValue: 220, gender: 'female', officialOnly: true }).ok, '女生不得用1000米')
  assert(!calculateExamScore({ standard: zhuhai, itemId: 'female-800m', rawValue: 205, gender: 'male', officialOnly: true }).ok, '男生不得用800米')
  assert(
    !calculateExamScore({ standard: zhuhai, itemId: 'male-100m-swim', rawValue: 150, gender: 'male', officialOnly: true }).ok,
    '游泳不得在无数表时自动换算'
  )

  const titles = ['姓名', '学号', '班级', '性别', '项目', '成绩']
  const batch = convertExamBatch(
    zhuhai,
    longMapping(),
    [
      { excelRow: 2, cells: ['甲', '1', '1班', '男', '1000米跑', '3:40'], raw: ['甲', '1', '1班', '男', '1000米跑', '3:40'] },
      { excelRow: 3, cells: ['乙', '2', '1班', '女', '800米跑', '3:25'], raw: ['乙', '2', '1班', '女', '800米跑', '3:25'] },
      { excelRow: 4, cells: ['丙', '3', '1班', '男', '一分钟跳绳', '177'], raw: ['丙', '3', '1班', '男', '一分钟跳绳', '177'] },
      { excelRow: 5, cells: ['丁', '4', '1班', '男', '100米游泳', '2:30'], raw: ['丁', '4', '1班', '男', '100米游泳', '2:30'] }
    ],
    titles
  )
  assert(batch.rows.every((row) => row.examStandardId === zhuhai.id), '批量未绑定珠海2026')
  assert(batch.rows[0]?.score === 100 && batch.rows[0]?.examItemId === 'male-1000m', '批量1000米')
  assert(batch.rows[1]?.score === 100, '批量800米')
  assert(batch.rows[2]?.score === 94.33, '批量跳绳必须用珠海177插值')
  assert(batch.rows[3]?.score == null, '批量游泳不得给分')

  const raw1000 = CLOCK("3'40")
  const gz = calculateExamScore({ standard: guangzhou!, itemId: 'male-1000m', rawValue: raw1000, gender: 'male', officialOnly: true })
  const jm = calculateExamScore({ standard: jiangmen!, itemId: 'male-1000m', rawValue: raw1000, gender: 'male', officialOnly: true })
  const fs = calculateExamScore({ standard: foshan!, itemId: 'male-1000m', rawValue: raw1000, gender: 'male', officialOnly: true })
  const zh = calculateExamScore({ standard: zhuhai, itemId: 'male-1000m', rawValue: raw1000, gender: 'male', officialOnly: true })
  assert(zh.ok && zh.score === 100, '珠海3:40')
  assert(fs.ok && fs.score === 100, '佛山3:40')
  assert(gz.ok && gz.score !== 100, '广州3:40不得碰巧等于珠海100，否则无法证明未串表')
  assert(jm.ok && jm.score !== 100, '江门3:40不得碰巧等于珠海100')

  const ropeZh = scoreOf(zhuhai, 'rope-skip-1min', 177, 'male')
  const ropeGz = calculateExamScore({
    standard: guangzhou!,
    itemId: guangzhou!.items.find((item) => item.itemKey === 'rope-skip-1min')!.id,
    rawValue: 177,
    gender: 'male',
    officialOnly: true
  })
  const ropeFs = calculateExamScore({
    standard: foshan!,
    itemId: 'rope-skip-1min',
    rawValue: 177,
    gender: 'male',
    officialOnly: true
  })
  assert(ropeGz.ok && ropeFs.ok && ropeZh === 94.33 && ropeFs.score === 95 && ropeGz.score !== ropeZh, '跳绳跨城市必须分表')

  assert(standardAllowsOfficialConvert(zhuhai), '珠海应允许自动换算')
  assert(guangzhou && standardAllowsOfficialConvert(guangzhou), '广州不受影响')
  assert(jiangmen && standardAllowsOfficialConvert(jiangmen), '江门不受影响')
  assert(foshan && standardAllowsOfficialConvert(foshan), '佛山不受影响')
  assert(shenzhen?.status === 'partial' && shenzhen.scoreTableStatus === 'partial', '深圳状态被改')
  assert(dongguan?.status === 'partial' && dongguan.scoreTableStatus === 'partial', '东莞状态被改')
  assert(zhanjiang?.status === 'partial' && zhanjiang.scoreTableStatus === 'partial', '湛江状态被改')
  assert(zhongshan && zhongshan.scoreTableStatus === 'missing' && !standardAllowsOfficialConvert(zhongshan), '中山状态被改')
  const coverage = listGuangdongCityCoverage(builtins)
  assert(coverage.length === GD_CITIES.length && GD_CITIES.length === 21, '21市覆盖丢失')
  assert(cityCoverageStatus(builtins, 'zhuhai') === 'verified', '珠海覆盖状态')
  assert(findApplicableStandard(builtins, { examType: 'middle_school_exam', citySlug: 'zhuhai', year: 2026 })?.id === zhuhai.id, '2026查找')

  return 'zhuhai scoring standards self-check passed'
}

export function runZhuhaiScoringSelfCheckOrThrow(): string {
  return runZhuhaiScoringSelfCheck()
}
