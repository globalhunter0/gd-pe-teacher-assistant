import { useEffect, useMemo, useState } from 'react'
import ExcelImportDialog from '../components/ExcelImportDialog'
import StudentEditorDialog from '../components/StudentEditorDialog'
import { listedClassRecords, type ClassRecord } from '@shared/class'
import { useClasses } from '../context/ClassContext'
import { useStudents } from '../context/StudentContext'
import { countActiveStudents, filterStudents } from '../data/student/query'
import { STUDENT_GENDER_LABELS, STUDENT_STATUS_LABELS, type StudentRecord } from '@shared/student'

function classLabel(classes: ClassRecord[], classId: string): { grade: string; className: string } {
  const match = classes.find((item) => item.id === classId)
  if (!match) {
    return { grade: '—', className: '未知班级' }
  }

  return {
    grade: match.grade,
    className: match.status === 'deleted' ? `${match.className}（已删除）` : match.className
  }
}

export default function StudentManagementPage({
  initialClassId = null,
  onInitialClassConsumed
}: {
  initialClassId?: string | null
  onInitialClassConsumed?: () => void
}): React.JSX.Element {
  const { classes, loading: classesLoading } = useClasses()
  const { students, loading, error, upsertStudent, deleteStudent, applyImportedStudents } = useStudents()
  const [classFilter, setClassFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<StudentRecord | null>(null)
  const [pendingDelete, setPendingDelete] = useState<StudentRecord | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [working, setWorking] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (!initialClassId) {
      return
    }
    setClassFilter(initialClassId)
    onInitialClassConsumed?.()
  }, [initialClassId, onInitialClassConsumed])

  const activeCount = countActiveStudents(students)
  const visible = useMemo(
    () => filterStudents(students, { classId: classFilter, query }),
    [students, classFilter, query]
  )

  function openImport(): void {
    if (classes.length === 0) {
      setActionError('请先在班级管理中创建班级')
      return
    }

    setActionError(null)
    setImportOpen(true)
  }

  function openCreate(): void {
    if (classes.length === 0) {
      setActionError('请先在班级管理中创建班级')
      return
    }

    setActionError(null)
    setEditing(null)
    setEditorOpen(true)
  }

  function openEdit(record: StudentRecord): void {
    setActionError(null)
    setEditing(record)
    setEditorOpen(true)
  }

  async function handleSave(record: StudentRecord): Promise<void> {
    await upsertStudent(record)
    setEditorOpen(false)
    setEditing(null)
  }

  function requestDelete(record: StudentRecord): void {
    setActionError(null)
    setPendingDelete(record)
  }

  async function handleConfirmDelete(): Promise<void> {
    if (!pendingDelete) {
      return
    }

    setWorking(true)
    setActionError(null)
    try {
      await deleteStudent(pendingDelete.id)
      setPendingDelete(null)
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : '删除失败')
    } finally {
      setWorking(false)
    }
  }

  if (loading || classesLoading) {
    return (
      <section className="page">
        <div className="page-heading">
          <h2>学生管理</h2>
          <p>正在读取本地学生数据…</p>
        </div>
      </section>
    )
  }

  return (
    <section className="page page--students">
      <div className="page-heading page-heading--split">
        <div className="page-heading-text">
          <h2>学生管理</h2>
          <p>管理学生基础档案。已录入（在读）{activeCount} 人，全部记录 {students.length} 条。</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn" onClick={openImport}>
            Excel 导入
          </button>
          <button type="button" className="btn btn-primary" onClick={openCreate} disabled={classes.length === 0}>
            + 新增学生
          </button>
        </div>
      </div>

      {error ? <p className="page-error">{error}</p> : null}
      {actionError ? <p className="page-error">{actionError}</p> : null}

      {classes.length > 0 ? (
        <div className="toolbar">
          <label className="toolbar-field">
            班级
            <select value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
              <option value="all">全部班级</option>
              {listedClassRecords(classes).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.grade} {item.className}
                </option>
              ))}
            </select>
          </label>
          <label className="toolbar-field toolbar-field-grow">
            搜索
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="按姓名或学号搜索"
            />
          </label>
        </div>
      ) : null}

      {students.length === 0 ? (
        <div className="empty-panel">
          {classes.length === 0 ? (
            <>
              <p className="empty-title">请先建立班级</p>
              <p className="empty-text">学生必须从属于一个班级。请先到「班级管理」创建班级，然后再新增学生。</p>
            </>
          ) : (
            <>
              <p className="empty-title">还没有学生</p>
              <p className="empty-text">还没有学生，点击“新增学生”开始建立学生档案。</p>
              <button type="button" className="btn btn-primary empty-action" onClick={openCreate}>
                新增学生
              </button>
            </>
          )}
        </div>
      ) : visible.length === 0 ? (
        <div className="empty-panel">
          <p className="empty-title">没有符合条件的学生</p>
          <p className="empty-text">请调整班级筛选或搜索关键词。</p>
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>学号</th>
                <th>姓名</th>
                <th>性别</th>
                <th>年级</th>
                <th>班级</th>
                <th>状态</th>
                <th>备注</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => {
                const cls = classLabel(classes, item.classId)
                return (
                  <tr key={item.id}>
                    <td>{item.studentNo || '—'}</td>
                    <td>{item.name}</td>
                    <td>{STUDENT_GENDER_LABELS[item.gender]}</td>
                    <td>{cls.grade}</td>
                    <td>{cls.className}</td>
                    <td>{STUDENT_STATUS_LABELS[item.status]}</td>
                    <td className="data-table-notes">{item.notes || '—'}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="btn btn-small" onClick={() => openEdit(item)}>
                          编辑
                        </button>
                        <button
                          type="button"
                          className="btn btn-small btn-danger"
                          onClick={() => void requestDelete(item)}
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {editorOpen ? (
        <StudentEditorDialog
          record={editing}
          classes={classes}
          onClose={() => {
            setEditorOpen(false)
            setEditing(null)
          }}
          onSave={handleSave}
        />
      ) : null}

      {importOpen ? (
        <ExcelImportDialog
          classes={classes}
          onClose={() => setImportOpen(false)}
          onImported={(imported) => applyImportedStudents(imported.students)}
        />
      ) : null}

      {pendingDelete ? (
        <div className="dialog-backdrop" onMouseDown={() => setPendingDelete(null)}>
          <div
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-delete-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h3 id="student-delete-title">确定删除“{pendingDelete.name}”吗？</h3>
            <p className="dialog-slot">
              删除后该学生会从名单中消失。已有课堂记录、体育测试和训练历史会保留。这与「移出当前名单」不同。
            </p>
            <div className="dialog-actions">
              <span />
              <div className="dialog-actions-right">
                <button type="button" className="btn" onClick={() => setPendingDelete(null)} disabled={working}>
                  取消
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => void handleConfirmDelete()}
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
