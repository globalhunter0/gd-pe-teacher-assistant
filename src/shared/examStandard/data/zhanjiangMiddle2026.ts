import { GD_CITIES } from '../regions'
import type { ExamStandard, ScoreRule } from '../types'
import { countExamItem, distanceExamItem, examItem, pendingOfficialTableRule, timeExamItem } from './itemBuilders'

const STAMP = '2026-09-09T00:00:00.000Z'
const ZHANJIANG = GD_CITIES.find((item) => item.citySlug === 'zhanjiang')!
const TABLE_PENDING =
  '市政府门户网站公开报道仅核验满分调整与项目构成，完整评分档未公布，禁止推测其余分值。'

function pending(maxScore = 100): ScoreRule {
  return pendingOfficialTableRule(TABLE_PENDING, maxScore)
}

export const ZHANJIANG_MIDDLE_2026: ExamStandard = {
  id: 'cn-gd-zhanjiang-middle-2026',
  examType: 'middle_school_exam',
  regionCode: 'CN-GD',
  cityCode: ZHANJIANG.cityCode,
  citySlug: ZHANJIANG.citySlug,
  cityName: ZHANJIANG.cityName,
  yearFrom: 2026,
  yearTo: 2026,
  policyLabel: '2026',
  policyPeriod: '2026',
  title: '湛江市 2026 中考体育',
  sourceAuthority: '湛江市教育局',
  sourceTitle: '2026年湛江体育中考开考（转述市教育局《关于做好2026年湛江市高中阶段学校招生体育考试工作的通知》）',
  sourceUrl: 'https://www.zhanjiang.gov.cn/zjsfw/bmdh/jyj/zwgk/gzdt/content/post_2167210.html',
  policySourceTitle: '湛江市人民政府门户网站刊载：2026年湛江体育中考开考',
  policySourceUrl: 'https://www.zhanjiang.gov.cn/zjsfw/bmdh/jyj/zwgk/gzdt/content/post_2167210.html',
  publishedAt: '2026-04-13',
  effectiveFrom: '2026-01-01',
  effectiveTo: '2026-12-31',
  status: 'partial',
  ruleStatus: 'verified',
  scoreTableStatus: 'partial',
  schemeLabel: '2026考试工作通知',
  scoreYear: 2026,
  applicableGroups: ['regular'],
  enrollmentCohort: null,
  calculationNotes: '',
  notes:
    '已公开核验：体育中考总分100分，按80%折算计入高中录取总分；初三《国家学生体质健康标准》测试5分（及格即满分）；体育考试项目95分，必考与选考成绩按官方规则取平均。2026耐力项目满分标准：男1000米3分40秒，女800米3分25秒；100米游泳男2分24秒、女2分31秒。选考公开项目：立定跳远、投掷实心球、一分钟跳绳、一分钟仰卧起坐。当前仅录入已公开核验项目，完整评分表待官方附件核验。禁止把满分标准当成完整评分表。该城市/版本评分表尚未完整核验，暂不支持完整自动换算。',
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
      id: 'male-100m-swim',
      itemKey: 'swim-100m',
      name: '100米游泳',
      gender: 'male',
      category: 'swim',
      timeInputMode: 'minutesSeconds',
      decimalPlaces: 0,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: pending()
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
      scoreRule: pending()
    }),
    distanceExamItem({
      id: 'standing-long-jump',
      itemKey: 'standing-long-jump',
      name: '立定跳远',
      gender: 'all',
      category: 'strength',
      decimalPlaces: 2,
      testItemBuiltinKey: 'standing-long-jump',
      testItemId: 'test-item-builtin-standing-long-jump',
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
      name: '一分钟跳绳',
      gender: 'all',
      category: 'speed',
      testItemBuiltinKey: 'rope-skip-1min',
      testItemId: 'test-item-builtin-rope-skip-1min',
      scoreRule: pending()
    }),
    countExamItem({
      id: 'sit-up-1min',
      itemKey: 'sit-up-1min',
      name: '一分钟仰卧起坐',
      gender: 'all',
      category: 'strength',
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: pending()
    }),
    examItem({
      id: 'national-fitness',
      itemKey: 'national-fitness',
      name: '初三《国家学生体质健康标准》测试',
      gender: 'all',
      requirement: 'required',
      category: 'other',
      valueType: 'number',
      timeInputMode: 'seconds',
      unit: 'score',
      direction: 'higherBetter',
      decimalPlaces: 0,
      maxScore: 5,
      testItemBuiltinKey: null,
      testItemId: null,
      scoreRule: pendingOfficialTableRule('官方公开为及格即得满分5分，其余评分细则未在公开网页完整给出。', 5)
    })
  ],
  groups: [
    {
      id: 'group-required',
      title: '必考（耐力跑或100米游泳；完整评分档未公开）',
      selection: { mode: 'pickN', n: 1 },
      combine: 'single',
      itemIds: ['male-1000m', 'female-800m', 'male-100m-swim', 'female-100m-swim']
    },
    {
      id: 'group-elective',
      title: '选考（立定跳远、实心球、一分钟跳绳、一分钟仰卧起坐，四选一）',
      selection: { mode: 'pickN', n: 1 },
      combine: 'single',
      itemIds: ['standing-long-jump', 'medicine-ball', 'rope-skip-1min', 'sit-up-1min']
    },
    {
      id: 'group-national',
      title: '初三《国家学生体质健康标准》测试',
      selection: { mode: 'all', n: 0 },
      combine: 'single',
      itemIds: ['national-fitness']
    }
  ],
  components: [
    {
      id: 'national-fitness',
      kind: 'process',
      title: '初三《国家学生体质健康标准》测试',
      maxScore: 5,
      weight: 0.05,
      groupIds: ['group-national']
    },
    {
      id: 'exam-items',
      kind: 'onsite',
      title: '体育考试项目（必考与选考平均，95分）',
      maxScore: 95,
      weight: 0.95,
      groupIds: ['group-required', 'group-elective']
    }
  ],
  createdAt: STAMP,
  updatedAt: STAMP
}
