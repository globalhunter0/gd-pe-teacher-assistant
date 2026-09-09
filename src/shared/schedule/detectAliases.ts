import { normalizeHeaderKey } from '../student/detectAliases'
import type { ScheduleImportField } from './importTypes'

export interface ScheduleFieldAliasRule {
  field: ScheduleImportField
  keys: string[]
  confidence: 'high' | 'medium' | 'low'
}

export const SCHEDULE_FIELD_ALIASES: ScheduleFieldAliasRule[] = [
  { field: 'weekday', keys: ['星期', '星期几', '周次', '星期日', '周', '星期栏'], confidence: 'high' },
  { field: 'period', keys: ['节次', '节', '课时', '第几节', '课节'], confidence: 'high' },
  { field: 'startTime', keys: ['开始', '开始时间', '上课时间', '起始时间', '从'], confidence: 'high' },
  { field: 'endTime', keys: ['结束', '结束时间', '下课时间', '迄'], confidence: 'high' },
  { field: 'team', keys: ['课程', '课程名称', '团队', '班级', '授课班级', '教学班', '内容'], confidence: 'high' },
  { field: 'courseType', keys: ['类型', '课程类型', '课型', '课程类别'], confidence: 'medium' }
]

export const SCHEDULE_SHEET_NAME_HINTS = /课表|课程|课时|教学安排|任课/
export const SKIP_SCHEDULE_SHEET_PATTERN = /说明|统计|封面|目录|须知|填写说明/

export function lookupScheduleHeaderAlias(header: string): ScheduleFieldAliasRule | null {
  const key = normalizeHeaderKey(header)
  if (key === '') {
    return null
  }
  return SCHEDULE_FIELD_ALIASES.find((rule) => rule.keys.some((item) => normalizeHeaderKey(item) === key)) ?? null
}
