import type { ScheduleItem } from '../schedule/types'
import type { PEClassSession } from './types'
import { resolvePeSessionStatus } from './sessionStatus'
import { classroomIdentityKey } from './identity'

export type WorkbenchRecordStatus = 'unrecorded' | 'in_progress' | 'completed'

export const WORKBENCH_RECORD_STATUS_LABELS: Record<WorkbenchRecordStatus, string> = {
  unrecorded: '未记录',
  in_progress: '记录中',
  completed: '已完成'
}

export interface WorkbenchLessonRecordMatch {
  status: WorkbenchRecordStatus
  session: PEClassSession | undefined
}

/** Business identity: class + date + period + ordinary/independent-extra.
 * Schedule IDs and teaching plan IDs are provenance, never identity. */
export function findSessionForWorkbenchLesson(
  sessions: ReadonlyArray<PEClassSession>,
  lesson: Pick<ScheduleItem, 'id' | 'period' | 'classId'>,
  date: string
): PEClassSession | undefined {
  if (!lesson.classId) return undefined
  return findExistingPeSession(sessions, { classId: lesson.classId, date, period: lesson.period, scheduleLessonId: lesson.id })
}

export function resolveWorkbenchLessonRecord(
  sessions: ReadonlyArray<PEClassSession>,
  lesson: Pick<ScheduleItem, 'id' | 'period' | 'classId'>,
  date: string
): WorkbenchLessonRecordMatch {
  const session = findSessionForWorkbenchLesson(sessions, lesson, date)
  if (!session) {
    return { status: 'unrecorded', session: undefined }
  }
  return {
    status: resolvePeSessionStatus(session),
    session
  }
}

export function workbenchActionLabel(status: WorkbenchRecordStatus): string {
  switch (status) {
    case 'completed':
      return '查看记录'
    case 'in_progress':
      return '继续记录'
    default:
      return '开始课堂'
  }
}

export function findPeSessionById(
  sessions: ReadonlyArray<PEClassSession>,
  sessionId: string
): PEClassSession | undefined {
  return sessions.find((session) => session.id === sessionId)
}

export function findExistingPeSession(
  sessions: ReadonlyArray<PEClassSession>,
  query: { classId: string; date: string; period: number; scheduleLessonId?: string | null; lessonType?: PEClassSession['lessonType']; excludeId?: string }
): PEClassSession | undefined {
  const key = classroomIdentityKey(query)
  return sessions.find(session => session.id !== query.excludeId && classroomIdentityKey(session) === key)
}
