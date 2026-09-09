import { useEffect, useMemo, useState } from 'react'
import { collectClassDeleteImpact, formatClassDeleteConfirm, listedClassRecords, type ClassRecord } from '@shared/class'
import { STUDENT_GENDER_LABELS, STUDENT_STATUS_LABELS, type StudentRecord } from '@shared/student'
import ClassEditorDialog from '../components/ClassEditorDialog'
import ExcelImportDialog from '../components/ExcelImportDialog'
import StudentEditorDialog from '../components/StudentEditorDialog'
import { useClasses } from '../context/ClassContext'
import { usePeSessions } from '../context/PeSessionContext'
import { usePeTests } from '../context/PeTestContext'
import { useSchedule } from '../context/ScheduleContext'
import { useStudents } from '../context/StudentContext'
import { countActiveStudents, filterStudents } from '../data/student/query'

export default function ClassStudentsPage({
  initialClassId = null,
  onInitialClassConsumed
}: {
  initialClassId?: string | null
  onInitialClassConsumed?: () => void
}): React.JSX.Element {
  const { classes, loading: classesLoading, error: classesError, upsertClass, deleteClass, applyLoadedClasses } =
    useClasses()
  const { students, loading, error, upsertStudent, deleteStudent, applyImportedStudents } = useStudents()
  const { sessions } = usePeSessions()
  const { sessions: testSessions } = usePeTests()
  const { items: scheduleItems } = useSchedule()
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [showLeftRoster, setShowLeftRoster] = useState(false)
  const [classEditor, setClassEditor] = useState<ClassRecord | null | undefined>(undefined)
  const [studentEditor, setStudentEditor] = useState<StudentRecord | null | undefined>(undefined)
  const [importOpen, setImportOpen] = useState(false)
  const [pendingDeleteClass, setPendingDeleteClass] = useState<ClassRecord | null>(null)
  const [pendingDeleteStudent, setPendingDeleteStudent] = useState<StudentRecord | null>(null)
  const [working, setWorking] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const listedClasses = listedClassRecords(classes)

  useEffect(() => {
    if (initialClassId) {
      setSelectedClassId(initialClassId)
      onInitialClassConsumed?.()
    }
  }, [initialClassId, onInitialClassConsumed])

  useEffect(() => {
    if (selectedClassId && listedClasses.some((item) => item.id === selectedClassId)) {
      return
    }
    setSelectedClassId(listedClasses[0]?.id ?? null)
  }, [listedClasses, selectedClassId])

  const selected = listedClasses.find((item) => item.id === selectedClassId) ?? null
  const rosterCount = selected ? countActiveStudents(students, selected.id) : 0
  const visible = useMemo(() => {
    if (!selected) {
      return []
    }
    return filterStudents(students, { classId: selected.id, query }).filter(
      (item) => item.status !== 'deleted' && (showLeftRoster || item.status === 'active')
    )
  }, [students, selected, query, showLeftRoster])

  function requestDeleteClass(record: ClassRecord): void {
    setActionError(null)
    setPendingDeleteClass(record)
  }

  function requestDeleteStudent(record: StudentRecord): void {
    setActionError(null)
    setPendingDeleteStudent(record)
  }

  async function markNotOnRoster(record: StudentRecord): Promise<void> {
    await upsertStudent({ ...record, status: 'transferred', updatedAt: new Date().toISOString() })
  }

  if (loading || classesLoading) {
    return (
      <section className="page">
        <div className="page-heading">
          <h2>班级与学生</h2>
          <p>正在读取本地数据…</p>
        </div>
      </section>
    )
  }

  return (
    <section className="page page--students">
      <div className="page-heading page-heading--split">
        <div className="page-heading-text">
          <h2>班级与学生</h2>
          <p>行政班与学生档案仍分开保存。当前名单人数按在读学生实时计算，不改手工学生人数。</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn" onClick={() => setImportOpen(true)}>
            导入/更新班级名单
          </button>
          <button type="button" className="btn" onClick={() => setClassEditor(null)}>
            新建班级
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setStudentEditor(null)}
            disabled={listedClasses.length === 0}
          >
            新增学生
          </button>
        </div>
      </div>

      {classesError ? <p className="page-error">{classesError}</p> : null}
      {error ? <p className="page-error">{error}</p> : null}
      {actionError ? <p className="page-error">{actionError}</p> : null}

      <div className="training-layout">
        <aside className="training-list">
          {listedClasses.length === 0 ? <p className="exam-notes">还没有班级。可手工新建，或从 Excel 导入自动建班。</p> : null}
          {listedClasses.map((item) => (
            <button
              key={item.id}
              type="button"
              className={selectedClassId === item.id ? 'nav-item is-active' : 'nav-item'}
              onClick={() => setSelectedClassId(item.id)}
            >
              {item.grade} {item.className}
              <span className="text-muted"> · 当前 {countActiveStudents(students, item.id)} 人</span>
            </button>
          ))}
        </aside>

        <div className="training-main">
          {!selected ? (
            <div className="empty-panel">
              <p className="empty-title">选择或新建一个班级</p>
              <p>也可以直接导入 Excel 名单，系统会准备创建尚不存在的班级。</p>
            </div>
          ) : (
            <>
              <div className="page-heading page-heading--split">
                <div className="page-heading-text">
                  <h3>
                    {selected.grade} {selected.className}
                  </h3>
                  <p>
                    {selected.academicYear} {selected.semester} · 当前名单 {rosterCount} 人 · 手工学生人数{' '}
                    {selected.studentCount}
                  </p>
                </div>
                <div className="page-actions">
                  <button type="button" className="btn" onClick={() => setClassEditor(selected)}>
                    编辑班级
                  </button>
                  <button type="button" className="btn btn-danger" onClick={() => void requestDeleteClass(selected)}>
                    删除班级
                  </button>
                </div>
              </div>
              <div className="toolbar">
                <label className="toolbar-field toolbar-field-grow">
                  搜索
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="按姓名或学号搜索" />
                </label>
                <label className="toolbar-field">
                  <input
                    type="checkbox"
                    checked={showLeftRoster}
                    onChange={(event) => setShowLeftRoster(event.target.checked)}
                  />
                  显示不在当前名单
                </label>
              </div>
              {visible.length === 0 ? (
                <div className="empty-panel">
                  <p className="empty-title">当前名单为空</p>
                  <p>可新增学生，或导入 Excel 更新名单。</p>
                </div>
              ) : (
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>学号</th>
                        <th>姓名</th>
                        <th>性别</th>
                        <th>状态</th>
                        <th>备注</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((item) => (
                        <tr key={item.id}>
                          <td>{item.studentNo || '—'}</td>
                          <td>{item.name}</td>
                          <td>{STUDENT_GENDER_LABELS[item.gender]}</td>
                          <td>{STUDENT_STATUS_LABELS[item.status]}</td>
                          <td className="data-table-notes">{item.notes || '—'}</td>
                          <td>
                            <div className="table-actions">
                              <button type="button" className="btn btn-small" onClick={() => setStudentEditor(item)}>
                                编辑
                              </button>
                              {item.status === 'active' ? (
                                <button type="button" className="btn btn-small" onClick={() => void markNotOnRoster(item)}>
                                  移出当前名单
                                </button>
                              ) : null}
                              <button
                                type="button"
                                className="btn btn-small btn-danger"
                                onClick={() => requestDeleteStudent(item)}
                              >
                                删除
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {classEditor !== undefined ? (
        <ClassEditorDialog
          record={classEditor}
          onClose={() => setClassEditor(undefined)}
          onSave={async (record) => {
            await upsertClass(record)
            setSelectedClassId(record.id)
            setClassEditor(undefined)
          }}
        />
      ) : null}

      {studentEditor !== undefined ? (
        <StudentEditorDialog
          record={studentEditor}
          classes={classes}
          defaultClassId={selectedClassId ?? undefined}
          onClose={() => setStudentEditor(undefined)}
          onSave={async (record) => {
            await upsertStudent(record)
            setStudentEditor(undefined)
          }}
        />
      ) : null}

      {importOpen ? (
        <ExcelImportDialog
          classes={classes}
          onClose={() => setImportOpen(false)}
          onImported={(imported) => {
            applyImportedStudents(imported.students)
            if (imported.classes) {
              applyLoadedClasses(imported.classes)
            }
          }}
        />
      ) : null}

      {pendingDeleteClass ? (
        <div className="dialog-backdrop" onMouseDown={() => setPendingDeleteClass(null)}>
          <div className="dialog" role="dialog" onMouseDown={(event) => event.stopPropagation()}>
            <h3>确定删除“{pendingDeleteClass.className}”吗？</h3>
            <p className="dialog-slot" style={{ whiteSpace: 'pre-wrap' }}>
              {(() => {
                const impact = collectClassDeleteImpact(
                  pendingDeleteClass.id,
                  students,
                  sessions,
                  testSessions,
                  scheduleItems
                )
                return formatClassDeleteConfirm(impact)
              })()}
            </p>
            <div className="dialog-actions">
              <span />
              <div className="dialog-actions-right">
                <button type="button" className="btn" onClick={() => setPendingDeleteClass(null)} disabled={working}>
                  取消
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    void (async () => {
                      setWorking(true)
                      try {
                        await deleteClass(pendingDeleteClass.id)
                        setPendingDeleteClass(null)
                        setSelectedClassId(null)
                      } catch (deleteError) {
                        setActionError(deleteError instanceof Error ? deleteError.message : '删除失败')
                      } finally {
                        setWorking(false)
                      }
                    })()
                  }}
                  disabled={working}
                >
                  确认删除
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {pendingDeleteStudent ? (
        <div className="dialog-backdrop" onMouseDown={() => setPendingDeleteStudent(null)}>
          <div className="dialog" role="dialog" onMouseDown={(event) => event.stopPropagation()}>
            <h3>确定删除“{pendingDeleteStudent.name}”吗？</h3>
            <p className="dialog-slot">
              删除后该学生会从班级名单中消失。已有课堂记录、体育测试和训练历史会保留。若该生仍是训练队现役队员，将自动退出当前队籍。这与「移出当前名单」不同。
            </p>
            <div className="dialog-actions">
              <span />
              <div className="dialog-actions-right">
                <button type="button" className="btn" onClick={() => setPendingDeleteStudent(null)} disabled={working}>
                  取消
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    void (async () => {
                      setWorking(true)
                      try {
                        await deleteStudent(pendingDeleteStudent.id)
                        setPendingDeleteStudent(null)
                      } catch (deleteError) {
                        setActionError(deleteError instanceof Error ? deleteError.message : '删除失败')
                      } finally {
                        setWorking(false)
                      }
                    })()
                  }}
                  disabled={working}
                >
                  确认删除
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
