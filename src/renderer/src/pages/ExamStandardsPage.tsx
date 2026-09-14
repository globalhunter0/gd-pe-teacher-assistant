import { useMemo, useState } from 'react'
import PageLayout, { PageHeader } from '../components/PageLayout'
import TechEmptyState from '../components/workspace/TechEmptyState'
import {
  BUILTIN_EXAM_STANDARDS,
  calculateExamScore,
  CITY_COVERAGE_LABELS,
  EXAM_CANDIDATE_GROUP_LABELS,
  EXAM_GENDER_LABELS,
  EXAM_ITEM_VERIFICATION_LABELS,
  EXAM_STATUS_LABELS,
  EXAM_TYPE_LABELS,
  formatExamRawValue,
  GD_CITIES,
  itemAppliesToGender,
  itemSupportsAutoScore,
  listGuangdongCityCoverage,
  OFFICIAL_SCORE_UNAVAILABLE,
  OFFICIAL_SCORE_UNSUPPORTED,
  parseExamPerformanceInput,
  SCORE_MODE_LABELS,
  standardAllowsOfficialConvert,
  verifiedStandardsForCity,
  type CityCoverageStatus,
  type ExamGender,
  type ExamItemDefinition,
  type ExamStandard,
  type ExamType
} from '@shared/examStandard'
import { testUnitDisplay } from '@shared/peTest'
import {
  NATIONAL_FITNESS_BELOW_OFFICIAL_MINIMUM,
  nationalFitnessBelowOfficialMinimumMessage,
  NATIONAL_FITNESS_FAMILY_LABEL,
  NATIONAL_FITNESS_SCORE_TABLE_MISSING,
  NATIONAL_FITNESS_SCORE_TABLE_VERIFIED,
  NATIONAL_STUDENT_FITNESS_FAMILY,
  NATIONAL_FITNESS_STAGE_OPTIONS,
  findOfficialNationalFitnessBonusTable,
  findOfficialNationalFitnessScoreTable,
  formatNationalFitnessTableValue,
  calculateNationalFitnessScore,
  getNationalFitness2014,
  gradesForStage,
  listNationalFitnessBmiSourceItems,
  listNationalFitnessEvaluationItems,
  nationalFitnessAllowsOfficialConvert,
  nationalLabelForGrade,
  stageForGrade,
  summarizeNationalFitnessCompleteness,
  type NationalStudentFitnessFamily
} from '@shared/nationalFitness'
import type { Grade, SchoolStage } from '@shared/class'

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

const CONVERT_TABLE_HINT = '该城市/年度评分表尚未完整核验，暂不支持自动换算。'
const QUICK_CITY_SLUGS = ['guangzhou', 'shenzhen', 'dongguan', 'jiangmen', 'zhanjiang', 'zhongshan'] as const

type CoverageGroup = 'verified' | 'partial' | 'unverified'
type StandardsBrowseTab = ExamType | NationalStudentFitnessFamily

function coverageGroup(coverage: CityCoverageStatus): CoverageGroup {
  if (coverage === 'verified') {
    return 'verified'
  }
  if (coverage === 'partial' || coverage === 'scheme_verified') {
    return 'partial'
  }
  return 'unverified'
}

function coverageChipLabel(coverage: CityCoverageStatus): string {
  return CITY_COVERAGE_LABELS[coverage]
}

function ruleStatusShort(standard: ExamStandard): string {
  if (standard.ruleStatus === 'verified') {
    return '已核验'
  }
  if (standard.ruleStatus === 'partial') {
    return '部分核验'
  }
  return '草稿'
}

function scoreTableStatusShort(standard: ExamStandard): string {
  if (standard.scoreTableStatus === 'verified') {
    return '已核验'
  }
  if (standard.scoreTableStatus === 'partial') {
    return '部分核验'
  }
  return '待完整核验'
}

function statusToneClass(kind: 'ok' | 'partial' | 'muted'): string {
  if (kind === 'ok') {
    return 'exam-status-text exam-status-text--ok'
  }
  if (kind === 'partial') {
    return 'exam-status-text exam-status-text--partial'
  }
  return 'exam-status-text exam-status-text--muted'
}

