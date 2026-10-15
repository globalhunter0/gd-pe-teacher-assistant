import { useEffect, useMemo, useState } from 'react'
import { collectClassDeleteImpact, formatClassDeleteConfirm, listedClassRecords, type ClassRecord } from '@shared/class'
import { STUDENT_GENDER_LABELS, STUDENT_STATUS_LABELS, type StudentRecord } from '@shared/student'
import ClassEditorDialog from '../components/ClassEditorDialog'
import PageLayout, { PageHeader } from '../components/PageLayout'
import ExcelImportDialog from '../components/ExcelImportDialog'
import StudentEditorDialog from '../components/StudentEditorDialog'
import StudentPeTestHistoryPanel from '../components/StudentPeTestHistoryPanel'
import DataTable from '../components/ds/DataTable'
import SearchInput from '../components/ds/SearchInput'
import TechEmptyState from '../components/workspace/TechEmptyState'
import StatusBadge from '../components/StatusBadge'
import { useClasses } from '../context/ClassContext'
import { usePeSessions } from '../context/PeSessionContext'
import { usePeTests } from '../context/PeTestContext'
import { useSchedule } from '../context/ScheduleContext'
import { useStudents } from '../context/StudentContext'
import { useTestItems } from '../context/TestItemContext'
import { countActiveStudents, filterStudents } from '../data/student/query'

