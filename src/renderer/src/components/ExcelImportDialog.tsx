import { useCallback, useEffect, useId, useState } from 'react'
import type { ClassRecord } from '@shared/class'
import {
  STUDENT_GENDER_LABELS,
  type ImportColumn,
  type ImportCommitResult,
  type ImportPreviewResult,
  type ImportRowStatus,
  type StudentImportMapping
} from '@shared/student'

interface ExcelImportDialogProps {
  classes: ClassRecord[]
  defaultClassId: string
  onClose: () => void
  onImported: (result: ImportCommitResult) => void
}

const STATUS_LABELS: Record<ImportRowStatus, string> = {
  importable: '可导入',
  warning: '警告',
  error: '错误',
  duplicate: '重复'
}

const EMPTY_MAPPING: StudentImportMapping = {
  studentNo: null,
  name: null,
  gender: null,
  notes: null
}

export default function ExcelImportDialog({
  classes,
  defaultClassId,
  onClose,
  onImported
}: ExcelImportDialogProps): React.JSX.Element {
  const titleId = useId()
  const [classId, setClassId] = useState(defaultClassId || classes[0]?.id || '')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [sheets, setSheets] = useState<string[]>([])
  const [sheetName, setSheetName] = useState('')
  const [columns, setColumns] = useState<ImportColumn[]>([])
  const [mapping, setMapping] = useState<StudentImportMapping>(EMPTY_MAPPING)
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null)
  const [result, setResult] = useState<ImportCommitResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !busy) {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [busy, onClose])

  useEffect(() => {
    return () => {
      void window.electronAPI.students.importCancel()
    }
  }, [])

  const loadHeaders = useCallback(async (nextSessionId: string, nextSheet: string) => {
    const headers = await window.electronAPI.students.importHeaders(nextSessionId, nextSheet)
    setColumns(headers.columns)
    setMapping(headers.suggestedMapping)
    setPreview(null)
  }, [])

  async function handlePick(): Promise<void> {
    setBusy(true)
    setError(null)
    try {
      const picked = await window.electronAPI.students.importPick()
      if (picked.canceled) {
        return
      }

      setSessionId(picked.sessionId)
      setFileName(picked.fileName)
      setSheets(picked.sheets)
      setSheetName(picked.sheets[0] ?? '')
      setResult(null)
      if (picked.sheets[0]) {
        await loadHeaders(picked.sessionId, picked.sheets[0])
      }
    } catch (pickError) {
      setError(pickError instanceof Error ? pickError.message : '选择文件失败')
    } finally {
      setBusy(false)
    }
  }

  async function handleSheetChange(nextSheet: string): Promise<void> {
    if (!sessionId) {
      return
    }

    setSheetName(nextSheet)
    setBusy(true)
    setError(null)
    try {
      await loadHeaders(sessionId, nextSheet)
    } catch (sheetError) {
      setError(sheetError instanceof Error ? sheetError.message : '读取工作表失败')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!sessionId || sheetName === '' || classId === '' || mapping.name === null) {
      return
    }

    let cancelled = false
    const timer = window.setTimeout(() => {
      void window.electronAPI.students
        .importPreview(sessionId, sheetName, mapping, classId)
        .then((nextPreview) => {
          if (!cancelled) {
            setPreview(nextPreview)
            setError(null)
          }
        })
        .catch((previewError: unknown) => {
          if (!cancelled) {
            setPreview(null)
            setError(previewError instanceof Error ? previewError.message : '预览失败')
          }
        })
    }, 200)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [sessionId, sheetName, mapping, classId])

  async function handleCommit(): Promise<void> {
    if (!sessionId || sheetName === '' || classId === '') {
      return
    }

    setBusy(true)
    setError(null)
    try {
      const committed = await window.electronAPI.students.importCommit(sessionId, sheetName, mapping, classId)
      setResult(committed)
      onImported(committed)
    } catch (commitError) {
      setError(commitError instanceof Error ? commitError.message : '导入失败')
    } finally {
      setBusy(false)
    }
  }

  function updateMapping(field: keyof StudentImportMapping, raw: string): void {
    const index = raw === '' ? null : Number(raw)
    setMapping((current) => ({
      ...current,
      [field]: index
    }))
  }

  const acceptedCount = preview ? preview.importable + preview.warning : 0

  return (
    <div className="dialog-backdrop" onMouseDown={() => !busy && onClose()}>
      <div
        className="dialog dialog--import"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h3 id={titleId}>Excel 导入学生</h3>
        <p className="dialog-slot">选择班级和 Excel 文件。确认前可预览校验结果。不会修改原 Excel 文件。</p>

        {result ? (
          <>
            <p className="import-result">
              成功导入 {result.imported} 名学生
              {result.warningImported > 0 ? `（其中 ${result.warningImported} 条带警告）` : ''}
              。跳过 {result.skippedDuplicate} 条重复记录，{result.skippedError} 条错误记录未导入。
            </p>
            <div className="dialog-actions">
              <span />
              <div className="dialog-actions-right">
                <button type="button" className="btn btn-primary" onClick={onClose}>
                  完成
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="dialog-grid">
              <label className="dialog-span">
                目标班级 *
                <select value={classId} onChange={(event) => setClassId(event.target.value)} disabled={busy}>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.grade} {item.className}
                    </option>
                  ))}
                </select>
              </label>
              <div className="dialog-span import-file-row">
                <button type="button" className="btn" onClick={() => void handlePick()} disabled={busy}>
                  选择 Excel 文件
                </button>
                <span className="import-file-name">{fileName || '尚未选择文件（.xlsx / .xls）'}</span>
              </div>
              {sheets.length > 1 ? (
                <label className="dialog-span">
                  工作表
                  <select value={sheetName} onChange={(event) => void handleSheetChange(event.target.value)} disabled={busy}>
                    {sheets.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              {columns.length > 0 ? (
                <>
                  <label>
                    姓名 *
                    <ColumnSelect columns={columns} value={mapping.name} exclude={mapping} field="name" onChange={updateMapping} />
                  </label>
                  <label>
                    学号
                    <ColumnSelect
                      columns={columns}
                      value={mapping.studentNo}
                      exclude={mapping}
                      field="studentNo"
                      onChange={updateMapping}
                    />
                  </label>
                  <label>
                    性别
                    <ColumnSelect
                      columns={columns}
                      value={mapping.gender}
                      exclude={mapping}
                      field="gender"
                      onChange={updateMapping}
                    />
                  </label>
                  <label>
                    备注
                    <ColumnSelect
                      columns={columns}
                      value={mapping.notes}
                      exclude={mapping}
                      field="notes"
                      onChange={updateMapping}
                    />
                  </label>
                </>
              ) : null}
            </div>

            {preview ? (
              <div className="import-summary">
                有效数据 {preview.totalRows} 行：可导入 {preview.importable}，警告 {preview.warning}，错误 {preview.error}，重复{' '}
                {preview.duplicate}
              </div>
            ) : null}

            {error ? <p className="dialog-error">{error}</p> : null}

            {preview && preview.rows.length > 0 ? (
              <div className="import-preview-wrap">
                <table className="data-table import-preview-table">
                  <thead>
                    <tr>
                      <th>行号</th>
                      <th>学号</th>
                      <th>姓名</th>
                      <th>性别</th>
                      <th>备注</th>
                      <th>状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row) => (
                      <tr key={row.excelRow} className={`import-row import-row--${row.status}`}>
                        <td>{row.excelRow}</td>
                        <td>{row.studentNo || '—'}</td>
                        <td>{row.name || '—'}</td>
                        <td>{STUDENT_GENDER_LABELS[row.gender]}</td>
                        <td className="data-table-notes">{row.notes || '—'}</td>
                        <td>
                          {STATUS_LABELS[row.status]}
                          {row.message ? `：${row.message}` : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            <div className="dialog-actions">
              <span />
              <div className="dialog-actions-right">
                <button type="button" className="btn" onClick={onClose} disabled={busy}>
                  取消
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void handleCommit()}
                  disabled={busy || acceptedCount === 0}
                >
                  确认导入
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ColumnSelect({
  columns,
  value,
  exclude,
  field,
  onChange
}: {
  columns: ImportColumn[]
  value: number | null
  exclude: StudentImportMapping
  field: keyof StudentImportMapping
  onChange: (field: keyof StudentImportMapping, raw: string) => void
}): React.JSX.Element {
  const taken = new Set(
    (Object.entries(exclude) as Array<[keyof StudentImportMapping, number | null]>)
      .filter(([key, index]) => key !== field && index !== null)
      .map(([, index]) => index as number)
  )

  return (
    <select
      value={value === null ? '' : String(value)}
      onChange={(event) => onChange(field, event.target.value)}
    >
      <option value="">{field === 'name' ? '请选择列' : '不导入'}</option>
      {columns.map((column) => (
        <option key={column.index} value={String(column.index)} disabled={taken.has(column.index)}>
          {column.title}
        </option>
      ))}
    </select>
  )
}
