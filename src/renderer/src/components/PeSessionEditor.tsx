import { useMemo, useState } from 'react'
import {
  ATTENDANCE_LABELS,
  ATTENDANCE_STATUSES,
  PERFORMANCE_TAG_LABELS,
  PERFORMANCE_TAGS,
  PE_LESSON_TYPE_LABELS,
  type AttendanceStatus,
  type PEClassSession,
  type PEStudentRecord,
  type PerformanceTag
} from '@shared/peSession'

interface PeSessionEditorProps {
  session: PEClassSession
  onBack: () => void
  onSave: (session: PEClassSession) => Promise<void>
}

export default function PeSessionEditor({ session, onBack, onSave }: PeSessionEditorProps): React.JSX.Element {
  const [draft, setDraft] = useState<PEClassSession>(session)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [openTagId, setOpenTagId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const records = useMemo(
    () =>
      [...draft.records].sort(
        (a, b) =>
          a.studentNoSnapshot.localeCompare(b.studentNoSnapshot, 'zh-CN', { numeric: true }) ||
          a.nameSnapshot.localeCompare(b.nameSnapshot, 'zh-CN')
      ),
    [draft.records]
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
    <section className="page page--pe-session">
      <div className="page-heading page-heading--split">
        <div className="page-heading-text">
          <h2>课堂记录</h2>
          <p>
            {draft.date} · 第{draft.period}节 · {draft.gradeSnapshot} {draft.classNameSnapshot} ·{' '}
            {PE_LESSON_TYPE_LABELS[draft.lessonType]}
            {draft.teamSnapshot ? ` · ${draft.teamSnapshot}` : ''}
            {draft.startTimeSnapshot && draft.endTimeSnapshot
              ? ` · ${draft.startTimeSnapshot}-${draft.endTimeSnapshot}`
              : ''}
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn" onClick={onBack} disabled={saving}>
            返回列表
          </button>
          <button type="button" className="btn btn-primary" onClick={() => void handleSave()} disabled={saving}>
            保存
          </button>
        </div>
      </div>

      {error ? <p className="page-error">{error}</p> : null}
      {message ? <p className="page-success">{message}</p> : null}

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
    </section>
  )
}
