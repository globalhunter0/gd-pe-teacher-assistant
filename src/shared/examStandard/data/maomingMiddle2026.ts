import { GD_CITIES } from '../regions'
import type { ExamGroup, ExamItemDefinition, ExamStandard } from '../types'
import {
  countExamItem,
  distanceExamItem,
  examItem,
  pendingOfficialTableRule,
  skillExamItem,
  timeExamItem
} from './itemBuilders'

const STAMP = '2026-09-10T08:18:00.000Z'
const MAOMING = GD_CITIES.find((item) => item.citySlug === 'maoming')!
const SOURCE_URL = 'http://mmjyj.maoming.gov.cn/xwzx/tzgg/content/post_1587122.html'
const ATT7_URL = 'http://mmjyj.maoming.gov.cn/attachment/0/202/202439/1587122.docx'
const ATT71_URL = 'http://mmjyj.maoming.gov.cn/attachment/0/202/202440/1587122.docx'
const TABLE_PENDING =
  '2026年官方附件7-1只规定单项原始分0-120、三科平均分封顶100再×65%计入统一考试65分，未附项目成绩与120分制对照档。不得把2023年评分PDF或广州/韶关/汕头表当作2026对照表。'

function pending(maxScore: number) {
  return pendingOfficialTableRule(TABLE_PENDING, maxScore)
}

const ITEMS: ExamItemDefinition[] = [
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
    timeInputMode: 'seconds',
    decimalPlaces: 2,
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
    testItemBuiltinKey: 'medicine-ball',
    testItemId: 'test-item-builtin-medicine-ball',
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
  countExamItem({
    id: 'sit-up-1min',
    itemKey: 'sit-up',
    name: '一分钟仰卧起坐',
    gender: 'all',
    category: 'strength',
    maxScore: 120,
    testItemBuiltinKey: null,
    testItemId: null,
    scoreRule: pending(120)
  }),
  skillExamItem({
    id: 'football',
    itemKey: 'football',
    name: '足球运球绕杆',
    gender: 'all',
    category: 'skill',
    valueType: 'number',
    timeInputMode: 'seconds',
    unit: 'other',
    direction: 'lowerBetter',
    decimalPlaces: 2,
    maxScore: 120,
    testItemBuiltinKey: null,
    testItemId: null,
    reason: TABLE_PENDING
  }),
  skillExamItem({
    id: 'basketball',
    itemKey: 'basketball',
    name: '篮球半场运球投篮',
    gender: 'all',
    category: 'skill',
    valueType: 'number',
    timeInputMode: 'seconds',
    unit: 'other',
    direction: 'lowerBetter',
    decimalPlaces: 2,
    maxScore: 120,
    testItemBuiltinKey: null,
    testItemId: null,
    reason: TABLE_PENDING
  }),
  examItem({
    id: 'national-fitness',
    itemKey: 'national-fitness',
    name: '体育素质综合评价（《国家学生体质健康标准》测试）',
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
    scoreRule: pending(5)
  })
]

const GROUPS: ExamGroup[] = [
  {
    id: 'group-required',
    title: '必考项目（中长跑或100米游泳，二选一）',
    selection: { mode: 'pickN', n: 1 },
    combine: 'single',
    itemIds: ['male-1000m', 'female-800m', 'swim-100m']
  },
  {
    id: 'group-fitness',
    title: '体能项目（四选一）',
    selection: { mode: 'pickN', n: 1 },
    combine: 'single',
    itemIds: ['medicine-ball', 'standing-long-jump', 'rope-skip-1min', 'sit-up-1min']
  },
  {
    id: 'group-skill',
    title: '技能项目（二选一）',
    selection: { mode: 'pickN', n: 1 },
    combine: 'single',
    itemIds: ['football', 'basketball']
  },
  {
    id: 'group-process',
    title: '体育素质综合评价',
    selection: { mode: 'all', n: 0 },
    combine: 'single',
    itemIds: ['national-fitness']
  }
]

export const MAOMING_MIDDLE_2026: ExamStandard = {
  id: 'cn-gd-maoming-middle-2026',
  examType: 'middle_school_exam',
  regionCode: 'CN-GD',
  cityCode: MAOMING.cityCode,
  citySlug: MAOMING.citySlug,
  cityName: MAOMING.cityName,
  yearFrom: 2026,
  yearTo: 2026,
  policyLabel: '2026',
  policyPeriod: '2026',
  title: '茂名市 2026 中考体育',
  sourceAuthority: '茂名市教育局 / 茂名市招生委员会办公室',
  sourceTitle: '2026年茂名市中考体育与健康考试实施方案（报名通知附件7）',
  sourceUrl: SOURCE_URL,
  policySourceTitle: '茂名市2026年初中学业水平考试与高中阶段学校招生工作实施办法；附件7-1项目计分方法；附件7-2素质综合评价评分办法',
  policySourceUrl: 'http://mmjyj.maoming.gov.cn/zsks/zsgg/content/post_1636591.html',
  publishedAt: '2026-02-28',
  effectiveFrom: '2026-01-01',
  effectiveTo: '2026-12-31',
  status: 'partial',
  ruleStatus: 'verified',
  scoreTableStatus: 'missing',
  schemeLabel: '2026实施方案（70=65+5，项目对照表未附）',
  scoreYear: 2026,
  applicableGroups: ['regular'],
  enrollmentCohort: null,
  calculationNotes:
    '满分70：统一考试65+素质综合评价5。统考三科（必考、体能、技能）各0-120分，取平均分，超过100按100计，再×65%计入65分。择考三项按平均分×90%后计入（折算后最高58.5）；两项×80%（最高52）；一项×70%（最高45.5）。免考按70分的50%即35分计入。素质综合评价按入学年级对应学年《国标》及格档赋分，不是现场项目对照表。单项成绩如何对应0-120分未在附件7-1给出，本版本不自动换算现场成绩。',
  notes:
    `已核验茂名教育信息网报名通知及官方Word附件7（${ATT7_URL}）、7-1（${ATT71_URL}）、7-2。2026中招实施办法确认体育与健康70分（含综合素质评价5分），中考总分800分。已打开7-1：仅有折算方法，无1000米/实心球等成绩档。不得沿用http://mmjyj.maoming.gov.cn/attachment/0/75/75080/977008.pdf（2023年项目评分标准）——2026文件未声明继续执行该表。完整评分表待官方附件核验。该城市/版本评分表尚未完整核验，暂不支持完整自动换算。`,
  totalMaxScore: 70,
  scoring: { rounding: 'round0' },
  items: ITEMS,
  groups: GROUPS,
  components: [
    {
      id: 'onsite',
      kind: 'onsite',
      title: '体育统一考试',
      maxScore: 65,
      weight: 65 / 70,
      groupIds: ['group-required', 'group-fitness', 'group-skill']
    },
    {
      id: 'process',
      kind: 'process',
      title: '体育素质综合评价',
      maxScore: 5,
      weight: 5 / 70,
      groupIds: ['group-process']
    }
  ],
  createdAt: STAMP,
  updatedAt: STAMP
}
