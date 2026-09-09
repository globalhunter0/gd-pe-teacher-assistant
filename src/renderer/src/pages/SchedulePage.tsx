import { useMemo, useState } from 'react'
import LessonEditorDialog from '../components/LessonEditorDialog'
import ScheduleImportDialog from '../components/ScheduleImportDialog'
import { isListedClass } from '@shared/class'
import { applyScheduleBulkDelete, formatScheduleBulkDeleteConfirm } from '@shared/schedule'
import { useClasses } from '../context/ClassContext'
import { useSchedule, useScheduleService } from '../context/ScheduleContext'
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
  const { items, loading, error, saveItems, restoreDefault, applyLoadedItems } = useSchedule()
  const { classes } = useClasses()
  const scheduleService = useScheduleService()
  const summary = scheduleService.getWeeklySummary()
  const todayWeekday = scheduleService.getTodayOverview().weekday
  const [editing, setEditing] = useState(false)
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [working, setWorking] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [slot, setSlot] = useState<EditingSlot | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  const editingLesson = slot ? scheduleService.getLessonAt(slot.weekday, slot.period) : undefined
  const visibleIds = useMemo(() => items.map((item) => item.id), [items])
  const selectedCount = selectedIds.length
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id))

  function enterBulkMode(): void {
    setEditing(false)
    setSlot(null)
    setSelectedIds([])
    setConfirmOpen(false)
    setActionError(null)
    setBulkMode(true)
  }

  function exitBulkMode(): void {
    setBulkMode(false)
    setSelectedIds([])
    setConfirmOpen(false)
    setActionError(null)
  }

  function toggleSelected(id: string): void {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  function toggleSelectAll(): void {
    setSelectedIds(allVisibleSelected ? [] : [...visibleIds])
  }

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
    exitBulkMode()
    setSlot(null)
  }

  async function confirmBulkDelete(): Promise<void> {
    if (selectedCount === 0) {
      return
    }

    const next = applyScheduleBulkDelete(items, selectedIds)
    if (!next) {
      setConfirmOpen(false)
      return
    }

    setWorking(true)
    setActionError(null)
    try {
      await saveItems(next)
      exitBulkMode()
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : '删除课表失败')
    } finally {
      setWorking(false)
      setConfirmOpen(false)
    }
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
          {bulkMode ? (
            <>
              <button type="button" className="btn" onClick={exitBulkMode} disabled={working}>
                取消
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={selectedCount === 0 || working}
                onClick={() => setConfirmOpen(true)}
              >
                删除所选
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn" onClick={handleRestore}>
                恢复默认课表
              </button>
              <button
                type="button"
                className={editing ? 'btn btn-primary' : 'btn'}
                onClick={() => {
                  setEditing((value) => !value)
                  setBulkMode(false)
                }}
              >
                {editing ? '完成编辑' : '编辑课表'}
              </button>
              <button type="button" className="btn" onClick={enterBulkMode} disabled={items.length === 0}>
                批量删除
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setEditing(false)
                  setImportOpen(true)
                }}
              >
                导入/更新课表
              </button>
            </>
          )}
        </div>
      </div>

      {error ? <p className="page-error">{error}</p> : null}
      {actionError ? <p className="page-error">{actionError}</p> : null}

      {editing ? <p className="edit-hint">编辑模式：点击任意格子即可添加、修改或删除课程。</p> : null}
      {bulkMode ? (
        <div className="toolbar schedule-bulk-toolbar">
          <label className="toolbar-field">
            <span className="schedule-bulk-check">
              <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} disabled={working} />
              全选
            </span>
          </label>
          <p className="edit-hint" style={{ margin: 0 }}>
            已选择 {selectedCount} 节
          </p>
        </div>
      ) : null}

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
                const boundClass = lesson?.classId
                  ? classes.find((item) => item.id === lesson.classId && isListedClass(item))
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
                      selecting={bulkMode}
                      selected={Boolean(lesson && selectedIds.includes(lesson.id))}
                      classLabel={
                        lesson?.classId ? (boundClass ? `${boundClass.grade} ${boundClass.className}` : '已删除班级') : null
                      }
                      onSelect={() => setSlot({ weekday, period })}
                      onToggle={() => {
                        if (lesson) {
                          toggleSelected(lesson.id)
                        }
                      }}
                    />
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {slot && !bulkMode ? (
        <LessonEditorDialog
          weekday={slot.weekday}
          period={slot.period}
          lesson={editingLesson}
          onClose={() => setSlot(null)}
          onSave={handleSaveLesson}
          onDelete={editingLesson ? handleDeleteLesson : undefined}
        />
      ) : null}

      {confirmOpen ? (
        <div className="dialog-backdrop" onMouseDown={() => !working && setConfirmOpen(false)}>
          <div className="dialog" role="dialog" onMouseDown={(event) => event.stopPropagation()}>
            <h3>删除所选课表</h3>
            <p className="dialog-slot" style={{ whiteSpace: 'pre-wrap' }}>
              {formatScheduleBulkDeleteConfirm(selectedCount)}
            </p>
            <div className="dialog-actions">
              <span />
              <div className="dialog-actions-right">
                <button type="button" className="btn" onClick={() => setConfirmOpen(false)} disabled={working}>
                  取消
                </button>
                <button type="button" className="btn btn-danger" onClick={() => void confirmBulkDelete()} disabled={working}>
                  确认删除
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {importOpen ? (
        <ScheduleImportDialog
          onClose={() => setImportOpen(false)}
          onImported={(nextItems) => {
            applyLoadedItems(nextItems)
            exitBulkMode()
            setEditing(false)
          }}
        />
      ) : null}
    </section>
  )
}

function ScheduleCell({
  lesson,
  editable,
  selecting,
  selected,
  classLabel,
  onSelect,
  onToggle
}: {
  lesson: ScheduleItem | undefined
  editable: boolean
  selecting: boolean
  selected: boolean
  classLabel: string | null
  onSelect: () => void
  onToggle: () => void
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
  const selectedClass = selecting && selected ? ' is-selected' : ''

  if (selecting) {
    return (
      <label className={`${typeClass} is-selectable${selectedClass}`}>
        <input type="checkbox" checked={selected} onChange={onToggle} />
        <span className="lesson-team">{lesson.team}</span>
        <span className="lesson-type">{COURSE_TYPE_LABELS[lesson.courseType]}</span>
        {classLabel ? <span className="lesson-link">班：{classLabel}</span> : null}
      </label>
    )
  }

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
    </button>
  )
}
