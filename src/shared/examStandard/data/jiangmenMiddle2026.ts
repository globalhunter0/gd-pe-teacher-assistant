import { GD_CITIES } from '../regions'
import type { ExamStandard } from '../types'
import { countExamItem, distanceExamItem, examItem, timeExamItem } from './itemBuilders'
import {
  JIANGMEN_BASKETBALL_SHOT,
  JIANGMEN_FEMALE_100M_SWIM,
  JIANGMEN_FEMALE_BASKETBALL_DRIBBLE,
  JIANGMEN_FEMALE_800M,
  JIANGMEN_FEMALE_FOOTBALL,
  JIANGMEN_FEMALE_MEDICINE_BALL,
  JIANGMEN_FEMALE_SIT_UP,
  JIANGMEN_FEMALE_STANDING_LONG_JUMP,
  JIANGMEN_FEMALE_VOLLEYBALL,
  JIANGMEN_MALE_1000M,
  JIANGMEN_MALE_100M_SWIM,
  JIANGMEN_MALE_BASKETBALL_DRIBBLE,
  JIANGMEN_MALE_FOOTBALL,
  JIANGMEN_MALE_MEDICINE_BALL,
  JIANGMEN_MALE_PULL_UP,
  JIANGMEN_MALE_STANDING_LONG_JUMP,
  JIANGMEN_MALE_VOLLEYBALL,
  JIANGMEN_QUALITY_UNSUPPORTED,
  JIANGMEN_ROPE_SKIP_1MIN
} from './jiangmenTables'

const STAMP = '2026-09-09T00:00:00.000Z'
const JIANGMEN = GD_CITIES.find((item) => item.citySlug === 'jiangmen')!

