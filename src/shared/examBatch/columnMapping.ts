import type { ExamStandard } from '../examStandard/types'
import { matchExamItem, matchExamItemKey, normalizeExamLabel } from './matchExamItem'
import type { ExamColumnMapping, ExamColumnRole, MappingConfidence, SuggestedColumnBinding } from './types'

const FIELD_ALIASES: Record<Exclude<ExamColumnRole['kind'], 'ignore' | 'examItem' | 'examItemKey'>, string[]> = {
  studentName: ['姓名', '学生姓名', '名字'],
  studentNo: ['学号', '学生学号', '编号', '序号'],
  gender: ['性别', '男/女'],
  className: ['班级', '行政班', '班别'],
  itemName: ['项目', '测试项目', '考试项目'],
  rawValue: ['成绩', '测试成绩', '考试成绩', '原始成绩']
}

const IGNORE_ALIASES = ['考生类别', '状态']

function fieldKind(title: string): Exclude<ExamColumnRole['kind'], 'examItem' | 'examItemKey'> | null {
  const exact = title.replace(/\u3000/g, ' ').trim()
  const normalized = normalizeExamLabel(exact)
  if (IGNORE_ALIASES.includes(exact) || IGNORE_ALIASES.map(normalizeExamLabel).includes(normalized)) {
    return 'ignore'
  }
  for (const [kind, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.includes(exact) || aliases.map(normalizeExamLabel).includes(normalized)) {
      return kind as Exclude<ExamColumnRole['kind'], 'ignore' | 'examItem' | 'examItemKey'>
    }
  }
  return null
}

function source(index: number, titles: string[]): { sourceColumn: number; sourceHeader: string } {
  return { sourceColumn: index, sourceHeader: titles[index] ?? '' }
}

export function emptyMapping(columnCount: number, titles: string[] = []): ExamColumnMapping {
  return {
    layout: 'wide',
    columns: Array.from({ length: columnCount }, (_item, index) => ({
      kind: 'ignore',
      ...source(index, titles)
    }))
  }
}

export function suggestColumnMapping(
  titles: string[],
  standard: ExamStandard
): { mapping: ExamColumnMapping; suggestions: SuggestedColumnBinding[] } {
  const used = new Set<number>()
  const roles: ExamColumnRole[] = titles.map((_title, index) => ({ kind: 'ignore', ...source(index, titles) }))
  const suggestions: SuggestedColumnBinding[] = []

  function bind(index: number, role: ExamColumnRole, label: string, confidence: MappingConfidence): void {
    roles[index] = { ...role, ...source(index, titles) }
    used.add(index)
    suggestions.push({
      index,
      title: titles[index],
      role: roles[index],
      label,
      confidence,
      candidates: []
    })
  }

  titles.forEach((title, index) => {
    const kind = fieldKind(title)
    if (!kind || used.has(index)) {
      return
    }
    if (kind === 'ignore') bind(index, { kind, ...source(index, titles) }, '忽略', 'high')
    if (kind === 'studentName') bind(index, { kind, ...source(index, titles) }, '姓名', 'high')
    if (kind === 'studentNo') bind(index, { kind, ...source(index, titles) }, '学号', 'high')
    if (kind === 'gender') bind(index, { kind, ...source(index, titles) }, '性别', 'high')
    if (kind === 'className') bind(index, { kind, ...source(index, titles) }, '班级', 'high')
    if (kind === 'itemName') bind(index, { kind, ...source(index, titles) }, '项目', 'high')
    if (kind === 'rawValue') bind(index, { kind, ...source(index, titles) }, '成绩', 'high')
  })

  titles.forEach((title, index) => {
    if (used.has(index)) {
      return
    }
    const match = matchExamItem(title, standard, null)
    const itemKey = matchExamItemKey(title, standard)
    if (match.status === 'matched') {
      bind(index, { kind: 'examItemKey', itemKey: match.item.itemKey, ...source(index, titles) }, match.item.name, match.confidence)
      suggestions[suggestions.length - 1].candidates = [{ itemId: match.item.id, name: match.item.name }]
      return
    }
    if (match.status === 'ambiguous' && itemKey) {
      bind(index, { kind: 'examItemKey', itemKey, ...source(index, titles) }, match.items[0].name, 'medium')
      suggestions[suggestions.length - 1].candidates = match.items.map((item) => ({ itemId: item.id, name: item.name }))
      return
    }
    if (match.status === 'ambiguous') {
      suggestions.push({
        index,
        title,
        role: roles[index],
        label: '需手动选择项目',
        confidence: 'none',
        candidates: match.items.map((item) => ({ itemId: item.id, name: item.name }))
      })
      return
    }
    suggestions.push({
      index,
      title,
      role: roles[index],
      label: '未识别',
      confidence: 'none',
      candidates: []
    })
  })

  const hasLongFields = roles.some((role) => role.kind === 'itemName') && roles.some((role) => role.kind === 'rawValue')
  const itemColumns = roles.filter((role) => role.kind === 'examItem' || role.kind === 'examItemKey').length
  const layout = hasLongFields && itemColumns === 0 ? 'long' : itemColumns > 0 ? 'wide' : hasLongFields ? 'long' : 'wide'

  return {
    mapping: { layout, columns: roles },
    suggestions
  }
}

