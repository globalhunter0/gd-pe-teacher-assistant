import { useEffect, useMemo, useRef, useState } from 'react'
import PeSessionEditor from '../components/PeSessionEditor'
import PageLayout, { PageHeader } from '../components/PageLayout'
import DataTable from '../components/ds/DataTable'
import TechEmptyState from '../components/workspace/TechEmptyState'
import OverviewBar from '../components/workspace/OverviewBar'
import { listedClassRecords } from '@shared/class'
import { useClasses } from '../context/ClassContext'
import { usePeSessions } from '../context/PeSessionContext'
import { useStudents } from '../context/StudentContext'
import { buildPeSession } from '../data/peSession/buildSession'
import {
  COMMON_PERIODS,
  PE_LESSON_TYPE_LABELS,
  PE_LESSON_TYPES,
  countAttendance,
  findDuplicateSession,
  formatLocalDate,
  type PEClassSession,
  type PeLessonType,
  type PeSessionPrefill
} from '@shared/peSession'

interface PeLessonRecordsPageProps {
  prefill: PeSessionPrefill | null
  onPrefillConsumed: () => void
}

export default function PeLessonRecordsPage({
  prefill,
  onPrefillConsumed
}: PeLessonRecordsPageProps): React.JSX.Element {
  const { classes } = useClasses()
  const listedClasses = listedClassRecords(classes)
  const { students } = useStudents()
  const { sessions, loading, error, upsertSession, deleteSession } = usePeSessions()
  const [editing, setEditing] = useState<PEClassSession | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [prefillOpen, setPrefillOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<PEClassSession | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [working, setWorking] = useState(false)
  const [duplicateHint, setDuplicateHint] = useState<PEClassSession | null>(null)
  const [filterClassKey, setFilterClassKey] = useState('all')

  const [classId, setClassId] = useState(listedClasses[0]?.id ?? '')
  const [date, setDate] = useState(formatLocalDate(new Date()))
  const [period, setPeriod] = useState(1)
  const [lessonType, setLessonType] = useState<PeLessonType>('regular')
  const [topic, setTopic] = useState('')
  const [prefillClassId, setPrefillClassId] = useState(listedClasses[0]?.id ?? '')
  const handledPrefillKey = useRef<string | null>(null)

  const classFilterOptions = useMemo(() => {
    const keys = Array.from(new Set(sessions.map((item) => `${item.gradeSnapshot} ${item.classNameSnapshot}`)))
    return keys.sort((a, b) => a.localeCompare(b, 'zh-CN'))
  }, [sessions])

  const lessonTotals = useMemo(() => {
    return sessions.reduce(
      (acc, item) => {
        const counts = countAttendance(item.records)
        acc.absent += counts.absent
        acc.leave += counts.leave
        acc.late += counts.late
        acc.observer += counts.observer
        return acc
      },
      { absent: 0, leave: 0, late: 0, observer: 0 }
    )
  }, [sessions])

  const visibleSessions = useMemo(() => {
    if (filterClassKey === 'all') {
      return sessions
    }
    return sessions.filter((item) => `${item.gradeSnapshot} ${item.classNameSnapshot}` === filterClassKey)
  }, [sessions, filterClassKey])

  useEffect(() => {
    if (!prefill) {
      handledPrefillKey.current = null
      return
    }
    if (loading) {
      return
    }

    const key = `${prefill.scheduleLessonId}|${prefill.date}|${prefill.period}|${prefill.classId ?? ''}`
    if (handledPrefillKey.current === key) {
      return
    }
    handledPrefillKey.current = key

    const boundClassId =
      prefill.classId && classes.some((item) => item.id === prefill.classId) ? prefill.classId : undefined

    if (boundClassId) {
      setPrefillOpen(false)
      setActionError(null)
      void createForClass(boundClassId, {
        date: prefill.date,
        period: prefill.period,
        lessonType: prefill.lessonType,
        topic: '',
        scheduleLessonId: prefill.scheduleLessonId,
        teamSnapshot: prefill.teamSnapshot,
        startTimeSnapshot: prefill.startTimeSnapshot,
        endTimeSnapshot: prefill.endTimeSnapshot
      })
      return
    }

    setPrefillOpen(true)
    setPrefillClassId(classes[0]?.id ?? '')
    setActionError(null)
  }, [prefill, classes, loading])

  function activeStudentsOf(targetClassId: string) {
    return students.filter((item) => item.classId === targetClassId && item.status === 'active')
  }

  function openCreate(): void {
    if (listedClasses.length === 0) {
      setActionError('请先在班级管理中创建班级')
      return
    }

    setActionError(null)
    setDuplicateHint(null)
    setClassId(classes[0]?.id ?? '')
    setDate(formatLocalDate(new Date()))
    setPeriod(1)
    setLessonType('extra')
    setTopic('')
    setCreateOpen(true)
  }

  async function createForClass(
    targetClassId: string,
    options: {
      date: string
      period: number
      lessonType: PeLessonType
      topic: string
      scheduleLessonId: string | null
      teamSnapshot: string
      startTimeSnapshot: string
      endTimeSnapshot: string
    }
  ): Promise<void> {
    const classRecord = classes.find((item) => item.id === targetClassId)
    if (!classRecord) {
      setActionError('请选择所属班级')
      return
    }

    const active = activeStudentsOf(targetClassId)
    if (active.length === 0) {
      setActionError('该班级没有在读学生，请先在学生管理中录入学生')
      return
    }

    const existing = findDuplicateSession(sessions, targetClassId, options.date, options.period)
    if (existing && 'records' in existing) {
      setCreateOpen(false)
      setPrefillOpen(false)
      onPrefillConsumed()
      setEditing(existing as PEClassSession)
      setActionError(`该班级 ${options.date} 第${options.period}节已有课堂记录，已打开已有记录。`)
      return
    }

    const created = buildPeSession({
      classRecord,
      activeStudents: active,
      ...options
    })

    setWorking(true)
    try {
      await upsertSession(created)
      setCreateOpen(false)
      setPrefillOpen(false)
      onPrefillConsumed()
      setEditing(created)
      setActionError(null)
    } catch (createError) {
      setActionError(createError instanceof Error ? createError.message : '创建课堂失败')
    } finally {
      setWorking(false)
    }
  }

  async function handleManualCreate(): Promise<void> {
    setDuplicateHint(null)
    const existing = findDuplicateSession(sessions, classId, date, period)
    if (existing && 'records' in existing) {
      setDuplicateHint(existing as PEClassSession)
      return
    }

    await createForClass(classId, {
      date,
      period,
      lessonType,
      topic,
      scheduleLessonId: null,
      teamSnapshot: '',
      startTimeSnapshot: '',
      endTimeSnapshot: ''
    })
  }

  async function handlePrefillCreate(): Promise<void> {
    if (!prefill) {
      return
    }

    await createForClass(prefillClassId, {
      date: prefill.date,
      period: prefill.period,
      lessonType: prefill.lessonType,
      topic: '',
      scheduleLessonId: prefill.scheduleLessonId,
      teamSnapshot: prefill.teamSnapshot,
      startTimeSnapshot: prefill.startTimeSnapshot,
      endTimeSnapshot: prefill.endTimeSnapshot
    })
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

  if (loading) {
    return (
      <PageLayout>
        <PageHeader icon="lessons" title="课堂记录" description="正在读取本地课堂记录…" />
      </PageLayout>
    )
  }

  if (editing) {
    return (
      <PeSessionEditor
        key={editing.id}
        session={editing}
        onBack={() => setEditing(null)}
        onSave={async (next) => {
          await upsertSession(next)
          setEditing(next)
        }}
      />
    )
  }

  return (
    <PageLayout className="page--pe-sessions page-shell">
      <PageHeader
        icon="lessons"
        title="课堂记录"
        description="记录每节体育课的考勤与课堂表现。默认全员正常，只点异常即可。"
        actions={
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            新建课堂记录
          </button>
        }
      />

      {error ? <p className="page-error">{error}</p> : null}
      {actionError ? <p className="page-error">{actionError}</p> : null}

      <OverviewBar
        items={[
          { label: '课堂记录', value: sessions.length, hint: '已保存课次' },
          { label: '缺勤人次', value: lessonTotals.absent, hint: '按记录累计' },
          { label: '请假人次', value: lessonTotals.leave, hint: '按记录累计' },
          { label: '迟到 / 见习', value: `${lessonTotals.late} / ${lessonTotals.observer}`, hint: '按记录累计' }
        ]}
      />

      {sessions.length === 0 ? (
        <TechEmptyState
          kind="lessons"
          title="还没有课堂记录"
          description="可从工作台今日课程点击“开始记录”，或在这里新建补课、临时课。"
          actionLabel="新建课堂记录"
          onAction={openCreate}
        />
      ) : (
        <>
          <div className="toolbar">
            <label className="toolbar-field">
              班级筛选
              <select value={filterClassKey} onChange={(event) => setFilterClassKey(event.target.value)}>
                <option value="all">全部班级</option>
                {classFilterOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {visibleSessions.length === 0 ? (
            <TechEmptyState kind="lessons" title="没有符合筛选的记录" description="试试选择全部班级。" />
          ) : (
            <DataTable>
              <table className="data-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>节次</th>
                <th>班级</th>
                <th>课程类型</th>
                <th>主题</th>
                <th>正常</th>
                <th>缺勤</th>
                <th>请假</th>
                <th>迟到</th>
                <th>见习</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {visibleSessions.map((item) => {
                const counts = countAttendance(item.records)
                return (
                  <tr key={item.id}>
                    <td>{item.date}</td>
                    <td>第{item.period}节</td>
                    <td>
                      {item.gradeSnapshot} {item.classNameSnapshot}
                    </td>
                    <td>{PE_LESSON_TYPE_LABELS[item.lessonType]}</td>
                    <td>{item.topic || '—'}</td>
                    <td>{counts.normal}</td>
                    <td>{counts.absent}</td>
                    <td>{counts.leave}</td>
                    <td>{counts.late}</td>
                    <td>{counts.observer}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="btn btn-small" onClick={() => setEditing(item)}>
                          查看/编辑
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
        </>
      )}

      {createOpen ? (
        <div className="dialog-backdrop" onMouseDown={() => setCreateOpen(false)}>
          <div
            className="dialog dialog--class"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pe-create-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h3 id="pe-create-title">新建课堂记录</h3>
            <p className="dialog-slot">用于补课、临时课或课表外的体育课。创建后将冻结当时在读学生名单。</p>
            <div className="dialog-grid">
              <label className="dialog-span">
                班级 *
                <select value={classId} onChange={(event) => setClassId(event.target.value)}>
                  {listedClasses.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.grade} {item.className}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                日期 *
                <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </label>
              <label>
                节次 *
                <select value={String(period)} onChange={(event) => setPeriod(Number(event.target.value))}>
                  {COMMON_PERIODS.map((item) => (
                    <option key={item} value={item}>
                      第{item}节
                    </option>
                  ))}
                </select>
              </label>
              <label className="dialog-span">
                课程类型 *
                <select value={lessonType} onChange={(event) => setLessonType(event.target.value as PeLessonType)}>
                  {PE_LESSON_TYPES.map((item) => (
                    <option key={item} value={item}>
                      {PE_LESSON_TYPE_LABELS[item]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="dialog-span">
                主题
                <input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="可选" />
              </label>
            </div>
            {duplicateHint ? (
              <p className="dialog-error">
                该班级该日该节已有课堂记录。
                <button
                  type="button"
                  className="btn btn-small"
                  onClick={() => {
                    setCreateOpen(false)
                    setEditing(duplicateHint)
                  }}
                >
                  打开已有记录
                </button>
              </p>
            ) : null}
            <div className="dialog-actions">
              <span />
              <div className="dialog-actions-right">
                <button type="button" className="btn" onClick={() => setCreateOpen(false)} disabled={working}>
                  取消
                </button>
                <button type="button" className="btn btn-primary" onClick={() => void handleManualCreate()} disabled={working}>
                  创建并进入
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {prefillOpen && prefill ? (
        <div className="dialog-backdrop" onMouseDown={() => { setPrefillOpen(false); onPrefillConsumed() }}>
          <div
            className="dialog dialog--class"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pe-prefill-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h3 id="pe-prefill-title">开始记录本节课</h3>
            <p className="dialog-slot">
              课表团队尚未绑定班级，请选择本节课对应班级。已自动带入 {prefill.date} 第{prefill.period}节
              {prefill.teamSnapshot ? `（${prefill.teamSnapshot}）` : ''}。
            </p>
            {listedClasses.length === 0 ? (
              <p className="dialog-error">请先在班级管理中创建班级</p>
            ) : (
              <div className="dialog-grid">
                <label className="dialog-span">
                  对应班级 *
                  <select value={prefillClassId} onChange={(event) => setPrefillClassId(event.target.value)}>
                    {listedClasses.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.grade} {item.className}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            <div className="dialog-actions">
              <span />
              <div className="dialog-actions-right">
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setPrefillOpen(false)
                    onPrefillConsumed()
                  }}
                  disabled={working}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void handlePrefillCreate()}
                  disabled={working || listedClasses.length === 0}
                >
                  进入课堂
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
            aria-labelledby="pe-delete-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h3 id="pe-delete-title">确定删除这节课堂记录吗？</h3>
            <p className="dialog-slot">
              {pendingDelete.date} 第{pendingDelete.period}节 {pendingDelete.gradeSnapshot}{' '}
              {pendingDelete.classNameSnapshot} 的学生考勤将一并删除。
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
    </PageLayout>
  )
}