export const JIANGMEN_MIDDLE_2026: ExamStandard = {
  id: 'cn-gd-jiangmen-middle-2026',
  examType: 'middle_school_exam',
  regionCode: 'CN-GD',
  cityCode: JIANGMEN.cityCode,
  citySlug: JIANGMEN.citySlug,
  cityName: JIANGMEN.cityName,
  yearFrom: 2026,
  yearTo: 2026,
  policyLabel: '2026',
  policyPeriod: '2026',
  title: '江门市 2026 中考体育',
  sourceAuthority: '江门市教育局',
  sourceTitle: '2026年江门市初中学业水平考试体育与健康科目考试实施意见',
  sourceUrl: 'http://www.jiangmen.gov.cn/bmpd/jmsjyj/zwgk/tzgg/content/post_3453983.html',
  policySourceTitle: '江门市教育局关于印发《2026年江门市初中学业水平考试体育与健康科目考试实施意见》的通知（江教德〔2026〕6号）',
  policySourceUrl: 'http://www.jiangmen.gov.cn/bmpd/jmsjyj/zwgk/tzgg/content/post_3453983.html',
  publishedAt: '2026-03-09',
  effectiveFrom: '2026-03-09',
  effectiveTo: '2026-12-31',
  status: 'verified',
  ruleStatus: 'verified',
  scoreTableStatus: 'verified',
  schemeLabel: '2026',
  scoreYear: 2026,
  applicableGroups: ['regular'],
  enrollmentCohort: null,
  calculationNotes: '',
  notes:
    '评分表来自江门市政府门户网站刊载的市教育局实施意见正文附表。时间按官方“分.秒”转录为秒；空单元格未补录。篮球一分钟投篮等仅录入表中出现的档位。统一考试按百分制赋分后计入必考25分、球类15分、素质类15分；体育素质综合评价10分不自动换算。',
  totalMaxScore: 65,
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
      scoreRule: JIANGMEN_MALE_1000M
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
      scoreRule: JIANGMEN_FEMALE_800M
    }),
    timeExamItem({
      id: 'male-100m-swim',
      itemKey: 'swim-100m',
      name: '100米游泳',
      gender: 'male',
      category: 'swim',
      timeInputMode: 'minutesSeconds',
      decimalPlaces: 0,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: JIANGMEN_MALE_100M_SWIM
    }),
    timeExamItem({
      id: 'female-100m-swim',
      itemKey: 'swim-100m',
      name: '100米游泳',
      gender: 'female',
      category: 'swim',
      timeInputMode: 'minutesSeconds',
      decimalPlaces: 0,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: JIANGMEN_FEMALE_100M_SWIM
    }),
    countExamItem({
      id: 'male-pull-up',
      itemKey: 'pull-up',
      name: '引体向上',
      gender: 'male',
      category: 'strength',
      testItemBuiltinKey: 'pull-up',
      testItemId: 'test-item-builtin-pull-up',
      scoreRule: JIANGMEN_MALE_PULL_UP
    }),
    countExamItem({
      id: 'female-sit-up',
      itemKey: 'sit-up-1min',
      name: '仰卧起坐',
      gender: 'female',
      category: 'strength',
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: JIANGMEN_FEMALE_SIT_UP
    }),
    countExamItem({
      id: 'male-volleyball',
      itemKey: 'volleyball-wall',
      name: '排球对墙垫球',
      gender: 'male',
      category: 'skill',
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: JIANGMEN_MALE_VOLLEYBALL
    }),
    countExamItem({
      id: 'female-volleyball',
      itemKey: 'volleyball-wall',
      name: '排球对墙垫球',
      gender: 'female',
      category: 'skill',
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: JIANGMEN_FEMALE_VOLLEYBALL
    }),
    timeExamItem({
      id: 'male-football',
      itemKey: 'football-25m',
      name: '足球25米绕杆运球',
      gender: 'male',
      category: 'skill',
      timeInputMode: 'seconds',
      decimalPlaces: 1,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: JIANGMEN_MALE_FOOTBALL
    }),
    timeExamItem({
      id: 'female-football',
      itemKey: 'football-25m',
      name: '足球25米绕杆运球',
      gender: 'female',
      category: 'skill',
      timeInputMode: 'seconds',
      decimalPlaces: 1,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: JIANGMEN_FEMALE_FOOTBALL
    }),
    timeExamItem({
      id: 'male-basketball-dribble',
      itemKey: 'basketball-half-court',
      name: '篮球半场来回运球上篮',
      gender: 'male',
      category: 'skill',
      timeInputMode: 'seconds',
      decimalPlaces: 1,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: JIANGMEN_MALE_BASKETBALL_DRIBBLE
    }),
    timeExamItem({
      id: 'female-basketball-dribble',
      itemKey: 'basketball-half-court',
      name: '篮球半场来回运球上篮',
      gender: 'female',
      category: 'skill',
      timeInputMode: 'seconds',
      decimalPlaces: 1,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: JIANGMEN_FEMALE_BASKETBALL_DRIBBLE
    }),
    countExamItem({
      id: 'male-basketball-shot',
      itemKey: 'basketball-shot-1min',
      name: '篮球一分钟投篮',
      gender: 'male',
      category: 'skill',
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: JIANGMEN_BASKETBALL_SHOT
    }),
    countExamItem({
      id: 'female-basketball-shot',
      itemKey: 'basketball-shot-1min',
      name: '篮球一分钟投篮',
      gender: 'female',
      category: 'skill',
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: JIANGMEN_BASKETBALL_SHOT
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
      scoreRule: JIANGMEN_MALE_STANDING_LONG_JUMP
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
      scoreRule: JIANGMEN_FEMALE_STANDING_LONG_JUMP
    }),
    countExamItem({
      id: 'male-rope-skip',
      itemKey: 'rope-skip-1min',
      name: '一分钟跳绳',
      gender: 'male',
      category: 'speed',
      testItemBuiltinKey: 'rope-skip-1min',
      testItemId: 'test-item-builtin-rope-skip-1min',
      scoreRule: JIANGMEN_ROPE_SKIP_1MIN
    }),
    countExamItem({
      id: 'female-rope-skip',
      itemKey: 'rope-skip-1min',
      name: '一分钟跳绳',
      gender: 'female',
      category: 'speed',
      testItemBuiltinKey: 'rope-skip-1min',
      testItemId: 'test-item-builtin-rope-skip-1min',
      scoreRule: JIANGMEN_ROPE_SKIP_1MIN
    }),
    distanceExamItem({
      id: 'male-medicine-ball',
      itemKey: 'medicine-ball',
      name: '投掷实心球',
      gender: 'male',
      category: 'strength',
      decimalPlaces: 2,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: JIANGMEN_MALE_MEDICINE_BALL
    }),
    distanceExamItem({
      id: 'female-medicine-ball',
      itemKey: 'medicine-ball',
      name: '投掷实心球',
      gender: 'female',
      category: 'strength',
      decimalPlaces: 2,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: JIANGMEN_FEMALE_MEDICINE_BALL
    }),
    examItem({
      id: 'quality-evaluation',
      itemKey: 'quality-evaluation',
      name: '体育素质综合评价',
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
      scoreRule: JIANGMEN_QUALITY_UNSUPPORTED
    })
  ],
  groups: [
    {
      id: 'group-required',
      title: '必考项目（女800米 / 男1000米 / 100米游泳，二选一）',
      selection: { mode: 'pickN', n: 1 },
      combine: 'single',
      itemIds: ['male-1000m', 'female-800m', 'male-100m-swim', 'female-100m-swim']
    },
    {
      id: 'group-ball',
      title: '球类项目（排球 / 足球 / 篮球半场运球上篮 / 篮球一分钟投篮，四选一）',
      selection: { mode: 'pickN', n: 1 },
      combine: 'single',
      itemIds: [
        'male-volleyball',
        'female-volleyball',
        'male-football',
        'female-football',
        'male-basketball-dribble',
        'female-basketball-dribble',
        'male-basketball-shot',
        'female-basketball-shot'
      ]
    },
    {
      id: 'group-quality-required',
      title: '素质类必考（女仰卧起坐 / 男引体向上，5分）',
      selection: { mode: 'pickN', n: 1 },
      combine: 'single',
      itemIds: ['male-pull-up', 'female-sit-up']
    },
    {
      id: 'group-quality-elective',
      title: '素质类选考（立定跳远 / 一分钟跳绳 / 实心球，三选一，10分）',
      selection: { mode: 'pickN', n: 1 },
      combine: 'single',
      itemIds: [
        'male-standing-long-jump',
        'female-standing-long-jump',
        'male-rope-skip',
        'female-rope-skip',
        'male-medicine-ball',
        'female-medicine-ball'
      ]
    },
    {
      id: 'group-quality-eval',
      title: '体育素质综合评价',
      selection: { mode: 'all', n: 0 },
      combine: 'single',
      itemIds: ['quality-evaluation']
    }
  ],
  components: [
    {
      id: 'onsite-required',
      kind: 'onsite',
      title: '统一考试·必考项目',
      maxScore: 25,
      weight: 25 / 65,
      groupIds: ['group-required']
    },
    {
      id: 'onsite-ball',
      kind: 'onsite',
      title: '统一考试·球类项目',
      maxScore: 15,
      weight: 15 / 65,
      groupIds: ['group-ball']
    },
    {
      id: 'onsite-quality',
      kind: 'onsite',
      title: '统一考试·素质类项目',
      maxScore: 15,
      weight: 15 / 65,
      groupIds: ['group-quality-required', 'group-quality-elective']
    },
    {
      id: 'process-quality',
      kind: 'process',
      title: '体育素质综合评价',
      maxScore: 10,
      weight: 10 / 65,
      groupIds: ['group-quality-eval']
    }
  ],
  createdAt: STAMP,
  updatedAt: STAMP
}
