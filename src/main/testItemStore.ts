import { app } from 'electron'
import { access, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { BUILTIN_TEST_ITEMS, mergeBuiltinTestItems } from '../shared/peTest/builtinItems'
import { parseTestItems } from '../shared/peTest/validate'
import type { TestItem } from '../shared/peTest/types'
import { loadPeTests } from './peTestStore'

interface TestItemFile {
  version: 1
  updatedAt: string
  items: TestItem[]
}

export function getTestItemFilePath(): string {
  return join(app.getPath('userData'), 'test-items.json')
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function writeTestItemFile(items: TestItem[]): Promise<void> {
  const filePath = getTestItemFilePath()
  await mkdir(dirname(filePath), { recursive: true })
  const payload: TestItemFile = {
    version: 1,
    updatedAt: new Date().toISOString(),
    items
  }
  const text = `${JSON.stringify(payload, null, 2)}\n`
  const tmpPath = `${filePath}.${process.pid}.tmp`
  await writeFile(tmpPath, text, 'utf8')
  try {
    await rename(tmpPath, filePath)
  } catch {
    await writeFile(filePath, text, 'utf8')
    try {
      await unlink(tmpPath)
    } catch {
      // ignore
    }
  }
}

export async function loadTestItems(): Promise<TestItem[]> {
  const filePath = getTestItemFilePath()

  if (!(await fileExists(filePath))) {
    await writeTestItemFile(BUILTIN_TEST_ITEMS)
    return BUILTIN_TEST_ITEMS
  }

  try {
    const raw = await readFile(filePath, 'utf8')
    const parsed: unknown = JSON.parse(raw)
    const itemsSource = Array.isArray(parsed)
      ? parsed
      : parsed !== null && typeof parsed === 'object' && 'items' in parsed
        ? (parsed as { items: unknown }).items
        : null
    const items = parseTestItems(itemsSource)
    const merged = mergeBuiltinTestItems(items)
    if (merged.added > 0 || merged.patched > 0) {
      await writeTestItemFile(merged.items)
    }
    return merged.items
  } catch (error) {
    const backupPath = join(app.getPath('userData'), `test-items.bak-${Date.now()}.json`)
    try {
      await rename(filePath, backupPath)
    } catch {
      // ignore
    }

    console.error('测试项目文件读取失败，已恢复内置项目', error)
    await writeTestItemFile(BUILTIN_TEST_ITEMS)
    return BUILTIN_TEST_ITEMS
  }
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

  await writeTestItemFile(items)
  return items
}
