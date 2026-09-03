import type { ClassRecord } from '../class'
import type { PEClassSession } from '../peSession'
import type { PETestSession } from '../peTest'
import type { StudentRecord } from '../student'
import { STUDENT_STATUS_LABELS } from '../student'

export interface StatsStudentOption {
  studentId: string
  name: string
  studentNo: string
  classLabel: string
  statusLabel: string
  isHistorical: boolean
}

export function classDisplayName(
  classes: ReadonlyArray<ClassRecord>,
  classId: string,
  fallback?: { classNameSnapshot?: string; gradeSnapshot?: string }
): string {
  const match = classes.find((item) => item.id === classId)
  if (match) {
    return `${match.grade} ${match.className}`
  }

  if (fallback?.gradeSnapshot || fallback?.classNameSnapshot) {
    return `${fallback.gradeSnapshot ?? ''} ${fallback.classNameSnapshot ?? '历史班级'}`.trim()
  }

  return '历史班级'
}

export function collectStudentOptions(
  students: ReadonlyArray<StudentRecord>,
  classes: ReadonlyArray<ClassRecord>,
  lessons: ReadonlyArray<PEClassSession>,
  tests: ReadonlyArray<PETestSession>
): StatsStudentOption[] {
  const byId = new Map<string, StatsStudentOption>()

  for (const student of students) {
    byId.set(student.id, {
      studentId: student.id,
      name: student.name,
      studentNo: student.studentNo,
      classLabel: classDisplayName(classes, student.classId),
      statusLabel: STUDENT_STATUS_LABELS[student.status],
      isHistorical: false
    })
  }

  function rememberSnapshot(
    studentId: string,
    name: string,
    studentNo: string,
    classId: string,
    classNameSnapshot: string,
    gradeSnapshot: string
  ): void {
    if (byId.has(studentId)) {
      return
    }

    byId.set(studentId, {
      studentId,
      name: name || '未填写姓名',
      studentNo,
      classLabel: classDisplayName(classes, classId, { classNameSnapshot, gradeSnapshot }),
      statusLabel: '历史学生',
      isHistorical: true
    })
  }

  for (const session of lessons) {
    for (const record of session.records) {
      rememberSnapshot(
        record.studentId,
        record.nameSnapshot,
        record.studentNoSnapshot,
        session.classId,
        session.classNameSnapshot,
        session.gradeSnapshot
      )
    }
  }

  for (const session of tests) {
    for (const record of session.records) {
      rememberSnapshot(
        record.studentId,
        record.nameSnapshot,
        record.studentNoSnapshot,
        session.classId,
        session.classNameSnapshot,
        session.gradeSnapshot
      )
    }
  }

  return [...byId.values()].sort(
    (a, b) => a.name.localeCompare(b.name, 'zh-CN') || a.studentNo.localeCompare(b.studentNo, 'zh-CN', { numeric: true })
  )
}

export function filterStudentOptions(options: ReadonlyArray<StatsStudentOption>, query: string): StatsStudentOption[] {
  const text = query.trim().toLowerCase()
  if (text === '') {
    return [...options]
  }

  return options.filter(
    (item) => item.name.toLowerCase().includes(text) || (item.studentNo !== '' && item.studentNo.toLowerCase().includes(text))
  )
}
