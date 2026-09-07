import { useMemo, useState } from 'react'
import {
  BUILTIN_EXAM_STANDARDS,
  EXAM_STATUS_LABELS,
  EXAM_TYPE_LABELS,
  EXAM_TYPES,
  GD_CITIES,
  type ExamStandard,
  type ExamType
} from '@shared/examStandard'
import {
  buildBatchAssessmentRows,
  coerceExamSnapshot,
  emptyMapping,
  EXAM_BATCH_STATUS_LABELS,
  EXAM_TEMPLATE_SCORE_SHEET,
  isOfficialExamTemplateHeaders,
  roleLabel,
  suggestColumnMapping,
  type BatchAssessmentRow,
  type ExamColumnMapping,
  type ExamColumnRole,
  type ExamSheetSnapshot,
  type SuggestedColumnBinding
} from '@shared/examBatch'

type Step = 1 | 2 | 3 | 4 | 5 | 6

function todayStamp(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function yearLabel(standard: ExamStandard): string {
  return standard.yearFrom === standard.yearTo ? String(standard.yearFrom) : `${standard.yearFrom}-${standard.yearTo}`
}

function parseRoleValue(value: string, standard: ExamStandard, index: number, sourceHeader: string): ExamColumnRole {
  const sourced = { sourceColumn: index, sourceHeader }
  if (value === 'ignore') return { kind: 'ignore', ...sourced }
  if (value === 'studentNo') return { kind: 'studentNo', ...sourced }
  if (value === 'studentName') return { kind: 'studentName', ...sourced }
  if (value === 'gender') return { kind: 'gender', ...sourced }
  if (value === 'className') return { kind: 'className', ...sourced }
  if (value === 'itemName') return { kind: 'itemName', ...sourced }
  if (value === 'rawValue') return { kind: 'rawValue', ...sourced }
  if (value.startsWith('item:')) return { kind: 'examItem', itemId: value.slice(5), ...sourced }
  if (value.startsWith('key:')) return { kind: 'examItemKey', itemKey: value.slice(4), ...sourced }
  const item = standard.items.find((entry) => entry.id === value)
  return item ? { kind: 'examItem', itemId: item.id, ...sourced } : { kind: 'ignore', ...sourced }
}

function formatNormalizedCell(row: BatchAssessmentRow): string {
  if (row.rawValueParsed == null) {
    return row.rawValueNormalized ?? ''
  }
  if (row.examItemName.includes('绳')) {
    return `${row.rawValueParsed}次`
  }
  if (row.rawValueNormalized?.includes(':')) {
    return `${row.rawValueParsed}秒`
  }
  return row.rawValueNormalized ?? String(row.rawValueParsed)
}

function roleSelectValue(role: ExamColumnRole): string {
  if (role.kind === 'examItem') return `item:${role.itemId}`
  if (role.kind === 'examItemKey') return `key:${role.itemKey}`
  return role.kind
}

export default function ExamBatchPage({ onBack }: { onBack: () => void }): React.JSX.Element {
  const standards = BUILTIN_EXAM_STANDARDS.filter((item) => item.status === 'verified')
  const [step, setStep] = useState<Step>(1)
  const [examType, setExamType] = useState<ExamType>('middle_school_exam')
  const [citySlug, setCitySlug] = useState(GD_CITIES[0].citySlug)
  const [standardId, setStandardId] = useState(standards[0]?.id ?? '')
  const [sessionId, setSessionId] = useState('')
  const [fileName, setFileName] = useState('')
  const [sheets, setSheets] = useState<string[]>([])
  const [sheetName, setSheetName] = useState('')
  const [snapshot, setSnapshot] = useState<ExamSheetSnapshot | null>(null)
  const [mapping, setMapping] = useState<ExamColumnMapping | null>(null)
  const [suggestions, setSuggestions] = useState<SuggestedColumnBinding[]>([])
  const [rows, setRows] = useState<BatchAssessmentRow[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'success' | 'error'>('all')
  const [query, setQuery] = useState('')

  const typeStandards = useMemo(() => {
    if (examType === 'gaokao_sports') {
      return standards.filter((item) => item.examType === 'gaokao_sports')
    }
    return standards.filter((item) => item.examType === 'middle_school_exam' && item.citySlug === citySlug)
  }, [citySlug, examType, standards])

  const selectedStandard = typeStandards.find((item) => item.id === standardId) ?? typeStandards[0] ?? null
  const itemKeys = [...new Map((selectedStandard?.items ?? []).map((item) => [item.itemKey, item])).values()]

  const summary = useMemo(() => {
    const successCount = rows.filter((row) => row.status === 'success').length
    const students = new Set(rows.map((row) => `${row.studentNo}|${row.studentName}|${row.className}`))
    return {
      studentCount: students.size,
      recordCount: rows.length,
      successCount,
      errorCount: rows.length - successCount
    }
  }, [rows])

  const visibleRows = useMemo(() => {
    const keyword = query.trim()
    return rows.filter((row) => {
      if (filter === 'success' && row.status !== 'success') return false
      if (filter === 'error' && row.status === 'success') return false
      if (!keyword) return true
      return row.studentName.includes(keyword) || row.studentNo.includes(keyword) || row.className.includes(keyword)
    })
  }, [filter, query, rows])

  function applySuggestion(standard: ExamStandard, titles: string[]): void {
    const suggested = suggestColumnMapping(titles, standard)
    setMapping(suggested.mapping)
    setSuggestions(suggested.suggestions)
  }

  async function handlePick(): Promise<void> {
    setError(null)
    if (!selectedStandard) {
      setError('请先选择已核验评分标准')
      return
    }
    try {
      const picked = await window.electronAPI.examBatch.pick()
      if (picked.canceled) {
        return
      }
      setSessionId(picked.sessionId)
      setFileName(picked.fileName)
      setSheets(picked.sheets)
      const preferred = picked.sheets.includes(EXAM_TEMPLATE_SCORE_SHEET)
        ? EXAM_TEMPLATE_SCORE_SHEET
        : (picked.sheets[0] ?? '')
      setSheetName(preferred)
      setSnapshot(null)
      setRows([])
      setStep(2)
      if (preferred === EXAM_TEMPLATE_SCORE_SHEET) {
        setBusy(true)
        const loaded = coerceExamSnapshot(await window.electronAPI.examBatch.loadSheet(picked.sessionId, preferred))
        setSnapshot(loaded)
        applySuggestion(selectedStandard, loaded.columns.map((column) => column.title))
        setStep(3)
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '无法选择文件')
    } finally {
      setBusy(false)
    }
  }

  async function handleLoadSheet(): Promise<void> {
    setError(null)
    if (!selectedStandard) {
      return
    }
    setBusy(true)
    try {
      const loaded = coerceExamSnapshot(await window.electronAPI.examBatch.loadSheet(sessionId, sheetName))
      setSnapshot(loaded)
      applySuggestion(selectedStandard, loaded.columns.map((column) => column.title))
      setStep(3)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '无法读取工作表')
    } finally {
      setBusy(false)
    }
  }

  function updateColumn(index: number, value: string): void {
    if (!mapping || !selectedStandard || !snapshot) {
      return
    }
    const header = snapshot.columns[index]?.title ?? ''
    const next = mapping.columns.map((role, roleIndex) =>
      roleIndex === index ? parseRoleValue(value, selectedStandard, index, header) : role
    )
    const hasLong = next.some((role) => role.kind === 'itemName') && next.some((role) => role.kind === 'rawValue')
    const hasWide = next.some((role) => role.kind === 'examItem' || role.kind === 'examItemKey')
    setMapping({
      layout: hasWide ? 'wide' : hasLong ? 'long' : mapping.layout,
      columns: next
    })
  }

  function handleConvert(): void {
    if (!selectedStandard || !mapping || !snapshot) {
      return
    }
    setError(null)
    setBusy(true)
    try {
      const converted = buildBatchAssessmentRows(selectedStandard, mapping, coerceExamSnapshot(snapshot))
      setRows(converted.rows)
      setStep(6)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '换算失败')
    } finally {
      setBusy(false)
    }
  }

  async function handleExport(): Promise<void> {
    if (!selectedStandard || !mapping) {
      return
    }
    setError(null)
    const regionName = selectedStandard.examType === 'gaokao_sports' ? '广东省' : selectedStandard.cityName
    const fileBaseName = `${regionName}${yearLabel(selectedStandard)}${EXAM_TYPE_LABELS[selectedStandard.examType]}_成绩换算_${todayStamp()}`
    try {
      const result = await window.electronAPI.examBatch.export({
        layout: mapping.layout,
        rows,
        standard: { id: selectedStandard.id, title: selectedStandard.title },
        meta: {
          examTypeLabel: EXAM_TYPE_LABELS[selectedStandard.examType],
          regionName,
          standardTitle: selectedStandard.title,
          policyLabel: selectedStandard.policyLabel,
          yearLabel: yearLabel(selectedStandard),
          statusLabel: EXAM_STATUS_LABELS[selectedStandard.status],
          sourceTitle: selectedStandard.sourceTitle,
          sourceUrl: selectedStandard.sourceUrl,
          exportedAt: new Date().toISOString(),
          fileBaseName
        }
      })
      if (result.canceled) {
        return
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '导出失败')
    }
  }

  return (
    <section className="page page--exams">
      <div className="page-heading">
        <h2>批量成绩换算</h2>
        <p>独立工作区：导入 Excel 不会创建或修改学生档案、班级或体育测试记录，也不会改写原文件。</p>
      </div>
      <p>
        <button type="button" className="btn" onClick={onBack}>
          返回评分标准
        </button>
      </p>
      <ol className="exam-batch-steps">
        <li className={step === 1 ? 'is-active' : ''}>① 选择标准</li>
        <li className={step === 2 ? 'is-active' : ''}>② 导入 Excel</li>
        <li className={step === 3 ? 'is-active' : ''}>③ 确认列映射</li>
        <li className={step === 4 ? 'is-active' : ''}>④ 预览</li>
        <li className={step >= 5 ? 'is-active' : ''}>⑤ 批量换算</li>
        <li className={step === 6 ? 'is-active' : ''}>⑥ 导出结果</li>
      </ol>
      {error ? <p className="page-error">{error}</p> : null}

      <div className="exam-detail">
        <h3>① 选择标准</h3>
        <div className="toolbar">
          <label className="toolbar-field">
            考试类型
            <select
              value={examType}
              onChange={(event) => {
                const next = event.target.value as ExamType
                setExamType(next)
                setStandardId('')
              }}
            >
              {EXAM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {EXAM_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </label>
          {examType === 'middle_school_exam' ? (
            <label className="toolbar-field">
              地区
              <select
                value={citySlug}
                onChange={(event) => {
                  setCitySlug(event.target.value)
                  setStandardId('')
                }}
              >
                {GD_CITIES.map((city) => (
                  <option key={city.citySlug} value={city.citySlug}>
                    {city.cityName}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="toolbar-field">
              地区
              <select disabled>
                <option>广东省</option>
              </select>
            </label>
          )}
          <label className="toolbar-field">
            年份 / 政策版本
            <select value={selectedStandard?.id ?? ''} onChange={(event) => setStandardId(event.target.value)}>
              {typeStandards.length === 0 ? <option value="">暂无已核验标准</option> : null}
              {typeStandards.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.policyLabel}（{EXAM_STATUS_LABELS[item.status]}）
                </option>
              ))}
            </select>
          </label>
        </div>
        {selectedStandard ? (
          <p className="exam-notes">
            {selectedStandard.title}。仅使用已核验且支持自动换算的项目；draft / unsupported 不会静默给分。
          </p>
        ) : (
          <p className="exam-notes">当前地区没有已核验标准，不能批量换算。</p>
        )}
        <button type="button" className="btn btn-primary" onClick={() => setStep(2)} disabled={!selectedStandard}>
          下一步：导入 Excel
        </button>
      </div>

      <div className="exam-detail">
        <h3>② 导入 Excel</h3>
        <p className="exam-notes">
          支持宽表和长表。.xlsx / .xls。不会修改你选择的原文件。若文件含「成绩登记」工作表，会自动读取该表。
        </p>
        <div className="toolbar">
          <button type="button" className="btn btn-primary" onClick={() => void handlePick()} disabled={!selectedStandard}>
            选择 Excel
          </button>
          <span className="import-file-name">{fileName || '尚未选择文件'}</span>
        </div>
        {sheets.length > 0 ? (
          <div className="toolbar">
            <label className="toolbar-field">
              工作表
              <select value={sheetName} onChange={(event) => setSheetName(event.target.value)}>
                {sheets.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="btn btn-primary" onClick={() => void handleLoadSheet()} disabled={busy || !sheetName}>
              读取表头
            </button>
          </div>
        ) : null}
      </div>

      {snapshot && mapping && selectedStandard ? (
        <div className="exam-detail">
          <h3>③ 确认列映射</h3>
          <p className="exam-notes">
            {isOfficialExamTemplateHeaders(snapshot.columns.map((column) => column.title))
              ? '已识别本 App 成绩登记模板，已自动映射姓名、学号、班级、性别和各项目列。请核对后进入预览，仍可手动修改。'
              : '自动识别只是默认值。低置信度或未识别的列请手动指定。'}
            当前按{mapping.layout === 'wide' ? '宽表' : '长表'}处理。
          </p>
          <div className="toolbar">
            <button
              type="button"
              className="btn"
              onClick={() => applySuggestion(selectedStandard, snapshot.columns.map((column) => column.title))}
            >
              重新识别
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setMapping(emptyMapping(snapshot.columns.length, snapshot.columns.map((column) => column.title)))
                setSuggestions([])
              }}
            >
              重置映射
            </button>
          </div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Excel列</th>
                  <th>表头</th>
                  <th>系统识别</th>
                  <th>映射为</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.columns.map((column) => {
                  const suggestion = suggestions.find((item) => item.index === column.index)
                  const role = mapping.columns[column.index]
                  const mark = suggestion?.confidence === 'high' ? '✓' : suggestion?.confidence === 'medium' ? '?' : ''
                  return (
                    <tr key={column.index}>
                      <td>{String.fromCharCode(65 + (column.index % 26))}列</td>
                      <td>{column.title}</td>
                      <td>
                        {suggestion ? `${suggestion.label} ${mark}` : roleLabel(role, selectedStandard)}
                      </td>
                      <td>
                        <select value={roleSelectValue(role)} onChange={(event) => updateColumn(column.index, event.target.value)}>
                          <option value="ignore">忽略</option>
                          <option value="studentName">姓名</option>
                          <option value="studentNo">学号</option>
                          <option value="gender">性别</option>
                          <option value="className">班级</option>
                          <option value="itemName">项目（长表）</option>
                          <option value="rawValue">成绩（长表）</option>
                          {itemKeys.map((item) => (
                            <option key={item.itemKey} value={`key:${item.itemKey}`}>
                              项目：{item.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setStep(4)}>
            下一步：预览
          </button>
        </div>
      ) : null}

      {step >= 4 && snapshot && mapping && selectedStandard ? (
        <div className="exam-detail">
          <h3>④ 预览</h3>
          <p className="exam-notes">先核对识别结果，再换算。共 {snapshot.rows.length} 行数据，下表显示前 15 行。</p>
          <div className="import-preview-wrap">
            <table className="data-table import-preview-table">
              <thead>
                <tr>
                  {snapshot.columns.map((column) => (
                    <th key={column.index}>
                      {column.title}
                      <br />
                      <span className="exam-notes">{roleLabel(mapping.columns[column.index], selectedStandard)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {snapshot.rows.slice(0, 15).map((row) => (
                  <tr key={row.excelRow}>
                    {row.cells.map((cell, index) => (
                      <td key={`${row.excelRow}-${index}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className="btn btn-primary" onClick={handleConvert} disabled={busy}>
            ⑤ 开始批量换算
          </button>
        </div>
      ) : null}

      {step === 6 ? (
        <div className="exam-converter">
          <h3>换算结果</h3>
          <p>
            总人数 {summary.studentCount}，成绩记录 {summary.recordCount}，成功 {summary.successCount}，异常 {summary.errorCount}
          </p>
          <div className="toolbar">
            <label className="toolbar-field">
              筛选
              <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>
                <option value="all">全部</option>
                <option value="success">成功</option>
                <option value="error">异常</option>
              </select>
            </label>
            <label className="toolbar-field">
              搜索
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="姓名 / 学号 / 班级" />
            </label>
            <button type="button" className="btn btn-primary" onClick={() => void handleExport()}>
              ⑥ 导出结果
            </button>
          </div>
          <div className="import-preview-wrap">
            <table className="data-table import-preview-table">
              <thead>
                <tr>
                  <th>学号</th>
                  <th>姓名</th>
                  <th>班级</th>
                  <th>性别</th>
                  <th>项目</th>
                  <th>原始成绩</th>
                  <th>标准化成绩</th>
                  <th>换算分数</th>
                  <th>状态</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.slice(0, 300).map((row, index) => (
                  <tr key={`${row.sourceRow}-${row.examItemId}-${index}`} className={row.status === 'success' ? '' : 'import-row--error'}>
                    <td>{row.studentNo}</td>
                    <td>{row.studentName}</td>
                    <td>{row.className}</td>
                    <td>{row.gender === 'male' ? '男' : row.gender === 'female' ? '女' : ''}</td>
                    <td>{row.examItemName}</td>
                    <td>{row.rawValueOriginal}</td>
                    <td>{formatNormalizedCell(row)}</td>
                    <td>{row.score ?? ''}</td>
                    <td>{EXAM_BATCH_STATUS_LABELS[row.status]}</td>
                    <td>{row.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {visibleRows.length > 300 ? <p className="exam-notes">表格仅预览前 300 条，完整结果请导出 Excel。</p> : null}
        </div>
      ) : null}
    </section>
  )
}
