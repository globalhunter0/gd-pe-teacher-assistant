import { GD_CITIES } from '../regions'
import type { ExamStandard } from '../types'
import { skillExamItem } from './itemBuilders'

const STAMP = '2026-09-10T08:10:00.000Z'
const YANGJIANG = GD_CITIES.find((item) => item.citySlug === 'yangjiang')!
const TABLE_PENDING =
  '2026年中招通知确认体育与健康计入录取80分，并写明体育考试依据阳教招〔2026〕4号《阳江市2026年初中学业水平考试体育与健康考试实施办法》执行，收费按必考项目和选考项目两个科目收取。4号实施办法正文、附件及项目评分档未在市教育局或市政府信息公开栏目核验到原文。禁止套用第三方2024项目表、2016百分制算法、广州三类表或阳教基〔2025〕60号（自2025年秋季七年级起）的70分方案。'

export const YANGJIANG_MIDDLE_2026: ExamStandard = {
  id: 'cn-gd-yangjiang-middle-2026',
  examType: 'middle_school_exam',
  regionCode: 'CN-GD',
  cityCode: YANGJIANG.cityCode,
  citySlug: YANGJIANG.citySlug,
  cityName: YANGJIANG.cityName,
  yearFrom: 2026,
  yearTo: 2026,
  policyLabel: '2026',
  policyPeriod: '2026',
  title: '阳江市 2026 中考体育',
  sourceAuthority: '阳江市教育局',
  sourceTitle: '阳江市教育局关于做好2026年初中学业水平考试及高中阶段学校招生工作的通知',
  sourceUrl: 'http://www.yjgx.gov.cn/yjgxgxqncswj/gkmlpt/content/0/925/post_925436.html',
  policySourceTitle: '阳教招〔2020〕9号《阳江市教育局关于我市推进高中阶段学校考试招生制度改革的实施意见》；阳教招〔2026〕4号实施办法（正文未取得）',
  policySourceUrl: 'http://www.yangjiang.gov.cn/yj/zwgk/zfwj/bmwj/content/post_480787.html',
  publishedAt: '2026-02-26',
  effectiveFrom: '2026-01-01',
  effectiveTo: '2026-12-31',
  status: 'partial',
  ruleStatus: 'partial',
  scoreTableStatus: 'missing',
  schemeLabel: '2026中招通知（80分）+4号实施办法待原文',
  scoreYear: 2026,
  applicableGroups: ['regular'],
  enrollmentCohort: null,
  calculationNotes:
    '已核验：2026年中招通知按阳教招〔2020〕9号，体育与健康80分计入中考总分1000分；体育考试时间原则上4月8日—4月30日，依据阳教招〔2026〕4号执行；考试费按必考项目和选考项目两个科目收取。未核验：4号实施办法中的具体必考/选考项目、统一考试与国标分值拆分、单项满分、折算公式、插值、超满分及评分档。本版本不自动换算。',
  notes:
    '已核验：县区政府信息公开转载的市教育局2026年中招通知，以及市政府门户新闻稿确认体育80分；阳教招〔2020〕9号规定体育与健康80分。已检索但未取得：阳教招〔2026〕4号实施办法HTML/PDF/附件、2025年阳教招〔2024〕33号及补充通知原文。不得把第三方转载的2024“五选二/100分×8%”或阳教基〔2025〕60号（适用2025年秋季入学七年级，体育70分）套给2026应届。完整评分表待官方附件核验。该城市/版本评分表尚未完整核验，暂不支持完整自动换算。',
  totalMaxScore: 80,
  scoring: { rounding: 'round0' },
  items: [
    skillExamItem({
      id: 'onsite-skill',
      itemKey: 'yangjiang-onsite-skill',
      name: '体育与健康考试',
      gender: 'all',
      category: 'other',
      valueType: 'number',
      timeInputMode: 'seconds',
      unit: 'score',
      direction: 'higherBetter',
      decimalPlaces: 0,
      maxScore: 80,
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
      maxScore: 80,
      weight: 1,
      groupIds: ['group-onsite']
    }
  ],
  createdAt: STAMP,
  updatedAt: STAMP
}
