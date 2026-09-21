import { useEffect, useMemo, useRef, useState } from 'react'
import PageLayout, { PageHeader } from './PageLayout'
import { listedClassRecords } from '@shared/class'
import { listBuiltinExamStandards } from '@shared/examStandard/catalog'
import { STUDENT_GENDER_LABELS } from '@shared/student'
import {
  TEST_RECORD_STATUS_LABELS,
  adjacentRecordId,
  applyQuickEntry,
  applyQuickEntryUndo,
  captureRecordState,
  classroomScoringLabel,
  countQuickEntryProgress,
  defaultTeacherTestOptionValue,
  firstUnenteredRecordId,
  formatLocalDate,
  formatPeTestItemScoreText,
  formatRawValue,
  isGenderLinkedSession,
  listClassroomScoringOptions,
  parseQuickEntryInput,
  parseTeacherTestSelection,
  resolveEffectiveTestItem,
  resolveQuickEntryStatusShortcut,
  sessionDisplayItemName,
  teacherSelectableTestOptions,
  teacherTestOptionValue,
  UNRESOLVED_LINKED_ITEM_MESSAGE,
  sortQuickEntryRecords,
  testUnitDisplay,
  usesMinuteFormat,
  visibleQuickEntryRecords,
  type PETestRecord,
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
  findExistingPeTestsForQuickEntry,
  isGroupComplete,
  pendingStudentIds,
  pushRecentEntry,
  pushUndoEntry,
  recentEntryFromRecord,
  uniqueStudentIds,
  type QuickEntryRecentEntry,
  type QuickEntryRosterTab,
  type QuickEntryUndoEntry
} from '@shared/peTest/quickEntry'

interface PeQuickEntryPanelProps {
  initialSession?: PETestSession | null
  /** 补测等场景：打开时默认名单页签（如仅未测）。 */
  initialRosterTab?: QuickEntryRosterTab
  /** 补测等场景：限制可见学生；null 表示不限制。 */
  initialGroupStudentIds?: string[] | null
  /** 课堂内嵌：隐藏测试管理入口，完成后回到课堂。 */
  embedded?: boolean
  onClose: () => void
  onOpenResult: (session: PETestSession, tab: 'edit' | 'analysis') => void
}

function examStandardForScoring(id: string | null) {
  if (!id) {
    return null
  }
  return listBuiltinExamStandards().find((item) => item.id === id) ?? null
}

function itemForQuickEntryRecord(
  session: PETestSession | null,
  record: PETestRecord,
  fallback: TestItem | undefined,
  items: ReadonlyArray<TestItem>
): TestItem | undefined {
  if (!session || !fallback) {
    return fallback
  }
  const resolved = resolveEffectiveTestItem(session, record, fallback, items)
  return resolved.ok ? resolved.item : fallback
}

function formatRecordRaw(record: PETestRecord, testItem: TestItem | undefined, session: PETestSession): string {
  if (record.status === 'absent') {
    return '缺考'
  }
  if (record.status === 'exempt') {
    return '免考'
  }
  if (record.rawValue === null) {
    return '未测'
  }
  const preferMinute = testItem
    ? usesMinuteFormat(testItem.timeInputMode, testItem.valueType)
    : usesMinuteFormat(session.timeInputModeSnapshot, session.valueTypeSnapshot)
  return formatRawValue(record.rawValue, session.valueTypeSnapshot, testItem?.decimalPlaces ?? 0, preferMinute)
}

