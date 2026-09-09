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
import PageLayout, { PageHeader } from '../components/PageLayout'
import TechEmptyState from '../components/workspace/TechEmptyState'
import StatusBadge from '../components/StatusBadge'
import { useResources } from '../context/ResourceContext'

function formatUpdatedAt(value: string): string {
  if (value.length < 16) {
    return value
  }
  return `${value.slice(0, 10)} ${value.slice(11, 16)}`
}

function typeTone(type: ResourceType): 'info' | 'ok' | 'warn' {
  if (type === 'file') {
    return 'info'
  }
  if (type === 'link') {
    return 'ok'
  }
  return 'warn'
}

function TypeMark({ type }: { type: ResourceType }): React.JSX.Element {
  if (type === 'file') {
    return (
      <svg className="resource-type-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M7 3h7l5 5v13H7z" />
        <path d="M14 3v5h5" />
      </svg>
    )
  }
  if (type === 'link') {
    return (
      <svg className="resource-type-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M10 13a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 0 0-7.07-7.07L10 5.93" />
        <path d="M14 11a5 5 0 0 0-7.07 0L5.52 12.4a5 5 0 0 0 7.07 7.07L14 18.07" />
      </svg>
    )
  }
  return (
    <svg className="resource-type-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M6 5h12v14H6z" />
      <path d="M9 9h6M9 13h6" />
    </svg>
  )
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
      <PageLayout>
        <PageHeader icon="resources" title="资料中心" description="正在读取本地资料…" />
      </PageLayout>
    )
  }

  return (
    <PageLayout className="page--resources">
      <PageHeader
        icon="resources"
        title="资料中心"
        description="本地教学资料库：文件会复制到应用目录，链接和笔记只保存文字信息。"
        actions={
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            + 新增资料
          </button>
        }
      />

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
        <TechEmptyState
          kind="resources"
          title="还没有资料"
          description="可以导入本地文件、保存网页链接，或写一条文字笔记。"
          actionLabel="新增资料"
          onAction={openCreate}
        />
      ) : visible.length === 0 ? (
        <TechEmptyState kind="resources" title="没有符合条件的资料" description="试试清空搜索，或更换分类、类型筛选。" />
      ) : (
        <div className="resource-grid">
          {visible.map((item) => (
            <article key={item.id} className="resource-card">
              <div className="resource-card-top">
                <TypeMark type={item.type} />
                <StatusBadge tone={typeTone(item.type)}>{RESOURCE_TYPE_LABELS[item.type]}</StatusBadge>
              </div>
              <strong>{item.title}</strong>
              <p className="resource-card-meta">
                {item.category} · {formatUpdatedAt(item.updatedAt)}
              </p>
              <p className="resource-card-meta">{item.tags.length > 0 ? item.tags.join('，') : '无标签'}</p>
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
            </article>
          ))}
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
    </PageLayout>
  )
}
