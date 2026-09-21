import { useMemo, useState } from 'react'
import PageLayout, { PageHeader } from './PageLayout'
import PeQuickEntryPanel from './PeQuickEntryPanel'
import StatusBadge from './StatusBadge'
import {
  ATTENDANCE_EDIT_STATUSES,
  ATTENDANCE_LABELS,
  PARTICIPATION_LABELS,
  PARTICIPATION_STATUSES,
  PERFORMANCE_TAG_LABELS,
  PERFORMANCE_TAGS,
  PE_LESSON_TYPE_LABELS,
  appendActiveStudentsToSession,
  isAttendanceAway,
  listMissingActiveStudents,
  resolveAttendancePresence,
  resolveParticipationStatus,
  type AttendanceStatus,
  type ParticipationStatus,
  type PEClassSession,
  type PEStudentRecord,
  type PerformanceTag
} from '@shared/peSession'
import {
  PE_TEST_SESSION_STATUS_LABELS,
  buildClassroomPeTestSession,
  countTestRecords,
  findClassroomTestsForPeSession,
  findOpenClassroomTest,
  isPeTestSessionCompleted,
  parseTeacherTestSelection,
  teacherSelectableTestOptions,
  type PETestSession
} from '@shared/peTest'
import type { StudentGender, StudentRecord } from '@shared/student'
import { usePeTests } from '../context/PeTestContext'
import { useStudents } from '../context/StudentContext'
import { useTestItems } from '../context/TestItemContext'

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
  const { items } = useTestItems()
  const { sessions: peTests, upsertSession } = usePeTests()
  const [draft, setDraft] = useState<PEClassSession>(session)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [openTagId, setOpenTagId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dismissedSync, setDismissedSync] = useState(false)
  const [quizPickerOpen, setQuizPickerOpen] = useState(false)
  const [quizItemValue, setQuizItemValue] = useState('')
  const [quizWorking, setQuizWorking] = useState(false)
  const [quizEntryId, setQuizEntryId] = useState<string | null>(null)

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

  const teacherOptions = useMemo(() => teacherSelectableTestOptions(items), [items])

  const classroomTests = useMemo(
    () => findClassroomTestsForPeSession(peTests, draft.id),
    [peTests, draft.id]
  )

  const quizLive = quizEntryId ? peTests.find((item) => item.id === quizEntryId) ?? null : null

  const genderByStudentId = useMemo(() => {
    const map = new Map<string, StudentGender>()
    for (const student of students) {
      map.set(student.id, student.gender)
    }
    return map
  }, [students])

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
    const record = draft.records.find((item) => item.id === id)
    if (!record) {
      return
    }
    const patch: Partial<PEStudentRecord> = { attendanceStatus }
    // 改考勤前，把旧 observer 考勤迁到参与状态，避免见习信息丢失。
    if (record.attendanceStatus === 'observer' && record.participationStatus === undefined) {
      patch.participationStatus = 'observer'
    }
    updateRecord(id, patch)
  }

  function setParticipation(id: string, participationStatus: ParticipationStatus): void {
    const record = draft.records.find((item) => item.id === id)
    if (!record) {
      return
    }
    // 旧数据把见习写在考勤里：保存参与状态时把考勤归一为正常。
    const patch: Partial<PEStudentRecord> = { participationStatus }
    if (record.attendanceStatus === 'observer') {
      patch.attendanceStatus = 'normal'
    }
    updateRecord(id, patch)
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
      records: current.records.map((record) => {
        if (!selected.has(record.id)) {
          return record
        }
        const next: PEStudentRecord = { ...record, attendanceStatus, updatedAt: now }
        if (record.attendanceStatus === 'observer' && record.participationStatus === undefined) {
          next.participationStatus = 'observer'
        }
        return next
      })
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

  function openQuizPicker(): void {
    setQuizItemValue(teacherOptions[0]?.value ?? '')
    setQuizPickerOpen(true)
    setError(null)
  }

  async function confirmCreateQuiz(): Promise<void> {
    const selection = parseTeacherTestSelection(quizItemValue, items)
    if (!selection) {
      setError('请选择测试项目')
      return
    }
    if (draft.records.length === 0) {
      setError('当前课堂记录没有学生，无法创建课堂测评')
      return
    }

    const anchorItem = selection.kind === 'group' ? selection.anchor : selection.item
    const openExisting = findOpenClassroomTest(peTests, draft.id, anchorItem.id)
    if (openExisting) {
      setQuizPickerOpen(false)
      setQuizEntryId(openExisting.id)
      setMessage('已打开本节未完成的同项目课堂测评')
      return
    }

    setQuizWorking(true)
    setError(null)
    try {
      const created = buildClassroomPeTestSession({
        peSession: draft,
        testItem: anchorItem,
        testGroup: selection.kind === 'group' ? selection.group : null,
        genderByStudentId
      })
      await upsertSession(created)
      setQuizPickerOpen(false)
      setQuizEntryId(created.id)
      setMessage(`已创建课堂测评：${created.testItemNameSnapshot}`)
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : '无法创建课堂测评')
    } finally {
      setQuizWorking(false)
    }
  }

  function openQuizSession(test: PETestSession): void {
    setQuizEntryId(test.id)
    setMessage(null)
  }

  if (quizLive) {
    return (
      <PeQuickEntryPanel
        embedded
        initialSession={quizLive}
        onClose={() => setQuizEntryId(null)}
        onOpenResult={() => setQuizEntryId(null)}
      />
    )
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
          {ATTENDANCE_EDIT_STATUSES.map((status) => (
            <button key={status} type="button" className="btn btn-small" onClick={() => applyBatch(status)}>
              {ATTENDANCE_LABELS[status]}
            </button>
          ))}
        </div>
      ) : (
        <p className="edit-hint">默认全部正常。点选异常学生即可。勾选后可批量改考勤；参与状态单独设置。</p>
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
              <th>考勤</th>
              <th>参与状态</th>
              <th>课堂表现</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => {
              const presence = resolveAttendancePresence(record)
              const participation = resolveParticipationStatus(record)
              const away = isAttendanceAway(presence)
              return (
                <tr key={record.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(record.id)}
                      onChange={() => toggleSelect(record.id)}
                      aria-label={`选择 ${record.nameSnapshot}`}
                    />
                  </td>
                  <td>{record.studentNoSnapshot || '—'}</td>
                  <td className="col-name">{record.nameSnapshot}</td>
                  <td>
                    <div className="attendance-buttons">
                      {ATTENDANCE_EDIT_STATUSES.map((status) => (
                        <button
                          key={status}
                          type="button"
                          className={presence === status ? 'btn btn-small btn-primary' : 'btn btn-small'}
                          onClick={() => setStatus(record.id, status)}
                        >
                          {ATTENDANCE_LABELS[status]}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td>
                    <select
                      className={away ? 'participation-select is-muted' : 'participation-select'}
                      value={participation}
                      disabled={away}
                      title={away ? '缺勤/请假时参与状态无课堂意义' : undefined}
                      aria-label={`${record.nameSnapshot} 参与状态`}
                      onChange={(event) => setParticipation(record.id, event.target.value as ParticipationStatus)}
                    >
                      {PARTICIPATION_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {PARTICIPATION_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="col-tags">
                    <button
                      type="button"
                      className="btn btn-small"
                      onClick={() => setOpenTagId(openTagId === record.id ? null : record.id)}
                    >
                      {record.performanceTags.length > 0
                        ? record.performanceTags.map((tag) => PERFORMANCE_TAG_LABELS[tag]).join('、')
                        : '添加标签'}
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
              )
            })}
          </tbody>
        </table>
      </div>

      <section className="pe-classroom-quiz">
        <div className="pe-classroom-quiz-head">
          <h3>课堂测评</h3>
          <button type="button" className="btn btn-small btn-primary" onClick={openQuizPicker} disabled={quizWorking}>
            + 新增测评
          </button>
        </div>
        <p className="pe-quick-setup-hint">
          测评名单来自本节课堂记录快照。考勤状态不会自动写入测试缺考；课堂小测成绩会进入学生历史与 PB。
        </p>
        {classroomTests.length === 0 ? (
          <p className="empty-text">本节课暂无课堂测评</p>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>项目</th>
                  <th>日期</th>
                  <th>状态</th>
                  <th>已录 / 总人数</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {classroomTests.map((test) => {
                  const counts = countTestRecords(test.records)
                  const done = isPeTestSessionCompleted(test)
                  return (
                    <tr key={test.id}>
                      <td>{test.testItemNameSnapshot}</td>
                      <td>{test.date}</td>
                      <td>
                        <StatusBadge tone={done ? 'ok' : 'warn'}>
                          {PE_TEST_SESSION_STATUS_LABELS[test.status ?? 'in_progress']}
                        </StatusBadge>
                      </td>
                      <td>
                        {counts.entered}/{test.records.length}
                      </td>
                      <td>
                        <button type="button" className="btn btn-small btn-primary" onClick={() => openQuizSession(test)}>
                          {done ? '查看/继续编辑' : '继续录入'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {quizPickerOpen ? (
        <div className="dialog-backdrop" onMouseDown={() => !quizWorking && setQuizPickerOpen(false)}>
          <div
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pe-classroom-quiz-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h3 id="pe-classroom-quiz-title">新增课堂测评</h3>
            <p className="dialog-slot">
              将按本节课堂记录中的 {draft.records.length} 名学生创建测评名单（不读取班级最新名单）。
            </p>
            <label className="toolbar-field toolbar-field-grow">
              测试项目
              <select value={quizItemValue} onChange={(event) => setQuizItemValue(event.target.value)}>
                {teacherOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="dialog-actions">
              <span />
              <div className="dialog-actions-right">
                <button type="button" className="btn" onClick={() => setQuizPickerOpen(false)} disabled={quizWorking}>
                  取消
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void confirmCreateQuiz()}
                  disabled={quizWorking || !quizItemValue}
                >
                  开始录入
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </PageLayout>
  )
}