export default function ExamStandardsPage({
  embedded = false,
  onOpenTools
}: {
  embedded?: boolean
  onOpenTools?: () => void
} = {}): React.JSX.Element {
  const standards = BUILTIN_EXAM_STANDARDS
  const nationalFitness = getNationalFitness2014()
  const [browseTab, setBrowseTab] = useState<StandardsBrowseTab>('middle_school_exam')
  const [citySlug, setCitySlug] = useState('foshan')
  const [coverageGroups, setCoverageGroups] = useState<CoverageGroup[]>(['verified', 'partial'])
  const [cityQuery, setCityQuery] = useState('')
  const [showAllCoverage, setShowAllCoverage] = useState(false)
  const [standardId, setStandardId] = useState('')
  const [gender, setGender] = useState<Exclude<ExamGender, 'all'>>('male')
  const [nationalStage, setNationalStage] = useState<SchoolStage>('junior')
  const [nationalGrade, setNationalGrade] = useState<Grade>('初一')
  const [nationalItemKey, setNationalItemKey] = useState('bmi')
  const [nationalRawInput, setNationalRawInput] = useState('')
  const [nationalScoreError, setNationalScoreError] = useState<string | null>(null)
  const [nationalScoreResult, setNationalScoreResult] = useState<ReturnType<typeof calculateNationalFitnessScore> | null>(null)
  const [itemId, setItemId] = useState('')
  const [scoreInput, setScoreInput] = useState('')
  const [convertError, setConvertError] = useState<string | null>(null)
  const [convertResult, setConvertResult] = useState<ReturnType<typeof calculateExamScore> | null>(null)

  const cityStandards = useMemo(() => {
    if (browseTab === NATIONAL_STUDENT_FITNESS_FAMILY) {
      return []
    }
    if (browseTab === 'gaokao_sports') {
      return standards.filter((item) => item.examType === 'gaokao_sports')
    }
    return standards.filter((item) => item.examType === 'middle_school_exam' && item.citySlug === citySlug)
  }, [browseTab, citySlug, standards])

  const verifiedCityStandards = useMemo(
    () =>
      browseTab === 'middle_school_exam'
        ? verifiedStandardsForCity(standards, citySlug)
        : cityStandards.filter((item) => item.status === 'verified'),
    [browseTab, citySlug, cityStandards, standards]
  )

  const coverageRows = useMemo(() => listGuangdongCityCoverage(standards), [standards])
  const highlightedCoverage = useMemo(
    () => coverageRows.filter((row) => coverageGroups.includes(coverageGroup(row.coverage))),
    [coverageGroups, coverageRows]
  )
  const cityOptions = useMemo(() => {
    const query = cityQuery.trim()
    const filtered =
      query === ''
        ? GD_CITIES
        : GD_CITIES.filter(
            (city) => city.cityName.includes(query) || city.citySlug.includes(query.toLowerCase())
          )
    if (filtered.some((city) => city.citySlug === citySlug)) {
      return filtered
    }
    const current = GD_CITIES.find((city) => city.citySlug === citySlug)
    return current ? [current, ...filtered] : filtered
  }, [cityQuery, citySlug])
  const allCoverageSelected = coverageGroups.length === 3
  const selectedCityName = GD_CITIES.find((city) => city.citySlug === citySlug)?.cityName ?? citySlug

  function selectCity(nextSlug: string): void {
    setCitySlug(nextSlug)
    setStandardId('')
    setItemId('')
    setConvertResult(null)
    setConvertError(null)
  }

  const selectedStandard = cityStandards.find((item) => item.id === standardId) ?? cityStandards[0] ?? null
  const officialConvertAllowed = selectedStandard ? standardAllowsOfficialConvert(selectedStandard) : false

  const visibleItems = selectedStandard
    ? selectedStandard.items.filter((item) => itemAppliesToGender(item, gender))
    : []
  const selectedItem = visibleItems.find((item) => item.id === itemId) ?? visibleItems[0] ?? null
  const canAutoScore = selectedItem ? itemSupportsAutoScore(selectedItem) : false

  const nationalBmiSources = useMemo(
    () => listNationalFitnessBmiSourceItems(nationalGrade, gender),
    [nationalGrade, gender]
  )
  const nationalEvalItems = useMemo(
    () => listNationalFitnessEvaluationItems(nationalGrade, gender),
    [nationalGrade, gender]
  )
  const nationalVisibleItems = useMemo(
    () => [...nationalBmiSources, ...nationalEvalItems],
    [nationalBmiSources, nationalEvalItems]
  )
  const selectedNationalItem =
    nationalVisibleItems.find((item) => item.itemKey === nationalItemKey) ?? nationalEvalItems[0] ?? null
  const selectedNationalTable = selectedNationalItem
    ? findOfficialNationalFitnessScoreTable({
        grade: nationalGrade,
        gender,
        itemId: selectedNationalItem.itemKey
      })
    : undefined
  const selectedNationalBonusTable = selectedNationalItem
    ? findOfficialNationalFitnessBonusTable({
        grade: nationalGrade,
        gender,
        itemId: selectedNationalItem.itemKey
      })
    : undefined
  const selectedNationalVerified = selectedNationalTable?.verificationStatus === 'verified' && selectedNationalTable.source !== null
  const nationalCompleteness = useMemo(() => summarizeNationalFitnessCompleteness(), [])

  function handleNationalConvert(): void {
    setNationalScoreError(null)
    setNationalScoreResult(null)
    if (!selectedNationalItem || selectedNationalItem.role === 'bmi-source') {
      setNationalScoreError(NATIONAL_FITNESS_SCORE_TABLE_MISSING)
      return
    }
    if (!selectedNationalVerified) {
      setNationalScoreError(NATIONAL_FITNESS_SCORE_TABLE_MISSING)
      return
    }
    const result = calculateNationalFitnessScore({
      grade: nationalGrade,
      gender,
      itemId: selectedNationalItem.itemKey,
      rawInput: nationalRawInput
    })
    if (!result.ok && result.code !== NATIONAL_FITNESS_BELOW_OFFICIAL_MINIMUM) {
      setNationalScoreError(result.message)
      return
    }
    setNationalScoreResult(result)
  }

  function handleConvert(): void {
    setConvertError(null)
    setConvertResult(null)
    if (!selectedStandard || !selectedItem) {
      setConvertError(OFFICIAL_SCORE_UNAVAILABLE)
      return
    }
    if (!standardAllowsOfficialConvert(selectedStandard)) {
      setConvertError(CONVERT_TABLE_HINT)
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

  function selectBrowseTab(next: StandardsBrowseTab): void {
    setBrowseTab(next)
    setStandardId('')
    setItemId('')
    setConvertResult(null)
    setConvertError(null)
  }

  const standardsBody = (
    <>
      <div className="exam-tabs" role="tablist">
        <button
          type="button"
          className={browseTab === NATIONAL_STUDENT_FITNESS_FAMILY ? 'btn btn-primary' : 'btn'}
          onClick={() => selectBrowseTab(NATIONAL_STUDENT_FITNESS_FAMILY)}
        >
          {NATIONAL_FITNESS_FAMILY_LABEL}
        </button>
        <button
          type="button"
          className={browseTab === 'middle_school_exam' ? 'btn btn-primary' : 'btn'}
          onClick={() => selectBrowseTab('middle_school_exam')}
        >
          {EXAM_TYPE_LABELS.middle_school_exam}
        </button>
        <button
          type="button"
          className={browseTab === 'gaokao_sports' ? 'btn btn-primary' : 'btn'}
          onClick={() => selectBrowseTab('gaokao_sports')}
        >
          {EXAM_TYPE_LABELS.gaokao_sports}
        </button>
      </div>

      {browseTab === NATIONAL_STUDENT_FITNESS_FAMILY ? (
        <div className="exam-detail">
          <p className="exam-notes">
            路径：国家学生体质健康标准 → {nationalFitness.version} →{' '}
            {NATIONAL_FITNESS_STAGE_OPTIONS.find((item) => item.stage === nationalStage)?.label} → {nationalLabelForGrade(nationalGrade)}（
            {nationalGrade}）→ {EXAM_GENDER_LABELS[gender]}。与体育中考、体育高考评分表隔离。历史成绩只使用测试当时的年级快照。
          </p>
          <h3>《{nationalFitness.standardName}》</h3>
          <dl className="exam-meta">
            <div>
              <dt>发布机关</dt>
              <dd>{nationalFitness.authority}</dd>
            </div>
            <div>
              <dt>版本</dt>
              <dd>{nationalFitness.version}</dd>
            </div>
            <div>
              <dt>学段</dt>
              <dd>初中</dd>
            </div>
            <div>
              <dt>来源文件</dt>
              <dd>{nationalFitness.sourceDocument}</dd>
            </div>
            <div>
              <dt>官方换算</dt>
              <dd>{nationalFitnessAllowsOfficialConvert(nationalFitness.id) ? '可换算' : '禁止换算'}</dd>
            </div>
          </dl>
          <div className="exam-summary-controls">
            <label className="toolbar-field">
              学段
              <select
                value={nationalStage}
                onChange={(event) => {
                  const next = event.target.value as SchoolStage
                  setNationalStage(next)
                  const nextGrade = gradesForStage(next)[0]
                  setNationalGrade(nextGrade)
                  setNationalItemKey('')
                }}
              >
                {NATIONAL_FITNESS_STAGE_OPTIONS.map((option) => (
                  <option key={option.stage} value={option.stage}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="toolbar-field">
              年级
              <select
                value={nationalGrade}
                onChange={(event) => {
                  setNationalGrade(event.target.value as Grade)
                  setNationalItemKey('')
                }}
              >
                {gradesForStage(nationalStage).map((grade) => (
                  <option key={grade} value={grade}>
                    {nationalLabelForGrade(grade)}（{grade}）
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
                  setNationalItemKey('')
                }}
              >
                <option value="male">{EXAM_GENDER_LABELS.male}</option>
                <option value="female">{EXAM_GENDER_LABELS.female}</option>
              </select>
            </label>
          </div>
          <h4>
            {nationalLabelForGrade(nationalGrade)} {EXAM_GENDER_LABELS[gender]} · 身体形态
          </h4>
          <p className="exam-notes">
            身高、体重用于计算 BMI，本身没有 0–100 分评分表。BMI 是身体形态评价项目，不是越高越好或越低越好。具体评分/等级规则待权威数据核验后接入。
          </p>
          <div className="exam-item-list">
            {nationalBmiSources.map((item) => (
              <button
                key={item.itemKey}
                type="button"
                className={selectedNationalItem?.itemKey === item.itemKey ? 'exam-item-btn exam-item-btn--active' : 'exam-item-btn'}
                onClick={() => setNationalItemKey(item.itemKey)}
              >
                {item.name}（用于 BMI）
              </button>
            ))}
          </div>
          <h4>
            {nationalLabelForGrade(nationalGrade)} {EXAM_GENDER_LABELS[gender]} · 评价项目
          </h4>
          <div className="exam-item-list">
            {nationalEvalItems.map((item) => (
              <button
                key={item.itemKey}
                type="button"
                className={selectedNationalItem?.itemKey === item.itemKey ? 'exam-item-btn exam-item-btn--active' : 'exam-item-btn'}
                onClick={() => setNationalItemKey(item.itemKey)}
              >
                {item.name}
              </button>
            ))}
          </div>
          {selectedNationalItem ? (
            <div className="exam-item-detail">
              <h4>项目详情</h4>
              <dl className="exam-meta">
                <div>
                  <dt>项目名称</dt>
                  <dd>{selectedNationalItem.name}</dd>
                </div>
                <div>
                  <dt>学段</dt>
                  <dd>{NATIONAL_FITNESS_STAGE_OPTIONS.find((item) => item.stage === stageForGrade(nationalGrade))?.label}</dd>
                </div>
                <div>
                  <dt>年级</dt>
                  <dd>
                    {nationalLabelForGrade(nationalGrade)}（{nationalGrade}）
                  </dd>
                </div>
                <div>
                  <dt>适用性别</dt>
                  <dd>{EXAM_GENDER_LABELS[selectedNationalItem.gender]}</dd>
                </div>
                <div>
                  <dt>单位</dt>
                  <dd>{selectedNationalItem.unitLabel}</dd>
                </div>
                <div>
                  <dt>权重</dt>
                  <dd>
                    {selectedNationalItem.role === 'bmi-source' || selectedNationalItem.weightPercent == null
                      ? '不计入标准分'
                      : `${selectedNationalItem.weightPercent}%`}
                  </dd>
                </div>
                <div>
                  <dt>是否附加分指标</dt>
                  <dd>
                    {selectedNationalBonusTable
                      ? `是 · ${selectedNationalBonusTable.source.tableNo}`
                      : selectedNationalItem.bonusApplicable
                        ? '是（换算表待核验）'
                        : '否'}
                  </dd>
                </div>
                <div>
                  <dt>标准来源</dt>
              <dd>
                《{nationalFitness.standardName}》 · 教体艺〔2014〕5号
              </dd>
                </div>
                <div>
                  <dt>评分表状态</dt>
                  <dd>
                    {selectedNationalVerified
                      ? NATIONAL_FITNESS_SCORE_TABLE_VERIFIED
                      : `pending-verification / ${NATIONAL_FITNESS_SCORE_TABLE_MISSING}`}
                  </dd>
                </div>
                <div>
                  <dt>成绩方向</dt>
                  <dd>
                    {selectedNationalItem.direction === 'derived'
                      ? '派生指标（非越高越好/越低越好）'
                      : selectedNationalItem.direction === 'neutral'
                        ? '中性'
                        : selectedNationalItem.direction === 'higherBetter'
                          ? '越高越好'
                          : '越低越好'}
                  </dd>
                </div>
                <div>
                  <dt>日常项目</dt>
                  <dd>
                    {selectedNationalItem.testItemId
                      ? selectedNationalItem.testItemId
                      : selectedNationalItem.isDerived
                        ? '由身高 + 体重派生，不另建日常项目'
                        : '未映射'}
                  </dd>
                </div>
              </dl>
              <p className="exam-notes">{selectedNationalItem.notes}</p>
              {selectedNationalItem.role === 'bmi-source' ? (
                <p className="exam-notes">该项目用于 BMI 计算，没有单独的 0–100 分评分表。</p>
              ) : null}
              {selectedNationalVerified && selectedNationalTable ? (
                <div className="exam-score-table">
                  <p className="exam-notes">{NATIONAL_FITNESS_SCORE_TABLE_VERIFIED}</p>
                  <p className="exam-notes">
                    数据来源：《{selectedNationalTable.source?.standardName}》 {selectedNationalTable.source?.documentNo} ·{' '}
                    {selectedNationalTable.source?.tableNo} {selectedNationalTable.source?.tableName} · {nationalGrade} ·{' '}
                    {EXAM_GENDER_LABELS[gender]} · {selectedNationalItem.name}
                  </p>
                  {selectedNationalItem.role !== 'bmi-source' ? (
                    <div className="exam-convert">
                      <label className="toolbar-field">
                        原始成绩
                        <input
                          value={nationalRawInput}
                          onChange={(event) => {
                            setNationalRawInput(event.target.value)
                            setNationalScoreResult(null)
                            setNationalScoreError(null)
                          }}
                          placeholder={selectedNationalTable.valueKind === 'time' ? '例如 3:45' : '例如 16.1'}
                        />
                      </label>
                      <button type="button" className="btn btn-primary" onClick={handleNationalConvert}>
                        换算单项标准分
                      </button>
                      {nationalScoreError ? <p className="page-error">{nationalScoreError}</p> : null}
                      {nationalScoreResult?.ok ? (
                        <dl className="exam-meta">
                          <div>
                            <dt>原始成绩</dt>
                            <dd>
                              {nationalScoreResult.formattedRawValue} {selectedNationalItem.unitLabel}
                            </dd>
                          </div>
                          <div>
                            <dt>基础分</dt>
                            <dd>{nationalScoreResult.baseScore}</dd>
                          </div>
                          <div>
                            <dt>附加分</dt>
                            <dd>{nationalScoreResult.bonusScore}</dd>
                          </div>
                          <div>
                            <dt>单项合计</dt>
                            <dd>{nationalScoreResult.finalItemScore}</dd>
                          </div>
                          <div>
                            <dt>核验状态</dt>
                            <dd>{NATIONAL_FITNESS_SCORE_TABLE_VERIFIED}</dd>
                          </div>
                        </dl>
                      ) : nationalScoreResult?.code === NATIONAL_FITNESS_BELOW_OFFICIAL_MINIMUM ? (
                        <dl className="exam-meta">
                          <div>
                            <dt>原始成绩</dt>
                            <dd>
                              {nationalScoreResult.formattedRawValue} {selectedNationalItem.unitLabel}
                            </dd>
                          </div>
                          <div>
                            <dt>单项得分</dt>
                            <dd>{nationalFitnessBelowOfficialMinimumMessage(nationalScoreResult.officialMinimumScore)}</dd>
                          </div>
                          <div>
                            <dt>附加分</dt>
                            <dd>—</dd>
                          </div>
                          <div>
                            <dt>核验状态</dt>
                            <dd>{NATIONAL_FITNESS_SCORE_TABLE_VERIFIED}</dd>
                          </div>
                        </dl>
                      ) : null}
                    </div>
                  ) : null}
                  <h4>【基础评分表】</h4>
                  <div className="data-table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>分数</th>
                          <th>{selectedNationalTable.ruleKind === 'range' ? '区间' : '阈值'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedNationalTable.ruleKind === 'range'
                          ? selectedNationalTable.rangeEntries.map((entry) => (
                              <tr key={`range-${entry.score}-${entry.min}-${entry.max}-${entry.minInclusive}-${entry.maxInclusive}`}>
                                <td>{entry.score}</td>
                                <td>
                                  {entry.min === null ? '…' : formatNationalFitnessTableValue(entry.min, selectedNationalTable)}
                                  {entry.minInclusive ? ' ≤ ' : ' < '}x
                                  {entry.max === null ? '' : entry.maxInclusive ? ' ≤ ' : ' < '}
                                  {entry.max === null ? '…' : formatNationalFitnessTableValue(entry.max, selectedNationalTable)}
                                </td>
                              </tr>
                            ))
                          : selectedNationalTable.thresholdEntries.map((entry) => (
                              <tr key={`th-${entry.score}-${entry.threshold}`}>
                                <td>{entry.score}</td>
                                <td>{formatNationalFitnessTableValue(entry.threshold, selectedNationalTable)}</td>
                              </tr>
                            ))}
                      </tbody>
                    </table>
                  </div>
                  {selectedNationalBonusTable ? (
                    <div className="exam-score-table">
                      <h4>【附加分评分表】</h4>
                      <p className="exam-notes">
                        {selectedNationalBonusTable.source.tableNo} {selectedNationalBonusTable.source.tableName} · 教体艺〔2014〕5号 ·
                        2014-07-07
                      </p>
                      <p className="exam-notes">以下数值表示超过基础100分成绩后的增量。</p>
                      <p className="exam-notes">
                        本年级本性别基础100分成绩：
                        {formatNationalFitnessTableValue(
                          selectedNationalTable.thresholdEntries.find((entry) => entry.score === 100)?.threshold ?? 0,
                          selectedNationalTable
                        )}{' '}
                        {selectedNationalItem.unitLabel}
                        {selectedNationalBonusTable.incrementKind === 'fasterBySeconds'
                          ? '。附加分按“比该时间快多少秒”计算。'
                          : '。附加分按“超过该成绩多少次”计算。'}
                      </p>
                      <div className="data-table-wrap">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>附加分</th>
                              <th>增量</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedNationalBonusTable.entries.map((entry) => (
                              <tr key={`bonus-${entry.bonusScore}-${entry.extra}`}>
                                <td>+{entry.bonusScore}</td>
                                <td>
                                  {selectedNationalBonusTable.incrementKind === 'fasterBySeconds'
                                    ? `比100分成绩快 ${entry.extra} 秒 → +${entry.bonusScore}分`
                                    : `超过100分成绩 ${entry.extra} 次 → +${entry.bonusScore}分`}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : selectedNationalItem.role !== 'bmi-source' ? (
                    <p className="exam-notes">该项目无官方附加分</p>
                  ) : null}
                </div>
              ) : (
                <p className="page-error">{NATIONAL_FITNESS_SCORE_TABLE_MISSING}</p>
              )}
            </div>
          ) : null}
          <p className="exam-notes">
            完整性：应有评分表 {nationalCompleteness.expected}；catalog {nationalCompleteness.catalog}；已核验 {nationalCompleteness.verified}；pending{' '}
            {nationalCompleteness.pending}；N/A {nationalCompleteness.na}；可自动评分 {nationalCompleteness.autoScoring}。小学已核验{' '}
            {nationalCompleteness.byStage.primary.verified}/{nationalCompleteness.byStage.primary.expected}，初中 {nationalCompleteness.byStage.junior.verified}/
            {nationalCompleteness.byStage.junior.expected}，高中 {nationalCompleteness.byStage.senior.verified}/{nationalCompleteness.byStage.senior.expected}。
          </p>
          {nationalCompleteness.verified === 0 ? (
          <TechEmptyState
            kind="exams"
            title={NATIONAL_FITNESS_SCORE_TABLE_MISSING}
            description="当前不能用国家体测标准换算单项得分或学年综合总分。体育中考过程性「国家学生体质健康标准」项目不是本套 2014 评分表。"
          />
          ) : null}
        </div>
      ) : (
        <>
      {browseTab === 'middle_school_exam' ? (
        <p className="exam-notes">
          路径：城市 → 年份/政策版本 → 中考体育。不会用较新年份自动覆盖历史版本。当前评分表已核验、可自动换算的中考标准{' '}
          {standards.filter((item) => item.examType === 'middle_school_exam' && standardAllowsOfficialConvert(item)).length}{' '}
          份；考试方案已核验但评分表未完整{' '}
          {standards.filter(
            (item) =>
              item.examType === 'middle_school_exam' &&
              item.ruleStatus === 'verified' &&
              item.scoreTableStatus !== 'verified'
          ).length}{' '}
          份；部分核验{' '}
          {standards.filter((item) => item.examType === 'middle_school_exam' && item.status === 'partial').length} 份。考试方案已核验不等于可以自动换算。
        </p>
      ) : (
        <p className="exam-notes">路径：体育高考 → 广东省 → 2026。基本素质①、基本素质②、专项基础按官方组合列出。</p>
      )}

      {browseTab === 'middle_school_exam' ? (
        <div className="exam-coverage">
          <div className="exam-coverage-head">
            <h3>城市覆盖状态</h3>
            <div className="exam-filter-tabs" role="group" aria-label="核验状态筛选">
              <button
                type="button"
                className={allCoverageSelected ? 'exam-filter-tab is-active' : 'exam-filter-tab'}
                onClick={() => setCoverageGroups(['verified', 'partial', 'unverified'])}
              >
                全部
              </button>
              <button
                type="button"
                className={coverageGroups.includes('verified') ? 'exam-filter-tab is-active' : 'exam-filter-tab'}
                onClick={() => setCoverageGroups(['verified'])}
              >
                已核验
              </button>
              <button
                type="button"
                className={coverageGroups.includes('partial') ? 'exam-filter-tab is-active' : 'exam-filter-tab'}
                onClick={() => setCoverageGroups(['partial'])}
              >
                部分核验
              </button>
              <button
                type="button"
                className={coverageGroups.includes('unverified') ? 'exam-filter-tab is-active' : 'exam-filter-tab'}
                onClick={() => setCoverageGroups(['unverified'])}
              >
                未核验
              </button>
            </div>
          </div>
          <p className="exam-notes">默认只突出已核验与部分核验城市。21 市覆盖数据仍保留，可展开查看。</p>
          <div className="exam-coverage-chips">
            {highlightedCoverage.map((row) => (
              <button
                key={row.city.citySlug}
                type="button"
                className={`exam-coverage-chip exam-coverage-chip--${coverageGroup(row.coverage)}${
                  citySlug === row.city.citySlug ? ' is-active' : ''
                }`}
                onClick={() => selectCity(row.city.citySlug)}
              >
                <span>{row.city.cityName}</span>
                <span className="exam-coverage-chip-label">{coverageChipLabel(row.coverage)}</span>
              </button>
            ))}
          </div>
          <button type="button" className="btn exam-coverage-toggle" onClick={() => setShowAllCoverage((open) => !open)}>
            {showAllCoverage ? '收起全部城市覆盖' : '查看全部城市覆盖'}
          </button>
          {showAllCoverage ? (
            <div className="exam-coverage-all">
              {coverageRows.map((row) => (
                <button
                  key={`all-${row.city.citySlug}`}
                  type="button"
                  className={`exam-coverage-row exam-coverage-row--${coverageGroup(row.coverage)}${
                    citySlug === row.city.citySlug ? ' is-active' : ''
                  }`}
                  onClick={() => selectCity(row.city.citySlug)}
                >
                  <span>{row.city.cityName}</span>
                  <span>{row.coverageLabel}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {browseTab === 'middle_school_exam' ? (
        <div className="exam-summary">
          <div className="exam-summary-controls">
            <label className="toolbar-field">
              搜索城市
              <input
                value={cityQuery}
                onChange={(event) => {
                  const next = event.target.value
                  setCityQuery(next)
                  const matched = GD_CITIES.find((city) => city.cityName === next.trim())
                  if (matched) {
                    selectCity(matched.citySlug)
                  }
                }}
                placeholder="输入广州、深圳、东莞、江门、湛江、中山…"
                list="exam-city-search"
              />
              <datalist id="exam-city-search">
                {GD_CITIES.map((city) => (
                  <option key={city.citySlug} value={city.cityName} />
                ))}
              </datalist>
            </label>
            <label className="toolbar-field">
              城市
              <select value={citySlug} onChange={(event) => selectCity(event.target.value)}>
                {cityOptions.map((city) => (
                  <option key={city.citySlug} value={city.citySlug}>
                    {city.cityName}
                  </option>
                ))}
              </select>
            </label>
            <label className="toolbar-field">
              规则版本
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
                    {item.schemeLabel || item.policyLabel}
                    {item.scoreYear ? ` · ${item.scoreYear}` : ''}
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
          <div className="exam-quick-cities">
            {QUICK_CITY_SLUGS.map((slug) => {
              const city = GD_CITIES.find((item) => item.citySlug === slug)
              if (!city) {
                return null
              }
              return (
                <button
                  key={slug}
                  type="button"
                  className={citySlug === slug ? 'exam-quick-city is-active' : 'exam-quick-city'}
                  onClick={() => selectCity(slug)}
                >
                  {city.cityName}
                </button>
              )
            })}
          </div>
          {selectedStandard ? (
            <dl className="exam-summary-bar">
              <div>
                <dt>城市</dt>
                <dd>{selectedCityName}</dd>
              </div>
              <div>
                <dt>规则版本</dt>
                <dd>{selectedStandard.schemeLabel || selectedStandard.policyLabel}</dd>
              </div>
              <div>
                <dt>适用年份</dt>
                <dd>{selectedStandard.scoreYear ?? formatYearRange(selectedStandard)}</dd>
              </div>
              <div>
                <dt>性别</dt>
                <dd>{EXAM_GENDER_LABELS[gender]}</dd>
              </div>
              <div>
                <dt>考试方案</dt>
                <dd className={statusToneClass(selectedStandard.ruleStatus === 'verified' ? 'ok' : 'muted')}>
                  {ruleStatusShort(selectedStandard)}
                </dd>
              </div>
              <div>
                <dt>{selectedStandard.scoreYear ? `${selectedStandard.scoreYear}评分表` : '评分表'}</dt>
                <dd
                  className={statusToneClass(
                    selectedStandard.scoreTableStatus === 'verified'
                      ? 'ok'
                      : selectedStandard.scoreTableStatus === 'partial'
                        ? 'partial'
                        : 'muted'
                  )}
                >
                  {scoreTableStatusShort(selectedStandard)}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="exam-notes">当前城市尚未录入已核验标准，不会生成猜测分数。</p>
          )}
        </div>
      ) : (
        <div className="exam-summary">
          <div className="exam-summary-controls">
            <label className="toolbar-field">
              地区
              <select disabled>
                <option>广东省</option>
              </select>
            </label>
            <label className="toolbar-field">
              规则版本
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
          {selectedStandard ? (
            <dl className="exam-summary-bar">
              <div>
                <dt>地区</dt>
                <dd>广东省</dd>
              </div>
              <div>
                <dt>规则版本</dt>
                <dd>{selectedStandard.schemeLabel || selectedStandard.policyLabel}</dd>
              </div>
              <div>
                <dt>适用年份</dt>
                <dd>{selectedStandard.scoreYear ?? formatYearRange(selectedStandard)}</dd>
              </div>
              <div>
                <dt>性别</dt>
                <dd>{EXAM_GENDER_LABELS[gender]}</dd>
              </div>
              <div>
                <dt>考试方案</dt>
                <dd className={statusToneClass(selectedStandard.ruleStatus === 'verified' ? 'ok' : 'muted')}>
                  {ruleStatusShort(selectedStandard)}
                </dd>
              </div>
              <div>
                <dt>评分表</dt>
                <dd
                  className={statusToneClass(
                    selectedStandard.scoreTableStatus === 'verified'
                      ? 'ok'
                      : selectedStandard.scoreTableStatus === 'partial'
                        ? 'partial'
                        : 'muted'
                  )}
                >
                  {scoreTableStatusShort(selectedStandard)}
                </dd>
              </div>
            </dl>
          ) : null}
        </div>
      )}

      <div className="exam-detail">
        <h3>查看和管理当前体育测试使用的官方评分规则</h3>
        <p className="exam-notes">
          本页只查阅城市、年份和项目规则。Excel 评分、模板和导出请使用「评分工具」。把成绩写入体育测试请使用「导入成绩」。
        </p>
        {onOpenTools ? (
          <button type="button" className="btn" onClick={onOpenTools}>
            打开评分工具
          </button>
        ) : null}
      </div>

      {verifiedCityStandards.length === 0 && browseTab === 'middle_school_exam' ? (
        <TechEmptyState
          kind="exams"
          title="暂无已核验评分标准"
          description={`${GD_CITIES.find((item) => item.citySlug === citySlug)?.cityName ?? '当前城市'}目前没有已核验的完整官方评分表。不会生成猜测分数。`}
        />
      ) : null}

      {selectedStandard ? (
        <div className="exam-detail">
          <h3>{selectedStandard.title}</h3>
          <dl className="exam-meta">
            <div>
              <dt>考生类别</dt>
              <dd>{selectedStandard.applicableGroups.map((group) => EXAM_CANDIDATE_GROUP_LABELS[group]).join('、')}</dd>
            </div>
            <div>
              <dt>入学届别</dt>
              <dd>{selectedStandard.enrollmentCohort || '未区分'}</dd>
            </div>
            <div>
              <dt>发布单位</dt>
              <dd>{selectedStandard.sourceAuthority || '尚未录入'}</dd>
            </div>
            <div>
              <dt>文件名称</dt>
              <dd>{selectedStandard.sourceTitle || '尚未录入'}</dd>
            </div>
            <div>
              <dt>发布日期</dt>
              <dd>{selectedStandard.publishedAt || '尚未录入'}</dd>
            </div>
            <div>
              <dt>官方来源</dt>
              <dd>
                {selectedStandard.sourceUrl ? (
                  <a className="btn" href={selectedStandard.sourceUrl} target="_blank" rel="noreferrer">
                    查看官方文件
                  </a>
                ) : (
                  '无来源链接，不能标记为已核验'
                )}
                {selectedStandard.sourceUrl ? (
                  <>
                    <br />
                    <span className="exam-source-url">{selectedStandard.sourceUrl}</span>
                  </>
                ) : null}
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
          {selectedStandard.calculationNotes ? <p className="exam-notes">{selectedStandard.calculationNotes}</p> : null}
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
                  <dd>{scoreModeDisplay(selectedItem, selectedStandard.examType)}</dd>
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
      ) : browseTab === 'gaokao_sports' ? (
        <TechEmptyState
          kind="exams"
          title="暂无已核验评分标准"
          description="广东省普通高校体育类专业省统考入口已建立，完整官方评分表尚未核验录入。"
        />
      ) : null}

      <div className="exam-converter">
        <h3>成绩换算器</h3>
        <p className="exam-notes">正式换算只使用已核验且评分表完整的标准。部分核验版本禁止完整自动换算。时间成绩可输入 3:45、3'45 或总秒数。</p>
        {selectedStandard && !officialConvertAllowed ? <p className="page-error">{CONVERT_TABLE_HINT}</p> : null}
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
              disabled={!canAutoScore || !officialConvertAllowed}
            />
          </label>
          <button type="button" className="btn btn-primary" onClick={handleConvert} disabled={!selectedItem || !officialConvertAllowed}>
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
        </>
      )}
    </>
  )

  if (embedded) {
    return standardsBody
  }

  return (
    <PageLayout className="page--exams">
      <PageHeader
        icon="exams"
        title="评分标准"
        description="查看三套独立评分体系：国家学生体质健康标准、体育中考、体育高考。中考为广东分市规则，不是省统一标准。"
      />
      {standardsBody}
    </PageLayout>
  )
}