export default function PeQuickEntryPanel({
  initialSession = null,
  initialRosterTab = 'pending',
  initialGroupStudentIds = null,
  embedded = false,
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
    initialSession ? firstUnenteredRecordId(initialSession.records, initialGroupStudentIds) : null
  )
  const [input, setInput] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [working, setWorking] = useState(false)
  const [rosterTab, setRosterTab] = useState<QuickEntryRosterTab>(initialRosterTab)
  const [searchQuery, setSearchQuery] = useState('')
  const [groupStudentIds, setGroupStudentIds] = useState<string[] | null>(initialGroupStudentIds)
  const [groupPickerOpen, setGroupPickerOpen] = useState(false)
  const [pickerSelected, setPickerSelected] = useState<string[]>([])
  const [undoStack, setUndoStack] = useState<QuickEntryUndoEntry[]>([])
  const [recent, setRecent] = useState<QuickEntryRecentEntry[]>([])
  const [toast, setToast] = useState<QuickEntryRecentEntry | null>(null)

  const [classId, setClassId] = useState(initialSession?.classId ?? listedClasses[0]?.id ?? '')
  const [testItemId, setTestItemId] = useState(
    initialSession?.testGroupId
      ? teacherTestOptionValue(initialSession.testGroupId)
      : (initialSession?.testItemId ?? defaultTeacherTestOptionValue(items))
  )
  const [date, setDate] = useState(initialSession?.date ?? formatLocalDate(new Date()))
  const [examStandardId, setExamStandardId] = useState(initialSession?.examStandardId ?? '')

  const teacherOptions = useMemo(() => teacherSelectableTestOptions(items), [items])
  const classStudents = useMemo(() => activeStudentsOfClass(students, classId), [students, classId])
  const existing = useMemo(
    () => (draft ? [] : findExistingPeTestsForQuickEntry(sessions, classId, date, testItemId, items)),
    [sessions, classId, date, testItemId, draft, items]
  )
  const teacherSelection = useMemo(() => parseTeacherTestSelection(testItemId, items), [testItemId, items])
  const sessionItem: TestItem | undefined = draft
    ? items.find((item) => item.id === draft.testItemId)
    : teacherSelection?.kind === 'group'
      ? teacherSelection.anchor
      : teacherSelection?.item
  const standard = examStandardForScoring(draft?.examStandardId ?? examStandardId)
  const records = useMemo(() => (draft ? sortQuickEntryRecords(draft.records) : []), [draft])
  const visibleRecords = useMemo(
    () =>
      visibleQuickEntryRecords(records, {
        tab: rosterTab,
        query: searchQuery,
        groupStudentIds
      }),
    [records, rosterTab, searchQuery, groupStudentIds]
  )
  const current = records.find((item) => item.id === currentId) ?? null
  const resolvedCurrent = draft && current && sessionItem ? resolveEffectiveTestItem(draft, current, sessionItem, items) : null
  const testItem = resolvedCurrent?.ok ? resolvedCurrent.item : sessionItem
  const currentItemUnresolved = Boolean(draft && current && resolvedCurrent && !resolvedCurrent.ok)
  const progress = useMemo(() => countQuickEntryProgress(draft?.records ?? []), [draft])
  const groupDone = Boolean(groupStudentIds && draft && isGroupComplete(draft.records, groupStudentIds))

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

  useEffect(() => {
    if (!toast) {
      return
    }
    const timer = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(timer)
  }, [toast])

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
    const beforeRecord = draft.records.find((item) => item.id === currentId)
    const result = applyQuickEntry({
      session: draft,
      testItem,
      recordId: currentId,
      action,
      standard,
      nowIso: new Date().toISOString(),
      scopeStudentIds: groupStudentIds,
      items
    })
    if (!result.ok) {
      setError(result.message)
      window.setTimeout(() => inputRef.current?.focus(), 0)
      return
    }
    const afterRecord = result.session.records.find((item) => item.id === currentId)
    if (beforeRecord && afterRecord && action.type !== 'skip') {
      setUndoStack((stack) =>
        pushUndoEntry(stack, {
          sessionId: draft.id,
          recordId: currentId,
          studentId: beforeRecord.studentId,
          before: captureRecordState(beforeRecord),
          after: captureRecordState(afterRecord)
        })
      )
      const recentItem = recentEntryFromRecord(afterRecord, formatRecordRaw(afterRecord, testItem, result.session))
      setRecent((items) => pushRecentEntry(items, recentItem))
      setToast(recentItem)
    }
    await persist(result.session, result.nextRecordId, result.message)
  }

  async function undoLast(): Promise<void> {
    if (!draft || undoStack.length === 0) {
      return
    }
    const entry = undoStack[undoStack.length - 1]
    const restored = applyQuickEntryUndo(draft, entry, new Date().toISOString())
    if (!restored.ok) {
      setError(restored.message)
      return
    }
    setUndoStack((stack) => stack.slice(0, -1))
    await persist(restored.session, entry.recordId, '已撤销上一条')
  }

  useEffect(() => {
    if (!draft) {
      return
    }
    function onWindowKey(event: KeyboardEvent): void {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        void undoLast()
      }
    }
    window.addEventListener('keydown', onWindowKey)
    return () => window.removeEventListener('keydown', onWindowKey)
  }, [draft, undoStack])

  async function startNew(): Promise<void> {
    const classRecord = classes.find((item) => item.id === classId)
    const selection = parseTeacherTestSelection(testItemId, items)
    const item = selection?.kind === 'group' ? selection.anchor : selection?.item
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
      notes: '',
      testGroup: selection?.kind === 'group' ? selection.group : null,
      examStandardId: examStandardId || null
    })
    setWorking(true)
    try {
      await upsertSession(created)
      setDraft(created)
      setCurrentId(firstUnenteredRecordId(created.records))
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

  function openGroupPicker(): void {
    if (!draft) {
      return
    }
    setPickerSelected(pendingStudentIds(sortQuickEntryRecords(draft.records)))
    setGroupPickerOpen(true)
  }

  function startGroup(): void {
    if (!draft) {
      return
    }
    const ids = uniqueStudentIds(pickerSelected)
    if (ids.length === 0) {
      setError('请先选择本组学生')
      return
    }
    setGroupStudentIds(ids)
    setGroupPickerOpen(false)
    setRosterTab('pending')
    setCurrentId(firstUnenteredRecordId(draft.records, ids))
    setError(null)
  }

  function leaveGroup(): void {
    setGroupStudentIds(null)
    if (draft) {
      setCurrentId(firstUnenteredRecordId(draft.records))
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault()
      event.stopPropagation()
      void undoLast()
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      void runAction({ type: 'score', input })
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (draft) {
        setCurrentId(adjacentRecordId(draft.records, currentId ?? '', -1, groupStudentIds))
      }
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (draft) {
        setCurrentId(adjacentRecordId(draft.records, currentId ?? '', 1, groupStudentIds))
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
  const progressPercent = progress.total === 0 ? 0 : Math.round((progress.recorded / progress.total) * 100)

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
              {teacherOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            测试日期
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <label>
            评分依据
            <select value={examStandardId} onChange={(event) => setExamStandardId(event.target.value)}>
              {listClassroomScoringOptions().map((item) => (
                <option key={item.id || 'raw'} value={item.id}>
                  {item.label}
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
        title={embedded ? '课堂测评录入' : '课堂快速录入'}
        description={`${draft.gradeSnapshot} ${draft.classNameSnapshot} · ${sessionDisplayItemName(draft)} · ${draft.date} · ${classroomScoringLabel(draft)}`}
        actions={
          <button type="button" className="btn" onClick={onClose}>
            {embedded ? '返回课堂记录' : '返回测试记录'}
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
          <dd>{sessionDisplayItemName(draft)}</dd>
        </div>
        <div>
          <dt>日期</dt>
          <dd>{draft.date}</dd>
        </div>
        <div>
          <dt>评分依据</dt>
          <dd>{classroomScoringLabel(draft)}</dd>
        </div>
        <div>
          <dt>进度</dt>
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
      <div className="pe-quick-progress" aria-label="录入进度">
        <span style={{ width: `${progressPercent}%` }} />
      </div>

      {error ? <p className="page-error">{error}</p> : null}
      {message ? <p className="page-success">{message}</p> : null}
      {toast ? (
        <p className="pe-quick-toast" aria-live="polite">
          ✓ {toast.studentNo}号 {toast.name} {toast.rawDisplay}
          {toast.scoreText !== '—' ? ` ${toast.scoreText}` : ''}
        </p>
      ) : null}
      {progress.complete && !groupStudentIds ? (
        <div className="pe-quick-done">
          <p>本次测试录入完成</p>
          <div className="pe-quick-done-actions">
            {embedded ? (
              <button type="button" className="btn btn-primary" onClick={onClose}>
                返回课堂记录
              </button>
            ) : (
              <>
                <button type="button" className="btn btn-primary" onClick={() => onOpenResult(draft, 'edit')}>
                  查看测试结果
                </button>
                <button type="button" className="btn" onClick={() => onOpenResult(draft, 'analysis')}>
                  测试分析
                </button>
                <button type="button" className="btn" onClick={onClose}>
                  返回测试记录
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
      {groupDone ? (
        <div className="pe-quick-done">
          <p>本组录入完成</p>
          <div className="pe-quick-done-actions">
            <button type="button" className="btn btn-primary" onClick={leaveGroup}>
              返回全班
            </button>
            <button type="button" className="btn" onClick={openGroupPicker}>
              选择下一组
            </button>
          </div>
        </div>
      ) : null}

      <div className="pe-quick-layout">
        <section className="pe-quick-stage">
          {current ? (
            <>
              <p className="pe-quick-current-label">
                当前：{current.studentNoSnapshot}号 {current.nameSnapshot}（{STUDENT_GENDER_LABELS[current.genderSnapshot]}）
              </p>
              {isGenderLinkedSession(draft) ? (
                <p className="pe-quick-setup-hint">
                  项目：
                  {currentItemUnresolved
                    ? UNRESOLVED_LINKED_ITEM_MESSAGE
                    : (testItem?.name ?? sessionDisplayItemName(draft))}
                </p>
              ) : null}
              <p className="pe-quick-current-name">
                {current.studentNoSnapshot} {current.nameSnapshot}
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
                  disabled={working || currentItemUnresolved}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={testItem?.timeInputMode === 'minutesSeconds' ? '342 或 3:42' : '输入成绩后按 Enter'}
                />
              </label>
              <p className="pe-quick-preview">
                {preview?.ok ? `将保存为 ${preview.display}` : '输入数字后按 Enter 保存并跳到下一名'}
                {formatPeTestItemScoreText(current) !== '—' ? ` · ${formatPeTestItemScoreText(current)}` : ''}
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
                  onClick={() => setCurrentId(adjacentRecordId(draft.records, currentId ?? '', -1, groupStudentIds))}
                >
                  上一名
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setCurrentId(adjacentRecordId(draft.records, currentId ?? '', 1, groupStudentIds))}
                >
                  下一名
                </button>
                <button type="button" className="btn" onClick={() => void undoLast()} disabled={working || undoStack.length === 0}>
                  撤销上一条
                </button>
              </div>
            </>
          ) : (
            <p className="empty-text">没有学生</p>
          )}

          <div className="pe-quick-recent">
            <h3>最近录入</h3>
            {recent.length === 0 ? (
              <p className="pe-quick-setup-hint">还没有刚录入的成绩</p>
            ) : (
              <ul>
                {recent.map((item) => (
                  <li key={item.recordId}>
                    {item.studentNo} {item.name} {item.rawDisplay}
                    {item.scoreText !== '—' ? ` ${item.scoreText}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="pe-quick-roster">
          <div className="pe-quick-roster-tools">
            <div className="pe-quick-tabs" role="tablist" aria-label="名单视图">
              {(
                [
                  ['pending', '未录'],
                  ['recorded', '已录'],
                  ['absentExempt', '缺考/免考'],
                  ['all', '全部']
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  className={rosterTab === id ? 'btn btn-small btn-primary' : 'btn btn-small'}
                  onClick={() => setRosterTab(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <input
              className="pe-quick-search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜索姓名或学号"
              aria-label="搜索学生"
            />
            <div className="pe-quick-status-actions">
              {groupStudentIds ? (
                <button type="button" className="btn btn-small" onClick={leaveGroup}>
                  返回全班
                </button>
              ) : (
                <button type="button" className="btn btn-small" onClick={openGroupPicker}>
                  分组模式
                </button>
              )}
              <button type="button" className="btn btn-small" onClick={openGroupPicker}>
                选择本组学生
              </button>
            </div>
            {groupStudentIds ? <p className="pe-quick-setup-hint">本组 {groupStudentIds.length} 人</p> : null}
          </div>
          <table className="data-table pe-quick-table">
            <thead>
              <tr>
                <th>序号</th>
                <th>学号</th>
                <th>姓名</th>
                <th>性别</th>
                <th>原始成绩</th>
                <th>状态</th>
                <th>得分</th>
              </tr>
            </thead>
            <tbody>
              {visibleRecords.map((record) => {
                const classIndex = records.findIndex((item) => item.id === record.id)
                return (
                  <tr
                    key={record.id}
                    className={record.id === currentId ? 'pe-quick-row is-current' : 'pe-quick-row'}
                    onClick={() => setCurrentId(record.id)}
                  >
                    <td>{classIndex + 1}</td>
                    <td>{record.studentNoSnapshot}</td>
                    <td>{record.nameSnapshot}</td>
                    <td>{STUDENT_GENDER_LABELS[record.genderSnapshot]}</td>
                    <td>{formatRecordRaw(record, itemForQuickEntryRecord(draft, record, sessionItem, items), draft)}</td>
                    <td>{TEST_RECORD_STATUS_LABELS[record.status]}</td>
                    <td>{formatPeTestItemScoreText(record)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      </div>

      {groupPickerOpen ? (
        <div className="dialog-backdrop" onMouseDown={() => setGroupPickerOpen(false)}>
          <div
            className="dialog dialog--class"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pe-quick-group-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h3 id="pe-quick-group-title">选择本组学生</h3>
            <p className="dialog-slot">只作为现场工作集，不会新建测试或复制学生。</p>
            <div className="dialog-actions">
              <button
                type="button"
                className="btn btn-small"
                onClick={() => setPickerSelected(pendingStudentIds(records))}
              >
                全选未录
              </button>
            </div>
            <div className="pe-quick-picker">
              {records.map((record) => {
                const checked = pickerSelected.includes(record.studentId)
                return (
                  <label key={record.id} className="pe-quick-picker-row">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setPickerSelected((ids) =>
                          checked ? ids.filter((id) => id !== record.studentId) : [...ids, record.studentId]
                        )
                      }}
                    />
                    <span>
                      {record.studentNoSnapshot} {record.nameSnapshot}{' '}
                      {STUDENT_GENDER_LABELS[record.genderSnapshot]} · {TEST_RECORD_STATUS_LABELS[record.status]}
                    </span>
                  </label>
                )
              })}
            </div>
            <div className="dialog-actions">
              <span />
              <div className="dialog-actions-right">
                <button type="button" className="btn" onClick={() => setGroupPickerOpen(false)}>
                  取消
                </button>
                <button type="button" className="btn btn-primary" onClick={startGroup}>
                  开始本组录入
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </PageLayout>
  )
}
