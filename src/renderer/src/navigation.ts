export type NavKey =
  | 'dashboard'
  | 'schedule'
  | 'classes'
  | 'students'
  | 'lessons'
  | 'plans'
  | 'tests'
  | 'stats'
  | 'resources'
  | 'ai'
  | 'settings'

export interface NavItem {
  key: NavKey
  label: string
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: '工作台' },
  { key: 'schedule', label: '我的课表' },
  { key: 'classes', label: '班级管理' },
  { key: 'students', label: '学生管理' },
  { key: 'lessons', label: '体育课记录' },
  { key: 'plans', label: '教学计划' },
  { key: 'tests', label: '体育测试' },
  { key: 'stats', label: '数据统计' },
  { key: 'resources', label: '资料中心' },
  { key: 'ai', label: 'AI 助手' },
  { key: 'settings', label: '设置' }
]

export const PAGE_TITLES: Record<NavKey, string> = {
  dashboard: '工作台',
  schedule: '我的课表',
  classes: '班级管理',
  students: '学生管理',
  lessons: '体育课记录',
  plans: '教学计划',
  tests: '体育测试',
  stats: '数据统计',
  resources: '资料中心',
  ai: 'AI 助手',
  settings: '设置'
}

export const PAGE_DESCRIPTIONS: Record<NavKey, string> = {
  dashboard: '查看当日教学概览与待办事项。',
  schedule: '查看本学期周课表。当前为 2026 学年第一学期固定课表。',
  classes: '管理任教班级，为学生、课程、体测和教学记录建立统一基础数据。',
  students: '管理学生基础档案，按班级筛选与搜索。学生从属于已有班级。',
  lessons: '记录每节体育课的考勤与课堂表现。默认全员正常，只登记异常。',
  plans: '按年级编写学期教学计划与每周教学内容。计划不绑定单个班级，也不表示实际上课完成情况。',
  tests: '登记日常体育测试成绩，保存全班快照，并查看学生同项目历史。',
  stats: '查看班级课堂人次、学生档案和测试统计。数字根据现有记录实时计算。',
  resources: '存放教案、表格与教学资料。后续版本将支持本地资料管理。',
  ai: '后续版本将接入本地可用的 AI 助手能力。当前仅作为功能入口预留。',
  settings: '配置学校信息、备份路径与软件偏好。后续版本将逐步开放。'
}
