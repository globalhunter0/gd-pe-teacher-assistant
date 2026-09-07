import { GD_PROVINCE } from '../regions'
import type { ExamItemDefinition, ExamStandard, ScoreRule } from '../types'
import {
  FEMALE_100M,
  FEMALE_BASKETBALL,
  FEMALE_FIGURE8_RUN,
  FEMALE_FOOTBALL,
  FEMALE_PUSH_UP_15S,
  FEMALE_SHOT_PUT,
  FEMALE_STANDING_TRIPLE_JUMP,
  FEMALE_V_UP_20S,
  MALE_100M,
  MALE_BASKETBALL,
  MALE_FIGURE8_RUN,
  MALE_FOOTBALL,
  MALE_PUSH_UP_20S,
  MALE_SHOT_PUT,
  MALE_STANDING_TRIPLE_JUMP,
  MALE_V_UP_20S,
  TABLE_TENNIS_PUSH_ATTACK
} from './gaokaoSports2026Tables'

const STAMP = '2026-09-07T00:00:00.000Z'

const VOLLEYBALL_REASON =
  '排球隔网定向垫传球为垫球10个×3分、传球10个×3分、助跑摸高15分合计75分，需未来 CompositeScore 模型，当前不得按单一 rawValue 换算。'

const SWIM_REASON =
  '游泳评分按泳姿、距离、池长和性别分表，不能压成一个 TestItem，当前引擎暂不支持自动换算。'

const ROUTINE_REASON =
  '健美操/啦啦操含柔韧、控倒立和规定成套技评，属于复合评分，当前不得按单一 rawValue 换算。'

function unsupportedRule(maxScore: number, reason: string): ScoreRule {
  return {
    kind: 'unsupported',
    reason,
    maxScore,
    minScore: 0
  }
}

function basicItem(
  rest: Omit<ExamItemDefinition, 'requirement' | 'testItemBuiltinKey' | 'testItemId' | 'verification' | 'customUnitLabel'> & {
    customUnitLabel?: string
  }
): ExamItemDefinition {
  return {
    ...rest,
    requirement: 'grouped',
    customUnitLabel: rest.customUnitLabel ?? '',
    testItemBuiltinKey: null,
    testItemId: null,
    verification: 'verified_supported'
  }
}

function specialUnsupported(
  id: string,
  itemKey: string,
  name: string,
  category: ExamItemDefinition['category'],
  maxScore: number,
  reason: string,
  sourcePage: number
): ExamItemDefinition {
  return {
    id,
    itemKey,
    name,
    gender: 'all',
    requirement: 'grouped',
    category,
    valueType: 'number',
    timeInputMode: 'seconds',
    unit: 'score',
    customUnitLabel: '',
    direction: 'higherBetter',
    decimalPlaces: 0,
    maxScore,
    testItemBuiltinKey: null,
    testItemId: null,
    verification: 'verified_unsupported',
    scoreRule: unsupportedRule(maxScore, reason),
    sourcePage
  }
}

