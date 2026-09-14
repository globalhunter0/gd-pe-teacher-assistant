import { useCallback, useEffect, useId, useState } from 'react'
import { DEFAULT_ACADEMIC_YEAR, GRADES, GRADE_LABELS, SEMESTERS, listedClassRecords, type ClassRecord, type Grade, type Semester } from '@shared/class'
import {
  type ImportColumn,
  type ImportCommitResult,
  type StudentImportMapping
} from '@shared/student'
import type { DetectedWorkbook } from '@shared/student/detectTypes'
import type { RosterClassChoice, RosterPreviewResult, RosterResolutions, RosterRowChoice } from '@shared/student/rosterTypes'

interface ExcelImportDialogProps {
  classes: ClassRecord[]
  onClose: () => void
  onImported: (result: ImportCommitResult) => void
}

const EMPTY_MAPPING: StudentImportMapping = {
  className: null,
  studentNo: null,
  name: null,
  gender: null,
  notes: null
}

const EMPTY_RESOLUTIONS: RosterResolutions = { classChoices: {}, rowChoices: {} }

export default function ExcelImportDialog({ classes, onClose, onImported }: ExcelImportDialogProps): React.JSX.Element {
  const titleId = useId()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [columns, setColumns] = useState<ImportColumn[]>([])
  const [mapping, setMapping] = useState<StudentImportMapping>(EMPTY_MAPPING)
  const [mappingDirty, setMappingDirty] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [detection, setDetection] = useState<DetectedWorkbook | null>(null)
  const [academicYear, setAcademicYear] = useState(DEFAULT_ACADEMIC_YEAR)
  const [semester, setSemester] = useState<Semester>('第一学期')
  const [resolutions, setResolutions] = useState<RosterResolutions>(EMPTY_RESOLUTIONS)
  const [preview, setPreview] = useState<RosterPreviewResult | null>(null)
  const [createGrades, setCreateGrades] = useState<Record<string, Grade>>({})
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

  const applyDetection = useCallback((next: DetectedWorkbook) => {
    setDetection(next)
    const first = next.tables[0]
    if (first) {
      setColumns(first.columns.map((item) => ({ index: item.index, title: item.header || `列${item.index + 1}` })))
      setMapping(first.mapping)
    }
    setMappingDirty(false)
    if (next.suggestedAcademicYear) {
      setAcademicYear(next.suggestedAcademicYear)
    }
    if (next.suggestedSemester) {
      setSemester(next.suggestedSemester)
    }
    setShowManual(next.needsColumnMapping)
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
      setResult(null)
      setResolutions(EMPTY_RESOLUTIONS)
      const analyzed = await window.electronAPI.students.importAnalyze(picked.sessionId)
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
    if (detection?.needsColumnMapping && mapping.name === null) {
      return
    }
    let cancelled = false
    const timer = window.setTimeout(() => {
      void window.electronAPI.students
        .importPreview(sessionId, '', mappingDirty ? mapping : null, { academicYear, semester, resolutions })
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
  }, [sessionId, mapping, mappingDirty, academicYear, semester, resolutions, detection])

  async function handleCommit(): Promise<void> {
    if (!sessionId || !preview?.canCommit) {
      return
    }
    setBusy(true)
    setError(null)
    try {
      const committed = await window.electronAPI.students.importCommit(sessionId, '', mappingDirty ? mapping : null, {
        academicYear,
        semester,
        resolutions
      })
      setResult(committed)
      onImported(committed)
    } catch (commitError) {
      setError(commitError instanceof Error ? commitError.message : '同步失败')
    } finally {
      setBusy(false)
    }
  }

  function updateMapping(field: keyof StudentImportMapping, raw: string): void {
    const index = raw === '' ? null : Number(raw)
    setMapping((current) => ({ ...current, [field]: index }))
    setMappingDirty(true)
    setResolutions(EMPTY_RESOLUTIONS)
  }

  function setClassChoice(groupKey: string, choice: RosterClassChoice): void {
    setResolutions((current) => ({
      ...current,
      classChoices: { ...current.classChoices, [groupKey]: choice }
    }))
  }

  function setRowChoice(excelRow: number, choice: RosterRowChoice): void {
    setResolutions((current) => ({
      ...current,
      rowChoices: { ...current.rowChoices, [excelRow]: choice }
    }))
  }

  const studentCount = detection?.tables.reduce((sum, item) => sum + item.rowCount, 0) ?? 0

  return (
    <div className="dialog-backdrop" onMouseDown={() => !busy && onClose()}>
      <div
        className="dialog dialog--import"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h3 id={titleId}>导入/更新班级名单</h3>
        <p className="dialog-slot">选择 Excel 后自动识别名单。确认前不会写入。消失的学生只移出当前名单。</p>

        {result ? (
          <>
            <p className="import-result">
              已同步。新建班级 {result.createdClassCount ?? 0} 个，新增学生 {result.createdStudentCount ?? 0} 人，更新{' '}
              {result.updatedStudentCount ?? 0} 人，移出当前名单 {result.removedFromRosterCount ?? 0} 人。
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
              <label>
                学年
                <input value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} disabled={busy} />
              </label>
              <label>
                学期
                <select value={semester} onChange={(event) => setSemester(event.target.value as Semester)} disabled={busy}>
                  {SEMESTERS.map((item) => (
                    <option key={item} value={item}>
                      {item}
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
            </div>

            {detection ? (
              <p className="import-summary">
                识别到 {detection.tables.length} 个班级名单工作表，{studentCount} 名学生
                {detection.skippedSheets.length > 0
                  ? `；已跳过 ${detection.skippedSheets.map((item) => item.sheetName).join('、')}`
                  : ''}
                {detection.needsColumnMapping ? '。姓名列置信度不足，请手动调整。' : '。'}
                {detection.warnings.length > 0 ? detection.warnings.join('；') : ''}
              </p>
            ) : null}

            {columns.length > 0 ? (
              <details className="dialog-span" open={showManual}>
                <summary>识别有误？手动调整</summary>
                <div className="dialog-grid">
                  <label>
                    班级
                    <ColumnSelect columns={columns} value={mapping.className} exclude={mapping} field="className" onChange={updateMapping} />
                  </label>
                  <label>
                    姓名 *
                    <ColumnSelect columns={columns} value={mapping.name} exclude={mapping} field="name" onChange={updateMapping} />
                  </label>
                  <label>
                    学号
                    <ColumnSelect columns={columns} value={mapping.studentNo} exclude={mapping} field="studentNo" onChange={updateMapping} />
                  </label>
                  <label>
                    性别
                    <ColumnSelect columns={columns} value={mapping.gender} exclude={mapping} field="gender" onChange={updateMapping} />
                  </label>
                  <label className="dialog-span">
                    备注
                    <ColumnSelect columns={columns} value={mapping.notes} exclude={mapping} field="notes" onChange={updateMapping} />
                  </label>
                </div>
              </details>
            ) : null}

            {preview ? (
              <p className="import-summary">
                名单同步预览：保留 {preview.totals.keep}，新增 {preview.totals.create}，移出当前名单 {preview.totals.remove}，信息更新{' '}
                {preview.totals.update}，冲突 {preview.totals.conflict}，待新建班级 {preview.totals.classesToCreate}
                {preview.canCommit ? '' : '。请先处理班级匹配与冲突后再确认。'}
              </p>
            ) : null}

            {preview
              ? preview.groups.map((group) => (
                  <div key={group.groupKey} className="import-summary">
                    <p>
                      {group.classLabel}：当前名单 {group.currentActiveCount} 人，Excel {group.excelCount} 人。保留 {group.keep}，新增{' '}
                      {group.create}，移出当前名单 {group.remove}，信息更新 {group.update}，冲突 {group.conflict}
                    </p>
                    {group.match.match === 'confirm' ? (
                      <div>
                        <label>
                          班级匹配
                          <select
                            value={
                              resolutions.classChoices[group.groupKey]?.action === 'existing'
                                ? (resolutions.classChoices[group.groupKey]?.classId ?? '')
                                : resolutions.classChoices[group.groupKey]?.action === 'create'
                                  ? '__create__'
                                  : ''
                            }
                            onChange={(event) => {
                              const value = event.target.value
                              if (value === '__create__') {
                                const grade = group.match.grade ?? createGrades[group.groupKey]
                                const className = group.match.className || group.match.classRaw
                                if (grade && className) {
                                  setClassChoice(group.groupKey, {
                                    action: 'create',
                                    grade,
                                    className
                                  })
                                }
                                return
                              }
                              if (value) {
                                setClassChoice(group.groupKey, { action: 'existing', classId: value })
                              }
                            }}
                          >
                            <option value="">请选择已有班级或新建</option>
                            {group.match.grade && group.match.className ? (
                              <option value="__create__">新建：{group.classLabel}</option>
                            ) : createGrades[group.groupKey] && (group.match.className || group.match.classRaw) ? (
                              <option value="__create__">
                                新建：{createGrades[group.groupKey]} {group.match.className || group.match.classRaw}
                              </option>
                            ) : null}
                            {listedClassRecords(classes).map((item) => (
                              <option key={item.id} value={item.id}>
                                匹配：{item.grade} {item.className}（{item.academicYear} {item.semester}）
                              </option>
                            ))}
                          </select>
                        </label>
                        {!group.match.grade ? (
                          <label>
                            新建时的年级
                            <select
                              value={createGrades[group.groupKey] ?? ''}
                              onChange={(event) => {
                                const grade = event.target.value as Grade
                                const className = group.match.className || group.match.classRaw
                                setCreateGrades((current) => ({ ...current, [group.groupKey]: grade }))
                                if (grade && className) {
                                  setClassChoice(group.groupKey, { action: 'create', grade, className })
                                }
                              }}
                            >
                              <option value="">请选择年级</option>
                              {GRADES.map((item) => (
                                <option key={item} value={item}>
                                  {GRADE_LABELS[item]}
                                </option>
                              ))}
                            </select>
                          </label>
                        ) : null}
                      </div>
                    ) : (
                      <p>{group.match.match === 'create' ? '将新建该班级（手工学生人数保持 0）' : '已匹配已有班级'}</p>
                    )}
                    {group.lines
                      .filter((line) => line.kind === 'conflict' || line.kind === 'suspect_transfer')
                      .map((line) => {
                        const fromClass = line.suspect
                          ? classes.find((item) => item.id === line.suspect!.fromClassId)
                          : undefined
                        return (
                          <div key={`${group.groupKey}-${line.excelRow ?? line.existingId}`} className="dialog-slot">
                            <p>
                              {line.incoming
                                ? `第${line.excelRow}行 ${line.incoming.studentNo || '无学号'} ${line.incoming.name}`
                                : ''}{' '}
                              {line.message}
                              {line.kind === 'suspect_transfer' && line.suspect
                                ? `（姓名 ${line.suspect.name}，学号 ${line.suspect.studentNo || '无'}，原班级 ${
                                    fromClass ? `${fromClass.grade} ${fromClass.className}` : line.suspect.fromClassId
                                  }，新班级 ${group.classLabel}）`
                                : ''}
                            </p>
                            {line.kind === 'suspect_transfer' && line.suspect && line.excelRow ? (
                              <p>
                                <button
                                  type="button"
                                  className="btn btn-small"
                                  onClick={() =>
                                    setRowChoice(line.excelRow!, { action: 'transfer', studentId: line.suspect!.studentId })
                                  }
                                >
                                  确认是同一学生并转班
                                </button>{' '}
                                <button type="button" className="btn btn-small" onClick={() => setRowChoice(line.excelRow!, { action: 'create' })}>
                                  作为新学生
                                </button>
                              </p>
                            ) : null}
                            {line.kind === 'conflict' && line.existingId && line.excelRow ? (
                              <p>
                                <button
                                  type="button"
                                  className="btn btn-small"
                                  onClick={() => setRowChoice(line.excelRow!, { action: 'update', studentId: line.existingId })}
                                >
                                  确认为同一人并更新
                                </button>{' '}
                                <button
                                  type="button"
                                  className="btn btn-small"
                                  onClick={() =>
                                    setRowChoice(line.excelRow!, { action: 'keep-existing', studentId: line.existingId })
                                  }
                                >
                                  保留原学生、跳过该行
                                </button>
                              </p>
                            ) : null}
                            {line.kind === 'conflict' && !line.existingId && line.excelRow ? (
                              <p>
                                <button type="button" className="btn btn-small" onClick={() => setRowChoice(line.excelRow!, { action: 'create' })}>
                                  作为新学生
                                </button>
                              </p>
                            ) : null}
                          </div>
                        )
                      })}
                  </div>
                ))
              : null}

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
  const required = field === 'name'
  return (
    <select value={value === null ? '' : String(value)} onChange={(event) => onChange(field, event.target.value)}>
      <option value="">{required ? '请选择列' : '不导入'}</option>
      {columns.map((column) => (
        <option key={column.index} value={String(column.index)} disabled={taken.has(column.index)}>
          {column.title}
        </option>
      ))}
    </select>
  )
}
