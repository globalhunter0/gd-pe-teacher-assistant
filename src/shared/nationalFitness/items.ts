import { JUNIOR_GRADES, type Grade } from '../class/types'
import { BUILTIN_TEST_ITEMS } from '../peTest/builtinItems'
import type { TestItem } from '../peTest/types'
import { NATIONAL_FITNESS_COVERAGE } from './coverage'
import type { NationalFitnessBonusCategory, NationalFitnessItemDefinition, NationalFitnessItemRole } from './types'

function builtin(key: string): TestItem {
  const found = BUILTIN_TEST_ITEMS.find((item) => item.builtinKey === key)
  if (!found) {
    throw new Error(`缺少日常测试项目：${key}`)
  }
  return found
}

function displayName(item: TestItem): string {
  if (item.builtinKey === '50m') {
    return '50米跑'
  }
  if (item.builtinKey === 'run-800m') {
    return '800米跑'
  }
  if (item.builtinKey === 'run-1000m') {
    return '1000米跑'
  }
  return item.name
}

function gradesForItem(itemKey: string): Grade[] {
  const grades = new Set<Grade>()
  for (const row of NATIONAL_FITNESS_COVERAGE) {
    if (row.itemKey === itemKey) {
      for (const grade of row.grades) {
        grades.add(grade)
      }
    }
  }
  return [...grades]
}

function spec(input: {
  itemKey: string
  name?: string
  role: NationalFitnessItemRole
  isDerived?: boolean
  derivedFromBuiltinKeys?: readonly string[] | null
  gender: NationalFitnessItemDefinition['gender']
  genderExclusive: boolean
  direction: NationalFitnessItemDefinition['direction']
  unitLabel: string
  bonusApplicable: boolean
  bonusCategory: NationalFitnessBonusCategory | null
  participatesInComposite: boolean
  notes: string
  testItemBuiltinKey: string | null
}): NationalFitnessItemDefinition {
  const mapped = input.testItemBuiltinKey ? builtin(input.testItemBuiltinKey) : null
  return {
    itemKey: input.itemKey,
    name: input.name ?? (mapped ? displayName(mapped) : input.itemKey),
    grades: gradesForItem(input.itemKey),
    gender: input.gender,
    genderExclusive: input.genderExclusive,
    role: input.role,
    isDerived: input.isDerived ?? false,
    derivedFromBuiltinKeys: input.derivedFromBuiltinKeys ?? null,
    unit: mapped?.unit ?? 'other',
    unitLabel: input.unitLabel,
    direction: input.direction,
    valueType: mapped?.valueType ?? 'number',
    timeInputMode: mapped?.timeInputMode ?? 'seconds',
    testItemBuiltinKey: mapped?.builtinKey ?? null,
    testItemId: mapped?.id ?? null,
    bonusApplicable: input.bonusApplicable,
    bonusCategory: input.bonusCategory,
    bonusMax: null,
    participatesInComposite: input.participatesInComposite,
    weightPercent: null,
    scoreTable: null,
    bonusTable: null,
    weight: null,
    notes: input.notes
  }
}

