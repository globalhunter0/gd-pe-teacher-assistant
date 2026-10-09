import { AsyncLocalStorage } from 'node:async_hooks'
import { resolve, sep } from 'node:path'

const owner = new AsyncLocalStorage<symbol>()
let exclusive: symbol | undefined
let writers = 0
let snapshotOnly = false
const blockedRoots = new Set<string>()
const fileWrites = new Map<string, Promise<void>>()
let idleWriterWaiters: Array<() => void> = []
let exclusiveQueue: Promise<void> = Promise.resolve()
let pendingExclusive = 0

function notifyIdleWriters(): void {
  if (writers !== 0) return
  const waiters = idleWriterWaiters
  idleWriterWaiters = []
  for (const wake of waiters) wake()
}

async function waitForIdleWriters(): Promise<void> {
  while (writers > 0) {
    await new Promise<void>((resolve) => {
      idleWriterWaiters.push(resolve)
    })
  }
}

export function blockDataRoot(root: string): void { blockedRoots.add(resolve(root)) }
export function assertDataAccess(path: string): void {
  const target = resolve(path)
  for (const root of blockedRoots) {
    if (target === root || target.startsWith(`${root}${sep}`)) {
      throw new Error(`存在无法自动恢复的磁盘事务，已禁止读写：${root}。请保留事务目录并人工恢复。`)
    }
  }
  if (snapshotOnly) return
  const currentOwner = owner.getStore()
  if (pendingExclusive > 0 && currentOwner === undefined) {
    throw new Error('数据事务正在执行，请稍后重试。')
  }
  if (exclusive !== undefined && currentOwner !== exclusive) {
    throw new Error('数据事务正在执行，请稍后重试。')
  }
}

export async function withWrite<T>(path: string, action: () => Promise<T>): Promise<T> {
  assertDataAccess(path)
  const currentOwner = owner.getStore()
  if (snapshotOnly || (exclusive !== undefined && currentOwner !== exclusive) || (pendingExclusive > 0 && currentOwner === undefined)) {
    throw new Error('数据正在备份或恢复，请稍后重试保存。')
  }
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
    notifyIdleWriters()
    release()
    if (fileWrites.get(key) === pending) fileWrites.delete(key)
  }
}

export async function withExclusiveDataAccess<T>(action: () => Promise<T>): Promise<T> {
  if (exclusive && owner.getStore() === exclusive) return action()
  pendingExclusive++
  const run = exclusiveQueue.then(async (): Promise<T> => {
    try {
      await waitForIdleWriters()
      const token = Symbol('data transaction')
      exclusive = token
      try {
        return await owner.run(token, action)
      } finally {
        exclusive = undefined
      }
    } finally {
      pendingExclusive--
    }
  })
  exclusiveQueue = run.then(
    () => undefined,
    () => undefined
  )
  return run
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
