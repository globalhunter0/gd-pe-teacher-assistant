import { GD_CITIES } from '../regions'
import type { ExamStandard } from '../types'
import { skillExamItem } from './itemBuilders'

const STAMP = '2026-09-10T10:50:00.000Z'
const MEIZHOU = GD_CITIES.find((item) => item.citySlug === 'meizhou')!
const SOURCE_URL = 'https://www.wuhua.gov.cn/xxgk/zfjg/xjyj/tzgg/content/post_2876936.html'
const CITY_OPENING = 'https://y.meizhou.cn/meizhou/p/236455.html'
const REFORM_2026 = 'https://y.meizhou.cn/meizhou/p/235671.html'
const SCHEME_2024 = 'https://y.meizhou.cn/p/175183.html'
const WUHUA_PE_PROCUREMENT = 'https://www.wuhua.gov.cn/xxgk/zfjg/xjyj/tzgg/content/post_2884670.html'
const TABLE_PENDING =
  '五华县政府网站转发的市教育局《关于做好我市2026年初中学业水平考试报名工作的通知》（2026年3月2日）仅核验体育计入中考90分、总分850分。2026年度《初中毕业生升学体育考试工作方案》及项目评分表未在市政府/市教育局门户核验到原文。禁止套用2024工作方案项目与评分档、2022–2025“拟采用”改革口径、2026年6月改革意见中适用于2026秋季七年级的70+20结构、县区采购邀请函、第三方拼贴稿或《国家学生体质健康标准》。'

export const MEIZHOU_MIDDLE_2026: ExamStandard = {
  id: 'cn-gd-meizhou-middle-2026',
  examType: 'middle_school_exam',
  regionCode: 'CN-GD',
  cityCode: MEIZHOU.cityCode,
  citySlug: MEIZHOU.citySlug,
  cityName: MEIZHOU.cityName,
  yearFrom: 2026,
  yearTo: 2026,
  policyLabel: '2026',
  policyPeriod: '2026',
  title: '梅州市 2026 中考体育',
  sourceAuthority: '梅州市教育局',
  sourceTitle: '关于做好我市2026年初中学业水平考试报名工作的通知',
  sourceUrl: SOURCE_URL,
  policySourceTitle:
    '梅市教〔2021〕49号；《关于深化高中阶段学校考试招生制度改革的实施意见》（自2026年9月1日起施行，首批适用2026秋季七年级，不得套给2026应届）',
  policySourceUrl: REFORM_2026,
  publishedAt: '2026-03-02',
  effectiveFrom: '2026-01-01',
  effectiveTo: '2026-12-31',
  status: 'partial',
  ruleStatus: 'partial',
  scoreTableStatus: 'missing',
  schemeLabel: '2026中考报名通知（体育科目总分90，年度体育考试方案未取得）',
  scoreYear: 2026,
  applicableGroups: ['regular'],
  enrollmentCohort: null,
  calculationNotes:
    '已核验：2026年计入高中录取体育90分、中考总分850分。未核验：2026年度统一考试与素质综合评价分值拆分、必考/抽考/选考项目、单项评分表、插值、超满分及免考/缓考计分。本版本不自动换算。',
  notes:
    `已核验五华县政府网站正式转发的市教育局原文${SOURCE_URL}（成文2026-03-02，抬头“各县（市、区）教育局、市直有关学校”，落款梅州市教育局），确认体育90分、10科850分。附件1–4托管于meizhou.gov.cn（234144/234142/234145/234143，关联post_2875489），分别为报名信息采集表、补报名统计表、转考统计表、外省户籍报考须知，不含体育评分档。已复核掌上梅州开考报道${CITY_OPENING}体育90分。已检查但不得套给2026应届：${REFORM_2026}写明新政自2026年9月1日起施行、首批2029年中考，其中体育与健康90分（现场70+过程性评价20）不得当作2026应届结构；市政府门户2022年体育动态及2023年方案报道中的2025年“拟采用必考+抽考+选考/100分”不得当作2026执行稿。已检查但不得把成绩档写入本版：${SCHEME_2024}（2024年工作方案新闻稿，含《国家学生体质健康标准》计分，不得当作2026评分表）。已检查县区材料仅用于追踪：${WUHUA_PE_PROCUREMENT}为五华县体育考试服务采购邀请函，不得当作全市项目或评分表。已检索但未取得：2026年体育考试工作方案HTML/PDF及评分附件。不得把留学群等把2020年疫情项目通知改写成2026的第三方稿写入thresholdTable。完整评分表待官方附件核验。该城市/版本评分表尚未完整核验，暂不支持完整自动换算。`,
  totalMaxScore: 90,
  scoring: { rounding: 'round0' },
  items: [
    skillExamItem({
      id: 'onsite-skill',
      itemKey: 'meizhou-onsite-skill',
      name: '体育考试',
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
      title: '体育考试（2026年度项目及评分表另行核验）',
      selection: { mode: 'all', n: 0 },
      combine: 'single',
      itemIds: ['onsite-skill']
    }
  ],
  components: [
    {
      id: 'onsite',
      kind: 'onsite',
      title: '体育',
      maxScore: 90,
      weight: 1,
      groupIds: ['group-onsite']
    }
  ],
  createdAt: STAMP,
  updatedAt: STAMP
}
