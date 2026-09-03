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

export function getStudentDeleteBlockers(
  studentId: string,
  sessions: ReadonlyArray<{ records: ReadonlyArray<{ studentId: string }> }> = []
): string[] {
  const count = sessions.filter((session) => session.records.some((record) => record.studentId === studentId)).length
  if (count > 0) {
    return [`该学生存在 ${count} 节体育课历史记录，不能直接删除。可将学生状态改为已转出。`]
  }

  return []
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

    if (item.studentNo === '') {
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
