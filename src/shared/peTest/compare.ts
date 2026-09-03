import type { TestDirection } from './types'
import { formatRawValue } from './scoreFormat'

export interface PreviousScore {
  date: string
  rawValue: number
  sessionId: string
}

export function compareToPrevious(
  current: number,
  previous: number,
  direction: TestDirection,
  valueType: 'number' | 'time',
  decimalPlaces: number,
  preferMinuteFormat: boolean,
  unitLabel: string
): { kind: 'improved' | 'declined' | 'same'; text: string } | null {
  if (direction === 'neutral') {
    return null
  }

  const delta = current - previous
  if (Math.abs(delta) < 1 / 10 ** Math.max(decimalPlaces, 1) / 2 && delta === 0) {
    return { kind: 'same', text: '与上次相同' }
  }

  const improved = direction === 'higherBetter' ? delta > 0 : delta < 0
  const abs = Math.abs(delta)
  const formatted = formatRawValue(abs, valueType, decimalPlaces, preferMinuteFormat && valueType === 'time' && abs >= 60)
  const label = improved ? '进步' : '退步'
  return {
    kind: improved ? 'improved' : 'declined',
    text: `${label} ${formatted}${valueType === 'time' && abs < 60 ? ' 秒' : unitLabel ? ` ${unitLabel}` : ''}`
  }
}

export function findPreviousValidScore(
  history: Array<{ date: string; id: string; createdAt?: string; rawValue: number | null; status: string }>,
  currentDate: string,
  currentSessionId: string
): PreviousScore | null {
  const current = history.find((item) => item.id === currentSessionId)
  const currentCreated = current?.createdAt ?? ''

  const previous = history
    .filter(
      (item) =>
        item.status === 'valid' &&
        item.rawValue !== null &&
        item.id !== currentSessionId &&
        item.date <= currentDate
    )
    .sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date)
      if (dateCmp !== 0) {
        return dateCmp
      }

      return (b.createdAt ?? '').localeCompare(a.createdAt ?? '') || b.id.localeCompare(a.id)
    })
    .find((item) => {
      if (item.date < currentDate) {
        return true
      }

      if (currentCreated && item.createdAt) {
        return item.createdAt < currentCreated
      }

      return item.id < currentSessionId
    })

  if (!previous || previous.rawValue === null) {
    return null
  }

  return { date: previous.date, rawValue: previous.rawValue, sessionId: previous.id }
}
