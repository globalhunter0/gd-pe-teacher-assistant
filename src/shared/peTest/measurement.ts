import { parseScoreInput } from './scoreFormat'
import { convertPeTestRawToExamRaw } from './quickEntry/units'
import type { TestItem, TestUnit, TestRecordStatus } from './types'

export function inputStatus(input: string): TestRecordStatus | null {
  const text = input.trim().toLowerCase()
  if (['a', 'absent', '缺考', '缺测'].includes(text)) return 'absent'
  if (['exempt', '免考', '免测'].includes(text)) return 'exempt'
  if (['', 'pending', '未测', '未测试'].includes(text)) return 'pending'
  return null
}

export function explicitColumnUnit(header: string): string | undefined {
  const unit = header.match(/[（(]\s*(总秒数|秒|seconds?|s|厘米|cm|米|m|毫升|ml|千克|公斤|kg|次)\s*[）)]/i)
  if (unit) return unit[1]
  if (/^(总秒数|秒|seconds?)$/i.test(header.trim())) return header.trim()
  return header.match(/(?:总秒数|seconds|秒)$/i)?.[0]
}

function canonicalUnit(unit: string): TestUnit | null {
  const aliases: Record<string, TestUnit> = { 秒: 's', 总秒数: 's', second: 's', seconds: 's', s: 's', cm: 'cm', 厘米: 'cm', m: 'm', 米: 'm', ml: 'ml', 毫升: 'ml', kg: 'kg', 千克: 'kg', 公斤: 'kg', 次: 'times', times: 'times' }
  return aliases[unit.toLowerCase()] ?? null
}

/** Project-aware input; stored time values are always seconds. Explicit units win. */
export function parseMeasurement(input: string, item: Pick<TestItem, 'valueType' | 'timeInputMode' | 'unit' | 'decimalPlaces'>, columnUnit?: string): number {
  let text = input.trim()
  const suffix = text.match(/^(-?\d+(?:\.\d+)?)\s*(总秒数|秒|seconds?|s|厘米|cm|米|m|毫升|ml|千克|公斤|kg|次)$/i)
  const unit = canonicalUnit(suffix?.[2] ?? columnUnit ?? '')
  if (suffix) text = suffix[1]
  let value = parseScoreInput(text, item.valueType, unit === 's' ? 'seconds' : item.timeInputMode)
  if (unit && unit !== item.unit) {
    value = convertPeTestRawToExamRaw(unit, item.unit, value)
  }
  if (!Number.isFinite(value)) throw new Error('成绩不正确')
  if (item.valueType === 'number' && item.unit === 'times' && !Number.isInteger(value)) throw new Error('次数必须是整数')
  return value
}
