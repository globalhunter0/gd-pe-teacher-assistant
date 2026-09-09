import type { ClassRecord, Grade, Semester } from '../class/types'
import { isListedClass } from '../class/validate'

export interface ParsedClassLabel {
  raw: string
  grade: Grade | null
  className: string
  parseable: boolean
}

export function normalizePersonName(value: string): string {
  return value.replace(/\u3000/g, ' ').trim()
}

export function namesEqual(a: string, b: string): boolean {
  return normalizePersonName(a) === normalizePersonName(b)
}

function compactClassText(raw: string): string {
  return raw
    .replace(/\u3000/g, '')
    .replace(/\s+/g, '')
    .replace(/[（\[【]/g, '(')
    .replace(/[）\]】]/g, ')')
}

function extractClassNumber(text: string): string | null {
  const match = text.match(/\(?(\d{1,2})\)?班?$/) ?? text.match(/(\d{1,2})班/) ?? text.match(/\((\d{1,2})\)/)
  return match?.[1] ?? null
}

const JUNIOR_GRADE_PREFIXES: Array<{ token: string; grade: Grade }> = [
  { token: '初一', grade: '初一' },
  { token: '初二', grade: '初二' },
  { token: '初三', grade: '初三' },
  { token: '七年级', grade: '初一' },
  { token: '八年级', grade: '初二' },
  { token: '九年级', grade: '初三' }
]

function classNameFromRest(rest: string): string | null {
  if (rest === '') {
    return null
  }
  const numbered = extractClassNumber(rest)
  if (numbered) {
    return `${Number(numbered)}班`
  }
  if (rest.endsWith('班')) {
    return rest
  }
  return rest
}

/** Canonical candidate for roster grouping. Not a fuzzy merge of 一年级 vs 初一. */
export function parseClassLabel(raw: string): ParsedClassLabel {
  const original = raw.replace(/\u3000/g, ' ').replace(/\s+/g, ' ').trim()
  const text = compactClassText(raw)
  if (text === '') {
    return { raw: original, grade: null, className: '', parseable: false }
  }

  for (const item of JUNIOR_GRADE_PREFIXES) {
    if (text === item.token) {
      return { raw: original, grade: item.grade, className: '', parseable: false }
    }
    if (text.startsWith(item.token)) {
      const rest = text.slice(item.token.length)
      const className = classNameFromRest(rest)
      if (!className) {
        return { raw: original, grade: item.grade, className: '', parseable: false }
      }
      return { raw: original, grade: item.grade, className, parseable: true }
    }
  }

  const short = text.match(/^([七八九])(?:\((\d{1,2})\)|(\d{1,2}))班$/)
  if (short) {
    const grade: Grade = short[1] === '七' ? '初一' : short[1] === '八' ? '初二' : '初三'
    const num = short[2] ?? short[3]
    return { raw: original, grade, className: `${Number(num)}班`, parseable: true }
  }

  return { raw: original, grade: null, className: original, parseable: false }
}

export function normalizeClassLabel(raw: string): ParsedClassLabel {
  return parseClassLabel(raw)
}

export function classIdentityKey(
  grade: Grade,
  className: string,
  academicYear: string,
  semester: Semester
): string {
  return `${grade}|${className.trim()}|${academicYear}|${semester}`
}

export function recordIdentityKey(record: ClassRecord): string {
  return classIdentityKey(record.grade, record.className, record.academicYear, record.semester)
}

export function findExactClass(
  classes: ReadonlyArray<ClassRecord>,
  grade: Grade,
  className: string,
  academicYear: string,
  semester: Semester
): ClassRecord | undefined {
  const matches = classes.filter(
    (item) =>
      isListedClass(item) &&
      item.grade === grade &&
      item.className.trim() === className.trim() &&
      item.academicYear === academicYear &&
      item.semester === semester
  )
  if (matches.length === 1) {
    return matches[0]
  }
  return undefined
}

export function extractClassLabelFromText(text: string): ParsedClassLabel | null {
  const compact = compactClassText(text)
  const patterns = [
    /(初[一二三](?:\(\d{1,2}\)|\d{1,2})班)/,
    /([七八九]年级(?:\(\d{1,2}\)|\d{1,2})班)/,
    /([七八九](?:\(\d{1,2}\)|\d{1,2})班)/
  ]
  for (const pattern of patterns) {
    const match = compact.match(pattern)
    if (match) {
      const parsed = parseClassLabel(match[1])
      if (parsed.parseable) {
        return parsed
      }
    }
  }
  const parsed = parseClassLabel(text)
  return parsed.parseable ? parsed : null
}
