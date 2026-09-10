import { GD_CITIES } from '../regions'
import type { ExamCandidateGroup, ExamComponent, ExamGroup, ExamItemDefinition, ExamStandard } from '../types'
import { countExamItem, distanceExamItem, examItem, pendingOfficialTableRule, skillExamItem, timeExamItem } from './itemBuilders'

const STAMP = '2026-09-09T12:00:00.000Z'
const ZHONGSHAN = GD_CITIES.find((item) => item.citySlug === 'zhongshan')!
const SOURCE_URL = 'https://jtj.zs.gov.cn/gkmlpt/content/2/2415/post_2415284.html'
const SOURCE_PDF = 'https://jtj.zs.gov.cn/attachment/0/506/506260/2415284.pdf'
const SCHEME_TITLE = '2025-2029年中山市初中学业水平考试体育与健康考试实施方案'
const TABLE_PENDING =
  '官方实施方案明确每年评分标准另行印发、以当年中考体育考试通知为准。2026年度完整项目评分表尚未从官方通知核验转录，不能凭常识补录。'

function pending(maxScore: number) {
  return pendingOfficialTableRule(TABLE_PENDING, maxScore)
}

function onsiteItems(): ExamItemDefinition[] {
  return [
    timeExamItem({
      id: 'male-1000m',
      itemKey: 'run-1000m',
      name: '1000米跑',
      gender: 'male',
      category: 'endurance',
      timeInputMode: 'minutesSeconds',
      decimalPlaces: 0,
      maxScore: 120,
      testItemBuiltinKey: 'run-1000m',
      testItemId: 'test-item-builtin-run-1000m',
      scoreRule: pending(120)
    }),
    timeExamItem({
      id: 'female-800m',
      itemKey: 'run-800m',
      name: '800米跑',
      gender: 'female',
      category: 'endurance',
      timeInputMode: 'minutesSeconds',
      decimalPlaces: 0,
      maxScore: 120,
      testItemBuiltinKey: 'run-800m',
      testItemId: 'test-item-builtin-run-800m',
      scoreRule: pending(120)
    }),
    timeExamItem({
      id: 'swim-100m',
      itemKey: 'swim-100m',
      name: '100米游泳',
      gender: 'all',
      category: 'swim',
      timeInputMode: 'minutesSeconds',
      decimalPlaces: 0,
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: pending(120)
    }),
    distanceExamItem({
      id: 'medicine-ball',
      itemKey: 'medicine-ball',
      name: '投掷实心球',
      gender: 'all',
      category: 'strength',
      decimalPlaces: 2,
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: pending(120)
    }),
    countExamItem({
      id: 'male-pull-up',
      itemKey: 'pull-up',
      name: '引体向上',
      gender: 'male',
      category: 'strength',
      maxScore: 120,
      testItemBuiltinKey: 'pull-up',
      testItemId: 'test-item-builtin-pull-up',
      scoreRule: pending(120)
    }),
    countExamItem({
      id: 'female-sit-up',
      itemKey: 'sit-up-1min',
      name: '一分钟仰卧起坐',
      gender: 'female',
      category: 'strength',
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: pending(120)
    }),
    distanceExamItem({
      id: 'standing-long-jump',
      itemKey: 'standing-long-jump',
      name: '立定跳远',
      gender: 'all',
      category: 'strength',
      decimalPlaces: 2,
      maxScore: 120,
      testItemBuiltinKey: 'standing-long-jump',
      testItemId: 'test-item-builtin-standing-long-jump',
      scoreRule: pending(120)
    }),
    distanceExamItem({
      id: 'triple-frog-jump',
      itemKey: 'triple-frog-jump',
      name: '三级连续蛙跳',
      gender: 'all',
      category: 'strength',
      decimalPlaces: 1,
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: pending(120)
    }),
    countExamItem({
      id: 'rope-skip-1min',
      itemKey: 'rope-skip-1min',
      name: '一分钟跳绳',
      gender: 'all',
      category: 'speed',
      maxScore: 120,
      testItemBuiltinKey: 'rope-skip-1min',
      testItemId: 'test-item-builtin-rope-skip-1min',
      scoreRule: pending(120)
    }),
    timeExamItem({
      id: 'run-50m',
      itemKey: 'run-50m',
      name: '50米跑',
      gender: 'all',
      category: 'speed',
      timeInputMode: 'seconds',
      decimalPlaces: 1,
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: pending(120)
    }),
    timeExamItem({
      id: 'run-200m',
      itemKey: 'run-200m',
      name: '200米跑',
      gender: 'all',
      category: 'speed',
      timeInputMode: 'seconds',
      decimalPlaces: 1,
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: pending(120)
    }),
    skillExamItem({
      id: 'football',
      itemKey: 'football',
      name: '足球',
      gender: 'all',
      category: 'skill',
      valueType: 'number',
      timeInputMode: 'seconds',
      unit: 'other',
      direction: 'higherBetter',
      decimalPlaces: 0,
      maxScore: 100,
      testItemBuiltinKey: null,
      testItemId: null,
      reason: TABLE_PENDING
    }),
    skillExamItem({
      id: 'basketball',
      itemKey: 'basketball',
      name: '篮球',
      gender: 'all',
      category: 'skill',
      valueType: 'number',
      timeInputMode: 'seconds',
      unit: 'other',
      direction: 'higherBetter',
      decimalPlaces: 0,
      maxScore: 100,
      testItemBuiltinKey: null,
      testItemId: null,
      reason: TABLE_PENDING
    }),
    skillExamItem({
      id: 'volleyball',
      itemKey: 'volleyball',
      name: '排球',
      gender: 'all',
      category: 'skill',
      valueType: 'number',
      timeInputMode: 'seconds',
      unit: 'other',
      direction: 'higherBetter',
      decimalPlaces: 0,
      maxScore: 100,
      testItemBuiltinKey: null,
      testItemId: null,
      reason: TABLE_PENDING
    }),
    skillExamItem({
      id: 'table-tennis',
      itemKey: 'table-tennis',
      name: '乒乓球',
      gender: 'all',
      category: 'skill',
      valueType: 'number',
      timeInputMode: 'seconds',
      unit: 'other',
      direction: 'higherBetter',
      decimalPlaces: 0,
      maxScore: 100,
      testItemBuiltinKey: null,
      testItemId: null,
      reason: TABLE_PENDING
    }),
    skillExamItem({
      id: 'badminton',
      itemKey: 'badminton',
      name: '羽毛球',
      gender: 'all',
      category: 'skill',
      valueType: 'number',
      timeInputMode: 'seconds',
      unit: 'other',
      direction: 'higherBetter',
      decimalPlaces: 0,
      maxScore: 100,
      testItemBuiltinKey: null,
      testItemId: null,
      reason: TABLE_PENDING
    })
  ]
}

