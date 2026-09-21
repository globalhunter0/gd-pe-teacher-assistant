import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runDataIntegrityAudit } from './audit'
import type { DataIntegritySnapshot } from './types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function readSrc(relative: string): string {
  return readFileSync(resolve(process.cwd(), relative), 'utf8')
}

function baseSnapshot(overrides: Partial<DataIntegritySnapshot> = {}): DataIntegritySnapshot {
  return {
    classes: [{ id: 'class-a', status: 'active' }],
    students: [{ id: 'student-a', classId: 'class-a', status: 'active' }],
    schedule: [{ id: 'slot-1', classId: 'class-a' }],
    peSessions: [
      {
        id: 'pe-session-a',
        classId: 'class-a',
        scheduleLessonId: 'slot-1',
        teachingPlanId: 'plan-a',
        status: 'in_progress',
        date: '2026-09-21'
      }
    ],
    peTests: [{ id: 'pe-test-a', classId: 'class-a', peSessionId: null, date: '2026-09-21' }],
    teachingPlans: [{ id: 'plan-a' }],
    trainingTeams: [{ id: 'team-a', status: 'active' }],
    trainingMembers: [{ id: 'member-a', teamId: 'team-a', studentId: 'student-a', status: 'active' }],
    trainingSessions: [{ id: 'ts-a', teamId: 'team-a' }],
    trainingResults: [{ id: 'tr-a', teamId: 'team-a', sessionId: 'ts-a', studentId: 'student-a' }],
    fileStatuses: [{ fileName: 'classes.json', exists: true }],
    ...overrides
  }
}

export function runV0290P01IntegritySelfCheckOrThrow(): string {
  const clean = runDataIntegrityAudit(baseSnapshot())
  assert(clean.status === 'healthy' || clean.issueCount.error === 0, '1. 干净数据无 error')

  const danglingStudent = runDataIntegrityAudit(
    baseSnapshot({
      students: [{ id: 'student-x', classId: 'class-missing', status: 'active' }]
    })
  )
  assert(
    danglingStudent.issues.some((item) => item.code === 'dangling_class_id'),
    '2. 悬空学生 classId'
  )

  const archivedOk = runDataIntegrityAudit(
    baseSnapshot({
      classes: [
        { id: 'class-a', status: 'active' },
        { id: 'class-old', status: 'deleted' }
      ],
      peSessions: [
        {
          id: 'pe-session-old',
          classId: 'class-old',
          scheduleLessonId: null,
          status: 'completed',
          date: '2026-01-01'
        }
      ]
    })
  )
  assert(
    !archivedOk.issues.some(
      (item) => item.entityId === 'pe-session-old' && item.severity === 'error' && item.code === 'dangling_class_id'
    ),
    '3. deleted 班级历史课堂不误报为 error 垃圾（可为 warning）'
  )
  assert(
    archivedOk.issues.some((item) => item.entityId === 'pe-session-old' && item.code === 'dangling_class_id') ===
      false ||
      archivedOk.issues.some(
        (item) => item.entityId === 'pe-session-old' && item.severity === 'warning'
      ),
    '3b. 历史课堂悬空班级最多 warning'
  )

  // Fix archived check - class-old exists in classes with deleted status, so classIds.has is true - no dangling!
  // Need missing class for dangling. Archived means class exists as deleted - should NOT warn.
  const historyKept = runDataIntegrityAudit(
    baseSnapshot({
      classes: [
        { id: 'class-a', status: 'active' },
        { id: 'class-old', status: 'deleted' }
      ],
      peSessions: [
        {
          id: 'pe-session-old',
          classId: 'class-old',
          scheduleLessonId: null,
          status: 'completed',
          date: '2026-01-01'
        }
      ]
    })
  )
  assert(
    !historyKept.issues.some((item) => item.entityId === 'pe-session-old'),
    '3c. deleted 班级仍在 classes 列表中时历史课堂不报悬空'
  )

  const dup = runDataIntegrityAudit(
    baseSnapshot({
      peSessions: [
        {
          id: 'pe-session-dup',
          classId: 'class-a',
          scheduleLessonId: null,
          date: '2026-09-21'
        },
        {
          id: 'pe-session-dup',
          classId: 'class-a',
          scheduleLessonId: null,
          date: '2026-09-22'
        }
      ]
    })
  )
  assert(dup.issues.some((item) => item.code === 'duplicate_id'), '4. 重复 session id')

  const badStatus = runDataIntegrityAudit(
    baseSnapshot({
      peSessions: [
        {
          id: 'pe-session-bad',
          classId: 'class-a',
          scheduleLessonId: null,
          status: 'done',
          date: '2026-09-21'
        }
      ]
    })
  )
  assert(badStatus.issues.some((item) => item.code === 'invalid_status'), '5. 非法状态')

  const oldFields = runDataIntegrityAudit(
    baseSnapshot({
      peSessions: [
        {
          id: 'pe-session-legacy',
          classId: 'class-a',
          scheduleLessonId: null,
          date: '2026-09-21'
        }
      ]
    })
  )
  assert(
    !oldFields.issues.some((item) => item.entityId === 'pe-session-legacy' && item.code === 'invalid_status'),
    '6. 老 JSON 缺 status 允许'
  )

  const corrupt = runDataIntegrityAudit(
    baseSnapshot({
      fileStatuses: [{ fileName: 'students.json', exists: true, parseError: 'Unexpected token' }]
    })
  )
  assert(corrupt.status === 'error' && corrupt.issues.some((item) => item.code === 'corrupt_json'), '7. 损坏 JSON')

  const missing = runDataIntegrityAudit(
    baseSnapshot({
      fileStatuses: [{ fileName: 'classes.json', exists: false }]
    })
  )
  assert(missing.issues.some((item) => item.code === 'missing_file'), '8. 缺文件 info')

  const danglingPlan = runDataIntegrityAudit(
    baseSnapshot({
      teachingPlans: [],
      peSessions: [
        {
          id: 'pe-session-plan',
          classId: 'class-a',
          scheduleLessonId: null,
          teachingPlanId: 'plan-gone',
          date: '2026-09-21'
        }
      ]
    })
  )
  assert(
    danglingPlan.issues.some((item) => item.code === 'dangling_teaching_plan_id' && item.severity === 'info'),
    '9. 悬空 teachingPlanId 为 info，不报错崩溃'
  )

  const empty = runDataIntegrityAudit({
    classes: [],
    students: [],
    schedule: [],
    peSessions: [],
    peTests: [],
    teachingPlans: [],
    trainingTeams: [],
    trainingMembers: [],
    trainingSessions: [],
    trainingResults: [],
    fileStatuses: []
  })
  assert(empty.status === 'healthy', '10. 空数据集 healthy')

  const settings = readSrc('src/renderer/src/pages/SettingsPage.tsx')
  assert(settings.includes('数据健康检查') || settings.includes('runDataIntegrityAudit'), '11. 设置页入口')
  assert(!readSrc('src/shared/dataIntegrity/audit.ts').includes('writeFile'), '12. 审计只读不写盘')

  return 'v0.29.0 P0-1 data integrity audit self-check passed'
}
