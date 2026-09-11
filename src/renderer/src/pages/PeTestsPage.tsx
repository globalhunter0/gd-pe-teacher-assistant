import { useEffect, useMemo, useState } from 'react'
import PeTestEditor from '../components/PeTestEditor'
import PeQuickEntryPanel from '../components/PeQuickEntryPanel'
import PageLayout, { PageHeader } from '../components/PageLayout'
import DataTable from '../components/ds/DataTable'
import TechEmptyState from '../components/workspace/TechEmptyState'
import OverviewBar from '../components/workspace/OverviewBar'
import StatusBadge from '../components/StatusBadge'
import TestItemEditorDialog from '../components/TestItemEditorDialog'
import { listedClassRecords } from '@shared/class'
import { useClasses } from '../context/ClassContext'
import { usePeTests } from '../context/PeTestContext'
import { useStudents } from '../context/StudentContext'
import { useTestItems } from '../context/TestItemContext'
import { buildPeTestSession } from '../data/peTest/buildSession'
import { PE_TEST_PRIMARY_IMPORT_LABEL } from '@shared/examBatch'
import {
  TEST_CATEGORY_LABELS,
  TEST_DIRECTION_LABELS,
  TEST_GENDER_RULE_LABELS,
  TEST_VALUE_TYPE_LABELS,
  countTestRecords,
  formatLocalDate,
  testUnitDisplay,
  type PETestSession,
  type TestItem
} from '@shared/peTest'

interface PeTestsPageProps {
  openSessionId?: string | null
  onOpenSessionConsumed?: () => void
  prefillClassId?: string | null
  onPrefillClassConsumed?: () => void
  openEditorTab?: 'edit' | 'analysis'
  embedded?: boolean
  onRequestImport?: () => void
}

