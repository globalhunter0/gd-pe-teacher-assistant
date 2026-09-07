import { useMemo, useState } from 'react'
import {
  BUILTIN_EXAM_STANDARDS,
  calculateExamScore,
  EXAM_GENDER_LABELS,
  EXAM_ITEM_VERIFICATION_LABELS,
  EXAM_STATUS_LABELS,
  EXAM_TYPE_LABELS,
  formatExamRawValue,
  GD_CITIES,
  itemAppliesToGender,
  itemSupportsAutoScore,
  OFFICIAL_SCORE_UNAVAILABLE,
  OFFICIAL_SCORE_UNSUPPORTED,
  parseExamPerformanceInput,
  SCORE_MODE_LABELS,
  verifiedStandardsForCity,
  type ExamGender,
  type ExamItemDefinition,
  type ExamStandard,
  type ExamType
} from '@shared/examStandard'
import { testUnitDisplay } from '@shared/peTest'

const DIRECTION_LABEL = {
  higherBetter: '越高越好',
  lowerBetter: '越低越好'
} as const

function formatYearRange(standard: ExamStandard): string {
  return standard.yearFrom === standard.yearTo
    ? String(standard.yearFrom)
    : `${standard.yearFrom}–${standard.yearTo}`
}

function tableEntryCount(item: ExamItemDefinition): number {
  return item.scoreRule.kind === 'thresholdTable' ? item.scoreRule.entries.length : 0
}

function scoreModeDisplay(item: ExamItemDefinition, examType: ExamType): string {
  if (item.scoreRule.kind !== 'thresholdTable') {
    return '当前版本暂不支持自动换算'
  }
  if (examType === 'gaokao_sports' && item.scoreRule.scoreMode === 'step') {
    return '介于两档取较低分'
  }
  return SCORE_MODE_LABELS[item.scoreRule.scoreMode]
}

