import { app } from 'electron'
import { access, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { parseClassRecords } from '../shared/class/validate'
import type { ClassRecord } from '../shared/class/types'

interface ClassFile {
  version: 1
  updatedAt: string
  items: ClassRecord[]
}

export function getClassFilePath(): string {
  return join(app.getPath('userData'), 'classes.json')
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function writeClassFile(items: ClassRecord[]): Promise<void> {
  const filePath = getClassFilePath()
  await mkdir(dirname(filePath), { recursive: true })

  const payload: ClassFile = {
    version: 1,
    updatedAt: new Date().toISOString(),
    items
  }

  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
}

export async function loadClasses(): Promise<ClassRecord[]> {
  const filePath = getClassFilePath()

  if (!(await fileExists(filePath))) {
    await writeClassFile([])
    return []
  }

  try {
    const raw = await readFile(filePath, 'utf8')
    const parsed: unknown = JSON.parse(raw)
    const itemsSource = Array.isArray(parsed)
      ? parsed
      : parsed !== null && typeof parsed === 'object' && 'items' in parsed
        ? (parsed as { items: unknown }).items
        : null

    return parseClassRecords(itemsSource)
  } catch (error) {
    const backupPath = join(app.getPath('userData'), `classes.bak-${Date.now()}.json`)
    try {
      await rename(filePath, backupPath)
    } catch {
      // Ignore backup failures and continue with an empty list.
    }

    console.error('班级文件读取失败，已重置为空列表', error)
    await writeClassFile([])
    return []
  }
}

export async function saveClasses(input: unknown): Promise<ClassRecord[]> {
  const items = parseClassRecords(input)
  await writeClassFile(items)
  return items
}
