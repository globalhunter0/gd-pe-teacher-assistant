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

export function runMaomingScoringSelfCheck(): string {
  const builtins = listBuiltinExamStandards()
  const maoming = builtins.find((item) => item.id === 'cn-gd-maoming-middle-2026')
  const yangjiang = builtins.find((item) => item.id === 'cn-gd-yangjiang-middle-2026')
  const shanwei = builtins.find((item) => item.id === 'cn-gd-shanwei-middle-2026')
  const huizhou = builtins.find((item) => item.id === 'cn-gd-huizhou-middle-2026')
  const meizhou = builtins.find((item) => item.id === 'cn-gd-meizhou-middle-2026')
  const heyuan = builtins.find((item) => item.id === 'cn-gd-heyuan-middle-2026')
  const guangzhou = builtins.find((item) => item.id === 'cn-gd-guangzhou-middle-2024-2026')
  const jiangmen = builtins.find((item) => item.id === 'cn-gd-jiangmen-middle-2026')
  const foshan = builtins.find((item) => item.id === 'cn-gd-foshan-middle-2026')
  const zhuhai = builtins.find((item) => item.id === 'cn-gd-zhuhai-middle-2026')
  const shantou = builtins.find((item) => item.id === 'cn-gd-shantou-middle-2026')
  const shaoguan = builtins.find((item) => item.id === 'cn-gd-shaoguan-middle-2026')
  const shenzhen = builtins.find((item) => item.id === 'cn-gd-shenzhen-middle-2026')
  const dongguan = builtins.find((item) => item.id === 'cn-gd-dongguan-middle-2026-2027')
  const zhanjiang = builtins.find((item) => item.id === 'cn-gd-zhanjiang-middle-2026')
  const zhongshan = builtins.find((item) => item.id === 'cn-gd-zhongshan-middle-cohort-2023')

  assert(maoming, '茂名2026版本缺失')
  assert(maoming.sourceUrl?.includes('mmjyj.maoming.gov.cn'), '茂名缺少市教育局官方来源')
  assert(maoming.totalMaxScore === 70, '茂名总分必须是70')
  const onsite = maoming.components.filter((item) => item.kind === 'onsite').reduce((sum, item) => sum + item.maxScore, 0)
  const process = maoming.components.filter((item) => item.kind === 'process').reduce((sum, item) => sum + item.maxScore, 0)
  assert(onsite === 65 && process === 5, '茂名必须是统一考试65+素质综合评价5')
  assert(maoming.groups.some((group) => group.id === 'group-required'), '必考结构缺失')
  assert(maoming.groups.some((group) => group.id === 'group-fitness'), '体能结构缺失')
  assert(maoming.groups.some((group) => group.id === 'group-skill'), '技能结构缺失')
  assert(maoming.ruleStatus === 'verified', '茂名考试方案应为已核验')
  assert(maoming.status === 'partial' && maoming.scoreTableStatus === 'missing', '茂名评分表不得假装完整')
  assert(!standardAllowsOfficialConvert(maoming), '茂名不得开放完整自动换算')
  assert(maoming.items.every((item) => !itemSupportsAutoScore(item)), '茂名不得带可换算评分表')
  assert(!maoming.items.some((item) => item.scoreRule.kind === 'thresholdTable'), '不得写入未核验对照档')
  assert(!maoming.notes.includes('一类项目'), '不得套用广州三类结构')
  assert(maoming.notes.includes('977008.pdf'), '应记录已检查且不得沿用的2023评分PDF')
  assert(maoming.citySlug === 'maoming', '茂名必须独立 city/version')

  const blocked = calculateExamScore({
    standard: maoming,
    itemId: 'male-1000m',
    rawValue: 220,
    gender: 'male',
    officialOnly: true
  })
  assert(!blocked.ok && blocked.message === OFFICIAL_SCORE_SCHEME_ONLY, '茂名仍被允许自动换算')

  const titles = ['姓名', '学号', '班级', '性别', '项目', '成绩']
  const batch = convertExamBatch(
    maoming,
    longMapping(),
    [
      { excelRow: 2, cells: ['甲', '1', '1班', '男', '1000米跑', '3:40'], raw: ['甲', '1', '1班', '男', '1000米跑', '3:40'] },
      { excelRow: 3, cells: ['乙', '2', '1班', '女', '1000米跑', '3:40'], raw: ['乙', '2', '1班', '女', '1000米跑', '3:40'] },
      { excelRow: 4, cells: ['丙', '3', '1班', '男', '一分钟跳绳', '180'], raw: ['丙', '3', '1班', '男', '一分钟跳绳', '180'] }
    ],
    titles
  )
  assert(batch.rows.every((row) => row.examStandardId === maoming.id), '批量未绑定茂名2026')
  assert(batch.rows.every((row) => row.score == null), '批量不得给茂名打分')

  const female1000Local = calculateExamScore({
    standard: maoming,
    itemId: 'male-1000m',
    rawValue: 220,
    gender: 'female',
    officialOnly: true
  })
  assert(!female1000Local.ok, '茂名男女项目隔离被破坏')

  const raw1000 = 220
  const gz = calculateExamScore({ standard: guangzhou!, itemId: 'male-1000m', rawValue: raw1000, gender: 'male', officialOnly: true })
  const sg = calculateExamScore({ standard: shaoguan!, itemId: 'male-1000m', rawValue: raw1000, gender: 'male', officialOnly: true })
  const st = calculateExamScore({ standard: shantou!, itemId: 'male-1000m', rawValue: raw1000, gender: 'male', officialOnly: true })
  assert(gz.ok && sg.ok && st.ok, '对照城市1000米应仍可换算')
  assert(gz.score !== sg.score && st.score !== sg.score, '对照城市必须仍分表')
  assert(maoming.id !== guangzhou!.id && maoming.id !== shaoguan!.id && maoming.id !== shantou!.id, '茂名不得串用广州韶关汕头版本')

  const female1000 = calculateExamScore({
    standard: guangzhou!,
    itemId: 'male-1000m',
    rawValue: raw1000,
    gender: 'female',
    officialOnly: true
  })
  assert(!female1000.ok, '对照城市男女表隔离被破坏')

  assert(yangjiang && yangjiang.status === 'partial' && yangjiang.ruleStatus === 'partial' && yangjiang.scoreTableStatus === 'missing', '阳江状态被改')
  assert(shanwei && shanwei.status === 'partial' && shanwei.scoreTableStatus === 'missing', '汕尾状态被改')
  assert(huizhou && huizhou.status === 'partial' && huizhou.scoreTableStatus === 'missing', '惠州状态被改')
  assert(meizhou && meizhou.status === 'partial' && meizhou.scoreTableStatus === 'missing', '梅州状态被改')
  assert(heyuan && heyuan.status === 'partial' && heyuan.scoreTableStatus === 'missing', '河源状态被改')
  assert(zhongshan && zhongshan.ruleStatus === 'verified' && zhongshan.scoreTableStatus === 'missing', '中山状态被改')
  assert(!standardAllowsOfficialConvert(yangjiang!) && !standardAllowsOfficialConvert(zhongshan!), '已完成城市换算被误开')

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
  assert(cityCoverageStatus(builtins, 'maoming') === 'scheme_verified', '茂名覆盖状态应为规则已核验')
  assert(cityCoverageStatus(builtins, 'yangjiang') === 'partial', '阳江覆盖状态被改')
  assert(cityCoverageStatus(builtins, 'zhongshan') === 'scheme_verified', '中山覆盖状态被改')
  assert(cityCoverageStatus(builtins, 'guangzhou') === 'verified', '广州覆盖状态')
  assert(
    findApplicableStandard(builtins, { examType: 'middle_school_exam', citySlug: 'maoming', year: 2026 }) === undefined,
    '默认查找不得把茂名 partial 当完整'
  )

  return 'maoming scoring standards self-check passed'
}

export function runMaomingScoringSelfCheckOrThrow(): string {
  return runMaomingScoringSelfCheck()
}