function processItems(includeNational: boolean, includeSkill: boolean, nationalMax: number, skillMax: number): ExamItemDefinition[] {
  const items: ExamItemDefinition[] = []
  if (includeNational) {
    items.push(
      examItem({
        id: 'national-fitness',
        itemKey: 'national-fitness',
        name: '《国家学生体质健康标准》测试',
        gender: 'all',
        requirement: 'required',
        category: 'other',
        valueType: 'number',
        timeInputMode: 'seconds',
        unit: 'score',
        direction: 'higherBetter',
        decimalPlaces: 2,
        maxScore: nationalMax,
        testItemBuiltinKey: null,
        testItemId: null,
        scoreRule: pendingOfficialTableRule('国标折算按入学届别执行，不是现场项目评分表，本版不自动换算现场成绩。', nationalMax)
      })
    )
  }
  if (includeSkill) {
    items.push(
      examItem({
        id: 'special-skill',
        itemKey: 'special-skill',
        name: '专项技能测试',
        gender: 'all',
        requirement: 'required',
        category: 'skill',
        valueType: 'number',
        timeInputMode: 'seconds',
        unit: 'score',
        direction: 'higherBetter',
        decimalPlaces: 0,
        maxScore: skillMax,
        testItemBuiltinKey: null,
        testItemId: null,
        scoreRule: pendingOfficialTableRule('专项技能从选考项目2中任选1项，测试标准适当降低，年度评分表未核验。', skillMax)
      })
    )
  }
  return items
}

const ONSITE_GROUPS: ExamGroup[] = [
  {
    id: 'group-required',
    title: '必考项目（男1000米/女800米或100米游泳，二选一）',
    selection: { mode: 'pickN', n: 1 },
    combine: 'single',
    itemIds: ['male-1000m', 'female-800m', 'swim-100m']
  },
  {
    id: 'group-elective-1',
    title: '选考项目1（七选一，评分上限120）',
    selection: { mode: 'pickN', n: 1 },
    combine: 'single',
    itemIds: [
      'medicine-ball',
      'male-pull-up',
      'female-sit-up',
      'standing-long-jump',
      'triple-frog-jump',
      'rope-skip-1min',
      'run-50m',
      'run-200m'
    ]
  },
  {
    id: 'group-elective-2',
    title: '选考项目2（球类五选一，评分上限100）',
    selection: { mode: 'pickN', n: 1 },
    combine: 'single',
    itemIds: ['football', 'basketball', 'volleyball', 'table-tennis', 'badminton']
  }
]

