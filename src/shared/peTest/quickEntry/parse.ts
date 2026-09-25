import { parseMeasurement } from '../measurement'
import { formatRawValue, usesMinuteFormat } from '../scoreFormat'
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

function isClearlyAbsurd(value: number, item: TestItem): boolean {
  if (item.minValue !== null && value < (item.minValue < 0 ? item.minValue * 2 : item.minValue / 2)) {
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
    const rawValue = parseMeasurement(text, item)

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
