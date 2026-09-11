import { useEffect, useMemo, useRef, useState } from 'react'
import PageLayout, { PageHeader } from './PageLayout'
import { listedClassRecords } from '@shared/class'
import { listBuiltinExamStandards } from '@shared/examStandard/catalog'
import { STUDENT_GENDER_LABELS } from '@shared/student'
import {
  TEST_RECORD_STATUS_LABELS,
  adjacentRecordId,
  applyQuickEntry,
  countQuickEntryProgress,
  firstUnenteredRecordId,
  formatLocalDate,
  formatRawValue,
  parseQuickEntryInput,
  resolveQuickEntryStatusShortcut,
  sortQuickEntryRecords,
  testUnitDisplay,
  usesMinuteFormat,
  type PETestSession,
  type TestItem
} from '@shared/peTest'
import { useClasses } from '../context/ClassContext'
import { usePeTests } from '../context/PeTestContext'
import { useStudents } from '../context/StudentContext'
import { useTestItems } from '../context/TestItemContext'
import { buildPeTestSession } from '../data/peTest/buildSession'
import {
  activeStudentsOfClass,
  findExistingPeTestsForQuickEntry
} from '@shared/peTest/quickEntry'

interface PeQuickEntryPanelProps {
  initialSession?: PETestSession | null
  onClose: () => void
  onOpenResult: (session: PETestSession, tab: 'edit' | 'analysis') => void
}

function verifiedStandards() {
  return listBuiltinExamStandards().filter(
    (item) =>
      item.examType === 'middle_school_exam' &&
      item.status === 'verified' &&
      item.scoreTableStatus === 'verified'
  )
}

