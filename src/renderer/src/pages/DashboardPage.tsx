import StatCard from '../components/StatCard'
import { useSchedule, useScheduleService } from '../context/ScheduleContext'
import { COURSE_TYPE_LABELS, formatTimeRange } from '../data/schedule'
import { useNow } from '../hooks/useNow'
import { formatLocalDate, mapScheduleCourseType, type PeSessionPrefill } from '@shared/peSession'

interface DashboardPageProps {
  onStartRecord: (prefill: PeSessionPrefill) => void
}

export default function DashboardPage({ onStartRecord }: DashboardPageProps): React.JSX.Element {
  const now = useNow()
  const { loading, error } = useSchedule()
  const scheduleService = useScheduleService()
  const summary = scheduleService.getWeeklySummary()
  const today = scheduleService.getTodayOverview(now)

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
        <p>今天是{today.weekdayLabel}。课表按本机时间和已保存的课表自动计算。</p>
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

              return (
                <li
                  key={lesson.id}
                  className={
                    isCurrent ? 'today-item is-current' : isNext ? 'today-item is-next' : 'today-item'
                  }
                >
                  <div className="today-item-period">
                    <span>第{lesson.period}节</span>
                    <span>{formatTimeRange(lesson.startTime, lesson.endTime)}</span>
                  </div>
                  <div className="today-item-main">
                    <p className="today-item-team">{lesson.team}</p>
                    <p className="today-item-type">{COURSE_TYPE_LABELS[lesson.courseType]}</p>
                  </div>
                  {isCurrent ? <span className="today-tag">当前</span> : null}
                  {!isCurrent && isNext ? <span className="today-tag today-tag--next">下一节</span> : null}
                  <button
                    type="button"
                    className="btn btn-small today-start"
                    onClick={() =>
                      onStartRecord({
                        date: formatLocalDate(now),
                        period: lesson.period,
                        scheduleLessonId: lesson.id,
                        lessonType: mapScheduleCourseType(lesson.courseType),
                        teamSnapshot: lesson.team,
                        startTimeSnapshot: lesson.startTime,
                        endTimeSnapshot: lesson.endTime
                      })
                    }
                  >
                    开始记录
                  </button>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </section>
  )
}