export const NATIONAL_FITNESS_ITEM_SPECS: NationalFitnessItemDefinition[] = [
  spec({
    itemKey: 'height',
    role: 'bmi-source',
    gender: 'all',
    genderExclusive: false,
    direction: 'neutral',
    unitLabel: 'cm',
    bonusApplicable: false,
    bonusCategory: null,
    participatesInComposite: false,
    testItemBuiltinKey: 'height',
    notes: '用于计算 BMI，本身不是 0–100 分评分项目。复用日常身高项目。'
  }),
  spec({
    itemKey: 'weight',
    role: 'bmi-source',
    gender: 'all',
    genderExclusive: false,
    direction: 'neutral',
    unitLabel: 'kg',
    bonusApplicable: false,
    bonusCategory: null,
    participatesInComposite: false,
    testItemBuiltinKey: 'weight',
    notes: '用于计算 BMI，本身不是 0–100 分评分项目。复用日常体重项目。'
  }),
  spec({
    itemKey: 'bmi',
    name: 'BMI',
    role: 'derived-evaluation',
    isDerived: true,
    derivedFromBuiltinKeys: ['height', 'weight'],
    gender: 'all',
    genderExclusive: false,
    direction: 'derived',
    unitLabel: 'kg/m²',
    bonusApplicable: false,
    bonusCategory: null,
    participatesInComposite: true,
    testItemBuiltinKey: null,
    notes: '由身高(cm)+体重(kg)派生，方向为 derived/neutral，不是越高越好或越低越好。评分区间待 Phase C 核验。'
  }),
  spec({
    itemKey: 'vital-capacity',
    role: 'measured',
    gender: 'all',
    genderExclusive: false,
    direction: 'higherBetter',
    unitLabel: 'mL',
    bonusApplicable: false,
    bonusCategory: null,
    participatesInComposite: true,
    testItemBuiltinKey: 'vital-capacity',
    notes: '复用日常肺活量。评分表未收录。'
  }),
  spec({
    itemKey: '50m',
    role: 'measured',
    gender: 'all',
    genderExclusive: false,
    direction: 'lowerBetter',
    unitLabel: '秒',
    bonusApplicable: false,
    bonusCategory: null,
    participatesInComposite: true,
    testItemBuiltinKey: '50m',
    notes: '复用日常 50米。时间底层为秒。评分表未收录。'
  }),
  spec({
    itemKey: 'sit-and-reach',
    role: 'measured',
    gender: 'all',
    genderExclusive: false,
    direction: 'higherBetter',
    unitLabel: 'cm',
    bonusApplicable: false,
    bonusCategory: null,
    participatesInComposite: true,
    testItemBuiltinKey: 'sit-and-reach',
    notes: '复用日常坐位体前屈。评分表未收录。'
  }),
  spec({
    itemKey: 'skip-1min',
    role: 'measured',
    gender: 'all',
    genderExclusive: false,
    direction: 'higherBetter',
    unitLabel: '次',
    bonusApplicable: true,
    bonusCategory: 'rope-skip',
    participatesInComposite: true,
    testItemBuiltinKey: 'skip-1min',
    notes: '小学项目。复用日常 1分钟跳绳。附加分换算表待 Phase C。'
  }),
  spec({
    itemKey: 'sit-up-1min',
    role: 'measured',
    gender: 'all',
    genderExclusive: false,
    direction: 'higherBetter',
    unitLabel: '次',
    bonusApplicable: true,
    bonusCategory: 'strength',
    participatesInComposite: true,
    testItemBuiltinKey: 'sit-up-1min',
    notes: '小学三至六年级男女均测；初中高中仅女生。附加分仅初中高中女生。评分表未收录。'
  }),
  spec({
    itemKey: 'shuttle-50m-8',
    role: 'measured',
    gender: 'all',
    genderExclusive: false,
    direction: 'lowerBetter',
    unitLabel: '秒',
    bonusApplicable: false,
    bonusCategory: null,
    participatesInComposite: true,
    testItemBuiltinKey: 'shuttle-50m-8',
    notes: '小学五、六年级项目。时间底层为秒，复用现有时间解析。评分表未收录。'
  }),
  spec({
    itemKey: 'standing-long-jump',
    role: 'measured',
    gender: 'all',
    genderExclusive: false,
    direction: 'higherBetter',
    unitLabel: 'cm',
    bonusApplicable: false,
    bonusCategory: null,
    participatesInComposite: true,
    testItemBuiltinKey: 'standing-long-jump',
    notes: '初中高中项目。复用日常立定跳远。评分表未收录。'
  }),
  spec({
    itemKey: 'pull-up',
    role: 'measured',
    gender: 'male',
    genderExclusive: true,
    direction: 'higherBetter',
    unitLabel: '次',
    bonusApplicable: true,
    bonusCategory: 'strength',
    participatesInComposite: true,
    testItemBuiltinKey: 'pull-up',
    notes: '初中高中男生专属。女生请求 fail-closed。附加分表待 Phase C。'
  }),
  spec({
    itemKey: 'run-1000m',
    role: 'measured',
    gender: 'male',
    genderExclusive: true,
    direction: 'lowerBetter',
    unitLabel: '秒',
    bonusApplicable: true,
    bonusCategory: 'endurance',
    participatesInComposite: true,
    testItemBuiltinKey: 'run-1000m',
    notes: '初中高中男生专属。课堂组合解析为 1000米。各年级评分表必须分开。附加分表待 Phase C。'
  }),
  spec({
    itemKey: 'run-800m',
    role: 'measured',
    gender: 'female',
    genderExclusive: true,
    direction: 'lowerBetter',
    unitLabel: '秒',
    bonusApplicable: true,
    bonusCategory: 'endurance',
    participatesInComposite: true,
    testItemBuiltinKey: 'run-800m',
    notes: '初中高中女生专属。课堂组合解析为 800米。各年级评分表必须分开。附加分表待 Phase C。'
  })
]

export const JUNIOR_NATIONAL_FITNESS_ITEMS: NationalFitnessItemDefinition[] = NATIONAL_FITNESS_ITEM_SPECS.filter((item) =>
  item.grades.some((grade) => JUNIOR_GRADES.includes(grade))
)

export function juniorNationalFitnessItemKeys(): string[] {
  return JUNIOR_NATIONAL_FITNESS_ITEMS.map((item) => item.itemKey)
}

export function findJuniorNationalFitnessItem(itemKey: string): NationalFitnessItemDefinition | undefined {
  return JUNIOR_NATIONAL_FITNESS_ITEMS.find((item) => item.itemKey === itemKey)
}

export function findNationalFitnessItemSpec(itemKey: string): NationalFitnessItemDefinition | undefined {
  return NATIONAL_FITNESS_ITEM_SPECS.find((item) => item.itemKey === itemKey)
}

export function findNationalFitnessItemSpecByTestItem(
  query: { testItemId?: string | null; testItemBuiltinKey?: string | null }
): NationalFitnessItemDefinition | undefined {
  return NATIONAL_FITNESS_ITEM_SPECS.find((item) => {
    if (query.testItemBuiltinKey && item.testItemBuiltinKey === query.testItemBuiltinKey) {
      return true
    }
    if (query.testItemId && item.testItemId === query.testItemId) {
      return true
    }
    return false
  })
}
