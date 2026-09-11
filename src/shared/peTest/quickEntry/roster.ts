import type { PETestRecord, TestRecordStatus } from '../types'

export type QuickEntryRosterTab = 'all' | 'pending' | 'recorded' | 'absentExempt'

export function recordMatchesRosterTab(record: Pick<PETestRecord, 'status'>, tab: QuickEntryRosterTab): boolean {
  if (tab === 'all') {
    return true
  }
  if (tab === 'pending') {
    return record.status === 'pending'
  }
  if (tab === 'recorded') {
    return record.status !== 'pending'
  }
  return record.status === 'absent' || record.status === 'exempt'
}

export function recordMatchesSearch(
  record: Pick<PETestRecord, 'nameSnapshot' | 'studentNoSnapshot'>,
  query: string
): boolean {
  const text = query.replace(/\u3000/g, ' ').trim().toLowerCase()
  if (text === '') {
    return true
  }
  return record.nameSnapshot.toLowerCase().includes(text) || record.studentNoSnapshot.toLowerCase().includes(text)
}

export function recordsInStudentScope(
  records: ReadonlyArray<PETestRecord>,
  studentIds: ReadonlyArray<string> | null
): PETestRecord[] {
  if (!studentIds || studentIds.length === 0) {
    return [...records]
  }
  const set = new Set(studentIds)
  return records.filter((item) => set.has(item.studentId))
}

export function visibleQuickEntryRecords(
  records: ReadonlyArray<PETestRecord>,
  options: {
    tab: QuickEntryRosterTab
    query: string
    groupStudentIds: ReadonlyArray<string> | null
  }
): PETestRecord[] {
  return recordsInStudentScope(records, options.groupStudentIds).filter(
    (item) => recordMatchesRosterTab(item, options.tab) && recordMatchesSearch(item, options.query)
  )
}

export function pendingStudentIds(records: ReadonlyArray<PETestRecord>): string[] {
  return records.filter((item) => item.status === 'pending').map((item) => item.studentId)
}

export function isGroupComplete(
  records: ReadonlyArray<PETestRecord>,
  groupStudentIds: ReadonlyArray<string>
): boolean {
  if (groupStudentIds.length === 0) {
    return false
  }
  return recordsInStudentScope(records, groupStudentIds).every((item) => item.status !== 'pending')
}

export function uniqueStudentIds(ids: ReadonlyArray<string>): string[] {
  return [...new Set(ids)]
}

export function statusLabel(status: TestRecordStatus): string {
  if (status === 'absent') {
    return '缺考'
  }
  if (status === 'exempt') {
    return '免考'
  }
  if (status === 'pending') {
    return '未测'
  }
  if (status === 'invalid') {
    return '需确认'
  }
  return '已录'
}