export default function ClassStudentsPage({
  initialClassId = null,
  onInitialClassConsumed,
  onOpenGrowth,
  hideExcelImport = false
}: {
  initialClassId?: string | null
  onInitialClassConsumed?: () => void
  onOpenGrowth?: (studentId: string) => void
  /** Free web companion: Excel roster import stays on Windows. */
  hideExcelImport?: boolean
}): React.JSX.Element {
  const { classes, loading: classesLoading, error: classesError, upsertClass, deleteClass, applyLoadedClasses } =
    useClasses()
  const { students, loading, error, upsertStudent, deleteStudent, applyImportedStudents } = useStudents()
  const { sessions } = usePeSessions()
  const { sessions: testSessions } = usePeTests()
  const { items: testItems } = useTestItems()
  const { items: scheduleItems } = useSchedule()
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [detailStudentId, setDetailStudentId] = useState<string | null>(null)
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

  const detailStudent = detailStudentId ? students.find((item) => item.id === detailStudentId) ?? null : null

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
      <PageLayout>
        <PageHeader icon="students" title="班级与学生" description="正在读取本地数据…" />
      </PageLayout>
    )
  }

  if (detailStudent) {
    return (
      <PageLayout className="page--students page-shell">
        <PageHeader
          icon="students"
          title="学生详情"
          description={`${detailStudent.name} · ${STUDENT_GENDER_LABELS[detailStudent.gender]} · ${STUDENT_STATUS_LABELS[detailStudent.status]}`}
          actions={
            <>
              {onOpenGrowth ? (
                <button type="button" className="btn" onClick={() => onOpenGrowth(detailStudent.id)}>
                  完整成长分析
                </button>
              ) : null}
              <button type="button" className="btn" onClick={() => setStudentEditor(detailStudent)}>
                编辑学生
              </button>
              <button type="button" className="btn" onClick={() => setDetailStudentId(null)}>
                返回名单
              </button>
            </>
          }
        />
        <dl className="pe-detail-meta">
          <div>
            <dt>姓名</dt>
            <dd>{detailStudent.name}</dd>
          </div>
          <div>
            <dt>学号</dt>
            <dd>{detailStudent.studentNo || '—'}</dd>
          </div>
          <div>
            <dt>性别</dt>
            <dd>{STUDENT_GENDER_LABELS[detailStudent.gender]}</dd>
          </div>
          <div>
            <dt>当前状态</dt>
            <dd>{STUDENT_STATUS_LABELS[detailStudent.status]}</dd>
          </div>
          <div>
            <dt>备注</dt>
            <dd>{detailStudent.notes || '—'}</dd>
          </div>
        </dl>
        <StudentPeTestHistoryPanel
          student={detailStudent}
          sessions={testSessions}
          students={students}
          classes={classes}
          testItems={testItems}
        />
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
      </PageLayout>
    )
  }

  return (
    <PageLayout className="page--students page-shell">
      <PageHeader
        icon="students"
        title="班级与学生"
        description={
          hideExcelImport
            ? '管理行政班与学生名单。Excel 批量导入请在 Windows 桌面版完成后再同步到手机。'
            : '管理行政班、学生名单与 Excel 同步。当前名单人数按在读学生实时计算，不改手工学生人数。'
        }
        actions={
          <>
            {hideExcelImport ? null : (
              <button type="button" className="btn btn-primary" onClick={() => setImportOpen(true)}>
                导入学生名单
              </button>
            )}
            <button type="button" className="btn" onClick={() => setClassEditor(null)}>
              新建班级
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setStudentEditor(null)}
              disabled={listedClasses.length === 0}
            >
              新增学生
            </button>
          </>
        }
      />

      {classesError ? <p className="page-error">{classesError}</p> : null}
      {error ? <p className="page-error">{error}</p> : null}
      {actionError ? <p className="page-error">{actionError}</p> : null}

      <div className="training-layout">
        <aside className="training-list">
          <p className="ds-section-label">班级</p>
          {listedClasses.length === 0 ? (
            <p className="exam-notes">
              {hideExcelImport
                ? '还没有班级。可手工新建，或从电脑导入手机同步包。'
                : '还没有班级。可手工新建，或从 Excel 导入自动建班。'}
            </p>
          ) : null}
          {listedClasses.map((item) => (
            <button
              key={item.id}
              type="button"
              className={selectedClassId === item.id ? 'ds-list-item is-active' : 'ds-list-item'}
              onClick={() => setSelectedClassId(item.id)}
            >
              <span className="ds-list-item-title">
                {item.grade} {item.className}
              </span>
              <span className="ds-list-item-meta">当前 {countActiveStudents(students, item.id)} 人</span>
            </button>
          ))}
        </aside>

        <div className="training-main">
          {!selected ? (
            <TechEmptyState
              kind="students"
              title="选择或新建一个班级"
              description="也可以直接导入 Excel 名单，系统会准备创建尚不存在的班级。"
            />
          ) : (
            <>
              <div className="class-summary-bar">
                <div className="class-summary-main">
                  <h3>
                    {selected.grade} {selected.className}
                  </h3>
                  <p>
                    <span>当前名单 {rosterCount} 人</span>
                    <span>手工学生人数 {selected.studentCount}</span>
                    <span>
                      {selected.academicYear} {selected.semester}
                    </span>
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
                <SearchInput value={query} onChange={setQuery} placeholder="按姓名或学号搜索" />
                <label className="toolbar-field ds-check">
                  <input
                    type="checkbox"
                    checked={showLeftRoster}
                    onChange={(event) => setShowLeftRoster(event.target.checked)}
                  />
                  显示不在当前名单
                </label>
              </div>
              {visible.length === 0 ? (
                <TechEmptyState kind="students" title="当前名单为空" description="可新增学生，或导入 Excel 更新名单。" />
              ) : (
                <DataTable className="workspace-card">
                  <table className="data-table data-table--students">
                    <thead>
                      <tr>
                        <th>姓名</th>
                        <th>学号</th>
                        <th>性别</th>
                        <th>当前状态</th>
                        <th>备注</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((item) => (
                        <tr key={item.id}>
                          <td className="col-name">{item.name}</td>
                          <td>{item.studentNo || '—'}</td>
                          <td>{STUDENT_GENDER_LABELS[item.gender]}</td>
                          <td>
                            <StatusBadge tone={item.status === 'active' ? 'ok' : item.status === 'transferred' ? 'warn' : 'muted'}>
                              {STUDENT_STATUS_LABELS[item.status]}
                            </StatusBadge>
                          </td>
                          <td className="data-table-notes">{item.notes || '—'}</td>
                          <td>
                            <div className="table-actions">
                              <button type="button" className="btn btn-small btn-primary" onClick={() => setDetailStudentId(item.id)}>
                                测试成绩
                              </button>
                              {onOpenGrowth ? (
                                <button type="button" className="btn btn-small" onClick={() => onOpenGrowth(item.id)}>
                                  体育成长
                                </button>
                              ) : null}
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
                </DataTable>
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

      {importOpen && !hideExcelImport ? (
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
    </PageLayout>
  )
}
