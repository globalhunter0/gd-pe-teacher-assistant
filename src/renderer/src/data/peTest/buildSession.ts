import type { ClassRecord } from '@shared/class'
import {
  createPeTestId,
  createPeTestRecordId,
  type PETestSession,
  type TestItem
} from '@shared/peTest'
import type { StudentRecord } from '@shared/student'

function sortActiveStudents(students: StudentRecord[]): StudentRecord[] {
  return [...students].sort(
    (a, b) =>
      a.studentNo.localeCompare(b.studentNo, 'zh-CN', { numeric: true }) || a.name.localeCompare(b.name, 'zh-CN')
  )
}

export function buildPeTestSession(options: {
  classRecord: ClassRecord
  testItem: TestItem
  activeStudents: StudentRecord[]
  date: string
  title: string
  notes: string
}): PETestSession {
  const now = new Date().toISOString()
  const sessionId = createPeTestId()
  const title =
    options.title.trim() || `${options.classRecord.className} · ${options.testItem.name} · ${options.date}`

  return {
    id: sessionId,
    classId: options.classRecord.id,
    testItemId: options.testItem.id,
    date: options.date,
    title,
    notes: options.notes.trim(),
    classNameSnapshot: options.classRecord.className,
    gradeSnapshot: options.classRecord.grade,
    testItemNameSnapshot: options.testItem.name,
    unitSnapshot: options.testItem.unit,
    customUnitLabelSnapshot: options.testItem.customUnitLabel,
    directionSnapshot: options.testItem.direction,
    valueTypeSnapshot: options.testItem.valueType,
    timeInputModeSnapshot: options.testItem.timeInputMode,
    createdAt: now,
    updatedAt: now,
    records: sortActiveStudents(options.activeStudents).map((student) => ({
      id: createPeTestRecordId(),
      testSessionId: sessionId,
      studentId: student.id,
      nameSnapshot: student.name,
      studentNoSnapshot: student.studentNo,
      genderSnapshot: student.gender,
      rawValue: null,
      status: 'pending',
      note: '',
      createdAt: now,
      updatedAt: now
    }))
  }
}
