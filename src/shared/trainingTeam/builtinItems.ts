import type { TestDirection, TestUnit, TestValueType, TimeInputMode } from '../peTest/types'
import type { TrainingItem } from './types'

const STAMP = '2026-01-01T00:00:00.000Z'

function builtin(
  key: string,
  name: string,
  rest: {
    valueType: TestValueType
    timeInputMode: TimeInputMode
    unit: TestUnit
    direction: TestDirection
    decimalPlaces: number
  }
): TrainingItem {
  return {
    id: `training-item-builtin-${key}`,
    builtinKey: key,
    name,
    customUnitLabel: '',
    isBuiltin: true,
    isActive: true,
    notes: '',
    createdAt: STAMP,
    updatedAt: STAMP,
    ...rest
  }
}

export const BUILTIN_TRAINING_ITEMS: TrainingItem[] = [
  builtin('run-50m', '50米', {
    valueType: 'time',
    timeInputMode: 'seconds',
    unit: 's',
    direction: 'lowerBetter',
    decimalPlaces: 2
  }),
  builtin('run-100m', '100米', {
    valueType: 'time',
    timeInputMode: 'seconds',
    unit: 's',
    direction: 'lowerBetter',
    decimalPlaces: 2
  }),
  builtin('run-200m', '200米', {
    valueType: 'time',
    timeInputMode: 'seconds',
    unit: 's',
    direction: 'lowerBetter',
    decimalPlaces: 2
  }),
  builtin('run-400m', '400米', {
    valueType: 'time',
    timeInputMode: 'seconds',
    unit: 's',
    direction: 'lowerBetter',
    decimalPlaces: 2
  }),
  builtin('run-800m', '800米', {
    valueType: 'time',
    timeInputMode: 'minutesSeconds',
    unit: 's',
    direction: 'lowerBetter',
    decimalPlaces: 1
  }),
  builtin('run-1000m', '1000米', {
    valueType: 'time',
    timeInputMode: 'minutesSeconds',
    unit: 's',
    direction: 'lowerBetter',
    decimalPlaces: 1
  }),
  builtin('standing-long-jump', '立定跳远', {
    valueType: 'number',
    timeInputMode: 'seconds',
    unit: 'm',
    direction: 'higherBetter',
    decimalPlaces: 2
  }),
  builtin('long-jump', '跳远', {
    valueType: 'number',
    timeInputMode: 'seconds',
    unit: 'm',
    direction: 'higherBetter',
    decimalPlaces: 2
  }),
  builtin('high-jump', '跳高', {
    valueType: 'number',
    timeInputMode: 'seconds',
    unit: 'm',
    direction: 'higherBetter',
    decimalPlaces: 2
  }),
  builtin('medicine-ball', '实心球', {
    valueType: 'number',
    timeInputMode: 'seconds',
    unit: 'm',
    direction: 'higherBetter',
    decimalPlaces: 2
  }),
  builtin('rope-skip', '一分钟跳绳', {
    valueType: 'number',
    timeInputMode: 'seconds',
    unit: 'times',
    direction: 'higherBetter',
    decimalPlaces: 0
  }),
  builtin('basketball-dribble', '篮球运球绕杆', {
    valueType: 'time',
    timeInputMode: 'seconds',
    unit: 's',
    direction: 'lowerBetter',
    decimalPlaces: 2
  }),
  builtin('football-dribble', '足球运球绕杆', {
    valueType: 'time',
    timeInputMode: 'seconds',
    unit: 's',
    direction: 'lowerBetter',
    decimalPlaces: 2
  })
]

export function mergeBuiltinTrainingItems(existing: TrainingItem[]): TrainingItem[] {
  const keys = new Set(existing.map((item) => item.builtinKey).filter((key): key is string => key !== null))
  const missing = BUILTIN_TRAINING_ITEMS.filter((item) => item.builtinKey && !keys.has(item.builtinKey))
  return [...existing, ...missing]
}
