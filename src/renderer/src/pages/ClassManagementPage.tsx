import { useState } from 'react'
import { getClassDeleteBlockers, type ClassRecord } from '@shared/class'
import ClassEditorDialog from '../components/ClassEditorDialog'
import { useClasses } from '../context/ClassContext'

export default function ClassManagementPage(): React.JSX.Element {
  const { classes, loading, error, upsertClass, deleteClass } = useClasses()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<ClassRecord | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ClassRecord | null>(null)
  const [blockedDelete, setBlockedDelete] = useState<{ className: string; message: string } | null>(null)
  const [working, setWorking] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  function openCreate(): void {
    setEditing(null)
    setEditorOpen(true)
  }

  function openEdit(record: ClassRecord): void {
    setEditing(record)
    setEditorOpen(true)
  }

  async function handleSave(record: ClassRecord): Promise<void> {
    await upsertClass(record)
    setEditorOpen(false)
    setEditing(null)
  }

  async function requestDelete(record: ClassRecord): Promise<void> {
    setActionError(null)
    try {
      const students = await window.electronAPI.students.get()
      const sessions = await window.electronAPI.peSessions.get()
      const tests = await window.electronAPI.peTests.get()
      const blockers = getClassDeleteBlockers(record.id, students, sessions, tests)
      if (blockers.length > 0) {
        setBlockedDelete({ className: record.className, message: blockers.join('；') })
        return
      }

      setPendingDelete(record)
    } catch (loadError) {
      setActionError(loadError instanceof Error ? loadError.message : '无法检查班级是否仍可删除')
    }
  }

  async function handleConfirmDelete(): Promise<void> {
    if (!pendingDelete) {
      return
    }

    setWorking(true)
    setActionError(null)
    try {
      await deleteClass(pendingDelete.id)
      setPendingDelete(null)
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : '删除失败')
    } finally {
      setWorking(false)
    }
  }

  if (loading) {
    return (
      <section className="page">
        <div className="page-heading">
          <h2>班级管理</h2>
          <p>正在读取本地班级数据…</p>
        </div>
      </section>
    )
  }

  return (
    <section className="page page--classes">
      <div className="page-heading page-heading--split">
        <div className="page-heading-text">
          <h2>班级管理</h2>
          <p>管理任教班级，为学生、课程、体测和教学记录建立统一基础数据。</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            + 新建班级
          </button>
        </div>
      </div>

      {error ? <p className="page-error">{error}</p> : null}
      {actionError ? <p className="page-error">{actionError}</p> : null}

      {classes.length === 0 ? (
        <div className="empty-panel">
          <p className="empty-title">还没有班级</p>
          <p className="empty-text">创建你的第一个任教班级，之后可以继续添加学生和教学数据。</p>
          <button type="button" className="btn btn-primary empty-action" onClick={openCreate}>
            新建班级
          </button>
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>班级名称</th>
                <th>年级</th>
                <th>学年</th>
                <th>学期</th>
                <th>学生人数</th>
                <th>备注</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((item) => (
                <tr key={item.id}>
                  <td>{item.className}</td>
                  <td>{item.grade}</td>
                  <td>{item.academicYear}</td>
                  <td>{item.semester}</td>
                  <td>{item.studentCount}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editorOpen ? (
        <ClassEditorDialog
          record={editing}
          onClose={() => {
            setEditorOpen(false)
            setEditing(null)
          }}
          onSave={handleSave}
        />
      ) : null}

      {blockedDelete ? (
        <div className="dialog-backdrop" onMouseDown={() => setBlockedDelete(null)}>
          <div
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="class-delete-blocked-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h3 id="class-delete-blocked-title">无法删除“{blockedDelete.className}”</h3>
            <p className="dialog-slot">{blockedDelete.message}</p>
            <div className="dialog-actions">
              <span />
              <div className="dialog-actions-right">
                <button type="button" className="btn btn-primary" onClick={() => setBlockedDelete(null)}>
                  知道了
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
            aria-labelledby="class-delete-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h3 id="class-delete-title">确定删除“{pendingDelete.className}”吗？</h3>
            <p className="dialog-slot">删除后该班级将从班级管理中移除。</p>
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
