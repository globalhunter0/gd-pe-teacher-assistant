import type { ClassRecord } from '@shared/class'
import {
  createPeRecordId,
  createPeSessionId,
  type PEClassSession,
  type PeLessonType
} from '@shared/peSession'
import type { StudentRecord } from '@shared/student'

export function buildPeSession(options: {
  classRecord: ClassRecord
  activeStudents: StudentRecord[]
  date: string
  period: number
  lessonType: PeLessonType
  topic: string
  notes?: string
  scheduleLessonId: string | null
  teamSnapshot: string
  startTimeSnapshot: string
  endTimeSnapshot: string
  teachingPlanId?: string | null
  teachingPlanWeekId?: string | null
  objectivesSnapshot?: string
}): PEClassSession {
  const now = new Date().toISOString()
  const sessionId = createPeSessionId()

  const session: PEClassSession = {
    id: sessionId,
    classId: options.classRecord.id,
    date: options.date,
    period: options.period,
    scheduleLessonId: options.scheduleLessonId,
    lessonType: options.lessonType,
    topic: options.topic.trim(),
    notes: (options.notes ?? '').trim(),
    classNameSnapshot: options.classRecord.className,
    gradeSnapshot: options.classRecord.grade,
    teamSnapshot: options.teamSnapshot,
    startTimeSnapshot: options.startTimeSnapshot,
    endTimeSnapshot: options.endTimeSnapshot,
    status: 'in_progress',
    completedAt: null,
    createdAt: now,
    updatedAt: now,
    records: options.activeStudents.map((student) => ({
      id: createPeRecordId(),
      sessionId,
      studentId: student.id,
      nameSnapshot: student.name,
      studentNoSnapshot: student.studentNo,
      attendanceStatus: 'normal',
      participationStatus: 'normal',
      performanceTags: [],
      note: '',
      createdAt: now,
      updatedAt: now
    }))
  }

  if (options.teachingPlanId !== undefined) {
    session.teachingPlanId = options.teachingPlanId
  }
  if (options.teachingPlanWeekId !== undefined) {
    session.teachingPlanWeekId = options.teachingPlanWeekId
  }
  if (options.objectivesSnapshot !== undefined && options.objectivesSnapshot.trim()) {
    session.objectivesSnapshot = options.objectivesSnapshot.trim()
  }

  return session
}
