import type { TimeInputMode } from './types'

function formatMinuteSeconds(rawValue: number, decimalPlaces: number): string {
  const minutes = Math.floor(rawValue / 60)
  const seconds = rawValue - minutes * 60
  const fixed = seconds.toFixed(decimalPlaces)
  const [intPart, frac] = fixed.split('.')
  const paddedInt = intPart.padStart(2, '0')
  if (frac === undefined || Number(frac) === 0) {
    return `${minutes}:${paddedInt}`
  }
  return `${minutes}:${paddedInt}.${frac}`
}

function parseMinuteSecondsDot(text: string): number | null {
  const oneDigit = text.match(/^(\d+)\.(\d)$/)
  if (oneDigit) {
    throw new Error('长跑请输入两位秒数，例如 3.05 表示 3分05秒，3.42 表示 3分42秒')
  }

  const dotted = text.match(/^(\d+)\.(\d{2})$/)
  if (!dotted) {
    return null
  }

  const minutes = Number(dotted[1])
  const seconds = Number(dotted[2])
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) {
    throw new Error('时间格式不正确')
  }

  if (seconds >= 60) {
    throw new Error('时间格式不正确，秒必须小于 60')
  }

  return minutes * 60 + seconds
}

export function parseScoreInput(
  input: string,
  valueType: 'number' | 'time',
  timeInputMode: TimeInputMode = 'seconds'
): number {
  const text = input.replace(/\u3000/g, ' ').trim()
  if (text === '') {
    throw new Error('成绩不能为空')
  }

  if (valueType === 'number') {
    if (!/^-?\d+(\.\d+)?$/.test(text)) {
      throw new Error('请输入数字成绩')
    }

    const value = Number(text)
    if (!Number.isFinite(value)) {
      throw new Error('成绩不正确')
    }

    return value
  }

  const minuteMatch = text.match(/^(\d+)[:'](\d{1,2}(?:\.\d+)?)$/)
  if (minuteMatch) {
    const minutes = Number(minuteMatch[1])
    const seconds = Number(minuteMatch[2])
    if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || seconds >= 60) {
      throw new Error('时间格式不正确，秒必须小于 60')
    }

    return minutes * 60 + seconds
  }

  if (timeInputMode === 'minutesSeconds') {
    const fromDot = parseMinuteSecondsDot(text)
    if (fromDot !== null) {
      return fromDot
    }

    if (!/^\d+(\.\d+)?$/.test(text)) {
      throw new Error("长跑请输入 3:42、3'42、3.42 或总秒数")
    }

    if (text.includes('.')) {
      throw new Error('长跑小数点格式请使用两位秒数，例如 3.42 或 4.08')
    }

    const totalSeconds = Number(text)
    if (!Number.isFinite(totalSeconds)) {
      throw new Error('时间不正确')
    }

    return totalSeconds
  }

  if (!/^\d+(\.\d+)?$/.test(text)) {
    throw new Error('时间请输入秒，例如 8.32')
  }

  const seconds = Number(text)
  if (!Number.isFinite(seconds)) {
    throw new Error('时间不正确')
  }

  return seconds
}

export function formatRawValue(
  rawValue: number | null,
  valueType: 'number' | 'time',
  decimalPlaces: number,
  preferMinuteFormat: boolean
): string {
  if (rawValue === null) {
    return ''
  }

  if (valueType !== 'time') {
    return rawValue.toFixed(decimalPlaces)
  }

  if (!preferMinuteFormat && rawValue < 60) {
    return rawValue.toFixed(decimalPlaces)
  }

  return formatMinuteSeconds(rawValue, decimalPlaces)
}

export function usesMinuteFormat(timeInputMode: TimeInputMode, valueType: 'number' | 'time'): boolean {
  return valueType === 'time' && timeInputMode === 'minutesSeconds'
}

export function resolveTimeInputMode(
  item: { timeInputMode?: TimeInputMode; builtinKey?: string | null } | undefined,
  snapshot?: TimeInputMode
): TimeInputMode {
  if (item?.timeInputMode === 'seconds' || item?.timeInputMode === 'minutesSeconds') {
    return item.timeInputMode
  }

  if (item?.builtinKey === 'run-800m' || item?.builtinKey === 'run-1000m') {
    return 'minutesSeconds'
  }

  return snapshot === 'minutesSeconds' ? 'minutesSeconds' : 'seconds'
}
