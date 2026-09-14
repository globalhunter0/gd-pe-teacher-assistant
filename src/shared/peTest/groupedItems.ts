import type { StudentGender } from '../student/types'
import { BUILTIN_TEST_ITEMS } from './builtinItems'
import { formatRawValue, usesMinuteFormat } from './scoreFormat'
import type { PETestRecord, PETestSession, TestItem } from './types'

export const MIDDLE_LONG_RUN_GROUP_ID = 'middle-long-run-800-1000'

export const UNRESOLVED_LINKED_ITEM_MESSAGE = '无法确定项目，请先完善性别'

export interface GenderLinkedTestGroup {
  id: string
  displayName: string
  maleBuiltinKey: string
  femaleBuiltinKey: string
}

/** 业务选择层。不是第二套 catalog / 评分表。 */
export const GENDER_LINKED_TEST_GROUPS: GenderLinkedTestGroup[] = [
  {
    id: MIDDLE_LONG_RUN_GROUP_ID,
    displayName: '800米 / 1000米',
    maleBuiltinKey: 'run-1000m',
    femaleBuiltinKey: 'run-800m'
  }
]

export type TeacherTestOption =
  | { kind: 'group'; value: string; label: string; group: GenderLinkedTestGroup }
  | { kind: 'item'; value: string; label: string; item: TestItem }

export type TeacherTestSelection =
  | { kind: 'group'; group: GenderLinkedTestGroup; anchor: TestItem }
  | { kind: 'item'; item: TestItem }

export function teacherTestOptionValue(groupId: string): string {
  return `group:${groupId}`
}

export function groupedMemberBuiltinKeys(): Set<string> {
  return new Set(
    GENDER_LINKED_TEST_GROUPS.flatMap((group) => [group.maleBuiltinKey, group.femaleBuiltinKey])
  )
}

export function findGenderLinkedGroup(id: string | null | undefined): GenderLinkedTestGroup | null {
  if (!id) {
    return null
  }
  return GENDER_LINKED_TEST_GROUPS.find((item) => item.id === id) ?? null
}

export function isGenderLinkedSession(session: Pick<PETestSession, 'testGroupId'>): boolean {
  return findGenderLinkedGroup(session.testGroupId) !== null
}

export function groupAnchorItem(group: GenderLinkedTestGroup, items: ReadonlyArray<TestItem>): TestItem | undefined {
  return items.find((item) => item.builtinKey === group.maleBuiltinKey)
}

export function teacherSelectableTestOptions(items: ReadonlyArray<TestItem>): TeacherTestOption[] {
  const active = items.filter((item) => item.isActive)
  const hidden = groupedMemberBuiltinKeys()
  const options: TeacherTestOption[] = GENDER_LINKED_TEST_GROUPS.map((group) => ({
    kind: 'group',
    value: teacherTestOptionValue(group.id),
    label: group.displayName,
    group
  }))
  for (const item of active) {
    if (item.builtinKey && hidden.has(item.builtinKey)) {
      continue
    }
    options.push({ kind: 'item', value: item.id, label: item.name, item })
  }
  return options
}

export function defaultTeacherTestOptionValue(items: ReadonlyArray<TestItem>): string {
  return teacherSelectableTestOptions(items)[0]?.value ?? ''
}

export function parseTeacherTestSelection(
  value: string,
  items: ReadonlyArray<TestItem>
): TeacherTestSelection | null {
  if (value.startsWith('group:')) {
    const group = findGenderLinkedGroup(value.slice('group:'.length))
    if (!group) {
      return null
    }
    const anchor = groupAnchorItem(group, items)
    if (!anchor) {
      return null
    }
    return { kind: 'group', group, anchor }
  }
  const item = items.find((entry) => entry.id === value && entry.isActive)
  return item ? { kind: 'item', item } : null
}

/**
 * 组合项目唯一解析入口：按学生性别落到现有 catalog 项目。
 * 有 testGroupId 时忽略 session.testItemId / 错误的 resolvedTestItemId 快照。
 */
export function resolveActualTestItem(
  session: Pick<PETestSession, 'testGroupId' | 'testItemId'>,
  record: Pick<PETestRecord, 'genderSnapshot' | 'resolvedTestItemId'>,
  items: ReadonlyArray<TestItem> = BUILTIN_TEST_ITEMS
): { ok: true; item: TestItem } | { ok: false; code: 'unspecified' | 'missing' } {
  const group = findGenderLinkedGroup(session.testGroupId)
  if (group) {
    return resolveLinkedTestItem(group, record.genderSnapshot, items)
  }
  const id = record.resolvedTestItemId ?? session.testItemId
  const item = items.find((entry) => entry.id === id)
  if (!item) {
    return { ok: false, code: 'missing' }
  }
  return { ok: true, item }
}

export function resolveEffectiveTestItem(
  session: Pick<PETestSession, 'testGroupId' | 'testItemId'>,
  record: Pick<PETestRecord, 'genderSnapshot' | 'resolvedTestItemId'>,
  fallback: TestItem,
  items: ReadonlyArray<TestItem>
): { ok: true; item: TestItem } | { ok: false; code: 'unspecified' | 'missing' } {
  const resolved = resolveActualTestItem(session, record, items)
  if (resolved.ok) {
    return resolved
  }
  if (findGenderLinkedGroup(session.testGroupId)) {
    return resolved
  }
  return { ok: true, item: fallback }
}

