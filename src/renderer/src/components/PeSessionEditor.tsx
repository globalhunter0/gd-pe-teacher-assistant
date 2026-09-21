import { useMemo, useState } from 'react'
import PageLayout, { PageHeader } from './PageLayout'
import {
  ATTENDANCE_LABELS,
  ATTENDANCE_STATUSES,
  PERFORMANCE_TAG_LABELS,
  PERFORMANCE_TAGS,
  PE_LESSON_TYPE_LABELS,
  appendActiveStudentsToSession,
  listMissingActiveStudents,
  type AttendanceStatus,
  type PEClassSession,
  type PEStudentRecord,
  type PerformanceTag
} from '@shared/peSession'
import type { StudentRecord } from '@shared/student'
import { useStudents } from '../context/StudentContext'

interface PeSessionEditorProps {
  session: PEClassSession
  onBack: () => void
  onSave: (session: PEClassSession) => Promise<void>
  planPrefillHint?: string | null
}

export default function PeSessionEditor({
  session,
  onBack,
  onSave,
  planPrefillHint = null
}: PeSessionEditorProps): React.JSX.Element {
  const { students } = useStudents()
  const [draft, setDraft] = useState<PEClassSession>(session)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [openTagId, setOpenTagId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dismissedSync, setDismissedSync] = useState(false)

  const records = useMemo(
    () =>
      [...draft.records].sort(
        (a, b) =>
          a.studentNoSnapshot.localeCompare(b.studentNoSnapshot, 'zh-CN', { numeric: true }) ||
          a.nameSnapshot.localeCompare(b.nameSnapshot, 'zh-CN')
      ),
    [draft.records]
  )

  const missingStudents = useMemo(
    () => listMissingActiveStudents(draft, students as StudentRecord[]),
    [draft, students]
  )

  function touchSession(patch: Partial<PEClassSession>): void {
    const now = new Date().toISOString()
    setDraft((current) => ({ ...current, ...patch, updatedAt: now }))
    setMessage(null)
  }

  function updateRecord(id: string, patch: Partial<PEStudentRecord>): void {
    const now = new Date().toISOString()
    setDraft((current) => ({
      ...current,
      updatedAt: now,
      records: current.records.map((record) =>
        record.id === id ? { ...record, ...patch, updatedAt: now } : record
      )
    }))
    setMessage(null)
  }

  function setStatus(id: string, attendanceStatus: AttendanceStatus): void {
    updateRecord(id, { attendanceStatus })
  }

  function toggleTag(id: string, tag: PerformanceTag): void {
    const record = draft.records.find((item) => item.id === id)
    if (!record) {
      return
    }

    const performanceTags = record.performanceTags.includes(tag)
      ? record.performanceTags.filter((item) => item !== tag)
      : [...record.performanceTags, tag]
    updateRecord(id, { performanceTags })
  }

  function applyBatch(attendanceStatus: AttendanceStatus): void {
    if (selected.size === 0) {
      return
    }

    const now = new Date().toISOString()
    setDraft((current) => ({
      ...current,
      updatedAt: now,
      records: current.records.map((record) =>
        selected.has(record.id) ? { ...record, attendanceStatus, updatedAt: now } : record
      )
    }))
    setMessage(null)
  }

  function toggleSelect(id: string): void {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleSelectAll(): void {
    if (selected.size === records.length) {
      setSelected(new Set())
      return
    }

    setSelected(new Set(records.map((item) => item.id)))
  }

  function handleAppendMissingStudents(): void {
    if (missingStudents.length === 0) {
      return
    }
    const confirmed = window.confirm(
      `将补充 ${missingStudents.length} 名在读学生到本节课堂记录？\n已有学生的考勤、表现与备注不会被修改。`
    )
    if (!confirmed) {
      return
    }
    const { session: next, addedCount } = appendActiveStudentsToSession(draft, students as StudentRecord[])
    if (addedCount === 0) {
      setDismissedSync(true)
      return
    }
    setDraft(next)
    setDismissedSync(true)
    setMessage(`已补充 ${addedCount} 名学生，请保存课堂记录`)
    setError(null)
  }

  async function handleSave(): Promise<void> {
    setSaving(true)
    setError(null)
    try {
      await onSave(draft)
      setMessage('课堂记录已保存')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageLayout className="page--pe-session">
      <PageHeader
        icon="lessons"
        title="课堂记录"
        description={`${draft.date} · 第${draft.period}节 · ${draft.gradeSnapshot} ${draft.classNameSnapshot} · ${PE_LESSON_TYPE_LABELS[draft.lessonType]}${draft.teamSnapshot ? ` · ${draft.teamSnapshot}` : ''}${draft.startTimeSnapshot && draft.endTimeSnapshot ? ` · ${draft.startTimeSnapshot}-${draft.endTimeSnapshot}` : ''}`}
        actions={
          <>
            <button type="button" className="btn" onClick={onBack} disabled={saving}>
              返回列表
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void handleSave()} disabled={saving}>
              保存
            </button>
          </>
        }
      />

      {error ? <p className="page-error">{error}</p> : null}
      {message ? <p className="page-success">{message}</p> : null}
      {planPrefillHint ? <p className="edit-hint">{planPrefillHint}</p> : null}

      {!dismissedSync && missingStudents.length > 0 ? (
        <div className="session-sync-bar">
          <span>有 {missingStudents.length} 名在读学生尚未加入本节记录</span>
          <button type="button" className="btn btn-small btn-primary" onClick={handleAppendMissingStudents}>
            补充学生
          </button>
        </div>
      ) : null}

      <div className="toolbar">
        <label className="toolbar-field toolbar-field-grow">
          本节主题
          <input
            value={draft.topic}
            onChange={(event) => touchSession({ topic: event.target.value })}
            placeholder="例如：快速跑、立定跳远"
          />
        </label>
      </div>
      <label className="session-notes-field">
        整节课备注
        <textarea
          rows={2}
          value={draft.notes}
          onChange={(event) => touchSession({ notes: event.target.value })}
          placeholder="例如：天气炎热降低运动强度"
        />
      </label>

      {selected.size > 0 ? (
        <div className="batch-bar">
          <span>已选 {selected.size} 人，批量设为：</span>
          {ATTENDANCE_STATUSES.map((status) => (
            <button key={status} type="button" className="btn btn-small" onClick={() => applyBatch(status)}>
              {ATTENDANCE_LABELS[status]}
            </button>
          ))}
        </div>
      ) : (
        <p className="edit-hint">默认全部正常。点选异常学生即可。勾选后可批量改考勤。</p>
      )}

      <div className="data-table-wrap">
        <table className="data-table pe-record-table">
          <thead>
            <tr>
              <th className="col-check">
                <input
                  type="checkbox"
                  checked={records.length > 0 && selected.size === records.length}
                  onChange={toggleSelectAll}
                  aria-label="全选"
                />
              </th>
              <th>学号</th>
              <th>姓名</th>
              <th>考勤状态</th>
              <th>课堂表现</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(record.id)}
                    onChange={() => toggleSelect(record.id)}
                    aria-label={`选择${record.nameSnapshot}`}
                  />
                </td>
                <td>{record.studentNoSnapshot || '—'}</td>
                <td>{record.nameSnapshot}</td>
                <td>
                  <div className="status-buttons">
                    {ATTENDANCE_STATUSES.map((status) => (
                      <button
                        key={status}
                        type="button"
                        className={
                          record.attendanceStatus === status
                            ? `btn btn-small status-btn is-active is-${status}`
                            : 'btn btn-small status-btn'
                        }
                        onClick={() => setStatus(record.id, status)}
                      >
                        {ATTENDANCE_LABELS[status]}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="tag-cell">
                  <button type="button" className="btn btn-small" onClick={() => setOpenTagId(openTagId === record.id ? null : record.id)}>
                    {record.performanceTags.length > 0
                      ? record.performanceTags.map((tag) => PERFORMANCE_TAG_LABELS[tag]).join('、')
                      : '添加表现'}
                  </button>
                  {openTagId === record.id ? (
                    <div className="tag-popover">
                      {PERFORMANCE_TAGS.map((tag) => (
                        <label key={tag} className="tag-option">
                          <input
                            type="checkbox"
                            checked={record.performanceTags.includes(tag)}
                            onChange={() => toggleTag(record.id, tag)}
                          />
                          {PERFORMANCE_TAG_LABELS[tag]}
                        </label>
                      ))}
                    </div>
                  ) : null}
                </td>
                <td>
                  <input
                    className="row-note"
                    value={record.note}
                    onChange={(event) => updateRecord(record.id, { note: event.target.value })}
                    placeholder="可选"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageLayout>
  )
}
