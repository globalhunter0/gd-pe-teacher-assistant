import { useCallback, useEffect, useId, useState } from 'react'
import { WEEKDAY_LABELS } from '@shared/schedule'
import type { DetectedScheduleWorkbook } from '@shared/schedule/detectTypes'
import type {
  ScheduleImportMapping,
  SchedulePreviewResult,
  ScheduleSyncResolutions
} from '@shared/schedule/importTypes'
import { emptyScheduleResolutions } from '@shared/schedule/reconcile'
import type { ScheduleItem } from '@shared/schedule/types'

const EMPTY_MAPPING: ScheduleImportMapping = {
  weekday: null,
  period: null,
  startTime: null,
  endTime: null,
  team: null,
  courseType: null
}

interface ScheduleImportDialogProps {
  onClose: () => void
  onImported: (items: ScheduleItem[]) => void
}

export default function ScheduleImportDialog({ onClose, onImported }: ScheduleImportDialogProps): React.JSX.Element {
  const titleId = useId()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [detection, setDetection] = useState<DetectedScheduleWorkbook | null>(null)
  const [mapping, setMapping] = useState<ScheduleImportMapping>(EMPTY_MAPPING)
  const [mappingDirty, setMappingDirty] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [resolutions, setResolutions] = useState<ScheduleSyncResolutions>(emptyScheduleResolutions())
  const [preview, setPreview] = useState<SchedulePreviewResult | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    return () => {
      void window.electronAPI.schedule.importCancel()
    }
  }, [])

  const applyDetection = useCallback((next: DetectedScheduleWorkbook) => {
    setDetection(next)
    const first = next.tables[0]
    if (first) {
      setMapping(first.mapping)
    }
    setMappingDirty(false)
    setShowManual(next.needsColumnMapping)
  }, [])

  async function handlePick(): Promise<void> {
    setBusy(true)
    setError(null)
    try {
      const picked = await window.electronAPI.schedule.importPick()
      if (picked.canceled) {
        return
      }
      setSessionId(picked.sessionId)
      setFileName(picked.fileName)
      setResult(null)
      setResolutions(emptyScheduleResolutions())
      const analyzed = await window.electronAPI.schedule.importAnalyze(picked.sessionId)
      applyDetection(analyzed)
    } catch (pickError) {
      setError(pickError instanceof Error ? pickError.message : '选择文件失败')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!sessionId) {
      return
    }
    let cancelled = false
    const timer = window.setTimeout(() => {
      void window.electronAPI.schedule
        .importPreview(sessionId, mappingDirty ? mapping : null, resolutions)
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
  }, [sessionId, mapping, mappingDirty, resolutions])

  async function handleCommit(): Promise<void> {
    if (!sessionId || !preview?.canCommit) {
      return
    }
    setBusy(true)
    setError(null)
    try {
      const committed = await window.electronAPI.schedule.importCommit(sessionId, mappingDirty ? mapping : null, resolutions)
      onImported(committed.items)
      setResult(
        `已同步课表：保留 ${committed.keep}，新增 ${committed.create}，更新 ${committed.update}，移除 ${committed.remove}`
      )
      setSessionId(null)
    } catch (commitError) {
      setError(commitError instanceof Error ? commitError.message : '同步失败')
    } finally {
      setBusy(false)
    }
  }

  function setMapped(next: ScheduleImportMapping): void {
    setMapping(next)
    setMappingDirty(true)
  }

  const columns = detection?.tables[0]?.columns ?? []

  return (
    <div className="dialog-backdrop" onMouseDown={() => !busy && onClose()}>
      <div className="dialog dialog--import" role="dialog" aria-labelledby={titleId} onMouseDown={(event) => event.stopPropagation()}>
        <h3 id={titleId}>导入/更新课表</h3>
        <p className="dialog-slot">
          选择 Excel 后自动识别课位（星期 + 节次）。已有课表会显示保留 / 新增 / 更新 / 待移除，确认前不会写入。
        </p>

        {result ? (
          <>
            <p className="import-result">{result}</p>
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
            <div className="dialog-span import-file-row">
              <button type="button" className="btn" onClick={() => void handlePick()} disabled={busy}>
                选择 Excel 文件
              </button>
              <span className="import-file-name">{fileName || '尚未选择文件（.xlsx / .xls）'}</span>
            </div>

            {detection ? (
              <p className="import-summary">
                {preview?.mode === 'first' ? '当前课表为空，按首次导入处理。' : '当前已有课表，按二次同步处理。'}
                {detection.needsColumnMapping ? ' 列识别置信度不足，请手动调整。' : ''}
              </p>
            ) : null}

            {columns.length > 0 ? (
              <details className="dialog-span" open={showManual}>
                <summary>识别有误？手动调整</summary>
                <div className="dialog-grid">
                  <ColumnSelect label="星期" field="weekday" columns={columns} mapping={mapping} onChange={setMapped} />
                  <ColumnSelect label="节次" field="period" columns={columns} mapping={mapping} onChange={setMapped} />
                  <ColumnSelect label="开始时间" field="startTime" columns={columns} mapping={mapping} onChange={setMapped} />
                  <ColumnSelect label="结束时间" field="endTime" columns={columns} mapping={mapping} onChange={setMapped} />
                  <ColumnSelect label="课程/团队" field="team" columns={columns} mapping={mapping} onChange={setMapped} />
                  <ColumnSelect label="课程类型" field="courseType" columns={columns} mapping={mapping} onChange={setMapped} />
                </div>
              </details>
            ) : null}

            {preview ? (
              <p className="import-summary">
                {preview.mode === 'first' ? '首次导入' : '二次同步'}预览：保留 {preview.totals.keep}，新增 {preview.totals.create}
                ，更新 {preview.totals.update}，待移除 {preview.totals.remove}，冲突 {preview.totals.conflict}
                {preview.canCommit ? '' : `。${preview.blockingReasons.join('；')}`}
              </p>
            ) : null}

            {preview && preview.totals.remove > 0 ? (
              <label className="dialog-span">
                <input
                  type="checkbox"
                  checked={resolutions.acknowledgeRemoves}
                  onChange={(event) =>
                    setResolutions((current) => ({ ...current, acknowledgeRemoves: event.target.checked }))
                  }
                />{' '}
                {preview.removeNotice}
              </label>
            ) : null}

            {preview ? (
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>分类</th>
                      <th>课位</th>
                      <th>说明</th>
                      <th>处理</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.lines.map((line) => (
                      <tr key={`${line.kind}-${line.slotId}`}>
                        <td>{kindLabel(line.kind)}</td>
                        <td>
                          {line.weekday && line.period
                            ? `${WEEKDAY_LABELS[line.weekday]} 第${line.period}节`
                            : line.slotId}
                        </td>
                        <td className="data-table-notes">{line.message}</td>
                        <td>
                          {line.kind === 'conflict' && line.incomingCandidates ? (
                            <select
                              value={conflictChoiceValue(resolutions.slotChoices[line.slotId])}
                              onChange={(event) => {
                                const value = event.target.value
                                setResolutions((current) => ({
                                  ...current,
                                  slotChoices: {
                                    ...current.slotChoices,
                                    [line.slotId]:
                                      value === 'keep'
                                        ? { action: 'keep' }
                                        : { action: 'incoming', excelRow: Number(value) }
                                  }
                                }))
                              }}
                            >
                              <option value="">请选择，禁止静默覆盖</option>
                              {line.current ? <option value="keep">保留当前课表</option> : null}
                              {line.incomingCandidates.map((item) => (
                                <option key={item.excelRow} value={item.excelRow}>
                                  Excel 第{item.excelRow}行 {item.team}
                                </option>
                              ))}
                            </select>
                          ) : line.kind === 'update' && (line.current?.classId || line.current?.trainingTeamId) ? (
                            <label>
                              <input
                                type="checkbox"
                                checked={Boolean(resolutions.clearLinks[line.slotId])}
                                onChange={(event) =>
                                  setResolutions((current) => ({
                                    ...current,
                                    clearLinks: { ...current.clearLinks, [line.slotId]: event.target.checked }
                                  }))
                                }
                              />{' '}
                              清除绑定
                            </label>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {error ? <p className="dialog-error">{error}</p> : null}

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
                  disabled={busy || !preview?.canCommit}
                >
                  确认同步
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function kindLabel(kind: SchedulePreviewResult['lines'][number]['kind']): string {
  return { keep: '保留', create: '新增', update: '更新', remove: '待移除', conflict: '冲突/待确认' }[kind]
}

function conflictChoiceValue(choice: ScheduleSyncResolutions['slotChoices'][string] | undefined): string {
  if (choice?.action === 'incoming') {
    return String(choice.excelRow)
  }
  if (choice?.action === 'keep') {
    return 'keep'
  }
  return ''
}

function ColumnSelect({
  label,
  field,
  columns,
  mapping,
  onChange
}: {
  label: string
  field: keyof ScheduleImportMapping
  columns: Array<{ index: number; header: string }>
  mapping: ScheduleImportMapping
  onChange: (next: ScheduleImportMapping) => void
}): React.JSX.Element {
  return (
    <label>
      {label}
      <select
        value={mapping[field] ?? ''}
        onChange={(event) =>
          onChange({
            ...mapping,
            [field]: event.target.value === '' ? null : Number(event.target.value)
          })
        }
      >
        <option value="">不使用</option>
        {columns.map((column) => (
          <option key={column.index} value={column.index}>
            {column.header || `列${column.index + 1}`}
          </option>
        ))}
      </select>
    </label>
  )
}
