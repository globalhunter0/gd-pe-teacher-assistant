import type { TestItem } from './types'

const STAMP = '2026-01-01T00:00:00.000Z'

function builtin(
  key: string,
  name: string,
  rest: Omit<TestItem, 'id' | 'builtinKey' | 'name' | 'isBuiltin' | 'isActive' | 'notes' | 'createdAt' | 'updatedAt'>
): TestItem {
  return {
    id: `test-item-builtin-${key}`,
    builtinKey: key,
    name,
    isBuiltin: true,
    isActive: true,
    notes: '',
    createdAt: STAMP,
    updatedAt: STAMP,
    ...rest
  }
}

export const BUILTIN_TEST_ITEMS: TestItem[] = [
  builtin('height', '身高', {
    category: 'body',
    valueType: 'number',
    timeInputMode: 'seconds',
    unit: 'cm',
    customUnitLabel: '',
    direction: 'higherBetter',
    genderRule: 'all',
    decimalPlaces: 1,
    minValue: 100,
    maxValue: 220
  }),
  builtin('weight', '体重', {
    category: 'body',
    valueType: 'number',
    timeInputMode: 'seconds',
    unit: 'kg',
    customUnitLabel: '',
    direction: 'neutral',
    genderRule: 'all',
    decimalPlaces: 1,
    minValue: 20,
    maxValue: 150
  }),
  builtin('vital-capacity', '肺活量', {
    category: 'body',
    valueType: 'number',
    timeInputMode: 'seconds',
    unit: 'ml',
    customUnitLabel: '',
    direction: 'higherBetter',
    genderRule: 'all',
    decimalPlaces: 0,
    minValue: 500,
    maxValue: 8000
  }),
  builtin('50m', '50米', {
    category: 'speed',
    valueType: 'time',
    timeInputMode: 'seconds',
    unit: 's',
    customUnitLabel: '',
    direction: 'lowerBetter',
    genderRule: 'all',
    decimalPlaces: 2,
    minValue: 5,
    maxValue: 20
  }),
  builtin('sit-and-reach', '坐位体前屈', {
    category: 'flexibility',
    valueType: 'number',
    timeInputMode: 'seconds',
    unit: 'cm',
    customUnitLabel: '',
    direction: 'higherBetter',
    genderRule: 'all',
    decimalPlaces: 1,
    minValue: -20,
    maxValue: 40
  }),
  builtin('standing-long-jump', '立定跳远', {
    category: 'strength',
    valueType: 'number',
    timeInputMode: 'seconds',
    unit: 'cm',
    customUnitLabel: '',
    direction: 'higherBetter',
    genderRule: 'all',
    decimalPlaces: 0,
    minValue: 80,
    maxValue: 320
  }),
  builtin('pull-up', '引体向上', {
    category: 'strength',
    valueType: 'number',
    timeInputMode: 'seconds',
    unit: 'times',
    customUnitLabel: '',
    direction: 'higherBetter',
    genderRule: 'male',
    decimalPlaces: 0,
    minValue: 0,
    maxValue: 40
  }),
  builtin('sit-up-1min', '1分钟仰卧起坐', {
    category: 'strength',
    valueType: 'number',
    timeInputMode: 'seconds',
    unit: 'times',
    customUnitLabel: '',
    direction: 'higherBetter',
    genderRule: 'female',
    decimalPlaces: 0,
    minValue: 0,
    maxValue: 80
  }),
  builtin('run-800m', '800米', {
    category: 'endurance',
    valueType: 'time',
    timeInputMode: 'minutesSeconds',
    unit: 's',
    customUnitLabel: '',
    direction: 'lowerBetter',
    genderRule: 'female',
    decimalPlaces: 1,
    minValue: 120,
    maxValue: 600
  }),
  builtin('run-1000m', '1000米', {
    category: 'endurance',
    valueType: 'time',
    timeInputMode: 'minutesSeconds',
    unit: 's',
    customUnitLabel: '',
    direction: 'lowerBetter',
    genderRule: 'male',
    decimalPlaces: 1,
    minValue: 150,
    maxValue: 720
  }),
  builtin('skip-1min', '1分钟跳绳', {
    category: 'endurance',
    valueType: 'number',
    timeInputMode: 'seconds',
    unit: 'times',
    customUnitLabel: '',
    direction: 'higherBetter',
    genderRule: 'all',
    decimalPlaces: 0,
    minValue: 0,
    maxValue: 300
  }),
  builtin('shuttle-50m-8', '50米×8往返跑', {
    category: 'endurance',
    valueType: 'time',
    timeInputMode: 'minutesSeconds',
    unit: 's',
    customUnitLabel: '',
    direction: 'lowerBetter',
    genderRule: 'all',
    decimalPlaces: 1,
    minValue: 80,
    maxValue: 400
  }),
  builtin('bmi', 'BMI', {
    category: 'body', valueType: 'number', timeInputMode: 'seconds', unit: 'other',
    customUnitLabel: 'kg/m²', direction: 'neutral', genderRule: 'all', decimalPlaces: 1,
    minValue: 8, maxValue: 60
  })
]

export function mergeBuiltinTestItems(existing: TestItem[]): { items: TestItem[]; added: number; patched: number } {
  const catalog = new Map(BUILTIN_TEST_ITEMS.map((item) => [item.builtinKey, item]))
  let patched = 0
  const items = existing.map((item) => {
    if (!item.builtinKey) {
      return item
    }

    const builtin = catalog.get(item.builtinKey)
    if (!builtin || item.timeInputMode === builtin.timeInputMode) {
      return item
    }

    patched += 1
    return { ...item, timeInputMode: builtin.timeInputMode }
  })
  const keys = new Set(items.map((item) => item.builtinKey).filter((key): key is string => key !== null))
  const missing = BUILTIN_TEST_ITEMS.filter((item) => item.builtinKey && !keys.has(item.builtinKey))
  return { items: [...items, ...missing], added: missing.length, patched }
}
