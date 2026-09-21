import type { ClassRecord, Grade } from '../class/types'
import { isPeSessionCompleted } from '../peSession/sessionStatus'
import type { PEClassSession } from '../peSession/types'

export interface WeeklyExecutionClassRef {
  classId: string
  grade: Grade
  className: string
}

export interface WeeklyExecutionRecentItem {
  sessionId: string
  date: string
  period: number
  classId: string
  grade: Grade
  className: string
  topic: string
}

export interface WeeklyPlanExecution {
  completedCount: number
  classes: WeeklyExecutionClassRef[]
  recent: WeeklyExecutionRecentItem[]
}

/**
 * 由已完成课堂记录派生本周计划执行情况。
 * 优先 teachingPlanId + teachingPlanWeekId；无引用的旧 session 不猜测归属。
 * 同一 session 只计一次；in_progress 不计。
 */
export function deriveWeeklyPlanExecution(options: {
  teachingPlanId: string
  teachingPlanWeekId: string | null
  sessions: ReadonlyArray<PEClassSession>
  classNameById?: ReadonlyMap<string, Pick<ClassRecord, 'grade' | 'className'>>
}): WeeklyPlanExecution {
  const seen = new Set<string>()
  const recent: WeeklyExecutionRecentItem[] = []
  const classMap = new Map<string, WeeklyExecutionClassRef>()

  if (!options.teachingPlanId || !options.teachingPlanWeekId) {
    return { completedCount: 0, classes: [], recent: [] }
  }

  for (const session of options.sessions) {
    if (seen.has(session.id)) {
      continue
    }
    if (!isPeSessionCompleted(session)) {
      continue
    }
    if (session.teachingPlanId !== options.teachingPlanId) {
      continue
    }
    if (session.teachingPlanWeekId !== options.teachingPlanWeekId) {
      continue
    }

    seen.add(session.id)
    const live = options.classNameById?.get(session.classId)
    const grade = live?.grade ?? session.gradeSnapshot
    const className = live?.className ?? session.classNameSnapshot
    if (!classMap.has(session.classId)) {
      classMap.set(session.classId, { classId: session.classId, grade, className })
    }
    recent.push({
      sessionId: session.id,
      date: session.date,
      period: session.period,
      classId: session.classId,
      grade,
      className,
      topic: session.topic
    })
  }

  recent.sort(
    (a, b) => b.date.localeCompare(a.date) || b.period - a.period || a.className.localeCompare(b.className, 'zh-CN')
  )

  return {
    completedCount: recent.length,
    classes: Array.from(classMap.values()).sort(
      (a, b) => a.grade.localeCompare(b.grade, 'zh-CN') || a.className.localeCompare(b.className, 'zh-CN')
    ),
    recent
  }
}
