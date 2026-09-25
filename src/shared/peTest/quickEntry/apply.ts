import type { PETestRecord, PETestSession, TestItem, TestRecordStatus } from '../types'
import type { ExamStandard } from '../../examStandard/types'
import { BUILTIN_TEST_ITEMS } from '../builtinItems'
import { resolveEffectiveTestItem, UNRESOLVED_LINKED_ITEM_MESSAGE } from '../groupedItems'
import { nextRosterRecordId, nextUnenteredRecordId } from './nav'
import { parseQuickEntryInput } from './parse'
import { emptyClassroomScoreFields } from '../scoringBasis'
import { scoreQuickEntryRaw } from './score'
import { inputStatus } from '../measurement'

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
    ...emptyClassroomScoreFields(),
    resolvedTestItemId: null,
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
  items?: ReadonlyArray<TestItem>
}): QuickEntryApplyResult {
  const catalog = options.items ?? BUILTIN_TEST_ITEMS
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

  if (options.action.type === 'score') {
    const status = inputStatus(options.action.input)
    if (status === 'absent' || status === 'exempt' || status === 'pending') {
      const result = applyQuickEntry({ ...options, action: { type: status } })
      if (result.ok) result.session = patchRecord(result.session, options.recordId, { rawOriginal: options.action.input.trim() }, options.nowIso)
      return result
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

  if (options.action.type === 'pending') {
    const next = patchRecord(options.session, options.recordId, clearScorePatch('pending', options.nowIso), options.nowIso)
    return {
      ok: true,
      session: next,
      nextRecordId: nextUnenteredRecordId(next.records, options.recordId, options.scopeStudentIds),
      message: null,
      focusAgain: true
    }
  }

  const resolved = resolveEffectiveTestItem(options.session, current, options.testItem, catalog)
  if (!resolved.ok) {
    return {
      ok: false,
      session: options.session,
      nextRecordId: options.recordId,
      message: UNRESOLVED_LINKED_ITEM_MESSAGE,
      focusAgain: true
    }
  }
  const testItem = resolved.item

  if (options.action.type === 'absent' || options.action.type === 'exempt') {
    const next = patchRecord(
      options.session,
      options.recordId,
      {
        ...clearScorePatch(options.action.type, options.nowIso),
        resolvedTestItemId: testItem.id
      },
      options.nowIso
    )
    return {
      ok: true,
      session: next,
      nextRecordId: nextUnenteredRecordId(next.records, options.recordId, options.scopeStudentIds),
      message: null,
      focusAgain: true
    }
  }

  if (testItem.genderRule !== 'all' && testItem.genderRule !== current.genderSnapshot) {
    return { ok: false, session: options.session, nextRecordId: options.recordId, message: '项目与性别不匹配', focusAgain: true }
  }
  const parsed = parseQuickEntryInput(options.action.input, testItem)
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
    ? { ...emptyClassroomScoreFields(), examItemId: current.examItemId, noScoreHint: parsed.warning }
    : scoreQuickEntryRaw({
        standard: options.standard,
        examStandardId: options.session.examStandardId,
        grade: options.session.gradeSnapshot,
        testItem,
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
      baseScore: scored.baseScore,
      bonusScore: scored.bonusScore,
      scoreOutcome: scored.scoreOutcome,
      officialMinimumScore: scored.officialMinimumScore,
      resolvedTestItemId: testItem.id,
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
