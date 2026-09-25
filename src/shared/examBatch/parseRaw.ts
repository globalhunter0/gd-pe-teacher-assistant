import { parseMeasurement, inputStatus } from '../peTest/measurement'
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
    return '支持 3:45 / 3\'45 / 3.45 / 345 / 225秒'
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

function fromUnknown(value: unknown, item: ExamItemDefinition, columnUnit?: string): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null
  if (String(value).trim() === '') return null
  try {
    // Excel fractional-day values; explicit column units take precedence.
    if (typeof value === 'number' && item.valueType === 'time' && !columnUnit) {
      const serial = excelSerialToSeconds(value)
      if (serial !== null) return serial
    }
    // Do not round input or invent dropped digits; formatted cells may supply an explicit trailing zero.
    const text = String(value)
    return parseMeasurement(text, item, columnUnit)
  } catch { return null }
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

const NON_SCORE_BY_LENGTH = [...EXAM_NON_SCORE_LABELS].sort((left, right) => right.length - left.length)

export function normalizeExamNonScoreText(value: unknown): string {
  if (value == null || value === '') {
    return ''
  }
  const text = typeof value === 'number' && Number.isFinite(value) ? String(value) : String(value)
  return text.replace(/[\s\u00a0\u3000\u200b\ufeff]/g, '').replace(/[()[\]（）【】]/g, '').replace(/[。．.、]/g, '')
}

export function detectExamNonScoreLabel(value: unknown): ExamNonScoreLabel | null {
  const status = inputStatus(String(value ?? ''))
  if (status === 'absent') return '缺考'
  if (status === 'exempt') return '免考'
  if (status === 'pending' && String(value ?? '').trim() !== '') return '未测'
  const text = normalizeExamNonScoreText(value)
  if (text === '') {
    return null
  }
  return NON_SCORE_BY_LENGTH.find((label) => text === label) ?? null
}

export function detectExamNonScoreLabelFromMessage(message: string): ExamNonScoreLabel | null {
  const match = message.match(/原始记录为(未测试|未测|缺考|免考|缓考|请假)/)
  return match ? detectExamNonScoreLabel(match[1]) : null
}

export function nonScoreLabelFromBatchRow(row: { rawValueOriginal: string; message: string }): ExamNonScoreLabel | null {
  return detectExamNonScoreLabel(row.rawValueOriginal) ?? detectExamNonScoreLabelFromMessage(row.message)
}

export function isBlankExamCell(display: string, raw: unknown): boolean {
  const text = display.replace(/\u3000/g, ' ').trim()
  if (text !== '') {
    return false
  }
  if (raw === null || raw === undefined || raw === '') {
    return true
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return false
  }
  return String(raw).replace(/\u3000/g, ' ').trim() === ''
}

export function nonScoreRecordMessage(label: ExamNonScoreLabel): string {
  return `原始记录为${label}，未参与评分`
}

export function parseExamBatchRawValue(
  display: string,
  raw: unknown,
  item: ExamItemDefinition,
  columnUnit?: string
): ParseBatchRawResult {
  const candidates = [raw, display]
  let lastValue: unknown = display
  for (const candidate of candidates) {
    lastValue = candidate
    const parsed = fromUnknown(candidate, item, columnUnit)
    if (parsed !== null && Number.isFinite(parsed)) {
      return { ok: true, value: parsed }
    }
  }
  return fail(item, lastValue)
}
