export type NavKey =
  | 'dashboard'
  | 'schedule'
  | 'classes'
  | 'students'
  | 'lessons'
  | 'plans'
  | 'tests'
  | 'training'
  | 'stats'
  | 'resources'
  | 'ai'
  | 'exams'
  | 'settings'

export interface NavItem {
  key: NavKey
  label: string
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: '工作台' },
  { key: 'schedule', label: '我的课表' },
  { key: 'students', label: '班级与学生' },
  { key: 'lessons', label: '课堂记录' },
  { key: 'tests', label: '体育测试' },
  { key: 'training', label: '训练队' },
  { key: 'plans', label: '教学计划' },
  { key: 'stats', label: '数据统计' },
  { key: 'exams', label: '评分标准' },
  { key: 'resources', label: '资料中心' },
  { key: 'ai', label: 'AI 助手' },
  { key: 'settings', label: '备份与恢复' }
]

export const PAGE_TITLES: Record<NavKey, string> = {
  dashboard: '工作台',
  schedule: '我的课表',
  classes: '班级与学生',
  students: '班级与学生',
  lessons: '课堂记录',
  plans: '教学计划',
  tests: '体育测试',
  training: '训练队',
  exams: '评分标准',
  stats: '数据统计',
  resources: '资料中心',
  ai: 'AI 助手',
  settings: '备份与恢复'
}

export const PAGE_DESCRIPTIONS: Record<NavKey, string> = {
  dashboard: '查看当日教学概览与待办事项。',
  schedule: '查看本学期周课表。当前为 2026 学年第一学期固定课表。',
  classes: '管理行政班与当前学生名单。班级和学生仍分开保存。',
  students: '管理行政班与当前学生名单。Excel 可自动建班并同步名单；消失的学生只移出当前名单，不删除历史。',
  lessons: '记录每节体育课的考勤与课堂表现。默认全员正常，只登记异常。',
  plans: '按年级编写学期教学计划与每周教学内容。计划不绑定单个班级，也不表示实际上课完成情况。',
  tests: '登记日常体育测试成绩，保存全班快照，并查看学生同项目历史。',
  training: '管理校队与训练组、记录训练出勤和训练成绩。不改行政班人数，也不写入体育测试。',
  exams: '查阅各地市体育中考与体育类专业省统考官方评分标准，并用已核验评分表换算分数。',
  stats: '查看班级课堂人次、学生档案和测试统计。数字根据现有记录实时计算。',
  resources: '管理教案、练习、规则和本地教学资料。支持文件副本、网页链接和文字笔记。',
  ai: '后续版本将接入本地可用的 AI 助手能力。当前仅作为功能入口预留。',
  settings: '备份与恢复本地教学数据。备份包保存在你选择的位置，恢复前会自动再做一份安全备份。'
}
