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
    if (!id) continue
    if (seen.has(id)) dupes.add(id)
    else seen.add(id)
  }
  return Array.from(dupes)
}

/**
 * 启动轻量健康检查：只覆盖损坏 JSON、重复 ID、明显非法字段。
 * 不跑完整悬空引用 / 训练队交叉审计，避免拖慢启动。
 */
export function runStartupHealthAudit(snapshot: DataIntegritySnapshot): DataIntegrityReport {
  const issues: DataIntegrityIssue[] = []

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

  const classIds = new Set(snapshot.classes.map((item) => item.id))
  for (const student of snapshot.students) {
    if (student.status === 'active' && !classIds.has(student.classId)) {
      issues.push(
        issue({
          severity: 'warning',
          domain: 'students',
          code: 'dangling_class_id',
          entityId: student.id,
          message: `在读学生引用不存在的班级 ${student.classId}`
        })
      )
    }
  }

  for (const session of snapshot.peSessions) {
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

  if (snapshot.fileStatuses) {
    for (const file of snapshot.fileStatuses) {
      if (file.parseError) {
        issues.push(
          issue({
            severity: 'error',
            domain: 'files',
            code: 'corrupt_json',
            entityId: file.fileName,
            message: `无法解析 ${file.fileName}：${file.parseError}`,
            details: { exists: file.exists, repairHint: '请从备份恢复；原文件已保留' }
          })
        )
      }
    }
  }

  return summarizeIntegrityIssues(issues)
}
