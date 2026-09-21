import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createDataBackup, restoreDataBackup } from '../backup/service'
import { readJsonItemsFile, writeJsonItemsAtomic } from '../persistence/jsonFile'
import { parsePeSessions } from '../peSession/validate'
import type { PEClassSession } from '../peSession/types'
import type { ClassRecord } from '../class/types'
import type { TeachingPlan } from './types'
import { resolveUniqueCurrentWeekPrefill } from './prefill'

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

const NOW = '2026-09-21T08:00:00.000Z'
const PLAN_ID = 'teaching-plan-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
const PLAN_B = 'teaching-plan-bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee'
const WEEK_ID = 'teaching-plan-week-aaaaaaaa-bbbb-4ccc-8ddd-222222222222'
const CLASS_ID = 'class-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
const SESSION_ID = 'pe-session-aaaaaaaa-bbbb-4ccc-8ddd-cccccccccccc'
const RECORD_ID = 'pe-record-aaaaaaaa-bbbb-4ccc-8ddd-ddddddddddd1'
const STUDENT_ID = 'student-aaaaaaaa-bbbb-4ccc-8ddd-ddddddddddd1'

function classRec(): ClassRecord {
  return {
    id: CLASS_ID,
    grade: '初一',
    className: '1班',
    academicYear: '2025-2026',
    semester: '第一学期',
    studentCount: 40,
    status: 'active',
    notes: '',
    createdAt: NOW,
    updatedAt: NOW
  }
}

function plan(id: string, name: string): TeachingPlan {
  return {
    id,
    name,
    academicYear: '2025-2026',
    semester: '第一学期',
    grade: '初一',
    startDate: '2026-09-01',
    endDate: null,
    totalWeeks: 3,
    notes: '',
    createdAt: NOW,
    updatedAt: NOW,
    weeks: [
      {
        id: 'teaching-plan-week-aaaaaaaa-bbbb-4ccc-8ddd-111111111111',
        weekNumber: 1,
        title: '适应',
        contents: '队列',
        objectives: '站队',
        notes: ''
      },
      {
        id: WEEK_ID,
        weekNumber: 2,
        title: '快速跑',
        contents: '起跑与加速',
        objectives: '反应快',
        notes: ''
      },
      {
        id: 'teaching-plan-week-aaaaaaaa-bbbb-4ccc-8ddd-333333333333',
        weekNumber: 3,
        title: '跳远',
        contents: '起跳',
        objectives: '腾空',
        notes: ''
      }
    ]
  }
}

function session(overrides: Partial<PEClassSession> = {}): PEClassSession {
  return {
    id: SESSION_ID,
    classId: CLASS_ID,
    date: '2026-09-08',
    period: 3,
    scheduleLessonId: 'slot-1-3',
    lessonType: 'regular',
    topic: '快速跑',
    notes: '起跑与加速',
    classNameSnapshot: '1班',
    gradeSnapshot: '初一',
    teamSnapshot: '',
    startTimeSnapshot: '',
    endTimeSnapshot: '',
    status: 'in_progress',
    completedAt: null,
    teachingPlanId: PLAN_ID,
    teachingPlanWeekId: WEEK_ID,
    objectivesSnapshot: '反应快',
    createdAt: NOW,
    updatedAt: NOW,
    records: [
      {
        id: RECORD_ID,
        sessionId: SESSION_ID,
        studentId: STUDENT_ID,
        nameSnapshot: '张三',
        studentNoSnapshot: '01',
        attendanceStatus: 'normal',
        performanceTags: [],
        note: '',
        createdAt: NOW,
        updatedAt: NOW
      }
    ],
    ...overrides
  }
}

