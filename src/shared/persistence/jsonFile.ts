import { AsyncLocalStorage } from 'node:async_hooks'
import { readFile, access } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { replaceFileAtomic } from './atomicFile'
import { assertDataAccess, withWrite } from './writeGate'
import { assertNoPendingTransactions } from './diskTransaction'
import { dirname } from 'node:path'
import { assertCollectionUnchanged } from './collectionConflict'

const corruptFiles = new Set<string>()
const validators = new Map<string, (parsed: unknown) => unknown>()
export const stagedJsonWrites = new AsyncLocalStorage<Map<string, string>>()

export class UserDataCorruptError extends Error {
  readonly filePath: string
  constructor(filePath: string, cause?: unknown) {
    super(`无法读取或保存 ${basename(filePath)}：文件已损坏或格式不正确。原文件已保留，禁止普通保存覆盖。请到设置中从备份恢复。`, { cause })
    this.name = 'UserDataCorruptError'
    this.filePath = filePath
    corruptFiles.add(resolve(filePath))
  }
}

export interface JsonEnvelope<T> { version: 1; updatedAt: string; items: T[] }
export interface JsonDocumentEnvelope<T> { version: 1; updatedAt: string; data: T }

export async function pathExists(filePath: string): Promise<boolean> {
  try { await access(filePath); return true }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false
    throw error
  }
}

function itemsFromParsed(parsed: unknown): unknown {
  if (Array.isArray(parsed)) return parsed
  if (parsed !== null && typeof parsed === 'object' && 'items' in parsed) return (parsed as { items: unknown }).items
  return null
}
function documentFromParsed(parsed: unknown): unknown {
  return parsed !== null && typeof parsed === 'object' && 'data' in parsed
    ? (parsed as { data: unknown }).data : parsed
}

export function clearCorruptProtection(filePath: string): void { corruptFiles.delete(resolve(filePath)) }

export function validateJsonText(filePath: string, text: string, document = false): void {
  const parsed: unknown = JSON.parse(text)
  const validator = validators.get(resolve(filePath))
  if (validator) { validator(parsed); return }
  if (document) {
    const data = documentFromParsed(parsed)
    if (data === null || typeof data !== 'object' || Array.isArray(data)) throw new Error('文档结构无效')
  } else if (!Array.isArray(itemsFromParsed(parsed))) throw new Error('items 必须是数组')
}

async function saveJsonText(
  filePath: string,
  text: string,
  document = false,
  options: { onlyIfMissing?: boolean; expectedItems?: unknown[] } = {}
): Promise<void> {
  await withWrite(filePath, async () => {
    await assertNoPendingTransactions(dirname(filePath))
    if (corruptFiles.has(resolve(filePath))) throw new UserDataCorruptError(filePath)
    const staging = stagedJsonWrites.getStore()
    if (options.onlyIfMissing && staging?.has(resolve(filePath))) return
    const exists = await pathExists(filePath)
    // A concurrent first read may already have initialized (or edited) the file.
    if (options.onlyIfMissing && exists) return
    if (exists) {
      const currentText = await readFile(filePath, 'utf8')
      try { validateJsonText(filePath, currentText, document) }
      catch (cause) { throw new UserDataCorruptError(filePath, cause) }
      if (options.expectedItems) {
        const parsed: unknown = JSON.parse(currentText)
        const validator = validators.get(resolve(filePath))
        assertCollectionUnchanged(validator ? validator(parsed) : itemsFromParsed(parsed), options.expectedItems)
      }
    } else if (options.expectedItems) {
      assertCollectionUnchanged([], options.expectedItems)
    }
    if (staging) { staging.set(resolve(filePath), text); return }
    await replaceFileAtomic(filePath, text)
  })
}

/** Only explicit recovery may bypass the corruption lock. */
export async function recoverJsonTextAtomic(filePath: string, text: string): Promise<void> {
  await withWrite(filePath, async () => {
    await assertNoPendingTransactions(dirname(filePath))
    validateJsonText(filePath, text, basename(filePath) === 'settings.json')
    await replaceFileAtomic(filePath, text)
    clearCorruptProtection(filePath)
  })
}

export async function writeJsonItemsAtomic<T>(filePath: string, items: T[], expectedItems?: T[]): Promise<void> {
  const payload: JsonEnvelope<T> = { version: 1, updatedAt: new Date().toISOString(), items }
  await saveJsonText(filePath, `${JSON.stringify(payload, null, 2)}\n`, false, { expectedItems })
}
export async function writeJsonDocumentAtomic<T>(filePath: string, data: T): Promise<void> {
  const payload: JsonDocumentEnvelope<T> = { version: 1, updatedAt: new Date().toISOString(), data }
  await saveJsonText(filePath, `${JSON.stringify(payload, null, 2)}\n`, true)
}

export async function readJsonItemsFile<T>(filePath: string, parse: (input: unknown) => T[]): Promise<T[]> {
  assertDataAccess(filePath)
  validators.set(resolve(filePath), (parsed) => parse(itemsFromParsed(parsed)))
  try { return parse(itemsFromParsed(JSON.parse(stagedJsonWrites.getStore()?.get(resolve(filePath)) ?? await readFile(filePath, 'utf8')))) }
  catch (cause) { throw new UserDataCorruptError(filePath, cause) }
}
export async function readJsonDocumentFile<T>(filePath: string, parse: (input: unknown) => T): Promise<T> {
  assertDataAccess(filePath)
  validators.set(resolve(filePath), (parsed) => parse(documentFromParsed(parsed)))
  try { return parse(documentFromParsed(JSON.parse(stagedJsonWrites.getStore()?.get(resolve(filePath)) ?? await readFile(filePath, 'utf8')))) }
  catch (cause) { throw new UserDataCorruptError(filePath, cause) }
}
export async function loadJsonItemsFile<T>(filePath: string, parse: (input: unknown) => T[], ifMissing: T[]): Promise<T[]> {
  assertDataAccess(filePath)
  validators.set(resolve(filePath), (parsed) => parse(itemsFromParsed(parsed)))
  if (!(await pathExists(filePath))) {
    const payload: JsonEnvelope<T> = { version: 1, updatedAt: new Date().toISOString(), items: ifMissing }
    await saveJsonText(filePath, `${JSON.stringify(payload, null, 2)}\n`, false, { onlyIfMissing: true })
  }
  return readJsonItemsFile(filePath, parse)
}
export async function loadJsonDocumentFile<T>(filePath: string, parse: (input: unknown) => T, ifMissing: T): Promise<T> {
  assertDataAccess(filePath)
  validators.set(resolve(filePath), (parsed) => parse(documentFromParsed(parsed)))
  if (!(await pathExists(filePath))) {
    const payload: JsonDocumentEnvelope<T> = { version: 1, updatedAt: new Date().toISOString(), data: ifMissing }
    await saveJsonText(filePath, `${JSON.stringify(payload, null, 2)}\n`, true, { onlyIfMissing: true })
  }
  return readJsonDocumentFile(filePath, parse)
}
