import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { readFileSync } from 'node:fs'
import { createDataBackup, restoreDataBackup } from '../backup/service'
import { readJsonItemsFile, writeJsonItemsAtomic } from '../persistence/jsonFile'
import {
  buildClassroomPeTestSession,
  findClassroomTestsForPeSession,
  findOpenClassroomTest,
  isClassroomPeTest,
  parsePeTestOrigin,
  peTestOriginLabel
} from './classroomQuiz'
import { BUILTIN_TEST_ITEMS } from './builtinItems'
import { createPeTestId, createPeTestRecordId, parsePeTestSessions } from './validate'
import { markPeTestSessionCompleted } from './sessionLifecycle'
import { summarizeStudentGrowth, buildStudentItemHistory } from '../statistics/analytics'
import { buildPeTestSessionExportPayload } from './exportSession'
import type { PETestSession, TestItem } from './types'
import type { PEClassSession } from '../peSession/types'
import type { ClassRecord } from '../class/types'
import type { StudentRecord } from '../student'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function readSrc(relative: string): string {
  return readFileSync(resolve(process.cwd(), relative), 'utf8')
}

const NOW = '2026-09-21T08:00:00.000Z'
const CLASS_ID = 'class-dddddddd-bbbb-4ccc-8ddd-eeeeeeeeeeee'
const PE_SESSION_ID = 'pe-session-dddd-bbbb-4ccc-8ddd-aaaaaaaaaaaa'
const STUDENT_1 = 'student-dddddddd-bbbb-4ccc-8ddd-aaaaaaaaaaa1'
const STUDENT_2 = 'student-dddddddd-bbbb-4ccc-8ddd-aaaaaaaaaaa2'

function item(key: string): TestItem {
  const found = BUILTIN_TEST_ITEMS.find((entry) => entry.builtinKey === key)
  if (!found) {
    throw new Error(`missing ${key}`)
  }
  return found
}

function classRec(): ClassRecord {
  return {
    id: CLASS_ID,
    grade: '初一',
    className: '9班',
    academicYear: '2025-2026',
    semester: '第一学期',
    studentCount: 40,
    status: 'active',
    notes: '',
    createdAt: NOW,
    updatedAt: NOW
  }
}

function student(id: string, name: string): StudentRecord {
  return {
    id,
    classId: CLASS_ID,
    studentNo: id.endsWith('1') ? '01' : '02',
    name,
    gender: id.endsWith('1') ? 'male' : 'female',
    status: 'active',
    notes: '',
    createdAt: NOW,
    updatedAt: NOW
  }
}

function peSession(records: PEClassSession['records']): PEClassSession {
  return {
    id: PE_SESSION_ID,
    classId: CLASS_ID,
    date: '2026-09-21',
    period: 3,
    scheduleLessonId: null,
    lessonType: 'regular',
    topic: '速度素质',
    notes: '',
    classNameSnapshot: '9班',
    gradeSnapshot: '初一',
    teamSnapshot: '',
    startTimeSnapshot: '',
    endTimeSnapshot: '',
    createdAt: NOW,
    updatedAt: NOW,
    records
  }
}

function peRecord(studentId: string, name: string, no: string): PEClassSession['records'][number] {
  return {
    id: `psr-${studentId}`,
    sessionId: PE_SESSION_ID,
    studentId,
    nameSnapshot: name,
    studentNoSnapshot: no,
    attendanceStatus: 'normal',
    performanceTags: [],
    note: '',
    createdAt: NOW,
    updatedAt: NOW
  }
}

function parseAny(input: unknown): unknown[] {
  if (!Array.isArray(input)) {
    throw new Error('not array')
  }
  return input
}

