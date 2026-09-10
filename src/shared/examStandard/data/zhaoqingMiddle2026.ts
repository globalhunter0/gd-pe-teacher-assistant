import { GD_CITIES } from '../regions'
import type { ExamGroup, ExamItemDefinition, ExamStandard } from '../types'
import { countExamItem, distanceExamItem, examItem, timeExamItem } from './itemBuilders'
import {
  ZHAOQING_FEMALE_100M_SWIM,
  ZHAOQING_FEMALE_50M,
  ZHAOQING_FEMALE_800M,
  ZHAOQING_FEMALE_BASKETBALL,
  ZHAOQING_FEMALE_FOOTBALL,
  ZHAOQING_FEMALE_MEDICINE_BALL,
  ZHAOQING_FEMALE_SIT_UP,
  ZHAOQING_FEMALE_STANDING_LONG_JUMP,
  ZHAOQING_FEMALE_VOLLEYBALL,
  ZHAOQING_MALE_1000M,
  ZHAOQING_MALE_100M_SWIM,
  ZHAOQING_MALE_50M,
  ZHAOQING_MALE_BASKETBALL,
  ZHAOQING_MALE_FOOTBALL,
  ZHAOQING_MALE_MEDICINE_BALL,
  ZHAOQING_MALE_PULL_UP,
  ZHAOQING_MALE_STANDING_LONG_JUMP,
  ZHAOQING_MALE_VOLLEYBALL,
  ZHAOQING_PROCESS_REASON,
  ZHAOQING_ROPE
} from './zhaoqingTables'

const STAMP = '2026-09-10T08:40:00.000Z'
const ZHAOQING = GD_CITIES.find((item) => item.citySlug === 'zhaoqing')!
const SOURCE_URL = 'https://www.zhaoqing.gov.cn/zqjyj/gkmlpt/content/3/3203/post_3203608.html'
const ATT_URL = 'https://www.zhaoqing.gov.cn/zqjyj/attachment/0/293/293422/3203608.doc'
const NOTICE_DOC = 'https://www.zhaoqing.gov.cn/zqjyj/attachment/0/293/293418/3203608.doc'

