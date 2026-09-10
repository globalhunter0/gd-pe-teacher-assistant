import { GD_CITIES } from '../regions'
import type { ExamStandard } from '../types'
import { skillExamItem } from './itemBuilders'

const STAMP = '2026-09-10T08:50:00.000Z'
const QINGYUAN = GD_CITIES.find((item) => item.citySlug === 'qingyuan')!
const SOURCE_URL = 'https://www.gdqy.gov.cn/gdqy/newxxgk/fgwj/gfxwj/content/post_1983013.html'
const TABLE_PENDING =
  '清市教〔2025〕12号确认2023年秋季入学七年级（2026年中考）仅参加现场统一考试、体育与健康满分90分，中考总分800分；项目规则、评分标准及免考/择考/缓考由另行制定的实施方案明确。实施意见正文、附件1–6及清市教体函〔2018〕1号评分原表未在市政府/市教育局信息公开栏目核验到原文。禁止套用2023年附件评分DOC、2018第三方摘要、广州/肇庆/韶关/汕头/茂名表或国标。'

export const QINGYUAN_MIDDLE_2026: ExamStandard = {
  id: 'cn-gd-qingyuan-middle-2026',
  examType: 'middle_school_exam',
  regionCode: 'CN-GD',
  cityCode: QINGYUAN.cityCode,
  citySlug: QINGYUAN.citySlug,
  cityName: QINGYUAN.cityName,
  yearFrom: 2026,
  yearTo: 2026,
  policyLabel: '2026',
  policyPeriod: '2026',
  title: '清远市 2026 中考体育',
  sourceAuthority: '清远市教育局',
  sourceTitle: '清远市教育局关于深化高中阶段学校考试招生制度改革的实施意见（清市教〔2025〕12号）',
  sourceUrl: SOURCE_URL,
  policySourceTitle: '清市教〔2025〕12号；政策解读同文；《清远市初中学业水平考试体育与健康考试实施意见》原文及附件待核验',
  policySourceUrl: 'https://www.gdqy.gov.cn/gdqy/newxxgk/zfgb1/2025n/d25201q/bmgfxwj/content/post_2016867.html',
  publishedAt: '2025-02-26',
  effectiveFrom: '2026-01-01',
  effectiveTo: '2026-12-31',
  status: 'partial',
  ruleStatus: 'partial',
  scoreTableStatus: 'missing',
  schemeLabel: '2026（12号确认90分，实施方案及评分附件待原文）',
  scoreYear: 2026,
  applicableGroups: ['regular'],
  enrollmentCohort: null,
  calculationNotes:
    '已核验：清市教〔2025〕12号规定高中录取总分800分，体育与健康90分；过程性评价从2025年秋季七年级起实施，2023、2024年秋季入学七年级仅参加现场统一考试、满分90分。未核验：体育与健康考试实施意见原文URL/文号、附件1项目规则、附件2项目评分标准、附件3体质健康测试评分标准，以及清市教体函〔2018〕1号官方原表是否即为2026对照档。本版本不自动换算。',
  notes:
    '已核验市政府门户清市教〔2025〕12号（https://www.gdqy.gov.cn/gdqy/newxxgk/fgwj/gfxwj/content/post_1983013.html）及政策解读。已检索：媒体转载的2025年8月4日《清远市初中学业水平考试体育与健康考试实施意见》称2026–2027年为体质健康测试40分+统一考试50分，并写评分按清市教体函〔2018〕1号、详见附件1/2/3；该实施意见HTML/PDF/Word附件未在市教育局信息公开栏目打开。已检查但不得沿用：http://www.gdqy.gov.cn/attachment/0/110/110383/1681155.doc（2023年评分标准，当年已单独调整100米游泳）。不得把2025年中招实施办法的65分方案套给2026。完整评分表待官方附件核验。该城市/版本评分表尚未完整核验，暂不支持完整自动换算。',
  totalMaxScore: 90,
  scoring: { rounding: 'round0' },
  items: [
    skillExamItem({
      id: 'onsite-skill',
      itemKey: 'qingyuan-onsite-skill',
      name: '体育与健康考试',
      gender: 'all',
      category: 'other',
      valueType: 'number',
      timeInputMode: 'seconds',
      unit: 'score',
      direction: 'higherBetter',
      decimalPlaces: 0,
      maxScore: 90,
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
      maxScore: 90,
      weight: 1,
      groupIds: ['group-onsite']
    }
  ],
  createdAt: STAMP,
  updatedAt: STAMP
}
