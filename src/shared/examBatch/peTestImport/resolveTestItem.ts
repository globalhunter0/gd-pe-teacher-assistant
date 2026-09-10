import type { ExamItemDefinition } from '../../examStandard/types'
import type { TestItem } from '../../peTest/types'

/** 中考标准里的日常测试键/ID 与内置 TestItem 不完全同名，入库时必须走别名。 */
const BUILTIN_KEY_ALIASES: Record<string, string> = {
  'rope-skip-1min': 'skip-1min',
  'sit-up': 'sit-up-1min',
  'run-50m': '50m'
}

const TEST_ITEM_ID_ALIASES: Record<string, string> = {
  'test-item-builtin-rope-skip-1min': 'test-item-builtin-skip-1min',
  'test-item-builtin-sit-up': 'test-item-builtin-sit-up-1min',
  'test-item-builtin-run-50m': 'test-item-builtin-50m'
}

export function resolveExamItemToTestItem(
  examItem: Pick<ExamItemDefinition, 'testItemId' | 'testItemBuiltinKey' | 'itemKey' | 'name'>,
  testItems: ReadonlyArray<TestItem>
): TestItem | null {
  const byId = new Map(testItems.map((item) => [item.id, item]))
  const byKey = new Map(
    testItems.filter((item) => item.builtinKey).map((item) => [item.builtinKey as string, item])
  )
  const found = new Map<string, TestItem>()

  function add(item: TestItem | undefined): void {
    if (item) {
      found.set(item.id, item)
    }
  }

  const idCandidates = [examItem.testItemId, examItem.testItemId ? TEST_ITEM_ID_ALIASES[examItem.testItemId] : undefined]
  for (const id of idCandidates) {
    if (id) {
      add(byId.get(id))
    }
  }

  const keyCandidates = [
    examItem.testItemBuiltinKey,
    examItem.itemKey,
    examItem.testItemBuiltinKey ? BUILTIN_KEY_ALIASES[examItem.testItemBuiltinKey] : undefined,
    examItem.itemKey ? BUILTIN_KEY_ALIASES[examItem.itemKey] : undefined
  ]
  for (const key of keyCandidates) {
    if (key) {
      add(byKey.get(key))
    }
  }

  if (found.size !== 1) {
    return null
  }
  return [...found.values()][0]
}
