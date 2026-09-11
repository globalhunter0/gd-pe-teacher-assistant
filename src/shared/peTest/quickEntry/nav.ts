import type { PETestRecord } from '../types'

export function sortQuickEntryRecords<T extends Pick<PETestRecord, 'studentNoSnapshot' | 'nameSnapshot'>>(
  records: ReadonlyArray<T>
): T[] {
  return [...records].sort(
    (a, b) =>
      a.studentNoSnapshot.localeCompare(b.studentNoSnapshot, 'zh-CN', { numeric: true }) ||
      a.nameSnapshot.localeCompare(b.nameSnapshot, 'zh-CN')
  )
}

export function firstUnenteredRecordId(records: ReadonlyArray<PETestRecord>): string | null {
  const sorted = sortQuickEntryRecords(records)
  const pending = sorted.find((item) => item.status === 'pending')
  return pending?.id ?? sorted[0]?.id ?? null
}

export function nextUnenteredRecordId(records: ReadonlyArray<PETestRecord>, currentId: string): string | null {
  const sorted = sortQuickEntryRecords(records)
  if (sorted.length === 0) {
    return null
  }
  const start = sorted.findIndex((item) => item.id === currentId)
  const from = start < 0 ? 0 : start + 1
  for (let index = 0; index < sorted.length; index += 1) {
    const item = sorted[(from + index) % sorted.length]
    if (item.status === 'pending') {
      return item.id
    }
  }
  return currentId
}

export function adjacentRecordId(
  records: ReadonlyArray<PETestRecord>,
  currentId: string,
  direction: -1 | 1
): string | null {
  const sorted = sortQuickEntryRecords(records)
  if (sorted.length === 0) {
    return null
  }
  const start = sorted.findIndex((item) => item.id === currentId)
  if (start < 0) {
    return sorted[0].id
  }
  const next = start + direction
  if (next < 0 || next >= sorted.length) {
    return sorted[start].id
  }
  return sorted[next].id
}

export function nextRosterRecordId(records: ReadonlyArray<PETestRecord>, currentId: string): string | null {
  const sorted = sortQuickEntryRecords(records)
  if (sorted.length === 0) {
    return null
  }
  const start = sorted.findIndex((item) => item.id === currentId)
  if (start < 0) {
    return sorted[0].id
  }
  return sorted[(start + 1) % sorted.length].id
}
