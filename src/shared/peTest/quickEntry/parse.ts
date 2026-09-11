import { formatRawValue, parseScoreInput, usesMinuteFormat } from '../scoreFormat'
import { rangeWarning } from '../validate'
import type { TestItem } from '../types'

export type QuickEntryParseOk = {
  ok: true
  rawValue: number
  display: string
  needsConfirm: boolean
  warning: string | null
}

export type QuickEntryParseFail = {
  ok: false
  message: string
}

export type QuickEntryParseResult = QuickEntryParseOk | QuickEntryParseFail

function compactMmssSeconds(text: string): number | null {
  if (!/^\d{3,4}$/.test(text)) {
    return null
  }
  const secondsPart = Number(text.slice(-2))
  const minutesPart = Number(text.slice(0, -2))
  if (secondsPart >= 60) {
    throw new Error('时间格式不正确，秒必须小于 60')
  }
  return minutesPart * 60 + secondsPart
}

function isClearlyAbsurd(value: number, item: TestItem): boolean {
  if (item.minValue !== null && value < item.minValue / 2) {
    return true
  }
  if (item.maxValue !== null && value > item.maxValue * 2) {
    return true
  }
  return false
}

export function parseQuickEntryInput(input: string, item: TestItem): QuickEntryParseResult {
  const text = input.replace(/\u3000/g, ' ').trim()
  if (text === '') {
    return { ok: false, message: '请输入成绩' }
  }

  try {
    let rawValue: number

    if (item.valueType === 'time' && item.timeInputMode === 'minutesSeconds') {
      if (/^\d{1,2}$/.test(text)) {
        return { ok: false, message: '长跑请输入分秒，例如 342 或 3:42，不能当作秒' }
      }
      const compact = compactMmssSeconds(text)
      if (compact !== null) {
        rawValue = compact
      } else {
        rawValue = parseScoreInput(text, item.valueType, item.timeInputMode)
      }
    } else if (item.valueType === 'number' && item.decimalPlaces === 0) {
      if (!/^-?\d+$/.test(text)) {
        return { ok: false, message: '该项目请输入整数成绩' }
      }
      rawValue = parseScoreInput(text, item.valueType, item.timeInputMode)
    } else {
      rawValue = parseScoreInput(text, item.valueType, item.timeInputMode)
    }

    if (isClearlyAbsurd(rawValue, item)) {
      return { ok: false, message: '成绩明显不合理，未保存' }
    }

    const warning = rangeWarning(rawValue, item.minValue, item.maxValue)
    const preferMinute = usesMinuteFormat(item.timeInputMode, item.valueType)
    return {
      ok: true,
      rawValue,
      display: formatRawValue(rawValue, item.valueType, item.decimalPlaces, preferMinute),
      needsConfirm: warning !== null,
      warning
    }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : '成绩格式不正确' }
  }
}
