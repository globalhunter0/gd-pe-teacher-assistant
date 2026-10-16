import { parseClassRecords } from '../class/validate'
import { parsePeSessions } from '../peSession/validate'
import { parsePeTestSessions, parseTestItems } from '../peTest/validate'
import { parseScheduleItems } from '../schedule/validate'
import { parseStudentRecords } from '../student/validate'
import {
  COMPANION_SNAPSHOT_KIND,
  COMPANION_SNAPSHOT_SCHEMA_VERSION,
  type CompanionSnapshot,
  type CompanionSnapshotBuildInput
} from './types'

function asRecord(input: unknown): Record<string, unknown> {
  if (input == null || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('手机同步包格式无效：根节点必须是对象')
  }
  return input as Record<string, unknown>
}

export function buildCompanionSnapshot(input: CompanionSnapshotBuildInput): CompanionSnapshot {
  return {
    kind: COMPANION_SNAPSHOT_KIND,
    schemaVersion: COMPANION_SNAPSHOT_SCHEMA_VERSION,
    exportedAt: input.exportedAt ?? new Date().toISOString(),
    appVersion: input.appVersion.trim() || '0.0.0',
    classes: parseClassRecords(input.classes),
    students: parseStudentRecords(input.students),
    testItems: parseTestItems(input.testItems),
    peTests: parsePeTestSessions(input.peTests),
    ...(input.schedule === undefined ? {} : { schedule: parseScheduleItems(input.schedule) }),
    ...(input.peSessions === undefined ? {} : { peSessions: parsePeSessions(input.peSessions) })
  }
}

export function parseCompanionSnapshot(input: unknown): CompanionSnapshot {
  const record = asRecord(input)
  if (record.kind !== COMPANION_SNAPSHOT_KIND) {
    throw new Error('不是本软件的手机同步包（kind 不匹配）')
  }
  if (record.schemaVersion !== COMPANION_SNAPSHOT_SCHEMA_VERSION) {
    throw new Error(`不支持的手机同步包版本：${String(record.schemaVersion)}`)
  }
  if (typeof record.exportedAt !== 'string' || !record.exportedAt.trim()) {
    throw new Error('手机同步包缺少 exportedAt')
  }
  if (typeof record.appVersion !== 'string' || !record.appVersion.trim()) {
    throw new Error('手机同步包缺少 appVersion')
  }
  return buildCompanionSnapshot({
    appVersion: record.appVersion,
    exportedAt: record.exportedAt,
    classes: parseClassRecords(record.classes),
    students: parseStudentRecords(record.students),
    testItems: parseTestItems(record.testItems),
    peTests: parsePeTestSessions(record.peTests),
    ...('schedule' in record ? { schedule: parseScheduleItems(record.schedule) } : {}),
    ...('peSessions' in record ? { peSessions: parsePeSessions(record.peSessions) } : {})
  })
}

export function companionSnapshotFileName(exportedAt: string = new Date().toISOString()): string {
  const stamp = exportedAt.slice(0, 19).replace(/[:T]/g, '-')
  return `gdpe-companion-${stamp}.json`
}

export function serializeCompanionSnapshot(snapshot: CompanionSnapshot): string {
  return `${JSON.stringify(snapshot, null, 2)}\n`
}
