import type { StudentRecord } from '@shared/student'

export function filterStudents(
  students: StudentRecord[],
  options: { classId: string; query: string }
): StudentRecord[] {
  const query = options.query.trim().toLowerCase()

  return students.filter((item) => {
    if (item.status === 'deleted') {
      return false
    }

    if (options.classId !== 'all' && item.classId !== options.classId) {
      return false
    }

    if (query === '') {
      return true
    }

    const nameHit = item.name.toLowerCase().includes(query)
    const studentNoHit = item.studentNo !== '' && item.studentNo.toLowerCase().includes(query)
    return nameHit || studentNoHit
  })
}

export function countActiveStudents(students: StudentRecord[], classId?: string): number {
  return students.filter(
    (item) => item.status === 'active' && (classId === undefined || item.classId === classId)
  ).length
}
