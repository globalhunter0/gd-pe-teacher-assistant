import { GD_CITIES } from '../regions'
import type { ExamStandard } from '../types'
import { countExamItem, distanceExamItem, timeExamItem } from './itemBuilders'
import {
  SHAOGUAN_FEMALE_800M,
  SHAOGUAN_FEMALE_LADDER,
  SHAOGUAN_FEMALE_SHOT,
  SHAOGUAN_FEMALE_TRIPLE_FROG,
  SHAOGUAN_FEMALE_VOLLEYBALL,
  SHAOGUAN_MALE_1000M,
  SHAOGUAN_MALE_PULL_UP,
  SHAOGUAN_MALE_SHOT,
  SHAOGUAN_MALE_TRIPLE_FROG,
  SHAOGUAN_MALE_VOLLEYBALL,
  SHAOGUAN_ROPE,
  SHAOGUAN_SWIM
} from './shaoguanTables'

const STAMP = '2026-09-09T22:55:00.000Z'
const SHAOGUAN = GD_CITIES.find((item) => item.citySlug === 'shaoguan')!

const CALC_NOTES =
  '体育与健康考试总分100分，按《2026年韶关市高中阶段学校招生录取工作实施办法》折算为60分计入中考总分。2026项目通知为三类各选1项：体能素质（男引体/女平行梯或推铅球）、必考（男1000/女800或100米游泳）、选考（三级连续蛙跳/一分钟跳绳/排球连续垫球）。单项按附件2档位制计分，不擅自线性插值。100米游泳6分钟内完成即表内100分，再按官方1:1.5折算后写入换算结果。引体向上/平行梯仅录入可明确对应普通考生的档，择考生列与错位风险空单元格未补录。三项如何合成百分制100的细则未在项目通知中写明，本系统按单项换算。'

