import { useState } from 'react'
import LessonEditorDialog from '../components/LessonEditorDialog'
import { useClasses } from '../context/ClassContext'
import { useSchedule, useScheduleService } from '../context/ScheduleContext'
import { useTraining } from '../context/TrainingContext'
import {
  COURSE_TYPE_LABELS,
  PERIODS,
  WEEKDAY_LABELS,
  WEEKDAYS,
  getPeriodTimeLabel,
  type Period,
  type ScheduleItem,
  type Weekday
} from '../data/schedule'

interface EditingSlot {
  weekday: Weekday
  period: Period
}

export default function SchedulePage(): React.JSX.Element {
  const { items, loading, error, saveItems, restoreDefault } = useSchedule()
  const { classes } = useClasses()
  const { teams } = useTraining()
  const scheduleService = useScheduleService()
  const summary = scheduleService.getWeeklySummary()
  const todayWeekday = scheduleService.getTodayOverview().weekday
  const [editing, setEditing] = useState(false)
  const [slot, setSlot] = useState<EditingSlot | null>(null)

  const editingLesson = slot ? scheduleService.getLessonAt(slot.weekday, slot.period) : undefined

  async function handleSaveLesson(lesson: ScheduleItem): Promise<void> {
    const next = items.filter((item) => !(item.weekday === lesson.weekday && item.period === lesson.period))
    next.push(lesson)
    await saveItems(next)
    setSlot(null)
  }

  async function handleDeleteLesson(): Promise<void> {
    if (!slot) {
      return
    }

    const next = items.filter((item) => !(item.weekday === slot.weekday && item.period === slot.period))
    await saveItems(next)
    setSlot(null)
  }

  function handleRestore(): void {
    if (!window.confirm('恢复后，当前课表修改将被替换为初始课表，是否继续？')) {
      return
    }

    void restoreDefault()
    setEditing(false)
    setSlot(null)
  }

  if (loading) {
    return (
      <section className="page page--schedule">
        <div className="page-heading">
          <h2>我的课表</h2>
          <p>正在读取本地课表…</p>
        </div>
      </section>
    )
  }

  return (
    <section className="page page--schedule">
      <div className="page-heading page-heading--split">
        <div className="page-heading-text">
          <h2>我的课表</h2>
          <p>
            {summary.semesterLabel} ｜ 本周 {summary.total} 节 ｜ 常规 {summary.regularCount} 节 ｜ 大体育课{' '}
            {summary.bigCount} 节
            {summary.otherCount > 0 ? ` ｜ 其他 ${summary.otherCount} 节` : ''}
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn" onClick={handleRestore}>
            恢复默认课表
          </button>
          <button
            type="button"
            className={editing ? 'btn btn-primary' : 'btn'}
            onClick={() => setEditing((value) => !value)}
          >
            {editing ? '完成编辑' : '编辑课表'}
          </button>
        </div>
      </div>

      {error ? <p className="page-error">{error}</p> : null}

      {editing ? <p className="edit-hint">编辑模式：点击任意格子即可添加、修改或删除课程。</p> : null}

      <div className="timetable-wrap">
        <div className="timetable" role="table">
          <div className="timetable-row" role="row">
            <div className="timetable-heading timetable-period-col" role="columnheader">
              节次
            </div>
            {WEEKDAYS.map((weekday) => (
              <div
                key={weekday}
                className={weekday === todayWeekday ? 'timetable-heading is-today' : 'timetable-heading'}
                role="columnheader"
              >
                {WEEKDAY_LABELS[weekday]}
                {weekday === todayWeekday ? <span className="today-mark">今天</span> : null}
              </div>
            ))}
          </div>
          {PERIODS.map((period) => (
            <div className="timetable-row" role="row" key={period}>
              <div className="timetable-period" role="rowheader">
                <span>第{period}节</span>
                {getPeriodTimeLabel(period) ? <span className="period-time">{getPeriodTimeLabel(period)}</span> : null}
              </div>
              {WEEKDAYS.map((weekday) => {
                const lesson = scheduleService.getLessonAt(weekday, period)
                const boundClass = lesson?.classId ? classes.find((item) => item.id === lesson.classId) : undefined
                const boundTeam = lesson?.trainingTeamId
                  ? teams.find((item) => item.id === lesson.trainingTeamId)
                  : undefined
                return (
                  <div
                    key={`${weekday}-${period}`}
                    className={weekday === todayWeekday ? 'timetable-slot is-today' : 'timetable-slot'}
                    role="cell"
                  >
                    <ScheduleCell
                      lesson={lesson}
                      editable={editing}
                      classLabel={
                        lesson?.classId ? (boundClass ? `${boundClass.grade} ${boundClass.className}` : '班级已删除') : null
                      }
                      teamLabel={
                        lesson?.trainingTeamId ? (boundTeam ? boundTeam.name : '训练队已删除') : null
                      }
                      onSelect={() => setSlot({ weekday, period })}
                    />
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {slot ? (
        <LessonEditorDialog
          weekday={slot.weekday}
          period={slot.period}
          lesson={editingLesson}
          onClose={() => setSlot(null)}
          onSave={handleSaveLesson}
          onDelete={editingLesson ? handleDeleteLesson : undefined}
        />
      ) : null}
    </section>
  )
}

function ScheduleCell({
  lesson,
  editable,
  classLabel,
  teamLabel,
  onSelect
}: {
  lesson: ScheduleItem | undefined
  editable: boolean
  classLabel: string | null
  teamLabel: string | null
  onSelect: () => void
}): React.JSX.Element {
  if (!lesson) {
    return (
      <button
        type="button"
        className={editable ? 'lesson-cell lesson-cell--empty is-editable' : 'lesson-cell lesson-cell--empty'}
        onClick={editable ? onSelect : undefined}
        tabIndex={editable ? 0 : -1}
      />
    )
  }

  const typeClass =
    lesson.courseType === 'big'
      ? 'lesson-cell lesson-cell--big'
      : lesson.courseType === 'other'
        ? 'lesson-cell lesson-cell--other'
        : 'lesson-cell lesson-cell--regular'

  return (
    <button
      type="button"
      className={editable ? `${typeClass} is-editable` : typeClass}
      onClick={editable ? onSelect : undefined}
      tabIndex={editable ? 0 : -1}
    >
      <span className="lesson-team">{lesson.team}</span>
      <span className="lesson-type">{COURSE_TYPE_LABELS[lesson.courseType]}</span>
      {classLabel ? <span className="lesson-link">班：{classLabel}</span> : null}
      {teamLabel ? <span className="lesson-link">队：{teamLabel}</span> : null}
    </button>
  )
}
