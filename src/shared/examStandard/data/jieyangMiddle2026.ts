import { GD_CITIES } from '../regions'
import type { ExamGroup, ExamItemDefinition, ExamStandard } from '../types'
import { countExamItem, distanceExamItem, examItem, pendingOfficialTableRule, timeExamItem } from './itemBuilders'

const STAMP = '2026-09-10T10:25:00.000Z'
const JIEYANG = GD_CITIES.find((item) => item.citySlug === 'jieyang')!
const SOURCE_URL = 'http://www.jieyang.gov.cn/jyjyj/gkmlpt/content/1/1002/post_1002910.html'
const SCHEME_PAGE = 'http://www.jieyang.gov.cn/sjyj/wjfb/content/post_854270.html'
const SCHEME_PDF = 'http://www.jieyang.gov.cn/attachment/0/137/137513/854270.pdf'
const TRIAL_PAGE = 'http://www.jieyang.gov.cn/sjyj/wjfb/content/post_700307.html'
const TABLE_PENDING =
  '2026年科目设置通知明确体育考试按揭市教〔2024〕93号《揭阳市2025年初中学业水平考试体育与健康科目考试工作方案》执行。已下载93号方案PDF，但无法可靠抽出完整成绩对照档（含图像页、无ToUnicode）。不得把2022年试行附件1-9、第三方整理表或广州/肇庆/韶关/汕头表当作2026对照表。'

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
    maxScore: 100,
    requirement: 'required',
    testItemBuiltinKey: 'run-1000m',
    testItemId: 'test-item-builtin-run-1000m',
    scoreRule: pending(100)
  }),
  timeExamItem({
    id: 'female-800m',
    itemKey: 'run-800m',
    name: '800米跑',
    gender: 'female',
    category: 'endurance',
    timeInputMode: 'minutesSeconds',
    decimalPlaces: 0,
    maxScore: 100,
    requirement: 'required',
    testItemBuiltinKey: 'run-800m',
    testItemId: 'test-item-builtin-run-800m',
    scoreRule: pending(100)
  }),
  countExamItem({
    id: 'pull-up',
    itemKey: 'pull-up',
    name: '引体向上',
    gender: 'male',
    category: 'strength',
    maxScore: 100,
    testItemBuiltinKey: null,
    testItemId: null,
    scoreRule: pending(100)
  }),
  countExamItem({
    id: 'sit-up-1min',
    itemKey: 'sit-up',
    name: '一分钟仰卧起坐',
    gender: 'female',
    category: 'strength',
    maxScore: 100,
    testItemBuiltinKey: null,
    testItemId: null,
    scoreRule: pending(100)
  }),
  distanceExamItem({
    id: 'medicine-ball',
    itemKey: 'medicine-ball',
    name: '投掷实心球',
    gender: 'all',
    category: 'strength',
    decimalPlaces: 2,
    maxScore: 100,
    testItemBuiltinKey: 'medicine-ball',
    testItemId: 'test-item-builtin-medicine-ball',
    scoreRule: pending(100)
  }),
  distanceExamItem({
    id: 'standing-long-jump',
    itemKey: 'standing-long-jump',
    name: '立定跳远',
    gender: 'all',
    category: 'strength',
    decimalPlaces: 2,
    maxScore: 100,
    testItemBuiltinKey: 'standing-long-jump',
    testItemId: 'test-item-builtin-standing-long-jump',
    scoreRule: pending(100)
  }),
  countExamItem({
    id: 'rope-skip-1min',
    itemKey: 'rope-skip-1min',
    name: '一分钟跳绳',
    gender: 'all',
    category: 'speed',
    maxScore: 100,
    testItemBuiltinKey: 'rope-skip-1min',
    testItemId: 'test-item-builtin-rope-skip-1min',
    scoreRule: pending(100)
  }),
  examItem({
    id: 'quality-eval',
    itemKey: 'jieyang-quality-eval',
    name: '素质评价（日常参与+体质测试）',
    gender: 'all',
    requirement: 'required',
    category: 'other',
    valueType: 'number',
    timeInputMode: 'seconds',
    unit: 'score',
    direction: 'higherBetter',
    decimalPlaces: 0,
    maxScore: 40,
    testItemBuiltinKey: null,
    testItemId: null,
    scoreRule: pending(40)
  })
]

