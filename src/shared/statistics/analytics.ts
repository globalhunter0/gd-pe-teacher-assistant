import { listBuiltinExamStandards } from '../examStandard/catalog'
import type { ExamStandard } from '../examStandard/types'
import type { ClassRecord } from '../class/types'
import { isNationalFitnessStandardId } from '../nationalFitness/catalog'
import {
  classroomScoringLabel,
  compareToPrevious,
  countBelowOfficialMinimum,
  formatPeTestItemScoreText,
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
import { STUDENT_GENDER_LABELS, type StudentRecord } from '../student'
import { classDisplayName } from './students'
import { actualTestItemName, isGenderLinkedSession, recordsForActualTestItem, resolvedTestItemIdOf, sessionDisplayItemName } from '../peTest/groupedItems'
import { averageRaw, bestRaw, countTestStatuses, formatTestScore, formatTestScoreWithUnit, validRawValues } from './tests'

export type VsPreviousKind = 'improved' | 'declined' | 'same' | 'first' | 'incomparable'

export type ScoreBandId = 'excellent' | 'good' | 'fair' | 'pass' | 'improve'

export const SCORE_BAND_LABELS: Record<ScoreBandId, string> = {
  excellent: '优秀',
  good: '良好',
  fair: '中等',
  pass: '及格',
  improve: '待提升'
}

export type AttentionKind = 'watch' | 'progress' | 'personalBest' | 'sparse'

export const ATTENTION_KIND_LABELS: Record<AttentionKind, string> = {
  watch: '建议关注',
  progress: '近期进步',
  personalBest: '刷新个人最佳',
  sparse: '近期测试较少'
}

export interface IndexedPeTests {
  sessions: ReadonlyArray<PETestSession>
  byStudentId: Map<string, PETestSession[]>
  byClassId: Map<string, PETestSession[]>
  byItemId: Map<string, PETestSession[]>
}

export function indexPeTests(sessions: ReadonlyArray<PETestSession>): IndexedPeTests {
  const byStudentId = new Map<string, PETestSession[]>()
  const byClassId = new Map<string, PETestSession[]>()
  const byItemId = new Map<string, PETestSession[]>()

  function push(map: Map<string, PETestSession[]>, key: string, session: PETestSession): void {
    const list = map.get(key)
    if (list) {
      list.push(session)
    } else {
      map.set(key, [session])
    }
  }

  for (const session of sessions) {
    push(byClassId, session.classId, session)
    push(byItemId, session.testItemId, session)
    const seen = new Set<string>()
    for (const record of session.records) {
      if (seen.has(record.studentId)) {
        continue
      }
      seen.add(record.studentId)
      push(byStudentId, record.studentId, session)
    }
  }

  return { sessions, byStudentId, byClassId, byItemId }
}

export function sortSessionsAsc(sessions: ReadonlyArray<PETestSession>): PETestSession[] {
  return [...sessions].sort(
    (a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
  )
}

function studentRecordIn(session: PETestSession, studentId: string): PETestRecord | undefined {
  return session.records.find((item) => item.studentId === studentId)
}

function isValidRaw(record: Pick<PETestRecord, 'status' | 'rawValue'> | undefined): record is PETestRecord & { rawValue: number } {
  return Boolean(record && record.status === 'valid' && record.rawValue !== null)
}

export function formatExamScore(score: number | null | undefined): string {
  if (score === null || score === undefined) {
    return '—'
  }
  return Number.isInteger(score) ? String(score) : score.toFixed(2)
}

export function resolveExamItemFullScore(
  session: Pick<PETestSession, 'examStandardId' | 'testItemId'>,
  record: Pick<PETestRecord, 'examItemId'>,
  standards: ReadonlyArray<ExamStandard> = listBuiltinExamStandards()
): number | null {
  if (!session.examStandardId) {
    return null
  }
  if (isNationalFitnessStandardId(session.examStandardId)) {
    return 100
  }
  const standard = standards.find((item) => item.id === session.examStandardId)
  if (!standard) {
    return null
  }

  const byId = record.examItemId ? standard.items.find((item) => item.id === record.examItemId) : undefined
  if (byId) {
    const max = Math.min(byId.maxScore, byId.scoreRule.maxScore)
    return Number.isFinite(max) && max > 0 ? max : null
  }

  const matched = standard.items.filter((item) => item.testItemId === session.testItemId)
  if (matched.length === 0) {
    return null
  }
  const scores = [...new Set(matched.map((item) => Math.min(item.maxScore, item.scoreRule.maxScore)))]
  if (scores.length !== 1) {
    return null
  }
  const max = scores[0]
  return Number.isFinite(max) && max > 0 ? max : null
}

export function classifyScoreBand(score: number, fullScore: number): ScoreBandId {
  const ratio = score / fullScore
  if (ratio >= 0.9) {
    return 'excellent'
  }
  if (ratio >= 0.8) {
    return 'good'
  }
  if (ratio >= 0.7) {
    return 'fair'
  }
  if (ratio >= 0.6) {
    return 'pass'
  }
  return 'improve'
}

export function scoreBandRangeLabel(fullScore: number, band: ScoreBandId): string {
  const cut = (ratio: number): string => {
    const value = fullScore * ratio
    return Number.isInteger(value) ? String(value) : value.toFixed(1)
  }
  if (band === 'excellent') {
    return `≥${cut(0.9)}分`
  }
  if (band === 'good') {
    return `${cut(0.8)}–${cut(0.9)}分`
  }
  if (band === 'fair') {
    return `${cut(0.7)}–${cut(0.8)}分`
  }
  if (band === 'pass') {
    return `${cut(0.6)}–${cut(0.7)}分`
  }
  return `<${cut(0.6)}分`
}

function previousValidBeforeDate(
  sessions: ReadonlyArray<PETestSession>,
  studentId: string,
  testItemId: string,
  testDate: string
): { session: PETestSession; record: PETestRecord & { rawValue: number } } | null {
  const previous = sortSessionsAsc(sessions)
    .filter((item) => item.date < testDate)
    .reverse()
  for (const session of previous) {
    const record = studentRecordIn(session, studentId)
    if (isValidRaw(record) && resolvedTestItemIdOf(record, session) === testItemId) {
      return { session, record }
    }
  }
  return null
}

export function compareWithPreviousResult(
  current: PETestSession,
  studentId: string,
  allSessions: ReadonlyArray<PETestSession>
): {
  kind: VsPreviousKind
  deltaRaw: number | null
  previousRaw: number | null
  currentRaw: number | null
  text: string
} {
  const record = studentRecordIn(current, studentId)
  if (!isValidRaw(record)) {
    return { kind: 'incomparable', deltaRaw: null, previousRaw: null, currentRaw: record?.rawValue ?? null, text: '不可比较' }
  }
  if (current.directionSnapshot === 'neutral') {
    return { kind: 'incomparable', deltaRaw: null, previousRaw: null, currentRaw: record.rawValue, text: '不可比较' }
  }

  const itemId = resolvedTestItemIdOf(record, current)
  if (!itemId) {
    return { kind: 'incomparable', deltaRaw: null, previousRaw: null, currentRaw: record.rawValue, text: '不可比较' }
  }

  const previous = previousValidBeforeDate(
    allSessions,
    studentId,
    itemId,
    current.date
  )
  if (!previous) {
    return { kind: 'first', deltaRaw: null, previousRaw: null, currentRaw: record.rawValue, text: '首次测试' }
  }

  const testItemPlaceholder = { timeInputMode: current.timeInputModeSnapshot, builtinKey: null }
  const preferMinute = usesMinuteFormat(resolveTimeInputMode(testItemPlaceholder, current.timeInputModeSnapshot), current.valueTypeSnapshot)
  const decimalPlaces = current.valueTypeSnapshot === 'time' ? 1 : 0
  const compared = compareToPrevious(
    record.rawValue,
    previous.record.rawValue,
    current.directionSnapshot,
    current.valueTypeSnapshot,
    decimalPlaces,
    preferMinute,
    testUnitDisplay(current.unitSnapshot, current.customUnitLabelSnapshot)
  )
  return {
    kind: compared?.kind ?? 'incomparable',
    deltaRaw: record.rawValue - previous.record.rawValue,
    previousRaw: previous.record.rawValue,
    currentRaw: record.rawValue,
    text: compared?.text ?? '不可比较'
  }
}

export function detectPersonalBest(
  current: PETestSession,
  studentId: string,
  allSessions: ReadonlyArray<PETestSession>
): boolean {
  if (current.directionSnapshot === 'neutral') {
    return false
  }
  const record = studentRecordIn(current, studentId)
  if (!isValidRaw(record)) {
    return false
  }
  const itemId = resolvedTestItemIdOf(record, current)
  if (!itemId) {
    return false
  }
  const previousValues = allSessions
    .filter((item) => item.id !== current.id)
    .flatMap((item) => {
      const match = studentRecordIn(item, studentId)
      return isValidRaw(match) && resolvedTestItemIdOf(match, item) === itemId ? [match.rawValue] : []
    })
  if (previousValues.length === 0) {
    return false
  }
  const previousBest = bestRaw(previousValues, current.directionSnapshot)
  if (previousBest === null) {
    return false
  }
  return current.directionSnapshot === 'higherBetter' ? record.rawValue > previousBest : record.rawValue < previousBest
}

export function detectScoringStandardChange(sessions: ReadonlyArray<Pick<PETestSession, 'examStandardId' | 'scoringVersionSnapshot'>>): boolean {
  const keys = new Set(
    sessions
      .map((item) => `${item.examStandardId ?? ''}|${item.scoringVersionSnapshot}`)
      .filter((item) => item !== '|')
  )
  const hasEmpty = sessions.some((item) => !item.examStandardId && item.scoringVersionSnapshot === '')
  const hasFilled = sessions.some((item) => Boolean(item.examStandardId) || item.scoringVersionSnapshot !== '')
  if (keys.size > 1) {
    return true
  }
  return hasEmpty && hasFilled
}

export interface StudentItemHistoryPoint {
  sessionId: string
  date: string
  createdAt: string
  title: string
  status: TestRecordStatus
  rawValue: number | null
  examScore: number | null
  baseScore: number | null
  bonusScore: number | null
  gradeSnapshot: PETestSession['gradeSnapshot']
  actualItemName: string
  rawText: string
  scoreText: string
  standardLabel: string
  isPersonalBest: boolean
  vsPrevious: ReturnType<typeof compareWithPreviousResult>
}

export interface StudentItemHistory {
  testItemId: string
  name: string
  direction: TestDirection
  testCount: number
  validCount: number
  recentRawText: string
  recentScoreText: string
  bestRawText: string
  firstRawText: string
  vsFirstText: string
  vsFirstKind: VsPreviousKind | null
  scoringStandardChanged: boolean
  points: StudentItemHistoryPoint[]
}

export function buildStudentItemHistory(
  sessions: ReadonlyArray<PETestSession>,
  studentId: string,
  testItemId: string,
  testItems: ReadonlyArray<TestItem>
): StudentItemHistory | null {
  const itemSessions = sortSessionsAsc(
    sessions.filter((session) => {
      const record = studentRecordIn(session, studentId)
      return Boolean(record && resolvedTestItemIdOf(record, session, testItems) === testItemId)
    })
  )
  if (itemSessions.length === 0) {
    return null
  }
  const sample = itemSessions[itemSessions.length - 1]
  const testItem = testItems.find((item) => item.id === testItemId)
  const sampleRecord = studentRecordIn(sample, studentId)
  const name =
    testItem?.name ??
    (sampleRecord ? actualTestItemName(sample, sampleRecord, testItems) : sample.testItemNameSnapshot)
  const points: StudentItemHistoryPoint[] = itemSessions.map((session) => {
    const record = studentRecordIn(session, studentId)!
    return {
      sessionId: session.id,
      date: session.date,
      createdAt: session.createdAt,
      title: session.title,
      status: record.status,
      rawValue: record.rawValue,
      examScore: record.examScore,
      baseScore: record.baseScore ?? null,
      bonusScore: record.bonusScore ?? null,
      gradeSnapshot: session.gradeSnapshot,
      actualItemName: actualTestItemName(session, record, testItems),
      rawText: record.status === 'valid' ? formatTestScoreWithUnit(record.rawValue, session, testItem) : '—',
      scoreText: formatPeTestItemScoreText(record),
      standardLabel: classroomScoringLabel(session),
      isPersonalBest: detectPersonalBest(session, studentId, sessions),
      vsPrevious: compareWithPreviousResult(session, studentId, sessions)
    }
  })
  const valid = points.filter((item) => item.status === 'valid' && item.rawValue !== null)
  const first = valid[0]
  const recent = valid[valid.length - 1]
  const values = valid.map((item) => item.rawValue as number)
  const best = bestRaw(values, sample.directionSnapshot)
  const preferMinute = usesMinuteFormat(sample.timeInputModeSnapshot, sample.valueTypeSnapshot)
  const vsFirstCompared =
    first && recent && first.sessionId !== recent.sessionId && sample.directionSnapshot !== 'neutral'
      ? compareToPrevious(
          recent.rawValue as number,
          first.rawValue as number,
          sample.directionSnapshot,
          sample.valueTypeSnapshot,
          testItem?.decimalPlaces ?? (sample.valueTypeSnapshot === 'time' ? 1 : 0),
          preferMinute,
          testUnitDisplay(sample.unitSnapshot, sample.customUnitLabelSnapshot)
        )
      : null

  let vsFirstText = '—'
  let vsFirstKind: VsPreviousKind | null = null
  if (sample.directionSnapshot === 'neutral') {
    vsFirstText = '不比较'
  } else if (valid.length === 1) {
    vsFirstText = '首次测试'
    vsFirstKind = 'first'
  } else if (vsFirstCompared) {
    vsFirstText = vsFirstCompared.text
    vsFirstKind = vsFirstCompared.kind
  }

  return {
    testItemId,
    name,
    direction: sample.directionSnapshot,
    testCount: itemSessions.length,
    validCount: valid.length,
    recentRawText: recent ? recent.rawText : '—',
    recentScoreText: recent ? recent.scoreText : '—',
    bestRawText: best === null ? '—' : formatTestScoreWithUnit(best, sample, testItem),
    firstRawText: first ? first.rawText : '—',
    vsFirstText,
    vsFirstKind,
    scoringStandardChanged: detectScoringStandardChange(itemSessions),
    points
  }
}

export interface StudentGrowthView {
  studentId: string
  name: string
  studentNo: string
  genderLabel: string
  classLabel: string
  isHistorical: boolean
  sessionCount: number
  itemCount: number
  validCount: number
  absentCount: number
  exemptCount: number
  items: StudentItemHistory[]
}

export function summarizeStudentGrowth(
  sessions: ReadonlyArray<PETestSession>,
  studentId: string,
  testItems: ReadonlyArray<TestItem>,
  students: ReadonlyArray<StudentRecord>,
  classes: ReadonlyArray<ClassRecord>,
  index: IndexedPeTests = indexPeTests(sessions)
): StudentGrowthView | null {
  const related = sortSessionsAsc(index.byStudentId.get(studentId) ?? sessions.filter((item) => item.records.some((row) => row.studentId === studentId)))
  if (related.length === 0) {
    return null
  }
  const live = students.find((item) => item.id === studentId && item.status !== 'deleted')
  const latest = related[related.length - 1]
  const snapshot = studentRecordIn(latest, studentId)
  const itemIds = [
    ...new Set(
      related.flatMap((session) => {
        const record = studentRecordIn(session, studentId)
        const actualId = record ? resolvedTestItemIdOf(record, session, testItems) : null
        return actualId ? [actualId] : []
      })
    )
  ]
  let validCount = 0
  let absentCount = 0
  let exemptCount = 0
  for (const session of related) {
    const record = studentRecordIn(session, studentId)
    if (record?.status === 'valid') {
      validCount += 1
    } else if (record?.status === 'absent') {
      absentCount += 1
    } else if (record?.status === 'exempt') {
      exemptCount += 1
    }
  }

  return {
    studentId,
    name: live?.name || snapshot?.nameSnapshot || '未填写姓名',
    studentNo: live?.studentNo || snapshot?.studentNoSnapshot || '',
    genderLabel: STUDENT_GENDER_LABELS[live?.gender ?? snapshot?.genderSnapshot ?? 'unspecified'],
    classLabel: live
      ? classDisplayName(classes, live.classId)
      : classDisplayName(classes, latest.classId, latest),
    isHistorical: !live,
    sessionCount: related.length,
    itemCount: itemIds.length,
    validCount,
    absentCount,
    exemptCount,
    items: itemIds
      .map((itemId) => buildStudentItemHistory(related, studentId, itemId, testItems))
      .filter((item): item is StudentItemHistory => item !== null)
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
  }
}

export interface ScoreBandSummary {
  fullScore: number
  counts: Record<ScoreBandId, number>
  rangeLabels: Record<ScoreBandId, string>
}

export interface SessionPerformanceCounts {
  personalBest: number
  improved: number
  declined: number
  same: number
  first: number
  absent: number
}

export interface SessionPerformanceRow {
  studentId: string
  name: string
  studentNo: string
  isPersonalBest: boolean
  vsKind: VsPreviousKind | 'absent'
  vsText: string
}

export interface SingleTestSummary {
  sessionId: string
  date: string
  title: string
  itemName: string
  classLabel: string
  rosterCount: number
  statuses: Record<TestRecordStatus, number>
  scoredCount: number
  belowOfficialMinimumCount: number
  averageRawText: string
  bestRawText: string
  worstRawText: string
  averageScoreText: string
  maxScoreText: string
  minScoreText: string
  bands: ScoreBandSummary | null
  bandBlockedReason: string | null
  scoringStandardChanged: boolean
  performance: SessionPerformanceCounts
  performanceRows: SessionPerformanceRow[]
}

function worstRaw(values: ReadonlyArray<number>, direction: TestDirection): number | null {
  if (values.length === 0 || direction === 'neutral') {
    return null
  }
  return direction === 'higherBetter' ? Math.min(...values) : Math.max(...values)
}

export function summarizeSingleTest(
  session: PETestSession,
  allSessions: ReadonlyArray<PETestSession>,
  testItem: TestItem | undefined,
  classes: ReadonlyArray<ClassRecord>,
  standards: ReadonlyArray<ExamStandard> = listBuiltinExamStandards()
): SingleTestSummary {
  const statuses = countTestStatuses(session.records)
  const mixedRaw = isGenderLinkedSession(session)
  const values = mixedRaw ? [] : validRawValues(session.records)
  const scores = session.records.map((item) => item.examScore).filter((item): item is number => item !== null)
  const avgScore = averageRaw(scores)
  let bands: ScoreBandSummary | null = null
  let bandBlockedReason: string | null = null
  if (scores.length > 0) {
    const fullScores: number[] = []
    let unresolved = false
    for (const record of session.records) {
      if (record.examScore === null) {
        continue
      }
      const full = resolveExamItemFullScore(session, record, standards)
      if (full === null) {
        unresolved = true
        break
      }
      fullScores.push(full)
    }
    const unique = [...new Set(fullScores)]
    if (unresolved || unique.length !== 1) {
      bandBlockedReason = '当前评分标准无法确认满分，暂不生成分数分布。'
    } else {
      const fullScore = unique[0]
      const counts: Record<ScoreBandId, number> = { excellent: 0, good: 0, fair: 0, pass: 0, improve: 0 }
      for (const record of session.records) {
        if (record.examScore === null) {
          continue
        }
        counts[classifyScoreBand(record.examScore, fullScore)] += 1
      }
      bands = {
        fullScore,
        counts,
        rangeLabels: {
          excellent: scoreBandRangeLabel(fullScore, 'excellent'),
          good: scoreBandRangeLabel(fullScore, 'good'),
          fair: scoreBandRangeLabel(fullScore, 'fair'),
          pass: scoreBandRangeLabel(fullScore, 'pass'),
          improve: scoreBandRangeLabel(fullScore, 'improve')
        }
      }
    }
  }

  const performance: SessionPerformanceCounts = { personalBest: 0, improved: 0, declined: 0, same: 0, first: 0, absent: 0 }
  const performanceRows: SessionPerformanceRow[] = session.records.map((record) => {
    if (record.status === 'absent') {
      performance.absent += 1
      return {
        studentId: record.studentId,
        name: record.nameSnapshot,
        studentNo: record.studentNoSnapshot,
        isPersonalBest: false,
        vsKind: 'absent',
        vsText: '缺考'
      }
    }
    const vs = compareWithPreviousResult(session, record.studentId, allSessions)
    const isPb = detectPersonalBest(session, record.studentId, allSessions)
    if (isPb) {
      performance.personalBest += 1
    }
    if (vs.kind === 'improved') {
      performance.improved += 1
    } else if (vs.kind === 'declined') {
      performance.declined += 1
    } else if (vs.kind === 'same') {
      performance.same += 1
    } else if (vs.kind === 'first') {
      performance.first += 1
    }
    return {
      studentId: record.studentId,
      name: record.nameSnapshot,
      studentNo: record.studentNoSnapshot,
      isPersonalBest: isPb,
      vsKind: vs.kind,
      vsText: isPb ? `个人最佳${vs.text !== '首次测试' && vs.text !== '不可比较' ? ` · ${vs.text}` : ''}` : vs.text
    }
  })

  const relatedForStandard = allSessions.filter((item) => item.testItemId === session.testItemId && item.classId === session.classId)

  return {
    sessionId: session.id,
    date: session.date,
    title: session.title,
    itemName: sessionDisplayItemName(session),
    classLabel: classDisplayName(classes, session.classId, session),
    rosterCount: session.records.length,
    statuses,
    scoredCount: scores.length,
    belowOfficialMinimumCount: countBelowOfficialMinimum(session.records),
    averageRawText: formatTestScore(averageRaw(values), session, testItem),
    bestRawText: formatTestScore(bestRaw(values, session.directionSnapshot), session, testItem),
    worstRawText: formatTestScore(worstRaw(values, session.directionSnapshot), session, testItem),
    averageScoreText: formatExamScore(avgScore),
    maxScoreText: scores.length ? formatExamScore(Math.max(...scores)) : '—',
    minScoreText: scores.length ? formatExamScore(Math.min(...scores)) : '—',
    bands,
    bandBlockedReason,
    scoringStandardChanged: detectScoringStandardChange(relatedForStandard),
    performance,
    performanceRows
  }
}

export interface ClassItemTrendPoint {
  sessionId: string
  date: string
  validN: number
  averageRaw: number | null
  averageRawText: string
  averageScore: number | null
  averageScoreText: string
}

export interface ClassItemTrend {
  classId: string
  testItemId: string
  itemName: string
  scoringStandardChanged: boolean
  points: ClassItemTrendPoint[]
}

export function summarizeClassItemTrend(
  sessions: ReadonlyArray<PETestSession>,
  classId: string,
  testItemId: string,
  testItems: ReadonlyArray<TestItem>
): ClassItemTrend {
  const listed = sortSessionsAsc(
    sessions.filter((item) => item.classId === classId && recordsForActualTestItem(item, testItemId, testItems).length > 0)
  )
  const sample = listed[0]
  const testItem = testItems.find((item) => item.id === testItemId)
  return {
    classId,
    testItemId,
    itemName: testItem?.name ?? sample?.testItemNameSnapshot ?? '测试项目',
    scoringStandardChanged: detectScoringStandardChange(listed),
    points: listed.map((session) => {
      const matched = recordsForActualTestItem(session, testItemId, testItems)
      const values = validRawValues(matched)
      const scores = matched.map((item) => item.examScore).filter((item): item is number => item !== null)
      const avgRaw = averageRaw(values)
      const avgScore = averageRaw(scores)
      return {
        sessionId: session.id,
        date: session.date,
        validN: values.length,
        averageRaw: avgRaw,
        averageRawText: values.length === 0 ? '—' : formatTestScore(avgRaw, session, testItem),
        averageScore: avgScore,
        averageScoreText: formatExamScore(avgScore)
      }
    })
  }
}

export interface AttentionSignal {
  studentId: string
  name: string
  kind: AttentionKind
  title: string
  detail: string
}

function validChronology(sessions: ReadonlyArray<PETestSession>, studentId: string, testItemId: string, testItems: ReadonlyArray<TestItem>): Array<{ session: PETestSession; rawValue: number }> {
  return sortSessionsAsc(sessions).flatMap((session) => {
    const record = studentRecordIn(session, studentId)
    if (!isValidRaw(record) || resolvedTestItemIdOf(record, session, testItems) !== testItemId) {
      return []
    }
    return [{ session, rawValue: record.rawValue }]
  })
}

function consecutiveKind(
  points: Array<{ session: PETestSession; rawValue: number }>,
  studentId: string,
  expect: 'improved' | 'declined'
): boolean {
  if (points.length < 3) {
    return false
  }
  const lastThree = points.slice(-3)
  const history = lastThree.map((item) => item.session)
  const a = compareWithPreviousResult(lastThree[1].session, studentId, history)
  const b = compareWithPreviousResult(lastThree[2].session, studentId, history)
  return a.kind === expect && b.kind === expect
}

export function buildStudentAttentionSignals(
  studentId: string,
  sessions: ReadonlyArray<PETestSession>,
  testItems: ReadonlyArray<TestItem>,
  options: { today?: string; index?: IndexedPeTests } = {}
): AttentionSignal[] {
  const index = options.index ?? indexPeTests(sessions)
  const related = sortSessionsAsc(index.byStudentId.get(studentId) ?? [])
  if (related.length === 0) {
    return []
  }
  const latestName = studentRecordIn(related[related.length - 1], studentId)?.nameSnapshot ?? '学生'
  const today = options.today ?? related[related.length - 1]?.date
  const signals: AttentionSignal[] = []
  const itemIds = [
    ...new Set(
      related.flatMap((session) => {
        const record = studentRecordIn(session, studentId)
        const actualId = record ? resolvedTestItemIdOf(record, session, testItems) : null
        return actualId ? [actualId] : []
      })
    )
  ]

  for (const testItemId of itemIds) {
    const points = validChronology(related, studentId, testItemId, testItems)
    const name = testItems.find((item) => item.id === testItemId)?.name ?? '项目'
    const formatPoint = (item: { session: PETestSession; rawValue: number }): string =>
      formatRawValue(
        item.rawValue,
        item.session.valueTypeSnapshot,
        item.session.valueTypeSnapshot === 'time' ? 1 : 0,
        usesMinuteFormat(item.session.timeInputModeSnapshot, item.session.valueTypeSnapshot)
      )
    if (consecutiveKind(points, studentId, 'declined')) {
      const last = points.slice(-3)
      signals.push({
        studentId,
        name: latestName,
        kind: 'watch',
        title: '近期连续退步',
        detail: `${name}最近3次：${last.map(formatPoint).join(' → ')}`
      })
    }
    if (consecutiveKind(points, studentId, 'improved')) {
      const last = points.slice(-3)
      signals.push({
        studentId,
        name: latestName,
        kind: 'progress',
        title: '近期持续进步',
        detail: `${name}最近3次：${last.map(formatPoint).join(' → ')}`
      })
    }
    const latestSession = [...related]
      .reverse()
      .find((item) => {
        const record = studentRecordIn(item, studentId)
        return Boolean(record && resolvedTestItemIdOf(record, item, testItems) === testItemId && isValidRaw(record))
      })
    if (latestSession && detectPersonalBest(latestSession, studentId, related)) {
      signals.push({
        studentId,
        name: latestName,
        kind: 'personalBest',
        title: '刷新个人最佳',
        detail: `${name} ${latestSession.date}`
      })
    }

    const recentItem = related.filter((item) => {
      const record = studentRecordIn(item, studentId)
      return Boolean(record && resolvedTestItemIdOf(record, item, testItems) === testItemId)
    }).slice(-5)
    const absentRecent = recentItem.filter((item) => studentRecordIn(item, studentId)?.status === 'absent').length
    if (absentRecent >= 2) {
      signals.push({
        studentId,
        name: latestName,
        kind: 'watch',
        title: '近期缺考较多',
        detail: `${name}最近${recentItem.length}次中缺考 ${absentRecent} 次`
      })
    }
  }

  const lastValid = [...related].reverse().find((item) => isValidRaw(studentRecordIn(item, studentId)))
  if (!lastValid || (today && lastValid.date < shiftDate(today, -60))) {
    signals.push({
      studentId,
      name: latestName,
      kind: 'sparse',
      title: '近期有效测试较少',
      detail: lastValid ? `最近一次有效成绩在 ${lastValid.date}` : '没有有效测试记录'
    })
  }

  return signals
}

function shiftDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const next = new Date(year, (month ?? 1) - 1, (day ?? 1) + days)
  const y = next.getFullYear()
  const m = String(next.getMonth() + 1).padStart(2, '0')
  const d = String(next.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
