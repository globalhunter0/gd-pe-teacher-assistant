import { useState } from 'react'
import StatCard from '../components/StatCard'
import { useClasses } from '../context/ClassContext'
import { useSchedule, useScheduleService } from '../context/ScheduleContext'
import { COURSE_TYPE_LABELS, formatTimeRange, type ScheduleItem } from '../data/schedule'
import { useNow } from '../hooks/useNow'
import { formatLocalDate, mapScheduleCourseType, type PeSessionPrefill } from '@shared/peSession'
import { listedClassRecords, type ClassRecord } from '@shared/class'
import { workbenchListedClass } from '@shared/schedule'

export interface PlanNavContext {
  grade: ClassRecord['grade']
  className: string
  academicYear: string
  semester: ClassRecord['semester']
}

interface DashboardPageProps {
  onStartRecord: (prefill: PeSessionPrefill) => void
  onOpenStudents: (classId: string) => void
  onOpenTests: (classId: string) => void
  onOpenPlan: (context: PlanNavContext) => void
}

export default function DashboardPage({
  onStartRecord,
  onOpenStudents,
  onOpenTests,
  onOpenPlan
}: DashboardPageProps): React.JSX.Element {
  const now = useNow()
  const { items, loading, error, saveItems } = useSchedule()
  const scheduleService = useScheduleService()
  const { classes } = useClasses()
  const listedClasses = listedClassRecords(classes)
  const summary = scheduleService.getWeeklySummary()
  const today = scheduleService.getTodayOverview(now)
  const [bindLesson, setBindLesson] = useState<ScheduleItem | null>(null)
  const [bindValue, setBindValue] = useState('')
  const [bindError, setBindError] = useState<string | null>(null)
  const [bindWorking, setBindWorking] = useState(false)

  function prefillFrom(lesson: ScheduleItem, classId?: string): PeSessionPrefill {
    return {
      date: formatLocalDate(now),
      period: lesson.period,
      scheduleLessonId: lesson.id,
      lessonType: mapScheduleCourseType(lesson.courseType),
      teamSnapshot: lesson.team,
      startTimeSnapshot: lesson.startTime,
      endTimeSnapshot: lesson.endTime,
      ...(classId ? { classId } : {})
    }
  }

  function openBind(lesson: ScheduleItem): void {
    setBindLesson(lesson)
    setBindValue(workbenchListedClass(lesson, classes)?.id ?? '')
    setBindError(null)
  }

  async function saveBind(): Promise<void> {
    if (!bindLesson) {
      return
    }
    setBindWorking(true)
    setBindError(null)
    try {
      const next = items.map((item) => {
        if (item.id !== bindLesson.id) {
          return item
        }
        const patched: ScheduleItem = { ...item }
        if (bindValue) {
          patched.classId = bindValue
        } else {
          delete patched.classId
        }
        return patched
      })
      await saveItems(next)
      setBindLesson(null)
    } catch (saveError) {
      setBindError(saveError instanceof Error ? saveError.message : '保存关联失败')
    } finally {
      setBindWorking(false)
    }
  }

  if (loading) {
    return (
      <section className="page">
        <div className="page-heading">
          <h2>工作台</h2>
          <p>正在读取本地课表…</p>
        </div>
      </section>
    )
  }

  return (
    <section className="page">
      <div className="page-heading">
        <h2>工作台</h2>
        <p>今天是{today.weekdayLabel}。课表按本机时间和已保存的课表自动计算。工作台只处理行政班体育课。</p>
      </div>

      {error ? <p className="page-error">{error}</p> : null}

      <div className="stat-grid">
        <StatCard
          label="今日课程"
          value={`${today.lessonCount} 节`}
          hint={today.lessonCount === 0 ? '今日无课程' : `共 ${today.lessonCount} 节待上或已安排`}
        />
        <StatCard
          label="本周课时"
          value={`${summary.total} 节`}
          hint={`常规 ${summary.regularCount} 节 · 大体育课 ${summary.bigCount} 节`}
        />
        <StatCard label="下一节" value={today.nextLessonLabel} hint={today.nextLessonHint} />
        <StatCard
          label="当前状态"
          value={today.status === 'in-class' ? '正在上课' : today.statusLabel}
          hint={
            today.currentLesson
              ? `${today.currentLesson.team} · 第${today.currentLesson.period}节 ${formatTimeRange(today.currentLesson.startTime, today.currentLesson.endTime)}`
              : today.weekdayLabel
          }
        />
      </div>

      <div className="info-panel">
        <h3>今日课程</h3>
        {today.lessons.length === 0 ? (
          <p className="today-empty">今日无课程</p>
        ) : (
          <ol className="today-list">
            {today.lessons.map((lesson) => {
              const isCurrent = today.currentLesson?.id === lesson.id
              const isNext = today.nextLesson?.id === lesson.id
              const boundClass = workbenchListedClass(lesson, classes)
              const classReady = Boolean(boundClass)

              return (
                <li
                  key={lesson.id}
                  className={
                    isCurrent ? 'today-item today-card is-current' : isNext ? 'today-item today-card is-next' : 'today-item today-card'
                  }
                >
                  <div className="today-item-period">
                    <span>第{lesson.period}节</span>
                    <span>{formatTimeRange(lesson.startTime, lesson.endTime)}</span>
                  </div>
                  <div className="today-item-main">
                    <p className="today-item-team">{lesson.team}</p>
                    <p className="today-item-type">{COURSE_TYPE_LABELS[lesson.courseType]}</p>
                    <div className="today-item-links">
                      <p>
                        {classReady
                          ? `行政班：${boundClass?.grade} ${boundClass?.className}`
                          : lesson.classId
                            ? '行政班：已删除班级'
                            : '行政班：未绑定'}
                      </p>
                    </div>
                  </div>
                  {isCurrent ? <span className="today-tag">当前</span> : null}
                  {!isCurrent && isNext ? <span className="today-tag today-tag--next">下一节</span> : null}
                  <div className="today-action-groups">
                    <div className="today-action-group">
                      {classReady ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-small btn-primary"
                            onClick={() => onStartRecord(prefillFrom(lesson, boundClass?.id))}
                          >
                            开始/继续课堂记录
                          </button>
                          <button type="button" className="btn btn-small" onClick={() => openBind(lesson)}>
                            绑定行政班
                          </button>
                          <button type="button" className="btn btn-small" onClick={() => onOpenStudents(boundClass?.id ?? '')}>
                            学生
                          </button>
                          <button type="button" className="btn btn-small" onClick={() => onOpenTests(boundClass?.id ?? '')}>
                            体育测试
                          </button>
                          <button
                            type="button"
                            className="btn btn-small"
                            onClick={() =>
                              onOpenPlan({
                                grade: boundClass?.grade ?? '初一',
                                className: boundClass?.className ?? '',
                                academicYear: boundClass?.academicYear ?? '',
                                semester: boundClass?.semester ?? '第一学期'
                              })
                            }
                          >
                            教学计划
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" className="btn btn-small btn-primary" onClick={() => onStartRecord(prefillFrom(lesson))}>
                            开始记录
                          </button>
                          <button type="button" className="btn btn-small" onClick={() => openBind(lesson)}>
                            绑定行政班
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </div>

      {bindLesson ? (
        <div className="dialog-backdrop" onMouseDown={() => setBindLesson(null)}>
          <div
            className="dialog dialog--class"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dash-bind-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h3 id="dash-bind-title">绑定行政班</h3>
            <p className="dialog-slot">
              {bindLesson.team} · 第{bindLesson.period}节。工作台只关联行政班，训练队请到「训练队」模块管理。
            </p>
            <label className="dialog-span">
              关联行政班
              <select value={bindValue} onChange={(event) => setBindValue(event.target.value)}>
                <option value="">不绑定</option>
                {listedClasses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.grade} {item.className}
                  </option>
                ))}
              </select>
            </label>
            {bindError ? <p className="dialog-error">{bindError}</p> : null}
            <div className="dialog-actions">
              <span />
              <div className="dialog-actions-right">
                <button type="button" className="btn" onClick={() => setBindLesson(null)} disabled={bindWorking}>
                  取消
                </button>
                <button type="button" className="btn btn-primary" onClick={() => void saveBind()} disabled={bindWorking}>
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
