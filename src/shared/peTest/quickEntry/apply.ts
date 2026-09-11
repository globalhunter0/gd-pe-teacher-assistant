import type { PETestRecord, PETestSession, TestItem, TestRecordStatus } from '../types'
import type { ExamStandard } from '../../examStandard/types'
import { nextRosterRecordId, nextUnenteredRecordId } from './nav'
import { parseQuickEntryInput } from './parse'
import { scoreQuickEntryRaw } from './score'

export type QuickEntryAction =
  | { type: 'score'; input: string }
  | { type: 'absent' }
  | { type: 'exempt' }
  | { type: 'pending' }
  | { type: 'skip' }

export type QuickEntryApplyOk = {
  ok: true
  session: PETestSession
  nextRecordId: string | null
  message: string | null
  focusAgain: true
}

export type QuickEntryApplyFail = {
  ok: false
  session: PETestSession
  nextRecordId: string
  message: string
  focusAgain: true
}

export type QuickEntryApplyResult = QuickEntryApplyOk | QuickEntryApplyFail

function patchRecord(
  session: PETestSession,
  recordId: string,
  patch: Partial<PETestRecord>,
  nowIso: string
): PETestSession {
  return {
    ...session,
    updatedAt: nowIso,
    records: session.records.map((record) =>
      record.id === recordId ? { ...record, ...patch, updatedAt: nowIso } : record
    )
  }
}

function clearScorePatch(status: TestRecordStatus, nowIso: string): Partial<PETestRecord> {
  return {
    status,
    rawValue: null,
    examScore: null,
    examItemId: null,
    rawOriginal: '',
    note: status === 'pending' ? '' : '',
    updatedAt: nowIso
  }
}

export function applyQuickEntry(options: {
  session: PETestSession
  testItem: TestItem
  recordId: string
  action: QuickEntryAction
  standard: ExamStandard | null
  nowIso: string
  scopeStudentIds?: ReadonlyArray<string> | null
}): QuickEntryApplyResult {
  const current = options.session.records.find((item) => item.id === options.recordId)
  if (!current) {
    return {
      ok: false,
      session: options.session,
      nextRecordId: options.recordId,
      message: '找不到当前学生',
      focusAgain: true
    }
  }

  if (options.action.type === 'skip') {
    return {
      ok: true,
      session: options.session,
      nextRecordId: nextRosterRecordId(options.session.records, options.recordId, options.scopeStudentIds),
      message: current.status === 'pending' ? '已跳过，保持未测' : null,
      focusAgain: true
    }
  }

  if (options.action.type === 'absent' || options.action.type === 'exempt' || options.action.type === 'pending') {
    const next = patchRecord(options.session, options.recordId, clearScorePatch(options.action.type, options.nowIso), options.nowIso)
    return {
      ok: true,
      session: next,
      nextRecordId: nextUnenteredRecordId(next.records, options.recordId, options.scopeStudentIds),
      message: null,
      focusAgain: true
    }
  }

  const parsed = parseQuickEntryInput(options.action.input, options.testItem)
  if (!parsed.ok) {
    return {
      ok: false,
      session: options.session,
      nextRecordId: options.recordId,
      message: parsed.message,
      focusAgain: true
    }
  }

  const scored = parsed.needsConfirm
    ? { examScore: null, examItemId: current.examItemId, noScoreHint: parsed.warning }
    : scoreQuickEntryRaw({
        standard: options.standard,
        testItem: options.testItem,
        gender: current.genderSnapshot,
        rawValue: parsed.rawValue
      })

  const next = patchRecord(
    options.session,
    options.recordId,
    {
      status: parsed.needsConfirm ? 'invalid' : 'valid',
      rawValue: parsed.rawValue,
      rawOriginal: options.action.input.trim(),
      examScore: scored.examScore,
      examItemId: scored.examItemId,
      note: parsed.needsConfirm ? '需确认' : current.note === '需确认' ? '' : current.note
    },
    options.nowIso
  )

  return {
    ok: true,
    session: next,
    nextRecordId: nextUnenteredRecordId(next.records, options.recordId, options.scopeStudentIds),
    message: parsed.needsConfirm ? parsed.warning : scored.noScoreHint,
    focusAgain: true
  }
}
