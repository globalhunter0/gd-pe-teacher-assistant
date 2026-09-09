import type { ClassRecord, ClassStatus, Grade, Semester } from './types'
import { CLASS_STATUSES, GRADES, SEMESTERS } from './types'

const ID_PATTERN = /^class-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const YEAR_PATTERN = /^\d{4}-\d{4}$/

function isGrade(value: unknown): value is Grade {
  return GRADES.includes(value as Grade)
}

function isSemester(value: unknown): value is Semester {
  return SEMESTERS.includes(value as Semester)
}

function isClassStatus(value: unknown): value is ClassStatus {
  return CLASS_STATUSES.includes(value as ClassStatus)
}

function parseStudentCount(value: unknown): number {
  if (value === '' || value === undefined || value === null) {
    return 0
  }

  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
    return value
  }

  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    return Number(value.trim())
  }

  throw new Error('学生人数必须是大于或等于 0 的整数')
}

export function createClassId(): string {
  return `class-${crypto.randomUUID()}`
}

export function isListedClass(record: Pick<ClassRecord, 'status'>): boolean {
  return record.status !== 'deleted'
}

export function listedClassRecords<T extends Pick<ClassRecord, 'status'>>(records: ReadonlyArray<T>): T[] {
  return records.filter(isListedClass)
}

export interface ClassDeleteImpact {
  studentCount: number
  activeStudentCount: number
  sessionCount: number
  testCount: number
  scheduleCount: number
}

export function collectClassDeleteImpact(
  classId: string,
  students: ReadonlyArray<{ classId: string; status?: string }> = [],
  sessions: ReadonlyArray<{ classId: string }> = [],
  testSessions: ReadonlyArray<{ classId: string }> = [],
  scheduleItems: ReadonlyArray<{ classId?: string }> = []
): ClassDeleteImpact {
  return {
    studentCount: students.filter((item) => item.classId === classId).length,
    activeStudentCount: students.filter((item) => item.classId === classId && item.status === 'active').length,
    sessionCount: sessions.filter((item) => item.classId === classId).length,
    testCount: testSessions.filter((item) => item.classId === classId).length,
    scheduleCount: scheduleItems.filter((item) => item.classId === classId).length
  }
}

export function formatClassDeleteConfirm(impact: ClassDeleteImpact): string {
  const hasCurrentStudents = impact.activeStudentCount > 0
  const hasHistory =
    impact.sessionCount > 0 || impact.testCount > 0 || impact.scheduleCount > 0 || impact.studentCount > 0
  if (!hasCurrentStudents && !hasHistory) {
    return '删除后该班级将从当前管理列表移除。'
  }

  const lead = hasCurrentStudents
    ? `该班级当前仍有${impact.activeStudentCount}名学生，并存在历史记录。`
    : '该班级存在历史记录。'
  return [
    lead,
    '删除后：',
    '- 班级将从当前管理列表移除',
    '- 学生不会被删除',
    '- 历史课堂、测试和训练记录仍会保留',
    '确认删除？'
  ].join('\n')
}

export function hasClassIdentityRefs(
  classId: string,
  students: ReadonlyArray<{ classId: string }> = [],
  sessions: ReadonlyArray<{ classId: string }> = [],
  testSessions: ReadonlyArray<{ classId: string }> = [],
  scheduleItems: ReadonlyArray<{ classId?: string }> = []
): boolean {
  return (
    students.some((item) => item.classId === classId) ||
    sessions.some((item) => item.classId === classId) ||
    testSessions.some((item) => item.classId === classId) ||
    scheduleItems.some((item) => item.classId === classId)
  )
}

export function tombstoneClassRecord(record: ClassRecord, now: string): ClassRecord {
  return { ...record, status: 'deleted', updatedAt: now }
}

