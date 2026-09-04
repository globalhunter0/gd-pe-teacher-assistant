import { useEffect, useId, useState } from 'react'
import { DEFAULT_ACADEMIC_YEAR, GRADES, SEMESTERS, type Grade, type Semester } from '@shared/class'
import {
  MAX_PLAN_WEEKS,
  MIN_PLAN_WEEKS,
  createEmptyWeeks,
  createTeachingPlanId,
  type TeachingPlan
} from '@shared/teachingPlan'

interface TeachingPlanCreateDialogProps {
  onClose: () => void
  onSave: (plan: TeachingPlan) => Promise<void>
}

export default function TeachingPlanCreateDialog({
  onClose,
  onSave
}: TeachingPlanCreateDialogProps): React.JSX.Element {
  const titleId = useId()
  const [name, setName] = useState('')
  const [grade, setGrade] = useState<Grade>('初一')
  const [academicYear, setAcademicYear] = useState(DEFAULT_ACADEMIC_YEAR)
  const [semester, setSemester] = useState<Semester>('第一学期')
  const [totalWeeks, setTotalWeeks] = useState('18')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

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
    const weeksCount = Number(totalWeeks.trim())
    if (!Number.isInteger(weeksCount) || weeksCount < MIN_PLAN_WEEKS || weeksCount > MAX_PLAN_WEEKS) {
      setFormError(`总周数必须是 ${MIN_PLAN_WEEKS} 到 ${MAX_PLAN_WEEKS} 的整数`)
      return
    }

    const now = new Date().toISOString()
    const weeks = createEmptyWeeks(weeksCount)

    setSaving(true)
    setFormError(null)

    try {
      await onSave({
        id: createTeachingPlanId(),
        name: name.trim(),
        academicYear: academicYear.trim(),
        semester,
        grade,
        startDate: startDate.trim() === '' ? null : startDate.trim(),
        endDate: endDate.trim() === '' ? null : endDate.trim(),
        totalWeeks: weeks.length,
        notes: notes.trim(),
        createdAt: now,
        updatedAt: now,
        weeks
      })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '保存失败')
      setSaving(false)
    }
  }

  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <div
        className="dialog dialog--plan"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h3 id={titleId}>新建教学计划</h3>
        <p className="dialog-slot">按年级编写计划，不绑定单个班级。起止日期可选，不会按“本学期”自动填写。</p>

        <div className="dialog-grid">
          <label className="dialog-span dialog-field-main">
            计划名称 *
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：初一第一学期教学计划" autoFocus />
          </label>
          <label>
            年级 *
            <select value={grade} onChange={(event) => setGrade(event.target.value as Grade)}>
              {GRADES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            学期 *
            <select value={semester} onChange={(event) => setSemester(event.target.value as Semester)}>
              {SEMESTERS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            学年 *
            <input value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} placeholder="2026-2027" />
          </label>
          <label>
            总周数 *
            <input inputMode="numeric" value={totalWeeks} onChange={(event) => setTotalWeeks(event.target.value)} />
          </label>
          <label>
            开始日期（可选）
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </label>
          <label>
            结束日期（可选）
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </label>
          <label className="dialog-span">
            备注
            <textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>
        </div>

        {formError ? <p className="dialog-error">{formError}</p> : null}

        <div className="dialog-actions">
          <span />
          <div className="dialog-actions-right">
            <button type="button" className="btn" onClick={onClose} disabled={saving}>
              取消
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void handleSave()} disabled={saving}>
              创建
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
