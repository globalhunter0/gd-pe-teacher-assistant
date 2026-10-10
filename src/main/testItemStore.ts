import { BUILTIN_TEST_ITEMS, mergeBuiltinTestItems } from '../shared/peTest/builtinItems'
import { parseTestItems } from '../shared/peTest/validate'
import type { TestItem } from '../shared/peTest/types'
import { loadPeTests } from './peTestStore'
import { loadUserJsonItems, saveUserJsonItems, userJsonPath } from './userJsonFile'

export function getTestItemFilePath(): string {
  return userJsonPath('test-items.json')
}

export async function loadTestItems(): Promise<TestItem[]> {
  const items = await loadUserJsonItems('test-items.json', parseTestItems, BUILTIN_TEST_ITEMS)
  const merged = mergeBuiltinTestItems(items)
  if (merged.added > 0 || merged.patched > 0) {
    await saveUserJsonItems('test-items.json', merged.items, items)
  }
  return merged.items
}

export async function saveTestItems(input: unknown): Promise<TestItem[]> {
  const items = parseTestItems(input)
  for (const builtin of BUILTIN_TEST_ITEMS) {
    const found = items.find((item) => item.builtinKey === builtin.builtinKey)
    if (!found) {
      throw new Error(`不能删除内置项目：${builtin.name}`)
    }
    if (
      !found.isBuiltin ||
      found.id !== builtin.id ||
      found.valueType !== builtin.valueType ||
      found.name !== builtin.name ||
      found.unit !== builtin.unit ||
      found.direction !== builtin.direction ||
      found.genderRule !== builtin.genderRule ||
      found.category !== builtin.category ||
      found.timeInputMode !== builtin.timeInputMode
    ) {
      throw new Error(`不能更改内置项目核心定义：${builtin.name}`)
    }
  }

  const tests = await loadPeTests()
  const remainingIds = new Set(items.map((item) => item.id))
  for (const session of tests) {
    if (!remainingIds.has(session.testItemId)) {
      throw new Error('该测试项目已被体育测试引用，不能删除，只能停用')
    }
  }

  return saveUserJsonItems('test-items.json', items)
}
