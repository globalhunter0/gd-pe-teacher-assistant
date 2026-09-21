import type { PETestRecord, PETestSession, PeTestSessionStatus, TestRecordStatus } from './types'

export const PE_TEST_SESSION_STATUSES: PeTestSessionStatus[] = ['in_progress', 'completed']

export const PE_TEST_SESSION_STATUS_LABELS: Record<PeTestSessionStatus, string> = {
  in_progress: '进行中',
  completed: '已完成'
}

/** 一次测试名单统计：已测=valid，未测=pending，缺考=absent。 */
export interface PeTestSessionProgress {
  total: number
  measured: number
  unmeasured: number
  absent: number
  exempt: number
  invalid: number
}

export function parsePeTestSessionStatus(value: unknown): PeTestSessionStatus {
  if (value === 'completed' || value === 'in_progress') {
    return value
  }
  return 'in_progress'
}

export function isPeTestSessionCompleted(session: Pick<PETestSession, 'status'>): boolean {
  return parsePeTestSessionStatus(session.status) === 'completed'
}

export function countPeTestSessionProgress(
  records: ReadonlyArray<Pick<PETestRecord, 'status'>>
): PeTestSessionProgress {
  let measured = 0
  let unmeasured = 0
  let absent = 0
  let exempt = 0
  let invalid = 0
  for (const record of records) {
    switch (record.status as TestRecordStatus) {
      case 'valid':
        measured += 1
        break
      case 'pending':
        unmeasured += 1
        break
      case 'absent':
        absent += 1
        break
      case 'exempt':
        exempt += 1
        break
      case 'invalid':
        invalid += 1
        break
      default:
        break
    }
  }
  return {
    total: records.length,
    measured,
    unmeasured,
    absent,
    exempt,
    invalid
  }
}

export function countIncompletePeTestSessions(sessions: ReadonlyArray<Pick<PETestSession, 'status'>>): number {
  return sessions.filter((session) => !isPeTestSessionCompleted(session)).length
}

export function markPeTestSessionCompleted(session: PETestSession, at: string = new Date().toISOString()): PETestSession {
  return {
    ...session,
    status: 'completed',
    completedAt: at,
    updatedAt: at
  }
}

export function reopenPeTestSession(session: PETestSession, at: string = new Date().toISOString()): PETestSession {
  return {
    ...session,
    status: 'in_progress',
    completedAt: null,
    updatedAt: at
  }
}
