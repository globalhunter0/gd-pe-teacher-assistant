import { useMemo, useState } from 'react'
import PageLayout, { PageHeader } from '../components/PageLayout'
import {
  BUILTIN_EXAM_STANDARDS,
  EXAM_STATUS_LABELS,
  EXAM_TYPE_LABELS,
  EXAM_TYPES,
  GD_CITIES,
  standardAllowsOfficialConvert,
  type ExamStandard,
  type ExamType
} from '@shared/examStandard'
import {
  AUTO_SCORE_CREDIBILITY,
  EXAM_TEMPLATE_SCORE_SHEET,
  MISSING_TABLE_HINT,
  NO_AUTO_SCORE_CREDIBILITY,
  coerceExamSnapshot,
  convertWorkbookExamBatch,
  detectWorkbookColumns,
  displayBatchStatus,
  singleItemExportFileName,
  updateProjectGroupOverride,
  workbookItemSummaries,
  workbookStudentGroups,
  columnAutoConfirmed,
  type BatchAssessmentRow,
  type ExamSheetSnapshot,
  type WorkbookDetection
} from '@shared/examBatch'

type Step = 'setup' | 'detect' | 'result'

function yearLabel(standard: ExamStandard): string {
  return standard.yearFrom === standard.yearTo ? String(standard.yearFrom) : `${standard.yearFrom}-${standard.yearTo}`
}

function genderCell(value: BatchAssessmentRow['gender']): string {
  if (value === 'male') return '男'
  if (value === 'female') return '女'
  return '未识别'
}

function columnStatusText(autoScoreSupported: boolean, matchType: string, reason: string, mixedLabels: boolean): string {
  if (mixedLabels) return '按行识别项目'
  if (matchType === 'ambiguous') return '需要确认'
  if (reason === '部分支持') return '部分支持'
  if (autoScoreSupported) return '可自动评分'
  return '暂无评分表'
}

