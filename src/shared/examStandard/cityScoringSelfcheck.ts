import { convertExamBatch } from '../examBatch/convert'
import { listBuiltinExamStandards } from './catalog'
import { cityCoverageStatus, listGuangdongCityCoverage } from './coverage'
import { jiangmenDotTimeToSeconds } from './data/jiangmenTables'
import { GD_CITIES } from './regions'
import {
  calculateExamScore,
  findApplicableStandard,
  itemSupportsAutoScore,
  OFFICIAL_SCORE_PARTIAL,
  standardAllowsOfficialConvert
} from './score'
import type { ExamStandard } from './types'
import type { ExamColumnMapping } from '../examBatch/types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function longBatch(standard: ExamStandard, raw: string) {
  const titles = ['姓名', '学号', '班级', '性别', '项目', '成绩']
  const mapping: ExamColumnMapping = {
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
  return convertExamBatch(
    standard,
    mapping,
    [
      {
        excelRow: 2,
        cells: ['测试', '1', '1班', '男', '1000米跑', raw],
        raw: ['测试', '1', '1班', '男', '1000米跑', raw]
      }
    ],
    titles
  )
}

export function runCityScoringStandardsSelfCheck(): string {
  const builtins = listBuiltinExamStandards()
  const guangzhou = builtins.find((item) => item.id === 'cn-gd-guangzhou-middle-2024-2026')
  const shenzhen = builtins.find((item) => item.id === 'cn-gd-shenzhen-middle-2026')
  const dongguan = builtins.find((item) => item.id === 'cn-gd-dongguan-middle-2026-2027')
  const jiangmen = builtins.find((item) => item.id === 'cn-gd-jiangmen-middle-2026')
  const zhanjiang = builtins.find((item) => item.id === 'cn-gd-zhanjiang-middle-2026')
  const gaokao = builtins.find((item) => item.id === 'cn-gd-gaokao-sports-2026')

  assert(guangzhou, '1. 广州版本仍正常')
  assert(guangzhou.status === 'verified', '1. 广州版本仍正常')
  assert(guangzhou.sourceUrl?.includes('gzzk.gz.gov.cn'), '10. 广州官方来源字段存在')
  const gz1000 = calculateExamScore({
    standard: guangzhou,
    itemId: 'male-1000m',
    rawValue: 217,
    gender: 'male',
    officialOnly: true
  })
  assert(gz1000.ok && gz1000.score === 100, '9. verified 广州可正常换算')

  assert(shenzhen, '2. 深圳2026可正确读取')
  assert(shenzhen.status === 'partial' && shenzhen.yearFrom === 2026 && shenzhen.totalMaxScore === 50, '2. 深圳2026结构不正确')
  assert(shenzhen.sourceUrl === 'https://www.sz.gov.cn/cn/xxgk/zfxxgj/tzgg/content/post_12645571.html', '10. 深圳官方来源字段存在')
  assert(shenzhen.items.some((item) => item.itemKey === 'rope-skip-4min'), '深圳一类项目缺失')
  assert(shenzhen.items.every((item) => !itemSupportsAutoScore(item)), '深圳不得带完整评分表')

  assert(dongguan, '3. 东莞2026-2027可正确读取')
  assert(dongguan.status === 'partial' && dongguan.yearFrom === 2026 && dongguan.yearTo === 2027, '3. 东莞年份不正确')
  assert(dongguan.totalMaxScore === 60, '东莞总分不是60')
  assert(dongguan.groups.some((group) => group.id === 'group-fitness'), '东莞体能素质类被套用广州模板')
  assert(dongguan.sourceUrl?.includes('edu.dg.gov.cn'), '10. 东莞官方来源字段存在')

  assert(jiangmen, '4. 江门2026可正确读取')
  assert(jiangmen.status === 'verified' && jiangmen.totalMaxScore === 65, '江门总分或状态不正确')
  assert(jiangmen.sourceUrl?.includes('jiangmen.gov.cn'), '10. 江门官方来源字段存在')
  const jm1000 = calculateExamScore({
    standard: jiangmen,
    itemId: 'male-1000m',
    rawValue: jiangmenDotTimeToSeconds(3.33),
    gender: 'male',
    officialOnly: true
  })
  assert(jm1000.ok && jm1000.score === 100, '9. verified 江门可正常换算')

  assert(zhanjiang, '5. 湛江 partial 状态不会被误认为完整')
  assert(zhanjiang.status === 'partial', '5. 湛江 partial 状态不会被误认为完整')
  assert(!standardAllowsOfficialConvert(zhanjiang), '5. 湛江被允许完整自动换算')
  const zjScore = calculateExamScore({
    standard: zhanjiang,
    itemId: 'male-1000m',
    rawValue: 220,
    gender: 'male',
    officialOnly: true
  })
  assert(!zjScore.ok && (zjScore.message === OFFICIAL_SCORE_PARTIAL || zjScore.message.includes('年度评分表尚未完整核验')), '8. partial 标准禁止完整自动换算')

  const gzThreshold = guangzhou.items.find((item) => item.id === 'male-1000m')
  const jmThreshold = jiangmen.items.find((item) => item.id === 'male-1000m')
  assert(
    gzThreshold?.scoreRule.kind === 'thresholdTable' &&
      jmThreshold?.scoreRule.kind === 'thresholdTable' &&
      gzThreshold.scoreRule.entries[0].threshold !== jmThreshold.scoreRule.entries[0].threshold,
    '6. 不同城市同项目评分互不覆盖'
  )
  assert(guangzhou.id !== jiangmen.id && guangzhou.policyLabel !== jiangmen.policyLabel, '7. 不同年份版本互不覆盖')
  assert(findApplicableStandard(builtins, { examType: 'middle_school_exam', citySlug: 'guangzhou', year: 2026 })?.id === guangzhou.id, '7. 查找不得覆盖广州历史版本')
  assert(
    findApplicableStandard(builtins, { examType: 'middle_school_exam', citySlug: 'shenzhen', year: 2026 }) === undefined,
    '5. 默认查找把深圳 partial 当成完整'
  )

  const coverage = listGuangdongCityCoverage(builtins)
  assert(coverage.length === GD_CITIES.length && GD_CITIES.length === 21, '21 地级市覆盖状态数量不正确')
  assert(cityCoverageStatus(builtins, 'guangzhou') === 'verified', '广州覆盖状态应为已核验')
  assert(cityCoverageStatus(builtins, 'jiangmen') === 'verified', '江门覆盖状态应为已核验')
  assert(cityCoverageStatus(builtins, 'shenzhen') === 'partial', '深圳覆盖状态应为部分核验')
  assert(cityCoverageStatus(builtins, 'dongguan') === 'partial', '东莞覆盖状态应为部分核验')
  assert(cityCoverageStatus(builtins, 'zhanjiang') === 'partial', '湛江覆盖状态应为部分核验')
  assert(cityCoverageStatus(builtins, 'foshan') === 'verified', '佛山覆盖状态应为已核验')
  assert(cityCoverageStatus(builtins, 'zhuhai') === 'verified', '珠海覆盖状态应为已核验')
  assert(cityCoverageStatus(builtins, 'shantou') === 'verified', '汕头覆盖状态应为已核验')
  assert(cityCoverageStatus(builtins, 'shaoguan') === 'verified', '韶关覆盖状态应为已核验')
  assert(cityCoverageStatus(builtins, 'heyuan') === 'partial', '河源覆盖状态应为部分核验')
  assert(cityCoverageStatus(builtins, 'meizhou') === 'partial', '梅州覆盖状态应为部分核验')
  assert(cityCoverageStatus(builtins, 'huizhou') === 'partial', '惠州覆盖状态应为部分核验')
  assert(cityCoverageStatus(builtins, 'shanwei') === 'partial', '汕尾覆盖状态应为部分核验')
  assert(cityCoverageStatus(builtins, 'zhongshan') === 'scheme_verified', '中山覆盖状态应为规则已核验')
  assert(cityCoverageStatus(builtins, 'yangjiang') === 'partial', '阳江覆盖状态应为部分核验')
  assert(cityCoverageStatus(builtins, 'maoming') === 'scheme_verified', '茂名覆盖状态应为规则已核验')
  assert(cityCoverageStatus(builtins, 'zhaoqing') === 'verified', '肇庆覆盖状态应为已核验')
  assert(cityCoverageStatus(builtins, 'qingyuan') === 'partial', '清远覆盖状态应为部分核验')
  assert(cityCoverageStatus(builtins, 'chaozhou') === 'partial', '潮州覆盖状态应为部分核验')
  assert(cityCoverageStatus(builtins, 'jieyang') === 'scheme_verified', '揭阳覆盖状态应为规则已核验')
  assert(cityCoverageStatus(builtins, 'yunfu') === 'partial', '云浮覆盖状态应为部分核验')
  assert(
    coverage.every((row) => row.coverage !== 'verified' || row.versions.some((item) => item.status === 'verified')),
    '已核验覆盖不得来自伪造数据'
  )

  const batchPartial = longBatch(zhanjiang!, '3:40')
  assert(batchPartial.rows[0]?.score == null, '8. 批量换算不得给 partial 打分')
  assert(batchPartial.rows[0]?.message.includes('尚未完整核验'), '8. 批量换算未提示部分核验')

  const batchVerified = longBatch(jiangmen, '3:33')
  assert(batchVerified.rows[0]?.score === 100, '9. verified 标准批量换算失败')

  assert(gaokao?.status === 'verified', '11. 旧评分标准数据兼容：体育高考仍在')
  assert(builtins.filter((item) => item.id === 'cn-gd-guangzhou-middle-2024-2026').length === 1, '11. 广州标准被重复造第二份')

  for (const item of builtins) {
    if (item.examType === 'middle_school_exam' && (item.status === 'verified' || item.status === 'partial')) {
      assert(Boolean(item.sourceAuthority && item.sourceTitle && item.sourceUrl), `10. ${item.id} 缺少官方来源字段`)
    }
  }

  return 'city scoring standards self-check passed'
}

export function runCityScoringStandardsSelfCheckOrThrow(): string {
  return runCityScoringStandardsSelfCheck()
}
