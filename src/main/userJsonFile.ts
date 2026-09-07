import { app } from 'electron'
import { access, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

interface JsonFile<T> {
  version: 1
  updatedAt: string
  items: T[]
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function writeItems<T>(filePath: string, items: T[]): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true })
  const payload: JsonFile<T> = {
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
      // Ignore leftover temp file.
    }
  }
}

function itemsFromParsed(parsed: unknown): unknown {
  if (Array.isArray(parsed)) {
    return parsed
  }
  if (parsed !== null && typeof parsed === 'object' && 'items' in parsed) {
    return (parsed as { items: unknown }).items
  }
  return null
}

export async function loadUserJsonItems<T>(fileName: string, parse: (input: unknown) => T[], label: string): Promise<T[]> {
  const filePath = join(app.getPath('userData'), fileName)
  if (!(await fileExists(filePath))) {
    await writeItems(filePath, [])
    return []
  }

  try {
    const raw = await readFile(filePath, 'utf8')
    return parse(itemsFromParsed(JSON.parse(raw)))
  } catch (error) {
    console.error(`${label}文件读取失败，保留原文件并返回空列表`, error)
    return []
  }
}

export async function saveUserJsonItems<T>(fileName: string, items: T[]): Promise<T[]> {
  await writeItems(join(app.getPath('userData'), fileName), items)
  return items
}

export function userJsonPath(fileName: string): string {
  return join(app.getPath('userData'), fileName)
}
