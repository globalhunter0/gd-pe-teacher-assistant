import type { PETestRecord } from '../types'

export interface QuickEntryProgress {
  total: number
  recorded: number
  pending: number
  absent: number
  exempt: number
  valid: number
  invalid: number
  complete: boolean
}

export function countQuickEntryProgress(records: ReadonlyArray<Pick<PETestRecord, 'status'>>): QuickEntryProgress {
  let pending = 0
  let absent = 0
  let exempt = 0
  let valid = 0
  let invalid = 0
  for (const record of records) {
    if (record.status === 'pending') {
      pending += 1
    } else if (record.status === 'absent') {
      absent += 1
    } else if (record.status === 'exempt') {
      exempt += 1
    } else if (record.status === 'valid') {
      valid += 1
    } else {
      invalid += 1
    }
  }
  const total = records.length
  return {
    total,
    recorded: total - pending,
    pending,
    absent,
    exempt,
    valid,
    invalid,
    complete: total > 0 && pending === 0
  }
}
