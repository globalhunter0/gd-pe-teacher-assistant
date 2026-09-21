import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { PEClassSession } from '../peSession/types'
import { deriveWeeklyPlanExecution } from './execution'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function readSrc(relative: string): string {
  return readFileSync(resolve(process.cwd(), relative), 'utf8')
}

const NOW = '2026-09-21T08:00:00.000Z'
const PLAN_ID = 'teaching-plan-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
const WEEK_ID = 'teaching-plan-week-aaaaaaaa-bbbb-4ccc-8ddd-222222222222'
const CLASS_A = 'class-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
const CLASS_B = 'class-bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee'

function session(
  id: string,
  overrides: Partial<PEClassSession> & Pick<PEClassSession, 'classId' | 'date' | 'period'>
): PEClassSession {
  return {
    id,
    scheduleLessonId: null,
    lessonType: 'regular',
    topic: '快速跑',
    notes: '',
    classNameSnapshot: '1班',
    gradeSnapshot: '初一',
    teamSnapshot: '',
    startTimeSnapshot: '',
    endTimeSnapshot: '',
    status: 'completed',
    completedAt: NOW,
    teachingPlanId: PLAN_ID,
    teachingPlanWeekId: WEEK_ID,
    objectivesSnapshot: '反应快',
    createdAt: NOW,
    updatedAt: NOW,
    records: [
      {
        id: `pe-record-${id.slice(-12).padStart(12, '0')}`,
        sessionId: id,
        studentId: 'student-aaaaaaaa-bbbb-4ccc-8ddd-ddddddddddd1',
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

export function runV0280P03ExecutionSelfCheckOrThrow(): string {
  const empty = deriveWeeklyPlanExecution({
    teachingPlanId: PLAN_ID,
    teachingPlanWeekId: WEEK_ID,
    sessions: []
  })
  assert(empty.completedCount === 0, '1. 0 节完成')

  const one = deriveWeeklyPlanExecution({
    teachingPlanId: PLAN_ID,
    teachingPlanWeekId: WEEK_ID,
    sessions: [
      session('pe-session-aaaaaaaa-bbbb-4ccc-8ddd-000000000001', {
        classId: CLASS_A,
        date: '2026-09-08',
        period: 3
      })
    ]
  })
  assert(one.completedCount === 1 && one.classes.length === 1, '2. 1 节完成')

  const multi = deriveWeeklyPlanExecution({
    teachingPlanId: PLAN_ID,
    teachingPlanWeekId: WEEK_ID,
    sessions: [
      session('pe-session-aaaaaaaa-bbbb-4ccc-8ddd-000000000001', {
        classId: CLASS_A,
        date: '2026-09-08',
        period: 3,
        classNameSnapshot: '1班'
      }),
      session('pe-session-aaaaaaaa-bbbb-4ccc-8ddd-000000000002', {
        classId: CLASS_B,
        date: '2026-09-08',
        period: 4,
        classNameSnapshot: '2班'
      }),
      session('pe-session-aaaaaaaa-bbbb-4ccc-8ddd-000000000003', {
        classId: CLASS_A,
        date: '2026-09-09',
        period: 2,
        classNameSnapshot: '1班'
      })
    ]
  })
  assert(multi.completedCount === 3 && multi.classes.length === 2, '3. 多班/同班多节')

  const inProgress = deriveWeeklyPlanExecution({
    teachingPlanId: PLAN_ID,
    teachingPlanWeekId: WEEK_ID,
    sessions: [
      session('pe-session-aaaaaaaa-bbbb-4ccc-8ddd-000000000004', {
        classId: CLASS_A,
        date: '2026-09-08',
        period: 3,
        status: 'in_progress',
        completedAt: null
      })
    ]
  })
  assert(inProgress.completedCount === 0, '4. 进行中不计完成')

  const legacy = deriveWeeklyPlanExecution({
    teachingPlanId: PLAN_ID,
    teachingPlanWeekId: WEEK_ID,
    sessions: [
      session('pe-session-aaaaaaaa-bbbb-4ccc-8ddd-000000000005', {
        classId: CLASS_A,
        date: '2026-09-08',
        period: 3,
        teachingPlanId: undefined,
        teachingPlanWeekId: undefined
      })
    ]
  })
  assert(legacy.completedCount === 0, '5. 旧 session 无引用不误归属')

  const dangling = deriveWeeklyPlanExecution({
    teachingPlanId: 'teaching-plan-missing-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    teachingPlanWeekId: WEEK_ID,
    sessions: [
      session('pe-session-aaaaaaaa-bbbb-4ccc-8ddd-000000000006', {
        classId: CLASS_A,
        date: '2026-09-08',
        period: 3,
        teachingPlanId: 'teaching-plan-missing-bbbb-4ccc-8ddd-eeeeeeeeeeee'
      })
    ]
  })
  assert(dangling.completedCount === 1, '6. 悬空 plan id 仍可按引用统计，课堂不丢')

  const dupList = [
    session('pe-session-aaaaaaaa-bbbb-4ccc-8ddd-000000000007', {
      classId: CLASS_A,
      date: '2026-09-08',
      period: 3
    }),
    session('pe-session-aaaaaaaa-bbbb-4ccc-8ddd-000000000007', {
      classId: CLASS_A,
      date: '2026-09-08',
      period: 3
    })
  ]
  const noDup = deriveWeeklyPlanExecution({
    teachingPlanId: PLAN_ID,
    teachingPlanWeekId: WEEK_ID,
    sessions: dupList
  })
  assert(noDup.completedCount === 1, '7. 同一 session 不重复统计')

  const wrongWeek = deriveWeeklyPlanExecution({
    teachingPlanId: PLAN_ID,
    teachingPlanWeekId: WEEK_ID,
    sessions: [
      session('pe-session-aaaaaaaa-bbbb-4ccc-8ddd-000000000008', {
        classId: CLASS_A,
        date: '2026-09-08',
        period: 3,
        teachingPlanWeekId: 'teaching-plan-week-aaaaaaaa-bbbb-4ccc-8ddd-999999999999'
      })
    ]
  })
  assert(wrongWeek.completedCount === 0, '8. 周次引用不匹配不计')

  const src = readSrc('src/shared/teachingPlan/execution.ts')
  assert(!src.includes('plan-progress.json') && !src.includes('teaching-execution.json'), '9. 无执行缓存 JSON')
  assert(src.includes('isPeSessionCompleted'), '10. 复用课堂完成状态')

  const dash = readSrc('src/renderer/src/pages/DashboardPage.tsx')
  assert(dash.includes('deriveWeeklyPlanExecution') && dash.includes('已完成'), '11. 工作台显示派生数字')
  const plansPage = readSrc('src/renderer/src/pages/TeachingPlansPage.tsx')
  assert(plansPage.includes('本周已执行') && plansPage.includes('deriveWeeklyPlanExecution'), '12. 计划页显示执行')

  return 'v0.28.0 P0-3 plan execution self-check passed'
}
