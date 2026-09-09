export type RosterDetectField = 'name' | 'studentNo' | 'gender' | 'className' | 'notes' | 'grade' | 'serial'

export interface FieldAliasRule {
  field: RosterDetectField
  keys: string[]
  confidence: 'high' | 'medium' | 'low'
}

/** Normalized header keys (see normalizeHeaderKey). */
export const ROSTER_FIELD_ALIASES: FieldAliasRule[] = [
  { field: 'name', keys: ['姓名', '学生姓名', '名字', '学生'], confidence: 'high' },
  { field: 'studentNo', keys: ['学号', '学生学号', '学籍号', '校内学号', '学生编号', '座号'], confidence: 'high' },
  { field: 'studentNo', keys: ['编号', '班内编号'], confidence: 'medium' },
  { field: 'serial', keys: ['序号', '顺序号', 'no', 'index'], confidence: 'low' },
  { field: 'gender', keys: ['性别', '男女', '男女性别'], confidence: 'high' },
  {
    field: 'className',
    keys: ['班级', '行政班', '班别', '所在班级', '班级名称', '教学班', '所在班', '班'],
    confidence: 'high'
  },
  { field: 'grade', keys: ['年级', '所在年级', '级部'], confidence: 'medium' },
  { field: 'notes', keys: ['备注', '说明', '特殊情况', '备注信息'], confidence: 'medium' }
]

export const SKIP_SHEET_NAME_PATTERN = /说明|统计|封面|目录|分析|须知|填写说明|成绩分析|汇总/

export const ROSTER_SHEET_NAME_HINTS = /名单|花名册|学生|班级|初[一二三]|[七八九]年级/

export const MALE_GENDER_VALUES = new Set(['男', '男性', '男同学', 'm', 'male'])
export const FEMALE_GENDER_VALUES = new Set(['女', '女性', '女同学', 'f', 'female'])
export const UNSPECIFIED_GENDER_VALUES = new Set(['', '未填', '未知', '不详', '/', '-', '未填写'])

export function normalizeHeaderKey(value: string): string {
  return value
    .replace(/\u3000/g, ' ')
    .replace(/[\r\n\t]+/g, '')
    .replace(/\s+/g, '')
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/[：:：]/g, '')
    .replace(/[·．.]/g, '')
    .toLowerCase()
}

export function lookupHeaderAlias(header: string): FieldAliasRule | null {
  const key = normalizeHeaderKey(header)
  if (key === '') {
    return null
  }
  const exact = ROSTER_FIELD_ALIASES.find((rule) => rule.keys.some((item) => normalizeHeaderKey(item) === key))
  return exact ?? null
}
