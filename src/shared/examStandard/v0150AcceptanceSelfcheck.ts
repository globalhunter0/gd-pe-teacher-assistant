import { convertExamBatch } from '../examBatch/convert'
import type { ExamColumnMapping } from '../examBatch/types'
import { listBuiltinExamStandards } from './catalog'
import { listGuangdongCityCoverage } from './coverage'
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

const EXPECTED_SLUGS = [
  'guangzhou',
  'shenzhen',
  'zhuhai',
  'shantou',
  'foshan',
  'shaoguan',
  'heyuan',
  'meizhou',
  'huizhou',
  'shanwei',
  'dongguan',
  'zhongshan',
  'jiangmen',
  'yangjiang',
  'zhanjiang',
  'maoming',
  'zhaoqing',
  'qingyuan',
  'chaozhou',
  'jieyang',
  'yunfu'
] as const

function middleStandards(builtins: ExamStandard[]): ExamStandard[] {
  return builtins.filter((item) => item.examType === 'middle_school_exam')
}

function currentCityStandard(builtins: ExamStandard[], citySlug: string): ExamStandard {
  const city = middleStandards(builtins)
    .filter((item) => item.citySlug === citySlug)
    .sort((a, b) => b.yearTo - a.yearTo || b.yearFrom - a.yearFrom)
  const found = city[0]
  assert(found, `${citySlug} 缺少中考体育标准`)
  return found
}

function assertTableShape(item: ExamItemDefinition, standardId: string): void {
  assert(itemSupportsAutoScore(item), `${standardId}/${item.id} 标记可换算但表不完整`)
  assert(item.scoreRule.kind === 'thresholdTable', `${item.id} 可换算项目必须是对照表`)
  const entries = item.scoreRule.entries
  assert(entries.length >= 3, `${standardId}/${item.id} 档位过少`)
  const thresholds = entries.map((entry) => entry.threshold)
  assert(new Set(thresholds).size === entries.length, `${standardId}/${item.id} 存在重复档`)
  const scores = entries.map((entry) => entry.score)
  assert(new Set(scores).size === entries.length, `${standardId}/${item.id} 存在重复分值档`)
  const maxListed = Math.max(...scores)
  assert(maxListed === item.scoreRule.maxScore, `${standardId}/${item.id} 缺少满分档`)
  if (item.direction === 'lowerBetter') {
    const best = entries.reduce((acc, entry) => (entry.score > acc.score ? entry : acc))
    const worst = entries.reduce((acc, entry) => (entry.score < acc.score ? entry : acc))
    assert(best.threshold <= worst.threshold, `${standardId}/${item.id} 越低越好方向与阈值矛盾`)
  } else {
    const best = entries.reduce((acc, entry) => (entry.score > acc.score ? entry : acc))
    const worst = entries.reduce((acc, entry) => (entry.score < acc.score ? entry : acc))
    assert(best.threshold >= worst.threshold, `${standardId}/${item.id} 越高越好方向与阈值矛盾`)
  }
}

