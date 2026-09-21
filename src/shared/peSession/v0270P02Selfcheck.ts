import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createDataBackup, restoreDataBackup } from '../backup/service'
import { readJsonItemsFile, writeJsonItemsAtomic } from '../persistence/jsonFile'
import { appendActiveStudentsToSession, listMissingActiveStudents } from './rosterSync'
import {
  countLessonRosterStats,
  resolveAttendancePresence,
  resolveParticipationStatus
} from './participation'
import { parsePeSessions } from './validate'
import type { PEClassSession, PEStudentRecord } from './types'
import type { StudentRecord } from '../student'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function readSrc(relative: string): string {
  return readFileSync(resolve(process.cwd(), relative), 'utf8')
}

function parseAny(input: unknown): unknown[] {
  if (!Array.isArray(input)) {
    throw new Error('expected array')
  }
  return input
}

const NOW = '2026-09-21T10:00:00.000Z'
const CLASS_ID = 'class-eeeeeeee-bbbb-4ccc-8ddd-eeeeeeeeeeee'
const SESSION_ID = 'pe-session-eeeeeeee-bbbb-4ccc-8ddd-bbbbbbbbbbbb'
const STUDENT_1 = 'student-eeeeeeee-bbbb-4ccc-8ddd-bbbbbbbbbbb1'
const STUDENT_2 = 'student-eeeeeeee-bbbb-4ccc-8ddd-bbbbbbbbbbb2'
const STUDENT_3 = 'student-eeeeeeee-bbbb-4ccc-8ddd-bbbbbbbbbbb3'
const RECORD_1 = 'pe-record-eeeeeeee-bbbb-4ccc-8ddd-bbbbbbbbbbb1'
const RECORD_2 = 'pe-record-eeeeeeee-bbbb-4ccc-8ddd-bbbbbbbbbbb2'
const RECORD_3 = 'pe-record-eeeeeeee-bbbb-4ccc-8ddd-bbbbbbbbbbb3'

function baseRecord(
  overrides: Partial<PEStudentRecord> & Pick<PEStudentRecord, 'id' | 'studentId'>
): PEStudentRecord {
  const record: PEStudentRecord = {
    id: overrides.id,
    sessionId: SESSION_ID,
    studentId: overrides.studentId,
    nameSnapshot: overrides.nameSnapshot ?? '同学',
    studentNoSnapshot: overrides.studentNoSnapshot ?? '01',
    attendanceStatus: overrides.attendanceStatus ?? 'normal',
    performanceTags: overrides.performanceTags ?? [],
    note: overrides.note ?? '',
    createdAt: NOW,
    updatedAt: NOW
  }
  if (overrides.participationStatus !== undefined) {
    record.participationStatus = overrides.participationStatus
  }
  return record
}

function session(records: PEStudentRecord[]): PEClassSession {
  return {
    id: SESSION_ID,
    classId: CLASS_ID,
    date: '2026-09-21',
    period: 2,
    scheduleLessonId: null,
    lessonType: 'regular',
    topic: '耐力跑',
    notes: '',
    classNameSnapshot: '8班',
    gradeSnapshot: '初二',
    teamSnapshot: '',
    startTimeSnapshot: '',
    endTimeSnapshot: '',
    createdAt: NOW,
    updatedAt: NOW,
    records
  }
}