function processGroups(includeNational: boolean, includeSkill: boolean): ExamGroup[] {
  const groups: ExamGroup[] = []
  if (includeNational) {
    groups.push({
      id: 'group-national',
      title: '《国家学生体质健康标准》测试',
      selection: { mode: 'all', n: 0 },
      combine: 'single',
      itemIds: ['national-fitness']
    })
  }
  if (includeSkill) {
    groups.push({
      id: 'group-skill',
      title: '专项技能测试（选考项目2中任选1项）',
      selection: { mode: 'all', n: 0 },
      combine: 'single',
      itemIds: ['special-skill']
    })
  }
  return groups
}

interface ZhongshanSpec {
  id: string
  policyLabel: string
  title: string
  yearFrom: number
  yearTo: number
  scoreYear: number
  totalMaxScore: number
  applicableGroups: ExamCandidateGroup[]
  enrollmentCohort: string
  calculationNotes: string
  notes: string
  includeSkill: boolean
  includeNational: boolean
  nationalMax: number
  skillMax: number
  components: ExamComponent[]
}

function buildZhongshan(spec: ZhongshanSpec): ExamStandard {
  return {
    id: spec.id,
    examType: 'middle_school_exam',
    regionCode: 'CN-GD',
    cityCode: ZHONGSHAN.cityCode,
    citySlug: ZHONGSHAN.citySlug,
    cityName: ZHONGSHAN.cityName,
    yearFrom: spec.yearFrom,
    yearTo: spec.yearTo,
    policyLabel: spec.policyLabel,
    policyPeriod: `${spec.yearFrom}-${spec.yearTo}`,
    title: spec.title,
    sourceAuthority: '中山市教育和体育局',
    sourceTitle: SCHEME_TITLE,
    sourceUrl: SOURCE_URL,
    policySourceTitle: '中山市教育和体育局关于印发实施方案的通知（中教体〔2024〕28号）',
    policySourceUrl: SOURCE_PDF,
    publishedAt: '2024-06-19',
    effectiveFrom: '2024-06-19',
    effectiveTo: '2029-12-31',
    status: 'partial',
    ruleStatus: 'verified',
    scoreTableStatus: 'missing',
    schemeLabel: '2025-2029实施方案',
    scoreYear: spec.scoreYear,
    applicableGroups: spec.applicableGroups,
    enrollmentCohort: spec.enrollmentCohort,
    calculationNotes: spec.calculationNotes,
    notes: spec.notes,
    totalMaxScore: spec.totalMaxScore,
    scoring: { rounding: 'round0' },
    items: [...onsiteItems(), ...processItems(spec.includeNational, spec.includeSkill, spec.nationalMax, spec.skillMax)],
    groups: [...ONSITE_GROUPS, ...processGroups(spec.includeNational, spec.includeSkill)],
    components: spec.components,
    createdAt: STAMP,
    updatedAt: STAMP
  }
}

const INCOMPLETE_TABLE =
  '考试方案已核验。已核验中教体〔2024〕28号实施方案、中教体通〔2024〕90号免考择考缓考补考规定、中教体通〔2024〕91号考试方法与规则（无项目评分档）。方案第八条及正文明确每年评分标准另行印发、以当年中考体育考试通知为准。2026年《中山市2026年高中阶段学校考试招生工作方案》确认体育与健康满分80分并按该实施方案执行，但未附完整项目评分表。年度完整项目评分表待官方附件核验。该城市/版本评分表尚未完整核验，暂不支持完整自动换算。'

