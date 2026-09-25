import type { PEClassSession } from './types'

export type ClassroomIdentity = Pick<PEClassSession, 'classId' | 'date' | 'period'> &
  Partial<Pick<PEClassSession, 'lessonType' | 'scheduleLessonId'>>

/** Saved dates/periods are historical facts. Never infer a reschedule from a slot ID.
 * An independent extra lesson is separate from the ordinary scheduled lesson. */
export function classroomIdentityKey(session: ClassroomIdentity): string {
  const kind = !session.scheduleLessonId && session.lessonType === 'extra' ? 'extra' : 'ordinary'
  return JSON.stringify([session.classId, session.date, session.period, kind])
}