export default function ExamStandardsPage(): React.JSX.Element {
  const standards = BUILTIN_EXAM_STANDARDS
  const [examType, setExamType] = useState<ExamType>('middle_school_exam')
  const [citySlug, setCitySlug] = useState(GD_CITIES[0].citySlug)
  const [standardId, setStandardId] = useState('')
  const [gender, setGender] = useState<Exclude<ExamGender, 'all'>>('male')
  const [itemId, setItemId] = useState('')
  const [scoreInput, setScoreInput] = useState('')
  const [convertError, setConvertError] = useState<string | null>(null)
  const [convertResult, setConvertResult] = useState<ReturnType<typeof calculateExamScore> | null>(null)

  const cityStandards = useMemo(() => {
    if (examType === 'gaokao_sports') {
      return standards.filter((item) => item.examType === 'gaokao_sports')
    }
    return standards.filter((item) => item.examType === 'middle_school_exam' && item.citySlug === citySlug)
  }, [examType, citySlug, standards])

  const verifiedCityStandards = useMemo(
    () => (examType === 'middle_school_exam' ? verifiedStandardsForCity(standards, citySlug) : cityStandards.filter((item) => item.status === 'verified')),
    [examType, citySlug, cityStandards, standards]
  )

  const selectedStandard = cityStandards.find((item) => item.id === standardId) ?? cityStandards[0] ?? null

  const visibleItems = selectedStandard
    ? selectedStandard.items.filter((item) => itemAppliesToGender(item, gender))
    : []
  const selectedItem = visibleItems.find((item) => item.id === itemId) ?? visibleItems[0] ?? null
  const canAutoScore = selectedItem ? itemSupportsAutoScore(selectedItem) : false

  function handleConvert(): void {
    setConvertError(null)
    setConvertResult(null)
    if (!selectedStandard || selectedStandard.status !== 'verified' || !selectedItem) {
      setConvertError(OFFICIAL_SCORE_UNAVAILABLE)
      return
    }
    if (selectedItem.scoreRule.kind === 'unsupported') {
      setConvertError(OFFICIAL_SCORE_UNSUPPORTED)
      return
    }
    if (!canAutoScore) {
      setConvertError(OFFICIAL_SCORE_UNAVAILABLE)
      return
    }

    try {
      const rawValue = parseExamPerformanceInput(scoreInput, selectedItem)
      const result = calculateExamScore({
        standard: selectedStandard,
        itemId: selectedItem.id,
        rawValue,
        gender,
        officialOnly: true
      })
      if (!result.ok) {
        setConvertError(result.message)
        return
      }
      setConvertResult(result)
    } catch (error) {
      setConvertError(error instanceof Error ? error.message : '成绩不正确')
    }
  }

  return (
    <section className="page page--exams">
      <div className="page-heading">
        <h2>体育考试评分标准中心</h2>
        <p>先选城市、年份和考试类型，再查看官方评分表。正式换算只使用已核验数据，不会猜测分数。</p>
      </div>

      <div className="exam-tabs" role="tablist">
        <button
          type="button"
          className={examType === 'middle_school_exam' ? 'btn btn-primary' : 'btn'}
          onClick={() => {
            setExamType('middle_school_exam')
            setStandardId('')
            setItemId('')
            setConvertResult(null)
            setConvertError(null)
          }}
        >
          {EXAM_TYPE_LABELS.middle_school_exam}
        </button>
        <button
          type="button"
          className={examType === 'gaokao_sports' ? 'btn btn-primary' : 'btn'}
          onClick={() => {
            setExamType('gaokao_sports')
            setStandardId('')
            setItemId('')
            setConvertResult(null)
            setConvertError(null)
          }}
        >
          {EXAM_TYPE_LABELS.gaokao_sports}
        </button>
      </div>

      {examType === 'middle_school_exam' ? (
        <p className="exam-notes">
          路径：城市 → 年份/政策版本 → 中考体育。当前已核验中考标准{' '}
          {standards.filter((item) => item.examType === 'middle_school_exam' && item.status === 'verified').length} 份。
        </p>
      ) : (
        <p className="exam-notes">路径：体育高考 → 广东省 → 2026。基本素质①、基本素质②、专项基础按官方组合列出。</p>
      )}

      {examType === 'middle_school_exam' ? (
        <div className="toolbar">
          <label className="toolbar-field">
            城市
            <select
              value={citySlug}
              onChange={(event) => {
                setCitySlug(event.target.value)
                setStandardId('')
                setItemId('')
                setConvertResult(null)
                setConvertError(null)
              }}
            >
              {GD_CITIES.map((city) => (
                <option key={city.citySlug} value={city.citySlug}>
                  {city.cityName}
                </option>
              ))}
            </select>
          </label>
          <label className="toolbar-field">
            年份 / 政策版本
            <select
              value={selectedStandard?.id ?? ''}
              onChange={(event) => {
                setStandardId(event.target.value)
                setItemId('')
                setConvertResult(null)
              }}
              disabled={cityStandards.length === 0}
            >
              {cityStandards.length === 0 ? <option value="">暂无版本</option> : null}
              {cityStandards.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.policyLabel}（{EXAM_STATUS_LABELS[item.status]}）
                </option>
              ))}
            </select>
          </label>
          <label className="toolbar-field">
            性别
            <select
              value={gender}
              onChange={(event) => {
                setGender(event.target.value as Exclude<ExamGender, 'all'>)
                setItemId('')
                setConvertResult(null)
              }}
            >
              <option value="male">{EXAM_GENDER_LABELS.male}</option>
              <option value="female">{EXAM_GENDER_LABELS.female}</option>
            </select>
          </label>
        </div>
      ) : (
        <div className="toolbar">
          <label className="toolbar-field">
            地区
            <select disabled>
              <option>广东省</option>
            </select>
          </label>
          <label className="toolbar-field">
            年份 / 版本
            <select
              value={selectedStandard?.id ?? ''}
              onChange={(event) => setStandardId(event.target.value)}
              disabled={cityStandards.length === 0}
            >
              {cityStandards.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.policyLabel}（{EXAM_STATUS_LABELS[item.status]}）
                </option>
              ))}
            </select>
          </label>
          <label className="toolbar-field">
            性别
            <select
              value={gender}
              onChange={(event) => {
                setGender(event.target.value as Exclude<ExamGender, 'all'>)
                setItemId('')
                setConvertResult(null)
              }}
            >
              <option value="male">{EXAM_GENDER_LABELS.male}</option>
              <option value="female">{EXAM_GENDER_LABELS.female}</option>
            </select>
          </label>
        </div>
      )}

      {verifiedCityStandards.length === 0 && examType === 'middle_school_exam' ? (
        <div className="empty-panel">
          <p className="empty-title">暂无已核验评分标准</p>
          <p className="empty-text">
            {GD_CITIES.find((item) => item.citySlug === citySlug)?.cityName}目前没有已核验的完整官方评分表。不会生成猜测分数。
          </p>
        </div>
      ) : null}

      {selectedStandard ? (
        <div className="exam-detail">
          <h3>{selectedStandard.title}</h3>
          <p className={selectedStandard.status === 'verified' ? 'exam-status exam-status--verified' : 'exam-status exam-status--draft'}>
            状态：{EXAM_STATUS_LABELS[selectedStandard.status]}
            {selectedStandard.status !== 'verified' ? '（不可用于正式换算）' : '（已核验）'}
          </p>
          <dl className="exam-meta">
            <div>
              <dt>适用年份</dt>
              <dd>{formatYearRange(selectedStandard)}</dd>
            </div>
            <div>
              <dt>发布机关</dt>
              <dd>{selectedStandard.sourceAuthority || '尚未录入'}</dd>
            </div>
            <div>
              <dt>官方来源</dt>
              <dd>
                {selectedStandard.sourceTitle || '尚未录入'}
                {selectedStandard.sourceUrl ? (
                  <>
                    <br />
                    <span className="exam-source-url">{selectedStandard.sourceUrl}</span>
                  </>
                ) : (
                  <>
                    <br />
                    无来源链接，不能标记为已核验
                  </>
                )}
              </dd>
            </div>
            <div>
              <dt>政策文件</dt>
              <dd>
                {selectedStandard.policySourceTitle || '尚未录入'}
                {selectedStandard.policySourceUrl ? (
                  <>
                    <br />
                    <span className="exam-source-url">{selectedStandard.policySourceUrl}</span>
                  </>
                ) : null}
              </dd>
            </div>
          </dl>
          {selectedStandard.notes ? <p className="exam-notes">{selectedStandard.notes}</p> : null}

          {selectedStandard.components.length > 0 ? (
            <div className="exam-structure">
              <h4>考试结构</h4>
              <ul>
                {selectedStandard.components.map((item) => (
                  <li key={item.id}>
                    {item.title}
                    {item.maxScore > 0 ? `（${item.maxScore} 分）` : '（官方分值待转录）'}
                  </li>
                ))}
              </ul>
              {selectedStandard.components.some((item) => item.groupIds.length === 0) ? (
                <p className="exam-notes">没有列出具体项目的构成，表示官方附件尚未逐项转录，系统不会按旧年度规则猜测组合或分数。</p>
              ) : null}
            </div>
          ) : null}

          {selectedStandard.groups.map((group) => {
            const groupItems = visibleItems.filter((item) => group.itemIds.includes(item.id))
            if (groupItems.length === 0) {
              return null
            }
            return (
              <div key={group.id} className="exam-group">
                <h4>{group.title}</h4>
                <div className="exam-item-list">
                  {groupItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={selectedItem?.id === item.id ? 'exam-item-btn exam-item-btn--active' : 'exam-item-btn'}
                      onClick={() => {
                        setItemId(item.id)
                        setConvertResult(null)
                        setConvertError(null)
                      }}
                    >
                      {item.name}
                      {item.verification === 'verified_unsupported' ? '（暂不支持换算）' : ''}
                      {item.verification === 'unverified' ? '（评分表未转录）' : ''}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}

          {selectedItem ? (
            <div className="exam-item-detail">
              <h4>项目详情</h4>
              <dl className="exam-meta">
                <div>
                  <dt>项目名称</dt>
                  <dd>{selectedItem.name}</dd>
                </div>
                <div>
                  <dt>最高分</dt>
                  <dd>{selectedItem.maxScore}</dd>
                </div>
                <div>
                  <dt>适用性别</dt>
                  <dd>{EXAM_GENDER_LABELS[selectedItem.gender]}</dd>
                </div>
                <div>
                  <dt>原始成绩单位</dt>
                  <dd>{testUnitDisplay(selectedItem.unit, selectedItem.customUnitLabel)}</dd>
                </div>
                <div>
                  <dt>成绩方向</dt>
                  <dd>{DIRECTION_LABEL[selectedItem.direction]}</dd>
                </div>
                <div>
                  <dt>评分方式</dt>
                  <dd>{scoreModeDisplay(selectedItem, examType)}</dd>
                </div>
                <div>
                  <dt>自动换算状态</dt>
                  <dd>{EXAM_ITEM_VERIFICATION_LABELS[selectedItem.verification]}</dd>
                </div>
                <div>
                  <dt>官方PDF页码</dt>
                  <dd>{selectedItem.sourcePage ? `第 ${selectedItem.sourcePage} 页` : '未标注'}</dd>
                </div>
                <div>
                  <dt>官方来源</dt>
                  <dd>{selectedStandard.sourceTitle}</dd>
                </div>
                <div>
                  <dt>适用年份</dt>
                  <dd>{formatYearRange(selectedStandard)}</dd>
                </div>
              </dl>
              {selectedItem.scoreRule.kind === 'unsupported' ? (
                <p className="page-error">{OFFICIAL_SCORE_UNSUPPORTED}</p>
              ) : selectedItem.scoreRule.entries.length > 0 ? (
                <div className="data-table-wrap exam-score-table">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>分数</th>
                        <th>成绩阈值（{testUnitDisplay(selectedItem.unit, selectedItem.customUnitLabel)}）</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItem.scoreRule.entries.map((entry, index) => (
                        <tr key={`${entry.score}-${entry.threshold}-${index}`}>
                          <td>{entry.score}</td>
                          <td>{formatExamRawValue(entry.threshold, selectedItem)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="exam-notes">官方评分表共 {tableEntryCount(selectedItem)} 档。空单元格未补录。</p>
                </div>
              ) : (
                <p className="exam-notes">该项目尚未录入官方评分档，不能换算。</p>
              )}
            </div>
          ) : (
            <p className="exam-notes">本标准尚未录入项目评分表。</p>
          )}
        </div>
      ) : examType === 'gaokao_sports' ? (
        <div className="empty-panel">
          <p className="empty-title">暂无已核验评分标准</p>
          <p className="empty-text">广东省普通高校体育类专业省统考入口已建立，完整官方评分表尚未核验录入。</p>
        </div>
      ) : null}

      <div className="exam-converter">
        <h3>成绩换算器</h3>
        <p className="exam-notes">正式换算只使用已核验标准。时间成绩可输入 3:45、3'45 或总秒数。</p>
        <div className="toolbar">
          <label className="toolbar-field">
            项目
            <select
              value={selectedItem?.id ?? ''}
              onChange={(event) => {
                setItemId(event.target.value)
                setConvertResult(null)
                setConvertError(null)
              }}
              disabled={!selectedItem}
            >
              {visibleItems.length === 0 ? <option value="">暂无项目</option> : null}
              {visibleItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="toolbar-field">
            成绩
            <input
              value={scoreInput}
              onChange={(event) => setScoreInput(event.target.value)}
              placeholder="例如 3:45"
              disabled={!canAutoScore}
            />
          </label>
          <button type="button" className="btn btn-primary" onClick={handleConvert} disabled={!selectedItem}>
            换算
          </button>
        </div>
        {convertError ? <p className="page-error">{convertError}</p> : null}
        {convertResult && convertResult.ok ? (
          <dl className="exam-meta">
            <div>
              <dt>原始成绩</dt>
              <dd>{scoreInput}</dd>
            </div>
            <div>
              <dt>标准化成绩</dt>
              <dd>{convertResult.formattedRawValue}</dd>
            </div>
            <div>
              <dt>对应分数</dt>
              <dd>
                {convertResult.score} / {convertResult.maxScore}
              </dd>
            </div>
            <div>
              <dt>标准名称</dt>
              <dd>{convertResult.standardTitle}</dd>
            </div>
            <div>
              <dt>标准年份</dt>
              <dd>{convertResult.policyLabel}</dd>
            </div>
            <div>
              <dt>标准状态</dt>
              <dd>{EXAM_STATUS_LABELS[convertResult.status]}</dd>
            </div>
            <div>
              <dt>官方来源</dt>
              <dd>
                {convertResult.sourceTitle}
                {convertResult.sourceUrl ? (
                  <>
                    <br />
                    {convertResult.sourceUrl}
                  </>
                ) : null}
              </dd>
            </div>
          </dl>
        ) : null}
      </div>
    </section>
  )
}
