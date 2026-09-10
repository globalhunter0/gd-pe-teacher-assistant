import { GD_CITIES } from '../regions'
import type { ExamStandard } from '../types'
import { skillExamItem } from './itemBuilders'

const STAMP = '2026-09-10T10:40:00.000Z'
const YUNFU = GD_CITIES.find((item) => item.citySlug === 'yunfu')!
const SOURCE_URL = 'https://www.yunfu.gov.cn/jyj/tzgg/content/post_1986880.html'
const REGISTRATION_URL = 'https://www.yunfu.gov.cn/jyj/tzgg/content/post_1991401.html'
const YUNCHENG_PROCUREMENT = 'http://www.yfyunchengqu.gov.cn/ycqrmzf/jcxxgk/tzgg/content/post_2002403.html'
const TABLE_PENDING =
  '市教育局2026年招生录取实施办法确认体育科考试总分值100分、以70%计入中考总分，并写明体育考试办法按《关于印发云浮市2026年初中毕业生升学体育考试办法的通知》执行。该体育考试办法正文、附件及评分档未在市教育局/市政府门户核验到原文。禁止套用云城区采购设备清单、creditsailing等第三方2024/2025项目表、广州/江门/佛山/珠海/汕头/韶关/肇庆评分表或《国家学生体质健康标准》。'

export const YUNFU_MIDDLE_2026: ExamStandard = {
  id: 'cn-gd-yunfu-middle-2026',
  examType: 'middle_school_exam',
  regionCode: 'CN-GD',
  cityCode: YUNFU.cityCode,
  citySlug: YUNFU.citySlug,
  cityName: YUNFU.cityName,
  yearFrom: 2026,
  yearTo: 2026,
  policyLabel: '2026',
  policyPeriod: '2026',
  title: '云浮市 2026 中考体育',
  sourceAuthority: '云浮市教育局',
  sourceTitle: '关于印发《云浮市2026年高中阶段学校招生录取工作实施办法》的通知',
  sourceUrl: SOURCE_URL,
  policySourceTitle: '关于做好2026年初中学业水平考试和高中阶段学校招生考试报名工作的通知；《关于印发云浮市2026年初中毕业生升学体育考试办法的通知》（正文未取得）',
  policySourceUrl: REGISTRATION_URL,
  publishedAt: '2026-02-05',
  effectiveFrom: '2026-01-01',
  effectiveTo: '2026-12-31',
  status: 'partial',
  ruleStatus: 'partial',
  scoreTableStatus: 'missing',
  schemeLabel: '2026招生实施办法（考试100分按70%计入，体育考试办法原文未取得）',
  scoreYear: 2026,
  applicableGroups: ['regular'],
  enrollmentCohort: null,
  calculationNotes:
    '已核验：云浮市教育局2026年2月5日印发的招生录取实施办法记载中考总分870分、汇总保留1位小数；体育科考试总分值为100分，以70%计入中考总分（即计入70分）。已核验2026年报名通知：初三收费科目含体育与健康（体能）、体育与健康（技能）。未核验：《关于印发云浮市2026年初中毕业生升学体育考试办法的通知》全文及附件中的必考/选考项目、体能与技能分值拆分、单项满分、免考/缓考/择考计分、插值、超满分及完整评分档。本版本不自动换算。',
  notes:
    `已核验市教育局${SOURCE_URL}（发布2026-02-06，成文2026-02-05）及报名通知${REGISTRATION_URL}。依据云教〔2021〕22号制定2026招生实施办法。已检索但未取得yunfu.gov.cn原文：《关于印发云浮市2026年初中毕业生升学体育考试办法的通知》《关于云浮市初中毕业生升学体育考试全面启用电子设备的通知》。已检查县区转发仅用于追踪市级文件：${YUNCHENG_PROCUREMENT}（云城区采购邀请函及附件1报价需求书.doc、附件2设备清单.doc、附件3报价表.doc，附件地址127870/127869/127868），不得把县区采购清单当作全市项目或评分表。已检查报名通知附件1-7.wps为报名表格，不含体育评分档。报名材料中的《国家学生体质健康标准》登记卡仅用于外地就读回户籍报名，不得当作评分表。不得把creditsailing“2025云浮中考体育评分标准”或广州三类结构写入thresholdTable。完整评分表待官方附件核验。该城市/版本评分表尚未完整核验，暂不支持完整自动换算。`,
  totalMaxScore: 70,
  scoring: { rounding: 'round0' },
  items: [
    skillExamItem({
      id: 'onsite-skill',
      itemKey: 'yunfu-onsite-skill',
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
      title: '体育与健康（计入中考）',
      maxScore: 70,
      weight: 1,
      groupIds: ['group-onsite']
    }
  ],
  createdAt: STAMP,
  updatedAt: STAMP
}