export default function PeQuickEntryPanel({
  initialSession = null,
  onClose,
  onOpenResult
}: PeQuickEntryPanelProps): React.JSX.Element {
  const { classes } = useClasses()
  const listedClasses = listedClassRecords(classes)
  const { students } = useStudents()
  const { items } = useTestItems()
  const { sessions, upsertSession } = usePeTests()
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [draft, setDraft] = useState<PETestSession | null>(initialSession)
  const [currentId, setCurrentId] = useState<string | null>(
    initialSession ? firstUnenteredRecordId(initialSession.records) : null
  )
  const [input, setInput] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [working, setWorking] = useState(false)

  const [classId, setClassId] = useState(initialSession?.classId ?? listedClasses[0]?.id ?? '')
  const [testItemId, setTestItemId] = useState(initialSession?.testItemId ?? items.find((item) => item.isActive)?.id ?? '')
  const [date, setDate] = useState(initialSession?.date ?? formatLocalDate(new Date()))
  const [examStandardId, setExamStandardId] = useState(initialSession?.examStandardId ?? '')

  const activeItems = useMemo(() => items.filter((item) => item.isActive), [items])
  const classStudents = useMemo(() => activeStudentsOfClass(students, classId), [students, classId])
  const existing = useMemo(
    () => (draft ? [] : findExistingPeTestsForQuickEntry(sessions, classId, date, testItemId)),
    [sessions, classId, date, testItemId, draft]
  )
  const testItem: TestItem | undefined = items.find((item) => item.id === (draft?.testItemId ?? testItemId))
  const standard = verifiedStandards().find((item) => item.id === (draft?.examStandardId ?? examStandardId)) ?? null
  const records = useMemo(() => (draft ? sortQuickEntryRecords(draft.records) : []), [draft])
  const current = records.find((item) => item.id === currentId) ?? null
  const progress = useMemo(() => countQuickEntryProgress(draft?.records ?? []), [draft])

  useEffect(() => {
    if (!current || !testItem) {
      return
    }
    const preferMinute = usesMinuteFormat(testItem.timeInputMode, testItem.valueType)
    setInput(
      current.rawOriginal ||
        formatRawValue(current.rawValue, testItem.valueType, testItem.decimalPlaces, preferMinute)
    )
    setError(null)
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => window.clearTimeout(timer)
  }, [current?.id, testItem])

  async function persist(next: PETestSession, nextRecordId: string | null, hint: string | null): Promise<void> {
    setWorking(true)
    try {
      await upsertSession(next)
      setDraft(next)
      setCurrentId(nextRecordId)
      setMessage(hint)
      setError(null)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存失败')
    } finally {
      setWorking(false)
      window.setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  async function runAction(
    action: Parameters<typeof applyQuickEntry>[0]['action']
  ): Promise<void> {
    if (!draft || !testItem || !currentId) {
      return
    }
    const result = applyQuickEntry({
      session: draft,
      testItem,
      recordId: currentId,
      action,
      standard,
      nowIso: new Date().toISOString()
    })
    if (!result.ok) {
      setError(result.message)
      window.setTimeout(() => inputRef.current?.focus(), 0)
      return
    }
    await persist(result.session, result.nextRecordId, result.message)
  }

  async function startNew(): Promise<void> {
    const classRecord = classes.find((item) => item.id === classId)
    const item = activeItems.find((entry) => entry.id === testItemId)
    if (!classRecord || !item) {
      setError('请选择班级和测试项目')
      return
    }
    if (classStudents.length === 0) {
      setError('该班级没有在读学生')
      return
    }
    const created = buildPeTestSession({
      classRecord,
      testItem: item,
      activeStudents: classStudents,
      date,
      title: '',
      notes: ''
    })
    const picked = verifiedStandards().find((entry) => entry.id === examStandardId)
    const withStandard: PETestSession = {
      ...created,
      examStandardId: picked?.id ?? null,
      scoringCitySnapshot: picked?.cityName ?? '',
      scoringVersionSnapshot: picked?.policyLabel ?? ''
    }
    setWorking(true)
    try {
      await upsertSession(withStandard)
      setDraft(withStandard)
      setCurrentId(firstUnenteredRecordId(withStandard.records))
      setError(null)
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : '创建失败')
    } finally {
      setWorking(false)
    }
  }

  function continueExisting(session: PETestSession): void {
    setDraft(session)
    setCurrentId(firstUnenteredRecordId(session.records))
    setError(null)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter') {
      event.preventDefault()
      void runAction({ type: 'score', input })
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (draft) {
        setCurrentId(adjacentRecordId(draft.records, currentId ?? '', -1))
      }
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (draft) {
        setCurrentId(adjacentRecordId(draft.records, currentId ?? '', 1))
      }
      return
    }
    const statusShortcut = resolveQuickEntryStatusShortcut({
      key: event.key,
      code: event.code,
      inputText: input
    })
    if (!statusShortcut) {
      return
    }
    event.preventDefault()
    void runAction({ type: statusShortcut })
  }

  const unitLabel = testItem ? testUnitDisplay(testItem.unit, testItem.customUnitLabel) : ''
  const preview = testItem ? parseQuickEntryInput(input, testItem) : null

  if (!draft) {
    return (
      <PageLayout className="page--pe-quick-entry">
        <PageHeader
          icon="tests"
          title="课堂快速录入"
          description="选择班级、项目和日期后开始连续录入。"
          actions={
            <button type="button" className="btn" onClick={onClose}>
              返回测试记录
            </button>
          }
        />
        {error ? <p className="page-error">{error}</p> : null}
        <div className="pe-quick-setup">
          <label>
            班级
            <select value={classId} onChange={(event) => setClassId(event.target.value)}>
              {listedClasses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.grade} {item.className}
                </option>
              ))}
            </select>
          </label>
          <p className="pe-quick-setup-hint">已加载 {classStudents.length} 名在读学生</p>
          <label>
            测试项目
            <select value={testItemId} onChange={(event) => setTestItemId(event.target.value)}>
              {activeItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            测试日期
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <label>
            评分标准（可选）
            <select value={examStandardId} onChange={(event) => setExamStandardId(event.target.value)}>
              <option value="">暂不换算</option>
              {verifiedStandards().map((item) => (
                <option key={item.id} value={item.id}>
                  {item.cityName} {item.policyLabel}
                </option>
              ))}
            </select>
          </label>
          {existing.length > 0 ? (
            <div className="pe-quick-existing">
              <p>当天同班同项目已有测试，将继续录入已有记录，不会默认新建第二次测试。</p>
              <button type="button" className="btn btn-primary" onClick={() => continueExisting(existing[0])}>
                继续录入已有测试
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => void startNew()} disabled={working}>
              开始录入
            </button>
          )}
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout className="page--pe-quick-entry">
      <PageHeader
        icon="tests"
        title="课堂快速录入"
        description={`${draft.gradeSnapshot} ${draft.classNameSnapshot} · ${draft.testItemNameSnapshot} · ${draft.date}`}
        actions={
          <button type="button" className="btn" onClick={onClose}>
            返回测试记录
          </button>
        }
      />

      <dl className="pe-quick-meta">
        <div>
          <dt>班级</dt>
          <dd>
            {draft.gradeSnapshot} {draft.classNameSnapshot}
          </dd>
        </div>
        <div>
          <dt>项目</dt>
          <dd>{draft.testItemNameSnapshot}</dd>
        </div>
        <div>
          <dt>日期</dt>
          <dd>{draft.date}</dd>
        </div>
        <div>
          <dt>总人数</dt>
          <dd>{progress.total}</dd>
        </div>
        <div>
          <dt>已录</dt>
          <dd>
            {progress.recorded} / {progress.total}
          </dd>
        </div>
        <div>
          <dt>未录</dt>
          <dd>{progress.pending}</dd>
        </div>
        <div>
          <dt>缺考</dt>
          <dd>{progress.absent}</dd>
        </div>
        <div>
          <dt>免考</dt>
          <dd>{progress.exempt}</dd>
        </div>
      </dl>

      {error ? <p className="page-error">{error}</p> : null}
      {message ? <p className="page-success">{message}</p> : null}
      {progress.complete ? (
        <div className="pe-quick-done">
          <p>本次测试录入完成</p>
          <div className="pe-quick-done-actions">
            <button type="button" className="btn btn-primary" onClick={() => onOpenResult(draft, 'edit')}>
              查看测试结果
            </button>
            <button type="button" className="btn" onClick={() => onOpenResult(draft, 'analysis')}>
              测试分析
            </button>
            <button type="button" className="btn" onClick={onClose}>
              返回测试记录
            </button>
          </div>
        </div>
      ) : null}

      <div className="pe-quick-layout">
        <section className="pe-quick-stage">
          {current ? (
            <>
              <p className="pe-quick-current-name">
                {current.nameSnapshot}
                <span>
                  {STUDENT_GENDER_LABELS[current.genderSnapshot]} · {TEST_RECORD_STATUS_LABELS[current.status]}
                </span>
              </p>
              <label className="pe-quick-input-label">
                成绩{unitLabel ? `（${unitLabel}）` : ''}
                <input
                  ref={inputRef}
                  className="pe-quick-input"
                  value={input}
                  autoFocus
                  autoComplete="off"
                  disabled={working}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={testItem?.timeInputMode === 'minutesSeconds' ? '342 或 3:42' : '输入成绩后按 Enter'}
                />
              </label>
              <p className="pe-quick-preview">
                {preview?.ok ? `将保存为 ${preview.display}` : '输入数字后按 Enter 保存并跳到下一名'}
                {current.examScore !== null ? ` · ${current.examScore}分` : current.status === 'valid' ? ' · —' : ''}
              </p>
              <div className="pe-quick-status-actions">
                <button type="button" className="btn" onClick={() => void runAction({ type: 'absent' })} disabled={working}>
                  缺考 (A)
                </button>
                <button type="button" className="btn" onClick={() => void runAction({ type: 'exempt' })} disabled={working}>
                  免考 (E)
                </button>
                <button type="button" className="btn" onClick={() => void runAction({ type: 'pending' })} disabled={working}>
                  未测 (P)
                </button>
                <button type="button" className="btn" onClick={() => void runAction({ type: 'skip' })} disabled={working}>
                  跳过
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setCurrentId(adjacentRecordId(draft.records, currentId ?? '', -1))}
                >
                  上一名
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setCurrentId(adjacentRecordId(draft.records, currentId ?? '', 1))}
                >
                  下一名
                </button>
              </div>
            </>
          ) : (
            <p className="empty-text">没有学生</p>
          )}
        </section>

        <section className="pe-quick-roster">
          <table className="data-table pe-quick-table">
            <thead>
              <tr>
                <th>序号</th>
                <th>姓名</th>
                <th>性别</th>
                <th>原始成绩</th>
                <th>状态</th>
                <th>得分</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, index) => {
                const preferMinute = testItem
                  ? usesMinuteFormat(testItem.timeInputMode, testItem.valueType)
                  : false
                const raw =
                  record.rawValue === null
                    ? '—'
                    : formatRawValue(
                        record.rawValue,
                        draft.valueTypeSnapshot,
                        testItem?.decimalPlaces ?? 0,
                        preferMinute
                      )
                return (
                  <tr
                    key={record.id}
                    className={record.id === currentId ? 'pe-quick-row is-current' : 'pe-quick-row'}
                    onClick={() => setCurrentId(record.id)}
                  >
                    <td>{index + 1}</td>
                    <td>{record.nameSnapshot}</td>
                    <td>{STUDENT_GENDER_LABELS[record.genderSnapshot]}</td>
                    <td>{raw}</td>
                    <td>{TEST_RECORD_STATUS_LABELS[record.status]}</td>
                    <td>{record.examScore === null ? '—' : record.examScore}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      </div>
    </PageLayout>
  )
}
