import { GD_CITIES } from '../regions'
import type { ExamItemDefinition, ExamStandard, ScoreRule } from '../types'
import { countExamItem, distanceExamItem, examItem, pendingOfficialTableRule, timeExamItem } from './itemBuilders'

const STAMP = '2026-09-09T00:00:00.000Z'
const SHENZHEN = GD_CITIES.find((item) => item.citySlug === 'shenzhen')!
const TABLE_PENDING =
  '官方附件《2026年深圳市初中学业水平考试体育与健康科目考试项目规则和评分标准》尚未从市教育局附件核验转录，不能凭常识补录评分档。'

function pending(maxScore = 100): ScoreRule {
  return pendingOfficialTableRule(TABLE_PENDING, maxScore)
}

function skill(
  rest: Omit<ExamItemDefinition, 'customUnitLabel' | 'requirement' | 'verification' | 'scoreRule' | 'maxScore'> & {
    maxScore?: number
  }
): ExamItemDefinition {
  return examItem({
    ...rest,
    maxScore: rest.maxScore ?? 100,
    scoreRule: pending(rest.maxScore ?? 100)
  })
}

export const SHENZHEN_MIDDLE_2026: ExamStandard = {
  id: 'cn-gd-shenzhen-middle-2026',
  examType: 'middle_school_exam',
  regionCode: 'CN-GD',
  cityCode: SHENZHEN.cityCode,
  citySlug: SHENZHEN.citySlug,
  cityName: SHENZHEN.cityName,
  yearFrom: 2026,
  yearTo: 2026,
  policyLabel: '2026',
  policyPeriod: '2026',
  title: '深圳市 2026 中考体育',
  sourceAuthority: '深圳市教育局',
  sourceTitle: '2026年深圳市初中学业水平考试体育与健康科目现场统一考试方案',
  sourceUrl: 'https://www.sz.gov.cn/cn/xxgk/zfxxgj/tzgg/content/post_12645571.html',
  policySourceTitle: '深圳市教育局关于印发《2026年深圳市初中学业水平考试体育与健康科目现场统一考试方案》的通知',
  policySourceUrl: 'https://www.sz.gov.cn/cn/xxgk/zfxxgj/tzgg/content/post_12645571.html',
  publishedAt: '2026-02-11',
  effectiveFrom: '2026-02-11',
  effectiveTo: '2026-12-31',
  status: 'partial',
  ruleStatus: 'verified',
  scoreTableStatus: 'partial',
  schemeLabel: '2026现场统一考试方案',
  scoreYear: 2026,
  applicableGroups: ['regular'],
  enrollmentCohort: null,
  calculationNotes: '',
  notes:
    '已核验官方方案结构：一类/二类/三类各选一项；现场三项百分制平均后按0.36折算，现场满分36分；过程性评价满分14分；体育总分50分。当前仅录入已公开核验项目结构，完整评分表待官方附件核验。该城市/版本评分表尚未完整核验，暂不支持完整自动换算。',
  totalMaxScore: 50,
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
      testItemBuiltinKey: 'run-800m',
      testItemId: 'test-item-builtin-run-800m',
      scoreRule: pending()
    }),
    timeExamItem({
      id: 'swim-200m',
      itemKey: 'swim-200m',
      name: '200米游泳',
      gender: 'all',
      category: 'swim',
      timeInputMode: 'minutesSeconds',
      decimalPlaces: 0,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: pending()
    }),
    countExamItem({
      id: 'rope-skip-4min',
      itemKey: 'rope-skip-4min',
      name: '4分钟跳绳',
      gender: 'all',
      category: 'endurance',
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: pending()
    }),
    timeExamItem({
      id: 'run-100m',
      itemKey: 'run-100m',
      name: '100米跑',
      gender: 'all',
      category: 'speed',
      timeInputMode: 'seconds',
      decimalPlaces: 1,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: pending()
    }),
    timeExamItem({
      id: 'swim-50m',
      itemKey: 'swim-50m',
      name: '50米游泳',
      gender: 'all',
      category: 'swim',
      timeInputMode: 'seconds',
      decimalPlaces: 1,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: pending()
    }),
    distanceExamItem({
      id: 'medicine-ball',
      itemKey: 'medicine-ball',
      name: '投掷实心球',
      gender: 'all',
      category: 'strength',
      decimalPlaces: 2,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: pending()
    }),
    countExamItem({
      id: 'rope-skip-1min',
      itemKey: 'rope-skip-1min',
      name: '1分钟跳绳',
      gender: 'all',
      category: 'speed',
      testItemBuiltinKey: 'rope-skip-1min',
      testItemId: 'test-item-builtin-rope-skip-1min',
      scoreRule: pending()
    }),
    countExamItem({
      id: 'shuttlecock-1min',
      itemKey: 'shuttlecock-1min',
      name: '1分钟踢毽子',
      gender: 'all',
      category: 'skill',
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: pending()
    }),
    distanceExamItem({
      id: 'double-frog-jump',
      itemKey: 'double-frog-jump',
      name: '二级蛙跳',
      gender: 'all',
      category: 'strength',
      decimalPlaces: 2,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: pending()
    }),
    timeExamItem({
      id: 'shuttle-10x4',
      itemKey: 'shuttle-10x4',
      name: '10米×4折返跑',
      gender: 'all',
      category: 'speed',
      timeInputMode: 'seconds',
      decimalPlaces: 1,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: pending()
    }),
    skill({
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
      testItemBuiltinKey: null,
      testItemId: null
    }),
    skill({
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
      testItemBuiltinKey: null,
      testItemId: null
    }),
    skill({
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
      testItemBuiltinKey: null,
      testItemId: null
    }),
    skill({
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
      testItemBuiltinKey: null,
      testItemId: null
    }),
    skill({
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
      testItemBuiltinKey: null,
      testItemId: null
    }),
    skill({
      id: 'tennis',
      itemKey: 'tennis',
      name: '网球',
      gender: 'all',
      category: 'skill',
      valueType: 'number',
      timeInputMode: 'seconds',
      unit: 'other',
      direction: 'higherBetter',
      decimalPlaces: 0,
      testItemBuiltinKey: null,
      testItemId: null
    }),
    examItem({
      id: 'process-evaluation',
      itemKey: 'process-evaluation',
      name: '过程性评价',
      gender: 'all',
      requirement: 'required',
      category: 'other',
      valueType: 'number',
      timeInputMode: 'seconds',
      unit: 'score',
      direction: 'higherBetter',
      decimalPlaces: 0,
      maxScore: 14,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: pendingOfficialTableRule('过程性评价由学校过程考核构成，本版不自动换算。', 14)
    })
  ],
  groups: [
    {
      id: 'group-class-1',
      title: '一类项目（女800米/男1000米、200米游泳、4分钟跳绳，三选一）',
      selection: { mode: 'pickN', n: 1 },
      combine: 'single',
      itemIds: ['male-1000m', 'female-800m', 'swim-200m', 'rope-skip-4min']
    },
    {
      id: 'group-class-2',
      title: '二类项目（七选一）',
      selection: { mode: 'pickN', n: 1 },
      combine: 'single',
      itemIds: ['run-100m', 'swim-50m', 'medicine-ball', 'rope-skip-1min', 'shuttlecock-1min', 'double-frog-jump', 'shuttle-10x4']
    },
    {
      id: 'group-class-3',
      title: '三类项目（球类六选一）',
      selection: { mode: 'pickN', n: 1 },
      combine: 'single',
      itemIds: ['football', 'basketball', 'volleyball', 'table-tennis', 'badminton', 'tennis']
    },
    {
      id: 'group-process',
      title: '过程性评价',
      selection: { mode: 'all', n: 0 },
      combine: 'single',
      itemIds: ['process-evaluation']
    }
  ],
  components: [
    {
      id: 'onsite',
      kind: 'onsite',
      title: '现场统一考试（三项百分制平均后按0.36折算）',
      maxScore: 36,
      weight: 0.36,
      groupIds: ['group-class-1', 'group-class-2', 'group-class-3']
    },
    {
      id: 'process',
      kind: 'process',
      title: '过程性评价',
      maxScore: 14,
      weight: 0.14,
      groupIds: ['group-process']
    }
  ],
  createdAt: STAMP,
  updatedAt: STAMP
}
