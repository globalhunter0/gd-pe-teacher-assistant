import type { CourseType, Period, ScheduleItem, Weekday } from './types'
import type { TrainingTeam } from '../trainingTeam/types'

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/
const CLASS_ID_PATTERN = /^class-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const TRAINING_TEAM_ID_PATTERN =
  /^training-team-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function optionalId(value: unknown, pattern: RegExp, message: string): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  if (typeof value !== 'string' || !pattern.test(value)) {
    throw new Error(message)
  }
  return value
}

function normalizeTime(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('上课时间格式不正确')
  }

  const parts = value.split(':')
  if (parts.length < 2) {
    throw new Error('上课时间格式不正确')
  }

  const hours = Number(parts[0])
  const minutes = Number(parts[1])
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    throw new Error('上课时间格式不正确')
  }

  const normalized = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  if (!TIME_PATTERN.test(normalized)) {
    throw new Error('上课时间格式不正确')
  }

  return normalized
}

function isWeekday(value: unknown): value is Weekday {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5
}

function isPeriod(value: unknown): value is Period {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5 || value === 6 || value === 7 || value === 8
}

function isCourseType(value: unknown): value is CourseType {
  return value === 'regular' || value === 'big' || value === 'other'
}

export function scheduleSlotId(weekday: Weekday, period: Period): string {
  return `w${weekday}-p${period}`
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function parseScheduleItems(input: unknown): ScheduleItem[] {
  if (!Array.isArray(input)) {
    throw new Error('课表数据格式不正确')
  }

  const items = input.map((entry) => {
    if (typeof entry !== 'object' || entry === null) {
      throw new Error('课表条目格式不正确')
    }

    const record = entry as Record<string, unknown>
    const weekday = record.weekday
    const period = record.period
    const startTime = normalizeTime(record.startTime)
    const endTime = normalizeTime(record.endTime)
    const team = record.team
    const courseType = record.courseType

    if (!isWeekday(weekday) || !isPeriod(period) || !isCourseType(courseType)) {
      throw new Error('课表条目字段不正确')
    }

    if (toMinutes(startTime) >= toMinutes(endTime)) {
      throw new Error('结束时间必须晚于开始时间')
    }

    if (typeof team !== 'string' || team.trim().length === 0) {
      throw new Error('团队名称不能为空')
    }

    const item: ScheduleItem = {
      id: scheduleSlotId(weekday, period),
      weekday,
      period,
      startTime,
      endTime,
      team: team.trim(),
      courseType
    }

    const classId = optionalId(record.classId, CLASS_ID_PATTERN, '关联行政班编号不正确')
    const trainingTeamId = optionalId(record.trainingTeamId, TRAINING_TEAM_ID_PATTERN, '关联训练队编号不正确')
    if (classId) {
      item.classId = classId
    }
    if (trainingTeamId) {
      item.trainingTeamId = trainingTeamId
    }

    return item
  })

  const slots = new Set<string>()
  for (const item of items) {
    if (slots.has(item.id)) {
      throw new Error('同一时间格子不能重复排课')
    }
    slots.add(item.id)
  }

  return items.sort((a, b) => a.weekday - b.weekday || a.period - b.period)
}

/** 按稳定格子 id 一次性算出下一份课表。空选择返回 null，调用方不得写入。 */
export function applyScheduleBulkDelete(
  items: ReadonlyArray<ScheduleItem>,
  selectedIds: ReadonlyArray<string>
): ScheduleItem[] | null {
  const wanted = new Set(selectedIds)
  if (wanted.size === 0) {
    return null
  }

  const matched = items.filter((item) => wanted.has(item.id))
  if (matched.length === 0) {
    return null
  }

  return items.filter((item) => !wanted.has(item.id))
}

export function formatScheduleBulkDeleteConfirm(count: number): string {
  return [
    `确定删除已选择的 ${count} 节课表吗？`,
    '此操作只删除课表安排，',
    '不会删除班级、学生、课堂记录、体育测试、训练队或历史数据。'
  ].join('\n')
}

export function scheduleLinkSignature(item: Pick<ScheduleItem, 'classId' | 'trainingTeamId'>): string {
  return `${item.classId ?? ''}|${item.trainingTeamId ?? ''}`
}

export function assertScheduleLinksRoundTrip(
  submitted: ReadonlyArray<ScheduleItem>,
  persisted: ReadonlyArray<ScheduleItem>
): void {
  const persistedById = new Map(persisted.map((item) => [item.id, item]))
  for (const item of submitted) {
    const saved = persistedById.get(item.id)
    if (!saved) {
      throw new Error('课表保存后缺少原来的课程')
    }
    if (scheduleLinkSignature(item) !== scheduleLinkSignature(saved)) {
      throw new Error('课表班级或训练队关联没有保存成功')
    }
  }
}

export type ScheduleTrainingTeamLinkState = 'none' | 'active' | 'archived' | 'missing'

export interface ScheduleTrainingTeamLinkDisplay {
  state: ScheduleTrainingTeamLinkState
  label: string | null
  team: TrainingTeam | null
}

export function resolveScheduleTrainingTeamLink(
  trainingTeamId: string | undefined,
  teams: ReadonlyArray<TrainingTeam>
): ScheduleTrainingTeamLinkDisplay {
  if (!trainingTeamId) {
    return { state: 'none', label: null, team: null }
  }
  const team = teams.find((item) => item.id === trainingTeamId)
  if (!team || team.status === 'deleted') {
    return { state: 'missing', label: '原训练队已不存在', team: null }
  }
  if (team.status === 'archived') {
    return { state: 'archived', label: `${team.name}（已归档）`, team }
  }
  return { state: 'active', label: team.name, team }
}

/**
 * 保存整份课表时，只校验新增/主动变更的训练队关联。
 * 已存在的 archived 或 missing 历史关联可原样保存，但不能成为新的绑定目标。
 */
export function assertScheduleTrainingTeamSelections(
  current: ReadonlyArray<ScheduleItem>,
  submitted: ReadonlyArray<ScheduleItem>,
  teams: ReadonlyArray<TrainingTeam>
): void {
  const currentById = new Map(current.map((item) => [item.id, item]))
  for (const item of submitted) {
    if (!item.trainingTeamId) {
      continue
    }
    if (currentById.get(item.id)?.trainingTeamId === item.trainingTeamId) {
      continue
    }
    const target = teams.find(
      (team) => team.id === item.trainingTeamId && team.status === 'active'
    )
    if (!target) {
      throw new Error('只能新关联当前启用的训练队')
    }
  }
}

export function clearScheduleClassId(item: ScheduleItem): ScheduleItem {
  const next = { ...item }
  delete next.classId
  return next
}

export function clearScheduleTrainingTeamId(item: ScheduleItem): ScheduleItem {
  const next = { ...item }
  delete next.trainingTeamId
  return next
}

export function dropMissingScheduleClassLinks(
  items: ScheduleItem[],
  knownClassIds: ReadonlySet<string>
): ScheduleItem[] {
  return items.map((item) => (item.classId && !knownClassIds.has(item.classId) ? clearScheduleClassId(item) : item))
}

export function dropMissingScheduleTrainingTeamLinks(
  items: ScheduleItem[],
  knownTrainingTeamIds: ReadonlySet<string>
): ScheduleItem[] {
  return items.map((item) =>
    item.trainingTeamId && !knownTrainingTeamIds.has(item.trainingTeamId) ? clearScheduleTrainingTeamId(item) : item
  )
}

export function dropMissingScheduleLinks(
  items: ScheduleItem[],
  knownClassIds: ReadonlySet<string>,
  knownTrainingTeamIds: ReadonlySet<string>
): ScheduleItem[] {
  return dropMissingScheduleTrainingTeamLinks(
    dropMissingScheduleClassLinks(items, knownClassIds),
    knownTrainingTeamIds
  )
}
