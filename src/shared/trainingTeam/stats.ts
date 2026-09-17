import { formatRawValue, testUnitDisplay, usesMinuteFormat } from '../peTest'
import type { TrainingAttendance, TrainingResult, TrainingSession, TrainingTeamMember } from './types'
import { isActiveMembership } from './roster'

export function isPresent(row: TrainingAttendance): boolean {
  return row.participation !== 'absent'
}

export function formatTrainingScore(result: Pick<TrainingResult, 'rawValue' | 'valueTypeSnapshot' | 'timeInputModeSnapshot' | 'decimalPlacesSnapshot'>): string {
  const preferMinute = usesMinuteFormat(result.timeInputModeSnapshot, result.valueTypeSnapshot)
  return formatRawValue(result.rawValue, result.valueTypeSnapshot, result.decimalPlacesSnapshot, preferMinute)
}

export function formatTrainingScoreWithUnit(
  result: Pick<
    TrainingResult,
    'rawValue' | 'valueTypeSnapshot' | 'timeInputModeSnapshot' | 'decimalPlacesSnapshot' | 'unitSnapshot' | 'customUnitLabelSnapshot'
  >
): string {
  return `${formatTrainingScore(result)} ${testUnitDisplay(result.unitSnapshot, result.customUnitLabelSnapshot)}`.trim()
}

export function validResultsForStudentItem(
  results: ReadonlyArray<TrainingResult>,
  studentId: string,
  itemId: string
): TrainingResult[] {
  return results
    .filter((item) => item.studentId === studentId && item.itemId === itemId && item.status === 'valid')
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
}

export function personalBest(results: ReadonlyArray<TrainingResult>): TrainingResult | null {
  const valid = results.filter((item) => item.status === 'valid')
  if (valid.length === 0) {
    return null
  }
  const direction = valid[0].directionSnapshot
  if (direction === 'neutral') {
    return null
  }
  return valid.reduce((best, item) => {
    if (direction === 'lowerBetter') {
      return item.rawValue < best.rawValue ? item : best
    }
    return item.rawValue > best.rawValue ? item : best
  })
}

export function firstResult(results: ReadonlyArray<TrainingResult>): TrainingResult | null {
  const valid = validChronological(results)
  return valid[0] ?? null
}

export function latestResult(results: ReadonlyArray<TrainingResult>): TrainingResult | null {
  const valid = validChronological(results)
  return valid.length === 0 ? null : valid[valid.length - 1]
}

function validChronological(results: ReadonlyArray<TrainingResult>): TrainingResult[] {
  return results
    .filter((item) => item.status === 'valid')
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
}

export function compareToPreviousResult(
  current: TrainingResult,
  previous: TrainingResult | null
): { kind: 'improved' | 'declined' | 'same'; text: string } | null {
  if (!previous) {
    return null
  }
  if (current.directionSnapshot === 'neutral') {
    return null
  }
  const delta = current.rawValue - previous.rawValue
  if (delta === 0) {
    return { kind: 'same', text: '与上次持平' }
  }
  const improved = current.directionSnapshot === 'higherBetter' ? delta > 0 : delta < 0
  return {
    kind: improved ? 'improved' : 'declined',
    text: improved ? '比上次提高' : '比上次下降'
  }
}

export interface AthleteSessionStats {
  sessionCount: number
  presentCount: number
  absentCount: number
  attendanceRate: number | null
}

export function summarizeAthleteSessions(
  sessions: ReadonlyArray<TrainingSession>,
  studentId: string,
  teamId?: string
): AthleteSessionStats {
  const scoped = teamId ? sessions.filter((item) => item.teamId === teamId) : sessions
  const attended = scoped.filter((session) => session.attendance.some((row) => row.studentId === studentId))
  const presentCount = attended.filter((session) => {
    const row = session.attendance.find((item) => item.studentId === studentId)
    return row ? isPresent(row) : false
  }).length
  const sessionCount = attended.length
  const absentCount = sessionCount - presentCount
  return {
    sessionCount,
    presentCount,
    absentCount,
    attendanceRate: sessionCount === 0 ? null : presentCount / sessionCount
  }
}

export interface TeamOverviewStats {
  sessionCount: number
  currentMemberCount: number
  recentPresentPersonTimes: number
  recentAbsentPersonTimes: number
}

export function summarizeTeam(
  teamId: string,
  members: ReadonlyArray<TrainingTeamMember>,
  sessions: ReadonlyArray<TrainingSession>,
  currentStudentIds: ReadonlySet<string>
): TeamOverviewStats {
  const teamSessions = sessions.filter((item) => item.teamId === teamId)
  const currentMemberCount = members.filter(
    (item) => item.teamId === teamId && isActiveMembership(item) && currentStudentIds.has(item.studentId)
  ).length
  const recent = teamSessions.slice(0, 5)
  let recentPresentPersonTimes = 0
  let recentAbsentPersonTimes = 0
  for (const session of recent) {
    for (const row of session.attendance) {
      if (isPresent(row)) {
        recentPresentPersonTimes += 1
      } else {
        recentAbsentPersonTimes += 1
      }
    }
  }
  return {
    sessionCount: teamSessions.length,
    currentMemberCount,
    recentPresentPersonTimes,
    recentAbsentPersonTimes
  }
}

export function latestSessionDateForStudent(sessions: ReadonlyArray<TrainingSession>, studentId: string): string | null {
  const match = sessions
    .filter((session) => session.attendance.some((row) => row.studentId === studentId))
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || (b.startTime || '').localeCompare(a.startTime || '') || b.updatedAt.localeCompare(a.updatedAt))
  return match[0]?.date ?? null
}