export default function PeTestsPage({
  openSessionId = null,
  onOpenSessionConsumed,
  prefillClassId = null,
  onPrefillClassConsumed,
  openEditorTab = 'edit',
  embedded = false,
  onRequestImport
}: PeTestsPageProps): React.JSX.Element {
  const { classes } = useClasses()
  const listedClasses = listedClassRecords(classes)
  const { students } = useStudents()
  const { items, loading: itemsLoading, error: itemsError, saveItems, upsertItem } = useTestItems()
  const { sessions, loading, error, upsertSession, deleteSession } = usePeTests()
  const [view, setView] = useState<'list' | 'items'>('list')
  const [editing, setEditing] = useState<PETestSession | null>(null)
  const [editorTab, setEditorTab] = useState<'edit' | 'analysis'>('edit')
  const [createOpen, setCreateOpen] = useState(false)
  const [pendingAnalysisId, setPendingAnalysisId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PETestSession | null>(null)
  const [itemEditor, setItemEditor] = useState<TestItem | null | undefined>(undefined)
  const [actionError, setActionError] = useState<string | null>(null)
  const [working, setWorking] = useState(false)
  const [duplicateCount, setDuplicateCount] = useState(0)
  const [quickEntry, setQuickEntry] = useState<{ sessionId?: string } | null>(null)

  const [classId, setClassId] = useState(listedClassRecords(classes)[0]?.id ?? '')
  const [testItemId, setTestItemId] = useState(items.find((item) => item.isActive)?.id ?? '')
  const [date, setDate] = useState(formatLocalDate(new Date()))
  const [title, setTitle] = useState('')

  useEffect(() => {
    if (!openSessionId || loading) {
      return
    }

    const found = sessions.find((item) => item.id === openSessionId)
    if (found) {
      setView('list')
      setEditorTab(openEditorTab)
      setEditing(found)
    }

    onOpenSessionConsumed?.()
  }, [openSessionId, loading, sessions, onOpenSessionConsumed, openEditorTab])

  useEffect(() => {
    if (!pendingAnalysisId || loading) {
      return
    }
    const found = sessions.find((item) => item.id === pendingAnalysisId)
    if (found) {
      setEditorTab('analysis')
      setEditing(found)
      setPendingAnalysisId(null)
    }
  }, [pendingAnalysisId, loading, sessions])

  useEffect(() => {
    if (!prefillClassId) {
      return
    }
    setClassId(prefillClassId)
    setView('list')
    onPrefillClassConsumed?.()
  }, [prefillClassId, onPrefillClassConsumed])

  const activeItems = useMemo(() => items.filter((item) => item.isActive), [items])
  const validScoreCount = useMemo(
    () => sessions.reduce((total, item) => total + countTestRecords(item.records).valid, 0),
    [sessions]
  )

  function activeStudentsOf(targetClassId: string) {
    return students.filter((item) => item.classId === targetClassId && item.status === 'active')
  }

  function openCreate(): void {
    if (classes.length === 0) {
      setActionError('请先在班级管理中创建班级')
      return
    }

    if (activeItems.length === 0) {
      setActionError('没有可用的测试项目，请先启用或新建项目')
      return
    }

    setActionError(null)
    setClassId(listedClasses[0]?.id ?? '')
    setTestItemId(activeItems[0]?.id ?? '')
    setDate(formatLocalDate(new Date()))
    setTitle('')
    setDuplicateCount(
      sessions.filter(
        (item) =>
          item.classId === (listedClasses[0]?.id ?? '') &&
          item.date === formatLocalDate(new Date()) &&
          item.testItemId === (activeItems[0]?.id ?? '')
      ).length
    )
    setCreateOpen(true)
  }

  async function handleCreate(): Promise<void> {
    const classRecord = classes.find((item) => item.id === classId)
    const testItem = items.find((item) => item.id === testItemId && item.isActive)
    if (!classRecord) {
      setActionError('请选择所属班级')
      return
    }

    if (!testItem) {
      setActionError('请选择测试项目')
      return
    }

    const active = activeStudentsOf(classId)
    if (active.length === 0) {
      setActionError('该班级没有在读学生，请先在学生管理中录入学生')
      return
    }

    const created = buildPeTestSession({
      classRecord,
      testItem,
      activeStudents: active,
      date,
      title,
      notes: ''
    })

    setWorking(true)
    setActionError(null)
    try {
      await upsertSession(created)
      setCreateOpen(false)
      setEditorTab('edit')
      setEditing(created)
    } catch (createError) {
      setActionError(createError instanceof Error ? createError.message : '创建失败')
    } finally {
      setWorking(false)
    }
  }

  async function handleConfirmDelete(): Promise<void> {
    if (!pendingDelete) {
      return
    }

    setWorking(true)
    try {
      await deleteSession(pendingDelete.id)
      setPendingDelete(null)
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : '删除失败')
    } finally {
      setWorking(false)
    }
  }

  async function toggleItemActive(item: TestItem): Promise<void> {
    setActionError(null)
    try {
      await upsertItem({ ...item, isActive: !item.isActive, updatedAt: new Date().toISOString() })
    } catch (toggleError) {
      setActionError(toggleError instanceof Error ? toggleError.message : '更新项目失败')
    }
  }

  async function deleteCustomItem(item: TestItem): Promise<void> {
    if (item.isBuiltin) {
      return
    }

    setActionError(null)
    try {
      await saveItems(items.filter((entry) => entry.id !== item.id))
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : '删除项目失败')
    }
  }

  function requestImport(): void {
    onRequestImport?.()
  }

  if (loading || itemsLoading) {
    if (embedded) {
      return <p className="empty-text">正在读取本地测试数据…</p>
    }
    return (
      <PageLayout>
        <PageHeader icon="tests" title="测试记录" description="正在读取本地测试数据…" />
      </PageLayout>
    )
  }

  if (quickEntry) {
    const initialSession = quickEntry.sessionId
      ? sessions.find((item) => item.id === quickEntry.sessionId) ?? null
      : null
    return (
      <PeQuickEntryPanel
        initialSession={initialSession}
        onClose={() => setQuickEntry(null)}
        onOpenResult={(session, tab) => {
          setQuickEntry(null)
          setEditorTab(tab)
          setEditing(session)
        }}
      />
    )
  }

  if (editing) {
    return (
      <PeTestEditor
        session={editing}
        testItem={items.find((item) => item.id === editing.testItemId)}
        historySessions={sessions}
        initialTab={editorTab}
        onBack={() => setEditing(null)}
        onRequestQuickEntry={() => {
          setQuickEntry({ sessionId: editing.id })
          setEditing(null)
        }}
        onSave={async (next) => {
          await upsertSession(next)
          setEditing(next)
        }}
      />
    )
  }

  const recordsToolbar =
    view === 'list' ? (
      <>
        <button type="button" className="btn" onClick={() => setView('items')}>
          测试项目
        </button>
        <button type="button" className="btn" onClick={requestImport}>
          {PE_TEST_PRIMARY_IMPORT_LABEL}
        </button>
        <button type="button" className="btn btn-primary" onClick={() => setQuickEntry({})}>
          快速录入
        </button>
        <button type="button" className="btn" onClick={openCreate}>
          新建测试
        </button>
      </>
    ) : (
      <>
        <button type="button" className="btn" onClick={() => setView('list')}>
          返回测试列表
        </button>
        <button type="button" className="btn btn-primary" onClick={() => setItemEditor(null)}>
          自定义项目
        </button>
      </>
    )

  const recordsBody = (
    <>
      {error ? <p className="page-error">{error}</p> : null}
      {itemsError ? <p className="page-error">{itemsError}</p> : null}
      {actionError ? <p className="page-error">{actionError}</p> : null}

      {view === 'list' ? (
        <OverviewBar
          items={[
            { label: '测试项目', value: items.length, hint: '内置与自定义' },
            { label: '测试记录', value: sessions.length, hint: '已保存测试' },
            { label: '有效成绩', value: validScoreCount, hint: '有效录入人次' }
          ]}
        />
      ) : null}

      {view === 'items' ? (
          <DataTable>
            <table className="data-table">
            <thead>
              <tr>
                <th>项目</th>
                <th>分类</th>
                <th>类型</th>
                <th>单位</th>
                <th>方向</th>
                <th>性别</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.name}
                    {item.isBuiltin ? <span className="tag">内置</span> : null}
                  </td>
                  <td>{TEST_CATEGORY_LABELS[item.category]}</td>
                  <td>{TEST_VALUE_TYPE_LABELS[item.valueType]}</td>
                  <td>{testUnitDisplay(item.unit, item.customUnitLabel)}</td>
                  <td>{TEST_DIRECTION_LABELS[item.direction]}</td>
                  <td>{TEST_GENDER_RULE_LABELS[item.genderRule]}</td>
                  <td>
                    <StatusBadge tone={item.isActive ? 'ok' : 'muted'}>{item.isActive ? '启用' : '停用'}</StatusBadge>
                  </td>
                  <td>
                    <div className="table-actions">
                      {item.isBuiltin ? null : (
                        <button type="button" className="btn btn-small" onClick={() => setItemEditor(item)}>
                          编辑
                        </button>
                      )}
                      <button type="button" className="btn btn-small" onClick={() => void toggleItemActive(item)}>
                        {item.isActive ? '停用' : '启用'}
                      </button>
                      {item.isBuiltin ? null : (
                        <button type="button" className="btn btn-small btn-danger" onClick={() => void deleteCustomItem(item)}>
                          删除
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </DataTable>
      ) : sessions.length === 0 ? (
        <TechEmptyState
          kind="tests"
          title="还没有体育测试"
          description="已有成绩表时，推荐直接导入 Excel。"
          actionLabel="导入Excel成绩"
          onAction={requestImport}
          secondaryLabel="新建测试"
          onSecondary={openCreate}
        />
      ) : (
          <DataTable>
            <table className="data-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>班级</th>
                <th>项目</th>
                <th>已录入</th>
                <th>未录入</th>
                <th>有效成绩</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((item) => {
                const counts = countTestRecords(item.records)
                return (
                  <tr key={item.id}>
                    <td>{item.date}</td>
                    <td>
                      {item.gradeSnapshot} {item.classNameSnapshot}
                    </td>
                    <td>{item.testItemNameSnapshot}</td>
                    <td>
                      {counts.entered}/{item.records.length}
                    </td>
                    <td>{counts.pending}</td>
                    <td>{counts.valid}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn btn-small"
                          onClick={() => {
                            setEditorTab('edit')
                            setEditing(item)
                          }}
                        >
                          打开/编辑
                        </button>
                        <button
                          type="button"
                          className="btn btn-small"
                          onClick={() => {
                            setEditorTab('analysis')
                            setEditing(item)
                          }}
                        >
                          测试分析
                        </button>
                        <button type="button" className="btn btn-small btn-danger" onClick={() => setPendingDelete(item)}>
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </DataTable>
      )}

      {createOpen ? (
        <div className="dialog-backdrop" onMouseDown={() => setCreateOpen(false)}>
          <div
            className="dialog dialog--class"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pe-test-create-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h3 id="pe-test-create-title">新建测试</h3>
            <p className="dialog-slot">将读取该班当前在读学生，并冻结姓名、学号、性别快照。后续改名或转班不会改动这次测试。</p>
            <div className="dialog-grid">
              <label className="dialog-span">
                班级 *
                <select
                  value={classId}
                  onChange={(event) => {
                    const nextClassId = event.target.value
                    setClassId(nextClassId)
                    setDuplicateCount(
                      sessions.filter(
                        (item) => item.classId === nextClassId && item.date === date && item.testItemId === testItemId
                      ).length
                    )
                  }}
                >
                  {listedClasses.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.grade} {item.className}
                    </option>
                  ))}
                </select>
              </label>
              <label className="dialog-span">
                测试项目 *
                <select
                  value={testItemId}
                  onChange={(event) => {
                    const nextItemId = event.target.value
                    setTestItemId(nextItemId)
                    setDuplicateCount(
                      sessions.filter((item) => item.classId === classId && item.date === date && item.testItemId === nextItemId)
                        .length
                    )
                  }}
                >
                  {activeItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                日期 *
                <input
                  type="date"
                  value={date}
                  onChange={(event) => {
                    const nextDate = event.target.value
                    setDate(nextDate)
                    setDuplicateCount(
                      sessions.filter(
                        (item) => item.classId === classId && item.date === nextDate && item.testItemId === testItemId
                      ).length
                    )
                  }}
                />
              </label>
              <label className="dialog-span">
                测试名称
                <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="可留空，将自动生成" />
              </label>
            </div>
            {duplicateCount > 0 ? (
              <p className="dialog-error">
                该班该日该项目已有 {duplicateCount} 次测试。仍可继续新建（例如补测、分组测试）。
              </p>
            ) : null}
            <div className="dialog-actions">
              <span />
              <div className="dialog-actions-right">
                <button type="button" className="btn" onClick={() => setCreateOpen(false)} disabled={working}>
                  取消
                </button>
                <button type="button" className="btn btn-primary" onClick={() => void handleCreate()} disabled={working}>
                  创建并录入
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {pendingDelete ? (
        <div className="dialog-backdrop" onMouseDown={() => setPendingDelete(null)}>
          <div
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pe-test-delete-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h3 id="pe-test-delete-title">确定删除这次测试吗？</h3>
            <p className="dialog-slot">
              {pendingDelete.date} {pendingDelete.gradeSnapshot} {pendingDelete.classNameSnapshot}{' '}
              {pendingDelete.testItemNameSnapshot} 的成绩将一并删除。
            </p>
            <div className="dialog-actions">
              <span />
              <div className="dialog-actions-right">
                <button type="button" className="btn" onClick={() => setPendingDelete(null)} disabled={working}>
                  取消
                </button>
                <button type="button" className="btn btn-danger" onClick={() => void handleConfirmDelete()} disabled={working}>
                  确认删除
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {itemEditor !== undefined ? (
        <TestItemEditorDialog
          record={itemEditor}
          onClose={() => setItemEditor(undefined)}
          onSave={async (item) => {
            await upsertItem(item)
            setItemEditor(undefined)
          }}
        />
      ) : null}
    </>
  )

  if (embedded) {
    return (
      <>
        <div className="pe-center-toolbar">{recordsToolbar}</div>
        {recordsBody}
      </>
    )
  }

  return (
    <PageLayout className="page--pe-tests page-shell">
      <PageHeader
        icon="tests"
        title="测试记录"
        description={
          view === 'items'
            ? '管理内置与自定义测试项目。内置项目不能删除，只能停用。'
            : '已经发生的体育测试。已有成绩表时，推荐直接导入 Excel。'
        }
        actions={recordsToolbar}
      />
      {recordsBody}
    </PageLayout>
  )
}
