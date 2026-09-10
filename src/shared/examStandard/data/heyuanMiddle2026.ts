import { GD_CITIES } from '../regions'
import type { ExamStandard } from '../types'
import { skillExamItem } from './itemBuilders'

const STAMP = '2026-09-10T11:00:00.000Z'
const HEYUAN = GD_CITIES.find((item) => item.citySlug === 'heyuan')!
const SOURCE_URL = 'http://www.heyuan.gov.cn/hysjyj/gkmlpt/content/0/687/post_687849.html'
const SOURCE_MIRROR = 'http://www.heyuan.gov.cn/zwgk/zdlyxx/gxxx/zcfg/content/post_687898.html'
const ADMISSIONS_2026 = 'http://www.heyuan.gov.cn/hysjyj/gkmlpt/content/0/707/post_707638.html'
const INTERPRET = 'http://www.heyuan.gov.cn/hysjyj/gkmlpt/content/0/687/post_687867.html'
const HEPING_2023 = 'http://www.heping.gov.cn/zwgk/zdlyxxgk/jyxxgk/content/post_604861.html'
const TABLE_PENDING =
  '河教〔2026〕16号规定体育与健康主要采取现场技能测试、计入录取总分70分，考试内容与时长由市教育局另行确定。2026年体育考试方案及评分表未在市政府或市教育局门户核验到原文。禁止套用2024新闻稿1+1项目、和平县2023转发的市级评分附件、《国家学生体质健康标准》或其他城市对照表。'

export const HEYUAN_MIDDLE_2026: ExamStandard = {
  id: 'cn-gd-heyuan-middle-2026',
  examType: 'middle_school_exam',
  regionCode: 'CN-GD',
  cityCode: HEYUAN.cityCode,
  citySlug: HEYUAN.citySlug,
  cityName: HEYUAN.cityName,
  yearFrom: 2026,
  yearTo: 2026,
  policyLabel: '2026',
  policyPeriod: '2026',
  title: '河源市 2026 中考体育',
  sourceAuthority: '河源市教育局',
  sourceTitle: '河源市教育局关于印发《河源市深化高中阶段学校考试招生制度改革实施方案》的通知',
  sourceUrl: SOURCE_URL,
  policySourceTitle: '河教〔2026〕16号；《2026年高中阶段学校招生录取工作方案》',
  policySourceUrl: ADMISSIONS_2026,
  publishedAt: '2026-01-22',
  effectiveFrom: '2026-01-22',
  effectiveTo: '2026-12-31',
  status: 'partial',
  ruleStatus: 'partial',
  scoreTableStatus: 'missing',
  schemeLabel: '河教〔2026〕16号（体育70分，年度项目及评分表未取得）',
  scoreYear: 2026,
  applicableGroups: ['regular'],
  enrollmentCohort: null,
  calculationNotes:
    '已核验河教〔2026〕16号：考试总分850分，文化科780分、体育科70分；体育与健康主要采取现场技能测试，安排在九年级下学期，考试内容与时长由市教育局确定。2026年招生录取工作方案按16号执行中考总分850分，回户籍地考生须参加体育考试。未核验：2026年度必考/选考项目、国标分值、单项评分档、插值及免考缓考计分。本版本不自动换算。',
  notes:
    `已核验市教育局信息公开${SOURCE_URL}及市政府门户转载${SOURCE_MIRROR}（发布2026-01-22），落款河源市教育局。2026年招生录取工作方案${ADMISSIONS_2026}引用河教〔2026〕16号并使用中考总分850分。政策解读${INTERPRET}复核体育科70分。16号写明体育考试内容由市教育局确定、时长另行研究确定，本页无评分附件。已检索但未取得：2026年度《初中毕业生升学体育考试方案》HTML/PDF及评分表。已检查但不得把成绩档写入本版：2024年第三方转载的《河源市2024年初中毕业生升学体育考试方案》新闻（1+1项目及国标5%+考试95%）；${HEPING_2023}（和平县转发河教体〔2023〕8号及附件评分标准，仅2023年度）。不得套用广州/江门/佛山/珠海/汕头/韶关/肇庆表或《国家学生体质健康标准》。完整评分表待官方附件核验。该城市/版本评分表尚未完整核验，暂不支持完整自动换算。`,
  totalMaxScore: 70,
  scoring: { rounding: 'round0' },
  items: [
    skillExamItem({
      id: 'onsite-skill',
      itemKey: 'heyuan-onsite-skill',
      name: '体育与健康现场技能测试',
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
      title: '体育与健康现场技能测试（2026年度项目及评分表另行核验）',
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
