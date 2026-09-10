import { itemSupportsAutoScore, standardAllowsOfficialConvert } from '../examStandard/score'
import type { ExamGender, ExamItemDefinition, ExamStandard } from '../examStandard/types'
import { matchExamItem, normalizeExamLabel } from './matchExamItem'
import type { MappingConfidence } from './types'

export type ExamItemMatchType = 'exact' | 'alias' | 'normalized' | 'gender-derived' | 'ambiguous' | 'unknown'

export interface DetectedExamItemColumn {
  columnIndex: number
  originalHeader: string
  matchedItemId: string | null
  matchedItemKey: string | null
  matchedItemName: string
  confidence: MappingConfidence
  matchType: ExamItemMatchType
  genderScope: ExamGender
  unit: string
  autoScoreSupported: boolean
  scoreTableStatus: ExamStandard['scoreTableStatus']
  reason: string
  candidates: Array<{ itemId: string; name: string; gender: ExamGender }>
  maleItemId: string | null
  femaleItemId: string | null
}

const IGNORE_HEADERS = [
  '班级',
  '行政班',
  '班别',
  '座号',
  '体育总分',
  '总分',
  '备注',
  '说明',
  '排名',
  '等级',
  '日期',
  '教师',
  '老师',
  '学校',
  '学校名称',
  '年级',
  '最终分',
  '得分',
  '分数',
  '换算分',
  '评分',
  '序号',
  '状态',
  '考生类别'
]

const GENERIC_RAW = ['成绩', '原始成绩', '测试成绩', '成绩值', '测试结果']
const ENDURANCE_ALIASES = ['长跑', '耐力跑', '中长跑']

export function isIgnoredExamHeader(title: string): boolean {
  const normalized = normalizeExamLabel(title)
  return IGNORE_HEADERS.some((alias) => normalizeExamLabel(alias) === normalized)
}

export function isProjectLabelHeader(title: string): boolean {
  const normalized = normalizeExamLabel(title)
  return ['项目', '测试项目', '考试项目'].some((alias) => normalizeExamLabel(alias) === normalized)
}

export function isGenericRawHeader(title: string): boolean {
  const normalized = normalizeExamLabel(title)
  return GENERIC_RAW.some((alias) => normalizeExamLabel(alias) === normalized)
}

export function prepareExamHeader(title: string): string {
  return title
    .replace(/\u3000/g, ' ')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/[\(（][^)）]*[\)）]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function enduranceItems(standard: ExamStandard): { male: ExamItemDefinition | undefined; female: ExamItemDefinition | undefined } {
  const male = standard.items.find((item) => item.itemKey === 'run-1000m' && item.gender === 'male')
  const female = standard.items.find((item) => item.itemKey === 'run-800m' && item.gender === 'female')
  return { male, female }
}

function columnStatusLabel(standard: ExamStandard, items: ExamItemDefinition[]): {
  autoScoreSupported: boolean
  scoreTableStatus: ExamStandard['scoreTableStatus']
  reason: string
} {
  const supported = items.filter((item) => itemSupportsAutoScore(item) && standardAllowsOfficialConvert(standard))
  if (supported.length === items.length && items.length > 0) {
    return { autoScoreSupported: true, scoreTableStatus: 'verified', reason: '可自动评分' }
  }
  if (supported.length > 0) {
    return { autoScoreSupported: false, scoreTableStatus: standard.scoreTableStatus, reason: '部分支持' }
  }
  if (standard.scoreTableStatus === 'partial') {
    return { autoScoreSupported: false, scoreTableStatus: 'partial', reason: '暂无评分表' }
  }
  return { autoScoreSupported: false, scoreTableStatus: standard.scoreTableStatus, reason: '暂无评分表' }
}

function unknown(columnIndex: number, originalHeader: string, reason: string): DetectedExamItemColumn {
  return {
    columnIndex,
    originalHeader,
    matchedItemId: null,
    matchedItemKey: null,
    matchedItemName: '',
    confidence: 'none',
    matchType: 'unknown',
    genderScope: 'all',
    unit: '',
    autoScoreSupported: false,
    scoreTableStatus: 'missing',
    reason,
    candidates: [],
    maleItemId: null,
    femaleItemId: null
  }
}

function fromItems(
  columnIndex: number,
  originalHeader: string,
  items: ExamItemDefinition[],
  matchType: ExamItemMatchType,
  confidence: MappingConfidence,
  standard: ExamStandard,
  reason: string
): DetectedExamItemColumn {
  const keys = new Set(items.map((item) => item.itemKey))
  const male = items.find((item) => item.gender === 'male') ?? (items[0]?.gender === 'all' ? items[0] : undefined)
  const female = items.find((item) => item.gender === 'female') ?? (items[0]?.gender === 'all' ? items[0] : undefined)
  const status = columnStatusLabel(standard, items)
  const unique = items.length === 1 ? items[0] : null
  const genderScope: ExamGender = unique?.gender ?? (keys.size === 1 ? 'all' : 'all')
  return {
    columnIndex,
    originalHeader,
    matchedItemId: unique && unique.gender !== 'all' && items.length === 1 ? unique.id : unique?.gender === 'all' ? unique.id : null,
    matchedItemKey: keys.size === 1 ? items[0].itemKey : null,
    matchedItemName: unique?.name ?? items[0]?.name ?? originalHeader,
    confidence,
    matchType,
    genderScope,
    unit: unique?.unit ?? items[0]?.unit ?? '',
    autoScoreSupported: status.autoScoreSupported,
    scoreTableStatus: status.scoreTableStatus,
    reason,
    candidates: items.map((item) => ({ itemId: item.id, name: item.name, gender: item.gender })),
    maleItemId: male?.id ?? null,
    femaleItemId: female?.id ?? null
  }
}

