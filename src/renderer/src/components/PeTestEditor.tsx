import { applyPeTestEdits } from '@shared/peTest/editSession'
import { useEffect, useMemo, useRef, useState } from 'react'
import PageLayout, { PageHeader } from './PageLayout'
import { STUDENT_GENDER_LABELS } from '@shared/student'
import {
  actualTestItemName,
  BUILTIN_TEST_ITEMS,
  TEST_RECORD_STATUSES,
  TEST_RECORD_STATUS_LABELS,
  compareToPrevious,
  formatRawValue,
  findPreviousValidScore,
  genderWarning,
  isGenderLinkedSession,
  parseScoreInput,
  rangeWarning,
  resolveActualTestItem,
  resolvedTestItemIdOf,
  resolveTimeInputMode,
  testUnitDisplay,
  usesMinuteFormat,
  formatPeTestItemScoreText,
  classroomScoringLabel,
  type PETestRecord,
  type PETestSession,
  type TestItem,
  type TestRecordStatus,
  type TimeInputMode
} from '@shared/peTest'
import { listBuiltinExamStandards } from '@shared/examStandard/catalog'
import { useClasses } from '../context/ClassContext'
import { useTestItems } from '../context/TestItemContext'
import TestAnalyticsPanel from './TestAnalyticsPanel'

interface PeTestEditorProps {
  session: PETestSession
  testItem: TestItem | undefined
  historySessions: PETestSession[]
  onBack: () => void
  onSave: (session: PETestSession) => Promise<void>
  onRequestQuickEntry?: () => void
  initialTab?: 'edit' | 'analysis'
}

