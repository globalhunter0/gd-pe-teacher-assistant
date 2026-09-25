import type { ExamStandard } from '../examStandard/types'
import { applyQuickEntry } from './quickEntry/apply'
import { inputStatus } from './measurement'
import type { PETestSession, TestItem } from './types'

/** Only explicit score/status edits are parsed. Notes and metadata never rescore history. */
export function applyPeTestEdits(options: {
  draft: PETestSession
  inputs: Record<string, string>
  changedIds: ReadonlySet<string>
  testItem: TestItem
  items: ReadonlyArray<TestItem>
  standard: ExamStandard | null
  nowIso: string
}): PETestSession {
  let session = options.draft
  for (const record of options.draft.records) {
    if (!options.changedIds.has(record.id)) continue
    const input = options.inputs[record.id] ?? ''
    const status = record.status === 'absent' || record.status === 'exempt' ? record.status : inputStatus(input)
    const result = applyQuickEntry({ ...options, session, recordId: record.id,
      action: status === 'absent' || status === 'exempt' || status === 'pending' ? { type: status } : { type: 'score', input } })
    if (!result.ok) throw new Error(`${record.nameSnapshot}：${result.message}`)
    session = { ...result.session, records: result.session.records.map(row => row.id === record.id
      ? { ...row, note: row.status === 'invalid' ? row.note : record.note,
        rawOriginal: inputStatus(input) !== null ? input.trim() : row.rawOriginal } : row) }
    if (record.status === 'invalid') {
      session = { ...session, records: session.records.map(row => row.id === record.id
        ? { ...row, status: 'invalid', examScore: null, baseScore: null, bonusScore: null, scoreOutcome: null, officialMinimumScore: null } : row) }
    }
  }
  return { ...session, updatedAt: options.nowIso }
}