const ITEMS: ExamItemDefinition[] = [
  timeExamItem({
    id: 'male-1000m',
    itemKey: 'run-1000m',
    name: '1000米跑',
    gender: 'male',
    category: 'endurance',
    timeInputMode: 'minutesSeconds',
    decimalPlaces: 2,
    testItemBuiltinKey: 'run-1000m',
    testItemId: 'test-item-builtin-run-1000m',
    scoreRule: ZHAOQING_MALE_1000M
  }),
  timeExamItem({
    id: 'female-800m',
    itemKey: 'run-800m',
    name: '800米跑',
    gender: 'female',
    category: 'endurance',
    timeInputMode: 'minutesSeconds',
    decimalPlaces: 2,
    testItemBuiltinKey: 'run-800m',
    testItemId: 'test-item-builtin-run-800m',
    scoreRule: ZHAOQING_FEMALE_800M
  }),
  timeExamItem({
    id: 'male-100m-swim',
    itemKey: 'swim-100m',
    name: '100米游泳',
    gender: 'male',
    category: 'swim',
    timeInputMode: 'minutesSeconds',
    decimalPlaces: 2,
    testItemBuiltinKey: null,
    testItemId: null,
    scoreRule: ZHAOQING_MALE_100M_SWIM
  }),
  timeExamItem({
    id: 'female-100m-swim',
    itemKey: 'swim-100m',
    name: '100米游泳',
    gender: 'female',
    category: 'swim',
    timeInputMode: 'minutesSeconds',
    decimalPlaces: 2,
    testItemBuiltinKey: null,
    testItemId: null,
    scoreRule: ZHAOQING_FEMALE_100M_SWIM
  }),
  timeExamItem({
    id: 'male-50m',
    itemKey: 'run-50m',
    name: '50米跑',
    gender: 'male',
    category: 'speed',
    timeInputMode: 'seconds',
    decimalPlaces: 2,
    testItemBuiltinKey: 'run-50m',
    testItemId: 'test-item-builtin-run-50m',
    scoreRule: ZHAOQING_MALE_50M
  }),
  timeExamItem({
    id: 'female-50m',
    itemKey: 'run-50m',
    name: '50米跑',
    gender: 'female',
    category: 'speed',
    timeInputMode: 'seconds',
    decimalPlaces: 2,
    testItemBuiltinKey: 'run-50m',
    testItemId: 'test-item-builtin-run-50m',
    scoreRule: ZHAOQING_FEMALE_50M
  }),
  distanceExamItem({
    id: 'male-standing-long-jump',
    itemKey: 'standing-long-jump',
    name: '立定跳远',
    gender: 'male',
    category: 'strength',
    decimalPlaces: 2,
    testItemBuiltinKey: 'standing-long-jump',
    testItemId: 'test-item-builtin-standing-long-jump',
    scoreRule: ZHAOQING_MALE_STANDING_LONG_JUMP
  }),
  distanceExamItem({
    id: 'female-standing-long-jump',
    itemKey: 'standing-long-jump',
    name: '立定跳远',
    gender: 'female',
    category: 'strength',
    decimalPlaces: 2,
    testItemBuiltinKey: 'standing-long-jump',
    testItemId: 'test-item-builtin-standing-long-jump',
    scoreRule: ZHAOQING_FEMALE_STANDING_LONG_JUMP
  }),
  countExamItem({
    id: 'male-pull-up',
    itemKey: 'pull-up',
    name: '引体向上',
    gender: 'male',
    category: 'strength',
    testItemBuiltinKey: 'pull-up',
    testItemId: 'test-item-builtin-pull-up',
    scoreRule: ZHAOQING_MALE_PULL_UP
  }),
  countExamItem({
    id: 'female-sit-up',
    itemKey: 'sit-up',
    name: '一分钟仰卧起坐',
    gender: 'female',
    category: 'strength',
    testItemBuiltinKey: null,
    testItemId: null,
    scoreRule: ZHAOQING_FEMALE_SIT_UP
  }),
  distanceExamItem({
    id: 'male-medicine-ball',
    itemKey: 'medicine-ball',
    name: '投掷实心球',
    gender: 'male',
    category: 'strength',
    decimalPlaces: 2,
    testItemBuiltinKey: 'medicine-ball',
    testItemId: 'test-item-builtin-medicine-ball',
    scoreRule: ZHAOQING_MALE_MEDICINE_BALL
  }),
  distanceExamItem({
    id: 'female-medicine-ball',
    itemKey: 'medicine-ball',
    name: '投掷实心球',
    gender: 'female',
    category: 'strength',
    decimalPlaces: 2,
    testItemBuiltinKey: 'medicine-ball',
    testItemId: 'test-item-builtin-medicine-ball',
    scoreRule: ZHAOQING_FEMALE_MEDICINE_BALL
  }),
  timeExamItem({
    id: 'male-football',
    itemKey: 'football',
    name: '足球25米绕竿运球',
    gender: 'male',
    category: 'skill',
    timeInputMode: 'seconds',
    decimalPlaces: 1,
    testItemBuiltinKey: null,
    testItemId: null,
    scoreRule: ZHAOQING_MALE_FOOTBALL
  }),
  timeExamItem({
    id: 'female-football',
    itemKey: 'football',
    name: '足球25米绕竿运球',
    gender: 'female',
    category: 'skill',
    timeInputMode: 'seconds',
    decimalPlaces: 1,
    testItemBuiltinKey: null,
    testItemId: null,
    scoreRule: ZHAOQING_FEMALE_FOOTBALL
  }),
  timeExamItem({
    id: 'male-basketball-dribble',
    itemKey: 'basketball-dribble',
    name: '篮球半场来回运球上篮',
    gender: 'male',
    category: 'skill',
    timeInputMode: 'seconds',
    decimalPlaces: 1,
    testItemBuiltinKey: null,
    testItemId: null,
    scoreRule: ZHAOQING_MALE_BASKETBALL
  }),
  timeExamItem({
    id: 'female-basketball-dribble',
    itemKey: 'basketball-dribble',
    name: '篮球半场来回运球上篮',
    gender: 'female',
    category: 'skill',
    timeInputMode: 'seconds',
    decimalPlaces: 1,
    testItemBuiltinKey: null,
    testItemId: null,
    scoreRule: ZHAOQING_FEMALE_BASKETBALL
  }),
  timeExamItem({
    id: 'male-volleyball',
    itemKey: 'volleyball',
    name: '排球传、抛、垫',
    gender: 'male',
    category: 'skill',
    timeInputMode: 'seconds',
    decimalPlaces: 1,
    testItemBuiltinKey: null,
    testItemId: null,
    scoreRule: ZHAOQING_MALE_VOLLEYBALL
  }),
  timeExamItem({
    id: 'female-volleyball',
    itemKey: 'volleyball',
    name: '排球传、抛、垫',
    gender: 'female',
    category: 'skill',
    timeInputMode: 'seconds',
    decimalPlaces: 1,
    testItemBuiltinKey: null,
    testItemId: null,
    scoreRule: ZHAOQING_FEMALE_VOLLEYBALL
  }),
  countExamItem({
    id: 'rope-skip-1min',
    itemKey: 'rope-skip-1min',
    name: '一分钟跳绳',
    gender: 'all',
    category: 'speed',
    testItemBuiltinKey: 'rope-skip-1min',
    testItemId: 'test-item-builtin-rope-skip-1min',
    scoreRule: ZHAOQING_ROPE
  }),
  examItem({
    id: 'pe-class-eval',
    itemKey: 'pe-class-eval',
    name: '体育与健康课评价',
    gender: 'all',
    requirement: 'required',
    category: 'other',
    valueType: 'number',
    timeInputMode: 'seconds',
    unit: 'score',
    direction: 'higherBetter',
    decimalPlaces: 1,
    maxScore: 5,
    testItemBuiltinKey: null,
    testItemId: null,
    verification: 'verified_unsupported',
    scoreRule: {
      kind: 'unsupported',
      reason: ZHAOQING_PROCESS_REASON,
      maxScore: 5,
      minScore: 0
    }
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
    decimalPlaces: 0,
    maxScore: 10,
    testItemBuiltinKey: null,
    testItemId: null,
    verification: 'verified_unsupported',
    scoreRule: {
      kind: 'unsupported',
      reason: ZHAOQING_PROCESS_REASON,
      maxScore: 10,
      minScore: 0
    }
  })
]

