import { useEffect, useMemo, useRef, useState } from 'react'
import { STUDENT_GENDER_LABELS } from '@shared/student'
import {
  TEST_RECORD_STATUSES,
  TEST_RECORD_STATUS_LABELS,
  compareToPrevious,
  formatRawValue,
  findPreviousValidScore,
  genderWarning,
  parseScoreInput,
  rangeWarning,
  resolveTimeInputMode,
  testUnitDisplay,
  usesMinuteFormat,
  type PETestRecord,
  type PETestSession,
  type TestItem,
  type TestRecordStatus,
  type TimeInputMode
} from '@shared/peTest'

interface PeTestEditorProps {
  session: PETestSession
  testItem: TestItem | undefined
  historySessions: PETestSession[]
  onBack: () => void
  onSave: (session: PETestSession) => Promise<void>
}

export default function PeTestEditor({
  session,
  testItem,
  historySessions,
  onBack,
  onSave
}: PeTestEditorProps): React.JSX.Element {
  const [draft, setDraft] = useState<PETestSession>(session)
  const [inputs, setInputs] = useState<Record<string, string>>(() => buildInputs(session, testItem))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [historyStudentId, setHistoryStudentId] = useState<string | null>(null)
  const scoreRefs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    setDraft(session)
    setInputs(buildInputs(session, testItem))
    setMessage(null)
    setError(null)
  }, [session, testItem])

  const records = useMemo(
    () =>
      [...draft.records].sort(
        (a, b) =>
          a.studentNoSnapshot.localeCompare(b.studentNoSnapshot, 'zh-CN', { numeric: true }) ||
          a.nameSnapshot.localeCompare(b.nameSnapshot, 'zh-CN')
      ),
    [draft.records]
  )

  const timeInputMode = resolveTimeInputMode(testItem, draft.timeInputModeSnapshot)
  const preferMinute = usesMinuteFormat(timeInputMode, draft.valueTypeSnapshot)
  const unitLabel = testUnitDisplay(draft.unitSnapshot, draft.customUnitLabelSnapshot)
  const decimalPlaces = testItem?.decimalPlaces ?? (draft.valueTypeSnapshot === 'time' ? 1 : 0)
  const genderRule = testItem?.genderRule ?? 'all'

  const studentHistory = useMemo(() => {
    if (!historyStudentId) {
      return []
    }

    return historySessions
      .filter((item) => item.testItemId === draft.testItemId)
      .flatMap((item) =>
        item.records
          .filter((record) => record.studentId === historyStudentId && record.status === 'valid' && record.rawValue !== null)
          .map((record) => ({
            sessionId: item.id,
            date: item.date,
            title: item.title,
            rawValue: record.rawValue as number,
            createdAt: item.createdAt
          }))
      )
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  }, [historySessions, historyStudentId, draft.testItemId])

  function touchSession(patch: Partial<PETestSession>): void {
    const now = new Date().toISOString()
    setDraft((current) => ({ ...current, ...patch, updatedAt: now }))
    setMessage(null)
  }

  function updateRecord(id: string, patch: Partial<PETestRecord>): void {
    const now = new Date().toISOString()
    setDraft((current) => ({
      ...current,
      updatedAt: now,
      records: current.records.map((record) => (record.id === id ? { ...record, ...patch, updatedAt: now } : record))
    }))
    setMessage(null)
  }

  function focusScore(index: number): void {
    const target = scoreRefs.current[index]
    if (!target) {
      return
    }

    target.focus()
    target.select()
  }

  function handleScoreKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault()
      focusScore(index - 1)
      return
    }

    if (event.key === 'Enter' || event.key === 'ArrowDown') {
      event.preventDefault()
      focusScore(index + 1)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusScore(index - 1)
    }
  }

  async function handleSave(): Promise<void> {
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const now = new Date().toISOString()
      const nextRecords: PETestRecord[] = []

      for (const record of draft.records) {
        const status = record.status
        const text = (inputs[record.id] ?? '').trim()

        if (status === 'absent' || status === 'exempt') {
          nextRecords.push({
            ...record,
            rawValue: null,
            updatedAt: now
          })
          continue
        }

        if (status === 'invalid') {
          nextRecords.push({
            ...record,
            rawValue: text === '' ? null : parseScoreInput(text, draft.valueTypeSnapshot, timeInputMode),
            updatedAt: now
          })
          continue
        }

        if (text === '') {
          nextRecords.push({
            ...record,
            rawValue: null,
            status: 'pending',
            updatedAt: now
          })
          continue
        }

        nextRecords.push({
          ...record,
          rawValue: parseScoreInput(text, draft.valueTypeSnapshot, timeInputMode),
          status: 'valid',
          updatedAt: now
        })
      }

      const next: PETestSession = {
        ...draft,
        timeInputModeSnapshot: timeInputMode,
        title: draft.title.trim() || `${draft.classNameSnapshot} · ${draft.testItemNameSnapshot} · ${draft.date}`,
        notes: draft.notes.trim(),
        updatedAt: now,
        records: nextRecords
      }

      await onSave(next)
      setDraft(next)
      setInputs(buildInputs(next, testItem))
      setMessage('已保存')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const historyName = records.find((item) => item.studentId === historyStudentId)?.nameSnapshot ?? '学生'

  return (
    <section className="page page--pe-test-editor">
      <div className="page-heading page-heading--split">
        <div className="page-heading-text">
          <h2>{draft.title}</h2>
          <p>
            {draft.date} · {draft.gradeSnapshot} {draft.classNameSnapshot} · {draft.testItemNameSnapshot}
            {unitLabel ? `（${unitLabel}）` : ''}
            {preferMinute ? ' · 长跑可输入 3:42、3\'42、3.42 或总秒数' : draft.valueTypeSnapshot === 'time' ? ' · 时间按秒录入，如 8.32' : ''}
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn" onClick={onBack}>
            返回列表
          </button>
          <button type="button" className="btn btn-primary" onClick={() => void handleSave()} disabled={saving}>
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>

      {error ? <p className="page-error">{error}</p> : null}
      {message ? <p className="page-success">{message}</p> : null}

      <div className="pe-editor-meta">
        <label>
          测试名称
          <input value={draft.title} onChange={(event) => touchSession({ title: event.target.value })} />
        </label>
        <label className="pe-editor-meta-wide">
          备注
          <input value={draft.notes} onChange={(event) => touchSession({ notes: event.target.value })} />
        </label>
      </div>

      <div className="data-table-wrap">
        <table className="data-table pe-record-table">
          <thead>
            <tr>
              <th>学号</th>
              <th>姓名</th>
              <th>性别</th>
              <th>成绩</th>
              <th>状态</th>
              <th>较上次</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => {
              const parsed = tryParse(inputs[record.id] ?? '', draft.valueTypeSnapshot, timeInputMode)
              const warning =
                genderWarning(genderRule, record.genderSnapshot) ??
                rangeWarning(parsed, testItem?.minValue ?? null, testItem?.maxValue ?? null)
              const previous = findPreviousValidScore(
                historySessions
                  .filter((item) => item.testItemId === draft.testItemId)
                  .map((item) => {
                    const match = item.records.find((entry) => entry.studentId === record.studentId)
                    return {
                      date: item.date,
                      id: item.id,
                      createdAt: item.createdAt,
                      rawValue: match?.rawValue ?? null,
                      status: match?.status ?? 'pending'
                    }
                  }),
                draft.date,
                draft.id
              )
              const compare =
                parsed !== null && previous
                  ? compareToPrevious(
                      parsed,
                      previous.rawValue,
                      draft.directionSnapshot,
                      draft.valueTypeSnapshot,
                      decimalPlaces,
                      preferMinute,
                      unitLabel
                    )
                  : null

              return (
                <tr key={record.id}>
                  <td>{record.studentNoSnapshot || '—'}</td>
                  <td>
                    <button type="button" className="link-button" onClick={() => setHistoryStudentId(record.studentId)}>
                      {record.nameSnapshot}
                    </button>
                  </td>
                  <td>{STUDENT_GENDER_LABELS[record.genderSnapshot]}</td>
                  <td>
                    <input
                      ref={(node) => {
                        scoreRefs.current[index] = node
                      }}
                      className="score-input"
                      value={inputs[record.id] ?? ''}
                      onChange={(event) => {
                        setInputs((current) => ({ ...current, [record.id]: event.target.value }))
                        setMessage(null)
                      }}
                      onKeyDown={(event) => handleScoreKeyDown(index, event)}
                      placeholder={preferMinute ? '3.42' : draft.valueTypeSnapshot === 'time' ? '8.32' : ''}
                      disabled={record.status === 'absent' || record.status === 'exempt'}
                    />
                    {warning ? <div className="row-warning">{warning}</div> : null}
                  </td>
                  <td>
                    <select
                      value={record.status}
                      onChange={(event) => updateRecord(record.id, { status: event.target.value as TestRecordStatus })}
                    >
                      {TEST_RECORD_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {TEST_RECORD_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {compare ? (
                      <span className={`delta delta--${compare.kind}`}>{compare.text}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <input
                      className="row-note"
                      value={record.note}
                      onChange={(event) => updateRecord(record.id, { note: event.target.value })}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {historyStudentId ? (
        <div className="dialog-backdrop" onMouseDown={() => setHistoryStudentId(null)}>
          <div
            className="dialog dialog--class"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pe-test-history-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h3 id="pe-test-history-title">
              {historyName} · {draft.testItemNameSnapshot}历次有效成绩
            </h3>
            {studentHistory.length === 0 ? (
              <p className="dialog-slot">暂无有效成绩。</p>
            ) : (
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>日期</th>
                      <th>成绩</th>
                      <th>测试</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentHistory.map((item) => (
                      <tr key={`${item.sessionId}-${item.date}`}>
                        <td>{item.date}</td>
                        <td>
                          {formatRawValue(item.rawValue, draft.valueTypeSnapshot, decimalPlaces, preferMinute)}
                          {unitLabel ? ` ${unitLabel}` : ''}
                        </td>
                        <td>{item.title}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="dialog-actions">
              <span />
              <div className="dialog-actions-right">
                <button type="button" className="btn" onClick={() => setHistoryStudentId(null)}>
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function buildInputs(session: PETestSession, testItem: TestItem | undefined): Record<string, string> {
  const timeInputMode = resolveTimeInputMode(testItem, session.timeInputModeSnapshot)
  const preferMinute = usesMinuteFormat(timeInputMode, session.valueTypeSnapshot)
  const decimalPlaces = testItem?.decimalPlaces ?? (session.valueTypeSnapshot === 'time' ? 1 : 0)
  const result: Record<string, string> = {}
  for (const record of session.records) {
    result[record.id] = formatRawValue(record.rawValue, session.valueTypeSnapshot, decimalPlaces, preferMinute)
  }
  return result
}

function tryParse(input: string, valueType: 'number' | 'time', timeInputMode: TimeInputMode): number | null {
  if (input.trim() === '') {
    return null
  }

  try {
    return parseScoreInput(input, valueType, timeInputMode)
  } catch {
    return null
  }
}
