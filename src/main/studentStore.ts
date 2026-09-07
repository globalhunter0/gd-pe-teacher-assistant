import { parseStudentRecords } from '../shared/student/validate'
import type { StudentRecord } from '../shared/student/types'
import { loadUserJsonItems, saveUserJsonItems, userJsonPath } from './userJsonFile'

export function getStudentFilePath(): string {
  return userJsonPath('students.json')
}

export async function loadStudents(): Promise<StudentRecord[]> {
  return loadUserJsonItems('students.json', parseStudentRecords, '学生')
}

export async function saveStudents(input: unknown, knownClassIds: ReadonlySet<string>): Promise<StudentRecord[]> {
  const items = parseStudentRecords(input, { knownClassIds })
  return saveUserJsonItems('students.json', items)
}
