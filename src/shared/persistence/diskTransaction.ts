import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readFile, readdir, rename, rm, unlink } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { replaceFileAtomic, syncDirectory } from './atomicFile'
import { assertDataAccess, blockDataRoot } from './writeGate'

const JOURNALS = '.data-transactions'
type Entry = { path: string; oldHash: string | null; newHash: string | null }
type Journal = { version: 1; phase: 'preparing' | 'committing' | 'committed' | 'rolled-back'; entries: Entry[] }
export type FileChange = { path: string; data: Uint8Array | string | null }
export class DiskTransactionError extends Error {
  constructor(message: string, readonly rolledBack: boolean, options?: ErrorOptions) { super(message, options) }
}
const hash = (data: Uint8Array): string => createHash('sha256').update(data).digest('hex')
async function readOptional(path: string): Promise<Buffer | null> {
  try { return await readFile(path) }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null; throw error }
}
function targetPath(root: string, path: string): string {
  const target = resolve(root, path)
  const rel = relative(resolve(root), target)
  if (!rel || isAbsolute(path) || rel.startsWith(`..${sep}`) || rel === '..' || rel.split(sep).some(p => p.startsWith('.'))) {
    throw new Error(`事务路径无效：${path}`)
  }
  return target
}
async function saveJournal(dir: string, journal: Journal): Promise<void> {
  await replaceFileAtomic(join(dir, 'manifest.json'), JSON.stringify(journal))
}
async function cleanup(dir: string): Promise<void> {
  // Rename first: interrupted deletion is never mistaken for a damaged live journal.
  const garbage = join(dirname(dir), `gc-${basename(dir)}`)
  await rename(dir, garbage)
  await syncDirectory(dirname(dir))
  await rm(garbage, { recursive: true, force: true })
}
function parseJournal(text: string, root: string): Journal {
  const value = JSON.parse(text) as Journal
  if (value?.version !== 1 || !['preparing', 'committing', 'committed', 'rolled-back'].includes(value.phase) || !Array.isArray(value.entries)) throw new Error('事务日志结构无效')
  const paths = new Set<string>()
  for (const entry of value.entries) {
    if (!entry || typeof entry.path !== 'string') throw new Error('事务条目无效')
    const path = targetPath(root, entry.path).toLowerCase()
    if (paths.has(path)) throw new Error('事务路径重复')
    paths.add(path)
    for (const digest of [entry.oldHash, entry.newHash]) {
      if (digest !== null && (typeof digest !== 'string' || !/^[a-f0-9]{64}$/.test(digest))) throw new Error('事务哈希无效')
    }
  }
  return value
}
async function rollback(root: string, dir: string, journal: Journal): Promise<void> {
  // Preflight every entry before changing anything. Never guess over unrelated bytes.
  const originals: Array<Buffer | null> = []
  for (let i = 0; i < journal.entries.length; i++) {
    const entry = journal.entries[i]
    const old = entry.oldHash === null ? null : await readFile(join(dir, `${i}.old`))
    if (old !== null && hash(old) !== entry.oldHash) throw new Error(`原始快照损坏：${entry.path}`)
    if (entry.newHash !== null) {
      const next = await readFile(join(dir, `${i}.new`))
      if (hash(next) !== entry.newHash) throw new Error(`暂存数据损坏：${entry.path}`)
    }
    const current = await readOptional(targetPath(root, entry.path))
    const digest = current === null ? null : hash(current)
    if (digest !== entry.oldHash && digest !== entry.newHash) throw new Error(`目标文件与事务记录不符：${entry.path}`)
    originals.push(old)
  }
  for (let i = 0; i < journal.entries.length; i++) {
    const target = targetPath(root, journal.entries[i].path)
    if (originals[i] === null) {
      if (await readOptional(target) !== null) { await unlink(target); await syncDirectory(dirname(target)) }
    } else await replaceFileAtomic(target, originals[i]!)
  }
  journal.phase = 'rolled-back'
  await saveJournal(dir, journal)
  await cleanup(dir)
}

