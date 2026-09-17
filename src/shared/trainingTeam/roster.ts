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

export function classLabelOf(classes: ReadonlyArray<ClassRecord>, classId: string): string {
  const match = classes.find((item) => item.id === classId)
  return match ? `${match.grade} ${match.className}` : ''
}

export function schoolWideActiveStudents(students: ReadonlyArray<StudentRecord>): StudentRecord[] {
  return students.filter((student) => student.status === 'active')
}

export function filterSchoolWideStudents(
  students: ReadonlyArray<StudentRecord>,
  options: { classId?: string; query?: string } = {}
): StudentRecord[] {
  const classId = options.classId && options.classId !== 'all' ? options.classId : ''
  const query = (options.query ?? '').trim()
  return schoolWideActiveStudents(students).filter((student) => {
    if (classId && student.classId !== classId) {
      return false
    }
    if (query === '') {
      return true
    }
    return student.name.includes(query) || (student.studentNo !== '' && student.studentNo.includes(query))
  })
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
  return teams.filter((item) => item.parentTeamId === parentId && item.status !== 'deleted')
}

export function isListedTrainingTeam(team: Pick<TrainingTeam, 'status'>): boolean {
  return team.status !== 'deleted'
}

/** 默认训练列表：仅正常启用队伍。停用队进入「已停用」区，不等于 deleted。 */
export function isActiveTrainingTeam(team: Pick<TrainingTeam, 'status'>): boolean {
  return team.status === 'active'
}

export function isArchivedTrainingTeam(team: Pick<TrainingTeam, 'status'>): boolean {
  return team.status === 'archived'
}

export function canMutateTrainingTeam(team: Pick<TrainingTeam, 'status'>): boolean {
  return team.status === 'active'
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
  const scoped = sessions.filter((item) => item.teamId === teamId)
  if (scoped.length === 0) {
    return null
  }
  return scoped.slice().sort((a, b) => {
    const byDate = b.date.localeCompare(a.date)
    if (byDate !== 0) {
      return byDate
    }
    const byStart = (b.startTime || '').localeCompare(a.startTime || '')
    if (byStart !== 0) {
      return byStart
    }
    return b.updatedAt.localeCompare(a.updatedAt) || b.id.localeCompare(a.id)
  })[0]
}

export function attentionFromLatestSession(session: TrainingSession | null): TrainingAttendance[] {
  if (!session) {
    return []
  }
  return session.attendance.filter(needsAttention)
}
