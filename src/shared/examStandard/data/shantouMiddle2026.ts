import { GD_CITIES } from '../regions'
import type { ExamStandard } from '../types'
import { countExamItem, distanceExamItem, skillExamItem, timeExamItem } from './itemBuilders'
import {
  SHANTOU_FEMALE_800M,
  SHANTOU_FEMALE_LONG_JUMP,
  SHANTOU_FEMALE_MEDICINE_BALL,
  SHANTOU_FEMALE_SIT_UP,
  SHANTOU_MALE_1000M,
  SHANTOU_MALE_LONG_JUMP,
  SHANTOU_MALE_MEDICINE_BALL,
  SHANTOU_MALE_PULL_UP,
  SHANTOU_NATIONAL_REASON,
  SHANTOU_NATIONAL_UNSUPPORTED,
  SHANTOU_ROPE
} from './shantouTables'

const STAMP = '2026-09-09T22:40:00.000Z'
const SHANTOU = GD_CITIES.find((item) => item.citySlug === 'shantou')!

const CALC_NOTES =
  '现场两项百分制（0–120）取平均，超过100按100计，再乘以63%四舍五入为整数（63分）。官方注明评分表以分段分值表示，实际评分按每一分值计算到十分之一。立定跳远/实心球25分档仅为“规范完成动作”、无数值，未补录。引体向上空单元格未补录。'