export function runV0150AcceptanceSelfCheck(): string {
  const builtins = listBuiltinExamStandards()
  const slugs = GD_CITIES.map((item) => item.citySlug)
  assert(GD_CITIES.length === 21, 'GD_CITIES.length 必须为 21')
  assert(new Set(slugs).size === 21, 'citySlug 重复')
  assert(new Set(GD_CITIES.map((item) => item.cityCode)).size === 21, 'cityCode 重复')
  assert(new Set(GD_CITIES.map((item) => item.cityName)).size === 21, '城市名称重复')
  for (const slug of EXPECTED_SLUGS) {
    assert(slugs.includes(slug), `缺少城市 ${slug}`)
  }

  const ids = builtins.map((item) => item.id)
  assert(new Set(ids).size === ids.length, 'versionId/标准 id 重复')

  const coverage = listGuangdongCityCoverage(builtins)
  assert(coverage.length === 21, '覆盖行数不是 21')

  const legalRule = new Set(['verified', 'partial', 'draft'])
  const legalTable = new Set(['verified', 'partial', 'missing'])

  for (const city of GD_CITIES) {
    const standard = currentCityStandard(builtins, city.citySlug)
    assert(legalRule.has(standard.ruleStatus), `${standard.id} ruleStatus 非法`)
    assert(legalTable.has(standard.scoreTableStatus), `${standard.id} scoreTableStatus 非法`)
    assert(Boolean(standard.sourceAuthority && standard.sourceTitle && standard.sourceUrl), `${standard.id} 缺少来源`)
    assert(standard.yearFrom <= standard.yearTo, `${standard.id} 年份区间不正确`)
    if (standard.scoreTableStatus !== 'verified') {
      assert(!standardAllowsOfficialConvert(standard), `${standard.id} 未完整评分表却开放自动换算`)
      for (const item of standard.items) {
        assert(!itemSupportsAutoScore(item), `${standard.id}/${item.id} 未完整评分表却可自动评分`)
        const result = calculateExamScore({
          standard,
          itemId: item.id,
          rawValue: 220,
          gender: item.gender === 'female' ? 'female' : 'male',
          officialOnly: true
        })
        assert(!result.ok, `${standard.id}/${item.id} 未verified评分表却给出分数`)
      }
      const stray = calculateExamScore({
        standard,
        itemId: 'male-1000m',
        rawValue: 220,
        gender: 'male',
        officialOnly: true
      })
      assert(!stray.ok, `${standard.id} 不得因他市存在1000米而得分`)
    }
  }

  const verifiedTables = middleStandards(builtins).filter((item) => item.scoreTableStatus === 'verified')
  for (const standard of verifiedTables) {
    assert(standard.status === 'verified' && standard.ruleStatus === 'verified', `${standard.id} 评分表已核验但方案状态不一致`)
    assert(standardAllowsOfficialConvert(standard), `${standard.id} verified 表应允许换算`)
    const supported = standard.items.filter((item) => itemSupportsAutoScore(item))
    assert(supported.length > 0, `${standard.id} verified 表没有任何可换算项目`)
    for (const item of standard.items) {
      if (item.scoreRule.kind === 'thresholdTable' && item.scoreRule.entries.length > 0) {
        assertTableShape(item, standard.id)
      } else {
        assert(!itemSupportsAutoScore(item), `${standard.id}/${item.id} 不完整项目被标为可换算`)
      }
    }
  }

  const guangzhou = currentCityStandard(builtins, 'guangzhou')
  const jiangmen = currentCityStandard(builtins, 'jiangmen')
  const zhaoqing = currentCityStandard(builtins, 'zhaoqing')
  const shaoguan = currentCityStandard(builtins, 'shaoguan')
  const shantou = currentCityStandard(builtins, 'shantou')
  const foshan = builtins.find((item) => item.id === 'cn-gd-foshan-middle-2026')
  const zhuhai = currentCityStandard(builtins, 'zhuhai')
  assert(foshan, '佛山2026缺失')

  const gzRun = guangzhou.items.find((item) => item.id === 'male-1000m')
  const gzFemale = guangzhou.items.find((item) => item.id === 'female-800m')
  const gzSkip = guangzhou.items.find((item) => item.itemKey === 'rope-skip-1min' || item.unit === 'times')
  const gzSprint = guangzhou.items.find(
    (item) => item.valueType === 'time' && item.timeInputMode === 'seconds' && item.gender === 'male'
  )
  assert(gzRun && gzFemale && gzSkip && gzSprint, '广州对照项目缺失')
  assert(parseExamPerformanceInput('3:40', gzRun) === 220, '3:40 解析失败')
  assert(parseExamPerformanceInput("3'40", gzRun) === 220, "3'40 解析失败")
  assert(parseExamPerformanceInput('3.40', gzRun) === 220, '3.40 必须按长跑分秒解析')
  assert(parseExamPerformanceInput('220', gzRun) === 220, '220 秒解析失败')
  assert(parseExamPerformanceInput('3:37', gzRun) === 217, '3:37 解析失败')
  assert(parseExamPerformanceInput('3:42', gzRun) === 222, '3:42 解析失败')
  assert(parseExamPerformanceInput('7.80', gzSprint) === 7.8, '短跑 7.80 不得解释为 7 分 80 秒')
  assert(parseExamPerformanceInput('168', gzSkip) === 168, '跳绳次数解析失败')

  const femaleOnMale = calculateExamScore({
    standard: guangzhou,
    itemId: 'male-1000m',
    rawValue: 217,
    gender: 'female',
    officialOnly: true
  })
  assert(!femaleOnMale.ok, '女性误用男1000米表')
  const maleOnFemale = calculateExamScore({
    standard: guangzhou,
    itemId: 'female-800m',
    rawValue: 200,
    gender: 'male',
    officialOnly: true
  })
  assert(!maleOnFemale.ok, '男性误用女800米表')
  const zqFemale = calculateExamScore({
    standard: zhaoqing,
    itemId: 'male-1000m',
    rawValue: 220,
    gender: 'female',
    officialOnly: true
  })
  for (const standard of middleStandards(builtins)) {
    for (const item of standard.items) {
      if (item.gender === 'all') {
        continue
      }
      const wrong: 'male' | 'female' = item.gender === 'male' ? 'female' : 'male'
      const crossed = calculateExamScore({
        standard,
        itemId: item.id,
        rawValue: 220,
        gender: wrong,
        officialOnly: true
      })
      assert(!crossed.ok, `${standard.id}/${item.id} 性别隔离失败`)
    }
  }

  const rawValues = [217, 220, 222]
  const cityScores = new Map<string, number[]>()
  for (const city of GD_CITIES) {
    const standard = currentCityStandard(builtins, city.citySlug)
    const scores: number[] = []
    for (const raw of rawValues) {
      const result = calculateExamScore({
        standard,
        itemId: 'male-1000m',
        rawValue: raw,
        gender: 'male',
        officialOnly: true
      })
      if (result.ok) {
        assert(result.standardId === standard.id, `${standard.id} 换算结果串用了其他版本`)
        scores.push(result.score)
      } else {
        assert(standard.scoreTableStatus !== 'verified' || !standard.items.some((item) => item.id === 'male-1000m' && itemSupportsAutoScore(item)), `${standard.id} 已核验1000米却拒绝换算`)
      }
    }
    cityScores.set(city.citySlug, scores)
  }

  assert((cityScores.get('guangzhou') ?? []).length === 3, '广州1000米隔离样本失败')
  assert((cityScores.get('heyuan') ?? []).length === 0, '河源 missing 被串城打分')
  assert((cityScores.get('meizhou') ?? []).length === 0, '梅州 missing 被串城打分')
  assert((cityScores.get('yunfu') ?? []).length === 0, '云浮 missing 被串城打分')
  assert((cityScores.get('jieyang') ?? []).length === 0, '揭阳 scheme_verified 被直接打分')
  assert((cityScores.get('zhongshan') ?? []).length === 0, '中山 scheme_verified 被直接打分')
  const gz = cityScores.get('guangzhou')![0]
  const jm = calculateExamScore({
    standard: jiangmen,
    itemId: 'male-1000m',
    rawValue: 217,
    gender: 'male',
    officialOnly: true
  })
  const sg = calculateExamScore({
    standard: shaoguan,
    itemId: 'male-1000m',
    rawValue: 217,
    gender: 'male',
    officialOnly: true
  })
  const st = calculateExamScore({
    standard: shantou,
    itemId: 'male-1000m',
    rawValue: 217,
    gender: 'male',
    officialOnly: true
  })
  const zq = calculateExamScore({
    standard: zhaoqing,
    itemId: 'male-1000m',
    rawValue: 217,
    gender: 'male',
    officialOnly: true
  })
  assert(jm.ok && sg.ok && st.ok && zq.ok, 'verified 城市1000米应可换算')
  assert(jm.standardId === jiangmen.id && sg.standardId === shaoguan.id && st.standardId === shantou.id, '跨城市结果未绑定自身版本')
  assert(gz !== sg.score || gz !== jm.score || gz !== zq.score, '相同原始成绩必须允许分城不同分，且不得全部被广州覆盖')

  const shenzhen = currentCityStandard(builtins, 'shenzhen')
  const heyuan = currentCityStandard(builtins, 'heyuan')
  const titles = ['姓名', '学号', '班级', '性别', '项目', '成绩']
  const gzBatch = convertExamBatch(
    guangzhou,
    longMapping(),
    [{ excelRow: 2, cells: ['甲', '1', '1班', '男', '1000米跑', '3:37'], raw: ['甲', '1', '1班', '男', '1000米跑', '3:37'] }],
    titles
  )
  assert(gzBatch.rows[0]?.examStandardId === guangzhou.id && gzBatch.rows[0]?.score === 100, 'verified Excel 链路失败')

  const szBatch = convertExamBatch(
    shenzhen,
    longMapping(),
    [{ excelRow: 2, cells: ['乙', '2', '1班', '男', '1000米跑', '3:40'], raw: ['乙', '2', '1班', '男', '1000米跑', '3:40'] }],
    titles
  )
  assert(szBatch.rows[0]?.examStandardId === shenzhen.id && szBatch.rows[0]?.score == null, 'partial Excel 不得因广州表得分')

  const hyBatch = convertExamBatch(
    heyuan,
    longMapping(),
    [{ excelRow: 2, cells: ['丙', '3', '1班', '男', '1000米跑', '3:40'], raw: ['丙', '3', '1班', '男', '1000米跑', '3:40'] }],
    titles
  )
  assert(hyBatch.rows[0]?.examStandardId === heyuan.id && hyBatch.rows[0]?.score == null, 'missing Excel 不得得分')

  assert(
    findApplicableStandard(builtins, { examType: 'middle_school_exam', citySlug: 'heyuan', year: 2026 }) === undefined,
    '默认查找不得把 missing 当完整'
  )
  assert(
    findApplicableStandard(builtins, { examType: 'middle_school_exam', citySlug: 'guangzhou', year: 2026 })?.id ===
      guangzhou.id,
    '广州当前版本查找失败'
  )
  assert(zhuhai.scoreTableStatus === 'verified', '珠海状态被改')
  assert(
    findApplicableStandard(builtins, { examType: 'middle_school_exam', citySlug: 'foshan', year: 2026 })?.id === foshan.id,
    '佛山不得被广州或其他城市版本覆盖'
  )

  return 'v0.15.0 21-city scoring acceptance self-check passed'
}

export function runV0150AcceptanceSelfCheckOrThrow(): string {
  return runV0150AcceptanceSelfCheck()
}