export async function runV0270P02ParticipationSelfCheckOrThrow(): Promise<string> {
  // 1. 老 PEStudentRecord 可 parse（无 participationStatus）
  const legacyRaw = [
    {
      id: SESSION_ID,
      classId: CLASS_ID,
      date: '2026-09-21',
      period: 2,
      scheduleLessonId: null,
      lessonType: 'regular',
      topic: '旧',
      notes: '',
      classNameSnapshot: '8班',
      gradeSnapshot: '初二',
      teamSnapshot: '',
      startTimeSnapshot: '',
      endTimeSnapshot: '',
      createdAt: NOW,
      updatedAt: NOW,
      records: [
        {
          id: RECORD_1,
          sessionId: SESSION_ID,
          studentId: STUDENT_1,
          nameSnapshot: '甲',
          studentNoSnapshot: '01',
          attendanceStatus: 'normal',
          performanceTags: ['engaged'],
          note: '状态良好',
          createdAt: NOW,
          updatedAt: NOW
        }
      ]
    }
  ]
  const legacyParsed = parsePeSessions(legacyRaw)
  assert(legacyParsed.length === 1 && legacyParsed[0].records.length === 1, '1. 老 PEStudentRecord 可 parse')
  assert(legacyParsed[0].records[0].participationStatus === undefined, '1b. 老数据不注入 participationStatus')

  // 2. 缺 participationStatus => resolve 为 normal
  assert(
    resolveParticipationStatus(legacyParsed[0].records[0]) === 'normal',
    '2. 缺 participationStatus => normal'
  )

  // 3–5. observer / unwell / injured 正常保存
  const withStatuses = session([
    baseRecord({
      id: RECORD_1,
      studentId: STUDENT_1,
      nameSnapshot: '甲',
      attendanceStatus: 'normal',
      participationStatus: 'observer',
      note: '本节见习'
    }),
    baseRecord({
      id: RECORD_2,
      studentId: STUDENT_2,
      nameSnapshot: '乙',
      studentNoSnapshot: '02',
      attendanceStatus: 'late',
      participationStatus: 'unwell',
      performanceTags: ['discipline'],
      note: '迟到且不适'
    }),
    baseRecord({
      id: RECORD_3,
      studentId: STUDENT_3,
      nameSnapshot: '丙',
      studentNoSnapshot: '03',
      attendanceStatus: 'normal',
      participationStatus: 'injured',
      note: '脚踝不适'
    })
  ])
  const saved = parsePeSessions(JSON.parse(JSON.stringify([withStatuses])) as unknown)
  assert(saved[0].records[0].participationStatus === 'observer', '3. observer 正常保存')
  assert(saved[0].records[1].participationStatus === 'unwell', '4. unwell 正常保存')
  assert(saved[0].records[2].participationStatus === 'injured', '5. injured 正常保存')

  // 6. 原 attendanceStatus 不被破坏
  assert(saved[0].records[0].attendanceStatus === 'normal', '6a. attendance 保持 normal')
  assert(saved[0].records[1].attendanceStatus === 'late', '6b. attendance 保持 late')
  assert(saved[0].records[2].attendanceStatus === 'normal', '6c. attendance 保持 normal')

  // 7. 老 attendanceStatus=observer 仍兼容
  const legacyObserver = baseRecord({
    id: RECORD_1,
    studentId: STUDENT_1,
    attendanceStatus: 'observer'
  })
  assert(legacyObserver.participationStatus === undefined, '7a. 老 observer 无 participation 字段')
  assert(resolveParticipationStatus(legacyObserver) === 'observer', '7b. 老 observer 仍显示见习')
  assert(resolveAttendancePresence(legacyObserver) === 'normal', '7c. 老 observer 考勤视为到课')

  // 8. 新数据不要求 attendanceStatus=observer
  assert(saved[0].records[0].attendanceStatus === 'normal', '8a. 新见习考勤为 normal')
  assert(saved[0].records[0].participationStatus === 'observer', '8b. 新见习写在 participationStatus')

  // 9. attendance 与 participation 可独立组合
  assert(
    saved[0].records[1].attendanceStatus === 'late' &&
      saved[0].records[1].participationStatus === 'unwell',
    '9. late + unwell 可组合'
  )

  // 10–11. note / performanceTags 原样保留
  assert(saved[0].records[0].note === '本节见习', '10. note 原样保留')
  assert(
    saved[0].records[1].performanceTags.length === 1 &&
      saved[0].records[1].performanceTags[0] === 'discipline',
    '11. performanceTags 原样保留'
  )

  // 12. 名单同步逻辑不受影响（只追加，不改已有）
  const beforeSync = session([
    baseRecord({
      id: RECORD_1,
      studentId: STUDENT_1,
      attendanceStatus: 'late',
      participationStatus: 'injured',
      note: '保留',
      performanceTags: ['engaged']
    })
  ])
  const extraStudents: Array<Pick<StudentRecord, 'id' | 'classId' | 'status' | 'name' | 'studentNo'>> = [
    { id: STUDENT_1, classId: CLASS_ID, status: 'active', name: '甲', studentNo: '01' },
    { id: STUDENT_2, classId: CLASS_ID, status: 'active', name: '乙', studentNo: '02' }
  ]
  assert(listMissingActiveStudents(beforeSync, extraStudents).length === 1, '12a. 缺人可检测')
  const synced = appendActiveStudentsToSession(beforeSync, extraStudents, NOW)
  assert(synced.addedCount === 1, '12b. 只追加新人')
  assert(
    synced.session.records[0].attendanceStatus === 'late' &&
      synced.session.records[0].participationStatus === 'injured' &&
      synced.session.records[0].note === '保留',
    '12c. 已有记录不被改写'
  )
  assert(synced.session.records[1].participationStatus === 'normal', '12d. 新追加默认 normal')

  // 13. P0-1 classroom quiz 不受影响
  const editorSrc = readSrc('src/renderer/src/components/PeSessionEditor.tsx')
  assert(editorSrc.includes('考勤状态不会自动写入测试缺考'), '13a. 不自动改测试缺考')
  assert(editorSrc.includes('participationStatus'), '13b. 编辑器含参与状态')
  const quizSrc = readSrc('src/shared/peTest/classroomQuiz.ts')
  assert(!quizSrc.includes('participationStatus'), '13c. classroom quiz 不读参与状态')

  // 14. backup/restore 保留新字段
  const root = mkdtempSync(join(tmpdir(), 'v0270-p02-'))
  const archive = join(root, 'backup.zip')
  try {
    await writeJsonItemsAtomic(join(root, 'pe-sessions.json'), [withStatuses])
    await createDataBackup(root, archive, '0.27.0-selfcheck')
    await writeJsonItemsAtomic(join(root, 'pe-sessions.json'), [])
    await restoreDataBackup(root, archive, { appVersion: '0.27.0-selfcheck' })
    const restored = parsePeSessions(await readJsonItemsFile(join(root, 'pe-sessions.json'), parseAny))
    assert(
      restored[0]?.records?.[0]?.participationStatus === 'observer' &&
        restored[0]?.records?.[1]?.participationStatus === 'unwell' &&
        restored[0]?.records?.[2]?.participationStatus === 'injured',
      '14. backup/restore 保留新字段'
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }

  // 15. archived 历史可读取（parse 不依赖班级存在）
  const archivedClassSession = {
    ...withStatuses,
    classId: 'class-ffffffff-bbbb-4ccc-8ddd-ffffffffffff',
    classNameSnapshot: '已删班',
    gradeSnapshot: '初三' as const
  }
  const archivedParsed = parsePeSessions([archivedClassSession])
  assert(
    archivedParsed[0].records[2].participationStatus === 'injured',
    '15. archived / 无班级约束仍可读'
  )

  // 16. 不新增 JSON
  assert(!readSrc('src/shared/peSession/participation.ts').includes('health-archive.json'), '16. 不新增健康档案 JSON')
  assert(!editorSrc.includes('medicalNote') && !editorSrc.includes('diagnosis'), '16b. 无医疗化字段 UI')

  // 17. 不新增长期健康统计
  const statsLessons = readSrc('src/shared/statistics/lessons.ts')
  assert(
    !statsLessons.includes('participationStatus') && !statsLessons.includes('injured'),
    '17. 统计层未新增长期健康字段'
  )

  // 18. 正式体育测试不受影响
  const peTestValidate = readSrc('src/shared/peTest/validate.ts')
  assert(!peTestValidate.includes('participationStatus'), '18. peTest validate 不依赖参与状态')

  // 缺勤时字段仍保留（不 silent 删除）
  const awayInjured = baseRecord({
    id: RECORD_1,
    studentId: STUDENT_1,
    attendanceStatus: 'absent',
    participationStatus: 'injured'
  })
  const awayParsed = parsePeSessions([session([awayInjured])])
  assert(
    awayParsed[0].records[0].attendanceStatus === 'absent' &&
      awayParsed[0].records[0].participationStatus === 'injured',
    '缺勤+受伤字段均保留'
  )

  const rosterStats = countLessonRosterStats(withStatuses.records)
  assert(
    rosterStats.late === 1 &&
      rosterStats.observer === 1 &&
      rosterStats.unwell === 1 &&
      rosterStats.injured === 1,
    '课堂名单统计分离'
  )

  assert(
    editorSrc.includes('PARTICIPATION_STATUSES') && editorSrc.includes('参与状态'),
    'UI 含参与状态下拉'
  )
  assert(editorSrc.includes('ATTENDANCE_EDIT_STATUSES'), '考勤编辑不含 observer 选项')

  return 'v0.27.0 P0-2 participation self-check passed'
}
