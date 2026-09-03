import {
  compareToPrevious,
  findFirstValidScore,
  findLatestValidScore,
  formatRawValue,
  resolveTimeInputMode,
  testUnitDisplay,
  usesMinuteFormat,
  type PETestRecord,
  type PETestSession,
  type TestDirection,
  type TestItem,
  type TestRecordStatus
} from '../peTest'
import { inDateRange, type ResolvedDateRange } from './dateRange'

export function filterTests(
  sessions: ReadonlyArray<PETestSession>,
  classId: string,
  testItemId: string,
  range: ResolvedDateRange
): PETestSession[] {
  return sessions.filter(
    (item) => item.classId === classId && item.testItemId === testItemId && inDateRange(item.date, range)
  )
}

export function countTestStatuses(records: ReadonlyArray<Pick<PETestRecord, 'status'>>): Record<TestRecordStatus, number> {
  const counts: Record<TestRecordStatus, number> = {
    pending: 0,
    valid: 0,
    absent: 0,
    exempt: 0,
    invalid: 0
  }

  for (const record of records) {
    counts[record.status] += 1
  }

  return counts
}

export function validRawValues(records: ReadonlyArray<Pick<PETestRecord, 'status' | 'rawValue'>>): number[] {
  return records
    .filter((item) => item.status === 'valid' && item.rawValue !== null)
    .map((item) => item.rawValue as number)
}

export function averageRaw(values: ReadonlyArray<number>): number | null {
  if (values.length === 0) {
    return null
  }

  return values.reduce((sum, item) => sum + item, 0) / values.length
}

export function bestRaw(values: ReadonlyArray<number>, direction: TestDirection): number | null {
  if (values.length === 0 || direction === 'neutral') {
    return null
  }

  return direction === 'higherBetter' ? Math.max(...values) : Math.min(...values)
}

export function formatTestScore(
  rawValue: number | null,
  session: Pick<PETestSession, 'valueTypeSnapshot' | 'timeInputModeSnapshot' | 'unitSnapshot' | 'customUnitLabelSnapshot'>,
  testItem: TestItem | undefined
): string {
  if (rawValue === null) {
    return '—'
  }

  const timeInputMode = resolveTimeInputMode(testItem, session.timeInputModeSnapshot)
  const preferMinute = usesMinuteFormat(timeInputMode, session.valueTypeSnapshot)
  const decimalPlaces = testItem?.decimalPlaces ?? (session.valueTypeSnapshot === 'time' ? 1 : 0)
  const formatted = formatRawValue(rawValue, session.valueTypeSnapshot, decimalPlaces, preferMinute)
  return formatted
}

export function formatTestScoreWithUnit(
  rawValue: number | null,
  session: Pick<PETestSession, 'valueTypeSnapshot' | 'timeInputModeSnapshot' | 'unitSnapshot' | 'customUnitLabelSnapshot'>,
  testItem: TestItem | undefined
): string {
  const formatted = formatTestScore(rawValue, session, testItem)
  if (formatted === '—') {
    return formatted
  }

  const unit = testUnitDisplay(session.unitSnapshot, session.customUnitLabelSnapshot)
  if (session.valueTypeSnapshot === 'time' && !usesMinuteFormat(resolveTimeInputMode(testItem, session.timeInputModeSnapshot), session.valueTypeSnapshot)) {
    return `${formatted} 秒`
  }

  return unit ? `${formatted} ${unit}` : formatted
}

export function summarizeTestSession(
  session: PETestSession,
  testItem: TestItem | undefined
): {
  statuses: Record<TestRecordStatus, number>
  average: string
  best: string
} {
  const values = validRawValues(session.records)
  const avg = averageRaw(values)
  const best = bestRaw(values, session.directionSnapshot)
  return {
    statuses: countTestStatuses(session.records),
    average: formatTestScore(avg, session, testItem),
    best: formatTestScore(best, session, testItem)
  }
}

export interface StudentItemStat {
  testItemId: string
  name: string
  testCount: number
  firstText: string
  recentText: string
  bestText: string
  vsFirstText: string
  vsFirstKind: 'improved' | 'declined' | 'same' | null
  history: Array<{ sessionId: string; date: string; title: string; text: string; status: TestRecordStatus }>
}

export function summarizeStudentTests(
  sessions: ReadonlyArray<PETestSession>,
  studentId: string,
  testItems: ReadonlyArray<TestItem>,
  range: ResolvedDateRange
): StudentItemStat[] {
  const grouped = new Map<string, PETestSession[]>()
  for (const session of sessions) {
    if (!inDateRange(session.date, range)) {
      continue
    }

    if (!session.records.some((record) => record.studentId === studentId)) {
      continue
    }

    const list = grouped.get(session.testItemId) ?? []
    list.push(session)
    grouped.set(session.testItemId, list)
  }

  const result: StudentItemStat[] = []
  for (const [testItemId, itemSessions] of grouped) {
    const sorted = [...itemSessions].sort(
      (a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)
    )
    const sample = sorted[sorted.length - 1]
    const testItem = testItems.find((item) => item.id === testItemId)
    const name = testItem?.name ?? sample.testItemNameSnapshot
    const historyRows = sorted.flatMap((session) => {
      const record = session.records.find((item) => item.studentId === studentId)
      if (!record) {
        return []
      }

      return [
        {
          sessionId: session.id,
          date: session.date,
          title: session.title,
          status: record.status,
          text:
            record.status === 'valid'
              ? formatTestScoreWithUnit(record.rawValue, session, testItem)
              : '—'
        }
      ]
    })

    const validHistory = sorted.map((session) => {
      const record = session.records.find((item) => item.studentId === studentId)
      return {
        date: session.date,
        id: session.id,
        createdAt: session.createdAt,
        rawValue: record?.rawValue ?? null,
        status: record?.status ?? 'pending'
      }
    })

    const first = findFirstValidScore(validHistory)
    const recent = findLatestValidScore(validHistory)
    const values = validHistory
      .filter((item) => item.status === 'valid' && item.rawValue !== null)
      .map((item) => item.rawValue as number)
    const best = bestRaw(values, sample.directionSnapshot)
    const timeInputMode = resolveTimeInputMode(testItem, sample.timeInputModeSnapshot)
    const preferMinute = usesMinuteFormat(timeInputMode, sample.valueTypeSnapshot)
    const decimalPlaces = testItem?.decimalPlaces ?? (sample.valueTypeSnapshot === 'time' ? 1 : 0)
    const unitLabel = testUnitDisplay(sample.unitSnapshot, sample.customUnitLabelSnapshot)
    const vsFirst =
      first && recent && first.sessionId !== recent.sessionId
        ? compareToPrevious(
            recent.rawValue,
            first.rawValue,
            sample.directionSnapshot,
            sample.valueTypeSnapshot,
            decimalPlaces,
            preferMinute,
            unitLabel
          )
        : null

    result.push({
      testItemId,
      name,
      testCount: sorted.length,
      firstText: first ? formatTestScoreWithUnit(first.rawValue, sample, testItem) : '—',
      recentText: recent ? formatTestScoreWithUnit(recent.rawValue, sample, testItem) : '—',
      bestText: best === null ? '—' : formatTestScoreWithUnit(best, sample, testItem),
      vsFirstText:
        vsFirst?.text ??
        (sample.directionSnapshot === 'neutral' ? '不比较' : first && recent && first.sessionId === recent.sessionId ? '仅一次有效成绩' : '—'),
      vsFirstKind: vsFirst?.kind ?? null,
      history: historyRows
    })
  }

  return result.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
}
