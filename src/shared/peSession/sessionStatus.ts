import type { PEClassSession, PeSessionStatus } from './types'
import { PE_SESSION_STATUSES } from './types'

export function parsePeSessionStatus(value: unknown): PeSessionStatus {
  if (PE_SESSION_STATUSES.includes(value as PeSessionStatus)) {
    return value as PeSessionStatus
  }
  return 'in_progress'
}

/**
 * 有效课堂状态。旧 JSON 缺 status 时视为记录中，不得当作已完成。
 */
export function resolvePeSessionStatus(
  session: Pick<PEClassSession, 'status'>
): PeSessionStatus {
  if (session.status === undefined || session.status === null) {
    return 'in_progress'
  }
  return parsePeSessionStatus(session.status)
}

export function isPeSessionCompleted(session: Pick<PEClassSession, 'status'>): boolean {
  return resolvePeSessionStatus(session) === 'completed'
}

export function markPeSessionCompleted(
  session: PEClassSession,
  at: string = new Date().toISOString(),
  notes?: string
): PEClassSession {
  const next: PEClassSession = {
    ...session,
    status: 'completed',
    completedAt: at,
    updatedAt: at
  }
  if (notes !== undefined) {
    next.notes = notes.trim()
  }
  return next
}

export function reopenPeSession(
  session: PEClassSession,
  at: string = new Date().toISOString()
): PEClassSession {
  return {
    ...session,
    status: 'in_progress',
    completedAt: null,
    updatedAt: at
  }
}
