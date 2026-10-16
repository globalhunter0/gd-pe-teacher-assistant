export type CompanionNavKey = 'home' | 'schedule' | 'lessons' | 'students' | 'tests' | 'standards' | 'sync'

export interface CompanionNavItem {
  key: CompanionNavKey
  label: string
}

export const COMPANION_NAV_ITEMS: CompanionNavItem[] = [
  { key: 'home', label: '首页' },
  { key: 'schedule', label: '课表' },
  { key: 'lessons', label: '考勤' },
  { key: 'students', label: '学生' },
  { key: 'tests', label: '测试' },
  { key: 'standards', label: '标准' },
  { key: 'sync', label: '同步' }
]

export const COMPANION_PAGE_TITLES: Record<CompanionNavKey, string> = {
  home: '免费网页版',
  schedule: '课表工作台',
  lessons: '课堂考勤',
  students: '班级与学生',
  tests: '体育测试',
  standards: '评分标准',
  sync: '数据同步'
}

export const COMPANION_PAGE_DESCRIPTIONS: Record<CompanionNavKey, string> = {
  home: '场边看课表、记考勤、查标准、录成绩。Excel 批量导入和备份请用 Windows 桌面版。',
  schedule: '查看今日课表，点格子开始或打开课堂考勤。Excel 导入课表请在桌面版完成。',
  lessons: '按节次记录出勤、请假和课堂情况。数据保存在本机浏览器。',
  students: '查看与维护班级、学生名单。Excel 批量导入请在桌面版完成后再同步到手机。',
  tests: '查看测试记录、快速录入成绩。数据保存在本机浏览器。',
  standards: '查阅城市 / 年份 / 项目的内置官方评分规则，可离线使用。',
  sync: '从 Windows 导出的手机同步包导入，或把本机网页数据导出回电脑。课表和课堂记录会一并带走。'
}
