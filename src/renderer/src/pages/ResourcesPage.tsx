import { useMemo, useState } from 'react'
import {
  filterResources,
  PRESET_RESOURCE_CATEGORIES,
  RESOURCE_TYPES,
  RESOURCE_TYPE_LABELS,
  type ResourceItem,
  type ResourceType
} from '@shared/resource'
import ResourceEditorDialog from '../components/ResourceEditorDialog'
import { useResources } from '../context/ResourceContext'

function formatUpdatedAt(value: string): string {
  if (value.length < 16) {
    return value
  }
  return `${value.slice(0, 10)} ${value.slice(11, 16)}`
}

export default function ResourcesPage(): React.JSX.Element {
  const { resources, loading, error, deleteResource, openResource } = useResources()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<ResourceItem | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ResourceItem | null>(null)
  const [working, setWorking] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const categoryOptions = useMemo(() => {
    const extra = resources
      .map((item) => item.category)
      .filter((item) => !(PRESET_RESOURCE_CATEGORIES as readonly string[]).includes(item))
    return Array.from(new Set(extra)).sort((a, b) => a.localeCompare(b, 'zh-CN'))
  }, [resources])

  const visible = useMemo(
    () => filterResources(resources, { query, category, type: typeFilter }),
    [resources, query, category, typeFilter]
  )

  function openCreate(): void {
    setActionError(null)
    setEditing(null)
    setEditorOpen(true)
  }

  function openEdit(record: ResourceItem): void {
    setActionError(null)
    setEditing(record)
    setEditorOpen(true)
  }

  async function handleOpen(record: ResourceItem): Promise<void> {
    setActionError(null)
    try {
      await openResource(record.id)
    } catch (openError) {
      setActionError(openError instanceof Error ? openError.message : '打开失败')
    }
  }

  async function handleConfirmDelete(): Promise<void> {
    if (!pendingDelete) {
      return
    }

    setWorking(true)
    setActionError(null)
    try {
      const warning = await deleteResource(pendingDelete.id)
      setPendingDelete(null)
      if (warning) {
        setActionError(warning)
      }
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
          <h2>资料中心</h2>
          <p>正在读取本地资料…</p>
        </div>
      </section>
    )
  }

  return (
    <section className="page page--resources">
      <div className="page-heading page-heading--split">
        <div className="page-heading-text">
          <h2>资料中心</h2>
          <p>本地教学资料库：文件会复制到应用目录，链接和笔记只保存文字信息。</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            + 新增资料
          </button>
        </div>
      </div>

      <div className="toolbar">
        <label className="toolbar-field toolbar-field-grow">
          搜索
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="标题、分类、标签、描述、备注或笔记正文" />
        </label>
        <label className="toolbar-field">
          分类
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">全部分类</option>
            {PRESET_RESOURCE_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
            {categoryOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="toolbar-field">
          类型
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="all">全部类型</option>
            {RESOURCE_TYPES.map((item: ResourceType) => (
              <option key={item} value={item}>
                {RESOURCE_TYPE_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <p className="page-error">{error}</p> : null}
      {actionError ? <p className="page-error">{actionError}</p> : null}

      {resources.length === 0 ? (
        <div className="empty-panel">
          <p className="empty-title">还没有资料</p>
          <p className="empty-text">可以导入本地文件、保存网页链接，或写一条文字笔记。</p>
          <button type="button" className="btn btn-primary empty-action" onClick={openCreate}>
            新增资料
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="empty-panel">
          <p className="empty-title">没有符合条件的资料</p>
          <p className="empty-text">试试清空搜索，或更换分类、类型筛选。</p>
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>标题</th>
                <th>类型</th>
                <th>分类</th>
                <th>标签</th>
                <th>更新时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{RESOURCE_TYPE_LABELS[item.type]}</td>
                  <td>{item.category}</td>
                  <td>{item.tags.length > 0 ? item.tags.join('，') : '—'}</td>
                  <td>{formatUpdatedAt(item.updatedAt)}</td>
                  <td>
                    <div className="table-actions">
                      {item.type === 'note' ? (
                        <button type="button" className="btn btn-small" onClick={() => openEdit(item)}>
                          查看/编辑
                        </button>
                      ) : (
                        <>
                          <button type="button" className="btn btn-small" onClick={() => void handleOpen(item)}>
                            {item.type === 'link' ? '打开链接' : '打开'}
                          </button>
                          <button type="button" className="btn btn-small" onClick={() => openEdit(item)}>
                            编辑
                          </button>
                        </>
                      )}
                      <button type="button" className="btn btn-small btn-danger" onClick={() => setPendingDelete(item)}>
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
        <ResourceEditorDialog
          record={editing}
          onClose={() => {
            setEditorOpen(false)
            setEditing(null)
          }}
          onSaved={() => {
            setEditorOpen(false)
            setEditing(null)
          }}
        />
      ) : null}

      {pendingDelete ? (
        <div className="dialog-backdrop" onMouseDown={() => setPendingDelete(null)}>
          <div className="dialog dialog--resource" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <h3>删除资料？</h3>
            <p className="dialog-slot">
              将删除「{pendingDelete.title}」。
              {pendingDelete.type === 'file'
                ? '只会删除应用内保存的副本，不会删除你电脑上的原文件。'
                : '此操作无法从软件内恢复。'}
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
    </section>
  )
}
