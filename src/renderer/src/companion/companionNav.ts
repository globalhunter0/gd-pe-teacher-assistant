export type CompanionNavKey = 'home' | 'students' | 'tests' | 'standards' | 'sync'

export interface CompanionNavItem {
  key: CompanionNavKey
  label: string
}

export const COMPANION_NAV_ITEMS: CompanionNavItem[] = [
  { key: 'home', label: '首页' },
  { key: 'students', label: '班级学生' },
  { key: 'tests', label: '体育测试' },
  { key: 'standards', label: '评分标准' },
  { key: 'sync', label: '数据同步' }
]

export const COMPANION_PAGE_TITLES: Record<CompanionNavKey, string> = {
  home: '免费网页版',
  students: '班级与学生',
  tests: '体育测试',
  standards: '评分标准',
  sync: '数据同步'
}

export const COMPANION_PAGE_DESCRIPTIONS: Record<CompanionNavKey, string> = {
  home: '场边查标准、看成绩、快速录入。完整 Excel / 备份请用 Windows 桌面版。',
  students: '查看与维护班级、学生名单。Excel 批量导入请在桌面版完成后再同步到手机。',
  tests: '查看测试记录、快速录入成绩。数据保存在本机浏览器。',
  standards: '查阅城市 / 年份 / 项目的内置官方评分规则，可离线使用。',
  sync: '从 Windows 导出的手机同步包导入，或把本机网页数据导出回电脑。'
}
