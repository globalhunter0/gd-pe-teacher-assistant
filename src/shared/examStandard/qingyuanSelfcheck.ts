import { convertExamBatch } from '../examBatch/convert'
import type { ExamColumnMapping } from '../examBatch/types'
import { listBuiltinExamStandards } from './catalog'
import { cityCoverageStatus, listGuangdongCityCoverage } from './coverage'
import { GD_CITIES } from './regions'
import {
  calculateExamScore,
  findApplicableStandard,
  itemSupportsAutoScore,
  OFFICIAL_SCORE_PARTIAL,
  parseExamPerformanceInput,
  standardAllowsOfficialConvert
} from './score'

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

export function runQingyuanScoringSelfCheck(): string {
  const builtins = listBuiltinExamStandards()
  const qingyuan = builtins.find((item) => item.id === 'cn-gd-qingyuan-middle-2026')
  const zhaoqing = builtins.find((item) => item.id === 'cn-gd-zhaoqing-middle-2026')
  const maoming = builtins.find((item) => item.id === 'cn-gd-maoming-middle-2026')
  const yangjiang = builtins.find((item) => item.id === 'cn-gd-yangjiang-middle-2026')
  const zhongshan = builtins.find((item) => item.id === 'cn-gd-zhongshan-middle-cohort-2023')
  const guangzhou = builtins.find((item) => item.id === 'cn-gd-guangzhou-middle-2024-2026')
  const jiangmen = builtins.find((item) => item.id === 'cn-gd-jiangmen-middle-2026')
  const foshan = builtins.find((item) => item.id === 'cn-gd-foshan-middle-2026')
  const zhuhai = builtins.find((item) => item.id === 'cn-gd-zhuhai-middle-2026')
  const shantou = builtins.find((item) => item.id === 'cn-gd-shantou-middle-2026')
  const shaoguan = builtins.find((item) => item.id === 'cn-gd-shaoguan-middle-2026')
  const shenzhen = builtins.find((item) => item.id === 'cn-gd-shenzhen-middle-2026')
  const dongguan = builtins.find((item) => item.id === 'cn-gd-dongguan-middle-2026-2027')
  const zhanjiang = builtins.find((item) => item.id === 'cn-gd-zhanjiang-middle-2026')

  assert(qingyuan, '清远2026版本缺失')
  assert(qingyuan.sourceUrl?.includes('gdqy.gov.cn'), '清远缺少市政府/市教育局官方来源')
  assert(qingyuan.sourceTitle.includes('清市教〔2025〕12号'), '清远来源文件名不正确')
  assert(qingyuan.totalMaxScore === 90, '清远2026体育总分必须是90')
  assert(qingyuan.notes.includes('65分方案'), '应明确不得把2025年65分方案套给2026')
  assert(qingyuan.status === 'partial' && qingyuan.ruleStatus === 'partial', '清远方案不得假装完整')
  assert(qingyuan.scoreTableStatus === 'missing', '清远评分表不得假装已核验')
  assert(!standardAllowsOfficialConvert(qingyuan), '清远不得开放完整自动换算')
  assert(qingyuan.items.every((item) => !itemSupportsAutoScore(item)), '清远不得带可换算评分表')
  assert(!qingyuan.items.some((item) => item.scoreRule.kind === 'thresholdTable'), '不得写入未核验对照档')
  assert(qingyuan.items.length === 1 && qingyuan.items[0]?.id === 'onsite-skill', '清远不得写入未核验的具体体育项目评分表')
  assert(!qingyuan.items.some((item) => item.itemKey === 'run-1000m' || item.id === 'male-1000m'), '不得把未核验长跑项目写入评分表')
  assert(!qingyuan.notes.includes('一类项目'), '不得套用广州三类结构')
  assert(qingyuan.notes.includes('1681155.doc'), '应记录已检查且不得沿用的2023评分附件')
  assert(qingyuan.notes.includes('清市教体函〔2018〕1号'), '应记录已追踪的2018评分文号')
  assert(qingyuan.citySlug === 'qingyuan', '清远必须独立 city/version')
  assert(guangzhou && zhaoqing && shaoguan && shantou, '对照城市版本缺失')

  const gzRun = guangzhou.items.find((item) => item.id === 'male-1000m')
  assert(gzRun, '广州1000米项目缺失')
  assert(parseExamPerformanceInput('3:37', gzRun) === 217, '时间解析 3:37 应变为217秒')
  const gzSkip = guangzhou!.items.find((item) => item.unit === 'times')
  assert(gzSkip && parseExamPerformanceInput('168', gzSkip) === 168, '次数单位解析失败')

  const blocked = calculateExamScore({
    standard: qingyuan,
    itemId: 'onsite-skill',
    rawValue: 90,
    gender: 'male',
    officialOnly: true
  })
  assert(!blocked.ok && (blocked.message === OFFICIAL_SCORE_PARTIAL || blocked.message.includes('尚未完整核验')), '清远换算应拒绝')

  const runBlocked = calculateExamScore({
    standard: qingyuan,
    itemId: 'male-1000m',
    rawValue: 217,
    gender: 'male',
    officialOnly: true
  })
  assert(!runBlocked.ok, '清远不得按他市1000米表换算')

  const titles = ['姓名', '学号', '班级', '性别', '项目', '成绩']
  const batch = convertExamBatch(
    qingyuan,
    longMapping(),
    [
      { excelRow: 2, cells: ['甲', '1', '1班', '男', '体育与健康考试', '90'], raw: ['甲', '1', '1班', '男', '体育与健康考试', '90'] },
      { excelRow: 3, cells: ['乙', '2', '1班', '男', '1000米跑', '3:37'], raw: ['乙', '2', '1班', '男', '1000米跑', '3:37'] },
      { excelRow: 4, cells: ['丙', '3', '1班', '女', '1000米跑', '3:37'], raw: ['丙', '3', '1班', '女', '1000米跑', '3:37'] }
    ],
    titles
  )
  assert(batch.rows.every((row) => row.examStandardId === qingyuan.id), '批量未绑定清远2026')
  assert(batch.rows.every((row) => row.score == null), '批量不得给清远打分')

  const raw1000 = 217
  const gz = calculateExamScore({
    standard: guangzhou!,
    itemId: 'male-1000m',
    rawValue: raw1000,
    gender: 'male',
    officialOnly: true
  })
  const zq = calculateExamScore({
    standard: zhaoqing!,
    itemId: 'male-1000m',
    rawValue: raw1000,
    gender: 'male',
    officialOnly: true
  })
  const sg = calculateExamScore({
    standard: shaoguan!,
    itemId: 'male-1000m',
    rawValue: raw1000,
    gender: 'male',
    officialOnly: true
  })
  const st = calculateExamScore({
    standard: shantou!,
    itemId: 'male-1000m',
    rawValue: raw1000,
    gender: 'male',
    officialOnly: true
  })
  assert(gz.ok && zq.ok && sg.ok && st.ok, '对照城市1000米应仍可换算')
  assert(gz.score !== zq.score || sg.score !== zq.score, '对照城市必须仍分表')
  assert(qingyuan.id !== guangzhou!.id && qingyuan.id !== zhaoqing!.id, '清远不得串用广州肇庆版本')

  const female1000 = calculateExamScore({
    standard: guangzhou!,
    itemId: 'male-1000m',
    rawValue: raw1000,
    gender: 'female',
    officialOnly: true
  })
  assert(!female1000.ok, '对照城市男女表隔离被破坏')

  const zhaoqingFemale = calculateExamScore({
    standard: zhaoqing!,
    itemId: 'male-1000m',
    rawValue: raw1000,
    gender: 'female',
    officialOnly: true
  })
  assert(!zhaoqingFemale.ok, '肇庆男女表隔离被破坏')

  assert(zhaoqing && zhaoqing.status === 'verified' && zhaoqing.ruleStatus === 'verified' && zhaoqing.scoreTableStatus === 'verified', '肇庆本轮验收结果被改')
  assert(standardAllowsOfficialConvert(zhaoqing!), '肇庆换算被误关')
  assert(maoming && maoming.ruleStatus === 'verified' && maoming.scoreTableStatus === 'missing', '茂名状态被改')
  assert(yangjiang && yangjiang.status === 'partial' && yangjiang.ruleStatus === 'partial' && yangjiang.scoreTableStatus === 'missing', '阳江状态被改')
  assert(zhongshan && zhongshan.ruleStatus === 'verified' && zhongshan.scoreTableStatus === 'missing', '中山状态被改')
  assert(!standardAllowsOfficialConvert(zhongshan!), '中山换算被误开')
  assert(!standardAllowsOfficialConvert(maoming!), '茂名换算被误开')

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
  assert(cityCoverageStatus(builtins, 'qingyuan') === 'partial', '清远覆盖状态应为部分核验')
  assert(cityCoverageStatus(builtins, 'zhaoqing') === 'verified', '肇庆覆盖状态被改')
  assert(cityCoverageStatus(builtins, 'zhongshan') === 'scheme_verified', '中山覆盖状态被改')
  assert(cityCoverageStatus(builtins, 'maoming') === 'scheme_verified', '茂名覆盖状态被改')
  assert(cityCoverageStatus(builtins, 'yangjiang') === 'partial', '阳江覆盖状态被改')
  assert(cityCoverageStatus(builtins, 'guangzhou') === 'verified', '广州覆盖状态')
  assert(
    findApplicableStandard(builtins, { examType: 'middle_school_exam', citySlug: 'qingyuan', year: 2026 }) === undefined,
    '默认查找不得把清远 partial 当完整'
  )

  return 'qingyuan scoring standards self-check passed'
}

export function runQingyuanScoringSelfCheckOrThrow(): string {
  return runQingyuanScoringSelfCheck()
}
