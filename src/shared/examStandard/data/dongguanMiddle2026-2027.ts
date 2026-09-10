import { GD_CITIES } from '../regions'
import type { ExamStandard, ScoreRule } from '../types'
import { countExamItem, distanceExamItem, examItem, pendingOfficialTableRule, skillExamItem, timeExamItem } from './itemBuilders'

const STAMP = '2026-09-09T00:00:00.000Z'
const DONGGUAN = GD_CITIES.find((item) => item.citySlug === 'dongguan')!
const TABLE_PENDING = '东莞官方实施方案已核验项目结构，评分表附件尚未从市教育局附件核验转录，不能凭常识补录。'

function pending(maxScore = 120): ScoreRule {
  return pendingOfficialTableRule(TABLE_PENDING, maxScore)
}

export const DONGGUAN_MIDDLE_2026_2027: ExamStandard = {
  id: 'cn-gd-dongguan-middle-2026-2027',
  examType: 'middle_school_exam',
  regionCode: 'CN-GD',
  cityCode: DONGGUAN.cityCode,
  citySlug: DONGGUAN.citySlug,
  cityName: DONGGUAN.cityName,
  yearFrom: 2026,
  yearTo: 2027,
  policyLabel: '2026–2027',
  policyPeriod: '2026-2027',
  title: '东莞市 2026-2027 中考体育',
  sourceAuthority: '东莞市教育局',
  sourceTitle: '东莞市初中学业水平考试体育与健康科目考试实施方案（2025年修订）',
  sourceUrl: 'https://edu.dg.gov.cn/gkmlpt/content/4/4470/post_4470945.html',
  policySourceTitle: '关于印发《东莞市初中学业水平考试体育与健康科目考试实施方案（2025年修订）》的通知（东教函〔2025〕70号）',
  policySourceUrl: 'https://edu.dg.gov.cn/gkmlpt/content/4/4470/post_4470945.html',
  publishedAt: '2025-11-28',
  effectiveFrom: '2026-01-01',
  effectiveTo: '2027-12-31',
  status: 'partial',
  ruleStatus: 'verified',
  scoreTableStatus: 'partial',
  schemeLabel: '2026-2027实施方案',
  scoreYear: 2026,
  applicableGroups: ['regular'],
  enrollmentCohort: null,
  calculationNotes: '',
  notes:
    '已核验：总分60分，《国家学生体质健康标准》折合6分，现场考试折合54分。现场为必考类、体能素质类、选考类，普通考生按一类评分标准；单项满分120分，三项平均超过100按100计，折合=现场/100×54。2028年及以后为另一套权重，不并入本版本。当前仅录入已公开核验项目结构，完整评分表待官方附件核验。该城市/版本评分表尚未完整核验，暂不支持完整自动换算。',
  totalMaxScore: 60,
  scoring: { rounding: 'round0' },
  items: [
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
      scoreRule: pending()
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
      scoreRule: pending()
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
      scoreRule: pending()
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
      scoreRule: pending()
    }),
    countExamItem({
      id: 'female-sit-up',
      itemKey: 'sit-up-1min',
      name: '1分钟仰卧起坐',
      gender: 'female',
      category: 'strength',
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: pending()
    }),
    distanceExamItem({
      id: 'medicine-ball',
      itemKey: 'medicine-ball',
      name: '原地双手正面投掷实心球',
      gender: 'all',
      category: 'strength',
      decimalPlaces: 2,
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: pending()
    }),
    countExamItem({
      id: 'parallel-ladder',
      itemKey: 'parallel-ladder-hang',
      name: '平行梯悬垂攀移',
      gender: 'all',
      category: 'strength',
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: pending()
    }),
    countExamItem({
      id: 'parallel-bars-swing',
      itemKey: 'parallel-bars-swing',
      name: '一分钟双杠杠端跳起支撑前摆下',
      gender: 'all',
      category: 'strength',
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: pending()
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
      scoreRule: pending()
    }),
    skillExamItem({
      id: 'basketball-ability',
      itemKey: 'basketball-ability',
      name: '篮球运动能力',
      gender: 'all',
      category: 'skill',
      valueType: 'number',
      timeInputMode: 'seconds',
      unit: 'other',
      direction: 'higherBetter',
      decimalPlaces: 0,
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      reason: TABLE_PENDING
    }),
    skillExamItem({
      id: 'football-ability',
      itemKey: 'football-ability',
      name: '足球运动能力',
      gender: 'all',
      category: 'skill',
      valueType: 'number',
      timeInputMode: 'seconds',
      unit: 'other',
      direction: 'higherBetter',
      decimalPlaces: 0,
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      reason: TABLE_PENDING
    }),
    skillExamItem({
      id: 'volleyball-ability',
      itemKey: 'volleyball-ability',
      name: '排球运动能力',
      gender: 'all',
      category: 'skill',
      valueType: 'number',
      timeInputMode: 'seconds',
      unit: 'other',
      direction: 'higherBetter',
      decimalPlaces: 0,
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      reason: TABLE_PENDING
    }),
    skillExamItem({
      id: 'air-volleyball-ability',
      itemKey: 'air-volleyball-ability',
      name: '气排球运动能力',
      gender: 'all',
      category: 'skill',
      valueType: 'number',
      timeInputMode: 'seconds',
      unit: 'other',
      direction: 'higherBetter',
      decimalPlaces: 0,
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      reason: TABLE_PENDING
    }),
    skillExamItem({
      id: 'quality-four',
      itemKey: 'quality-four',
      name: '素质四项',
      gender: 'all',
      category: 'other',
      valueType: 'number',
      timeInputMode: 'seconds',
      unit: 'other',
      direction: 'higherBetter',
      decimalPlaces: 0,
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      reason: TABLE_PENDING
    }),
    timeExamItem({
      id: 'cross-obstacle',
      itemKey: 'cross-obstacle',
      name: '十字障碍跑',
      gender: 'all',
      category: 'speed',
      timeInputMode: 'seconds',
      decimalPlaces: 1,
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: pending()
    }),
    timeExamItem({
      id: 'triangle-run',
      itemKey: 'triangle-run',
      name: '三角蛇形跑',
      gender: 'all',
      category: 'speed',
      timeInputMode: 'seconds',
      decimalPlaces: 1,
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: pending()
    }),
    timeExamItem({
      id: 'hurdles-60m',
      itemKey: 'hurdles-60m',
      name: '60米跨栏',
      gender: 'all',
      category: 'speed',
      timeInputMode: 'seconds',
      decimalPlaces: 1,
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: pending()
    }),
    distanceExamItem({
      id: 'approach-triple-jump',
      itemKey: 'approach-triple-jump',
      name: '上步三级跳远',
      gender: 'all',
      category: 'strength',
      decimalPlaces: 2,
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: pending()
    }),
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
      decimalPlaces: 1,
      maxScore: 6,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: pendingOfficialTableRule('过程性体测按学年及格规则折合6分，本版不自动换算。', 6)
    })
  ],
  groups: [
    {
      id: 'group-required',
      title: '必考类（男1000米/女800米或100米游泳，选一）',
      selection: { mode: 'pickN', n: 1 },
      combine: 'single',
      itemIds: ['male-1000m', 'female-800m', 'swim-100m']
    },
    {
      id: 'group-fitness',
      title: '体能素质类（按性别五选一，与广州/深圳分类不同）',
      selection: { mode: 'pickN', n: 1 },
      combine: 'single',
      itemIds: ['male-pull-up', 'female-sit-up', 'medicine-ball', 'parallel-ladder', 'parallel-bars-swing', 'standing-long-jump']
    },
    {
      id: 'group-elective',
      title: '选考类（九选一）',
      selection: { mode: 'pickN', n: 1 },
      combine: 'single',
      itemIds: [
        'basketball-ability',
        'football-ability',
        'volleyball-ability',
        'air-volleyball-ability',
        'quality-four',
        'cross-obstacle',
        'triangle-run',
        'hurdles-60m',
        'approach-triple-jump'
      ]
    },
    {
      id: 'group-national',
      title: '《国家学生体质健康标准》测试',
      selection: { mode: 'all', n: 0 },
      combine: 'single',
      itemIds: ['national-fitness']
    }
  ],
  components: [
    {
      id: 'national-fitness',
      kind: 'process',
      title: '《国家学生体质健康标准》测试',
      maxScore: 6,
      weight: 0.1,
      groupIds: ['group-national']
    },
    {
      id: 'onsite',
      kind: 'onsite',
      title: '现场考试（必考 + 体能素质 + 选考，折合54分）',
      maxScore: 54,
      weight: 0.9,
      groupIds: ['group-required', 'group-fitness', 'group-elective']
    }
  ],
  createdAt: STAMP,
  updatedAt: STAMP
}
