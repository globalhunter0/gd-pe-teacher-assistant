import { GD_CITIES } from '../regions'
import type { ExamStandard, ScoreRule } from '../types'
import { countExamItem, distanceExamItem, skillExamItem, timeExamItem } from './itemBuilders'
import {
  FOSHAN_2025_ROPE,
  FOSHAN_2026_ROPE,
  FOSHAN_BASKETBALL_SHOT,
  FOSHAN_FEMALE_100M_SWIM,
  FOSHAN_FEMALE_800M,
  FOSHAN_FEMALE_BASKETBALL_DRIBBLE,
  FOSHAN_FEMALE_FOOTBALL,
  FOSHAN_FEMALE_MEDICINE_BALL,
  FOSHAN_FEMALE_SHOT_PUT,
  FOSHAN_FEMALE_SIT_UP,
  FOSHAN_FEMALE_STANDING_LONG_JUMP,
  FOSHAN_FEMALE_TRIPLE_FROG,
  FOSHAN_MALE_1000M,
  FOSHAN_MALE_100M_SWIM,
  FOSHAN_MALE_BASKETBALL_DRIBBLE,
  FOSHAN_MALE_FOOTBALL,
  FOSHAN_MALE_MEDICINE_BALL,
  FOSHAN_MALE_PULL_UP,
  FOSHAN_MALE_SHOT_PUT,
  FOSHAN_MALE_SIT_UP,
  FOSHAN_MALE_STANDING_LONG_JUMP,
  FOSHAN_MALE_TRIPLE_FROG,
  FOSHAN_PROCESS_REASON,
  FOSHAN_PROCESS_UNSUPPORTED,
  FOSHAN_SHUTTLECOCK
} from './foshanTables'

const FOSHAN = GD_CITIES.find((item) => item.citySlug === 'foshan')!
const STAMP = '2026-09-09T21:00:00.000Z'

const CALC_NOTES =
  '现场项目考试满分48分：必考与选考满分各100，相加后乘以0.24，再四舍五入取整数。《国标》6分、《体评》6分由学校按学年等级赋分。官方注明评分表以分段分值表示，实际评分按每一分值计算到百分之一，系统按表内相邻档线性插值后截断到百分之一，空单元格未补录。'

interface FoshanYearSpec {
  id: string
  year: number
  policyLabel: string
  title: string
  sourceTitle: string
  sourceUrl: string
  policySourceTitle: string
  policySourceUrl: string
  publishedAt: string
  effectiveFrom: string
  effectiveTo: string
  notes: string
  footballName: string
  ropeRule: ScoreRule
}

