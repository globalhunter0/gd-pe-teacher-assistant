import { GD_CITIES } from '../regions'
import type { ExamStandard } from '../types'
import { skillExamItem } from './itemBuilders'

const STAMP = '2026-09-09T23:45:00.000Z'
const HUIZHOU = GD_CITIES.find((item) => item.citySlug === 'huizhou')!
const TABLE_PENDING =
  '惠州市教育考试中心《惠州市2024年初中学业水平考试体育考试实施方案》及南方日报对2025年方案的报道均指向体育满分64分，并写明单项得分见当年《体育考试项目评分标准》附件。2026年度实施方案原文、项目规则附件、评分标准附件未在市教育局/教育考试中心门户核验到可下载原文。禁止把2024附件评分表、南方日报中的个别满分档、广州三类表或培训机构表当作2026完整评分表。'

export const HUIZHOU_MIDDLE_2026: ExamStandard = {
  id: 'cn-gd-huizhou-middle-2026',
  examType: 'middle_school_exam',
  regionCode: 'CN-GD',
  cityCode: HUIZHOU.cityCode,
  citySlug: HUIZHOU.citySlug,
  cityName: HUIZHOU.cityName,
  yearFrom: 2026,
  yearTo: 2026,
  policyLabel: '2026',
  policyPeriod: '2026',
  title: '惠州市 2026 中考体育',
  sourceAuthority: '惠州市教育考试中心',
  sourceTitle: '惠州市2024年初中学业水平考试体育考试实施方案',
  sourceUrl: 'https://www.hzkszx.com/show.asp?id=8355',
  policySourceTitle:
    '南方日报《免考分值提高 评分标准有变》（2025-01-14）报道《惠州市2025年初中学业水平考试体育考试实施方案》公布；2026年度方案原文及评分表附件未取得',
  policySourceUrl: 'https://epaper.nfnews.com/nfdaily/html/202501/14/content_10124196.html',
  publishedAt: '2025-01-14',
  effectiveFrom: '2026-01-01',
  effectiveTo: '2026-12-31',
  status: 'partial',
  ruleStatus: 'partial',
  scoreTableStatus: 'missing',
  schemeLabel: '最近官方体育考试方案（2026原文未取得）',
  scoreYear: 2026,
  applicableGroups: ['regular'],
  enrollmentCohort: null,
  calculationNotes:
    '最近官方方案记载：体育计入中考64分，其中平时考核6分、统一考试58分；统一考试成绩=[必考项目得分+选考项目得分]÷2×58%。2026年度实施方案是否继续执行上述组成、必考/选考名单及附件评分表均未取得原文，本版本不自动换算。',
  notes:
    '已核验：惠州市教育考试中心发布过2024年体育考试实施方案（满分64分=平时6+统一考试58，单项得分查当年评分标准附件）。南方日报报道2025年实施方案已公布，并记录部分满分档调整，但报道正文自相矛盾（“七选三”与“七选一”并存），且未提供完整评分表。未核验：2026年度实施方案原文、惠市教〔2025〕132号报名通知门户原文、2026附件4项目规则、附件5完整评分表。不得把2024/2025结构直接写成2026已核验项目清单。完整评分表待官方附件核验。该城市/版本评分表尚未完整核验，暂不支持完整自动换算。',
  totalMaxScore: 64,
  scoring: { rounding: 'round1' },
  items: [
    skillExamItem({
      id: 'onsite-skill',
      itemKey: 'huizhou-onsite-skill',
      name: '体育与健康考试',
      gender: 'all',
      category: 'other',
      valueType: 'number',
      timeInputMode: 'seconds',
      unit: 'score',
      direction: 'higherBetter',
      decimalPlaces: 1,
      maxScore: 64,
      testItemBuiltinKey: null,
      testItemId: null,
      reason: TABLE_PENDING
    })
  ],
  groups: [
    {
      id: 'group-onsite',
      title: '体育与健康考试（2026年度项目及评分表另行核验）',
      selection: { mode: 'all', n: 0 },
      combine: 'single',
      itemIds: ['onsite-skill']
    }
  ],
  components: [
    {
      id: 'onsite',
      kind: 'onsite',
      title: '体育与健康',
      maxScore: 64,
      weight: 1,
      groupIds: ['group-onsite']
    }
  ],
  createdAt: STAMP,
  updatedAt: STAMP
}
