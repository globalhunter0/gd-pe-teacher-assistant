import type { PETestRecord, PETestSession, TestRecordStatus } from '../types'

export interface QuickEntryRecordState {
  rawValue: number | null
  status: TestRecordStatus
  examScore: number | null
  rawOriginal: string
  note: string
  examItemId: string | null
  resolvedTestItemId: string | null
  baseScore: number | null
  bonusScore: number | null
  scoreOutcome: PETestRecord['scoreOutcome']
  officialMinimumScore: number | null
}

export interface QuickEntryUndoEntry {
  sessionId: string
  recordId: string
  studentId: string
  before: QuickEntryRecordState
  after: QuickEntryRecordState
}

export const QUICK_ENTRY_UNDO_LIMIT = 5

export function captureRecordState(record: PETestRecord): QuickEntryRecordState {
  return {
    rawValue: record.rawValue,
    status: record.status,
    examScore: record.examScore,
    rawOriginal: record.rawOriginal,
    note: record.note,
    examItemId: record.examItemId,
    resolvedTestItemId: record.resolvedTestItemId ?? null,
    baseScore: record.baseScore ?? null,
    bonusScore: record.bonusScore ?? null,
    scoreOutcome: record.scoreOutcome ?? null,
    officialMinimumScore: record.officialMinimumScore ?? null
  }
}

export function pushUndoEntry(
  stack: ReadonlyArray<QuickEntryUndoEntry>,
  entry: QuickEntryUndoEntry,
  limit = QUICK_ENTRY_UNDO_LIMIT
): QuickEntryUndoEntry[] {
  return [...stack, entry].slice(-limit)
}

export function applyQuickEntryUndo(
  session: PETestSession,
  entry: QuickEntryUndoEntry,
  nowIso: string
): { ok: true; session: PETestSession } | { ok: false; message: string } {
  if (session.id !== entry.sessionId) {
    return { ok: false, message: '只能撤销当前这次测试的录入' }
  }
  const record = session.records.find((item) => item.id === entry.recordId)
  if (!record || record.studentId !== entry.studentId) {
    return { ok: false, message: '找不到要撤销的学生记录' }
  }

  return {
    ok: true,
    session: {
      ...session,
      updatedAt: nowIso,
      records: session.records.map((item) =>
        item.id === entry.recordId
          ? {
              ...item,
              rawValue: entry.before.rawValue,
              status: entry.before.status,
              examScore: entry.before.examScore,
              rawOriginal: entry.before.rawOriginal,
              note: entry.before.note,
              examItemId: entry.before.examItemId,
              resolvedTestItemId: entry.before.resolvedTestItemId,
              baseScore: entry.before.baseScore,
              bonusScore: entry.before.bonusScore,
              scoreOutcome: entry.before.scoreOutcome,
              officialMinimumScore: entry.before.officialMinimumScore,
              updatedAt: nowIso
            }
          : item
      )
    }
  }
}
