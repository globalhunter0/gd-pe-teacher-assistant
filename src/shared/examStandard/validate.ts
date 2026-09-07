import { TEST_UNITS, TEST_VALUE_TYPES, TIME_INPUT_MODES } from '../peTest/types'
import type { ExamComponent, ExamGroup, ExamItemDefinition, ExamItemVerification, ExamStandard, ScoreMode, ScoreRule, ScoreTableEntry } from './types'
import { EXAM_TYPES } from './types'

const STANDARD_ID = /^cn-gd-[a-z0-9-]+$/
const YEAR = /^\d{4}$/
const DATE = /^\d{4}-\d{2}-\d{2}$/

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    throw new Error(`${label}格式不正确`)
  }
  return value as Record<string, unknown>
}

function trimText(value: unknown, label: string, required: boolean, max = 400): string {
  if (value === undefined || value === null) {
    if (required) {
      throw new Error(`${label}不能为空`)
    }
    return ''
  }
  if (typeof value !== 'string') {
    throw new Error(`${label}格式不正确`)
  }
  const text = value.trim()
  if (required && text === '') {
    throw new Error(`${label}不能为空`)
  }
  if (text.length > max) {
    throw new Error(`${label}过长`)
  }
  return text
}

function parseNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label}必须是数字`)
  }
  return value
}

function parseYear(value: unknown, label: string): number {
  const year = parseNumber(value, label)
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error(`${label}不正确`)
  }
  return year
}

function parseOptionalDate(value: unknown, label: string): string | null {
  if (value === null || value === undefined || value === '') {
    return null
  }
  if (typeof value !== 'string' || !DATE.test(value)) {
    throw new Error(`${label}格式应为 YYYY-MM-DD`)
  }
  return value
}

function parseScoreRule(value: unknown): ScoreRule {
  const record = asRecord(value, '评分规则')
  const maxScore = parseNumber(record.maxScore, '项目满分')
  const minScore = parseNumber(record.minScore, '最低分')
  if (minScore > maxScore) {
    throw new Error('最低分不能高于满分')
  }
  if (record.kind === 'unsupported') {
    return {
      kind: 'unsupported',
      reason: trimText(record.reason, '不支持原因', true, 400),
      maxScore,
      minScore
    }
  }
  if (record.kind !== 'thresholdTable') {
    throw new Error('本版只支持阈值评分表或明确标记为暂不支持换算的规则')
  }
  const scoreMode: ScoreMode =
    record.scoreMode === 'linear' || record.interpolation === 'linear'
      ? 'linear'
      : record.scoreMode === 'step' || record.interpolation === 'none' || record.scoreMode === undefined
        ? 'step'
        : (() => {
            throw new Error('评分模式必须是 step 或 linear')
          })()
  if (!Array.isArray(record.entries)) {
    throw new Error('评分表格式不正确')
  }
  const entries: ScoreTableEntry[] = record.entries.map((entry) => {
    const row = asRecord(entry, '评分档')
    return {
      score: parseNumber(row.score, '分数'),
      threshold: parseNumber(row.threshold, '成绩阈值')
    }
  })
  return { kind: 'thresholdTable', scoreMode, maxScore, minScore, entries }
}

function parseItem(value: unknown): ExamItemDefinition {
  const record = asRecord(value, '考试项目')
  const valueType = record.valueType
  const timeInputMode = record.timeInputMode
  const unit = record.unit
  const direction = record.direction
  const gender = record.gender
  const requirement = record.requirement
  const category = record.category

  if (valueType !== 'number' && valueType !== 'time') {
    throw new Error('项目数值类型不正确')
  }
  if (timeInputMode !== 'seconds' && timeInputMode !== 'minutesSeconds') {
    throw new Error('时间输入方式不正确')
  }
  if (!TEST_UNITS.includes(unit as (typeof TEST_UNITS)[number])) {
    throw new Error('项目单位不正确')
  }
  const typedUnit = unit as (typeof TEST_UNITS)[number]
  if (!TIME_INPUT_MODES.includes(timeInputMode)) {
    throw new Error('时间输入方式不正确')
  }
  if (!TEST_VALUE_TYPES.includes(valueType)) {
    throw new Error('项目数值类型不正确')
  }
  if (direction !== 'higherBetter' && direction !== 'lowerBetter') {
    throw new Error('成绩方向不正确')
  }
  if (gender !== 'male' && gender !== 'female' && gender !== 'all') {
    throw new Error('项目性别不正确')
  }
  if (requirement !== 'required' && requirement !== 'optional' && requirement !== 'grouped') {
    throw new Error('必考/选考标记不正确')
  }
  if (
    category !== 'endurance' &&
    category !== 'speed' &&
    category !== 'strength' &&
    category !== 'skill' &&
    category !== 'swim' &&
    category !== 'flexibility' &&
    category !== 'other'
  ) {
    throw new Error('项目类别不正确')
  }

  const scoreRule = parseScoreRule(record.scoreRule)
  const inferredVerification: ExamItemVerification =
    scoreRule.kind === 'unsupported'
      ? 'verified_unsupported'
      : scoreRule.kind === 'thresholdTable' && scoreRule.entries.length > 0
        ? 'verified_supported'
        : 'unverified'
  const verification =
    record.verification === 'verified_supported' ||
    record.verification === 'verified_unsupported' ||
    record.verification === 'unverified'
      ? record.verification
      : inferredVerification

  return {
    id: trimText(record.id, '项目编号', true, 80),
    itemKey: trimText(record.itemKey, '项目键', true, 80),
    name: trimText(record.name, '项目名称', true, 80),
    gender,
    requirement,
    category,
    valueType,
    timeInputMode,
    unit: typedUnit,
    customUnitLabel: trimText(record.customUnitLabel, '自定义单位', false, 40),
    direction,
    decimalPlaces: parseNumber(record.decimalPlaces, '小数位'),
    maxScore: parseNumber(record.maxScore, '项目满分'),
    testItemBuiltinKey:
      record.testItemBuiltinKey === null || record.testItemBuiltinKey === undefined || record.testItemBuiltinKey === ''
        ? null
        : trimText(record.testItemBuiltinKey, '日常测试键', true, 80),
    testItemId:
      record.testItemId === null || record.testItemId === undefined || record.testItemId === ''
        ? null
        : trimText(record.testItemId, '日常测试编号', true, 80),
    verification,
    scoreRule,
    sourcePage: parseOptionalSourcePage(record.sourcePage),
    aliases: parseAliases(record.aliases)
  }
}

function parseAliases(value: unknown): string[] {
  if (value === undefined || value === null || value === '') {
    return []
  }
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error('项目别名格式不正确')
  }
  return value.map((item) => item.trim()).filter((item) => item !== '')
}

function parseOptionalSourcePage(value: unknown): number | null {
  if (value === undefined || value === null || value === '') {
    return null
  }
  const page = parseNumber(value, '官方PDF页码')
  if (!Number.isInteger(page) || page < 1) {
    throw new Error('官方PDF页码必须是正整数')
  }
  return page
}

function parseGroup(value: unknown): ExamGroup {
  const record = asRecord(value, '考试组别')
  const mode = record.selection && typeof record.selection === 'object' ? (record.selection as Record<string, unknown>).mode : null
  const n = record.selection && typeof record.selection === 'object' ? (record.selection as Record<string, unknown>).n : 0
  if (mode !== 'all' && mode !== 'pickN') {
    throw new Error('选考规则不正确')
  }
  const combine = record.combine
  if (combine !== 'single' && combine !== 'sum' && combine !== 'average' && combine !== 'max') {
    throw new Error('组成绩合成方式不正确')
  }
  if (!Array.isArray(record.itemIds) || record.itemIds.some((id) => typeof id !== 'string')) {
    throw new Error('组别项目不正确')
  }
  return {
    id: trimText(record.id, '组别编号', true, 80),
    title: trimText(record.title, '组别名称', true, 80),
    selection: { mode, n: mode === 'pickN' ? parseNumber(n, '选考数量') : 0 },
    combine,
    itemIds: record.itemIds as string[]
  }
}

function parseComponent(value: unknown): ExamComponent {
  const record = asRecord(value, '考试构成')
  const kind = record.kind
  if (
    kind !== 'process' &&
    kind !== 'onsite' &&
    kind !== 'bonus' &&
    kind !== 'basic_quality' &&
    kind !== 'special_foundation' &&
    kind !== 'other'
  ) {
    throw new Error('考试构成类型不正确')
  }
  if (!Array.isArray(record.groupIds) || record.groupIds.some((id) => typeof id !== 'string')) {
    throw new Error('构成组别不正确')
  }
  return {
    id: trimText(record.id, '构成编号', true, 80),
    kind,
    title: trimText(record.title, '构成名称', true, 80),
    maxScore: parseNumber(record.maxScore, '构成满分'),
    weight: parseNumber(record.weight, '权重'),
    groupIds: record.groupIds as string[]
  }
}

export function parseExamStandard(input: unknown): ExamStandard {
  const record = asRecord(input, '考试标准')
  const id = trimText(record.id, '标准编号', true, 120)
  if (!STANDARD_ID.test(id)) {
    throw new Error('标准编号格式不正确')
  }
  if (!EXAM_TYPES.includes(record.examType as never)) {
    throw new Error('考试类型不正确')
  }
  const status = record.status
  if (status !== 'verified' && status !== 'draft' && status !== 'deprecated') {
    throw new Error('标准状态不正确')
  }
  const sourceUrl =
    record.sourceUrl === null || record.sourceUrl === undefined || record.sourceUrl === ''
      ? null
      : trimText(record.sourceUrl, '来源链接', true, 500)
  const sourceTitle = trimText(record.sourceTitle, '来源标题', status === 'verified', 300)
  if (status === 'verified' && !sourceUrl) {
    throw new Error('已核验标准必须提供官方来源链接')
  }

  const yearFrom = parseYear(record.yearFrom, '起始年份')
  const yearTo = parseYear(record.yearTo, '结束年份')
  if (yearFrom > yearTo) {
    throw new Error('起始年份不能晚于结束年份')
  }

  if (!Array.isArray(record.items) || !Array.isArray(record.groups) || !Array.isArray(record.components)) {
    throw new Error('标准项目或组别格式不正确')
  }

  const scoring = asRecord(record.scoring, '总分规则')
  const rounding = scoring.rounding
  if (rounding !== 'none' && rounding !== 'round0' && rounding !== 'round1') {
    throw new Error('总分取整方式不正确')
  }

  const standard: ExamStandard = {
    id,
    examType: record.examType as ExamStandard['examType'],
    regionCode: 'CN-GD',
    cityCode: trimText(record.cityCode, '城市代码', true, 12),
    citySlug: trimText(record.citySlug, '城市标识', true, 40),
    cityName: trimText(record.cityName, '城市名称', true, 40),
    yearFrom,
    yearTo,
    policyLabel: trimText(record.policyLabel, '政策年份', true, 40),
    policyPeriod: trimText(record.policyPeriod, '适用周期', false, 40) || `${yearFrom}-${yearTo}`,
    title: trimText(record.title, '标准名称', true, 200),
    sourceAuthority: trimText(record.sourceAuthority, '发布机关', status === 'verified', 200),
    sourceTitle,
    sourceUrl,
    policySourceTitle: trimText(record.policySourceTitle, '政策文件标题', false, 300),
    policySourceUrl:
      record.policySourceUrl === null || record.policySourceUrl === undefined || record.policySourceUrl === ''
        ? null
        : trimText(record.policySourceUrl, '政策文件链接', true, 500),
    publishedAt: parseOptionalDate(record.publishedAt, '发布日期'),
    effectiveFrom: parseOptionalDate(record.effectiveFrom, '生效日期'),
    effectiveTo: parseOptionalDate(record.effectiveTo, '截止日期'),
    status,
    notes: trimText(record.notes, '备注', false, 2000),
    totalMaxScore: parseNumber(record.totalMaxScore, '考试满分'),
    scoring: { rounding },
    items: record.items.map((item) => parseItem(item)),
    groups: record.groups.map((group) => parseGroup(group)),
    components: record.components.map((component) => parseComponent(component)),
    createdAt: trimText(record.createdAt, '创建时间', true, 40),
    updatedAt: trimText(record.updatedAt, '更新时间', true, 40)
  }

  if (!YEAR.test(String(yearFrom))) {
    throw new Error('年份不正确')
  }

  const itemIds = new Set<string>()
  for (const item of standard.items) {
    if (itemIds.has(item.id)) {
      throw new Error('同一标准中项目编号不能重复')
    }
    itemIds.add(item.id)
  }

  return standard
}

export function parseExamStandards(input: unknown): ExamStandard[] {
  if (!Array.isArray(input)) {
    throw new Error('考试标准目录格式不正确')
  }
  const standards = input.map((entry) => parseExamStandard(entry))
  const ids = new Set<string>()
  for (const item of standards) {
    if (ids.has(item.id)) {
      throw new Error(`标准编号重复：${item.id}`)
    }
    ids.add(item.id)
  }
  return standards
}