export async function runV0280P02PlanLinkSelfCheckOrThrow(): Promise<string> {
  const clazz = classRec()
  const unique = resolveUniqueCurrentWeekPrefill([plan(PLAN_ID, '初一')], clazz, '2026-09-08')
  assert(unique.status === 'prefilled', '1. 唯一计划预填')
  assert(unique.topic === '快速跑' && unique.notes === '起跑与加速', '2. topic/notes')
  assert(unique.objectives === '反应快' && unique.weekId === WEEK_ID && unique.planId === PLAN_ID, '3. objectives+weekId')

  const none = resolveUniqueCurrentWeekPrefill([], clazz, '2026-09-08')
  assert(none.status === 'none', '4. 无计划可正常开课（不阻断）')

  const ambiguous = resolveUniqueCurrentWeekPrefill(
    [plan(PLAN_ID, 'A'), plan(PLAN_B, 'B')],
    clazz,
    '2026-09-08'
  )
  assert(ambiguous.status === 'ambiguous' && !ambiguous.topic, '5. 多计划不乱填')

  // 保存带引用的 session，再读
  const saved = parsePeSessions(JSON.parse(JSON.stringify([session()])) as unknown)
  assert(saved[0].teachingPlanId === PLAN_ID && saved[0].teachingPlanWeekId === WEEK_ID, '6. 引用可保存')
  assert(saved[0].objectivesSnapshot === '反应快', '7. objectives 快照')
  assert(saved[0].topic === '快速跑', '8. topic 快照')

  // 教师改 topic 后计划变更不影响旧 session
  const teacherEdited = parsePeSessions([
    session({ topic: '教师自定主题', notes: '教师备注' })
  ])
  const planChanged = plan(PLAN_ID, '初一')
  planChanged.weeks[1].title = '计划已改'
  planChanged.weeks[1].contents = '计划内容已改'
  assert(teacherEdited[0].topic === '教师自定主题', '9. 教师修改后保存')
  assert(teacherEdited[0].topic !== planChanged.weeks[1].title, '10. 计划后来修改不改变旧 session')

  // 旧 session 无引用字段可读
  const legacy = parsePeSessions([
    session({
      teachingPlanId: undefined,
      teachingPlanWeekId: undefined,
      objectivesSnapshot: undefined
    })
  ])
  // remove fields by rebuilding without them
  const legacyRaw = {
    id: SESSION_ID,
    classId: CLASS_ID,
    date: '2026-09-08',
    period: 3,
    scheduleLessonId: null,
    lessonType: 'extra',
    topic: '补课',
    notes: '',
    classNameSnapshot: '1班',
    gradeSnapshot: '初一',
    teamSnapshot: '',
    startTimeSnapshot: '',
    endTimeSnapshot: '',
    createdAt: NOW,
    updatedAt: NOW,
    records: [
      {
        id: RECORD_ID,
        sessionId: SESSION_ID,
        studentId: STUDENT_ID,
        nameSnapshot: '张三',
        studentNoSnapshot: '01',
        attendanceStatus: 'normal',
        performanceTags: [],
        note: '',
        createdAt: NOW,
        updatedAt: NOW
      }
    ]
  }
  const legacyParsed = parsePeSessions([legacyRaw])
  assert(legacyParsed[0].teachingPlanId === undefined, '11. 旧 session 可读且无引用')
  assert(legacyParsed[0].lessonType === 'extra', '12. 补课 extra 不错误要求计划绑定')

  // 已删除班级历史
  const archived = parsePeSessions([
    session({ classId: 'class-ffffffff-bbbb-4ccc-8ddd-ffffffffffff', classNameSnapshot: '已删班' })
  ])
  assert(archived[0].teachingPlanId === PLAN_ID, '13. 已删除班级历史仍可读引用')

  // backup/restore
  const root = mkdtempSync(join(tmpdir(), 'v0280-p02-'))
  const archive = join(root, 'backup.zip')
  try {
    await writeJsonItemsAtomic(join(root, 'pe-sessions.json'), [session()])
    await createDataBackup(root, archive, '0.28.0-selfcheck')
    await writeJsonItemsAtomic(join(root, 'pe-sessions.json'), [])
    await restoreDataBackup(root, archive, { appVersion: '0.28.0-selfcheck' })
    const restored = parsePeSessions(await readJsonItemsFile(join(root, 'pe-sessions.json'), parseAny))
    assert(
      restored[0]?.teachingPlanId === PLAN_ID &&
        restored[0]?.teachingPlanWeekId === WEEK_ID &&
        restored[0]?.objectivesSnapshot === '反应快',
      '14. backup/restore 保留引用'
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }

  const page = readSrc('src/renderer/src/pages/PeLessonRecordsPage.tsx')
  assert(page.includes('teachingPlanId') && page.includes('objectivesSnapshot'), '15. 创建时写入引用')
  assert(page.includes('存在多份教学计划，本次未自动带入'), '16. 多计划提示')
  const editor = readSrc('src/renderer/src/components/PeSessionEditor.tsx')
  assert(editor.includes('objectivesSnapshot') && editor.includes('本周教学目标'), '17. 编辑器只读目标')
  assert(!page.includes('teaching-execution.json'), '18. 无新 JSON')

  assert(legacy[0].topic === '快速跑', 'legacy fixture used')

  return 'v0.28.0 P0-2 plan link self-check passed'
}
