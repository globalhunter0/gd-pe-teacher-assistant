import { useEffect, useId, useState } from 'react'
import { listedClassRecords } from '@shared/class'
import { useClasses } from '../context/ClassContext'
import {
  COURSE_TYPE_LABELS,
  WEEKDAY_LABELS,
  getDefaultSlotTime,
  type CourseType,
  type Period,
  type ScheduleItem,
  type Weekday
} from '../data/schedule'

interface LessonEditorDialogProps {
  weekday: Weekday
  period: Period
  lesson: ScheduleItem | undefined
  onClose: () => void
  onSave: (lesson: ScheduleItem) => Promise<void>
  onDelete?: () => Promise<void>
}

export default function LessonEditorDialog({
  weekday,
  period,
  lesson,
  onClose,
  onSave,
  onDelete
}: LessonEditorDialogProps): React.JSX.Element {
  const titleId = useId()
  const defaultTime = getDefaultSlotTime(period)
  const [team, setTeam] = useState(lesson?.team ?? '')
  const [courseType, setCourseType] = useState<CourseType>(lesson?.courseType ?? 'regular')
  const [classId, setClassId] = useState(lesson?.classId ?? '')
  const [startTime, setStartTime] = useState(lesson?.startTime ?? defaultTime.startTime)
  const [endTime, setEndTime] = useState(lesson?.endTime ?? defaultTime.endTime)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const { classes } = useClasses()
  const listedClasses = listedClassRecords(classes)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function handleSave(): Promise<void> {
    const trimmedTeam = team.trim()
    if (!trimmedTeam) {
      setFormError('请填写团队/班级名称')
      return
    }

    setSaving(true)
    setFormError(null)

    try {
      const payload: ScheduleItem = {
        id: `w${weekday}-p${period}`,
        weekday,
        period,
        team: trimmedTeam,
        courseType,
        startTime,
        endTime
      }
      if (classId) {
        payload.classId = classId
      }
      if (lesson?.trainingTeamId) {
        payload.trainingTeamId = lesson.trainingTeamId
      }
      await onSave(payload)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '保存失败')
      setSaving(false)
    }
  }

  async function handleDelete(): Promise<void> {
    if (!onDelete) {
      return
    }

    if (!window.confirm('确定删除这节课程吗？')) {
      return
    }

    setSaving(true)
    try {
      await onDelete()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '删除失败')
      setSaving(false)
    }
  }

  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <div
        className="dialog dialog--schedule"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h3 id={titleId}>编辑课程</h3>
        <p className="dialog-slot">
          {WEEKDAY_LABELS[weekday]} · 第{period}节
        </p>

        <div className="dialog-grid">
          <label className="dialog-span dialog-field-main">
            团队/班级
            <input
              value={team}
              onChange={(event) => setTeam(event.target.value)}
              placeholder="例如：团队5"
              autoFocus
            />
          </label>
          <label className="dialog-span">
            课程类型
            <select value={courseType} onChange={(event) => setCourseType(event.target.value as CourseType)}>
              <option value="regular">{COURSE_TYPE_LABELS.regular}</option>
              <option value="big">{COURSE_TYPE_LABELS.big}</option>
              <option value="other">{COURSE_TYPE_LABELS.other}</option>
            </select>
          </label>
          <label>
            关联行政班
            <select value={classId} onChange={(event) => setClassId(event.target.value)}>
              <option value="">不绑定</option>
              {classId && !listedClasses.some((item) => item.id === classId) ? (
                <option value={classId}>已删除班级（当前绑定）</option>
              ) : null}
              {listedClasses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.grade} {item.className}
                </option>
              ))}
            </select>
          </label>
          <p className="dialog-slot dialog-span">行政班用于工作台课堂记录。训练队请在「训练队」模块独立管理，不在课表中绑定。</p>
          <label>
            开始时间
            <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
          </label>
          <label>
            结束时间
            <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
          </label>
        </div>

        {formError ? <p className="dialog-error">{formError}</p> : null}

        <div className="dialog-actions">
          {onDelete ? (
            <button type="button" className="btn btn-danger" onClick={() => void handleDelete()} disabled={saving}>
              删除课程
            </button>
          ) : (
            <span />
          )}
          <div className="dialog-actions-right">
            <button type="button" className="btn" onClick={onClose} disabled={saving}>
              取消
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void handleSave()} disabled={saving}>
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
