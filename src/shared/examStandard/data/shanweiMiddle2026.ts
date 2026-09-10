import { GD_CITIES } from '../regions'
import type { ExamStandard } from '../types'
import { skillExamItem } from './itemBuilders'

const STAMP = '2026-09-10T08:00:00.000Z'
const SHANWEI = GD_CITIES.find((item) => item.citySlug === 'shanwei')!
const TABLE_PENDING =
  '市教育局2025年报名通知写明体育与健康为九年级考试科目，并列出长跑必考、三项选考其一；未公布计入录取分值与项目评分表。2026年报名通知未在市教育局考试信息栏目核验到原文，评分标准附件未取得。禁止把2025项目清单、第三方“体育80分”或广州三类表当作2026完整评分表。'

export const SHANWEI_MIDDLE_2026: ExamStandard = {
  id: 'cn-gd-shanwei-middle-2026',
  examType: 'middle_school_exam',
  regionCode: 'CN-GD',
  cityCode: SHANWEI.cityCode,
  citySlug: SHANWEI.citySlug,
  cityName: SHANWEI.cityName,
  yearFrom: 2026,
  yearTo: 2026,
  policyLabel: '2026',
  policyPeriod: '2026',
  title: '汕尾市 2026 中考体育',
  sourceAuthority: '汕尾市教育局',
  sourceTitle: '关于做好我市2025年初中学业水平考试报名工作的通知',
  sourceUrl: 'https://www.shanwei.gov.cn/swjyj/ywyw/zsks/ksxx/content/post_1123564.html',
  policySourceTitle:
    '汕教函〔2026〕76号《汕尾市2026年普通高中招生录取工作实施方案》；城区政府网站转载市教育局2026年中考成绩公布通知（明确存在体育中考成绩、不接受体育成绩复查）',
  policySourceUrl: 'https://www.shanwei.gov.cn/attachment/0/85/85398/1249931.pdf',
  publishedAt: '2025-02-14',
  effectiveFrom: '2026-01-01',
  effectiveTo: '2026-12-31',
  status: 'partial',
  ruleStatus: 'partial',
  scoreTableStatus: 'missing',
  schemeLabel: '2025报名通知项目结构（2026原文未取得）',
  scoreYear: 2026,
  applicableGroups: ['regular'],
  enrollmentCohort: null,
  calculationNotes:
    '已核验体育与健康为中考科目。2025年官方报名通知：必考长跑（男1000米、女800米），选考投掷实心球、一分钟跳绳、立定跳远三选一，报名后不得更改。2026年是否继续该结构、计入录取分值、统一考试与过程性评价分值、评分档均未取得当年官方原文或附件，本版本不自动换算。',
  notes:
    '已核验：汕尾市教育局门户发布2025年中考报名通知，体育与健康为九年级考试科目并规定上述必考/选考结构；汕教函〔2026〕76号确认2026年普通高中录取以当年中考为基础。未核验：2026年报名通知门户原文、汕教〔2022〕17号改革方案PDF原文中的计入分值、评分标准附件、插值/档位规则。不得把2023“四选二”或培训机构广州式三类表套进2026。完整评分表待官方附件核验。该城市/版本评分表尚未完整核验，暂不支持完整自动换算。',
  totalMaxScore: 100,
  scoring: { rounding: 'round0' },
  items: [
    skillExamItem({
      id: 'onsite-skill',
      itemKey: 'shanwei-onsite-skill',
      name: '体育与健康考试',
      gender: 'all',
      category: 'other',
      valueType: 'number',
      timeInputMode: 'seconds',
      unit: 'score',
      direction: 'higherBetter',
      decimalPlaces: 0,
      maxScore: 100,
      testItemBuiltinKey: null,
      testItemId: null,
      reason: TABLE_PENDING
    })
  ],
  groups: [
    {
      id: 'group-onsite',
      title: '体育与健康考试（2026年度评分表另行核验）',
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
      maxScore: 100,
      weight: 1,
      groupIds: ['group-onsite']
    }
  ],
  createdAt: STAMP,
  updatedAt: STAMP
}
