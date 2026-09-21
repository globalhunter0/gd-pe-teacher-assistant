import { PE_SESSION_STATUSES } from '../peSession/types'
import type { DataIntegrityIssue, DataIntegrityReport } from './types'

export type SafeRepairKind = 'pe_session_invalid_status'

export interface SafeRepairAction {
  kind: SafeRepairKind
  entityId: string
  message: string
  before: unknown
  after: unknown
}

export interface SafeRepairPlan {
  actions: SafeRepairAction[]
  blocked: Array<{ code: string; entityId: string; reason: string }>
}

/**
 * 只规划明确、安全、可逆的修复。悬空引用 / 重复 ID / 无法判断归属 → 只报告不修。
 */
export function planSafeRepairs(
  report: DataIntegrityReport,
  extraActions: ReadonlyArray<SafeRepairAction> = []
): SafeRepairPlan {
  const actions: SafeRepairAction[] = [...extraActions]
  const blocked: SafeRepairPlan['blocked'] = []
  const seen = new Set(actions.map((item) => `${item.kind}:${item.entityId}`))

  for (const issue of report.issues) {
    if (issue.code === 'invalid_status' && issue.domain === 'pe-sessions' && issue.repairable) {
      const key = `pe_session_invalid_status:${issue.entityId}`
      if (!seen.has(key)) {
        actions.push({
          kind: 'pe_session_invalid_status',
          entityId: issue.entityId,
          message: `将非法课堂状态重置为 in_progress`,
          before: issue.details?.status,
          after: 'in_progress'
        })
        seen.add(key)
      }
      continue
    }

    if (
      issue.code === 'dangling_class_id' ||
      issue.code === 'dangling_student_id' ||
      issue.code === 'dangling_pe_session_id' ||
      issue.code === 'dangling_schedule_lesson_id' ||
      issue.code === 'dangling_teaching_plan_id' ||
      issue.code === 'duplicate_id' ||
      issue.code === 'corrupt_json'
    ) {
      blocked.push({
        code: issue.code,
        entityId: issue.entityId,
        reason: '需要人为业务判断或从备份恢复，不能自动修复'
      })
    }
  }

  return { actions, blocked }
}

/** 从原始 pe-sessions JSON（未严格 parse）扫描可修复的非法 status。 */
export function scanRawPeSessionsForStatusRepairs(rawText: string): SafeRepairAction[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(rawText)
  } catch {
    return []
  }
  const items = Array.isArray(parsed)
    ? parsed
    : parsed !== null &&
        typeof parsed === 'object' &&
        Array.isArray((parsed as { items?: unknown }).items)
      ? (parsed as { items: unknown[] }).items
      : null
  if (!items) {
    return []
  }

  const actions: SafeRepairAction[] = []
  for (const item of items) {
    if (item === null || typeof item !== 'object') continue
    const record = item as Record<string, unknown>
    const id = typeof record.id === 'string' ? record.id : ''
    const status = record.status
    if (status === undefined || status === null) continue
    if (PE_SESSION_STATUSES.includes(status as (typeof PE_SESSION_STATUSES)[number])) continue
    if (!id) continue
    actions.push({
      kind: 'pe_session_invalid_status',
      entityId: id,
      message: `将非法课堂状态重置为 in_progress`,
      before: status,
      after: 'in_progress'
    })
  }
  return actions
}

/** 对原始 pe-sessions JSON 文本应用 status 修复；无法 parse 时返回 null（禁止替换成 []）。 */
export function applyRawPeSessionStatusRepairs(
  rawText: string,
  actions: ReadonlyArray<SafeRepairAction>
): string | null {
  const targets = new Set(
    actions.filter((item) => item.kind === 'pe_session_invalid_status').map((item) => item.entityId)
  )
  if (targets.size === 0) {
    return rawText
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(rawText)
  } catch {
    return null
  }

  const patchItems = (items: unknown[]): void => {
    for (const item of items) {
      if (item === null || typeof item !== 'object') continue
      const record = item as Record<string, unknown>
      if (typeof record.id === 'string' && targets.has(record.id)) {
        record.status = 'in_progress'
      }
    }
  }

  if (Array.isArray(parsed)) {
    patchItems(parsed)
    return `${JSON.stringify(parsed, null, 2)}\n`
  }
  if (parsed !== null && typeof parsed === 'object' && Array.isArray((parsed as { items?: unknown }).items)) {
    const doc = parsed as { items: unknown[]; updatedAt?: string }
    patchItems(doc.items)
    doc.updatedAt = new Date().toISOString()
    return `${JSON.stringify(doc, null, 2)}\n`
  }
  return null
}

export function applyPeSessionStatusRepairs<T extends { id: string; status?: string }>(
  sessions: ReadonlyArray<T>,
  actions: ReadonlyArray<SafeRepairAction>
): T[] {
  const byId = new Set(
    actions.filter((item) => item.kind === 'pe_session_invalid_status').map((item) => item.entityId)
  )
  if (byId.size === 0) {
    return [...sessions]
  }
  return sessions.map((session) => {
    if (!byId.has(session.id)) {
      return session
    }
    return { ...session, status: 'in_progress' as T['status'] }
  })
}

export function summarizeRepairableIssues(issues: ReadonlyArray<DataIntegrityIssue>): number {
  return issues.filter((item) => item.repairable).length
}
