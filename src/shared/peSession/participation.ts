import type { AttendanceStatus, ParticipationStatus, PEStudentRecord } from './types'
import { PARTICIPATION_STATUSES } from './types'

export function parseParticipationStatus(value: unknown): ParticipationStatus {
  if (PARTICIPATION_STATUSES.includes(value as ParticipationStatus)) {
    return value as ParticipationStatus
  }
  return 'normal'
}

/**
 * 有效参与状态：优先读 participationStatus；
 * 旧数据仅 attendanceStatus=observer 时兼容为见习。
 */
export function resolveParticipationStatus(
  record: Pick<PEStudentRecord, 'attendanceStatus' | 'participationStatus'>
): ParticipationStatus {
  if (record.participationStatus !== undefined && record.participationStatus !== null) {
    return parseParticipationStatus(record.participationStatus)
  }
  if (record.attendanceStatus === 'observer') {
    return 'observer'
  }
  return 'normal'
}

/**
 * 有效考勤（到课维度）：旧 observer 视为到课正常，见习改由参与状态表达。
 */
export function resolveAttendancePresence(
  record: Pick<PEStudentRecord, 'attendanceStatus'>
): Exclude<AttendanceStatus, 'observer'> {
  if (record.attendanceStatus === 'observer') {
    return 'normal'
  }
  return record.attendanceStatus
}

export function isAttendanceAway(status: AttendanceStatus): boolean {
  return status === 'absent' || status === 'leave'
}

export function countParticipation(
  records: ReadonlyArray<Pick<PEStudentRecord, 'attendanceStatus' | 'participationStatus'>>
): Record<ParticipationStatus, number> {
  const counts: Record<ParticipationStatus, number> = {
    normal: 0,
    observer: 0,
    unwell: 0,
    injured: 0
  }
  for (const record of records) {
    counts[resolveParticipationStatus(record)] += 1
  }
  return counts
}

/** 课堂列表用：考勤到课 + 参与异常汇总。 */
export function countLessonRosterStats(
  records: ReadonlyArray<Pick<PEStudentRecord, 'attendanceStatus' | 'participationStatus'>>
): {
  normal: number
  absent: number
  leave: number
  late: number
  observer: number
  unwell: number
  injured: number
} {
  const result = {
    normal: 0,
    absent: 0,
    leave: 0,
    late: 0,
    observer: 0,
    unwell: 0,
    injured: 0
  }
  for (const record of records) {
    const presence = resolveAttendancePresence(record)
    result[presence] += 1
    const participation = resolveParticipationStatus(record)
    if (participation === 'observer') {
      result.observer += 1
    } else if (participation === 'unwell') {
      result.unwell += 1
    } else if (participation === 'injured') {
      result.injured += 1
    }
  }
  return result
}
