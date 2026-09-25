import type { StudentGender, StudentRecord } from '../../student/types'
import type { StudentMatchResult } from './types'

function inClassAlive(student: StudentRecord, classId: string): boolean {
  return student.classId === classId && student.status !== 'deleted'
}

export function matchExcelStudent(options: {
  classId: string
  students: ReadonlyArray<StudentRecord>
  excelRow: number
  studentId?: string
  studentNo: string
  studentName: string
  gender: StudentGender | null
}): StudentMatchResult {
  const base = {
    excelRow: options.excelRow,
    studentName: options.studentName,
    studentNo: options.studentNo
  }
  const consistent = (student: StudentRecord): boolean =>
    (!options.studentName.trim() || student.name.replace(/\s/g, '') === options.studentName.replace(/\s/g, '')) &&
    (!options.studentNo.trim() || student.studentNo.replace(/\s/g, '') === options.studentNo.replace(/\s/g, '')) &&
    (!options.gender || options.gender === 'unspecified' || student.gender === options.gender)
  const pool = options.students.filter((student) => inClassAlive(student, options.classId))

  if (options.studentId) {
    const hit = pool.find((student) => student.id === options.studentId)
    if (hit && consistent(hit)) {
      return { ...base, kind: 'studentId', student: hit, reason: 'studentId' }
    }
    return { ...base, kind: 'needs_confirm', student: null, reason: 'studentId 不在该班或已删除' }
  }

  const no = options.studentNo.replace(/\s/g, '').trim()
  if (no !== '') {
    const hits = pool.filter((student) => student.studentNo.replace(/\s/g, '') === no)
    if (hits.length === 1 && !consistent(hits[0])) return { ...base, kind: 'needs_confirm', student: null, reason: '学号、姓名或性别不一致' }
    if (hits.length === 1) {
      return { ...base, kind: 'studentNo', student: hits[0], reason: '同班学号唯一' }
    }
    if (hits.length > 1) {
      return { ...base, kind: 'needs_confirm', student: null, reason: '同班学号冲突' }
    }
    return { ...base, kind: 'needs_confirm', student: null, reason: '同班找不到该学号' }
  }

  const name = options.studentName.replace(/\s/g, '').trim()
  if (name === '' || !options.gender || options.gender === 'unspecified') {
    return { ...base, kind: 'needs_confirm', student: null, reason: '缺少学号且姓名/性别不足' }
  }

  const nameHits = pool.filter(
    (student) =>
      student.status === 'active' &&
      student.name.replace(/\s/g, '') === name &&
      student.gender === options.gender
  )
  if (nameHits.length === 1) {
    return { ...base, kind: 'nameGender', student: nameHits[0], reason: '同班姓名+性别唯一' }
  }
  if (nameHits.length > 1) {
    return { ...base, kind: 'needs_confirm', student: null, reason: '同班同名同性别，需确认' }
  }
  return { ...base, kind: 'needs_confirm', student: null, reason: '无法在班级内唯一匹配' }
}
