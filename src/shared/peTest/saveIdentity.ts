import type { StudentRecord } from '../student/types'
import type { PETestSession, TestItem } from './types'
import { isGenderLinkedSession, resolveActualTestItem } from './groupedItems'
import type { PEClassSession } from '../peSession/types'

export function assertPeTestSaveIdentity(next: readonly PETestSession[], current: readonly PETestSession[], students: readonly StudentRecord[], items: readonly TestItem[], classrooms: readonly PEClassSession[] = []): void {
  for (const session of next) {
    const previous = current.find(old => old.id === session.id)
    if (previous && ['classId', 'gradeSnapshot', 'classNameSnapshot', 'testItemId', 'testGroupId', 'examStandardId'].some(key =>
      (session[key as keyof PETestSession] ?? null) !== (previous[key as keyof PETestSession] ?? null))) throw new Error('历史测试的身份及评分依据不可通过普通保存改变')
    const seen = new Set<string>()
    for (const record of session.records) {
      if (seen.has(record.studentId)) throw new Error('同一测试中学生重复')
      seen.add(record.studentId)
      const old = previous?.records.find(row => row.id === record.id)
      if (old) {
        if (['studentId', 'nameSnapshot', 'studentNoSnapshot', 'genderSnapshot'].some(key => record[key as keyof typeof record] !== old[key as keyof typeof old])) throw new Error('历史成绩的学生身份快照不可改变')
        // Existing raw values and scores are immutable unless the record was explicitly edited.
        if (JSON.stringify(record) === JSON.stringify(old)) continue
      } else {
        const student = students.find(row => row.id === record.studentId)
        const classroom = session.origin === 'classroom' ? classrooms.find(row => row.id === session.peSessionId) : undefined
        const participant = classroom?.records.find(row => row.studentId === record.studentId)
        if (classroom && participant) {
          if (classroom.classId !== session.classId || classroom.gradeSnapshot !== session.gradeSnapshot || participant.nameSnapshot !== record.nameSnapshot || participant.studentNoSnapshot !== record.studentNoSnapshot) throw new Error('课堂小测必须使用原课堂名单快照')
          if (record.genderSnapshot !== 'unspecified' && student?.gender !== record.genderSnapshot) throw new Error('课堂小测性别依据不一致')
        } else if (!student || student.status === 'deleted' || student.classId !== session.classId || student.name !== record.nameSnapshot || student.studentNo !== record.studentNoSnapshot || student.gender !== record.genderSnapshot) throw new Error('学生身份或班级与成绩不一致')
      }
      // Note-only edits of historical rows must remain possible after catalog changes.
      if (old && record.rawValue === old.rawValue && record.status === old.status && record.examScore === old.examScore && record.resolvedTestItemId === old.resolvedTestItemId) continue
      const actual = resolveActualTestItem(session, record, items)
      if (!isGenderLinkedSession(session) && record.resolvedTestItemId && record.resolvedTestItemId !== session.testItemId) throw new Error('实际评分项目与测试项目不一致')
      if (record.status === 'valid' && (!actual.ok || (record.examScore !== null && record.genderSnapshot === 'unspecified') || (actual.item.genderRule !== 'all' && actual.item.genderRule !== record.genderSnapshot) || record.resolvedTestItemId !== actual.item.id)) throw new Error('成绩项目或性别不一致')
    }
  }
}
