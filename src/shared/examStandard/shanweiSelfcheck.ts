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

export function runShanweiScoringSelfCheck(): string {
  const builtins = listBuiltinExamStandards()
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

  assert(shanwei, '汕尾2026版本缺失')
  assert(shanwei.sourceUrl?.includes('shanwei.gov.cn'), '汕尾缺少市政府/教育局官方来源')
  assert(shanwei.sourceTitle.includes('2025年初中学业水平考试报名工作的通知'), '汕尾来源文件名不正确')
  assert(shanwei.status === 'partial' && shanwei.ruleStatus === 'partial', '汕尾方案不得假装完整')
  assert(shanwei.scoreTableStatus === 'missing', '汕尾评分表不得假装已核验')
  assert(!standardAllowsOfficialConvert(shanwei), '汕尾不得开放完整自动换算')
  assert(shanwei.items.every((item) => !itemSupportsAutoScore(item)), '汕尾不得带可换算评分表')
  assert(shanwei.items.length === 1 && shanwei.items[0]?.id === 'onsite-skill', '汕尾不得写入未核验的具体体育项目评分表')
  assert(!shanwei.items.some((item) => item.itemKey === 'run-1000m'), '不得把2025长跑项目套进2026自动换算')
  assert(!shanwei.notes.includes('一类项目'), '不得套用广州三类结构')
  assert(shanwei.citySlug === 'shanwei', '汕尾必须独立 city/version')
  assert(shanwei.id !== huizhou?.id && shanwei.id !== meizhou?.id && shanwei.id !== heyuan?.id, '汕尾不得覆盖其他城市版本')

  const blocked = calculateExamScore({
    standard: shanwei,
    itemId: 'onsite-skill',
    rawValue: 80,
    gender: 'male',
    officialOnly: true
  })
  assert(!blocked.ok && (blocked.message === OFFICIAL_SCORE_PARTIAL || blocked.message.includes('尚未完整核验')), '汕尾换算应拒绝')

  const titles = ['姓名', '学号', '班级', '性别', '项目', '成绩']
  const batch = convertExamBatch(
    shanwei,
    longMapping(),
    [
      { excelRow: 2, cells: ['甲', '1', '1班', '男', '体育与健康考试', '80'], raw: ['甲', '1', '1班', '男', '体育与健康考试', '80'] },
      { excelRow: 3, cells: ['乙', '2', '1班', '男', '1000米跑', '3:40'], raw: ['乙', '2', '1班', '男', '1000米跑', '3:40'] },
      { excelRow: 4, cells: ['丙', '3', '1班', '女', '1000米跑', '3:40'], raw: ['丙', '3', '1班', '女', '1000米跑', '3:40'] }
    ],
    titles
  )
  assert(batch.rows.every((row) => row.examStandardId === shanwei.id), '批量未绑定汕尾2026')
  assert(batch.rows.every((row) => row.score == null), '批量不得给汕尾打分')

  const raw1000 = 220
  const gz = calculateExamScore({ standard: guangzhou!, itemId: 'male-1000m', rawValue: raw1000, gender: 'male', officialOnly: true })
  const sg = calculateExamScore({ standard: shaoguan!, itemId: 'male-1000m', rawValue: raw1000, gender: 'male', officialOnly: true })
  const st = calculateExamScore({ standard: shantou!, itemId: 'male-1000m', rawValue: raw1000, gender: 'male', officialOnly: true })
  assert(gz.ok && sg.ok && st.ok, '对照城市1000米应仍可换算')
  assert(gz.score !== sg.score && st.score !== sg.score, '对照城市必须仍分表')
  assert(shanwei.id !== guangzhou!.id && shanwei.id !== shaoguan!.id && shanwei.id !== shantou!.id, '汕尾不得串用广州韶关汕头版本')

  const female1000 = calculateExamScore({
    standard: guangzhou!,
    itemId: 'male-1000m',
    rawValue: raw1000,
    gender: 'female',
    officialOnly: true
  })
  assert(!female1000.ok, '对照城市男女表隔离被破坏')

  assert(huizhou && huizhou.status === 'partial' && huizhou.scoreTableStatus === 'missing', '惠州状态被改')
  assert(meizhou && meizhou.status === 'partial' && meizhou.scoreTableStatus === 'missing', '梅州状态被改')
  assert(heyuan && heyuan.status === 'partial' && heyuan.scoreTableStatus === 'missing', '河源状态被改')
  assert(!standardAllowsOfficialConvert(huizhou!) && !standardAllowsOfficialConvert(meizhou!) && !standardAllowsOfficialConvert(heyuan!), '已完成城市换算被误开')

  assert(guangzhou && standardAllowsOfficialConvert(guangzhou), '广州不受影响')
  assert(jiangmen && standardAllowsOfficialConvert(jiangmen), '江门不受影响')
  assert(foshan && standardAllowsOfficialConvert(foshan), '佛山不受影响')
  assert(zhuhai && standardAllowsOfficialConvert(zhuhai), '珠海不受影响')
  assert(shantou && standardAllowsOfficialConvert(shantou), '汕头不受影响')
  assert(shaoguan && standardAllowsOfficialConvert(shaoguan), '韶关不受影响')
  assert(shenzhen?.status === 'partial' && shenzhen.scoreTableStatus === 'partial', '深圳状态被改')
  assert(dongguan?.status === 'partial' && dongguan.scoreTableStatus === 'partial', '东莞状态被改')
  assert(zhanjiang?.status === 'partial' && zhanjiang.scoreTableStatus === 'partial', '湛江状态被改')
  assert(zhongshan && zhongshan.scoreTableStatus === 'missing' && !standardAllowsOfficialConvert(zhongshan), '中山状态被改')

  const coverage = listGuangdongCityCoverage(builtins)
  assert(coverage.length === GD_CITIES.length && GD_CITIES.length === 21, '21市覆盖丢失')
  assert(cityCoverageStatus(builtins, 'shanwei') === 'partial', '汕尾覆盖状态应为部分核验')
  assert(cityCoverageStatus(builtins, 'huizhou') === 'partial', '惠州覆盖状态')
  assert(cityCoverageStatus(builtins, 'meizhou') === 'partial', '梅州覆盖状态')
  assert(cityCoverageStatus(builtins, 'heyuan') === 'partial', '河源覆盖状态')
  assert(cityCoverageStatus(builtins, 'guangzhou') === 'verified', '广州覆盖状态')
  assert(cityCoverageStatus(builtins, 'jiangmen') === 'verified', '江门覆盖状态')
  assert(cityCoverageStatus(builtins, 'foshan') === 'verified', '佛山覆盖状态')
  assert(cityCoverageStatus(builtins, 'zhuhai') === 'verified', '珠海覆盖状态')
  assert(cityCoverageStatus(builtins, 'shantou') === 'verified', '汕头覆盖状态')
  assert(cityCoverageStatus(builtins, 'shaoguan') === 'verified', '韶关覆盖状态')
  assert(
    findApplicableStandard(builtins, { examType: 'middle_school_exam', citySlug: 'shanwei', year: 2026 }) === undefined,
    '默认查找不得把汕尾 partial 当完整'
  )

  return 'shanwei scoring standards self-check passed'
}

export function runShanweiScoringSelfCheckOrThrow(): string {
  return runShanweiScoringSelfCheck()
}
