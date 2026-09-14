import type { PETestRecord, TestRecordStatus } from '../types'
import { formatPeTestItemScoreText } from '../scoringBasis'

export interface QuickEntryRecentEntry {
  recordId: string
  studentId: string
  studentNo: string
  name: string
  status: TestRecordStatus
  rawDisplay: string
  examScore: number | null
  scoreText: string
}

export const QUICK_ENTRY_RECENT_LIMIT = 5

export function pushRecentEntry(
  items: ReadonlyArray<QuickEntryRecentEntry>,
  entry: QuickEntryRecentEntry,
  limit = QUICK_ENTRY_RECENT_LIMIT
): QuickEntryRecentEntry[] {
  return [entry, ...items.filter((item) => item.recordId !== entry.recordId)].slice(0, limit)
}

export function recentEntryFromRecord(record: PETestRecord, rawDisplay: string): QuickEntryRecentEntry {
  return {
    recordId: record.id,
    studentId: record.studentId,
    studentNo: record.studentNoSnapshot,
    name: record.nameSnapshot,
    status: record.status,
    rawDisplay,
    examScore: record.examScore,
    scoreText: formatPeTestItemScoreText(record)
  }
}