export const SHANTOU_MIDDLE_2026: ExamStandard = {
  id: 'cn-gd-shantou-middle-2026',
  examType: 'middle_school_exam',
  regionCode: 'CN-GD',
  cityCode: SHANTOU.cityCode,
  citySlug: SHANTOU.citySlug,
  cityName: SHANTOU.cityName,
  yearFrom: 2026,
  yearTo: 2026,
  policyLabel: '2026',
  policyPeriod: '2026',
  title: '汕头市 2026 中考体育',
  sourceAuthority: '汕头市教育局',
  sourceTitle: '汕头市2026年初中学业水平考试体育科考试实施方案',
  sourceUrl: 'https://www.shantou.gov.cn/edu/ztzl/zsks/content/post_2491643.html',
  policySourceTitle: '汕头市教育局关于印发《汕头市2026年初中学业水平考试体育科考试实施方案》的通知（汕市教〔2025〕81号）及附件1评分标准',
  policySourceUrl: 'https://www.shantou.gov.cn/attachment/0/144/144641/2491643.doc',
  publishedAt: '2025-11-06',
  effectiveFrom: '2025-11-06',
  effectiveTo: '2026-12-31',
  status: 'verified',
  ruleStatus: 'verified',
  scoreTableStatus: 'verified',
  schemeLabel: '2026年体育科考试实施方案',
  scoreYear: 2026,
  applicableGroups: ['regular'],
  enrollmentCohort: null,
  calculationNotes: CALC_NOTES,
  notes:
    '评分表转录自汕头市政府门户网站刊载的汕市教〔2025〕81号Word正文附件1。2026年现场考试为必考1项+自选1项。空单元格与“规范完成动作”无数值档未补录。不得套用广州、珠海或其他城市表。',
  totalMaxScore: 70,
  scoring: { rounding: 'round0' },
  items: [
    timeExamItem({
      id: 'male-1000m',
      itemKey: 'run-1000m',
      name: '1000米跑',
      gender: 'male',
      category: 'endurance',
      timeInputMode: 'minutesSeconds',
      decimalPlaces: 1,
      maxScore: 120,
      testItemBuiltinKey: 'run-1000m',
      testItemId: 'test-item-builtin-run-1000m',
      scoreRule: SHANTOU_MALE_1000M
    }),
    timeExamItem({
      id: 'female-800m',
      itemKey: 'run-800m',
      name: '800米跑',
      gender: 'female',
      category: 'endurance',
      timeInputMode: 'minutesSeconds',
      decimalPlaces: 1,
      maxScore: 120,
      testItemBuiltinKey: 'run-800m',
      testItemId: 'test-item-builtin-run-800m',
      scoreRule: SHANTOU_FEMALE_800M
    }),
    distanceExamItem({
      id: 'male-standing-long-jump',
      itemKey: 'standing-long-jump',
      name: '立定跳远',
      gender: 'male',
      category: 'strength',
      decimalPlaces: 3,
      maxScore: 120,
      testItemBuiltinKey: 'standing-long-jump',
      testItemId: 'test-item-builtin-standing-long-jump',
      scoreRule: SHANTOU_MALE_LONG_JUMP
    }),
    distanceExamItem({
      id: 'female-standing-long-jump',
      itemKey: 'standing-long-jump',
      name: '立定跳远',
      gender: 'female',
      category: 'strength',
      decimalPlaces: 3,
      maxScore: 120,
      testItemBuiltinKey: 'standing-long-jump',
      testItemId: 'test-item-builtin-standing-long-jump',
      scoreRule: SHANTOU_FEMALE_LONG_JUMP
    }),
    distanceExamItem({
      id: 'male-medicine-ball',
      itemKey: 'medicine-ball',
      name: '投掷实心球',
      gender: 'male',
      category: 'strength',
      decimalPlaces: 2,
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: SHANTOU_MALE_MEDICINE_BALL
    }),
    distanceExamItem({
      id: 'female-medicine-ball',
      itemKey: 'medicine-ball',
      name: '投掷实心球',
      gender: 'female',
      category: 'strength',
      decimalPlaces: 2,
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: SHANTOU_FEMALE_MEDICINE_BALL
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
      scoreRule: SHANTOU_ROPE
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
      scoreRule: SHANTOU_MALE_PULL_UP
    }),
    countExamItem({
      id: 'female-sit-up',
      itemKey: 'sit-up',
      name: '一分钟仰卧起坐',
      gender: 'female',
      category: 'strength',
      maxScore: 120,
      testItemBuiltinKey: 'sit-up',
      testItemId: 'test-item-builtin-sit-up',
      scoreRule: SHANTOU_FEMALE_SIT_UP
    }),
    skillExamItem({
      id: 'national-fitness',
      itemKey: 'national-fitness',
      name: '国家学生体质健康标准',
      gender: 'all',
      category: 'other',
      valueType: 'number',
      timeInputMode: 'seconds',
      unit: 'score',
      direction: 'higherBetter',
      decimalPlaces: 0,
      maxScore: 7,
      testItemBuiltinKey: null,
      testItemId: null,
      reason: SHANTOU_NATIONAL_REASON,
      scoreRule: SHANTOU_NATIONAL_UNSUPPORTED
    })
  ],
  groups: [
    {
      id: 'group-required',
      title: '必考项目（男1000米 / 女800米）',
      selection: { mode: 'pickN', n: 1 },
      combine: 'single',
      itemIds: ['male-1000m', 'female-800m']
    },
    {
      id: 'group-elective',
      title: '自选项目（立定跳远 / 实心球 / 一分钟跳绳 / 男引体向上 / 女仰卧起坐，四选一）',
      selection: { mode: 'pickN', n: 1 },
      combine: 'single',
      itemIds: [
        'male-standing-long-jump',
        'female-standing-long-jump',
        'male-medicine-ball',
        'female-medicine-ball',
        'rope-skip-1min',
        'male-pull-up',
        'female-sit-up'
      ]
    },
    {
      id: 'group-national',
      title: '《国标》测试（按合格年数赋分）',
      selection: { mode: 'all', n: 0 },
      combine: 'sum',
      itemIds: ['national-fitness']
    }
  ],
  components: [
    {
      id: 'onsite',
      kind: 'onsite',
      title: '中考体育考试',
      maxScore: 63,
      weight: 63 / 70,
      groupIds: ['group-required', 'group-elective']
    },
    {
      id: 'national',
      kind: 'process',
      title: '《国家学生体质健康标准》测试',
      maxScore: 7,
      weight: 7 / 70,
      groupIds: ['group-national']
    }
  ],
  createdAt: STAMP,
  updatedAt: STAMP
}