export const SHAOGUAN_MIDDLE_2026: ExamStandard = {
  id: 'cn-gd-shaoguan-middle-2026',
  examType: 'middle_school_exam',
  regionCode: 'CN-GD',
  cityCode: SHAOGUAN.cityCode,
  citySlug: SHAOGUAN.citySlug,
  cityName: SHAOGUAN.cityName,
  yearFrom: 2026,
  yearTo: 2026,
  policyLabel: '2026',
  policyPeriod: '2026',
  title: '韶关市 2026 中考体育',
  sourceAuthority: '韶关市教育局',
  sourceTitle: '关于公布2026年韶关市初中学业水平考试体育考试项目及标准的通知',
  sourceUrl: 'https://www.sg.gov.cn/zw/zdlyxxgk/dzjg/sgsjyj/gxxxgk/gxzldh/content/post_2806815.html',
  policySourceTitle:
    '韶关市教育局办公室2025年12月31日通知及附件2《2026年韶关市初中毕业生升学体育考试项目评分标准》（并引用韶市教〔2021〕7号确定项目抽签办法）',
  policySourceUrl: 'https://www.sg.gov.cn/attachment/0/296/296401/2806815.pdf',
  publishedAt: '2025-12-31',
  effectiveFrom: '2025-12-31',
  effectiveTo: '2026-12-31',
  status: 'verified',
  ruleStatus: 'verified',
  scoreTableStatus: 'verified',
  schemeLabel: '2026年体育考试项目及标准',
  scoreYear: 2026,
  applicableGroups: ['regular'],
  enrollmentCohort: null,
  calculationNotes: CALC_NOTES,
  notes:
    '评分表转录自韶关市政府门户2026-01-04挂网《关于公布2026年韶关市初中学业水平考试体育考试项目及标准的通知》PDF附件2。项目抽签办法引用韶市教〔2021〕7号。2026游泳满分标准为6分钟内完成100米即100分，再按1:1.5折算。不得套用广州/汕头/珠海/佛山/江门表。铅球/引体/平行梯择考生列未作为普通考生换算表。',
  totalMaxScore: 100,
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
      maxScore: 120,
      testItemBuiltinKey: 'run-1000m',
      testItemId: 'test-item-builtin-run-1000m',
      scoreRule: SHAOGUAN_MALE_1000M
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
      scoreRule: SHAOGUAN_FEMALE_800M
    }),
    timeExamItem({
      id: 'male-100m-swim',
      itemKey: 'swim-100m',
      name: '100米游泳',
      gender: 'male',
      category: 'swim',
      timeInputMode: 'minutesSeconds',
      decimalPlaces: 0,
      maxScore: 150,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: SHAOGUAN_SWIM
    }),
    timeExamItem({
      id: 'female-100m-swim',
      itemKey: 'swim-100m',
      name: '100米游泳',
      gender: 'female',
      category: 'swim',
      timeInputMode: 'minutesSeconds',
      decimalPlaces: 0,
      maxScore: 150,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: SHAOGUAN_SWIM
    }),
    countExamItem({
      id: 'male-pull-up',
      itemKey: 'pull-up',
      name: '引体向上',
      gender: 'male',
      category: 'strength',
      maxScore: 100,
      testItemBuiltinKey: 'pull-up',
      testItemId: 'test-item-builtin-pull-up',
      scoreRule: SHAOGUAN_MALE_PULL_UP
    }),
    distanceExamItem({
      id: 'female-parallel-ladder',
      itemKey: 'parallel-ladder',
      name: '平行梯悬垂攀移',
      gender: 'female',
      category: 'strength',
      decimalPlaces: 1,
      maxScore: 100,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: SHAOGUAN_FEMALE_LADDER
    }),
    distanceExamItem({
      id: 'male-shot-put',
      itemKey: 'shot-put',
      name: '推铅球',
      gender: 'male',
      category: 'strength',
      decimalPlaces: 2,
      maxScore: 100,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: SHAOGUAN_MALE_SHOT
    }),
    distanceExamItem({
      id: 'female-shot-put',
      itemKey: 'shot-put',
      name: '推铅球',
      gender: 'female',
      category: 'strength',
      decimalPlaces: 2,
      maxScore: 100,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: SHAOGUAN_FEMALE_SHOT
    }),
    distanceExamItem({
      id: 'male-triple-frog',
      itemKey: 'triple-frog-jump',
      name: '三级连续蛙跳',
      gender: 'male',
      category: 'strength',
      decimalPlaces: 2,
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: SHAOGUAN_MALE_TRIPLE_FROG
    }),
    distanceExamItem({
      id: 'female-triple-frog',
      itemKey: 'triple-frog-jump',
      name: '三级连续蛙跳',
      gender: 'female',
      category: 'strength',
      decimalPlaces: 2,
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: SHAOGUAN_FEMALE_TRIPLE_FROG
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
      scoreRule: SHAOGUAN_ROPE
    }),
    countExamItem({
      id: 'male-volleyball',
      itemKey: 'volleyball',
      name: '排球连续垫球',
      gender: 'male',
      category: 'skill',
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      aliases: ['排球'],
      scoreRule: SHAOGUAN_MALE_VOLLEYBALL
    }),
    countExamItem({
      id: 'female-volleyball',
      itemKey: 'volleyball',
      name: '排球连续垫球',
      gender: 'female',
      category: 'skill',
      maxScore: 120,
      testItemBuiltinKey: null,
      testItemId: null,
      aliases: ['排球'],
      scoreRule: SHAOGUAN_FEMALE_VOLLEYBALL
    })
  ],
  groups: [
    {
      id: 'group-fitness',
      title: '体能素质项目（男引体向上/女平行梯 或 推铅球，二选一）',
      selection: { mode: 'pickN', n: 1 },
      combine: 'single',
      itemIds: ['male-pull-up', 'female-parallel-ladder', 'male-shot-put', 'female-shot-put']
    },
    {
      id: 'group-required',
      title: '必考项目（男1000米/女800米 或 100米游泳，二选一）',
      selection: { mode: 'pickN', n: 1 },
      combine: 'single',
      itemIds: ['male-1000m', 'female-800m', 'male-100m-swim', 'female-100m-swim']
    },
    {
      id: 'group-elective',
      title: '选考项目（三级连续蛙跳 / 一分钟跳绳 / 排球连续垫球，三选一）',
      selection: { mode: 'pickN', n: 1 },
      combine: 'single',
      itemIds: [
        'male-triple-frog',
        'female-triple-frog',
        'rope-skip-1min',
        'male-volleyball',
        'female-volleyball'
      ]
    }
  ],
  components: [
    {
      id: 'onsite',
      kind: 'onsite',
      title: '体育考试',
      maxScore: 100,
      weight: 1,
      groupIds: ['group-fitness', 'group-required', 'group-elective']
    }
  ],
  createdAt: STAMP,
  updatedAt: STAMP
}