export function normalizeExamColumnMapping(mapping: ExamColumnMapping, titles: string[] = []): ExamColumnMapping {
  return {
    layout: mapping.layout,
    columns: mapping.columns.map((role, index) => ({
      ...role,
      sourceColumn: Number.isInteger(role.sourceColumn) ? role.sourceColumn : index,
      sourceHeader: role.sourceHeader || titles[index] || ''
    }))
  }
}

export function mappingFromPayload(input: unknown, columnCount: number): ExamColumnMapping {
  if (typeof input !== 'object' || input === null) {
    throw new Error('列映射不正确')
  }
  const record = input as Record<string, unknown>
  const layout = record.layout === 'long' ? 'long' : record.layout === 'wide' ? 'wide' : null
  if (!layout) {
    throw new Error('表格类型不正确')
  }
  if (!Array.isArray(record.columns) || record.columns.length !== columnCount) {
    throw new Error('列映射数量不正确')
  }

  const columns = record.columns.map((entry, index) => parseRole(entry, index))
  return { layout, columns }
}

function parseRole(value: unknown, index: number): ExamColumnRole {
  if (typeof value !== 'object' || value === null) {
    throw new Error('列映射不正确')
  }
  const role = value as Record<string, unknown>
  const sourceColumn = typeof role.sourceColumn === 'number' && Number.isInteger(role.sourceColumn) ? role.sourceColumn : index
  const sourceHeader = typeof role.sourceHeader === 'string' ? role.sourceHeader : ''
  const sourced = { sourceColumn, sourceHeader }
  switch (role.kind) {
    case 'ignore':
    case 'studentNo':
    case 'studentName':
    case 'gender':
    case 'className':
    case 'itemName':
    case 'rawValue':
      return { kind: role.kind, ...sourced }
    case 'examItem':
      if (typeof role.itemId !== 'string' || role.itemId.trim() === '') {
        throw new Error('项目映射不正确')
      }
      return { kind: 'examItem', itemId: role.itemId, ...sourced }
    case 'examItemKey':
      if (typeof role.itemKey !== 'string' || role.itemKey.trim() === '') {
        throw new Error('项目映射不正确')
      }
      return { kind: 'examItemKey', itemKey: role.itemKey, ...sourced }
    default:
      throw new Error('列映射不正确')
  }
}

export function roleLabel(role: ExamColumnRole, standard: ExamStandard): string {
  switch (role.kind) {
    case 'ignore':
      return '忽略'
    case 'studentNo':
      return '学号'
    case 'studentName':
      return '姓名'
    case 'gender':
      return '性别'
    case 'className':
      return '班级'
    case 'itemName':
      return '项目'
    case 'rawValue':
      return '成绩'
    case 'examItem':
      return standard.items.find((item) => item.id === role.itemId)?.name ?? role.itemId
    case 'examItemKey': {
      const named = standard.items.find((item) => item.itemKey === role.itemKey)
      return named?.name ?? role.itemKey
    }
  }
}
