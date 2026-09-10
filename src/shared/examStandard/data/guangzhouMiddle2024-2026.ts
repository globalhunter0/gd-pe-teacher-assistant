import { GD_CITIES } from '../regions'
import type { ExamItemDefinition, ExamStandard, ScoreRule } from '../types'
import {
  FEMALE_100M_SWIM,
  FEMALE_800M,
  FEMALE_BADMINTON,
  FEMALE_BASKETBALL,
  FEMALE_FOOTBALL,
  FEMALE_MEDICINE_BALL,
  FEMALE_PARALLEL_LADDER,
  FEMALE_SHOT_PUT,
  FEMALE_STANDING_LONG_JUMP,
  FEMALE_TABLE_TENNIS,
  FEMALE_TENNIS,
  FEMALE_TRIPLE_FROG,
  FEMALE_VOLLEYBALL,
  MALE_1000M,
  MALE_100M_SWIM,
  MALE_BADMINTON,
  MALE_BASKETBALL,
  MALE_FOOTBALL,
  MALE_MEDICINE_BALL,
  MALE_PULL_UP,
  MALE_SHOT_PUT,
  MALE_STANDING_LONG_JUMP,
  MALE_TABLE_TENNIS,
  MALE_TENNIS,
  MALE_TRIPLE_FROG,
  MALE_VOLLEYBALL,
  QUALITY_EVALUATION_UNSUPPORTED,
  ROPE_SKIP_1MIN
} from './guangzhouTables'

const STAMP = '2026-09-07T00:00:00.000Z'
const GUANGZHOU = GD_CITIES[0]

function item(
  rest: Omit<ExamItemDefinition, 'customUnitLabel' | 'requirement' | 'maxScore' | 'verification'> & {
    maxScore?: number
    requirement?: ExamItemDefinition['requirement']
    customUnitLabel?: string
    verification?: ExamItemDefinition['verification']
  }
): ExamItemDefinition {
  const { customUnitLabel, requirement, maxScore, verification, ...fields } = rest
  const inferred =
    rest.scoreRule.kind === 'unsupported'
      ? 'verified_unsupported'
      : rest.scoreRule.kind === 'thresholdTable' && rest.scoreRule.entries.length > 0
        ? 'verified_supported'
        : 'unverified'
  return {
    ...fields,
    customUnitLabel: customUnitLabel ?? '',
    requirement: requirement ?? 'grouped',
    maxScore: maxScore ?? 100,
    verification: verification ?? inferred
  }
}

function timeItem(
  rest: Omit<ExamItemDefinition, 'customUnitLabel' | 'requirement' | 'maxScore' | 'valueType' | 'unit' | 'direction' | 'scoreRule' | 'verification'> & {
    scoreRule: ScoreRule
    timeInputMode: ExamItemDefinition['timeInputMode']
    decimalPlaces: number
  }
): ExamItemDefinition {
  return item({
    valueType: 'time',
    unit: 's',
    direction: 'lowerBetter',
    ...rest
  })
}

function distanceItem(
  rest: Omit<ExamItemDefinition, 'customUnitLabel' | 'requirement' | 'maxScore' | 'valueType' | 'unit' | 'direction' | 'timeInputMode' | 'verification'> & {
    scoreRule: ScoreRule
    decimalPlaces: number
  }
): ExamItemDefinition {
  return item({
    valueType: 'number',
    timeInputMode: 'seconds',
    unit: 'm',
    direction: 'higherBetter',
    ...rest
  })
}

function countItem(
  rest: Omit<ExamItemDefinition, 'customUnitLabel' | 'requirement' | 'maxScore' | 'valueType' | 'unit' | 'direction' | 'timeInputMode' | 'decimalPlaces' | 'verification'> & {
    scoreRule: ScoreRule
  }
): ExamItemDefinition {
  return item({
    ...rest,
    valueType: 'number',
    timeInputMode: 'seconds',
    unit: 'times',
    direction: 'higherBetter',
    decimalPlaces: 0
  })
}