export function applyClassSafeDelete(
  classes: ReadonlyArray<ClassRecord>,
  classId: string,
  now: string,
  refs: {
    students?: ReadonlyArray<{ classId: string }>
    sessions?: ReadonlyArray<{ classId: string }>
    testSessions?: ReadonlyArray<{ classId: string }>
    scheduleItems?: ReadonlyArray<{ classId?: string }>
  } = {}
): ClassRecord[] {
  const current = classes.find((item) => item.id === classId)
  if (!current || current.status === 'deleted') {
    return [...classes]
  }

  if (
    hasClassIdentityRefs(
      classId,
      refs.students ?? [],
      refs.sessions ?? [],
      refs.testSessions ?? [],
      refs.scheduleItems ?? []
    )
  ) {
    return classes.map((item) => (item.id === classId ? tombstoneClassRecord(item, now) : item))
  }

  return classes.filter((item) => item.id !== classId)
}

/** 仅用于禁止从 JSON 物理拿掉仍被引用的班级身份，不再作为 UI 删除拦截。 */
export function getClassDeleteBlockers(
  classId: string,
  students: ReadonlyArray<{ classId: string }> = [],
  sessions: ReadonlyArray<{ classId: string }> = [],
  testSessions: ReadonlyArray<{ classId: string }> = [],
  scheduleItems: ReadonlyArray<{ classId?: string }> = []
): string[] {
  const blockers: string[] = []
  const studentCount = students.filter((item) => item.classId === classId).length
  if (studentCount > 0) {
    blockers.push(`该班级仍关联 ${studentCount} 名学生身份，必须保留班级记录`)
  }

  const sessionCount = sessions.filter((item) => item.classId === classId).length
  if (sessionCount > 0) {
    blockers.push(`该班级存在 ${sessionCount} 节课堂历史记录，必须保留班级身份`)
  }

  const testCount = testSessions.filter((item) => item.classId === classId).length
  if (testCount > 0) {
    blockers.push(`该班级存在 ${testCount} 次体育测试记录，必须保留班级身份`)
  }

  const scheduleCount = scheduleItems.filter((item) => item.classId === classId).length
  if (scheduleCount > 0) {
    blockers.push(`该班级仍被 ${scheduleCount} 节课表格子引用，必须保留班级身份`)
  }

  return blockers
}

export function parseClassRecords(input: unknown): ClassRecord[] {
  if (!Array.isArray(input)) {
    throw new Error('班级数据格式不正确')
  }

  const records = input.map((entry) => {
    if (typeof entry !== 'object' || entry === null) {
      throw new Error('班级条目格式不正确')
    }

    const record = entry as Record<string, unknown>
    const id = record.id
    const className = record.className
    const grade = record.grade
    const academicYear = record.academicYear
    const semester = record.semester
    const notes = record.notes
    const createdAt = record.createdAt
    const updatedAt = record.updatedAt
    const status = record.status === undefined ? 'active' : record.status

    if (typeof id !== 'string' || !ID_PATTERN.test(id)) {
      throw new Error('班级 ID 不正确')
    }

    if (typeof className !== 'string' || className.trim().length === 0) {
      throw new Error('班级名称不能为空')
    }

    if (!isGrade(grade) || !isSemester(semester)) {
      throw new Error('年级或学期不正确')
    }

    if (typeof academicYear !== 'string' || !YEAR_PATTERN.test(academicYear.trim())) {
      throw new Error('学年格式应为 2026-2027')
    }

    if (!isClassStatus(status)) {
      throw new Error('班级状态不正确')
    }

    if (typeof createdAt !== 'string' || typeof updatedAt !== 'string') {
      throw new Error('班级时间字段不正确')
    }

    const item: ClassRecord = {
      id,
      className: className.trim(),
      grade,
      academicYear: academicYear.trim(),
      semester,
      studentCount: parseStudentCount(record.studentCount),
      notes: typeof notes === 'string' ? notes.trim() : '',
      status,
      createdAt,
      updatedAt
    }

    return item
  })

  const ids = new Set<string>()
  for (const item of records) {
    if (ids.has(item.id)) {
      throw new Error('班级 ID 不能重复')
    }
    ids.add(item.id)
  }

  return records.sort((a, b) => a.grade.localeCompare(b.grade, 'zh-CN') || a.className.localeCompare(b.className, 'zh-CN'))
}
