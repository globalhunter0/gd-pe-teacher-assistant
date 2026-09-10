import { listBuiltinExamStandards } from './catalog'
import { cityCoverageStatus } from './coverage'
import { convertExamBatch } from '../examBatch/convert'
import type { ExamColumnMapping } from '../examBatch/types'
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

function onsiteMax(standard: { components: Array<{ kind: string; title: string; maxScore: number }> }, kindTitlePrefix: string): number {
  return standard.components.filter((item) => item.kind === 'onsite' && item.title.includes(kindTitlePrefix)).reduce((sum, item) => sum + item.maxScore, 0)
}

export function runZhongshanScoringSelfCheck(): string {
  const builtins = listBuiltinExamStandards()
  const cohort2023 = builtins.find((item) => item.id === 'cn-gd-zhongshan-middle-cohort-2023')
  const regular2024 = builtins.find((item) => item.id === 'cn-gd-zhongshan-middle-regular-2024')
  const cohort2022 = builtins.find((item) => item.id === 'cn-gd-zhongshan-middle-cohort-2022')
  const returning = builtins.find((item) => item.id === 'cn-gd-zhongshan-middle-returning')
  const repeat = builtins.find((item) => item.id === 'cn-gd-zhongshan-middle-repeat')
  const guangzhou = builtins.find((item) => item.id === 'cn-gd-guangzhou-middle-2024-2026')
  const jiangmen = builtins.find((item) => item.id === 'cn-gd-jiangmen-middle-2026')
  const shenzhen = builtins.find((item) => item.id === 'cn-gd-shenzhen-middle-2026')
  const dongguan = builtins.find((item) => item.id === 'cn-gd-dongguan-middle-2026-2027')
  const shaoguan = builtins.find((item) => item.id === 'cn-gd-shaoguan-middle-2026')
  const shantou = builtins.find((item) => item.id === 'cn-gd-shantou-middle-2026')
  const foshan = builtins.find((item) => item.id === 'cn-gd-foshan-middle-2026')
  const zhuhai = builtins.find((item) => item.id === 'cn-gd-zhuhai-middle-2026')
  const heyuan = builtins.find((item) => item.id === 'cn-gd-heyuan-middle-2026')
  const meizhou = builtins.find((item) => item.id === 'cn-gd-meizhou-middle-2026')
  const huizhou = builtins.find((item) => item.id === 'cn-gd-huizhou-middle-2026')
  const shanwei = builtins.find((item) => item.id === 'cn-gd-shanwei-middle-2026')
  const zhanjiang = builtins.find((item) => item.id === 'cn-gd-zhanjiang-middle-2026')

  assert(cohort2023, '中山2023入学版本缺失')
  assert(cohort2023.totalMaxScore === 80, '1. 中山总分=80')
  const onsiteTotal = cohort2023.components.filter((item) => item.kind === 'onsite').reduce((sum, item) => sum + item.maxScore, 0)
  const processTotal = cohort2023.components.filter((item) => item.kind === 'process').reduce((sum, item) => sum + item.maxScore, 0)
  assert(onsiteTotal === 30, '2. 统一考试=30')
  assert(processTotal === 50, '3. 体育素质综合评价=50')
  assert(cohort2023.groups.some((group) => group.id === 'group-required'), '4. 必考结构缺失')
  assert(cohort2023.groups.some((group) => group.id === 'group-elective-1'), '4. 选考1结构缺失')
  assert(cohort2023.groups.some((group) => group.id === 'group-elective-2'), '4. 选考2结构缺失')

  const required = cohort2023.items.filter((item) => ['male-1000m', 'female-800m', 'swim-100m'].includes(item.id))
  const elective1 = cohort2023.items.filter((item) =>
    ['medicine-ball', 'male-pull-up', 'female-sit-up', 'standing-long-jump', 'triple-frog-jump', 'rope-skip-1min', 'run-50m', 'run-200m'].includes(item.id)
  )
  const elective2 = cohort2023.items.filter((item) => ['football', 'basketball', 'volleyball', 'table-tennis', 'badminton'].includes(item.id))
  assert(required.every((item) => item.maxScore === 120 && item.scoreRule.maxScore === 120), '5. 120分上限项目被改成100')
  assert(elective1.every((item) => item.maxScore === 120), '5. 选考1上限不是120')
  assert(elective2.every((item) => item.maxScore === 100 && item.scoreRule.maxScore === 100), '5. 选考2上限不是100')
  assert(onsiteMax(cohort2023, '统一考试') === 30, '6. 最终统一考试最高30分')

  assert(regular2024 && cohort2022, '7. 不同入学年份规则缺失')
  assert(cohort2022.totalMaxScore === 50, '7. 2022入学仍被改成80分')
  assert(regular2024.enrollmentCohort !== cohort2023.enrollmentCohort, '7. 不同入学年份被合并')
  assert(regular2024.id !== cohort2023.id && cohort2022.id !== cohort2023.id, '7. 不同入学年份规则互覆盖')

  assert(returning && repeat, '8. 返中山生/往届生版本缺失')
  assert(!returning.applicableGroups.includes('regular'), '8. 返中山生误标普通考生')
  assert(!repeat.applicableGroups.includes('regular'), '8. 往届生误标普通考生')
  assert(returning.components.find((item) => item.id === 'onsite-required')?.maxScore === 20, '8. 返中山生必考不是20分')
  assert(repeat.components.find((item) => item.id === 'onsite-required')?.maxScore === 30, '8. 往届生必考不是30分')
  assert(!repeat.components.some((item) => item.kind === 'process'), '8. 往届生不应计入综合评价')

  const default2026 = findApplicableStandard(builtins, {
    examType: 'middle_school_exam',
    citySlug: 'zhongshan',
    year: 2026,
    statuses: ['partial', 'verified']
  })
  assert(default2026?.id === cohort2023.id, '8. 默认查找把返中山生套给普通考生')
  const returningHit = findApplicableStandard(builtins, {
    examType: 'middle_school_exam',
    citySlug: 'zhongshan',
    year: 2026,
    statuses: ['partial', 'verified'],
    applicableGroup: 'returning'
  })
  assert(returningHit?.id === returning.id, '8. 返中山生查找失败')

  assert(cohort2023.notes.includes('中教体通〔2024〕91号'), '中山应记录已核验的方法与规则文件')
  assert(cohort2023.notes.includes('尚未完整核验'), '中山必须标明评分表未完整核验')
  assert(cohort2023.sourceUrl?.includes('jtj.zs.gov.cn'), '中山官方来源丢失')
  assert(cohort2023.scoreTableStatus === 'missing', '中山2026评分表不得假装完整')
  assert(!standardAllowsOfficialConvert(cohort2023), '9. 年度评分表不完整时禁止自动换算')
  assert(cohort2023.items.every((item) => !itemSupportsAutoScore(item)), '9. 中山不得带可换算评分表')
  const blocked = calculateExamScore({
    standard: cohort2023,
    itemId: 'male-1000m',
    rawValue: 220,
    gender: 'male',
    officialOnly: true
  })
  assert(!blocked.ok && blocked.message === OFFICIAL_SCORE_SCHEME_ONLY, '9. 中山仍被允许自动换算')

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
  const batch = convertExamBatch(
    cohort2023,
    mapping,
    [{ excelRow: 2, cells: ['测', '1', '1班', '男', '1000米跑', '3:40'], raw: ['测', '1', '1班', '男', '1000米跑', '3:40'] }],
    ['姓名', '学号', '班级', '性别', '项目', '成绩']
  )
  assert(batch.rows[0]?.score == null, '9. 批量换算给中山打了分')

  assert(guangzhou?.status === 'verified' && standardAllowsOfficialConvert(guangzhou), '10. 广州完整标准受影响')
  assert(jiangmen?.status === 'verified' && standardAllowsOfficialConvert(jiangmen), '10. 江门完整标准受影响')
  const gz = calculateExamScore({ standard: guangzhou!, itemId: 'male-1000m', rawValue: 217, gender: 'male', officialOnly: true })
  assert(gz.ok && gz.score === 100, '10. 广州换算被破坏')
  const sg = calculateExamScore({ standard: shaoguan!, itemId: 'male-1000m', rawValue: 220, gender: 'male', officialOnly: true })
  const st = calculateExamScore({ standard: shantou!, itemId: 'male-1000m', rawValue: 220, gender: 'male', officialOnly: true })
  const gz220 = calculateExamScore({ standard: guangzhou!, itemId: 'male-1000m', rawValue: 220, gender: 'male', officialOnly: true })
  assert(gz220.ok && sg.ok && st.ok, '对照城市1000米应仍可换算')
  assert(gz220.score !== sg.score && st.score !== sg.score, '对照城市必须仍分表')
  assert(cohort2023.id !== guangzhou!.id && cohort2023.id !== shaoguan!.id && cohort2023.id !== shantou!.id, '中山不得串用广州韶关汕头版本')
  const female1000 = calculateExamScore({
    standard: guangzhou!,
    itemId: 'male-1000m',
    rawValue: 220,
    gender: 'female',
    officialOnly: true
  })
  assert(!female1000.ok, '对照城市男女表隔离被破坏')
  assert(foshan && standardAllowsOfficialConvert(foshan), '佛山完整标准受影响')
  assert(zhuhai && standardAllowsOfficialConvert(zhuhai), '珠海完整标准受影响')
  assert(shaoguan && standardAllowsOfficialConvert(shaoguan), '韶关完整标准受影响')
  assert(shantou && standardAllowsOfficialConvert(shantou), '汕头完整标准受影响')

  assert(shenzhen?.status === 'partial' && shenzhen.scoreTableStatus === 'partial', '11. 深圳partial状态受影响')
  assert(dongguan?.status === 'partial', '11. 东莞partial状态受影响')
  assert(zhanjiang?.status === 'partial' && zhanjiang.scoreTableStatus === 'partial', '11. 湛江partial状态受影响')
  assert(heyuan && heyuan.scoreTableStatus === 'missing' && heyuan.status === 'partial', '河源状态被改')
  assert(meizhou && meizhou.status === 'partial' && meizhou.scoreTableStatus === 'missing', '梅州状态被改')
  assert(huizhou && huizhou.status === 'partial' && huizhou.scoreTableStatus === 'missing', '惠州状态被改')
  assert(shanwei && shanwei.status === 'partial' && shanwei.scoreTableStatus === 'missing', '汕尾状态被改')
  assert(cityCoverageStatus(builtins, 'zhongshan') === 'scheme_verified', '中山覆盖状态应为规则已核验')
  assert(cityCoverageStatus(builtins, 'heyuan') === 'partial', '河源覆盖被改')
  assert(cityCoverageStatus(builtins, 'meizhou') === 'partial', '梅州覆盖被改')
  assert(cityCoverageStatus(builtins, 'huizhou') === 'partial', '惠州覆盖被改')
  assert(cityCoverageStatus(builtins, 'shanwei') === 'partial', '汕尾覆盖被改')
  assert(cityCoverageStatus(builtins, 'shenzhen') === 'partial', '11. 深圳覆盖被改成已核验')
  assert(cityCoverageStatus(builtins, 'guangzhou') === 'verified', '10. 广州覆盖状态受影响')
  assert(GD_CITIES.length === 21, '21市名单被改')

  return 'zhongshan scoring standards self-check passed'
}

export function runZhongshanScoringSelfCheckOrThrow(): string {
  return runZhongshanScoringSelfCheck()
}