export async function runV0270P01ClassroomQuizSelfCheckOrThrow(): Promise<string> {
  const editor = readSrc('src/renderer/src/components/PeSessionEditor.tsx')
  const testsPage = readSrc('src/renderer/src/pages/PeTestsPage.tsx')
  const panel = readSrc('src/renderer/src/components/PeQuickEntryPanel.tsx')
  const quizSrc = readSrc('src/shared/peTest/classroomQuiz.ts')

  assert(editor.includes('课堂测评') && editor.includes('buildClassroomPeTestSession'), 'PeSessionEditor 课堂测评入口')
  assert(editor.includes('findOpenClassroomTest'), '防重复打开已有未完成测评')
  assert(panel.includes('embedded'), '快速录入支持 embedded')
  assert(
    testsPage.includes('originFilter') &&
      (testsPage.includes('PE_TEST_ORIGIN_LABELS') || testsPage.includes('peTestOriginLabel')) &&
      testsPage.includes('StatusBadge'),
    '测试中心 badge/filter'
  )
  assert(quizSrc.includes('PEClassSession.records') || quizSrc.includes('peSession.records'), '名单来自课堂记录')
  assert(!quizSrc.includes('classroom-results.json') && !quizSrc.includes('classroom-tests.json'), '16. 无新增业务 JSON')

  const sprint = item('50m')
  const legacyJson = [
    {
      id: createPeTestId(),
      classId: CLASS_ID,
      testItemId: sprint.id,
      date: '2026-08-01',
      title: '旧正式测试',
      notes: '',
      classNameSnapshot: '9班',
      gradeSnapshot: '初一',
      testItemNameSnapshot: sprint.name,
      unitSnapshot: sprint.unit,
      customUnitLabelSnapshot: '',
      directionSnapshot: sprint.direction,
      valueTypeSnapshot: sprint.valueType,
      timeInputModeSnapshot: sprint.timeInputMode,
      createdAt: NOW,
      updatedAt: NOW,
      records: [
        {
          id: createPeTestRecordId(),
          testSessionId: 'x',
          studentId: STUDENT_1,
          nameSnapshot: '甲',
          studentNoSnapshot: '01',
          genderSnapshot: 'male',
          rawValue: 8.5,
          status: 'valid',
          note: '',
          createdAt: NOW,
          updatedAt: NOW
        }
      ],
      importSource: 'manual',
      examStandardId: null,
      scoringCitySnapshot: '',
      scoringVersionSnapshot: ''
    }
  ]
  legacyJson[0].records[0].testSessionId = legacyJson[0].id
  const legacy = parsePeTestSessions(legacyJson)
  assert(legacy[0].origin === 'formal', '1/3. 缺 origin => formal')
  assert(legacy[0].peSessionId === null, '2. 缺 peSessionId => null')
  assert(peTestOriginLabel(legacy[0].origin) === '正式测试', '老记录显示正式测试')
  assert(parsePeTestOrigin(undefined) === 'formal', 'parsePeTestOrigin 缺省')

  const classroom = peSession([
    peRecord(STUDENT_1, '甲', '01'),
    peRecord(STUDENT_2, '乙', '02')
  ])
  const genderMap = new Map([
    [STUDENT_1, 'male' as const],
    [STUDENT_2, 'female' as const]
  ])
  const quiz = buildClassroomPeTestSession({
    peSession: classroom,
    testItem: sprint,
    genderByStudentId: genderMap,
    nowIso: NOW
  })
  assert(quiz.origin === 'classroom', '5. origin=classroom')
  assert(quiz.peSessionId === PE_SESSION_ID, '6. peSessionId 正确')
  assert(quiz.importSource === 'manual', 'importSource 仍为 manual')
  assert(quiz.records.length === 2, '7. 学生来自课堂 records')
  assert(
    quiz.records.every((row) => row.studentId === STUDENT_1 || row.studentId === STUDENT_2),
    '7. studentId 来自课堂'
  )
  assert(quiz.records.map((row) => row.nameSnapshot).join(',') === '甲,乙', '8. 姓名来自课堂快照')

  const outsiderOnlyClass = peSession([peRecord(STUDENT_1, '甲', '01')])
  const quizOne = buildClassroomPeTestSession({
    peSession: outsiderOnlyClass,
    testItem: sprint,
    genderByStudentId: genderMap,
    nowIso: NOW
  })
  assert(quizOne.records.length === 1 && quizOne.records[0].studentId === STUDENT_1, '8. 不从班级最新名单扩人')

  const open = findOpenClassroomTest([quiz], PE_SESSION_ID, sprint.id)
  assert(open?.id === quiz.id, '9. 未完成同项目可找到')
  const completed = markPeTestSessionCompleted(quiz, NOW)
  assert(findOpenClassroomTest([completed], PE_SESSION_ID, sprint.id) === null, '已完成不算 open')
  const again = buildClassroomPeTestSession({
    peSession: classroom,
    testItem: sprint,
    genderByStudentId: genderMap,
    nowIso: NOW
  })
  assert(again.id !== completed.id, '10. 已完成同项目允许再创建')
  assert(findClassroomTestsForPeSession([completed, again], PE_SESSION_ID).length === 2, '同课堂多项目/多次可见')

  const scored: PETestSession = {
    ...quiz,
    records: quiz.records.map((row, index) =>
      index === 0
        ? { ...row, status: 'valid', rawValue: 8.1, examScore: 90 }
        : row
    )
  }
  const growth = summarizeStudentGrowth(
    [legacy[0], scored],
    STUDENT_1,
    BUILTIN_TEST_ITEMS,
    [student(STUDENT_1, '甲'), student(STUDENT_2, '乙')],
    [classRec()]
  )
  assert(growth && growth.validCount >= 2, '11. classroom 成绩进入学生历史')
  const hist = buildStudentItemHistory([legacy[0], scored], STUDENT_1, sprint.id, BUILTIN_TEST_ITEMS)
  assert(hist && hist.validCount >= 2, '12. classroom 进入项目历史/PB 链路')
  assert(hist.points.some((p) => p.originLabel === '课堂小测'), '历史点带来源')
  assert(hist.points.some((p) => p.originLabel === '正式测试'), '13. 正式测试行为保持')

  const payload = buildPeTestSessionExportPayload(scored, { testItem: sprint })
  assert(payload.sheets[0].rows.length === 3, '14. Excel 导出不崩')
  assert(payload.defaultFileName.includes('课堂小测') || payload.sheets[0].name.includes('课堂'), '导出标记课堂小测')

  const dangling: PETestSession = { ...scored, peSessionId: 'pe-session-missing-ffffff' }
  assert(isClassroomPeTest(dangling) && dangling.peSessionId === 'pe-session-missing-ffffff', '17. 悬空 peSessionId 可读取')
  assert(findClassroomTestsForPeSession([dangling], PE_SESSION_ID).length === 0, '悬空不误挂当前课堂')

  const root = mkdtempSync(join(tmpdir(), 'v0270-p01-'))
  const archive = join(root, 'backup.zip')
  try {
    await writeJsonItemsAtomic(join(root, 'pe-tests.json'), [scored])
    await writeJsonItemsAtomic(join(root, 'pe-sessions.json'), [classroom])
    await createDataBackup(root, archive, '0.27.0-selfcheck')
    await writeJsonItemsAtomic(join(root, 'pe-tests.json'), [])
    await restoreDataBackup(root, archive, { appVersion: '0.27.0-selfcheck' })
    const restored = parsePeTestSessions(await readJsonItemsFile(join(root, 'pe-tests.json'), parseAny))
    assert(restored[0]?.origin === 'classroom' && restored[0]?.peSessionId === PE_SESSION_ID, '15. backup/restore 保留字段')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }

  const formalOnly = parsePeTestSessions(legacyJson)
  assert(!isClassroomPeTest(formalOnly[0]), '18. 旧 pe-tests 兼容且为 formal')

  return 'v0.27.0 P0-1 classroom quiz self-check passed'
}
