import { useEffect, useId, useState } from 'react'
import {
  DEFAULT_ACADEMIC_YEAR,
  GRADES,
  SEMESTERS,
  createClassId,
  type ClassRecord,
  type Grade,
  type Semester
} from '@shared/class'

interface ClassEditorDialogProps {
  record: ClassRecord | null
  onClose: () => void
  onSave: (record: ClassRecord) => Promise<void>
}

export default function ClassEditorDialog({
  record,
  onClose,
  onSave
}: ClassEditorDialogProps): React.JSX.Element {
  const titleId = useId()
  const isEdit = record !== null
  const [className, setClassName] = useState(record?.className ?? '')
  const [grade, setGrade] = useState<Grade>(record?.grade ?? '初一')
  const [academicYear, setAcademicYear] = useState(record?.academicYear ?? DEFAULT_ACADEMIC_YEAR)
  const [semester, setSemester] = useState<Semester>(record?.semester ?? '第一学期')
  const [studentCount, setStudentCount] = useState(record ? String(record.studentCount) : '0')
  const [notes, setNotes] = useState(record?.notes ?? '')
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
    const now = new Date().toISOString()
    const count = studentCount.trim() === '' ? 0 : Number(studentCount.trim())

    if (!Number.isInteger(count) || count < 0) {
      setFormError('学生人数必须是大于或等于 0 的整数')
      return
    }

    setSaving(true)
    setFormError(null)

    try {
      await onSave({
        id: record?.id ?? createClassId(),
        className: className.trim(),
        grade,
        academicYear: academicYear.trim(),
        semester,
        studentCount: count,
        notes: notes.trim(),
        status: record?.status ?? 'active',
        createdAt: record?.createdAt ?? now,
        updatedAt: now
      })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '保存失败')
      setSaving(false)
    }
  }

  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <div
        className="dialog dialog--class"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h3 id={titleId}>{isEdit ? '编辑班级' : '新建班级'}</h3>
        <p className="dialog-slot">{isEdit ? '修改后保存，班级编号保持不变。' : '填写任教班级基础信息。'}</p>

        <div className="dialog-grid">
          <label className="dialog-span dialog-field-main">
            班级名称 *
            <input
              value={className}
              onChange={(event) => setClassName(event.target.value)}
              placeholder="例如：初一1班"
              autoFocus
            />
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
            <input
              value={academicYear}
              onChange={(event) => setAcademicYear(event.target.value)}
              placeholder="2026-2027"
            />
          </label>
          <label>
            学生人数
            <input
              inputMode="numeric"
              value={studentCount}
              onChange={(event) => setStudentCount(event.target.value)}
            />
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
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
