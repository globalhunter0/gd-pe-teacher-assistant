import type { ExamGender, ExamItemDefinition, ExamStandard } from '../examStandard/types'
import { itemAppliesToGender } from '../examStandard/score'

export type ExamItemMatch =
  | { status: 'matched'; item: ExamItemDefinition; confidence: 'high' | 'medium' }
  | { status: 'ambiguous'; items: ExamItemDefinition[] }
  | { status: 'unmatched' }

const CN_NUM: Record<string, string> = {
  一千米: '1000米',
  八百米: '800米',
  一百米: '100米',
  五十米: '50米'
}

export function normalizeExamLabel(value: string): string {
  let text = value
    .replace(/\u3000/g, ' ')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/×/g, 'x')
    .replace(/\s+/g, '')
    .trim()
    .toLowerCase()

  for (const [from, to] of Object.entries(CN_NUM)) {
    if (text === from || text.startsWith(from)) {
      text = to + text.slice(from.length)
    }
  }

  return text
}

function collect(item: ExamItemDefinition): { exact: string[]; normalized: string[] } {
  const exact = [item.id, item.name, ...(item.aliases ?? [])]
  return {
    exact,
    normalized: exact.map(normalizeExamLabel).filter((value) => value !== '')
  }
}

export function matchExamItem(
  rawLabel: string,
  standard: ExamStandard,
  gender?: Exclude<ExamGender, 'all'> | null
): ExamItemMatch {
  const label = rawLabel.replace(/\u3000/g, ' ').trim()
  if (label === '') {
    return { status: 'unmatched' }
  }

  const pool = standard.items.filter((item) => !gender || itemAppliesToGender(item, gender))
  const normalizedLabel = normalizeExamLabel(label)

  const byId = pool.filter((item) => item.id === label)
  if (byId.length === 1) {
    return { status: 'matched', item: byId[0], confidence: 'high' }
  }
  if (byId.length > 1) {
    return { status: 'ambiguous', items: byId }
  }

  const byName = pool.filter((item) => item.name === label)
  if (byName.length === 1) {
    return { status: 'matched', item: byName[0], confidence: 'high' }
  }
  if (byName.length > 1) {
    return collapseGender(byName, gender)
  }

  const byAlias = pool.filter((item) => (item.aliases ?? []).includes(label))
  if (byAlias.length === 1) {
    return { status: 'matched', item: byAlias[0], confidence: 'high' }
  }
  if (byAlias.length > 1) {
    return collapseGender(byAlias, gender)
  }

  const byNormalizedName = pool.filter((item) => normalizeExamLabel(item.name) === normalizedLabel)
  if (byNormalizedName.length === 1) {
    return { status: 'matched', item: byNormalizedName[0], confidence: 'medium' }
  }
  if (byNormalizedName.length > 1) {
    return collapseGender(byNormalizedName, gender)
  }

  const byNormalizedAlias = pool.filter((item) =>
    [item.id, item.name, ...(item.aliases ?? [])].some((alias) => normalizeExamLabel(alias) === normalizedLabel)
  )
  if (byNormalizedAlias.length === 1) {
    return { status: 'matched', item: byNormalizedAlias[0], confidence: 'medium' }
  }
  if (byNormalizedAlias.length > 1) {
    return collapseGender(byNormalizedAlias, gender)
  }

  void collect
  return { status: 'unmatched' }
}

function collapseGender(
  items: ExamItemDefinition[],
  gender?: Exclude<ExamGender, 'all'> | null
): ExamItemMatch {
  if (gender) {
    const narrowed = items.filter((item) => itemAppliesToGender(item, gender))
    if (narrowed.length === 1) {
      return { status: 'matched', item: narrowed[0], confidence: 'high' }
    }
    if (narrowed.length === 0) {
      return { status: 'unmatched' }
    }
  }

  const keys = new Set(items.map((item) => item.itemKey))
  if (keys.size === 1 && !gender) {
    return { status: 'ambiguous', items }
  }

  return { status: 'ambiguous', items }
}

export function matchExamItemKey(rawLabel: string, standard: ExamStandard): string | null {
  const match = matchExamItem(rawLabel, standard, null)
  if (match.status === 'matched') {
    return match.item.itemKey
  }
  if (match.status === 'ambiguous') {
    const keys = new Set(match.items.map((item) => item.itemKey))
    if (keys.size === 1) {
      return match.items[0].itemKey
    }
  }
  return null
}
