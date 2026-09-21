import type { ClassRecord } from '@shared/class'
import {
  applyClassroomScoringBasis,
  BUILTIN_TEST_ITEMS,
  createPeTestId,
  createPeTestRecordId,
  emptyClassroomScoreFields,
  resolveLinkedTestItem,
  type GenderLinkedTestGroup,
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
  testGroup?: GenderLinkedTestGroup | null
  examStandardId?: string | null
}): PETestSession {
  const now = new Date().toISOString()
  const sessionId = createPeTestId()
  const displayName = options.testGroup?.displayName ?? options.testItem.name
  const title =
    options.title.trim() || `${options.classRecord.className} · ${displayName} · ${options.date}`

  const session: PETestSession = {
    id: sessionId,
    classId: options.classRecord.id,
    testItemId: options.testItem.id,
    date: options.date,
    title,
    notes: options.notes.trim(),
    classNameSnapshot: options.classRecord.className,
    gradeSnapshot: options.classRecord.grade,
    testItemNameSnapshot: displayName,
    unitSnapshot: options.testItem.unit,
    customUnitLabelSnapshot: options.testItem.customUnitLabel,
    directionSnapshot: options.testItem.direction,
    valueTypeSnapshot: options.testItem.valueType,
    timeInputModeSnapshot: options.testItem.timeInputMode,
    createdAt: now,
    updatedAt: now,
    records: sortActiveStudents(options.activeStudents).map((student) => {
      const resolved = options.testGroup
        ? resolveLinkedTestItem(options.testGroup, student.gender, BUILTIN_TEST_ITEMS)
        : { ok: true as const, item: options.testItem }
      return {
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
        updatedAt: now,
        ...emptyClassroomScoreFields(),
        rawOriginal: '',
        resolvedTestItemId: resolved.ok ? resolved.item.id : null
      }
    }),
    importSource: 'manual',
    examStandardId: null,
    scoringCitySnapshot: '',
    scoringVersionSnapshot: '',
    testGroupId: options.testGroup?.id ?? null,
    status: 'in_progress',
    completedAt: null
  }

  return applyClassroomScoringBasis(session, options.examStandardId ?? null)
}