export const ZHONGSHAN_MIDDLE_COHORT_2023: ExamStandard = buildZhongshan({
  id: 'cn-gd-zhongshan-middle-cohort-2023',
  policyLabel: '2023入学·2026应届',
  title: '中山市 2025-2029 实施方案（2023年秋季入学 / 2026应届）',
  yearFrom: 2026,
  yearTo: 2026,
  scoreYear: 2026,
  totalMaxScore: 80,
  applicableGroups: ['regular'],
  enrollmentCohort: 'autumn-2023',
  calculationNotes:
    '普通应届生满分80：统一考试30（必考×10%+选考1×10%+选考2×10%，三项折算之和超过30按30计）+体育素质综合评价50。国标只计八、九年级，各15分；专项技能只计八年级，满分20分。必考与选考1评分上限120，选考2上限100。',
  notes: `适用于2023年秋季入学普通应届生。${INCOMPLETE_TABLE}`,
  includeSkill: true,
  includeNational: true,
  nationalMax: 30,
  skillMax: 20,
  components: [
    { id: 'onsite-required', kind: 'onsite', title: '统一考试·必考项目', maxScore: 10, weight: 10 / 80, groupIds: ['group-required'] },
    { id: 'onsite-elective-1', kind: 'onsite', title: '统一考试·选考项目1', maxScore: 10, weight: 10 / 80, groupIds: ['group-elective-1'] },
    { id: 'onsite-elective-2', kind: 'onsite', title: '统一考试·选考项目2', maxScore: 10, weight: 10 / 80, groupIds: ['group-elective-2'] },
    { id: 'national-fitness', kind: 'process', title: '体育素质综合评价·国标', maxScore: 30, weight: 30 / 80, groupIds: ['group-national'] },
    { id: 'special-skill', kind: 'process', title: '体育素质综合评价·专项技能', maxScore: 20, weight: 20 / 80, groupIds: ['group-skill'] }
  ]
})

export const ZHONGSHAN_MIDDLE_REGULAR_2024: ExamStandard = buildZhongshan({
  id: 'cn-gd-zhongshan-middle-regular-2024',
  policyLabel: '2024秋及以后入学',
  title: '中山市 2025-2029 实施方案（2024年秋季及以后入学）',
  yearFrom: 2027,
  yearTo: 2029,
  scoreYear: 2026,
  totalMaxScore: 80,
  applicableGroups: ['regular'],
  enrollmentCohort: 'autumn-2024-plus',
  calculationNotes:
    '普通应届生满分80：统一考试30（必考、选考1、选考2各按评分标准得分×10%，超过30按30计）+综合评价50。国标七、八、九年级各10分（七年级70及以上10分、60-69得9分、60以下8分；八、九年级80及以上10分、70-79得9分、60-69得8分、60以下7分；未参加0分；免予执行8.5分）。专项技能七、八年级各10分，从选考项目2任选1项。',
  notes: `适用于2024年秋季及以后入学普通应届生。不得用本版本覆盖2022/2023入学规则。${INCOMPLETE_TABLE}`,
  includeSkill: true,
  includeNational: true,
  nationalMax: 30,
  skillMax: 20,
  components: [
    { id: 'onsite-required', kind: 'onsite', title: '统一考试·必考项目', maxScore: 10, weight: 10 / 80, groupIds: ['group-required'] },
    { id: 'onsite-elective-1', kind: 'onsite', title: '统一考试·选考项目1', maxScore: 10, weight: 10 / 80, groupIds: ['group-elective-1'] },
    { id: 'onsite-elective-2', kind: 'onsite', title: '统一考试·选考项目2', maxScore: 10, weight: 10 / 80, groupIds: ['group-elective-2'] },
    { id: 'national-fitness', kind: 'process', title: '体育素质综合评价·国标', maxScore: 30, weight: 30 / 80, groupIds: ['group-national'] },
    { id: 'special-skill', kind: 'process', title: '体育素质综合评价·专项技能', maxScore: 20, weight: 20 / 80, groupIds: ['group-skill'] }
  ]
})

export const ZHONGSHAN_MIDDLE_COHORT_2022: ExamStandard = buildZhongshan({
  id: 'cn-gd-zhongshan-middle-cohort-2022',
  policyLabel: '2022入学·2025应届',
  title: '中山市 2025-2029 实施方案（2022年秋季入学 / 过渡规则）',
  yearFrom: 2025,
  yearTo: 2025,
  scoreYear: 2025,
  totalMaxScore: 50,
  applicableGroups: ['regular'],
  enrollmentCohort: 'autumn-2022',
  calculationNotes:
    '2022年秋季入学普通应届生满分50：国标10分（七年级1分、八年级2分、九年级7分）+统一考试40分（必考20、选考1为10、选考2为10）。项目设置、方法、评分标准按2024年中考体育考试文件，本版未转录该年度评分表。不得套用80分普通规则。',
  notes: `2022年秋季入学过渡安排与后续80分规则明显不同，单独保留。${INCOMPLETE_TABLE}`,
  includeSkill: false,
  includeNational: true,
  nationalMax: 10,
  skillMax: 0,
  components: [
    { id: 'onsite-required', kind: 'onsite', title: '统一考试·必考项目', maxScore: 20, weight: 20 / 50, groupIds: ['group-required'] },
    { id: 'onsite-elective-1', kind: 'onsite', title: '统一考试·选考项目1', maxScore: 10, weight: 10 / 50, groupIds: ['group-elective-1'] },
    { id: 'onsite-elective-2', kind: 'onsite', title: '统一考试·选考项目2', maxScore: 10, weight: 10 / 50, groupIds: ['group-elective-2'] },
    { id: 'national-fitness', kind: 'process', title: '《国家学生体质健康标准》测试', maxScore: 10, weight: 10 / 50, groupIds: ['group-national'] }
  ]
})

