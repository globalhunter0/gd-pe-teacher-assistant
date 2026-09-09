import { randomUUID } from 'node:crypto'
import { open, mkdir, readFile, rename, unlink, access } from 'node:fs/promises'
import { dirname, basename } from 'node:path'

export class UserDataCorruptError extends Error {
  readonly filePath: string

  constructor(filePath: string, cause?: unknown) {
    const name = basename(filePath)
    super(
      `无法读取 ${name}：文件已损坏或格式不正确。原文件已保留，没有被覆盖为空数据。请到设置中从备份恢复。`
    )
    this.name = 'UserDataCorruptError'
    this.filePath = filePath
    if (cause instanceof Error) {
      this.cause = cause
    }
  }
}

export interface JsonEnvelope<T> {
  version: 1
  updatedAt: string
  items: T[]
}

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
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

export async function writeJsonItemsAtomic<T>(filePath: string, items: T[]): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true })
  const payload: JsonEnvelope<T> = {
    version: 1,
    updatedAt: new Date().toISOString(),
    items
  }
  const text = `${JSON.stringify(payload, null, 2)}\n`
  const tmpPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`
  const handle = await open(tmpPath, 'w')
  try {
    await handle.writeFile(text, 'utf8')
    await handle.sync()
  } finally {
    await handle.close()
  }

  try {
    await rename(tmpPath, filePath)
  } catch {
    const dest = await open(filePath, 'w')
    try {
      await dest.writeFile(text, 'utf8')
      await dest.sync()
    } finally {
      await dest.close()
    }
    try {
      await unlink(tmpPath)
    } catch {
      // leftover temp
    }
  }
}

export async function readJsonItemsFile<T>(
  filePath: string,
  parse: (input: unknown) => T[]
): Promise<T[]> {
  let raw: string
  try {
    raw = await readFile(filePath, 'utf8')
  } catch (error) {
    throw new UserDataCorruptError(filePath, error)
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    return parse(itemsFromParsed(parsed))
  } catch (error) {
    throw new UserDataCorruptError(filePath, error)
  }
}

export async function loadJsonItemsFile<T>(
  filePath: string,
  parse: (input: unknown) => T[],
  ifMissing: T[]
): Promise<T[]> {
  if (!(await pathExists(filePath))) {
    await writeJsonItemsAtomic(filePath, ifMissing)
    return ifMissing
  }

  return readJsonItemsFile(filePath, parse)
}

export interface JsonDocumentEnvelope<T> {
  version: 1
  updatedAt: string
  data: T
}

export async function writeJsonDocumentAtomic<T>(filePath: string, data: T): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true })
  const payload: JsonDocumentEnvelope<T> = {
    version: 1,
    updatedAt: new Date().toISOString(),
    data
  }
  const text = `${JSON.stringify(payload, null, 2)}\n`
  const tmpPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`
  const handle = await open(tmpPath, 'w')
  try {
    await handle.writeFile(text, 'utf8')
    await handle.sync()
  } finally {
    await handle.close()
  }

  try {
    await rename(tmpPath, filePath)
  } catch {
    const dest = await open(filePath, 'w')
    try {
      await dest.writeFile(text, 'utf8')
      await dest.sync()
    } finally {
      await dest.close()
    }
    try {
      await unlink(tmpPath)
    } catch {
      // leftover temp
    }
  }
}

export async function readJsonDocumentFile<T>(filePath: string, parse: (input: unknown) => T): Promise<T> {
  let raw: string
  try {
    raw = await readFile(filePath, 'utf8')
  } catch (error) {
    throw new UserDataCorruptError(filePath, error)
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (parsed !== null && typeof parsed === 'object' && 'data' in parsed) {
      return parse((parsed as { data: unknown }).data)
    }
    return parse(parsed)
  } catch (error) {
    if (error instanceof UserDataCorruptError) {
      throw error
    }
    throw new UserDataCorruptError(filePath, error)
  }
}

export async function loadJsonDocumentFile<T>(
  filePath: string,
  parse: (input: unknown) => T,
  ifMissing: T
): Promise<T> {
  if (!(await pathExists(filePath))) {
    await writeJsonDocumentAtomic(filePath, ifMissing)
    return ifMissing
  }

  return readJsonDocumentFile(filePath, parse)
}