export const GUANGDONG_GAOKAO_SPORTS_2026: ExamStandard = {
  id: 'cn-gd-gaokao-sports-2026',
  examType: 'gaokao_sports',
  regionCode: 'CN-GD',
  cityCode: GD_PROVINCE.cityCode,
  citySlug: GD_PROVINCE.citySlug,
  cityName: GD_PROVINCE.cityName,
  yearFrom: 2026,
  yearTo: 2026,
  policyLabel: '2026',
  policyPeriod: '2026',
  title: '广东省2026年普通高校招生体育类专业省统考',
  sourceAuthority: '广东省教育考试院',
  sourceTitle: '广东省2026年普通高校招生体育类专业省统考科目和要求',
  sourceUrl: 'https://eea.gd.gov.cn/ptgk/content/post_4789588.html',
  policySourceTitle: '关于印发广东省2026年普通高校招生统一考试体育类专业省统考科目和要求的通知（粤考院函〔2025〕147号）',
  policySourceUrl: 'https://gzzk.gz.gov.cn/zwgk/tzwj/content/post_10516190.html',
  publishedAt: '2025-10-27',
  effectiveFrom: '2026-01-01',
  effectiveTo: '2026-12-31',
  status: 'verified',
  notes:
    '本条只覆盖广东省普通高校招生体育类专业省统考。官方评分标准以粤考院函〔2025〕147号扫描附件为准。第6页写明成绩介于两档之间取较低分值，不得线性插值。男子立定三级跳远1分档按PDF第11页为6.50米。排球、游泳、健美操、啦啦操已核验来源，但当前模型不支持自动换算。',
  totalMaxScore: 300,
  scoring: { rounding: 'none' },
  items: [
    basicItem({
      id: 'male-100m',
      itemKey: 'run-100m',
      name: '100米跑',
      gender: 'male',
      category: 'speed',
      valueType: 'time',
      timeInputMode: 'seconds',
      unit: 's',
      direction: 'lowerBetter',
      decimalPlaces: 2,
      maxScore: 75,
      scoreRule: MALE_100M,
      sourcePage: 7
    }),
    basicItem({
      id: 'female-100m',
      itemKey: 'run-100m',
      name: '100米跑',
      gender: 'female',
      category: 'speed',
      valueType: 'time',
      timeInputMode: 'seconds',
      unit: 's',
      direction: 'lowerBetter',
      decimalPlaces: 2,
      maxScore: 75,
      scoreRule: FEMALE_100M,
      sourcePage: 8
    }),
    basicItem({
      id: 'male-standing-triple-jump',
      itemKey: 'standing-triple-jump',
      name: '立定三级跳远',
      gender: 'male',
      category: 'strength',
      valueType: 'number',
      timeInputMode: 'seconds',
      unit: 'm',
      direction: 'higherBetter',
      decimalPlaces: 2,
      maxScore: 75,
      scoreRule: MALE_STANDING_TRIPLE_JUMP,
      sourcePage: 11
    }),
    basicItem({
      id: 'female-standing-triple-jump',
      itemKey: 'standing-triple-jump',
      name: '立定三级跳远',
      gender: 'female',
      category: 'strength',
      valueType: 'number',
      timeInputMode: 'seconds',
      unit: 'm',
      direction: 'higherBetter',
      decimalPlaces: 2,
      maxScore: 75,
      scoreRule: FEMALE_STANDING_TRIPLE_JUMP,
      sourcePage: 12
    }),
    basicItem({
      id: 'male-shot-put',
      itemKey: 'shot-put',
      name: '原地推铅球（5公斤）',
      gender: 'male',
      category: 'strength',
      valueType: 'number',
      timeInputMode: 'seconds',
      unit: 'm',
      direction: 'higherBetter',
      decimalPlaces: 2,
      maxScore: 75,
      scoreRule: MALE_SHOT_PUT,
      sourcePage: 15
    }),
    basicItem({
      id: 'female-shot-put',
      itemKey: 'shot-put',
      name: '原地推铅球（4公斤）',
      gender: 'female',
      category: 'strength',
      valueType: 'number',
      timeInputMode: 'seconds',
      unit: 'm',
      direction: 'higherBetter',
      decimalPlaces: 2,
      maxScore: 75,
      scoreRule: FEMALE_SHOT_PUT,
      sourcePage: 16
    }),
    basicItem({
      id: 'male-push-up-20s',
      itemKey: 'push-up-20s',
      name: '20秒连续俯卧撑',
      gender: 'male',
      category: 'strength',
      valueType: 'number',
      timeInputMode: 'seconds',
      unit: 'times',
      direction: 'higherBetter',
      decimalPlaces: 0,
      maxScore: 50,
      scoreRule: MALE_PUSH_UP_20S,
      sourcePage: 19
    }),
    basicItem({
      id: 'female-push-up-15s',
      itemKey: 'push-up-15s',
      name: '15秒连续俯卧撑',
      gender: 'female',
      category: 'strength',
      valueType: 'number',
      timeInputMode: 'seconds',
      unit: 'times',
      direction: 'higherBetter',
      decimalPlaces: 0,
      maxScore: 50,
      scoreRule: FEMALE_PUSH_UP_15S,
      sourcePage: 19
    }),
    basicItem({
      id: 'male-v-up-20s',
      itemKey: 'v-up-20s',
      name: '20秒两头起',
      gender: 'male',
      category: 'strength',
      valueType: 'number',
      timeInputMode: 'seconds',
      unit: 'times',
      direction: 'higherBetter',
      decimalPlaces: 0,
      maxScore: 50,
      scoreRule: MALE_V_UP_20S,
      sourcePage: 22
    }),
    basicItem({
      id: 'female-v-up-20s',
      itemKey: 'v-up-20s',
      name: '20秒两头起',
      gender: 'female',
      category: 'strength',
      valueType: 'number',
      timeInputMode: 'seconds',
      unit: 'times',
      direction: 'higherBetter',
      decimalPlaces: 0,
      maxScore: 50,
      scoreRule: FEMALE_V_UP_20S,
      sourcePage: 22
    }),
    basicItem({
      id: 'male-figure8-run',
      itemKey: 'figure8-run',
      name: '3×10米8字绕杆跑',
      gender: 'male',
      category: 'speed',
      valueType: 'time',
      timeInputMode: 'seconds',
      unit: 's',
      direction: 'lowerBetter',
      decimalPlaces: 2,
      maxScore: 50,
      scoreRule: MALE_FIGURE8_RUN,
      sourcePage: 25
    }),
    basicItem({
      id: 'female-figure8-run',
      itemKey: 'figure8-run',
      name: '3×10米8字绕杆跑',
      gender: 'female',
      category: 'speed',
      valueType: 'time',
      timeInputMode: 'seconds',
      unit: 's',
      direction: 'lowerBetter',
      decimalPlaces: 2,
      maxScore: 50,
      scoreRule: FEMALE_FIGURE8_RUN,
      sourcePage: 26
    }),
    basicItem({
      id: 'special-football-male',
      itemKey: 'football-dribble-shoot',
      name: '足球运球绕杆射门',
      gender: 'male',
      category: 'skill',
      valueType: 'time',
      timeInputMode: 'seconds',
      unit: 's',
      direction: 'lowerBetter',
      decimalPlaces: 1,
      maxScore: 75,
      scoreRule: MALE_FOOTBALL,
      sourcePage: 30
    }),
    basicItem({
      id: 'special-football-female',
      itemKey: 'football-dribble-shoot',
      name: '足球运球绕杆射门',
      gender: 'female',
      category: 'skill',
      valueType: 'time',
      timeInputMode: 'seconds',
      unit: 's',
      direction: 'lowerBetter',
      decimalPlaces: 1,
      maxScore: 75,
      scoreRule: FEMALE_FOOTBALL,
      sourcePage: 31
    }),
    basicItem({
      id: 'special-basketball-male',
      itemKey: 'basketball-dribble-shot',
      name: '篮球运球绕杆定点投篮',
      gender: 'male',
      category: 'skill',
      valueType: 'time',
      timeInputMode: 'seconds',
      unit: 's',
      direction: 'lowerBetter',
      decimalPlaces: 1,
      maxScore: 75,
      scoreRule: MALE_BASKETBALL,
      sourcePage: 36
    }),
    basicItem({
      id: 'special-basketball-female',
      itemKey: 'basketball-dribble-shot',
      name: '篮球运球绕杆定点投篮',
      gender: 'female',
      category: 'skill',
      valueType: 'time',
      timeInputMode: 'seconds',
      unit: 's',
      direction: 'lowerBetter',
      decimalPlaces: 1,
      maxScore: 75,
      scoreRule: FEMALE_BASKETBALL,
      sourcePage: 37
    }),
    specialUnsupported('special-volleyball', 'volleyball-pass', '排球隔网定向垫传球', 'skill', 75, VOLLEYBALL_REASON, 38),
    basicItem({
      id: 'special-table-tennis',
      itemKey: 'table-tennis-push-attack',
      name: '乒乓球左推右攻',
      gender: 'all',
      category: 'skill',
      valueType: 'number',
      timeInputMode: 'seconds',
      unit: 'other',
      customUnitLabel: '板',
      direction: 'higherBetter',
      decimalPlaces: 0,
      maxScore: 75,
      scoreRule: TABLE_TENNIS_PUSH_ATTACK,
      sourcePage: 43
    }),
    specialUnsupported('special-swim', 'swim-stroke', '游泳（蛙、蝶、仰、自由泳四选一）', 'swim', 75, SWIM_REASON, 44),
    specialUnsupported('special-aerobics', 'aerobics-routine', '健美操成套动作', 'skill', 150, ROUTINE_REASON, 53),
    specialUnsupported('special-cheerleading', 'cheerleading-routine', '啦啦操成套动作', 'skill', 150, ROUTINE_REASON, 53)
  ],
  groups: [
    {
      id: 'group-basic-quality-1',
      title: '基本素质①（100米跑 + 立定三级跳远 + 原地推铅球）',
      selection: { mode: 'all', n: 3 },
      combine: 'sum',
      itemIds: [
        'male-100m',
        'female-100m',
        'male-standing-triple-jump',
        'female-standing-triple-jump',
        'male-shot-put',
        'female-shot-put'
      ]
    },
    {
      id: 'group-basic-quality-2',
      title: '基本素质②（连续俯卧撑 + 20秒两头起 + 3×10米8字绕杆跑）',
      selection: { mode: 'all', n: 3 },
      combine: 'sum',
      itemIds: [
        'male-push-up-20s',
        'female-push-up-15s',
        'male-v-up-20s',
        'female-v-up-20s',
        'male-figure8-run',
        'female-figure8-run'
      ]
    },
    {
      id: 'group-special-foundation',
      title: '专项基础（7选1）',
      selection: { mode: 'pickN', n: 1 },
      combine: 'single',
      itemIds: [
        'special-football-male',
        'special-football-female',
        'special-basketball-male',
        'special-basketball-female',
        'special-volleyball',
        'special-table-tennis',
        'special-swim',
        'special-aerobics',
        'special-cheerleading'
      ]
    }
  ],
  components: [
    {
      id: 'basic-quality-1',
      kind: 'basic_quality',
      title: '基本素质①（对应球类/游泳专项，满分225）',
      maxScore: 225,
      weight: 0,
      groupIds: ['group-basic-quality-1']
    },
    {
      id: 'basic-quality-2',
      kind: 'basic_quality',
      title: '基本素质②（对应健美操/啦啦操专项，满分150）',
      maxScore: 150,
      weight: 0,
      groupIds: ['group-basic-quality-2']
    },
    {
      id: 'special-foundation',
      kind: 'special_foundation',
      title: '专项基础',
      maxScore: 150,
      weight: 0,
      groupIds: ['group-special-foundation']
    }
  ],
  createdAt: STAMP,
  updatedAt: STAMP
}
