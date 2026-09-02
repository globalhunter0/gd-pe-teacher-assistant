import { useEffect, useId, useState } from 'react'
import type { ClassRecord } from '@shared/class'
import {
  STUDENT_GENDER_LABELS,
  STUDENT_GENDERS,
  STUDENT_STATUS_LABELS,
  STUDENT_STATUSES,
  createStudentId,
  type StudentGender,
  type StudentRecord,
  type StudentStatus
} from '@shared/student'

interface StudentEditorDialogProps {
  record: StudentRecord | null
  classes: ClassRecord[]
  onClose: () => void
  onSave: (record: StudentRecord) => Promise<void>
}

export default function StudentEditorDialog({
  record,
  classes,
  onClose,
  onSave
}: StudentEditorDialogProps): React.JSX.Element {
  const titleId = useId()
  const isEdit = record !== null
  const [classId, setClassId] = useState(record?.classId ?? classes[0]?.id ?? '')
  const [studentNo, setStudentNo] = useState(record?.studentNo ?? '')
  const [name, setName] = useState(record?.name ?? '')
  const [gender, setGender] = useState<StudentGender>(record?.gender ?? 'unspecified')
  const [status, setStatus] = useState<StudentStatus>(record?.status ?? 'active')
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
    if (classes.length === 0) {
      setFormError('请先在班级管理中创建班级')
      return
    }

    if (classId.trim() === '') {
      setFormError('请选择所属班级')
      return
    }

    const now = new Date().toISOString()
    setSaving(true)
    setFormError(null)

    try {
      await onSave({
        id: record?.id ?? createStudentId(),
        classId,
        studentNo: studentNo.trim(),
        name: name.trim(),
        gender,
        status,
        notes: notes.trim(),
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
        className="dialog dialog--student"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h3 id={titleId}>{isEdit ? '编辑学生' : '新增学生'}</h3>
        <p className="dialog-slot">
          {isEdit ? '修改后保存，学生编号保持不变。' : '填写学生基础档案。学号可以留空。'}
        </p>

        <div className="dialog-grid">
          <label className="dialog-span dialog-field-main">
            所属班级 *
            <select value={classId} onChange={(event) => setClassId(event.target.value)} autoFocus>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.grade} {item.className}
                </option>
              ))}
            </select>
          </label>
          <label>
            学号
            <input
              value={studentNo}
              onChange={(event) => setStudentNo(event.target.value)}
              placeholder="可留空"
            />
          </label>
          <label>
            姓名 *
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：陈晓明" />
          </label>
          <label>
            性别
            <select value={gender} onChange={(event) => setGender(event.target.value as StudentGender)}>
              {STUDENT_GENDERS.map((item) => (
                <option key={item} value={item}>
                  {STUDENT_GENDER_LABELS[item]}
                </option>
              ))}
            </select>
          </label>
          <label>
            状态
            <select value={status} onChange={(event) => setStatus(event.target.value as StudentStatus)}>
              {STUDENT_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {STUDENT_STATUS_LABELS[item]}
                </option>
              ))}
            </select>
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