export function detectExamItemColumn(header: string, standard: ExamStandard, columnIndex: number): DetectedExamItemColumn {
  const originalHeader = header.replace(/\u3000/g, ' ').trim()
  if (originalHeader === '') {
    return unknown(columnIndex, header, '空表头')
  }
  if (isIgnoredExamHeader(originalHeader) || isGenericRawHeader(originalHeader) || isProjectLabelHeader(originalHeader)) {
    const reason = isGenericRawHeader(originalHeader)
      ? '通用成绩列'
      : isProjectLabelHeader(originalHeader)
        ? '项目名称列'
        : '非评分列 / 已忽略'
    return unknown(columnIndex, originalHeader, reason)
  }

  const prepared = prepareExamHeader(originalHeader)
  const normalized = normalizeExamLabel(prepared)
  const enduranceHit = ENDURANCE_ALIASES.some((alias) => normalizeExamLabel(alias) === normalized)
  if (enduranceHit) {
    const { male, female } = enduranceItems(standard)
    if (male && female) {
      return fromItems(
        columnIndex,
        originalHeader,
        [male, female],
        'gender-derived',
        'high',
        standard,
        '按当前规则：男1000米 / 女800米'
      )
    }
    return unknown(columnIndex, originalHeader, '当前城市/版本未同时声明男1000米与女800米，不能按长跑拆分')
  }

  const exactName = standard.items.filter((item) => item.name === prepared || item.name === originalHeader)
  if (exactName.length === 1) {
    return fromItems(columnIndex, originalHeader, exactName, 'exact', 'high', standard, exactName[0].name)
  }
  if (exactName.length > 1) {
    const keys = new Set(exactName.map((item) => item.itemKey))
    if (keys.size === 1) {
      return fromItems(columnIndex, originalHeader, exactName, 'exact', 'high', standard, exactName[0].name)
    }
    return {
      ...unknown(columnIndex, originalHeader, '需要确认'),
      matchType: 'ambiguous',
      confidence: 'none',
      candidates: exactName.map((item) => ({ itemId: item.id, name: item.name, gender: item.gender })),
      reason: '需要确认'
    }
  }

  const aliasExact = standard.items.filter((item) => (item.aliases ?? []).includes(prepared) || (item.aliases ?? []).includes(originalHeader))
  if (aliasExact.length >= 1) {
    const keys = new Set(aliasExact.map((item) => item.itemKey))
    if (keys.size === 1) {
      return fromItems(columnIndex, originalHeader, aliasExact, 'alias', 'high', standard, aliasExact[0].name)
    }
    return {
      ...unknown(columnIndex, originalHeader, '需要确认'),
      matchType: 'ambiguous',
      confidence: 'none',
      candidates: aliasExact.map((item) => ({ itemId: item.id, name: item.name, gender: item.gender })),
      reason: '需要确认'
    }
  }

  const match = matchExamItem(prepared, standard, null)
  if (match.status === 'matched') {
    const siblings = standard.items.filter((item) => item.itemKey === match.item.itemKey)
    const type: ExamItemMatchType = normalizeExamLabel(match.item.name) === normalized ? 'normalized' : 'alias'
    return fromItems(columnIndex, originalHeader, siblings.length > 0 ? siblings : [match.item], type, match.confidence, standard, match.item.name)
  }
  if (match.status === 'ambiguous') {
    const keys = new Set(match.items.map((item) => item.itemKey))
    if (keys.size === 1) {
      return fromItems(columnIndex, originalHeader, match.items, 'normalized', 'medium', standard, match.items[0].name)
    }
    return {
      ...unknown(columnIndex, originalHeader, '需要确认'),
      matchType: 'ambiguous',
      confidence: 'none',
      candidates: match.items.map((item) => ({ itemId: item.id, name: item.name, gender: item.gender })),
      reason: '需要确认'
    }
  }

  return unknown(columnIndex, originalHeader, '未识别为考试项目')
}

export function columnNeedsConfirmation(column: DetectedExamItemColumn): boolean {
  return column.matchType === 'ambiguous'
}

export function columnAutoConfirmed(column: DetectedExamItemColumn): boolean {
  return (
    column.matchType === 'exact' ||
    column.matchType === 'alias' ||
    column.matchType === 'normalized' ||
    column.matchType === 'gender-derived'
  )
}