export const ZHONGSHAN_MIDDLE_RETURNING: ExamStandard = buildZhongshan({
  id: 'cn-gd-zhongshan-middle-returning',
  policyLabel: '外地返中山生',
  title: '中山市 2025-2029 实施方案（外地返中山生）',
  yearFrom: 2025,
  yearTo: 2029,
  scoreYear: 2026,
  totalMaxScore: 80,
  applicableGroups: ['returning'],
  enrollmentCohort: 'returning',
  calculationNotes:
    '外地返中山生：国标30分+统一考试50分。统一考试必考按评分标准×20%、选考1×15%、选考2×15%，超过50按50计。不得套用普通应届生统一考试30分规则。',
  notes: `仅适用于外地返中山生，不适用于普通应届生或往届生。${INCOMPLETE_TABLE}`,
  includeSkill: false,
  includeNational: true,
  nationalMax: 30,
  skillMax: 0,
  components: [
    { id: 'onsite-required', kind: 'onsite', title: '统一考试·必考项目', maxScore: 20, weight: 20 / 80, groupIds: ['group-required'] },
    { id: 'onsite-elective-1', kind: 'onsite', title: '统一考试·选考项目1', maxScore: 15, weight: 15 / 80, groupIds: ['group-elective-1'] },
    { id: 'onsite-elective-2', kind: 'onsite', title: '统一考试·选考项目2', maxScore: 15, weight: 15 / 80, groupIds: ['group-elective-2'] },
    { id: 'national-fitness', kind: 'process', title: '《国家学生体质健康标准》测试', maxScore: 30, weight: 30 / 80, groupIds: ['group-national'] }
  ]
})

export const ZHONGSHAN_MIDDLE_REPEAT: ExamStandard = buildZhongshan({
  id: 'cn-gd-zhongshan-middle-repeat',
  policyLabel: '往届生',
  title: '中山市 2025-2029 实施方案（往届生）',
  yearFrom: 2025,
  yearTo: 2029,
  scoreYear: 2026,
  totalMaxScore: 80,
  applicableGroups: ['repeat'],
  enrollmentCohort: 'repeat',
  calculationNotes:
    '往届生不计算体育素质综合评价，只计算统一考试，满分80。必考×30%、选考1×25%、选考2×25%，超过80按80计。不得套用普通应届生规则，不得以运动员等级或竞赛成绩申请免考。',
  notes: `仅适用于往届生，不计算综合评价。${INCOMPLETE_TABLE}`,
  includeSkill: false,
  includeNational: false,
  nationalMax: 0,
  skillMax: 0,
  components: [
    { id: 'onsite-required', kind: 'onsite', title: '统一考试·必考项目', maxScore: 30, weight: 30 / 80, groupIds: ['group-required'] },
    { id: 'onsite-elective-1', kind: 'onsite', title: '统一考试·选考项目1', maxScore: 25, weight: 25 / 80, groupIds: ['group-elective-1'] },
    { id: 'onsite-elective-2', kind: 'onsite', title: '统一考试·选考项目2', maxScore: 25, weight: 25 / 80, groupIds: ['group-elective-2'] }
  ]
})

export const ZHONGSHAN_MIDDLE_STANDARDS: ExamStandard[] = [
  ZHONGSHAN_MIDDLE_COHORT_2023,
  ZHONGSHAN_MIDDLE_REGULAR_2024,
  ZHONGSHAN_MIDDLE_COHORT_2022,
  ZHONGSHAN_MIDDLE_RETURNING,
  ZHONGSHAN_MIDDLE_REPEAT
]