function buildFoshan(spec: FoshanYearSpec): ExamStandard {
  return {
    id: spec.id,
    examType: 'middle_school_exam',
    regionCode: 'CN-GD',
    cityCode: FOSHAN.cityCode,
    citySlug: FOSHAN.citySlug,
    cityName: FOSHAN.cityName,
    yearFrom: spec.year,
    yearTo: spec.year,
    policyLabel: spec.policyLabel,
    policyPeriod: String(spec.year),
    title: spec.title,
    sourceAuthority: '佛山市教育局',
    sourceTitle: spec.sourceTitle,
    sourceUrl: spec.sourceUrl,
    policySourceTitle: spec.policySourceTitle,
    policySourceUrl: spec.policySourceUrl,
    publishedAt: spec.publishedAt,
    effectiveFrom: spec.effectiveFrom,
    effectiveTo: spec.effectiveTo,
    status: 'verified',
    ruleStatus: 'verified',
    scoreTableStatus: 'verified',
    schemeLabel: `${spec.year}年考试工作通知`,
    scoreYear: spec.year,
    applicableGroups: ['regular'],
    enrollmentCohort: null,
    calculationNotes: CALC_NOTES,
    notes: spec.notes,
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
        testItemBuiltinKey: 'run-1000m',
        testItemId: 'test-item-builtin-run-1000m',
        scoreRule: FOSHAN_MALE_1000M
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
        scoreRule: FOSHAN_FEMALE_800M
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
        scoreRule: FOSHAN_MALE_100M_SWIM
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
        scoreRule: FOSHAN_FEMALE_100M_SWIM
      }),
      countExamItem({
        id: 'rope-skip-1min',
        itemKey: 'rope-skip-1min',
        name: '一分钟跳绳',
        gender: 'all',
        category: 'speed',
        testItemBuiltinKey: 'rope-skip-1min',
        testItemId: 'test-item-builtin-rope-skip-1min',
        scoreRule: spec.ropeRule
      }),
      distanceExamItem({
        id: 'male-medicine-ball',
        itemKey: 'medicine-ball',
        name: '投掷实心球',
        gender: 'male',
        category: 'strength',
        decimalPlaces: 1,
        testItemBuiltinKey: null,
        testItemId: null,
        scoreRule: FOSHAN_MALE_MEDICINE_BALL
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
        scoreRule: FOSHAN_FEMALE_MEDICINE_BALL
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
        scoreRule: FOSHAN_MALE_BASKETBALL_DRIBBLE
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
        scoreRule: FOSHAN_FEMALE_BASKETBALL_DRIBBLE
      }),
      countExamItem({
        id: 'shuttlecock',
        itemKey: 'shuttlecock',
        name: '一分钟踢毽子',
        gender: 'all',
        category: 'skill',
        testItemBuiltinKey: null,
        testItemId: null,
        scoreRule: FOSHAN_SHUTTLECOCK
      }),
      countExamItem({
        id: 'male-sit-up',
        itemKey: 'sit-up',
        name: '一分钟仰卧起坐',
        gender: 'male',
        category: 'strength',
        testItemBuiltinKey: 'sit-up',
        testItemId: 'test-item-builtin-sit-up',
        scoreRule: FOSHAN_MALE_SIT_UP
      }),
      countExamItem({
        id: 'female-sit-up',
        itemKey: 'sit-up',
        name: '一分钟仰卧起坐',
        gender: 'female',
        category: 'strength',
        testItemBuiltinKey: 'sit-up',
        testItemId: 'test-item-builtin-sit-up',
        scoreRule: FOSHAN_FEMALE_SIT_UP
      }),
      distanceExamItem({
        id: 'male-triple-frog',
        itemKey: 'triple-frog-jump',
        name: '三级连续蛙跳',
        gender: 'male',
        category: 'strength',
        decimalPlaces: 1,
        testItemBuiltinKey: null,
        testItemId: null,
        scoreRule: FOSHAN_MALE_TRIPLE_FROG
      }),
      distanceExamItem({
        id: 'female-triple-frog',
        itemKey: 'triple-frog-jump',
        name: '三级连续蛙跳',
        gender: 'female',
        category: 'strength',
        decimalPlaces: 1,
        testItemBuiltinKey: null,
        testItemId: null,
        scoreRule: FOSHAN_FEMALE_TRIPLE_FROG
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
        scoreRule: FOSHAN_MALE_STANDING_LONG_JUMP
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
        scoreRule: FOSHAN_FEMALE_STANDING_LONG_JUMP
      }),
      countExamItem({
        id: 'male-basketball-shot',
        itemKey: 'basketball-shot',
        name: '一分钟篮球投篮',
        gender: 'male',
        category: 'skill',
        testItemBuiltinKey: null,
        testItemId: null,
        scoreRule: FOSHAN_BASKETBALL_SHOT
      }),
      countExamItem({
        id: 'female-basketball-shot',
        itemKey: 'basketball-shot',
        name: '一分钟篮球投篮',
        gender: 'female',
        category: 'skill',
        testItemBuiltinKey: null,
        testItemId: null,
        scoreRule: FOSHAN_BASKETBALL_SHOT
      }),
      distanceExamItem({
        id: 'male-shot-put',
        itemKey: 'shot-put',
        name: '推铅球',
        gender: 'male',
        category: 'strength',
        decimalPlaces: 1,
        testItemBuiltinKey: null,
        testItemId: null,
        scoreRule: FOSHAN_MALE_SHOT_PUT
      }),
      distanceExamItem({
        id: 'female-shot-put',
        itemKey: 'shot-put',
        name: '推铅球',
        gender: 'female',
        category: 'strength',
        decimalPlaces: 1,
        testItemBuiltinKey: null,
        testItemId: null,
        scoreRule: FOSHAN_FEMALE_SHOT_PUT
      }),
      timeExamItem({
        id: 'male-football',
        itemKey: 'football',
        name: spec.footballName,
        gender: 'male',
        category: 'skill',
        timeInputMode: 'seconds',
        decimalPlaces: 1,
        testItemBuiltinKey: null,
        testItemId: null,
        scoreRule: FOSHAN_MALE_FOOTBALL
      }),
      timeExamItem({
        id: 'female-football',
        itemKey: 'football',
        name: spec.footballName,
        gender: 'female',
        category: 'skill',
        timeInputMode: 'seconds',
        decimalPlaces: 1,
        testItemBuiltinKey: null,
        testItemId: null,
        scoreRule: FOSHAN_FEMALE_FOOTBALL
      }),
      countExamItem({
        id: 'male-pull-up',
        itemKey: 'pull-up',
        name: '引体向上',
        gender: 'male',
        category: 'strength',
        testItemBuiltinKey: 'pull-up',
        testItemId: 'test-item-builtin-pull-up',
        scoreRule: FOSHAN_MALE_PULL_UP
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
        maxScore: 6,
        testItemBuiltinKey: null,
        testItemId: null,
        reason: FOSHAN_PROCESS_REASON,
        scoreRule: FOSHAN_PROCESS_UNSUPPORTED
      }),
      skillExamItem({
        id: 'pe-class-eval',
        itemKey: 'pe-class-eval',
        name: '体育课运动技能评价',
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
        reason: FOSHAN_PROCESS_REASON,
        scoreRule: FOSHAN_PROCESS_UNSUPPORTED
      })
    ],
    groups: [
      {
        id: 'group-required',
        title: '必考科目（女800米/男1000米 或 100米游泳，二选一）',
        selection: { mode: 'pickN', n: 1 },
        combine: 'single',
        itemIds: ['male-1000m', 'female-800m', 'male-100m-swim', 'female-100m-swim']
      },
      {
        id: 'group-elective',
        title: '选考科目（12选1，不得与必考同时兼报游泳）',
        selection: { mode: 'pickN', n: 1 },
        combine: 'single',
        itemIds: [
          'male-medicine-ball',
          'female-medicine-ball',
          'male-triple-frog',
          'female-triple-frog',
          'male-standing-long-jump',
          'female-standing-long-jump',
          'rope-skip-1min',
          'male-shot-put',
          'female-shot-put',
          'male-sit-up',
          'female-sit-up',
          'male-basketball-dribble',
          'female-basketball-dribble',
          'male-basketball-shot',
          'female-basketball-shot',
          'shuttlecock',
          'male-football',
          'female-football',
          'male-100m-swim',
          'female-100m-swim',
          'male-pull-up'
        ]
      },
      {
        id: 'group-national',
        title: '《国标》测试（学校按学年等级赋分）',
        selection: { mode: 'all', n: 0 },
        combine: 'sum',
        itemIds: ['national-fitness']
      },
      {
        id: 'group-pe-eval',
        title: '《体评》测评（学校按学年等级赋分）',
        selection: { mode: 'all', n: 0 },
        combine: 'sum',
        itemIds: ['pe-class-eval']
      }
    ],
    components: [
      {
        id: 'national',
        kind: 'process',
        title: '《国家学生体质健康标准》测试',
        maxScore: 6,
        weight: 6 / 60,
        groupIds: ['group-national']
      },
      {
        id: 'pe-eval',
        kind: 'process',
        title: '体育课运动技能评价',
        maxScore: 6,
        weight: 6 / 60,
        groupIds: ['group-pe-eval']
      },
      {
        id: 'onsite-required',
        kind: 'onsite',
        title: '体育项目考试·必考',
        maxScore: 24,
        weight: 24 / 60,
        groupIds: ['group-required']
      },
      {
        id: 'onsite-elective',
        kind: 'onsite',
        title: '体育项目考试·选考',
        maxScore: 24,
        weight: 24 / 60,
        groupIds: ['group-elective']
      }
    ],
    createdAt: STAMP,
    updatedAt: STAMP
  }
}