const GROUPS: ExamGroup[] = [
  {
    id: 'group-required',
    title: '统一考试必考（男子1000米 / 女子800米）',
    selection: { mode: 'pickN', n: 1 },
    combine: 'single',
    itemIds: ['male-1000m', 'female-800m']
  },
  {
    id: 'group-elective',
    title: '统一考试选考（四选一）',
    selection: { mode: 'pickN', n: 1 },
    combine: 'single',
    itemIds: ['pull-up', 'sit-up-1min', 'medicine-ball', 'standing-long-jump', 'rope-skip-1min']
  },
  {
    id: 'group-process',
    title: '素质评价',
    selection: { mode: 'all', n: 0 },
    combine: 'single',
    itemIds: ['quality-eval']
  }
]

export const JIEYANG_MIDDLE_2026: ExamStandard = {
  id: 'cn-gd-jieyang-middle-2026',
  examType: 'middle_school_exam',
  regionCode: 'CN-GD',
  cityCode: JIEYANG.cityCode,
  citySlug: JIEYANG.citySlug,
  cityName: JIEYANG.cityName,
  yearFrom: 2026,
  yearTo: 2026,
  policyLabel: '2026',
  policyPeriod: '2026',
  title: '揭阳市 2026 中考体育',
  sourceAuthority: '揭阳市教育局',
  sourceTitle: '关于揭阳市初中学业水平考试科目设置有关工作的通知（揭市教〔2026〕11号口径；体育按揭市教〔2024〕93号执行）',
  sourceUrl: SOURCE_URL,
  policySourceTitle: '揭阳市2025年初中学业水平考试体育与健康科目考试工作方案（揭市教〔2024〕93号）；揭市教规〔2024〕2号',
  policySourceUrl: SCHEME_PAGE,
  publishedAt: '2026-02-05',
  effectiveFrom: '2026-01-01',
  effectiveTo: '2026-12-31',
  status: 'partial',
  ruleStatus: 'verified',
  scoreTableStatus: 'missing',
  schemeLabel: '2026沿用93号方案（70=40+30，项目对照表未完整抽出）',
  scoreYear: 2026,
  applicableGroups: ['regular'],
  enrollmentCohort: null,
  calculationNotes:
    '已核验：2026年2月5日科目设置通知规定体育与健康70分计入中考总分870分，体育按揭市教〔2024〕93号执行；揭市教规〔2024〕2号规定素质评价40分+统一现场考试30分。93号方案页写明自2025年起施行，之后若无新方案则继续执行。统一考试为必考1项+选考4选1，两项平均分（超过100按100）再按30%计入。单项成绩对照档未从93号PDF完整核验抽出，本版本不自动换算现场成绩。',
  notes:
    `已核验揭阳市教育局信息公开${SOURCE_URL}（2026-02-06发布，成文2026-02-05）及普宁市政府门户转载的2026年高中招生通知（http://www.puning.gov.cn/jypnjyj/gkmlpt/content/1/1022/post_1022430.html）确认体育按揭市教〔2024〕93号和揭市招办〔2026〕4号执行。已核验93号方案发布页${SCHEME_PAGE}及官方PDF ${SCHEME_PDF}；该方案写明自2025年起施行、无新方案则继续执行。已核验揭市招办〔2025〕6号（http://www.jieyang.gov.cn/jyjyj/gkmlpt/content/0/926/post_926145.html）记载必考男1000米/女800米、选考4选1。已检查但不得把成绩档写入本版：2022年试行方案及附件1-9（${TRIAL_PAGE}），以及第三方整理评分表。揭市招办〔2026〕4号市级原文未在jieyang.gov.cn单独打开。完整评分表待官方附件核验。该城市/版本评分表尚未完整核验，暂不支持完整自动换算。`,
  totalMaxScore: 70,
  scoring: { rounding: 'round0' },
  items: ITEMS,
  groups: GROUPS,
  components: [
    {
      id: 'process',
      kind: 'process',
      title: '素质评价',
      maxScore: 40,
      weight: 40 / 70,
      groupIds: ['group-process']
    },
    {
      id: 'onsite',
      kind: 'onsite',
      title: '统一考试',
      maxScore: 30,
      weight: 30 / 70,
      groupIds: ['group-required', 'group-elective']
    }
  ],
  createdAt: STAMP,
  updatedAt: STAMP
}
