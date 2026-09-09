import type { StudentGender, StudentRecord, StudentStatus } from './types'
import { STUDENT_GENDERS, STUDENT_STATUSES } from './types'

const ID_PATTERN = /^student-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const CLASS_ID_PATTERN = /^class-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface ParseStudentOptions {
  knownClassIds?: ReadonlySet<string>
}

function isGender(value: unknown): value is StudentGender {
  return STUDENT_GENDERS.includes(value as StudentGender)
}

function isStatus(value: unknown): value is StudentStatus {
  return STUDENT_STATUSES.includes(value as StudentStatus)
}

export function createStudentId(): string {
  return `student-${crypto.randomUUID()}`
}

export interface StudentTrainingDeleteRefs {
  members?: ReadonlyArray<{ studentId: string }>
  sessions?: ReadonlyArray<{ attendance: ReadonlyArray<{ studentId: string }> }>
  results?: ReadonlyArray<{ studentId: string }>
}

export function isRosterVisibleStudent(student: Pick<StudentRecord, 'status'>): boolean {
  return student.status === 'active' || student.status === 'transferred'
}

export function hasStudentIdentityRefs(
  studentId: string,
  sessions: ReadonlyArray<{ records: ReadonlyArray<{ studentId: string }> }> = [],
  testSessions: ReadonlyArray<{ records: ReadonlyArray<{ studentId: string }> }> = [],
  training: StudentTrainingDeleteRefs = {}
): boolean {
  return getStudentDeleteBlockers(studentId, sessions, testSessions, training).length > 0
}

export function leaveActiveTrainingMemberships<T extends { studentId: string; status: string; leftAt: string | null; updatedAt: string }>(
  members: ReadonlyArray<T>,
  studentId: string,
  now: string
): T[] {
  return members.map((item) =>
    item.studentId === studentId && item.status === 'active' && item.leftAt === null
      ? { ...item, status: 'left' as T['status'], leftAt: now, updatedAt: now }
      : item
  )
}

export function archiveStudentRecord(student: StudentRecord, now: string): StudentRecord {
  return { ...student, status: 'deleted', updatedAt: now }
}

export function applyStudentSafeDelete<
  T extends { studentId: string; status: string; leftAt: string | null; updatedAt: string }
>(
  students: ReadonlyArray<StudentRecord>,
  studentId: string,
  now: string,
  refs: {
    sessions?: ReadonlyArray<{ records: ReadonlyArray<{ studentId: string }> }>
    testSessions?: ReadonlyArray<{ records: ReadonlyArray<{ studentId: string }> }>
    members?: ReadonlyArray<T>
    trainingSessions?: ReadonlyArray<{ attendance: ReadonlyArray<{ studentId: string }> }>
    results?: ReadonlyArray<{ studentId: string }>
  } = {}
): { students: StudentRecord[]; members: T[] } {
  const members = leaveActiveTrainingMemberships(refs.members ?? [], studentId, now)
  const current = students.find((item) => item.id === studentId)
  if (!current || current.status === 'deleted') {
    return { students: [...students], members }
  }

  const keepIdentity = hasStudentIdentityRefs(studentId, refs.sessions ?? [], refs.testSessions ?? [], {
    members,
    sessions: refs.trainingSessions,
    results: refs.results
  })

  return {
    members,
    students: keepIdentity
      ? students.map((item) => (item.id === studentId ? archiveStudentRecord(item, now) : item))
      : students.filter((item) => item.id !== studentId)
  }
}

export function getStudentDeleteBlockers(
  studentId: string,
  sessions: ReadonlyArray<{ records: ReadonlyArray<{ studentId: string }> }> = [],
  testSessions: ReadonlyArray<{ records: ReadonlyArray<{ studentId: string }> }> = [],
  training: StudentTrainingDeleteRefs = {}
): string[] {
  const blockers: string[] = []
  const lessonCount = sessions.filter((session) => session.records.some((record) => record.studentId === studentId)).length
  if (lessonCount > 0) {
    blockers.push(`该学生存在 ${lessonCount} 节课堂历史记录，必须保留学生身份`)
  }

  const testCount = testSessions.filter((session) => session.records.some((record) => record.studentId === studentId)).length
  if (testCount > 0) {
    blockers.push(`该学生存在 ${testCount} 次体育测试历史记录，必须保留学生身份`)
  }

  const memberCount = (training.members ?? []).filter((item) => item.studentId === studentId).length
  if (memberCount > 0) {
    blockers.push(`该学生存在 ${memberCount} 条训练队队员记录，必须保留学生身份`)
  }

  const trainingSessionCount = (training.sessions ?? []).filter((session) =>
    session.attendance.some((row) => row.studentId === studentId)
  ).length
  if (trainingSessionCount > 0) {
    blockers.push(`该学生存在 ${trainingSessionCount} 次训练出勤记录，必须保留学生身份`)
  }

  const resultCount = (training.results ?? []).filter((item) => item.studentId === studentId).length
  if (resultCount > 0) {
    blockers.push(`该学生存在 ${resultCount} 条训练成绩，必须保留学生身份`)
  }

  return blockers
}

export function parseStudentRecords(input: unknown, options: ParseStudentOptions = {}): StudentRecord[] {
  if (!Array.isArray(input)) {
    throw new Error('学生数据格式不正确')
  }

  const records = input.map((entry) => {
    if (typeof entry !== 'object' || entry === null) {
      throw new Error('学生条目格式不正确')
    }

    const record = entry as Record<string, unknown>
    const id = record.id
    const classId = record.classId
    const studentNo = typeof record.studentNo === 'string' ? record.studentNo.trim() : ''
    const name = record.name
    const gender = record.gender
    const status = record.status
    const notes = record.notes
    const createdAt = record.createdAt
    const updatedAt = record.updatedAt

    if (typeof id !== 'string' || !ID_PATTERN.test(id)) {
      throw new Error('学生 ID 不正确')
    }

    if (typeof classId !== 'string' || !CLASS_ID_PATTERN.test(classId)) {
      throw new Error('所属班级不正确')
    }

    if (options.knownClassIds && !options.knownClassIds.has(classId)) {
      throw new Error('所属班级不存在，请先在班级管理中创建班级')
    }

    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('姓名不能为空')
    }

    if (!isGender(gender)) {
      throw new Error('性别不正确')
    }

    if (!isStatus(status)) {
      throw new Error('在读状态不正确')
    }

    if (typeof createdAt !== 'string' || typeof updatedAt !== 'string') {
      throw new Error('学生时间字段不正确')
    }

    const item: StudentRecord = {
      id,
      classId,
      studentNo,
      name: name.trim(),
      gender,
      status,
      notes: typeof notes === 'string' ? notes.trim() : '',
      createdAt,
      updatedAt
    }

    return item
  })

  const ids = new Set<string>()
  const studentNoByClass = new Map<string, Set<string>>()

  for (const item of records) {
    if (ids.has(item.id)) {
      throw new Error('学生 ID 不能重复')
    }
    ids.add(item.id)

    if (item.studentNo === '' || item.status === 'deleted') {
      continue
    }

    const used = studentNoByClass.get(item.classId) ?? new Set<string>()
    if (used.has(item.studentNo)) {
      throw new Error(`同一班级内学号不能重复：${item.studentNo}`)
    }
    used.add(item.studentNo)
    studentNoByClass.set(item.classId, used)
  }

  return records.sort(
    (a, b) =>
      a.classId.localeCompare(b.classId) ||
      a.studentNo.localeCompare(b.studentNo, 'zh-CN', { numeric: true }) ||
      a.name.localeCompare(b.name, 'zh-CN')
  )
}
