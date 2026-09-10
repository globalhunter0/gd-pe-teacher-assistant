import { GD_CITIES } from '../regions'
import type { ExamStandard } from '../types'
import { skillExamItem } from './itemBuilders'

const STAMP = '2026-09-10T10:10:00.000Z'
const CHAOZHOU = GD_CITIES.find((item) => item.citySlug === 'chaozhou')!
const SOURCE_URL = 'https://www.chaozhou.gov.cn/ywdt/czyw/content/post_3943935.html'
const ADMISSIONS_2025 = 'https://www.chaozhou.gov.cn/zwgk/szfgz/sjyj/bmwj/content/post_3950034.html'
const TABLE_PENDING =
  '市政府门户新闻确认2026年起中考体育《标准》上报分仍为4分且评价项目将调整；2025年招生录取通知确认体育学科70分、中考总分830分，体育办法按潮招字〔2025〕2号执行。潮招字〔2026〕2号正文、评分附件及《潮州市中考体育考试项目规则及评分标准》原表未在市政府/市教育局信息公开栏目核验到原文。禁止套用2025新闻中的考试项目清单、2023学校评定方案、2006年省评分附件、第三方转载细则或广州/肇庆/韶关/汕头表。'

export const CHAOZHOU_MIDDLE_2026: ExamStandard = {
  id: 'cn-gd-chaozhou-middle-2026',
  examType: 'middle_school_exam',
  regionCode: 'CN-GD',
  cityCode: CHAOZHOU.cityCode,
  citySlug: CHAOZHOU.citySlug,
  cityName: CHAOZHOU.cityName,
  yearFrom: 2026,
  yearTo: 2026,
  policyLabel: '2026',
  policyPeriod: '2026',
  title: '潮州市 2026 中考体育',
  sourceAuthority: '潮州市教育局',
  sourceTitle: '潮州中考体育考试昨起开考（市政府门户，记载2026年起《标准》上报分共4分）',
  sourceUrl: SOURCE_URL,
  policySourceTitle: '关于做好2025年我市高中阶段学校招生录取工作的通知（体育70分/830分，办法按潮招字〔2025〕2号）；潮招字〔2026〕2号待原文',
  policySourceUrl: ADMISSIONS_2025,
  publishedAt: '2025-04-22',
  effectiveFrom: '2026-01-01',
  effectiveTo: '2026-12-31',
  status: 'partial',
  ruleStatus: 'partial',
  scoreTableStatus: 'missing',
  schemeLabel: '2026（70分结构待潮招字〔2026〕2号原文，评分附件未取得）',
  scoreYear: 2026,
  applicableGroups: ['regular'],
  enrollmentCohort: null,
  calculationNotes:
    '已核验：市政府门户2025年4月22日报道确认当年体育满分70分由《国家学生体质健康标准》学校数据上报分数和中考体育考试分数组成，并写明2026年起逐步将男生一分钟引体向上、女生一分钟仰卧起坐、男女生坐位体前屈作为《标准》上报分（共4分）的评价项目。已核验2025年招生录取通知：体育学科70分、10科总分830分。未核验：潮招字〔2026〕2号全文、2026现场必考/选考项目、单项满分与折算、免考/择考/缓考计分、插值及完整评分档。不得把2025年考试项目或2023“学校评定选考”方案直接写成2026已核验项目。本版本不自动换算。',
  notes:
    '已核验市政府门户https://www.chaozhou.gov.cn/ywdt/czyw/content/post_3943935.html及部门文件https://www.chaozhou.gov.cn/zwgk/szfgz/sjyj/bmwj/content/post_3950034.html。已检索：中考改革实施办法问答记载体育与健康70分=标准测试4分+项目考试66分，有效期至2025年12月31日，不得单独当作2026评分表。已检索但未取得.gov.cn原文：潮招字〔2026〕2号、潮教字〔2026〕13号招生意见、潮招字〔2025〕2号附件评分表。已检查但不得沿用：https://www.chaozhou.gov.cn/Publish/jsj/200603/20060331170707755.doc（2006年省评分标准附件）。不得把无忧考网等第三方“70=4+66、必考耐力跑+立定跳远”摘要写入thresholdTable。完整评分表待官方附件核验。该城市/版本评分表尚未完整核验，暂不支持完整自动换算。',
  totalMaxScore: 70,
  scoring: { rounding: 'round0' },
  items: [
    skillExamItem({
      id: 'onsite-skill',
      itemKey: 'chaozhou-onsite-skill',
      name: '体育与健康考试',
      gender: 'all',
      category: 'other',
      valueType: 'number',
      timeInputMode: 'seconds',
      unit: 'score',
      direction: 'higherBetter',
      decimalPlaces: 0,
      maxScore: 70,
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
      maxScore: 70,
      weight: 1,
      groupIds: ['group-onsite']
    }
  ],
  createdAt: STAMP,
  updatedAt: STAMP
}
