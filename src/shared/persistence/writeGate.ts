import { AsyncLocalStorage } from 'node:async_hooks'
import { resolve, sep } from 'node:path'

const owner = new AsyncLocalStorage<symbol>()
let exclusive: symbol | undefined
let writers = 0
let snapshotOnly = false
const blockedRoots = new Set<string>()
const fileWrites = new Map<string, Promise<void>>()

export function blockDataRoot(root: string): void { blockedRoots.add(resolve(root)) }
export function assertDataAccess(path: string): void {
  const target = resolve(path)
  for (const root of blockedRoots) {
    if (target === root || target.startsWith(`${root}${sep}`)) {
      throw new Error(`存在无法自动恢复的磁盘事务，已禁止读写：${root}。请保留事务目录并人工恢复。`)
    }
  }
  if (exclusive && !snapshotOnly && owner.getStore() !== exclusive) {
    throw new Error('数据事务正在执行，请稍后重试。')
  }
}

export async function withWrite<T>(path: string, action: () => Promise<T>): Promise<T> {
  assertDataAccess(path)
  if (snapshotOnly || (exclusive && owner.getStore() !== exclusive)) throw new Error('数据正在备份或恢复，请稍后重试保存。')
  const key = resolve(path).toLowerCase()
  const previous = fileWrites.get(key) ?? Promise.resolve()
  let release!: () => void
  const pending = new Promise<void>(done => { release = done })
  fileWrites.set(key, pending)
  writers++
  try {
    await previous
    assertDataAccess(path)
    return await action()
  } finally {
    writers--
    release()
    if (fileWrites.get(key) === pending) fileWrites.delete(key)
  }
}

export async function withExclusiveDataAccess<T>(action: () => Promise<T>): Promise<T> {
  if (exclusive || writers) throw new Error('数据正在保存或恢复，请稍后重试。')
  const token = Symbol('data transaction')
  exclusive = token
  try { return await owner.run(token, action) } finally { exclusive = undefined }
}

/** A restore/repair owner can take its safety snapshot without reacquiring its lock.
 * Ordinary reads remain available during standalone backup; every writer fails closed.
 * Process-local ownership disappears on exit; finally releases on every failure. */
export async function withDataSnapshot<T>(root: string, action: () => Promise<T>): Promise<T> {
  assertDataAccess(root)
  if (exclusive && owner.getStore() === exclusive) return action()
  return withExclusiveDataAccess(async () => {
    snapshotOnly = true
    try { return await action() } finally { snapshotOnly = false }
  })
}
