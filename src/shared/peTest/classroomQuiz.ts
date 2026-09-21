import type { PEClassSession } from '../peSession/types'
import type { StudentGender } from '../student/types'
import { BUILTIN_TEST_ITEMS } from './builtinItems'
import { resolveLinkedTestItem, type GenderLinkedTestGroup } from './groupedItems'
import { applyClassroomScoringBasis, emptyClassroomScoreFields } from './scoringBasis'
import { isPeTestSessionCompleted } from './sessionLifecycle'
import { createPeTestId, createPeTestRecordId } from './validate'
import { isClassroomPeTest, type PETestRecord, type PETestSession, type TestItem } from './types'

export { isClassroomPeTest, parsePeTestOrigin, peTestOriginLabel } from './types'

function resolveGender(
  studentId: string,
  genderByStudentId: ReadonlyMap<string, StudentGender> | null | undefined
): StudentGender {
  const found = genderByStudentId?.get(studentId)
  return found === 'male' || found === 'female' || found === 'unspecified' ? found : 'unspecified'
}

function sortClassroomRoster(records: ReadonlyArray<PEClassSession['records'][number]>): PEClassSession['records'] {
  return [...records].sort(
    (a, b) =>
      a.studentNoSnapshot.localeCompare(b.studentNoSnapshot, 'zh-CN', { numeric: true }) ||
      a.nameSnapshot.localeCompare(b.nameSnapshot, 'zh-CN')
  )
}

/** 课堂小测名单必须来自当前 PEClassSession.records，不得改用班级最新名单。 */
export function buildClassroomPeTestSession(options: {
  peSession: PEClassSession
  testItem: TestItem
  testGroup?: GenderLinkedTestGroup | null
  examStandardId?: string | null
  genderByStudentId?: ReadonlyMap<string, StudentGender> | null
  nowIso?: string
}): PETestSession {
  const now = options.nowIso ?? new Date().toISOString()
  const sessionId = createPeTestId()
  const displayName = options.testGroup?.displayName ?? options.testItem.name
  const title = `${options.peSession.classNameSnapshot} · ${displayName} · 课堂小测 · ${options.peSession.date}`
  const roster = sortClassroomRoster(options.peSession.records)

  const records: PETestRecord[] = roster.map((row) => {
    const gender = resolveGender(row.studentId, options.genderByStudentId)
    const resolved = options.testGroup
      ? resolveLinkedTestItem(options.testGroup, gender, BUILTIN_TEST_ITEMS)
      : { ok: true as const, item: options.testItem }
    return {
      id: createPeTestRecordId(),
      testSessionId: sessionId,
      studentId: row.studentId,
      nameSnapshot: row.nameSnapshot,
      studentNoSnapshot: row.studentNoSnapshot,
      genderSnapshot: gender,
      rawValue: null,
      status: 'pending',
      note: '',
      createdAt: now,
      updatedAt: now,
      ...emptyClassroomScoreFields(),
      rawOriginal: '',
      resolvedTestItemId: resolved.ok ? resolved.item.id : null
    }
  })

  const session: PETestSession = {
    id: sessionId,
    classId: options.peSession.classId,
    testItemId: options.testItem.id,
    date: options.peSession.date,
    title,
    notes: '',
    classNameSnapshot: options.peSession.classNameSnapshot,
    gradeSnapshot: options.peSession.gradeSnapshot,
    testItemNameSnapshot: displayName,
    unitSnapshot: options.testItem.unit,
    customUnitLabelSnapshot: options.testItem.customUnitLabel,
    directionSnapshot: options.testItem.direction,
    valueTypeSnapshot: options.testItem.valueType,
    timeInputModeSnapshot: options.testItem.timeInputMode,
    createdAt: now,
    updatedAt: now,
    records,
    importSource: 'manual',
    examStandardId: null,
    scoringCitySnapshot: '',
    scoringVersionSnapshot: '',
    testGroupId: options.testGroup?.id ?? null,
    status: 'in_progress',
    completedAt: null,
    origin: 'classroom',
    peSessionId: options.peSession.id
  }

  return applyClassroomScoringBasis(session, options.examStandardId ?? null)
}

export function findClassroomTestsForPeSession(
  sessions: ReadonlyArray<PETestSession>,
  peSessionId: string
): PETestSession[] {
  return sessions
    .filter((item) => item.peSessionId === peSessionId && isClassroomPeTest(item))
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)
    )
}

/** 同一课堂 + 同项目 + 未完成：复用既有测评，禁止静默再开第二条进行中记录。 */
export function findOpenClassroomTest(
  sessions: ReadonlyArray<PETestSession>,
  peSessionId: string,
  testItemId: string
): PETestSession | null {
  const open = findClassroomTestsForPeSession(sessions, peSessionId).find(
    (item) => item.testItemId === testItemId && !isPeTestSessionCompleted(item)
  )
  return open ?? null
}
