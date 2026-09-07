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
  const match = sessions.find((session) => session.attendance.some((row) => row.studentId === studentId))
  return match?.date ?? null
}
