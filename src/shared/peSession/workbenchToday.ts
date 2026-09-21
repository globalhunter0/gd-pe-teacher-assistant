import type { ScheduleItem } from '../schedule/types'
import type { PEClassSession } from './types'
import { resolvePeSessionStatus } from './sessionStatus'

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

function isLinkedToScheduleLesson(
  session: Pick<PEClassSession, 'scheduleLessonId' | 'date'>,
  lessonId: string,
  date: string
): boolean {
  return Boolean(session.scheduleLessonId) && session.scheduleLessonId === lessonId && session.date === date
}

/**
 * 工作台今日课的课堂记录状态。
 * 优先 scheduleLessonId + 教学日期；旧记录缺少关联时才回退班级+日期+节次。
 * 独立补课（scheduleLessonId 为空且 lessonType=extra）不得把正常课表格子标成已记录。
 */
export function findSessionForWorkbenchLesson(
  sessions: ReadonlyArray<PEClassSession>,
  lesson: Pick<ScheduleItem, 'id' | 'period' | 'classId'>,
  date: string
): PEClassSession | undefined {
  const linked = sessions.find((session) => isLinkedToScheduleLesson(session, lesson.id, date))
  if (linked) {
    return linked
  }

  const classId = lesson.classId
  if (!classId) {
    return undefined
  }

  return sessions.find(
    (session) =>
      (session.scheduleLessonId === null || session.scheduleLessonId === '') &&
      session.lessonType !== 'extra' &&
      session.classId === classId &&
      session.date === date &&
      session.period === lesson.period
  )
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

/** 创建课堂前的防重：同一课表格子+日期，或同一班级+日期+节次，都视为已有记录。 */
export function findExistingPeSession(
  sessions: ReadonlyArray<PEClassSession>,
  query: {
    classId: string
    date: string
    period: number
    scheduleLessonId?: string | null
    excludeId?: string
  }
): PEClassSession | undefined {
  if (query.scheduleLessonId) {
    const scheduleLessonId = query.scheduleLessonId
    const linked = sessions.find(
      (session) => session.id !== query.excludeId && isLinkedToScheduleLesson(session, scheduleLessonId, query.date)
    )
    if (linked) {
      return linked
    }
  }

  return sessions.find(
    (session) =>
      session.id !== query.excludeId &&
      session.classId === query.classId &&
      session.date === query.date &&
      session.period === query.period
  )
}
