import { GD_CITIES } from '../regions'
import type { ExamStandard } from '../types'
import { countExamItem, distanceExamItem, skillExamItem, timeExamItem } from './itemBuilders'
import {
  ZHUHAI_FEMALE_200M,
  ZHUHAI_FEMALE_800M,
  ZHUHAI_FEMALE_BASKETBALL,
  ZHUHAI_FEMALE_FOOTBALL,
  ZHUHAI_FEMALE_MEDICINE_BALL,
  ZHUHAI_FEMALE_TRIPLE_FROG,
  ZHUHAI_FEMALE_VOLLEYBALL,
  ZHUHAI_MALE_1000M,
  ZHUHAI_MALE_200M,
  ZHUHAI_MALE_BASKETBALL,
  ZHUHAI_MALE_FOOTBALL,
  ZHUHAI_MALE_MEDICINE_BALL,
  ZHUHAI_MALE_TRIPLE_FROG,
  ZHUHAI_MALE_VOLLEYBALL,
  ZHUHAI_PROCESS_REASON,
  ZHUHAI_PROCESS_UNSUPPORTED,
  ZHUHAI_ROPE,
  ZHUHAI_SWIM_UNSUPPORTED
} from './zhuhaiTables'

const STAMP = '2026-09-09T22:30:00.000Z'
const ZHUHAI = GD_CITIES.find((item) => item.citySlug === 'zhuhai')!

const CALC_NOTES =
  '统一考试三项百分制得分取平均，平均分超过100按100计，再按0.45权重计入45分。官方注明评分表以分段分值表示，实际评分按每一分值计算，系统按表内相邻档线性插值后截断到百分之一。100米游泳附件未给对照表，不自动换算。'