/** Caller holds exclusive data access throughout preparation, commit and recovery. */
export async function commitFileTransaction(root: string, changes: readonly FileChange[], afterPlace?: () => Promise<void>): Promise<void> {
  assertDataAccess(root)
  await assertNoPendingTransactions(root)
  if (changes.length === 0) return
  const dir = join(root, JOURNALS, `tx-${randomUUID()}`)
  await mkdir(dir, { recursive: true })
  const journal: Journal = { version: 1, phase: 'preparing', entries: [] }
  let committing = false
  let committed = false
  try {
    await saveJournal(dir, journal)
    const paths = new Set<string>()
    for (let i = 0; i < changes.length; i++) {
      const change = changes[i]
      const target = targetPath(root, change.path)
      if (paths.has(target.toLowerCase())) throw new Error('事务目标重复')
      paths.add(target.toLowerCase())
      const old = await readOptional(target)
      const next = change.data === null ? null : Buffer.from(change.data)
      if (old !== null) await replaceFileAtomic(join(dir, `${i}.old`), old)
      if (next !== null) await replaceFileAtomic(join(dir, `${i}.new`), next)
      journal.entries.push({ path: change.path, oldHash: old === null ? null : hash(old), newHash: next === null ? null : hash(next) })
    }
    journal.phase = 'committing'
    await saveJournal(dir, journal)
    await syncDirectory(dirname(dir))
    await syncDirectory(root)
    committing = true
    for (let i = 0; i < journal.entries.length; i++) {
      const entry = journal.entries[i]
      const target = targetPath(root, entry.path)
      const current = await readOptional(target)
      if ((current === null ? null : hash(current)) !== entry.oldHash) throw new Error(`提交前目标发生变化：${entry.path}`)
      if (entry.newHash === null) {
        if (current !== null) { await unlink(target); await syncDirectory(dirname(target)) }
      } else {
        const next = await readFile(join(dir, `${i}.new`))
        if (hash(next) !== entry.newHash) throw new Error(`暂存校验失败：${entry.path}`)
        await replaceFileAtomic(target, next)
      }
    }
    if (afterPlace) await afterPlace()
    journal.phase = 'committed'
    await saveJournal(dir, journal)
    committed = true
    await cleanup(dir)
  } catch (cause) {
    if (committed) {
      blockDataRoot(root)
      throw new DiskTransactionError(`数据已提交，但事务清理失败：${dir}。请重启完成清理。`, false, { cause })
    }
    try {
      if (committing) await rollback(root, dir, journal)
      else await cleanup(dir)
    } catch (recoveryError) {
      blockDataRoot(root)
      throw new DiskTransactionError(`事务恢复失败，已禁止读写并保留证据：${dir}`, false, { cause: new AggregateError([cause, recoveryError]) })
    }
    throw new DiskTransactionError(`事务失败，原数据已保留或恢复：${cause instanceof Error ? cause.message : String(cause)}`, true, { cause })
  }
}
async function journalDirectories(root: string): Promise<string[]> {
  try { return await readdir(join(root, JOURNALS)) }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []; throw error }
}
export async function assertNoPendingTransactions(root: string): Promise<void> {
  const entries = await journalDirectories(root)
  if (entries.some(name => !name.startsWith('gc-tx-'))) throw new Error(`存在未完成事务，需先重启恢复：${join(root, JOURNALS)}`)
}

/** Must finish before loaders, IPC registration, or windows are started. */
export async function recoverPendingTransactions(root: string): Promise<string[]> {
  const recovered: string[] = []
  try {
    await mkdir(root, { recursive: true })
    for (const name of await readdir(root)) {
      if (name.startsWith('.restore-outgoing-') || name.startsWith('.restore-staging-')) throw new Error(`发现旧版未完成恢复，需人工检查：${name}`)
    }
    for (const name of await journalDirectories(root)) {
      if (!/^(gc-)?tx-[a-f0-9-]{36}$/.test(name)) throw new Error(`无法识别的事务目录：${name}`)
      const dir = join(root, JOURNALS, name)
      if (name.startsWith('gc-')) { await rm(dir, { recursive: true, force: true }); continue }
      const journal = parseJournal(await readFile(join(dir, 'manifest.json'), 'utf8'), root)
      if (journal.phase === 'committing') await rollback(root, dir, journal)
      else if (journal.phase === 'committed') {
        for (const entry of journal.entries) {
          const current = await readOptional(targetPath(root, entry.path))
          if ((current === null ? null : hash(current)) !== entry.newHash) throw new Error(`已提交事务目标校验失败：${entry.path}`)
        }
        await cleanup(dir)
      } else await cleanup(dir)
      recovered.push(name)
    }
    return recovered
  } catch (cause) {
    blockDataRoot(root)
    throw new Error(`启动事务恢复失败，未启动业务读写。请保留 ${join(root, JOURNALS)} 并检查日志。`, { cause })
  }
}
