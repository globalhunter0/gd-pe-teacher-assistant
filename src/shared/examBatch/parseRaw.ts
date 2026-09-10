import { parseExamPerformanceInput } from '../examStandard/score'
import type { ExamItemDefinition } from '../examStandard/types'

export type ParseBatchRawResult = { ok: true; value: number } | { ok: false; message: string }

function originalLabel(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'string') {
    return value.trim()
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString()
  }
  return String(value)
}

export function expectedRawFormat(item: ExamItemDefinition): string {
  if (item.valueType === 'time' && item.timeInputMode === 'minutesSeconds') {
    return '支持 3:45 / 3\'45 / 3.45 / 225'
  }
  if (item.valueType === 'time') {
    return '请输入秒，例如 7.82 或 11.48'
  }
  if (item.unit === 'times') {
    return '请输入数字，例如 171'
  }
  return '请输入数字，例如 2.35'
}

function fail(item: ExamItemDefinition, value: unknown): ParseBatchRawResult {
  const shown = originalLabel(value)
  return {
    ok: false,
    message: `原始值：${shown === '' ? '（空）' : shown}；项目：${item.name}；预期格式：${expectedRawFormat(item)}`
  }
}

function excelSerialToSeconds(value: number): number | null {
  if (!Number.isFinite(value) || value <= 0 || value >= 1) {
    return null
  }
  return Math.round(value * 86400 * 1000) / 1000
}

function tryParseText(text: string, item: ExamItemDefinition): number | null {
  const trimmed = text.replace(/\u3000/g, ' ').trim()
  if (trimmed === '') {
    return null
  }
  try {
    return parseExamPerformanceInput(trimmed, item)
  } catch {
    return null
  }
}

function fromNumber(value: number, item: ExamItemDefinition): number | null {
  if (!Number.isFinite(value)) {
    return null
  }

  if (item.valueType === 'number') {
    return value
  }

  const serial = excelSerialToSeconds(value)
  if (serial !== null) {
    return serial
  }

  if (item.timeInputMode === 'minutesSeconds') {
    if (Number.isInteger(value)) {
      return tryParseText(String(value), item)
    }
    return tryParseText(value.toFixed(2), item)
  }

  return value
}

function fromUnknown(value: unknown, item: ExamItemDefinition): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value === 'number') {
    return fromNumber(value, item)
  }

  if (typeof value === 'string') {
    const trimmed = value.replace(/\u3000/g, ' ').replace(/次$/u, '').trim()
    if (trimmed === '') {
      return null
    }
    const numeric = Number(trimmed)
    if (item.valueType === 'time' && item.timeInputMode === 'minutesSeconds' && /^\d+\.\d+$/.test(trimmed)) {
      const parsed = tryParseText(trimmed, item)
      if (parsed !== null) {
        return parsed
      }
      if (/^\d+\.\d$/.test(trimmed) && Number.isFinite(numeric)) {
        return tryParseText(numeric.toFixed(2), item)
      }
    }
    return tryParseText(trimmed, item)
  }

  if (typeof value === 'boolean') {
    return null
  }

  return null
}

/** 按考试项目解析 Excel 单元格（number / string / 时间序列）。 */
export function parseBatchRawValue(value: unknown, item: ExamItemDefinition): ParseBatchRawResult {
  const parsed = fromUnknown(value, item)
  if (parsed !== null && Number.isFinite(parsed)) {
    return { ok: true, value: parsed }
  }
  return fail(item, value)
}

export const EXAM_NON_SCORE_LABELS = ['缺考', '免考', '缓考', '请假', '未测试', '未测'] as const
export type ExamNonScoreLabel = (typeof EXAM_NON_SCORE_LABELS)[number]

export function detectExamNonScoreLabel(value: unknown): ExamNonScoreLabel | null {
  const text =
    typeof value === 'string'
      ? value.replace(/\u3000/g, ' ').trim()
      : value == null || value === ''
        ? ''
        : String(value).replace(/\u3000/g, ' ').trim()
  if (text === '') {
    return null
  }
  return EXAM_NON_SCORE_LABELS.find((label) => text === label) ?? null
}

export function nonScoreRecordMessage(label: ExamNonScoreLabel): string {
  return `原始记录为${label}，未参与评分`
}

export function parseExamBatchRawValue(
  display: string,
  raw: unknown,
  item: ExamItemDefinition
): ParseBatchRawResult {
  const candidates = [raw, display]
  let lastValue: unknown = display
  for (const candidate of candidates) {
    lastValue = candidate
    const parsed = fromUnknown(candidate, item)
    if (parsed !== null && Number.isFinite(parsed)) {
      return { ok: true, value: parsed }
    }
  }
  return fail(item, lastValue)
}