export const ZHUHAI_MIDDLE_2026: ExamStandard = {
  id: 'cn-gd-zhuhai-middle-2026',
  examType: 'middle_school_exam',
  regionCode: 'CN-GD',
  cityCode: ZHUHAI.cityCode,
  citySlug: ZHUHAI.citySlug,
  cityName: ZHUHAI.cityName,
  yearFrom: 2026,
  yearTo: 2026,
  policyLabel: '2026',
  policyPeriod: '2026',
  title: '珠海市 2026 中考体育',
  sourceAuthority: '珠海市教育局',
  sourceTitle: '2026年珠海市初中学业水平考试体育中考工作实施方案',
  sourceUrl: 'https://www.zhuhai.gov.cn/zw/fggw/qtwj/qtbmzcwj/content/post_3886286.html',
  policySourceTitle:
    '珠教体〔2026〕1号及附件3《2026年珠海市初中学业水平考试体育与健康科目考试项目评分标准》（挂网文件名仍为2024年评分标准.doc）',
  policySourceUrl: 'https://www.zhuhai.gov.cn/attachment/0/441/441710/3886286.doc',
  publishedAt: '2026-01-27',
  effectiveFrom: '2026-01-27',
  effectiveTo: '2026-12-31',
  status: 'verified',
  ruleStatus: 'verified',
  scoreTableStatus: 'verified',
  schemeLabel: '2026年体育中考工作实施方案',
  scoreYear: 2026,
  applicableGroups: ['regular'],
  enrollmentCohort: null,
  calculationNotes: CALC_NOTES,
  notes:
    '评分表转录自珠海市政府门户/市教育局挂网的珠教体〔2026〕1号附件3。实施方案明确2026评分标准见该附件；挂网文件名仍为《2024年…评分标准.doc》。一类100米游泳仅有考试办法（附件4），无数表，不自动换算。运动参与6分与《国标》9分不自动换算。不得套用广州或省2014成绩对照表。',
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
      maxScore: 110,
      testItemBuiltinKey: 'run-1000m',
      testItemId: 'test-item-builtin-run-1000m',
      scoreRule: ZHUHAI_MALE_1000M
    }),
    timeExamItem({
      id: 'female-800m',
      itemKey: 'run-800m',
      name: '800米跑',
      gender: 'female',
      category: 'endurance',
      timeInputMode: 'minutesSeconds',
      decimalPlaces: 0,
      maxScore: 110,
      testItemBuiltinKey: 'run-800m',
      testItemId: 'test-item-builtin-run-800m',
      scoreRule: ZHUHAI_FEMALE_800M
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
      scoreRule: ZHUHAI_SWIM_UNSUPPORTED
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
      scoreRule: ZHUHAI_SWIM_UNSUPPORTED
    }),
    timeExamItem({
      id: 'male-200m',
      itemKey: 'run-200m',
      name: '200米短跑',
      gender: 'male',
      category: 'speed',
      timeInputMode: 'seconds',
      decimalPlaces: 1,
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      aliases: ['200米', '200米跑'],
      scoreRule: ZHUHAI_MALE_200M
    }),
    timeExamItem({
      id: 'female-200m',
      itemKey: 'run-200m',
      name: '200米短跑',
      gender: 'female',
      category: 'speed',
      timeInputMode: 'seconds',
      decimalPlaces: 1,
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      aliases: ['200米', '200米跑'],
      scoreRule: ZHUHAI_FEMALE_200M
    }),
    distanceExamItem({
      id: 'male-triple-frog',
      itemKey: 'triple-frog-jump',
      name: '三级蛙跳',
      gender: 'male',
      category: 'strength',
      decimalPlaces: 1,
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: ZHUHAI_MALE_TRIPLE_FROG
    }),
    distanceExamItem({
      id: 'female-triple-frog',
      itemKey: 'triple-frog-jump',
      name: '三级蛙跳',
      gender: 'female',
      category: 'strength',
      decimalPlaces: 1,
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: ZHUHAI_FEMALE_TRIPLE_FROG
    }),
    distanceExamItem({
      id: 'male-medicine-ball',
      itemKey: 'medicine-ball',
      name: '投掷实心球',
      gender: 'male',
      category: 'strength',
      decimalPlaces: 1,
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: ZHUHAI_MALE_MEDICINE_BALL
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
      scoreRule: ZHUHAI_FEMALE_MEDICINE_BALL
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
      scoreRule: ZHUHAI_ROPE
    }),
    timeExamItem({
      id: 'male-football',
      itemKey: 'football',
      name: '足球25米绕杆运球',
      gender: 'male',
      category: 'skill',
      timeInputMode: 'seconds',
      decimalPlaces: 1,
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      aliases: ['足球'],
      scoreRule: ZHUHAI_MALE_FOOTBALL
    }),
    timeExamItem({
      id: 'female-football',
      itemKey: 'football',
      name: '足球25米绕杆运球',
      gender: 'female',
      category: 'skill',
      timeInputMode: 'seconds',
      decimalPlaces: 1,
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      aliases: ['足球'],
      scoreRule: ZHUHAI_FEMALE_FOOTBALL
    }),
    timeExamItem({
      id: 'male-basketball-dribble',
      itemKey: 'basketball-dribble',
      name: '篮球半场来回运球上篮',
      gender: 'male',
      category: 'skill',
      timeInputMode: 'seconds',
      decimalPlaces: 1,
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      aliases: ['篮球'],
      scoreRule: ZHUHAI_MALE_BASKETBALL
    }),
    timeExamItem({
      id: 'female-basketball-dribble',
      itemKey: 'basketball-dribble',
      name: '篮球半场来回运球上篮',
      gender: 'female',
      category: 'skill',
      timeInputMode: 'seconds',
      decimalPlaces: 1,
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      aliases: ['篮球'],
      scoreRule: ZHUHAI_FEMALE_BASKETBALL
    }),
    countExamItem({
      id: 'male-volleyball',
      itemKey: 'volleyball',
      name: '一分钟排球对墙传（垫）球',
      gender: 'male',
      category: 'skill',
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      customUnitLabel: '',
      aliases: ['排球', '排球对墙垫球'],
      scoreRule: ZHUHAI_MALE_VOLLEYBALL
    }),
    countExamItem({
      id: 'female-volleyball',
      itemKey: 'volleyball',
      name: '一分钟排球对墙传（垫）球',
      gender: 'female',
      category: 'skill',
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      aliases: ['排球', '排球对墙垫球'],
      scoreRule: ZHUHAI_FEMALE_VOLLEYBALL
    }),
    skillExamItem({
      id: 'sport-participation',
      itemKey: 'sport-participation',
      name: '运动参与',
      gender: 'all',
      category: 'other',
      valueType: 'number',
      timeInputMode: 'seconds',
      unit: 'score',
      direction: 'higherBetter',
      decimalPlaces: 0,
      maxScore: 6,
      testItemBuiltinKey: null,
      testItemId: null,
      reason: ZHUHAI_PROCESS_REASON,
      scoreRule: ZHUHAI_PROCESS_UNSUPPORTED(6)
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
      maxScore: 9,
      testItemBuiltinKey: null,
      testItemId: null,
      reason: ZHUHAI_PROCESS_REASON,
      scoreRule: ZHUHAI_PROCESS_UNSUPPORTED(9)
    })
  ],
  groups: [
    {
      id: 'group-class1',
      title: '一类项目（男1000米/女800米 或 100米游泳，二选一）',
      selection: { mode: 'pickN', n: 1 },
      combine: 'single',
      itemIds: ['male-1000m', 'female-800m', 'male-100m-swim', 'female-100m-swim']
    },
    {
      id: 'group-class2',
      title: '二类项目（200米短跑 / 三级蛙跳 / 投掷实心球 / 一分钟跳绳，四选一）',
      selection: { mode: 'pickN', n: 1 },
      combine: 'single',
      itemIds: [
        'male-200m',
        'female-200m',
        'male-triple-frog',
        'female-triple-frog',
        'male-medicine-ball',
        'female-medicine-ball',
        'rope-skip-1min'
      ]
    },
    {
      id: 'group-class3',
      title: '三类项目（足球 / 篮球 / 排球，三选一）',
      selection: { mode: 'pickN', n: 1 },
      combine: 'single',
      itemIds: [
        'male-football',
        'female-football',
        'male-basketball-dribble',
        'female-basketball-dribble',
        'male-volleyball',
        'female-volleyball'
      ]
    },
    {
      id: 'group-participation',
      title: '运动参与（学校按学年赋分）',
      selection: { mode: 'all', n: 0 },
      combine: 'sum',
      itemIds: ['sport-participation']
    },
    {
      id: 'group-national',
      title: '《国标》测试（学校按学年等级赋分）',
      selection: { mode: 'all', n: 0 },
      combine: 'sum',
      itemIds: ['national-fitness']
    }
  ],
  components: [
    {
      id: 'onsite',
      kind: 'onsite',
      title: '统一考试',
      maxScore: 45,
      weight: 45 / 60,
      groupIds: ['group-class1', 'group-class2', 'group-class3']
    },
    {
      id: 'participation',
      kind: 'process',
      title: '运动参与',
      maxScore: 6,
      weight: 6 / 60,
      groupIds: ['group-participation']
    },
    {
      id: 'national',
      kind: 'process',
      title: '《国家学生体质健康标准》测试',
      maxScore: 9,
      weight: 9 / 60,
      groupIds: ['group-national']
    }
  ],
  createdAt: STAMP,
  updatedAt: STAMP
}
