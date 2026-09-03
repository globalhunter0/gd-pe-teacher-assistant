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
  scheduleLessonId: string | null
  teamSnapshot: string
  startTimeSnapshot: string
  endTimeSnapshot: string
}): PEClassSession {
  const now = new Date().toISOString()
  const sessionId = createPeSessionId()

  return {
    id: sessionId,
    classId: options.classRecord.id,
    date: options.date,
    period: options.period,
    scheduleLessonId: options.scheduleLessonId,
    lessonType: options.lessonType,
    topic: options.topic.trim(),
    notes: '',
    classNameSnapshot: options.classRecord.className,
    gradeSnapshot: options.classRecord.grade,
    teamSnapshot: options.teamSnapshot,
    startTimeSnapshot: options.startTimeSnapshot,
    endTimeSnapshot: options.endTimeSnapshot,
    createdAt: now,
    updatedAt: now,
    records: options.activeStudents.map((student) => ({
      id: createPeRecordId(),
      sessionId,
      studentId: student.id,
      nameSnapshot: student.name,
      studentNoSnapshot: student.studentNo,
      attendanceStatus: 'normal',
      performanceTags: [],
      note: '',
      createdAt: now,
      updatedAt: now
    }))
  }
}
