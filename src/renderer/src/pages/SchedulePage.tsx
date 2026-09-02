import {
  COURSE_TYPE_LABELS,
  PERIODS,
  WEEKDAY_LABELS,
  WEEKDAYS,
  scheduleService,
  type Period,
  type Weekday
} from '../data/schedule'
import { formatTimeRange, getPeriodTimeLabel } from '../data/schedule'

export default function SchedulePage(): React.JSX.Element {
  const summary = scheduleService.getWeeklySummary()

  return (
    <section className="page page--schedule">
      <div className="page-heading">
        <h2>我的课表</h2>
        <p>
          {summary.semesterLabel} · 本周 {summary.total} 节 · 常规体育课 {summary.regularCount}{' '}
          节 · 大体育课 {summary.bigCount} 节
        </p>
      </div>

      <div className="schedule-summary">
        <span>{summary.semesterLabel}</span>
        <span>本周 {summary.total} 节</span>
        <span>常规体育课 {summary.regularCount} 节</span>
        <span>大体育课 {summary.bigCount} 节</span>
      </div>

      <div className="timetable-wrap">
        <table className="timetable">
          <thead>
            <tr>
              <th className="timetable-period-col">节次</th>
              {WEEKDAYS.map((weekday) => (
                <th key={weekday}>{WEEKDAY_LABELS[weekday]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((period) => (
              <tr key={period}>
                <th>
                  <div className="period-cell">
                    <span>第{period}节</span>
                    {getPeriodTimeLabel(period) ? (
                      <span className="period-time">{getPeriodTimeLabel(period)}</span>
                    ) : null}
                  </div>
                </th>
                {WEEKDAYS.map((weekday) => (
                  <td key={`${weekday}-${period}`}>
                    <ScheduleCell weekday={weekday} period={period} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ScheduleCell({ weekday, period }: { weekday: Weekday; period: Period }): React.JSX.Element {
  const lesson = scheduleService.getLessonAt(weekday, period)

  if (!lesson) {
    return <div className="lesson-cell lesson-cell--empty" />
  }

  const isBig = lesson.courseType === 'big'

  return (
    <div className={isBig ? 'lesson-cell lesson-cell--big' : 'lesson-cell lesson-cell--regular'}>
      <p className="lesson-team">{lesson.team}</p>
      <p className="lesson-type">{COURSE_TYPE_LABELS[lesson.courseType]}</p>
      <p className="lesson-time">{formatTimeRange(lesson.startTime, lesson.endTime)}</p>
    </div>
  )
}
