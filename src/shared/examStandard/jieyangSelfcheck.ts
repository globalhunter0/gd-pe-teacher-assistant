import { convertExamBatch } from '../examBatch/convert'
import type { ExamColumnMapping } from '../examBatch/types'
import { listBuiltinExamStandards } from './catalog'
import { cityCoverageStatus, listGuangdongCityCoverage } from './coverage'
import { GD_CITIES } from './regions'
import {
  calculateExamScore,
  findApplicableStandard,
  itemSupportsAutoScore,
  OFFICIAL_SCORE_SCHEME_ONLY,
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

export function runJieyangScoringSelfCheck(): string {
  const builtins = listBuiltinExamStandards()
  const jieyang = builtins.find((item) => item.id === 'cn-gd-jieyang-middle-2026')
  const chaozhou = builtins.find((item) => item.id === 'cn-gd-chaozhou-middle-2026')
  const qingyuan = builtins.find((item) => item.id === 'cn-gd-qingyuan-middle-2026')
  const zhaoqing = builtins.find((item) => item.id === 'cn-gd-zhaoqing-middle-2026')
  const maoming = builtins.find((item) => item.id === 'cn-gd-maoming-middle-2026')
  const yangjiang = builtins.find((item) => item.id === 'cn-gd-yangjiang-middle-2026')
  const zhongshan = builtins.find((item) => item.id === 'cn-gd-zhongshan-middle-cohort-2023')
  const gzStd = builtins.find((item) => item.id === 'cn-gd-guangzhou-middle-2024-2026')
  const jiangmen = builtins.find((item) => item.id === 'cn-gd-jiangmen-middle-2026')
  const foshan = builtins.find((item) => item.id === 'cn-gd-foshan-middle-2026')
  const zhuhai = builtins.find((item) => item.id === 'cn-gd-zhuhai-middle-2026')
  const shantou = builtins.find((item) => item.id === 'cn-gd-shantou-middle-2026')
  const shaoguan = builtins.find((item) => item.id === 'cn-gd-shaoguan-middle-2026')
  const shenzhen = builtins.find((item) => item.id === 'cn-gd-shenzhen-middle-2026')
  const dongguan = builtins.find((item) => item.id === 'cn-gd-dongguan-middle-2026-2027')
  const zhanjiang = builtins.find((item) => item.id === 'cn-gd-zhanjiang-middle-2026')

  assert(jieyang, '揭阳2026版本缺失')
  assert(jieyang.sourceUrl?.includes('jieyang.gov.cn'), '揭阳缺少市教育局官方来源')
  assert(jieyang.notes.includes('揭市教〔2024〕93号') && jieyang.notes.includes('854270.pdf'), '揭阳应记录93号方案PDF')
  assert(jieyang.totalMaxScore === 70, '揭阳总分必须是70')
  const onsite = jieyang.components.filter((item) => item.kind === 'onsite').reduce((sum, item) => sum + item.maxScore, 0)
  const process = jieyang.components.filter((item) => item.kind === 'process').reduce((sum, item) => sum + item.maxScore, 0)
  assert(onsite === 30 && process === 40, '揭阳必须是素质评价40+统一考试30')
  assert(jieyang.groups.some((group) => group.id === 'group-required'), '必考结构缺失')
  assert(jieyang.groups.some((group) => group.id === 'group-elective'), '选考结构缺失')
  assert(jieyang.ruleStatus === 'verified', '揭阳考试方案应为已核验')
  assert(jieyang.status === 'partial' && jieyang.scoreTableStatus === 'missing', '揭阳评分表不得假装完整')
  assert(!standardAllowsOfficialConvert(jieyang), '揭阳不得开放完整自动换算')
  assert(jieyang.items.every((item) => !itemSupportsAutoScore(item)), '揭阳不得带可换算评分表')
  assert(!jieyang.items.some((item) => item.scoreRule.kind === 'thresholdTable'), '不得写入未核验对照档')
  assert(!jieyang.notes.includes('一类项目'), '不得套用广州三类结构')
  assert(jieyang.notes.includes('post_700307.html'), '应记录已检查且不得把试行附件成绩档写入本版')
  assert(jieyang.citySlug === 'jieyang', '揭阳必须独立 city/version')
  assert(gzStd && zhaoqing && shaoguan && shantou, '对照城市版本缺失')

  const gzRun = gzStd.items.find((item) => item.id === 'male-1000m')
  assert(gzRun, '广州1000米项目缺失')
  assert(parseExamPerformanceInput('3:37', gzRun) === 217, '时间解析 3:37 应变为217秒')
  const gzSkip = gzStd.items.find((item) => item.unit === 'times')
  assert(gzSkip && parseExamPerformanceInput('168', gzSkip) === 168, '次数单位解析失败')

  const blocked = calculateExamScore({
    standard: jieyang,
    itemId: 'male-1000m',
    rawValue: 217,
    gender: 'male',
    officialOnly: true
  })
  assert(!blocked.ok && blocked.message === OFFICIAL_SCORE_SCHEME_ONLY, '揭阳仍被允许自动换算')

  const femaleLocal = calculateExamScore({
    standard: jieyang,
    itemId: 'male-1000m',
    rawValue: 217,
    gender: 'female',
    officialOnly: true
  })
  assert(!femaleLocal.ok, '揭阳男女项目隔离被破坏')

  const titles = ['姓名', '学号', '班级', '性别', '项目', '成绩']
  const batch = convertExamBatch(
    jieyang,
    longMapping(),
    [
      { excelRow: 2, cells: ['甲', '1', '1班', '男', '1000米跑', '3:37'], raw: ['甲', '1', '1班', '男', '1000米跑', '3:37'] },
      { excelRow: 3, cells: ['乙', '2', '1班', '女', '1000米跑', '3:37'], raw: ['乙', '2', '1班', '女', '1000米跑', '3:37'] },
      { excelRow: 4, cells: ['丙', '3', '1班', '男', '一分钟跳绳', '182'], raw: ['丙', '3', '1班', '男', '一分钟跳绳', '182'] }
    ],
    titles
  )
  assert(batch.rows.every((row) => row.examStandardId === jieyang.id), '批量未绑定揭阳2026')
  assert(batch.rows.every((row) => row.score == null), '批量不得给揭阳打分')

  const raw1000 = 217
  const gz = calculateExamScore({
    standard: gzStd,
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
  assert(jieyang.id !== gzStd.id && jieyang.id !== zhaoqing!.id, '揭阳不得串用广州肇庆版本')

  const female1000 = calculateExamScore({
    standard: gzStd,
    itemId: 'male-1000m',
    rawValue: raw1000,
    gender: 'female',
    officialOnly: true
  })
  assert(!female1000.ok, '对照城市男女表隔离被破坏')

  assert(chaozhou && chaozhou.status === 'partial' && chaozhou.ruleStatus === 'partial' && chaozhou.scoreTableStatus === 'missing', '潮州本轮核验结果被改')
  assert(qingyuan && qingyuan.status === 'partial' && qingyuan.ruleStatus === 'partial' && qingyuan.scoreTableStatus === 'missing', '清远状态被改')
  assert(zhaoqing && zhaoqing.status === 'verified' && zhaoqing.scoreTableStatus === 'verified', '肇庆状态被改')
  assert(standardAllowsOfficialConvert(zhaoqing!), '肇庆换算被误关')
  assert(maoming && maoming.ruleStatus === 'verified' && maoming.scoreTableStatus === 'missing', '茂名状态被改')
  assert(yangjiang && yangjiang.status === 'partial' && yangjiang.ruleStatus === 'partial' && yangjiang.scoreTableStatus === 'missing', '阳江状态被改')
  assert(zhongshan && zhongshan.ruleStatus === 'verified' && zhongshan.scoreTableStatus === 'missing', '中山状态被改')
  assert(!standardAllowsOfficialConvert(zhongshan!), '中山换算被误开')
  assert(!standardAllowsOfficialConvert(maoming!), '茂名换算被误开')

  assert(gzStd && standardAllowsOfficialConvert(gzStd), '广州不受影响')
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
  assert(cityCoverageStatus(builtins, 'jieyang') === 'scheme_verified', '揭阳覆盖状态应为规则已核验')
  assert(cityCoverageStatus(builtins, 'chaozhou') === 'partial', '潮州覆盖状态被改')
  assert(cityCoverageStatus(builtins, 'qingyuan') === 'partial', '清远覆盖状态被改')
  assert(cityCoverageStatus(builtins, 'maoming') === 'scheme_verified', '茂名覆盖状态被改')
  assert(cityCoverageStatus(builtins, 'yangjiang') === 'partial', '阳江覆盖状态被改')
  assert(cityCoverageStatus(builtins, 'zhongshan') === 'scheme_verified', '中山覆盖状态被改')
  assert(cityCoverageStatus(builtins, 'zhaoqing') === 'verified', '肇庆覆盖状态被改')
  assert(
    findApplicableStandard(builtins, { examType: 'middle_school_exam', citySlug: 'jieyang', year: 2026 }) === undefined,
    '默认查找不得把揭阳 partial 当完整'
  )

  return 'jieyang scoring standards self-check passed'
}

export function runJieyangScoringSelfCheckOrThrow(): string {
  return runJieyangScoringSelfCheck()
}
