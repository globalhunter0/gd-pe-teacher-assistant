import { convertExamBatch } from '../examBatch/convert'
import type { ExamColumnMapping } from '../examBatch/types'
import { listBuiltinExamStandards } from './catalog'
import { cityCoverageStatus, listGuangdongCityCoverage } from './coverage'
import { shaoguanClockToSeconds } from './data/shaoguanTables'
import { GD_CITIES } from './regions'
import {
  calculateExamScore,
  findApplicableStandard,
  itemSupportsAutoScore,
  parseExamPerformanceInput,
  scoreFromThresholdTable,
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
      const expected = scoreFromThresholdTable(between, item).score
      assert(scoreOf(standard, item.id, between, gender) === expected, `${item.id} 相邻档 ${between} 应为 ${expected}`)
    }
  } else {
    const better = best.threshold + 1
    const worse = worst.threshold - (item.unit === 'times' ? 1 : 0.01)
    assert(scoreOf(standard, item.id, better, gender) === best.score, `${item.id} 优于满分档`)
    if (worse < worst.threshold) {
      assert(scoreOf(standard, item.id, worse, gender) === item.scoreRule.minScore, `${item.id} 低于最低档`)
    }
    if (entries.length >= 2) {
      const next = entries[1]
      const between = (best.threshold + next.threshold) / 2
      if (between !== best.threshold && between !== next.threshold) {
        const expected = scoreFromThresholdTable(between, item).score
        assert(scoreOf(standard, item.id, between, gender) === expected, `${item.id} 相邻档 ${between} 应为 ${expected}`)
      }
    }
  }
}

const CLOCK = shaoguanClockToSeconds

