import type { StudentRecord } from '../student'
import { createPeRecordId } from './validate'
import type { PEClassSession, PEStudentRecord } from './types'

/** Active students of the class who are not yet in session.records (add-only). */
export function listMissingActiveStudents(
  session: Pick<PEClassSession, 'classId' | 'records'>,
  students: ReadonlyArray<Pick<StudentRecord, 'id' | 'classId' | 'status' | 'name' | 'studentNo'>>
): Array<Pick<StudentRecord, 'id' | 'classId' | 'status' | 'name' | 'studentNo'>> {
  const existingIds = new Set<string>()
  for (const record of session.records) {
    if (typeof record.studentId === 'string' && record.studentId.trim()) {
      existingIds.add(record.studentId)
    }
  }

  return students.filter(
    (student) =>
      student.classId === session.classId &&
      student.status === 'active' &&
      typeof student.id === 'string' &&
      student.id.trim() !== '' &&
      !existingIds.has(student.id)
  )
}

function buildDefaultRecord(
  sessionId: string,
  student: Pick<StudentRecord, 'id' | 'name' | 'studentNo'>,
  now: string
): PEStudentRecord {
  return {
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
  }
}

/**
 * Append missing active students only. Never removes existing records or mutates
 * attendance / performance / notes of students already on the session.
 */
export function appendActiveStudentsToSession(
  session: PEClassSession,
  students: ReadonlyArray<Pick<StudentRecord, 'id' | 'classId' | 'status' | 'name' | 'studentNo'>>,
  now: string = new Date().toISOString()
): { session: PEClassSession; addedCount: number } {
  const missing = listMissingActiveStudents(session, students)
  if (missing.length === 0) {
    return { session, addedCount: 0 }
  }

  const appended = missing.map((student) => buildDefaultRecord(session.id, student, now))
  return {
    session: {
      ...session,
      updatedAt: now,
      records: [...session.records, ...appended]
    },
    addedCount: appended.length
  }
}