export const FOSHAN_MIDDLE_2026: ExamStandard = buildFoshan({
  id: 'cn-gd-foshan-middle-2026',
  year: 2026,
  policyLabel: '2026',
  title: '佛山市 2026 中考体育',
  sourceTitle: '佛山市教育局关于做好2026年我市初中毕业升学体育考试工作的通知',
  sourceUrl: 'http://edu.foshan.gov.cn/jyxx/jyxx_jyzc/fsszkw/zkzz/content/post_7115135.html',
  policySourceTitle: '佛山教招〔2026〕2号（正文及附件1《佛山市中考体育考试项目规则及评分标准》）',
  policySourceUrl: 'http://edu.foshan.gov.cn/attachment/0/598/598357/7115135.pdf',
  publishedAt: '2026-01-30',
  effectiveFrom: '2026-01-30',
  effectiveTo: '2026-12-31',
  footballName: '足球28米绕杆运球',
  ropeRule: FOSHAN_2026_ROPE,
  notes:
    '评分表转录自佛山招考网刊载的市教育局通知附件PDF。2026年起一分钟跳绳满分档调整为182次；足球改为28米绕杆运球并增加射门，未进门不得分。2027年引体向上满分拟调为12次，具体标准另行通知，本版本不提前套用。空单元格未补录。'
})

export const FOSHAN_MIDDLE_2025: ExamStandard = buildFoshan({
  id: 'cn-gd-foshan-middle-2025',
  year: 2025,
  policyLabel: '2025',
  title: '佛山市 2025 中考体育',
  sourceTitle: '佛山市教育局关于做好2025年我市初中毕业升学体育考试工作的通知',
  sourceUrl: 'http://edu.foshan.gov.cn/gg/wjgb/content/post_6264733.html',
  policySourceTitle: '佛山教招〔2025〕1号（正文及附件1《佛山市中考体育考试项目规则及评分标准》）',
  policySourceUrl: 'http://edu.foshan.gov.cn/attachment/0/510/510725/6264733.pdf',
  publishedAt: '2025-01-07',
  effectiveFrom: '2025-01-07',
  effectiveTo: '2025-12-31',
  footballName: '足球25米绕杆运球',
  ropeRule: FOSHAN_2025_ROPE,
  notes:
    '评分表转录自佛山市教育局政务网刊载的2025年通知附件PDF。一分钟跳绳满分档为208次；足球为25米绕杆运球。官方注明男生一分钟跳绳151次实际得81分。不得用2026表覆盖本版本。'
})
