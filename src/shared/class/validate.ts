import type { ClassRecord, Grade, Semester } from './types'
import { GRADES, SEMESTERS } from './types'

const ID_PATTERN = /^class-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const YEAR_PATTERN = /^\d{4}-\d{4}$/

function isGrade(value: unknown): value is Grade {
  return GRADES.includes(value as Grade)
}

function isSemester(value: unknown): value is Semester {
  return SEMESTERS.includes(value as Semester)
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

export function getClassDeleteBlockers(_classId: string): string[] {
  return []
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
