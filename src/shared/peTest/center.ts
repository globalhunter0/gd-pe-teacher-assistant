export const PE_TEST_CENTER_MODULE_KEY = 'tests' as const
export const PE_TEST_CENTER_MODULE_LABEL = '体育测试'
export const PE_TEST_CENTER_DEFAULT_TAB = 'records' as const

export const PE_TEST_CENTER_TABS = [
  {
    id: 'records',
    label: '测试记录',
    description: '已经发生的体育测试'
  },
  {
    id: 'import',
    label: '导入成绩',
    description: '把已有 Excel 成绩导入正式体育测试'
  },
  {
    id: 'standards',
    label: '评分标准',
    description: '查看城市/年份/项目的官方评分规则'
  },
  {
    id: 'tools',
    label: '评分工具',
    description: '单独做 Excel 评分、模板、导出，可不入库'
  }
] as const

export type PeTestCenterTab = (typeof PE_TEST_CENTER_TABS)[number]['id']

export const LEGACY_STANDARDS_NAV_KEYS = [
  'exams',
  '/exams',
  'scoring-standard',
  'exam-standard',
  'scoring-standards',
  '/scoring-standard',
  '/exam-standard'
] as const

export const LEGACY_TOOLS_NAV_KEYS = [
  'scoring',
  'exam-batch',
  'scoring-tool',
  'scoring-tools',
  '/scoring',
  '/exam-batch'
] as const

export function isPeTestCenterTab(value: string): value is PeTestCenterTab {
  return PE_TEST_CENTER_TABS.some((tab) => tab.id === value)
}

export function peTestCenterTabMeta(tab: PeTestCenterTab): (typeof PE_TEST_CENTER_TABS)[number] {
  return PE_TEST_CENTER_TABS.find((item) => item.id === tab) ?? PE_TEST_CENTER_TABS[0]
}

export function resolvePeTestCenterNavigation(input: string): { navKey: typeof PE_TEST_CENTER_MODULE_KEY; tab: PeTestCenterTab } | null {
  const key = input.trim()
  if (LEGACY_STANDARDS_NAV_KEYS.includes(key as (typeof LEGACY_STANDARDS_NAV_KEYS)[number])) {
    return { navKey: PE_TEST_CENTER_MODULE_KEY, tab: 'standards' }
  }
  if (LEGACY_TOOLS_NAV_KEYS.includes(key as (typeof LEGACY_TOOLS_NAV_KEYS)[number])) {
    return { navKey: PE_TEST_CENTER_MODULE_KEY, tab: 'tools' }
  }
  return null
}