export default function PeTestEditor({
  session,
  testItem,
  historySessions,
  onBack,
  onSave,
  onRequestQuickEntry,
  initialTab = 'edit'
}: PeTestEditorProps): React.JSX.Element {
  const { classes } = useClasses()
  const { items } = useTestItems()
  const catalog = items.length > 0 ? items : BUILTIN_TEST_ITEMS
  const [tab, setTab] = useState<'edit' | 'analysis'>(initialTab)
  const [draft, setDraft] = useState<PETestSession>(session)
  const [inputs, setInputs] = useState<Record<string, string>>(() => buildInputs(session, testItem))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [historyStudentId, setHistoryStudentId] = useState<string | null>(null)
  const saveBusy = useRef(false)
  const changedIds = useRef(new Set<string>())
  const scoreRefs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    changedIds.current.clear()
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

  const studentHistory = useMemo(() => {
    if (!historyStudentId) {
      return []
    }

    const currentRecord = draft.records.find((record) => record.studentId === historyStudentId)
    const actualId = currentRecord ? resolvedTestItemIdOf(currentRecord, draft, catalog) : null

    return historySessions
      .flatMap((item) =>
        item.records
          .filter((record) => {
            if (record.studentId !== historyStudentId) {
              return false
            }
            const id = resolvedTestItemIdOf(record, item, catalog)
            return actualId !== null && id === actualId
          })
          .map((record) => ({
            sessionId: item.id,
            date: item.date,
            title: item.title,
            itemName: item.testItemNameSnapshot,
            actualItemName: actualTestItemName(item, record, catalog),
            scoringLabel: classroomScoringLabel(item),
            rawValue: record.rawValue,
            baseScore: record.baseScore ?? null,
            bonusScore: record.bonusScore ?? null,
            examScore: record.examScore,
            scoreText: formatPeTestItemScoreText(record),
            status: record.status,
            gradeSnapshot: item.gradeSnapshot,
            createdAt: item.createdAt
          }))
      )
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  }, [historySessions, historyStudentId, draft, catalog])

  function touchSession(patch: Partial<PETestSession>): void {
    const now = new Date().toISOString()
    setDraft((current) => ({ ...current, ...patch, updatedAt: now }))
    setMessage(null)
  }

  function updateRecord(id: string, patch: Partial<PETestRecord>): void {
    if (patch.status !== undefined) {
      changedIds.current.add(id)
      if (patch.status === 'pending') setInputs(current => ({ ...current, [id]: '' }))
    }
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
    if (saveBusy.current) return
    saveBusy.current = true
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const now = new Date().toISOString()
      const edited = changedIds.current.size === 0 ? draft : applyPeTestEdits({
        draft, inputs, changedIds: changedIds.current,
        testItem: testItem ?? catalog.find(item => item.id === draft.testItemId)!,
        items: catalog, standard: listBuiltinExamStandards().find(entry => entry.id === draft.examStandardId) ?? null,
        nowIso: now
      })

      const next: PETestSession = {
        ...edited,
        title: draft.title.trim() || `${draft.classNameSnapshot} · ${draft.testItemNameSnapshot} · ${draft.date}`,
        notes: draft.notes.trim(),
        updatedAt: now,
        records: edited.records
      }

      await onSave(next)
      changedIds.current.clear()
      setDraft(next)
      setInputs(buildInputs(next, testItem))
      setMessage('已保存')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存失败')
    } finally {
      saveBusy.current = false
      setSaving(false)
    }
  }

  const historyName = records.find((item) => item.studentId === historyStudentId)?.nameSnapshot ?? '学生'

  return (
    <PageLayout className="page--pe-test-editor">
      <PageHeader
        icon="tests"
        title={draft.title}
        description={`${draft.date} · ${draft.gradeSnapshot} ${draft.classNameSnapshot} · ${draft.testItemNameSnapshot}${unitLabel ? `（${unitLabel}）` : ''} · ${classroomScoringLabel(draft)}${preferMinute ? ' · 长跑可输入 3:42、3\'42、3.42、342 或注明秒的总秒数' : draft.valueTypeSnapshot === 'time' ? ' · 时间按秒录入，如 8.32' : ''}`}
        actions={
          <>
            <button type="button" className={tab === 'analysis' ? 'btn btn-primary' : 'btn'} onClick={() => setTab('analysis')}>
              测试分析
            </button>
            <button type="button" className={tab === 'edit' ? 'btn btn-primary' : 'btn'} onClick={() => setTab('edit')}>
              成绩录入
            </button>
            {onRequestQuickEntry ? (
              <button type="button" className="btn btn-primary" onClick={onRequestQuickEntry}>
                快速录入成绩
              </button>
            ) : null}
            <button type="button" className="btn" onClick={onBack}>
              返回列表
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void handleSave()} disabled={saving}>
              {saving ? '保存中…' : '保存'}
            </button>
          </>
        }
      />

      {error ? <p className="page-error">{error}</p> : null}
      {message ? <p className="page-success">{message}</p> : null}

      {tab === 'analysis' ? (
        <TestAnalyticsPanel session={draft} sessions={historySessions} testItem={testItem} classes={classes} />
      ) : (
      <>
      <div className="pe-editor-meta">
        <label>
          测试名称
          <input value={draft.title} onChange={(event) => touchSession({ title: event.target.value })} />
        </label>
        <label>
          评分依据
          <input value={classroomScoringLabel(draft)} readOnly />
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
              {isGenderLinkedSession(draft) ? <th>项目</th> : null}
              <th>成绩</th>
              <th>单项得分</th>
              <th>状态</th>
              <th>较上次</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => {
              const actual = resolveActualTestItem(draft, record, catalog)
              const rowItem = actual.ok ? actual.item : testItem
              const parsed = tryParse(inputs[record.id] ?? '', draft.valueTypeSnapshot, timeInputMode)
              const warning =
                genderWarning(rowItem?.genderRule ?? 'all', record.genderSnapshot) ??
                rangeWarning(parsed, rowItem?.minValue ?? null, testItem?.maxValue ?? null)
              const previous = findPreviousValidScore(
                historySessions
                  .filter((item) => {
                    const match = item.records.find((entry) => entry.studentId === record.studentId)
                    if (!match) {
                      return false
                    }
                    return resolvedTestItemIdOf(match, item, catalog) === resolvedTestItemIdOf(record, draft, catalog)
                  })
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
                  {isGenderLinkedSession(draft) ? <td>{actualTestItemName(draft, record, catalog)}</td> : null}
                  <td>
                    <input
                      ref={(node) => {
                        scoreRefs.current[index] = node
                      }}
                      className="score-input"
                      value={inputs[record.id] ?? ''}
                      onChange={(event) => {
                        changedIds.current.add(record.id)
                        setInputs((current) => ({ ...current, [record.id]: event.target.value }))
                        setMessage(null)
                      }}
                      onKeyDown={(event) => handleScoreKeyDown(index, event)}
                      placeholder={preferMinute ? '3.42' : draft.valueTypeSnapshot === 'time' ? '8.32' : ''}
                      disabled={record.status === 'absent' || record.status === 'exempt'}
                    />
                    {warning ? <div className="row-warning">{warning}</div> : null}
                  </td>
                  <td>{formatPeTestItemScoreText(record)}</td>
                  <td>
                    <select
                      className={`status-select status-select--${record.status}`}
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
              {historyName} · {draft.testItemNameSnapshot}历次成绩
            </h3>
            {studentHistory.length === 0 ? (
              <p className="dialog-slot">暂无测试记录。</p>
            ) : (
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>日期</th>
                      <th>测试名称</th>
                      <th>项目</th>
                      <th>实际项目</th>
                      <th>评分体系</th>
                      <th>原始成绩</th>
                      <th>基础分</th>
                      <th>附加分</th>
                      <th>单项得分</th>
                      <th>状态</th>
                      <th>年级快照</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentHistory.map((item) => (
                      <tr key={item.sessionId}>
                        <td>{item.date}</td>
                        <td>{item.title}</td>
                        <td>{item.itemName}</td>
                        <td>{item.actualItemName}</td>
                        <td>{item.scoringLabel}</td>
                        <td>
                          {item.rawValue === null
                            ? '—'
                            : `${formatRawValue(item.rawValue, draft.valueTypeSnapshot, decimalPlaces, preferMinute)}${
                                unitLabel ? ` ${unitLabel}` : ''
                              }`}
                        </td>
                        <td>{item.baseScore === null ? '—' : item.baseScore}</td>
                        <td>{item.bonusScore && item.bonusScore > 0 ? `+${item.bonusScore}` : '—'}</td>
                        <td>{item.scoreText}</td>
                        <td>{TEST_RECORD_STATUS_LABELS[item.status]}</td>
                        <td>{item.gradeSnapshot}</td>
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
      </>
      )}
    </PageLayout>
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