export function runShaoguanScoringSelfCheck(): string {
  const builtins = listBuiltinExamStandards()
  const shaoguan = builtins.find((item) => item.id === 'cn-gd-shaoguan-middle-2026')
  const guangzhou = builtins.find((item) => item.id === 'cn-gd-guangzhou-middle-2024-2026')
  const jiangmen = builtins.find((item) => item.id === 'cn-gd-jiangmen-middle-2026')
  const foshan = builtins.find((item) => item.id === 'cn-gd-foshan-middle-2026')
  const zhuhai = builtins.find((item) => item.id === 'cn-gd-zhuhai-middle-2026')
  const shantou = builtins.find((item) => item.id === 'cn-gd-shantou-middle-2026')
  const shenzhen = builtins.find((item) => item.id === 'cn-gd-shenzhen-middle-2026')
  const dongguan = builtins.find((item) => item.id === 'cn-gd-dongguan-middle-2026-2027')
  const zhanjiang = builtins.find((item) => item.id === 'cn-gd-zhanjiang-middle-2026')
  const zhongshan = builtins.find((item) => item.id === 'cn-gd-zhongshan-middle-cohort-2023')

  assert(shaoguan, '韶关2026版本缺失')
  assert(shaoguan.sourceUrl?.includes('sg.gov.cn'), '韶关缺少市政府官方来源')
  assert(shaoguan.policySourceUrl?.includes('2806815.pdf'), '韶关缺少评分标准PDF附件')
  assert(shaoguan.totalMaxScore === 100, '韶关总分不是100')
  assert(shaoguan.status === 'verified' && shaoguan.scoreTableStatus === 'verified', '韶关状态不正确')
  assert(shaoguan.yearFrom === 2026 && shaoguan.yearTo === 2026, '韶关适用年份不正确')

  const convertible = shaoguan.items.filter((item) => itemSupportsAutoScore(item))
  const blocked = shaoguan.items.filter((item) => !itemSupportsAutoScore(item))
  assert(shaoguan.items.length === 13, `韶关项目数应为13，实际 ${shaoguan.items.length}`)
  assert(convertible.length === 13 && blocked.length === 0, '韶关应全部可自动换算')
  assert(shaoguan.groups.length === 3 && shaoguan.components.length === 1, '韶关三类结构不正确')

  const male1000 = requireItem(shaoguan, 'male-1000m')
  const female800 = requireItem(shaoguan, 'female-800m')
  const rope = requireItem(shaoguan, 'rope-skip-1min')
  const pullUp = requireItem(shaoguan, 'male-pull-up')
  const frogMale = requireItem(shaoguan, 'male-triple-frog')
  assert(male1000.timeInputMode === 'minutesSeconds' && male1000.maxScore === 120, '1000米属性不正确')
  assert(female800.gender === 'female' && requireItem(shaoguan, 'male-100m-swim').maxScore === 150, '游泳折算满分应为150')
  assert(rope.gender === 'all' && pullUp.gender === 'male', '跳绳/引体性别不正确')
  assert(male1000.scoreRule.kind === 'thresholdTable' && male1000.scoreRule.scoreMode === 'step', '韶关必须用档位制')

  assertTableMatches(male1000, Array.from({ length: 121 }, (_, index) => {
    const score = 120 - index
    return [score, CLOCK('3:05') + index] as [number, number]
  }))
  assert(
    tableEntries(rope).find((entry) => entry.score === 100)?.threshold === 179 &&
      tableEntries(rope).find((entry) => entry.score === 0)?.threshold === 10,
    '跳绳100/0档不正确'
  )
  assert(tableEntries(frogMale).find((entry) => entry.score === 120)?.threshold === 8.8, '男蛙跳满分档')
  assert(tableEntries(pullUp).find((entry) => entry.score === 100)?.threshold === 15, '引体普通考生满分应为15次')
  assert(tableEntries(pullUp).every((entry) => entry.threshold <= 15), '引体不得串入择考/平行梯列')

  assert(scoreOf(shaoguan, 'male-1000m', CLOCK('3:05'), 'male') === 120, '1000米120分档')
  assert(scoreOf(shaoguan, 'male-1000m', CLOCK('3:25'), 'male') === 100, '1000米100分档')
  assert(scoreOf(shaoguan, 'male-1000m', CLOCK('3:40'), 'male') === 85, '1000米3:40=85')
  assert(scoreOf(shaoguan, 'male-1000m', CLOCK('5:05'), 'male') === 0, '1000米最低档')
  assert(scoreOf(shaoguan, 'male-1000m', CLOCK('5:06'), 'male') === 0, '1000米超范围')
  assert(scoreOf(shaoguan, 'female-800m', CLOCK('2:50'), 'female') === 120, '800米满分')
  assert(scoreOf(shaoguan, 'female-800m', CLOCK('3:10'), 'female') === 100, '800米100分档')
  assert(scoreOf(shaoguan, 'rope-skip-1min', 239, 'male') === 120, '跳绳满分')
  assert(scoreOf(shaoguan, 'rope-skip-1min', 179, 'female') === 100, '跳绳100分档')
  assert(scoreOf(shaoguan, 'rope-skip-1min', 177, 'male') === 99, '跳绳177应按档位得99，不得插值')
  assert(scoreOf(shaoguan, 'male-100m-swim', CLOCK('6:00'), 'male') === 150, '游泳6:00折算150')
  assert(scoreOf(shaoguan, 'female-100m-swim', CLOCK('6:00'), 'female') === 150, '女游泳折算')
  assert(scoreOf(shaoguan, 'male-100m-swim', CLOCK('5:59'), 'male') === 150, '游泳优于满分')
  assert(scoreOf(shaoguan, 'male-100m-swim', CLOCK('6:40'), 'male') === 90, '游泳表内60分折算90')
  assert(scoreOf(shaoguan, 'male-100m-swim', CLOCK('7:40'), 'male') === 0, '游泳7:40=0')
  assert(scoreOf(shaoguan, 'male-shot-put', 10.8, 'male') === 100, '男铅球满分')
  assert(scoreOf(shaoguan, 'female-shot-put', 7.2, 'female') === 100, '女铅球满分')
  assert(scoreOf(shaoguan, 'male-pull-up', 15, 'male') === 100, '引体满分')
  assert(scoreOf(shaoguan, 'male-pull-up', 11, 'male') === 83, '引体11次=83')
  assert(scoreOf(shaoguan, 'female-parallel-ladder', 16, 'female') === 100, '平行梯满分')
  assert(scoreOf(shaoguan, 'male-volleyball', 40, 'male') === 100, '男排球100分档')
  assert(scoreOf(shaoguan, 'female-volleyball', 35, 'female') === 100, '女排球100分档')

  for (const item of convertible) {
    sampleConvertibleItem(shaoguan, item)
  }

  assert(parseExamPerformanceInput('3:40', male1000) === 220, '1000米 3:40')
  assert(parseExamPerformanceInput("3'40", male1000) === 220, "1000米 3'40")
  assert(parseExamPerformanceInput('3.40', male1000) === 220, '1000米 3.40是分秒')
  assert(parseExamPerformanceInput('220', male1000) === 220, '1000米 220秒')
  assert(parseExamPerformanceInput('8.80', frogMale) === 8.8, '蛙跳 8.80是米不是分秒')
  assert(parseExamPerformanceInput('10.80', requireItem(shaoguan, 'male-shot-put')) === 10.8, '铅球小数是米')

  for (const item of convertible.filter((entry) => entry.gender === 'male')) {
    const mismatch = calculateExamScore({
      standard: shaoguan,
      itemId: item.id,
      rawValue: tableEntries(item)[0].threshold,
      gender: 'female',
      officialOnly: true
    })
    assert(!mismatch.ok, `${item.id} 女生误用了男生表`)
  }
  for (const item of convertible.filter((entry) => entry.gender === 'female')) {
    const mismatch = calculateExamScore({
      standard: shaoguan,
      itemId: item.id,
      rawValue: tableEntries(item)[0].threshold,
      gender: 'male',
      officialOnly: true
    })
    assert(!mismatch.ok, `${item.id} 男生误用了女生表`)
  }
  assert(!calculateExamScore({ standard: shaoguan, itemId: 'male-1000m', rawValue: 220, gender: 'female', officialOnly: true }).ok, '女生不得用1000米')
  assert(!calculateExamScore({ standard: shaoguan, itemId: 'female-800m', rawValue: 190, gender: 'male', officialOnly: true }).ok, '男生不得用800米')
  assert(scoreOf(shaoguan, 'rope-skip-1min', 179, 'male') === scoreOf(shaoguan, 'rope-skip-1min', 179, 'female'), '跳绳男女共用')

  const titles = ['姓名', '学号', '班级', '性别', '项目', '成绩']
  const batch = convertExamBatch(
    shaoguan,
    longMapping(),
    [
      { excelRow: 2, cells: ['甲', '1', '1班', '男', '1000米跑', '3:40'], raw: ['甲', '1', '1班', '男', '1000米跑', '3:40'] },
      { excelRow: 3, cells: ['乙', '2', '1班', '女', '800米跑', '3:10'], raw: ['乙', '2', '1班', '女', '800米跑', '3:10'] },
      { excelRow: 4, cells: ['丙', '3', '1班', '男', '一分钟跳绳', '177'], raw: ['丙', '3', '1班', '男', '一分钟跳绳', '177'] },
      { excelRow: 5, cells: ['丁', '4', '1班', '男', '100米游泳', '6:00'], raw: ['丁', '4', '1班', '男', '100米游泳', '6:00'] }
    ],
    titles
  )
  assert(batch.rows.every((row) => row.examStandardId === shaoguan.id), '批量未绑定韶关2026')
  assert(batch.rows[0]?.score === 85 && batch.rows[0]?.examItemId === 'male-1000m', '批量1000米必须用韶关档位')
  assert(batch.rows[1]?.score === 100, '批量800米')
  assert(batch.rows[2]?.score === 99, '批量跳绳177必须是韶关99')
  assert(batch.rows[3]?.score === 150, '批量游泳必须按1:1.5折算')

  const raw1000 = CLOCK('3:40')
  const gz = calculateExamScore({ standard: guangzhou!, itemId: 'male-1000m', rawValue: raw1000, gender: 'male', officialOnly: true })
  const st = calculateExamScore({ standard: shantou!, itemId: 'male-1000m', rawValue: raw1000, gender: 'male', officialOnly: true })
  const fs = calculateExamScore({ standard: foshan!, itemId: 'male-1000m', rawValue: raw1000, gender: 'male', officialOnly: true })
  const zh = calculateExamScore({ standard: zhuhai!, itemId: 'male-1000m', rawValue: raw1000, gender: 'male', officialOnly: true })
  const sg = calculateExamScore({ standard: shaoguan, itemId: 'male-1000m', rawValue: raw1000, gender: 'male', officialOnly: true })
  assert(sg.ok && sg.score === 85, '韶关3:40')
  assert(st.ok && st.score === 98.1, '汕头3:40隔离')
  assert(gz.ok && gz.score !== 85, '广州3:40不得等于韶关85')
  assert(fs.ok && fs.score === 100 && zh.ok && zh.score === 100, '佛山/珠海3:40仍为100')

  const ropeSg = scoreOf(shaoguan, 'rope-skip-1min', 177, 'male')
  const ropeSt = calculateExamScore({
    standard: shantou!,
    itemId: 'rope-skip-1min',
    rawValue: 177,
    gender: 'male',
    officialOnly: true
  })
  const ropeZh = calculateExamScore({
    standard: zhuhai!,
    itemId: 'rope-skip-1min',
    rawValue: 177,
    gender: 'male',
    officialOnly: true
  })
  assert(ropeSg === 99 && ropeSt.ok && ropeSt.score === 99.3 && ropeZh.ok && ropeZh.score === 94.33, '跳绳跨城市必须分表')

  assert(standardAllowsOfficialConvert(shaoguan), '韶关应允许自动换算')
  assert(guangzhou && standardAllowsOfficialConvert(guangzhou), '广州不受影响')
  assert(jiangmen && standardAllowsOfficialConvert(jiangmen), '江门不受影响')
  assert(foshan && standardAllowsOfficialConvert(foshan), '佛山不受影响')
  assert(zhuhai && standardAllowsOfficialConvert(zhuhai), '珠海不受影响')
  assert(shantou && standardAllowsOfficialConvert(shantou), '汕头不受影响')
  assert(shenzhen?.status === 'partial' && shenzhen.scoreTableStatus === 'partial', '深圳状态被改')
  assert(dongguan?.status === 'partial' && dongguan.scoreTableStatus === 'partial', '东莞状态被改')
  assert(zhanjiang?.status === 'partial' && zhanjiang.scoreTableStatus === 'partial', '湛江状态被改')
  assert(zhongshan && zhongshan.scoreTableStatus === 'missing' && !standardAllowsOfficialConvert(zhongshan), '中山状态被改')
  const coverage = listGuangdongCityCoverage(builtins)
  assert(coverage.length === GD_CITIES.length && GD_CITIES.length === 21, '21市覆盖丢失')
  assert(cityCoverageStatus(builtins, 'shaoguan') === 'verified', '韶关覆盖状态')
  assert(cityCoverageStatus(builtins, 'guangzhou') === 'verified', '广州覆盖状态')
  assert(cityCoverageStatus(builtins, 'jiangmen') === 'verified', '江门覆盖状态')
  assert(cityCoverageStatus(builtins, 'foshan') === 'verified', '佛山覆盖状态')
  assert(cityCoverageStatus(builtins, 'zhuhai') === 'verified', '珠海覆盖状态')
  assert(cityCoverageStatus(builtins, 'shantou') === 'verified', '汕头覆盖状态')
  assert(findApplicableStandard(builtins, { examType: 'middle_school_exam', citySlug: 'shaoguan', year: 2026 })?.id === shaoguan.id, '2026查找')

  return 'shaoguan scoring standards self-check passed'
}

export function runShaoguanScoringSelfCheckOrThrow(): string {
  return runShaoguanScoringSelfCheck()
}
