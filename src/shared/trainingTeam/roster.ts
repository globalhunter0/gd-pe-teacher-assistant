import type { ClassRecord } from '../class/types'
import type { StudentRecord } from '../student/types'
import type { TrainingAttendance, TrainingSession, TrainingTeam, TrainingTeamMember } from './types'

export function isActiveMembership(member: TrainingTeamMember): boolean {
  return member.status === 'active' && member.leftAt === null
}

export function hasActiveMembership(members: ReadonlyArray<TrainingTeamMember>, teamId: string, studentId: string): boolean {
  return members.some((item) => item.teamId === teamId && item.studentId === studentId && isActiveMembership(item))
}

export function classNameOf(classes: ReadonlyArray<ClassRecord>, classId: string): string {
  return classes.find((item) => item.id === classId)?.className ?? ''
}

export function activeMembersOfTeam(members: ReadonlyArray<TrainingTeamMember>, teamId: string): TrainingTeamMember[] {
  return members.filter((item) => item.teamId === teamId && isActiveMembership(item))
}

export function currentRosterStudents(
  teamId: string,
  members: ReadonlyArray<TrainingTeamMember>,
  students: ReadonlyArray<StudentRecord>
): StudentRecord[] {
  const activeIds = new Set(activeMembersOfTeam(members, teamId).map((item) => item.studentId))
  return students.filter((student) => student.status === 'active' && activeIds.has(student.id))
}

export function currentMemberCount(
  teamId: string,
  members: ReadonlyArray<TrainingTeamMember>,
  students: ReadonlyArray<StudentRecord>
): number {
  return currentRosterStudents(teamId, members, students).length
}

export function childTeams(teams: ReadonlyArray<TrainingTeam>, parentId: string): TrainingTeam[] {
  return teams.filter((item) => item.parentTeamId === parentId)
}

export function teamDisplayPath(teams: ReadonlyArray<TrainingTeam>, team: TrainingTeam): string {
  if (!team.parentTeamId) {
    return team.name
  }
  const parent = teams.find((item) => item.id === team.parentTeamId)
  return parent ? `${parent.name} / ${team.name}` : team.name
}

export function presentAttendance(rows: ReadonlyArray<TrainingAttendance>): TrainingAttendance[] {
  return rows.filter((row) => row.participation !== 'absent')
}

export function needsAttention(row: TrainingAttendance): boolean {
  return row.participation !== 'normal'
}

export function latestSessionForTeam(sessions: ReadonlyArray<TrainingSession>, teamId: string): TrainingSession | null {
  return sessions.find((item) => item.teamId === teamId) ?? null
}

export function attentionFromLatestSession(session: TrainingSession | null): TrainingAttendance[] {
  if (!session) {
    return []
  }
  return session.attendance.filter(needsAttention)
}