export function resolvedTestItemIdOf(
  record: Pick<PETestRecord, 'resolvedTestItemId' | 'genderSnapshot'>,
  session: Pick<PETestSession, 'testItemId' | 'testGroupId'>,
  items: ReadonlyArray<TestItem> = BUILTIN_TEST_ITEMS
): string | null {
  const resolved = resolveActualTestItem(session, record, items)
  return resolved.ok ? resolved.item.id : null
}

/** 学生个人项目维度：组合测试按性别解析，不回退 session.testItemId。无法确定性解析时返回 []。 */
export function recordsForActualTestItem(
  session: Pick<PETestSession, 'testItemId' | 'testGroupId' | 'records'>,
  testItemId: string,
  items: ReadonlyArray<TestItem> = BUILTIN_TEST_ITEMS
): PETestRecord[] {
  return session.records.filter((record) => resolvedTestItemIdOf(record, session, items) === testItemId)
}

export function actualTestItemName(
  session: Pick<PETestSession, 'testGroupId' | 'testItemId' | 'testItemNameSnapshot'>,
  record: Pick<PETestRecord, 'genderSnapshot' | 'resolvedTestItemId'>,
  items: ReadonlyArray<TestItem> = BUILTIN_TEST_ITEMS
): string {
  const resolved = resolveActualTestItem(session, record, items)
  if (resolved.ok) {
    return resolved.item.name
  }
  if (findGenderLinkedGroup(session.testGroupId) && resolved.code === 'unspecified') {
    return UNRESOLVED_LINKED_ITEM_MESSAGE
  }
  return session.testItemNameSnapshot
}

export function resolveLinkedTestItem(
  group: GenderLinkedTestGroup,
  gender: StudentGender,
  items: ReadonlyArray<TestItem>
): { ok: true; item: TestItem } | { ok: false; code: 'unspecified' | 'missing' } {
  if (gender !== 'male' && gender !== 'female') {
    return { ok: false, code: 'unspecified' }
  }
  const key = gender === 'male' ? group.maleBuiltinKey : group.femaleBuiltinKey
  const item = items.find((entry) => entry.builtinKey === key)
  if (!item) {
    return { ok: false, code: 'missing' }
  }
  return { ok: true, item }
}

export function sessionDisplayItemName(session: Pick<PETestSession, 'testGroupId' | 'testItemNameSnapshot'>): string {
  return findGenderLinkedGroup(session.testGroupId)?.displayName ?? session.testItemNameSnapshot
}

export function findTeacherVisibleDuplicates(
  sessions: ReadonlyArray<PETestSession>,
  classId: string,
  date: string,
  selection: TeacherTestSelection
): PETestSession[] {
  if (selection.kind === 'group') {
    return sessions.filter(
      (session) => session.classId === classId && session.date === date && session.testGroupId === selection.group.id
    )
  }
  return sessions.filter(
    (session) =>
      session.classId === classId &&
      session.date === date &&
      session.testItemId === selection.item.id &&
      !session.testGroupId
  )
}

export function linkedGenderScoreStats(
  session: PETestSession,
  items: ReadonlyArray<TestItem>
): Array<{
  gender: 'male' | 'female'
  itemName: string
  valid: number
  averageRawText: string
  averageScoreText: string
}> {
  const group = findGenderLinkedGroup(session.testGroupId)
  if (!group) {
    return []
  }
  const rows: Array<{ gender: 'male' | 'female'; builtinKey: string }> = [
    { gender: 'male', builtinKey: group.maleBuiltinKey },
    { gender: 'female', builtinKey: group.femaleBuiltinKey }
  ]
  return rows.map((row) => {
    const item = items.find((entry) => entry.builtinKey === row.builtinKey)
    const genderRecords = session.records.filter((record) => record.genderSnapshot === row.gender)
    const scores = genderRecords
      .filter((record) => record.examScore !== null)
      .map((record) => record.examScore as number)
    const raws = genderRecords
      .filter((record) => record.status === 'valid' && record.rawValue !== null)
      .map((record) => record.rawValue as number)
    const avgScore = scores.length === 0 ? null : scores.reduce((sum, value) => sum + value, 0) / scores.length
    const avgRaw = raws.length === 0 ? null : raws.reduce((sum, value) => sum + value, 0) / raws.length
    const valueType = item?.valueType ?? session.valueTypeSnapshot
    const preferMinute = item
      ? usesMinuteFormat(item.timeInputMode, item.valueType)
      : usesMinuteFormat(session.timeInputModeSnapshot, session.valueTypeSnapshot)
    const decimalPlaces = item?.decimalPlaces ?? (session.valueTypeSnapshot === 'time' ? 1 : 0)
    return {
      gender: row.gender,
      itemName: item?.name ?? row.builtinKey,
      valid: genderRecords.filter((record) => record.status === 'valid').length,
      averageRawText: avgRaw === null ? '—' : formatRawValue(avgRaw, valueType, decimalPlaces, preferMinute),
      averageScoreText: avgScore === null ? '—' : Number.isInteger(avgScore) ? String(avgScore) : avgScore.toFixed(2)
    }
  })
}