export interface TrainingTeamItemStats {
  itemId: string
  itemName: string
  resultCount: number
  latestResult: TrainingResult | null
}

export interface TrainingTeamMemberStats {
  memberId: string
  teamId: string
  studentId: string
  isCurrentMember: boolean
  joinedAt: string
  leftAt: string | null
  trainingSessionCount: number
  presentSessionCount: number
  latestSessionDate: string | null
  scoredSessionCount: number
  resultCount: number
  sessionLinkedResultCount: number
  independentResultCount: number
  latestResult: TrainingResult | null
}

export interface TrainingTeamStats {
  teamId: string
  activeMemberCount: number
  historicalMemberCount: number
  totalMemberCount: number
  sessionCount: number
  /** TrainingSession 是已发生记录，不是课表计划，因此均视为已完成训练记录。 */
  completedSessionCount: number
  latestSessionDate: string | null
  resultCount: number
  sessionLinkedResultCount: number
  independentResultCount: number
  latestResult: TrainingResult | null
  itemStats: TrainingTeamItemStats[]
  memberStats: TrainingTeamMemberStats[]
}

/**
 * 训练队成绩归属：
 * - session-linked 只认 sessionId -> TrainingSession.teamId；
 * - independent 只认结果自身显式 teamId；
 * - 丢失 session 的 linked result 不猜测归属。
 */
export function trainingResultsForTeam(
  teamId: string,
  sessions: ReadonlyArray<TrainingSession>,
  results: ReadonlyArray<TrainingResult>
): TrainingResult[] {
  const sessionTeamById = new Map(sessions.map((session) => [session.id, session.teamId]))
  return results.filter((result) =>
    result.sessionId === null
      ? result.teamId === teamId
      : sessionTeamById.get(result.sessionId) === teamId
  )
}

function latestSessionDate(sessions: ReadonlyArray<TrainingSession>): string | null {
  const latest = sessions
    .slice()
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        (b.startTime || '').localeCompare(a.startTime || '') ||
        b.updatedAt.localeCompare(a.updatedAt) ||
        b.id.localeCompare(a.id)
    )[0]
  return latest?.date ?? null
}

export function buildTrainingTeamMemberStats(
  member: TrainingTeamMember,
  sessions: ReadonlyArray<TrainingSession>,
  results: ReadonlyArray<TrainingResult>
): TrainingTeamMemberStats {
  const teamSessions = sessions.filter((session) => session.teamId === member.teamId)
  const attendedSessions = teamSessions.filter((session) =>
    session.attendance.some((row) => row.studentId === member.studentId)
  )
  const presentSessionCount = attendedSessions.filter((session) => {
    const attendance = session.attendance.find((row) => row.studentId === member.studentId)
    return attendance ? isPresent(attendance) : false
  }).length
  const teamResults = trainingResultsForTeam(member.teamId, sessions, results).filter(
    (result) => result.studentId === member.studentId
  )
  const linkedResults = teamResults.filter((result) => result.sessionId !== null)
  const independentResults = teamResults.filter((result) => result.sessionId === null)
  return {
    memberId: member.id,
    teamId: member.teamId,
    studentId: member.studentId,
    isCurrentMember: isActiveMembership(member),
    joinedAt: member.joinedAt,
    leftAt: member.leftAt,
    trainingSessionCount: attendedSessions.length,
    presentSessionCount,
    latestSessionDate: latestSessionDate(attendedSessions),
    scoredSessionCount: new Set(linkedResults.map((result) => result.sessionId)).size,
    resultCount: teamResults.length,
    sessionLinkedResultCount: linkedResults.length,
    independentResultCount: independentResults.length,
    latestResult: latestResult(teamResults)
  }
}

export function buildTrainingTeamStats(
  teamId: string,
  members: ReadonlyArray<TrainingTeamMember>,
  sessions: ReadonlyArray<TrainingSession>,
  results: ReadonlyArray<TrainingResult>
): TrainingTeamStats {
  const teamMembers = members.filter((member) => member.teamId === teamId)
  const teamSessions = sessions.filter((session) => session.teamId === teamId)
  const teamResults = trainingResultsForTeam(teamId, sessions, results)
  const linkedResults = teamResults.filter((result) => result.sessionId !== null)
  const independentResults = teamResults.filter((result) => result.sessionId === null)
  const byItem = new Map<string, TrainingResult[]>()
  for (const result of teamResults) {
    const rows = byItem.get(result.itemId) ?? []
    rows.push(result)
    byItem.set(result.itemId, rows)
  }
  return {
    teamId,
    activeMemberCount: teamMembers.filter(isActiveMembership).length,
    historicalMemberCount: teamMembers.filter((member) => !isActiveMembership(member)).length,
    totalMemberCount: teamMembers.length,
    sessionCount: teamSessions.length,
    completedSessionCount: teamSessions.length,
    latestSessionDate: latestSessionDate(teamSessions),
    resultCount: teamResults.length,
    sessionLinkedResultCount: linkedResults.length,
    independentResultCount: independentResults.length,
    latestResult: latestResult(teamResults),
    itemStats: [...byItem.entries()]
      .map(([itemId, itemResults]) => ({
        itemId,
        itemName: itemResults[0]?.itemNameSnapshot ?? '',
        resultCount: itemResults.length,
        latestResult: latestResult(itemResults)
      }))
      .sort((a, b) => b.resultCount - a.resultCount || a.itemName.localeCompare(b.itemName)),
    memberStats: teamMembers.map((member) =>
      buildTrainingTeamMemberStats(member, sessions, results)
    )
  }
}
