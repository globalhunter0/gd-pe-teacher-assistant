import { useEffect, useId, useState } from 'react'
import {
  PRESET_RESOURCE_CATEGORIES,
  RESOURCE_TYPES,
  RESOURCE_TYPE_LABELS,
  type ResourceItem,
  type ResourceType
} from '@shared/resource'
import { useResources } from '../context/ResourceContext'

interface ResourceEditorDialogProps {
  record: ResourceItem | null
  onClose: () => void
  onSaved: () => void
}

function tagsToText(tags: string[]): string {
  return tags.join('，')
}

function fileTitleFromName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '')
}

export default function ResourceEditorDialog({
  record,
  onClose,
  onSaved
}: ResourceEditorDialogProps): React.JSX.Element {
  const titleId = useId()
  const isEdit = record !== null
  const { selectFile, cancelSelect, importFile, createNote, createLink, updateResource } = useResources()
  const [type, setType] = useState<ResourceType>(record?.type ?? 'file')
  const [title, setTitle] = useState(record?.title ?? '')
  const [categoryMode, setCategoryMode] = useState<'preset' | 'custom'>(() => {
    if (record && !(PRESET_RESOURCE_CATEGORIES as readonly string[]).includes(record.category)) {
      return 'custom'
    }
    return 'preset'
  })
  const [presetCategory, setPresetCategory] = useState(() => {
    if (record && (PRESET_RESOURCE_CATEGORIES as readonly string[]).includes(record.category)) {
      return record.category
    }
    return '教案'
  })
  const [customCategory, setCustomCategory] = useState(() => {
    if (record && !(PRESET_RESOURCE_CATEGORIES as readonly string[]).includes(record.category)) {
      return record.category
    }
    return ''
  })
  const [tagsText, setTagsText] = useState(tagsToText(record?.tags ?? []))
  const [description, setDescription] = useState(record?.description ?? '')
  const [notes, setNotes] = useState(record?.notes ?? '')
  const [url, setUrl] = useState(record?.url ?? '')
  const [body, setBody] = useState(record?.body ?? '')
  const [originalFileName, setOriginalFileName] = useState(record?.originalFileName ?? '')
  const [fileChosen, setFileChosen] = useState(record?.type === 'file')
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function handleClose(): Promise<void> {
    if (!isEdit) {
      await cancelSelect()
    }
    onClose()
  }

  async function handlePickFile(): Promise<void> {
    setFormError(null)
    try {
      const picked = await selectFile()
      if (picked.canceled) {
        return
      }
      setOriginalFileName(picked.originalFileName)
      setFileChosen(true)
      if (title.trim() === '') {
        setTitle(fileTitleFromName(picked.originalFileName))
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '选择文件失败')
    }
  }

  function currentCategory(): string {
    return categoryMode === 'custom' ? customCategory : presetCategory
  }

  async function handleSave(): Promise<void> {
    setSaving(true)
    setFormError(null)
    const tags = tagsText
    const category = currentCategory()

    try {
      if (isEdit && record) {
        await updateResource(record.id, {
          title: title.trim(),
          category,
          tags: tags.split(/[,，]/),
          description: description.trim(),
          notes: notes.trim(),
          body: body.trim(),
          url: url.trim() === '' ? null : url.trim()
        })
      } else if (type === 'file') {
        if (!fileChosen) {
          throw new Error('请先选择文件')
        }
        await importFile({
          title: title.trim(),
          category,
          tags: tags.split(/[,，]/),
          description: description.trim(),
          notes: notes.trim()
        })
      } else if (type === 'link') {
        await createLink({
          title: title.trim(),
          url: url.trim(),
          category,
          tags: tags.split(/[,，]/),
          description: description.trim(),
          notes: notes.trim()
        })
      } else {
        await createNote({
          title: title.trim(),
          body: body.trim(),
          category,
          tags: tags.split(/[,，]/)
        })
      }
      onSaved()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '保存失败')
      setSaving(false)
    }
  }

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={() => {
        void handleClose()
      }}
    >
      <div
        className="dialog dialog--resource"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h3 id={titleId}>{isEdit ? '编辑资料' : '新增资料'}</h3>
        <p className="dialog-slot">
          {isEdit
            ? record?.type === 'file'
              ? '可以修改标题、分类、标签和说明。第一版不能替换原文件。'
              : '修改后保存。'
            : '选择资料类型。本地文件会复制到应用资料目录，不会改动你的原文件。'}
        </p>

        <div className="dialog-grid">
          {isEdit ? (
            <label>
              类型
              <input value={RESOURCE_TYPE_LABELS[record.type]} readOnly />
            </label>
          ) : (
            <label>
              类型 *
              <select
                value={type}
                onChange={(event) => {
                  const next = event.target.value as ResourceType
                  setType(next)
                  setFormError(null)
                  if (next !== 'file') {
                    void cancelSelect()
                    setFileChosen(false)
                  }
                }}
              >
                {RESOURCE_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {RESOURCE_TYPE_LABELS[item]}
                  </option>
                ))}
              </select>
            </label>
          )}

          {!isEdit && type === 'file' ? (
            <label className="dialog-span">
              本地文件 *
              <span className="import-file-row">
                <button type="button" className="btn" onClick={() => void handlePickFile()} disabled={saving}>
                  选择文件
                </button>
                <span className="import-file-name">{fileChosen ? originalFileName : '尚未选择'}</span>
              </span>
            </label>
          ) : null}

          {isEdit && record?.type === 'file' ? (
            <label className="dialog-span">
              原文件名
              <input value={record.originalFileName ?? ''} readOnly />
            </label>
          ) : null}

          {(isEdit ? record?.type === 'link' : type === 'link') ? (
            <label className="dialog-span">
              网页链接 *
              <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://" />
            </label>
          ) : null}

          <label className="dialog-span dialog-field-main">
            标题 *
            <input value={title} onChange={(event) => setTitle(event.target.value)} autoFocus />
          </label>

          <label>
            分类 *
            <select
              value={categoryMode === 'custom' ? '__custom__' : presetCategory}
              onChange={(event) => {
                if (event.target.value === '__custom__') {
                  setCategoryMode('custom')
                } else {
                  setCategoryMode('preset')
                  setPresetCategory(event.target.value)
                }
              }}
            >
              {PRESET_RESOURCE_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
              <option value="__custom__">自定义…</option>
            </select>
          </label>

          {categoryMode === 'custom' ? (
            <label>
              自定义分类 *
              <input value={customCategory} onChange={(event) => setCustomCategory(event.target.value)} placeholder="例如：排球" />
            </label>
          ) : (
            <span />
          )}

          <label className="dialog-span">
            标签
            <input
              value={tagsText}
              onChange={(event) => setTagsText(event.target.value)}
              placeholder="用逗号分隔，例如：初一，篮球，热身"
            />
          </label>

          {(isEdit ? record?.type === 'note' : type === 'note') ? (
            <label className="dialog-span">
              正文 *
              <textarea rows={8} value={body} onChange={(event) => setBody(event.target.value)} />
            </label>
          ) : (
            <>
              <label className="dialog-span">
                描述
                <textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
              </label>
              <label className="dialog-span">
                备注
                <textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} />
              </label>
            </>
          )}
        </div>

        {formError ? <p className="dialog-error">{formError}</p> : null}

        <div className="dialog-actions">
          <span />
          <div className="dialog-actions-right">
            <button type="button" className="btn" onClick={() => void handleClose()} disabled={saving}>
              取消
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void handleSave()} disabled={saving}>
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
