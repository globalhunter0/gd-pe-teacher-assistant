import { parseScoreInput } from '../../peTest/scoreFormat'
import { formatRawValue, usesMinuteFormat } from '../../peTest/scoreFormat'
import type { NationalFitnessItemDefinition } from '../types'
import type { NationalFitnessScoreTable } from './types'

/** 时间成绩统一转为秒。禁止用字符串比较时间。 */
export function parseNationalFitnessRawValue(rawInput: string, item: NationalFitnessItemDefinition): number {
  return parseScoreInput(rawInput, item.valueType, item.timeInputMode)
}

export function formatNationalFitnessRawValue(rawValue: number, item: NationalFitnessItemDefinition): string {
  return formatRawValue(rawValue, item.valueType, item.valueType === 'time' ? 0 : 1, usesMinuteFormat(item.timeInputMode, item.valueType))
}

export function formatNationalFitnessTableValue(rawValue: number, table: NationalFitnessScoreTable): string {
  const valueType = table.valueKind === 'time' ? 'time' : 'number'
  const preferMinute = table.valueKind === 'time'
  return formatRawValue(rawValue, valueType, table.valueKind === 'time' ? 0 : 1, preferMinute)
}