export const GUANGZHOU_MIDDLE_2024_2026: ExamStandard = {
  id: 'cn-gd-guangzhou-middle-2024-2026',
  examType: 'middle_school_exam',
  regionCode: 'CN-GD',
  cityCode: GUANGZHOU.cityCode,
  citySlug: GUANGZHOU.citySlug,
  cityName: GUANGZHOU.cityName,
  yearFrom: 2024,
  yearTo: 2026,
  policyLabel: '2024–2026',
  policyPeriod: '2024-2026',
  title: '广州市初中学业水平考试体育与健康科目统一考试（2024–2026）',
  sourceAuthority: '广州市教育局 / 广州市招生考试委员会办公室',
  sourceTitle: '2026年广州市中考体育考试问答',
  sourceUrl: 'https://gzzk.gz.gov.cn/zwgk/zwdt/content/post_10742716.html',
  policySourceTitle:
    '广州市教育局关于印发2024-2026年初中学业水平考试体育与健康科目统一考试项目考试规则、评分标准和特殊考生医务审核指南的通知',
  policySourceUrl: 'https://jyj.gz.gov.cn/gk/zfxxgkml/bmwj/qtwj/content/post_9143692.html',
  publishedAt: '2026-03-26',
  effectiveFrom: '2024-01-01',
  effectiveTo: '2026-12-31',
  status: 'verified',
  ruleStatus: 'verified',
  scoreTableStatus: 'verified',
  schemeLabel: '2024–2026',
  scoreYear: 2026,
  applicableGroups: ['regular'],
  enrollmentCohort: null,
  calculationNotes: '',
  notes:
    '评分表逐项来自广州招考网《2026年广州市中考体育考试问答》官方页面，未补录空单元格。单项百分制按 5 分段线性插值、向下截断两位小数。引体向上、平行梯悬垂攀移仅录入页面上出现的档位。体育素质综合评价不是单一现场成绩，本版不自动换算。普通应届生现场项目：一类 20 分、二类 15 分、三类 15 分，体育素质综合评价 20 分，总分 70 分。',
  totalMaxScore: 70,
  scoring: { rounding: 'round0' },
  items: [
    timeItem({
      id: 'male-1000m',
      itemKey: 'run-1000m',
      name: '1000米跑',
      gender: 'male',
      category: 'endurance',
      timeInputMode: 'minutesSeconds',
      decimalPlaces: 0,
      testItemBuiltinKey: 'run-1000m',
      testItemId: 'test-item-builtin-run-1000m',
      scoreRule: MALE_1000M
    }),
    timeItem({
      id: 'female-800m',
      itemKey: 'run-800m',
      name: '800米跑',
      gender: 'female',
      category: 'endurance',
      timeInputMode: 'minutesSeconds',
      decimalPlaces: 0,
      testItemBuiltinKey: 'run-800m',
      testItemId: 'test-item-builtin-run-800m',
      scoreRule: FEMALE_800M
    }),
    timeItem({
      id: 'male-100m-swim',
      itemKey: 'swim-100m',
      name: '100米游泳',
      gender: 'male',
      category: 'swim',
      timeInputMode: 'minutesSeconds',
      decimalPlaces: 0,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: MALE_100M_SWIM
    }),
    timeItem({
      id: 'female-100m-swim',
      itemKey: 'swim-100m',
      name: '100米游泳',
      gender: 'female',
      category: 'swim',
      timeInputMode: 'minutesSeconds',
      decimalPlaces: 0,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: FEMALE_100M_SWIM
    }),
    distanceItem({
      id: 'male-standing-long-jump',
      itemKey: 'standing-long-jump',
      name: '立定跳远',
      gender: 'male',
      category: 'strength',
      decimalPlaces: 2,
      testItemBuiltinKey: 'standing-long-jump',
      testItemId: 'test-item-builtin-standing-long-jump',
      scoreRule: MALE_STANDING_LONG_JUMP
    }),
    distanceItem({
      id: 'female-standing-long-jump',
      itemKey: 'standing-long-jump',
      name: '立定跳远',
      gender: 'female',
      category: 'strength',
      decimalPlaces: 2,
      testItemBuiltinKey: 'standing-long-jump',
      testItemId: 'test-item-builtin-standing-long-jump',
      scoreRule: FEMALE_STANDING_LONG_JUMP
    }),
    distanceItem({
      id: 'male-triple-frog-jump',
      itemKey: 'triple-frog-jump',
      name: '三级连续蛙跳',
      gender: 'male',
      category: 'strength',
      decimalPlaces: 1,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: MALE_TRIPLE_FROG
    }),
    distanceItem({
      id: 'female-triple-frog-jump',
      itemKey: 'triple-frog-jump',
      name: '三级连续蛙跳',
      gender: 'female',
      category: 'strength',
      decimalPlaces: 1,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: FEMALE_TRIPLE_FROG
    }),
    countItem({
      id: 'rope-skip-1min',
      itemKey: 'rope-skip-1min',
      name: '一分钟跳绳',
      gender: 'all',
      category: 'endurance',
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: ROPE_SKIP_1MIN
    }),
    distanceItem({
      id: 'male-medicine-ball',
      itemKey: 'medicine-ball',
      name: '投掷实心球',
      gender: 'male',
      category: 'strength',
      decimalPlaces: 2,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: MALE_MEDICINE_BALL
    }),
    distanceItem({
      id: 'female-medicine-ball',
      itemKey: 'medicine-ball',
      name: '投掷实心球',
      gender: 'female',
      category: 'strength',
      decimalPlaces: 2,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: FEMALE_MEDICINE_BALL
    }),
    distanceItem({
      id: 'male-shot-put',
      itemKey: 'shot-put',
      name: '推铅球',
      gender: 'male',
      category: 'strength',
      decimalPlaces: 1,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: MALE_SHOT_PUT
    }),
    distanceItem({
      id: 'female-shot-put',
      itemKey: 'shot-put',
      name: '推铅球',
      gender: 'female',
      category: 'strength',
      decimalPlaces: 1,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: FEMALE_SHOT_PUT
    }),
    countItem({
      id: 'male-pull-up',
      itemKey: 'pull-up',
      name: '引体向上',
      gender: 'male',
      category: 'strength',
      testItemBuiltinKey: 'pull-up',
      testItemId: 'test-item-builtin-pull-up',
      scoreRule: MALE_PULL_UP
    }),
    distanceItem({
      id: 'female-parallel-ladder',
      itemKey: 'parallel-ladder',
      name: '平行梯悬垂攀移',
      gender: 'female',
      category: 'strength',
      decimalPlaces: 1,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: FEMALE_PARALLEL_LADDER
    }),
    timeItem({
      id: 'male-football',
      itemKey: 'football',
      name: '足球',
      gender: 'male',
      category: 'skill',
      timeInputMode: 'seconds',
      decimalPlaces: 1,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: MALE_FOOTBALL
    }),
    timeItem({
      id: 'female-football',
      itemKey: 'football',
      name: '足球',
      gender: 'female',
      category: 'skill',
      timeInputMode: 'seconds',
      decimalPlaces: 1,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: FEMALE_FOOTBALL
    }),
    timeItem({
      id: 'male-basketball',
      itemKey: 'basketball',
      name: '篮球',
      gender: 'male',
      category: 'skill',
      timeInputMode: 'seconds',
      decimalPlaces: 1,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: MALE_BASKETBALL
    }),
    timeItem({
      id: 'female-basketball',
      itemKey: 'basketball',
      name: '篮球',
      gender: 'female',
      category: 'skill',
      timeInputMode: 'seconds',
      decimalPlaces: 1,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: FEMALE_BASKETBALL
    }),
    timeItem({
      id: 'male-volleyball',
      itemKey: 'volleyball',
      name: '排球',
      gender: 'male',
      category: 'skill',
      timeInputMode: 'seconds',
      decimalPlaces: 1,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: MALE_VOLLEYBALL
    }),
    timeItem({
      id: 'female-volleyball',
      itemKey: 'volleyball',
      name: '排球',
      gender: 'female',
      category: 'skill',
      timeInputMode: 'seconds',
      decimalPlaces: 1,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: FEMALE_VOLLEYBALL
    }),
    timeItem({
      id: 'male-badminton',
      itemKey: 'badminton',
      name: '羽毛球',
      gender: 'male',
      category: 'skill',
      timeInputMode: 'seconds',
      decimalPlaces: 1,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: MALE_BADMINTON
    }),
    timeItem({
      id: 'female-badminton',
      itemKey: 'badminton',
      name: '羽毛球',
      gender: 'female',
      category: 'skill',
      timeInputMode: 'seconds',
      decimalPlaces: 1,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: FEMALE_BADMINTON
    }),
    timeItem({
      id: 'male-table-tennis',
      itemKey: 'table-tennis',
      name: '乒乓球',
      gender: 'male',
      category: 'skill',
      timeInputMode: 'seconds',
      decimalPlaces: 1,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: MALE_TABLE_TENNIS
    }),
    timeItem({
      id: 'female-table-tennis',
      itemKey: 'table-tennis',
      name: '乒乓球',
      gender: 'female',
      category: 'skill',
      timeInputMode: 'seconds',
      decimalPlaces: 1,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: FEMALE_TABLE_TENNIS
    }),
    timeItem({
      id: 'male-tennis',
      itemKey: 'tennis',
      name: '网球',
      gender: 'male',
      category: 'skill',
      timeInputMode: 'seconds',
      decimalPlaces: 1,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: MALE_TENNIS
    }),
    timeItem({
      id: 'female-tennis',
      itemKey: 'tennis',
      name: '网球',
      gender: 'female',
      category: 'skill',
      timeInputMode: 'seconds',
      decimalPlaces: 1,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: FEMALE_TENNIS
    }),
    item({
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
      maxScore: 20,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: QUALITY_EVALUATION_UNSUPPORTED
    })
  ],
  groups: [
    {
      id: 'group-class-1',
      title: '一类项目（中长跑 / 100米游泳，2选1）',
      selection: { mode: 'pickN', n: 1 },
      combine: 'single',
      itemIds: ['male-1000m', 'female-800m', 'male-100m-swim', 'female-100m-swim']
    },
    {
      id: 'group-class-2',
      title: '二类项目（6选1）',
      selection: { mode: 'pickN', n: 1 },
      combine: 'single',
      itemIds: [
        'male-standing-long-jump',
        'female-standing-long-jump',
        'male-triple-frog-jump',
        'female-triple-frog-jump',
        'rope-skip-1min',
        'male-medicine-ball',
        'female-medicine-ball',
        'male-shot-put',
        'female-shot-put',
        'male-pull-up',
        'female-parallel-ladder'
      ]
    },
    {
      id: 'group-class-3',
      title: '三类项目（球类 6选1）',
      selection: { mode: 'pickN', n: 1 },
      combine: 'single',
      itemIds: [
        'male-football',
        'female-football',
        'male-basketball',
        'female-basketball',
        'male-volleyball',
        'female-volleyball',
        'male-badminton',
        'female-badminton',
        'male-table-tennis',
        'female-table-tennis',
        'male-tennis',
        'female-tennis'
      ]
    },
    {
      id: 'group-quality',
      title: '体育素质综合评价',
      selection: { mode: 'all', n: 0 },
      combine: 'single',
      itemIds: ['quality-evaluation']
    }
  ],
  components: [
    {
      id: 'onsite-class-1',
      kind: 'onsite',
      title: '一类现场考试',
      maxScore: 20,
      weight: 0.2,
      groupIds: ['group-class-1']
    },
    {
      id: 'onsite-class-2',
      kind: 'onsite',
      title: '二类现场考试',
      maxScore: 15,
      weight: 0.15,
      groupIds: ['group-class-2']
    },
    {
      id: 'onsite-class-3',
      kind: 'onsite',
      title: '三类现场考试',
      maxScore: 15,
      weight: 0.15,
      groupIds: ['group-class-3']
    },
    {
      id: 'quality-evaluation',
      kind: 'process',
      title: '体育素质综合评价',
      maxScore: 20,
      weight: 0,
      groupIds: ['group-quality']
    }
  ],
  createdAt: STAMP,
  updatedAt: STAMP
}
