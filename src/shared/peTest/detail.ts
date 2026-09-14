import { listBuiltinExamStandards } from '../examStandard/catalog'
import type { ExamStandard } from '../examStandard/types'
import type { ClassRecord } from '../class/types'
import {
  classifyScoreBand,
  resolveExamItemFullScore,
  summarizeSingleTest,
  type SingleTestSummary
} from '../statistics/analytics'
import { formatTestScore } from '../statistics/tests'
import { recordMatchesSearch } from './quickEntry/roster'
import { BUILTIN_TEST_ITEMS } from './builtinItems'
import { actualTestItemName, resolveActualTestItem, sessionDisplayItemName } from './groupedItems'
import { classroomScoringLabel, formatPeTestItemScoreText, isBelowOfficialMinimumRecord } from './scoringBasis'
import type { PETestRecord, PETestSession, TestItem } from './types'

export type PeTestDetailFilter = 'all' | 'valid' | 'pending' | 'absent' | 'exempt' | 'fail' | 'invalid'

export interface PeTestDetailRow {
  record: PETestRecord
  rawText: string
  scoreText: string
  baseText: string
  bonusText: string
  statusLabel: string
  vsText: string
  vsKind: string
  isFail: boolean
  resolvedItemName: string
}

export interface PeTestClosure {
  sessionId: string
  classLabel: string
  date: string
  itemName: string
  standardLabel: string
  roster: number
  valid: number
  absent: number
  exempt: number
  pending: number
  invalid: number
  processed: number
  complete: boolean
  summary: SingleTestSummary
  passCount: number | null
  excellentCount: number | null
  failCount: number | null
  rows: PeTestDetailRow[]
  pendingNames: string[]
  attention: Array<{ kind: 'pending' | 'absent' | 'fail' | 'declined'; name: string; studentNo: string; note: string }>
}

export function buildPeTestClosure(options: {
  session: PETestSession
  allSessions: ReadonlyArray<PETestSession>
  testItem: TestItem | undefined
  classes: ReadonlyArray<ClassRecord>
  standards?: ReadonlyArray<ExamStandard>
}): PeTestClosure {
  const standards = options.standards ?? listBuiltinExamStandards()
  const summary = summarizeSingleTest(
    options.session,
    options.allSessions,
    options.testItem,
    options.classes,
    standards
  )
  const statuses = summary.statuses
  const processed = statuses.valid + statuses.absent + statuses.exempt + statuses.invalid
  const vsByStudent = new Map(summary.performanceRows.map((item) => [item.studentId, item]))
  const catalog = options.testItem ? [options.testItem, ...BUILTIN_TEST_ITEMS] : BUILTIN_TEST_ITEMS

  const rows: PeTestDetailRow[] = options.session.records.map((record) => {
    const vs = vsByStudent.get(record.studentId)
    const full =
      record.examScore === null ? null : resolveExamItemFullScore(options.session, record, standards)
    const isFail =
      record.examScore !== null && full !== null && classifyScoreBand(record.examScore, full) === 'improve'
    const actual = resolveActualTestItem(options.session, record, catalog)
    const resolvedItem = actual.ok ? actual.item : options.testItem
    const rawText =
      record.status === 'absent' || record.status === 'exempt' || record.status === 'pending' || record.rawValue === null
        ? '——'
        : formatTestScore(record.rawValue, options.session, resolvedItem)
    const statusLabel =
      record.status === 'pending'
        ? '未测'
        : record.status === 'absent'
          ? '缺考'
          : record.status === 'exempt'
            ? '免考'
            : record.status === 'invalid'
              ? '异常'
              : isBelowOfficialMinimumRecord(record)
                ? '无官方分值'
                : '正常'
    return {
      record,
      rawText,
      scoreText: formatPeTestItemScoreText(record),
      baseText: record.baseScore === null || record.baseScore === undefined ? '—' : String(record.baseScore),
      bonusText: (record.bonusScore ?? 0) > 0 ? `+${record.bonusScore}` : '—',
      statusLabel,
      vsText: vs?.vsText ?? '—',
      vsKind: vs?.vsKind ?? 'incomparable',
      isFail,
      resolvedItemName: actualTestItemName(options.session, record, catalog)
    }
  })

  const failCount = summary.bands ? summary.bands.counts.improve : null
  const passCount = summary.bands
    ? summary.bands.counts.excellent + summary.bands.counts.good + summary.bands.counts.fair + summary.bands.counts.pass
    : null
  const excellentCount = summary.bands ? summary.bands.counts.excellent : null

  const attention: PeTestClosure['attention'] = []
  for (const row of rows) {
    if (row.record.status === 'pending') {
      attention.push({
        kind: 'pending',
        name: row.record.nameSnapshot,
        studentNo: row.record.studentNoSnapshot,
        note: '未测'
      })
    } else if (row.record.status === 'absent') {
      attention.push({
        kind: 'absent',
        name: row.record.nameSnapshot,
        studentNo: row.record.studentNoSnapshot,
        note: '缺考'
      })
    } else if (row.isFail) {
      attention.push({
        kind: 'fail',
        name: row.record.nameSnapshot,
        studentNo: row.record.studentNoSnapshot,
        note: '不及格'
      })
    } else if (row.vsKind === 'declined') {
      attention.push({
        kind: 'declined',
        name: row.record.nameSnapshot,
        studentNo: row.record.studentNoSnapshot,
        note: `相比上次 ${row.vsText}`
      })
    }
  }

  return {
    sessionId: options.session.id,
    classLabel: summary.classLabel,
    date: summary.date,
    itemName: sessionDisplayItemName(options.session),
    standardLabel: classroomScoringLabel(options.session),
    roster: summary.rosterCount,
    valid: statuses.valid,
    absent: statuses.absent,
    exempt: statuses.exempt,
    pending: statuses.pending,
    invalid: statuses.invalid,
    processed,
    complete: statuses.pending === 0 && summary.rosterCount > 0,
    summary,
    passCount,
    excellentCount,
    failCount,
    rows,
    pendingNames: rows.filter((item) => item.record.status === 'pending').map((item) => item.record.nameSnapshot),
    attention
  }
}

export function filterPeTestDetailRows(
  rows: ReadonlyArray<PeTestDetailRow>,
  filter: PeTestDetailFilter,
  query: string
): PeTestDetailRow[] {
  return rows.filter((row) => {
    if (!recordMatchesSearch(row.record, query)) {
      return false
    }
    if (filter === 'all') {
      return true
    }
    if (filter === 'fail') {
      return row.isFail
    }
    return row.record.status === filter
  })
}

export function canMarkTestComplete(closure: Pick<PeTestClosure, 'pending'>): boolean {
  return closure.pending === 0
}