export default function ExamBatchPage({
  onBack,
  initialCitySlug = '',
  initialStandardId = '',
  initialItemId = ''
}: {
  onBack: () => void
  initialCitySlug?: string
  initialStandardId?: string
  initialItemId?: string
}): React.JSX.Element {
  const [step, setStep] = useState<Step>('setup')
  const [examType, setExamType] = useState<ExamType>('middle_school_exam')
  const [citySlug, setCitySlug] = useState(initialCitySlug)
  const [standardId, setStandardId] = useState(initialStandardId)
  const [sessionId, setSessionId] = useState('')
  const [fileName, setFileName] = useState('')
  const [sheets, setSheets] = useState<string[]>([])
  const [sheetName, setSheetName] = useState('')
  const [snapshot, setSnapshot] = useState<ExamSheetSnapshot | null>(null)
  const [detection, setDetection] = useState<WorkbookDetection | null>(null)
  const [confirmedColumns, setConfirmedColumns] = useState<Record<number, string>>({})
  const [groupOverrides, setGroupOverrides] = useState<Record<string, string>>({})
  const [rows, setRows] = useState<BatchAssessmentRow[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  const typeStandards = useMemo(() => {
    if (examType === 'gaokao_sports') {
      return BUILTIN_EXAM_STANDARDS.filter((item) => item.examType === 'gaokao_sports')
    }
    if (!citySlug) return []
    return BUILTIN_EXAM_STANDARDS.filter((item) => item.examType === 'middle_school_exam' && item.citySlug === citySlug)
  }, [citySlug, examType])

  const selectedStandard =
    typeStandards.find((item) => item.id === standardId) ?? (typeStandards.length === 1 ? typeStandards[0] : null)

  const students = useMemo(() => workbookStudentGroups(rows), [rows])
  const itemSummaries = useMemo(() => workbookItemSummaries(rows), [rows])
  const cellSuccess = rows.filter((row) => row.status === 'success').length
  const cellNonScore = rows.filter((row) => row.status === 'non_score_record').length
  const cellError = rows.filter(
    (row) => row.status !== 'success' && row.status !== 'not_applicable' && row.status !== 'non_score_record'
  ).length

  const matrixColumns = useMemo(() => {
    if (!detection) return []
    return detection.projectGroups.map((group) => {
      const overrideId = groupOverrides[group.mappingId]
      const overrideName = selectedStandard?.items.find((item) => item.id === overrideId)?.name
      return {
        mappingId: group.mappingId,
        columnIndex: group.resultColumnIndex,
        matchedItemName: overrideName || group.detected.matchedItemName || snapshot?.columns[group.projectColumnIndex ?? group.resultColumnIndex]?.title || '成绩'
      }
    })
  }, [detection, groupOverrides, selectedStandard, snapshot])

  function applySnapshot(standard: ExamStandard, loaded: ExamSheetSnapshot): void {
    const next = detectWorkbookColumns(
      loaded.columns.map((column) => column.title),
      standard,
      loaded.rows
    )
    setDetection(next)
    setSnapshot(loaded)
    setRows([])
    setStep('detect')
    const confirmed: Record<number, string> = {}
    for (const group of next.projectGroups) {
      if (group.detected.matchType === 'ambiguous' && group.detected.matchedItemId) {
        confirmed[group.resultColumnIndex] = group.detected.matchedItemId
      }
    }
    setConfirmedColumns(confirmed)
    const seeded: Record<string, string> = {}
    if (initialItemId) {
      const unknownGeneric = next.projectGroups.find(
        (group) => group.projectColumnIndex === null && !columnAutoConfirmed(group.detected) && !group.mixedLabels
      )
      if (unknownGeneric && next.projectGroups.filter((group) => !columnAutoConfirmed(group.detected) && !group.mixedLabels).length === 1) {
        seeded[unknownGeneric.mappingId] = initialItemId
      }
    }
    setGroupOverrides(seeded)
  }

  async function handlePick(): Promise<void> {
    setError(null)
    if (!selectedStandard) {
      setError('请先选择城市和规则版本')
      return
    }
    try {
      const picked = await window.electronAPI.examBatch.pick()
      if (picked.canceled) return
      setSessionId(picked.sessionId)
      setFileName(picked.fileName)
      setSheets(picked.sheets)
      const preferred = picked.sheets.includes(EXAM_TEMPLATE_SCORE_SHEET)
        ? EXAM_TEMPLATE_SCORE_SHEET
        : (picked.sheets[0] ?? '')
      setSheetName(preferred)
      if (preferred) {
        setBusy(true)
        const loaded = coerceExamSnapshot(await window.electronAPI.examBatch.loadSheet(picked.sessionId, preferred))
        applySnapshot(selectedStandard, loaded)
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '无法选择文件')
    } finally {
      setBusy(false)
    }
  }

  async function handleLoadSheet(): Promise<void> {
    if (!selectedStandard) return
    setBusy(true)
    try {
      const loaded = coerceExamSnapshot(await window.electronAPI.examBatch.loadSheet(sessionId, sheetName))
      applySnapshot(selectedStandard, loaded)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '无法读取工作表')
    } finally {
      setBusy(false)
    }
  }

  function handleConvert(): void {
    if (!selectedStandard || !snapshot || !detection) return
    if (detection.projectGroups.some((group) => group.detected.matchType === 'ambiguous' && !group.mixedLabels && !groupOverrides[group.mappingId] && !confirmedColumns[group.resultColumnIndex])) {
      setError('请先确认有歧义的项目列')
      return
    }
    if (
      detection.projectGroups.some(
        (group) =>
          !group.mixedLabels &&
          !columnAutoConfirmed(group.detected) &&
          group.detected.matchType !== 'ambiguous' &&
          !groupOverrides[group.mappingId]
      ) &&
      detection.projectGroups.every((group) => !columnAutoConfirmed(group.detected) && !group.mixedLabels)
    ) {
      setError('请确认成绩列对应的考试项目')
      return
    }
    setError(null)
    const converted = convertWorkbookExamBatch(selectedStandard, snapshot, detection, {
      confirmedColumns,
      groupOverrides
    })
    setRows(converted.rows)
    setStep('result')
  }

  async function handleExport(): Promise<void> {
    if (!selectedStandard || !snapshot || !detection) return
    const regionName = selectedStandard.examType === 'gaokao_sports' ? '广东省' : selectedStandard.cityName
    const hasAuto = rows.some((row) => row.status === 'success')
    try {
      await window.electronAPI.examBatch.export({
        mode: 'workbook',
        layout: 'wide',
        rows,
        snapshot,
        scoreColumnIndexes: matrixColumns.map((column) => column.columnIndex),
        cityName: regionName,
        versionLabel: selectedStandard.schemeLabel || selectedStandard.policyLabel,
        credibility: hasAuto ? AUTO_SCORE_CREDIBILITY : NO_AUTO_SCORE_CREDIBILITY,
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
          fileBaseName: fileName || '成绩'
        }
      })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '导出失败')
    }
  }

  const confirmedItemCount = detection
    ? detection.projectGroups.filter(
        (group) =>
          group.mixedLabels ||
          columnAutoConfirmed(group.detected) ||
          Boolean(groupOverrides[group.mappingId]) ||
          Boolean(confirmedColumns[group.resultColumnIndex])
      ).length
    : 0

  return (
    <PageLayout className="page--exams">
      <PageHeader
        icon="exams"
        title="Excel 批量评分工作台"
        description="选择城市和规则版本后导入 Excel。系统自动识别多个体育项目并逐格换算，不会写入学生档案，也不会覆盖原文件。"
        actions={
          <button type="button" className="btn" onClick={onBack}>
            返回评分标准
          </button>
        }
      />
      <ol className="exam-batch-steps">
        <li className={step === 'setup' ? 'is-active' : ''}>① 选择城市/版本</li>
        <li className={step === 'detect' ? 'is-active' : ''}>② 识别项目</li>
        <li className={step === 'result' ? 'is-active' : ''}>③ 换算结果</li>
      </ol>
      {error ? <p className="page-error">{error}</p> : null}

      <div className="exam-detail">
        <h3>选择城市和规则版本</h3>
        <div className="toolbar">
          <label className="toolbar-field">
            考试类型
            <select
              value={examType}
              onChange={(event) => {
                const next = event.target.value as ExamType
                setExamType(next)
                setStandardId('')
                if (next === 'gaokao_sports') setCitySlug('')
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
              城市
              <select
                value={citySlug}
                onChange={(event) => {
                  setCitySlug(event.target.value)
                  setStandardId('')
                  setRows([])
                  setDetection(null)
                }}
              >
                <option value="">请选择城市</option>
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
            规则版本
            <select
              value={selectedStandard?.id ?? ''}
              onChange={(event) => {
                setStandardId(event.target.value)
                setRows([])
                setDetection(null)
              }}
              disabled={typeStandards.length === 0}
            >
              {typeStandards.length === 0 ? <option value="">请先选择城市</option> : null}
              {typeStandards.length > 1 ? <option value="">请选择规则版本</option> : null}
              {typeStandards.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.schemeLabel || item.policyLabel}（{yearLabel(item)}）
                </option>
              ))}
            </select>
          </label>
        </div>
        {selectedStandard && selectedStandard.scoreTableStatus !== 'verified' ? (
          <p className="page-error">{MISSING_TABLE_HINT}</p>
        ) : null}
        <p className="exam-notes">城市必须由老师明确选择。不会根据 Excel 猜测城市，也不会套用其他城市评分表。</p>
      </div>

      <div className="exam-detail">
        <h3>导入 Excel</h3>
        <p className="exam-notes">支持 .xlsx / .xls。一份表可含多个项目列。班级、备注、总分等列会忽略，不阻止导入。</p>
        <div className="toolbar">
          <button type="button" className="btn btn-primary" onClick={() => void handlePick()} disabled={!selectedStandard || busy}>
            选择 Excel
          </button>
          <span className="import-file-name">{fileName || '尚未选择文件'}</span>
        </div>
        {sheets.length > 1 ? (
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
            <button type="button" className="btn" onClick={() => void handleLoadSheet()} disabled={busy || !sheetName}>
              读取该表
            </button>
          </div>
        ) : null}
      </div>

      {step !== 'setup' && snapshot && detection && selectedStandard ? (
        <div className="exam-detail">
          <h3>Excel 识别结果</h3>
          <p>
            学生 {snapshot.rows.length} 人。基础字段：
            {detection.mapping.columns.some((role) => role.kind === 'studentName') ? ' ✓ 姓名' : ' 缺少姓名'}
            {detection.mapping.columns.some((role) => role.kind === 'studentNo') ? ' ✓ 学号' : ''}
            {detection.mapping.columns.some((role) => role.kind === 'gender') ? ' ✓ 性别' : ' 缺少性别'}
          </p>
          <p>已识别 {confirmedItemCount} 个项目：</p>
          <ul className="exam-notes">
            {detection.projectGroups.map((group) => {
              const header =
                snapshot.columns[group.projectColumnIndex ?? group.resultColumnIndex]?.title ?? group.detected.originalHeader
              const selectedId = groupOverrides[group.mappingId] ?? ''
              const autoName = group.detected.matchedItemName || header
              return (
                <li key={group.mappingId}>
                  {group.mixedLabels
                    ? `${header}（按行识别）`
                    : group.detected.matchType === 'gender-derived'
                      ? `${autoName}（男1000 / 女800）`
                      : autoName}
                  {group.detected.genderScope === 'male' ? '（男）' : group.detected.genderScope === 'female' ? '（女）' : ''}
                  {' · '}
                  {columnStatusText(group.detected.autoScoreSupported, group.detected.matchType, group.detected.reason, group.mixedLabels)}
                  <select
                    value={selectedId}
                    onChange={(event) => setGroupOverrides(updateProjectGroupOverride(groupOverrides, group.mappingId, event.target.value))}
                  >
                    <option value="">{group.mixedLabels || columnAutoConfirmed(group.detected) ? '使用自动识别' : '请选择项目'}</option>
                    {selectedStandard.items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </li>
              )
            })}
            {detection.ignoredColumns.map((column) => (
              <li key={`ig-${column.index}`}>
                未知列“{column.header}” · {column.reason}
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-primary" onClick={handleConvert} disabled={!detection.identityReady}>
            开始批量换算
          </button>
        </div>
      ) : null}

      {step === 'result' ? (
        <div className="exam-converter">
          <h3>换算结果</h3>
          <dl className="exam-summary-bar">
            <div>
              <dt>学生人数</dt>
              <dd>{students.length}</dd>
            </div>
            <div>
              <dt>识别项目数</dt>
              <dd>{matrixColumns.length}</dd>
            </div>
            <div>
              <dt>成功换算数</dt>
              <dd>{cellSuccess} 格</dd>
            </div>
            <div>
              <dt>缺考/免考</dt>
              <dd>{cellNonScore} 格</dd>
            </div>
            <div>
              <dt>真正异常</dt>
              <dd>{cellError} 格</dd>
            </div>
          </dl>
          <p className="exam-notes">
            {itemSummaries
              .map((item) => {
                const extra = [
                  item.nonScore ? `${item.nonScore}缺考/免考` : '',
                  item.error ? `${item.error}异常` : ''
                ].filter(Boolean)
                return `${item.name} ${item.total}条 / ${item.success}成功${extra.length ? ` / ${extra.join(' / ')}` : ''}`
              })
              .join('；')}
          </p>
          <div className="toolbar">
            <button type="button" className="btn btn-primary" onClick={() => void handleExport()}>
              导出评分结果
            </button>
            <span className="exam-notes">默认 {singleItemExportFileName(fileName || '成绩')}</span>
          </div>
          <div className="import-preview-wrap exam-matrix-wrap">
            <table className="data-table import-preview-table">
              <thead>
                <tr>
                  <th>姓名</th>
                  <th>学号</th>
                  <th>性别</th>
                  <th>项目概况</th>
                  {matrixColumns.map((column) => (
                    <th key={column.mappingId} colSpan={2}>
                      {column.matchedItemName}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th></th>
                  <th></th>
                  <th></th>
                  <th></th>
                  {matrixColumns.map((column) => (
                    <th key={`${column.mappingId}-sub`} colSpan={2}>
                      原始 / 得分
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr
                    key={student.sourceRow}
                    className={student.errorCount > 0 ? 'import-row--error' : ''}
                    onClick={() => setExpandedRow(expandedRow === student.sourceRow ? null : student.sourceRow)}
                  >
                    <td>{student.studentName}</td>
                    <td>{student.studentNo}</td>
                    <td>{genderCell(student.gender)}</td>
                    <td>
                      {student.successCount} 项成功
                      {student.nonScoreCount > 0 ? ` / ${student.nonScoreCount} 项缺考/免考` : ''}
                      {student.errorCount > 0 ? ` / ${student.errorCount} 项异常` : ''}
                    </td>
                    {matrixColumns.map((column) => {
                      const cell = student.cells.find((entry) => entry.sourceColumn === column.columnIndex)
                      if (!cell || cell.status === 'not_applicable') {
                        return (
                          <td key={column.mappingId} colSpan={2}>
                            —
                          </td>
                        )
                      }
                      return (
                        <td key={column.mappingId} colSpan={2}>
                          {cell.rawValueOriginal} /{' '}
                          {cell.status === 'success' ? (cell.score ?? '') : cell.status === 'non_score_record' ? '' : '异常'}
                          {expandedRow === student.sourceRow && cell.message ? `（${cell.message}）` : ''}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </PageLayout>
  )
}
