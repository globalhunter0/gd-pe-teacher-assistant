import { BUSINESS_JSON_FILES } from '../backup/types'
import { collectTrainingReferenceIssues } from '../trainingTeam/validate'
import {
  summarizeIntegrityIssues,
  type DataIntegrityIssue,
  type DataIntegrityReport,
  type DataIntegritySnapshot
} from './types'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function issue(
  partial: Omit<DataIntegrityIssue, 'repairable'> & { repairable?: boolean }
): DataIntegrityIssue {
  return {
    repairable: partial.repairable ?? false,
    ...partial
  }
}

function findDuplicateIds(ids: ReadonlyArray<string>): string[] {
  const seen = new Set<string>()
  const dupes = new Set<string>()
  for (const id of ids) {
    if (!id) {
      continue
    }
    if (seen.has(id)) {
      dupes.add(id)
    } else {
      seen.add(id)
    }
  }
  return Array.from(dupes)
}

/**
 * 只读业务数据健康审计。不修改任何数据。
 * archived / left / deleted 历史引用不算垃圾；仅报告悬空、重复与非法字段。
 */
export function runDataIntegrityAudit(snapshot: DataIntegritySnapshot): DataIntegrityReport {
  const issues: DataIntegrityIssue[] = []

  const classIds = new Set(snapshot.classes.map((item) => item.id))
  const activeClassIds = new Set(
    snapshot.classes.filter((item) => item.status === 'active').map((item) => item.id)
  )
  const studentIds = new Set(snapshot.students.map((item) => item.id))
  const scheduleIds = new Set(snapshot.schedule.map((item) => item.id))
  const peSessionIds = new Set(snapshot.peSessions.map((item) => item.id))
  const peTestIds = new Set(snapshot.peTests.map((item) => item.id))
  const planIds = new Set(snapshot.teachingPlans.map((item) => item.id))
  const teamIds = new Set(snapshot.trainingTeams.map((item) => item.id))

  for (const id of findDuplicateIds(snapshot.classes.map((item) => item.id))) {
    issues.push(
      issue({
        severity: 'error',
        domain: 'classes',
        code: 'duplicate_id',
        entityId: id,
        message: `班级 ID 重复：${id}`
      })
    )
  }
  for (const id of findDuplicateIds(snapshot.students.map((item) => item.id))) {
    issues.push(
      issue({
        severity: 'error',
        domain: 'students',
        code: 'duplicate_id',
        entityId: id,
        message: `学生 ID 重复：${id}`
      })
    )
  }
  for (const id of findDuplicateIds(snapshot.peSessions.map((item) => item.id))) {
    issues.push(
      issue({
        severity: 'error',
        domain: 'pe-sessions',
        code: 'duplicate_id',
        entityId: id,
        message: `课堂记录 ID 重复：${id}`
      })
    )
  }
  for (const id of findDuplicateIds(snapshot.peTests.map((item) => item.id))) {
    issues.push(
      issue({
        severity: 'error',
        domain: 'pe-tests',
        code: 'duplicate_id',
        entityId: id,
        message: `体育测试 ID 重复：${id}`
      })
    )
  }

  for (const student of snapshot.students) {
    if (!classIds.has(student.classId)) {
      issues.push(
        issue({
          severity: 'error',
          domain: 'students',
          code: 'dangling_class_id',
          entityId: student.id,
          message: `学生引用不存在的班级 ${student.classId}`,
          details: { classId: student.classId, studentStatus: student.status }
        })
      )
    }
  }

  for (const lesson of snapshot.schedule) {
    if (lesson.classId && !classIds.has(lesson.classId)) {
      issues.push(
        issue({
          severity: 'warning',
          domain: 'schedule',
          code: 'dangling_class_id',
          entityId: lesson.id,
          message: `课表格子引用不存在的班级 ${lesson.classId}`,
          details: { classId: lesson.classId }
        })
      )
    }
    if (lesson.trainingTeamId && !teamIds.has(lesson.trainingTeamId)) {
      issues.push(
        issue({
          severity: 'warning',
          domain: 'schedule',
          code: 'dangling_training_team_id',
          entityId: lesson.id,
          message: `课表格子引用不存在的训练队 ${lesson.trainingTeamId}`,
          details: { trainingTeamId: lesson.trainingTeamId }
        })
      )
    }
  }

  for (const session of snapshot.peSessions) {
    if (!classIds.has(session.classId)) {
      issues.push(
        issue({
          severity: 'warning',
          domain: 'pe-sessions',
          code: 'dangling_class_id',
          entityId: session.id,
          message: `课堂记录班级 ${session.classId} 已不存在（历史可读）`,
          details: { classId: session.classId }
        })
      )
    }
    if (session.scheduleLessonId && !scheduleIds.has(session.scheduleLessonId)) {
      issues.push(
        issue({
          severity: 'info',
          domain: 'pe-sessions',
          code: 'dangling_schedule_lesson_id',
          entityId: session.id,
          message: `课堂关联的课表格子 ${session.scheduleLessonId} 已不存在`,
          details: { scheduleLessonId: session.scheduleLessonId }
        })
      )
    }
    if (session.teachingPlanId && !planIds.has(session.teachingPlanId)) {
      issues.push(
        issue({
          severity: 'info',
          domain: 'pe-sessions',
          code: 'dangling_teaching_plan_id',
          entityId: session.id,
          message: `课堂关联的教学计划 ${session.teachingPlanId} 已不存在（悬空引用，课堂保留）`,
          details: { teachingPlanId: session.teachingPlanId }
        })
      )
    }
    if (session.status !== undefined && session.status !== 'in_progress' && session.status !== 'completed') {
      issues.push(
        issue({
          severity: 'error',
          domain: 'pe-sessions',
          code: 'invalid_status',
          entityId: session.id,
          message: `课堂状态非法：${String(session.status)}`,
          repairable: true,
          details: { status: session.status }
        })
      )
    }
    if (!DATE_PATTERN.test(session.date)) {
      issues.push(
        issue({
          severity: 'error',
          domain: 'pe-sessions',
          code: 'invalid_date',
          entityId: session.id,
          message: `课堂日期非法：${session.date}`
        })
      )
    }
  }

  for (const test of snapshot.peTests) {
    if (!classIds.has(test.classId)) {
      issues.push(
        issue({
          severity: 'warning',
          domain: 'pe-tests',
          code: 'dangling_class_id',
          entityId: test.id,
          message: `体育测试班级 ${test.classId} 已不存在（历史可读）`,
          details: { classId: test.classId }
        })
      )
    }
    if (test.peSessionId && !peSessionIds.has(test.peSessionId)) {
      issues.push(
        issue({
          severity: 'info',
          domain: 'pe-tests',
          code: 'dangling_pe_session_id',
          entityId: test.id,
          message: `课堂小测关联的课堂 ${test.peSessionId} 已不存在`,
          details: { peSessionId: test.peSessionId }
        })
      )
    }
    if (!DATE_PATTERN.test(test.date)) {
      issues.push(
        issue({
          severity: 'error',
          domain: 'pe-tests',
          code: 'invalid_date',
          entityId: test.id,
          message: `体育测试日期非法：${test.date}`
        })
      )
    }
  }

  for (const member of snapshot.trainingMembers) {
    if (!studentIds.has(member.studentId)) {
      issues.push(
        issue({
          severity: member.status === 'left' ? 'info' : 'warning',
          domain: 'training-members',
          code: 'dangling_student_id',
          entityId: member.id,
          message: `训练队员引用不存在的学生 ${member.studentId}`,
          details: { studentId: member.studentId, memberStatus: member.status }
        })
      )
    }
  }

  for (const result of snapshot.trainingResults) {
    if (!studentIds.has(result.studentId)) {
      issues.push(
        issue({
          severity: 'warning',
          domain: 'training-results',
          code: 'dangling_student_id',
          entityId: result.id,
          message: `训练成绩引用不存在的学生 ${result.studentId}`,
          details: { studentId: result.studentId }
        })
      )
    }
  }

  const trainingTextIssues = collectTrainingReferenceIssues({
    teams: snapshot.trainingTeams.map((item) => ({
      id: item.id,
      status: item.status as 'active' | 'archived'
    })),
    members: snapshot.trainingMembers,
    sessions: snapshot.trainingSessions.map((item) => ({
      id: item.id,
      teamId: item.teamId,
      planId: item.planId ?? undefined
    })),
    results: snapshot.trainingResults.map((item) => ({
      id: item.id,
      teamId: item.teamId,
      sessionId: item.sessionId ?? null
    })),
    scheduleItems: snapshot.schedule
  })
  for (const text of trainingTextIssues) {
    // archived 历史不算垃圾：跳过“已归档训练队仍有课表引用”类以外已在 collector 中的合理提示
    const severity: DataIntegrityIssue['severity'] = text.includes('孤立') ? 'warning' : 'info'
    issues.push(
      issue({
        severity,
        domain: 'training-teams',
        code: 'training_reference',
        entityId: 'training',
        message: text
      })
    )
  }

  if (snapshot.fileStatuses) {
    const expected = new Set<string>(BUSINESS_JSON_FILES)
    for (const file of snapshot.fileStatuses) {
      if (file.parseError) {
        issues.push(
          issue({
            severity: 'error',
            domain: 'files',
            code: 'corrupt_json',
            entityId: file.fileName,
            message: `无法解析 ${file.fileName}：${file.parseError}`,
            details: { exists: file.exists }
          })
        )
      } else if (!file.exists && expected.has(file.fileName)) {
        issues.push(
          issue({
            severity: 'info',
            domain: 'files',
            code: 'missing_file',
            entityId: file.fileName,
            message: `业务文件尚不存在（将在首次写入时创建）：${file.fileName}`,
            repairable: true
          })
        )
      }
    }
  }

  // silence unused sets that may help future rules
  void activeClassIds
  void peTestIds

  return summarizeIntegrityIssues(issues)
}
