import { countAttendance, type PEClassSession, type PerformanceTag } from '../peSession'
import { inDateRange, type ResolvedDateRange } from './dateRange'

export function filterLessonsByClass(
  sessions: ReadonlyArray<PEClassSession>,
  classId: string,
  range: ResolvedDateRange
): PEClassSession[] {
  return sessions.filter((item) => item.classId === classId && inDateRange(item.date, range))
}

export function summarizeClassLessons(sessions: ReadonlyArray<PEClassSession>): {
  lessonCount: number
  attendance: ReturnType<typeof countAttendance>
  tags: Record<PerformanceTag, number>
} {
  const attendance = countAttendance([])
  const tags: Record<PerformanceTag, number> = {
    engaged: 0,
    excellent: 0,
    improved: 0,
    discipline: 0,
    unequipped: 0
  }

  for (const session of sessions) {
    const counts = countAttendance(session.records)
    for (const key of Object.keys(attendance) as Array<keyof typeof attendance>) {
      attendance[key] += counts[key]
    }

    for (const record of session.records) {
      for (const tag of record.performanceTags) {
        tags[tag] += 1
      }
    }
  }

  return { lessonCount: sessions.length, attendance, tags }
}

export function summarizeStudentLessons(
  sessions: ReadonlyArray<PEClassSession>,
  studentId: string,
  range: ResolvedDateRange
): {
  lessonCount: number
  attendance: ReturnType<typeof countAttendance>
  tags: Record<PerformanceTag, number>
} {
  const attendance = countAttendance([])
  const tags: Record<PerformanceTag, number> = {
    engaged: 0,
    excellent: 0,
    improved: 0,
    discipline: 0,
    unequipped: 0
  }

  let lessonCount = 0
  for (const session of sessions) {
    if (!inDateRange(session.date, range)) {
      continue
    }

    const record = session.records.find((item) => item.studentId === studentId)
    if (!record) {
      continue
    }

    lessonCount += 1
    attendance[record.attendanceStatus] += 1
    for (const tag of record.performanceTags) {
      tags[tag] += 1
    }
  }

  return { lessonCount, attendance, tags }
}