const GROUPS: ExamGroup[] = [
  {
    id: 'group-required',
    title: '必考项目（中长跑或100米游泳，二选一，占25分）',
    selection: { mode: 'pickN', n: 1 },
    combine: 'single',
    itemIds: ['male-1000m', 'female-800m', 'male-100m-swim', 'female-100m-swim']
  },
  {
    id: 'group-fitness',
    title: '体能选项（四选一）',
    selection: { mode: 'pickN', n: 1 },
    combine: 'single',
    itemIds: [
      'male-standing-long-jump',
      'female-standing-long-jump',
      'male-50m',
      'female-50m',
      'male-pull-up',
      'female-sit-up',
      'male-medicine-ball',
      'female-medicine-ball'
    ]
  },
  {
    id: 'group-skill',
    title: '技能选项（四选一）',
    selection: { mode: 'pickN', n: 1 },
    combine: 'single',
    itemIds: [
      'male-football',
      'female-football',
      'male-basketball-dribble',
      'female-basketball-dribble',
      'male-volleyball',
      'female-volleyball',
      'rope-skip-1min'
    ]
  },
  {
    id: 'group-process',
    title: '体育素质综合评价（15分）',
    selection: { mode: 'all', n: 0 },
    combine: 'sum',
    itemIds: ['pe-class-eval', 'national-fitness']
  }
]

export const ZHAOQING_MIDDLE_2026: ExamStandard = {
  id: 'cn-gd-zhaoqing-middle-2026',
  examType: 'middle_school_exam',
  regionCode: 'CN-GD',
  cityCode: ZHAOQING.cityCode,
  citySlug: ZHAOQING.citySlug,
  cityName: ZHAOQING.cityName,
  yearFrom: 2026,
  yearTo: 2026,
  policyLabel: '2026',
  policyPeriod: '2026',
  title: '肇庆市 2026 中考体育',
  sourceAuthority: '肇庆市教育局',
  sourceTitle: '关于做好2026年肇庆市初中学业水平考试体育与健康考试工作的通知（肇教体〔2026〕3号）',
  sourceUrl: SOURCE_URL,
  policySourceTitle: '肇教〔2022〕4号《肇庆市高中阶段学校考试招生制度改革实施方案（修订版）》；附件1《2026年肇庆市初中学业水平考试体育与健康考试项目规则及评分标准》',
  policySourceUrl: ATT_URL,
  publishedAt: '2026-01-30',
  effectiveFrom: '2026-01-01',
  effectiveTo: '2026-12-31',
  status: 'verified',
  ruleStatus: 'verified',
  scoreTableStatus: 'verified',
  schemeLabel: '2026（70=55+15，附件1百分制对照表）',
  scoreYear: 2026,
  applicableGroups: ['regular'],
  enrollmentCohort: null,
  calculationNotes:
    '满分70：素质综合评价15（体育课5+国标10）+统一考试55。统考三项各百分制满分100：必考得分×25%；体能与技能两项平均分×30%；四舍五入保留1位小数。附件1注明分段分值、实际按每一分值计算，系统按相邻档线性插值后截断到百分之一。100米游泳对照表为50米池；25米池官方要求在原标准上减少2秒，本版不另建表。引体向上1次未成功按0分，45–5分空档未补录。不得套用2021第三方评分表或广州/韶关/汕头/茂名表。',
  notes: `已核验肇庆市教育局政府信息公开平台肇教体〔2026〕3号（${SOURCE_URL}）及官方Word附件1-6（${ATT_URL}）、通知正文（${NOTICE_DOC}）。评分表来自2026附件1，不是2021第三方转载表。完整评分表待官方附件核验字样不适用本版现场项目。`,
  totalMaxScore: 70,
  scoring: { rounding: 'round1' },
  items: ITEMS,
  groups: GROUPS,
  components: [
    {
      id: 'onsite',
      kind: 'onsite',
      title: '统一考试',
      maxScore: 55,
      weight: 55 / 70,
      groupIds: ['group-required', 'group-fitness', 'group-skill']
    },
    {
      id: 'process',
      kind: 'process',
      title: '体育素质综合评价',
      maxScore: 15,
      weight: 15 / 70,
      groupIds: ['group-process']
    }
  ],
  createdAt: STAMP,
  updatedAt: STAMP
}
