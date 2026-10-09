import assert from 'node:assert/strict'
import fs, { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { syncBuiltinESMExports } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { replaceFileAtomic } from './atomicFile'
import { commitFileTransaction, recoverPendingTransactions } from './diskTransaction'
import { loadJsonItemsFile, readJsonItemsFile, recoverJsonTextAtomic, writeJsonDocumentAtomic, writeJsonItemsAtomic } from './jsonFile'
import { withExclusiveDataAccess, withWrite } from './writeGate'
import { runStagedJsonWrites } from '../importTransaction/stagedWrite'
import { runBackupRestoreSelfCheckOrThrow } from '../backup/selfcheck'
import { runV0290P02ImportTransactionSelfCheckOrThrow } from '../importTransaction/v0290P02Selfcheck'

const parse = (value: unknown): unknown[] => { assert(Array.isArray(value)); return value }
const json = (n: number): string => JSON.stringify({ version: 1, items: [{ n }] })
const failure = (): NodeJS.ErrnoException => Object.assign(new Error('injected I/O failure'), { code: 'EACCES' })
async function child(mode: string, root: string): Promise<never> {
  if (mode === '--recover') {
    await recoverPendingTransactions(root)
    process.exit(0)
  }
  const rename = fs.rename
  let rollbackStarted = false
  fs.rename = async (from, to) => {
    if (mode === '--crash-committed' && String(to).includes('gc-tx-')) process.exit(73)
    if (mode === '--crash-rollback' && String(to) === join(root, 'b.json') && !rollbackStarted) {
      rollbackStarted = true
      throw failure()
    }
    await rename(from, to)
    if (mode === '--crash-rollback' && rollbackStarted && String(to) === join(root, 'a.json')) process.exit(73)
    if (mode === '--crash-cleanup' && String(to).includes('gc-tx-')) process.exit(73)
    if (mode === '--crash-commit' && String(to) === join(root, 'a.json')) process.exit(73)
    if (mode === '--crash-prepare' && String(to).endsWith('0.new')) process.exit(73)
  }
  syncBuiltinESMExports()
  await withExclusiveDataAccess(() => commitFileTransaction(root, [
    { path: 'a.json', data: json(2) }, { path: 'b.json', data: json(2) }
  ]))
  throw new Error('crash injection was not reached')
}

async function main(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'gdpe-data-safety-'))
  let count = 0
  const passed = (name: string): void => { count++; console.log(`PASS ${name}`) }
  const a = join(root, 'a.json'), b = join(root, 'b.json')
  try {
    await writeJsonItemsAtomic(a, [{ n: 1 }])
    assert.deepEqual(await readJsonItemsFile(a, parse), [{ n: 1 }]); passed('B 首次创建')
    await writeJsonItemsAtomic(a, [{ n: 2 }])
    assert.deepEqual(await readJsonItemsFile(a, parse), [{ n: 2 }])
    const settings = join(root, 'settings.json')
    await writeJsonDocumentAtomic(settings, { teacher: 'A' })
    await writeJsonDocumentAtomic(settings, { teacher: 'B' }); passed('A 集合及文档正常保存')
    const before = await readFile(a, 'utf8')
    const open = fs.open
    fs.open = (async (...args: Parameters<typeof fs.open>) => {
      const handle = await open(...args)
      if (String(args[0]).endsWith('.tmp')) handle.writeFile = async () => { throw failure() }
      return handle
    }) as typeof fs.open
    syncBuiltinESMExports()
    try { await assert.rejects(writeJsonItemsAtomic(a, []), /安全替换失败/) }
    finally { fs.open = open; syncBuiltinESMExports() }
    assert.equal(await readFile(a, 'utf8'), before)
    assert(!(await readdir(root)).some(name => name.endsWith('.tmp'))); passed('C/E 临时文件写入失败，原文件完整且无临时残留')
    fs.open = (async (...args: Parameters<typeof fs.open>) => {
      const handle = await open(...args)
      if (String(args[0]).endsWith('.tmp')) handle.sync = async () => { throw failure() }
      return handle
    }) as typeof fs.open
    syncBuiltinESMExports()
    try { await assert.rejects(writeJsonItemsAtomic(a, []), /安全替换失败/) }
    finally { fs.open = open; syncBuiltinESMExports() }
    assert.equal(await readFile(a, 'utf8'), before); passed('C2 fsync 失败仍保留原文件')
    const rename = fs.rename
    fs.rename = async (from, to) => { if (String(to) === a || String(to) === settings) throw failure(); await rename(from, to) }
    syncBuiltinESMExports()
    const oldSettings = await readFile(settings, 'utf8')
    try {
      await assert.rejects(writeJsonItemsAtomic(a, []), /安全替换失败/)
      await assert.rejects(writeJsonDocumentAtomic(settings, {}), /安全替换失败/)
      await assert.rejects(recoverJsonTextAtomic(a, json(3)), /安全替换失败/)
    } finally { fs.rename = rename; syncBuiltinESMExports() }
    assert.equal(await readFile(a, 'utf8'), before)
    assert.equal(await readFile(settings, 'utf8'), oldSettings); passed('D/E 集合、文档、恢复最终替换失败均保留原文件')
    await writeFile(a, '{broken')
    await assert.rejects(readJsonItemsFile(a, parse))
    await assert.rejects(writeJsonItemsAtomic(a, []), /禁止普通保存/)
    assert.equal(await readFile(a, 'utf8'), '{broken'); passed('F 解析损坏后禁止覆盖')
    await recoverJsonTextAtomic(a, json(1))
    await writeJsonItemsAtomic(a, [{ n: 3 }]); passed('G 显式恢复成功后允许保存')
    await writeFile(b, '{"items":{}}')
    await assert.rejects(writeJsonItemsAtomic(b, []))
    assert.equal(await readFile(b, 'utf8'), '{"items":{}}')
    await recoverJsonTextAtomic(b, json(1)); passed('F2 未加载的结构损坏文件同样禁止覆盖')
    const strictPath = join(root, 'strict.json')
    const strictParse = (value: unknown): unknown[] => {
      const items = parse(value)
      for (const item of items) assert.equal(typeof (item as { n: unknown }).n, 'number')
      return items
    }
    await writeFile(strictPath, JSON.stringify({ items: [{ n: 'invalid' }] }))
    await assert.rejects(readJsonItemsFile(strictPath, strictParse))
    await assert.rejects(writeJsonItemsAtomic(strictPath, []))
    await assert.rejects(recoverJsonTextAtomic(strictPath, JSON.stringify({ items: [{}] })))
    await recoverJsonTextAtomic(strictPath, json(1))
    await writeJsonItemsAtomic(strictPath, [{ n: 2 }]); passed('F3/G 业务结构校验失败锁定，恢复也必须通过原校验器')
    const missing = join(root, 'new.json')
    assert.deepEqual(await loadJsonItemsFile(missing, parse, []), []); passed('B2 合法缺失文件不被误锁')
    const stages = () => [a, b].map(path => ({ name: path, write: () => writeJsonItemsAtomic(path, [{ n: 9 }]), restore: async () => { throw new Error('disk rollback must not use memory callbacks') } }))
    assert((await runStagedJsonWrites(stages())).ok)
    for (const path of [a, b]) assert.deepEqual(await readJsonItemsFile(path, parse), [{ n: 9 }])
    assert.deepEqual(await readdir(join(root, '.data-transactions')), []); passed('H 多文件事务成功并清理')
    const oldA = await readFile(a, 'utf8'), oldB = await readFile(b, 'utf8')
    let failed = false
    fs.rename = async (from, to) => {
      if (!failed && String(to) === b) { failed = true; throw failure() }
      await rename(from, to)
    }
    syncBuiltinESMExports()
    try {
      const result = await runStagedJsonWrites(stages())
      assert(!result.ok && result.rolledBack)
    } finally { fs.rename = rename; syncBuiltinESMExports() }
    assert.equal(await readFile(a, 'utf8'), oldA); assert.equal(await readFile(b, 'utf8'), oldB); passed('I 第二个目标替换失败，按磁盘快照逐字节回滚')
    for (let i = 0; i < 3; i++) assert((await runStagedJsonWrites(stages())).ok)
    assert.deepEqual(await readdir(join(root, '.data-transactions')), [])
    assert.equal((await readJsonItemsFile(a, parse)).length, 1); passed('K 重复提交不积累事务副本或重复条目')
    const firstCreate = join(root, 'created-in-transaction.json')
    const beforeCreate = await readFile(a, 'utf8')
    await assert.rejects(withExclusiveDataAccess(() => commitFileTransaction(root, [
      { path: 'a.json', data: json(111) }, { path: 'created-in-transaction.json', data: json(111) }
    ], async () => { throw failure() })))
    assert.equal(await readFile(a, 'utf8'), beforeCreate)
    await assert.rejects(readFile(firstCreate), { code: 'ENOENT' }); passed('I2 回滚恢复原文件并撤回事务首次创建的文件')
    let release!: () => void
    const paused = withExclusiveDataAccess(() => new Promise<void>(done => { release = done }))
    await assert.rejects(writeJsonItemsAtomic(a, []), /事务正在执行/)
    await assert.rejects(readJsonItemsFile(a, parse), /事务正在执行/)
    release(); await paused; passed('L 提交/恢复期间阻止并发业务读写')
    await writeJsonItemsAtomic(a, [{ n: 1 }])
    let releaseWriter!: () => void
    const writing = withWrite(a, () => new Promise<void>((done) => { releaseWriter = done }))
    await new Promise<void>((done) => setTimeout(done, 0))
    let exclusiveDone = false
    const queued = withExclusiveDataAccess(async () => {
      await writeJsonItemsAtomic(b, [{ n: 2 }])
      exclusiveDone = true
    })
    assert(!exclusiveDone)
    releaseWriter()
    await writing
    await queued
    assert(exclusiveDone)
    assert.deepEqual(await readJsonItemsFile(b, parse), [{ n: 2 }])
    passed('M 同文件写入忙碌时独占事务排队等待而非立即失败')
    for (const mode of ['--crash-prepare', '--crash-commit', '--crash-rollback', '--crash-committed', '--crash-cleanup']) {
      await replaceFileAtomic(a, json(1)); await replaceFileAtomic(b, json(1))
      const crash = spawnSync(process.execPath, [process.argv[1], mode, root], { encoding: 'utf8' })
      assert.equal(crash.status, 73, crash.stderr)
      const recovery = spawnSync(process.execPath, [process.argv[1], '--recover', root], { encoding: 'utf8' })
      assert.equal(recovery.status, 0, recovery.stderr)
      const expected = json(mode === '--crash-committed' || mode === '--crash-cleanup' ? 2 : 1)
      assert.equal(await readFile(a, 'utf8'), expected); assert.equal(await readFile(b, 'utf8'), expected)
      assert.deepEqual(await readdir(join(root, '.data-transactions')), [])
      passed(`J 独立进程退出及新进程启动恢复 ${mode}`)
    }
    // Unknown external bytes: recovery must preserve all evidence and refuse writes.
    const crash = spawnSync(process.execPath, [process.argv[1], '--crash-commit', root])
    assert.equal(crash.status, 73)
    await writeFile(b, json(777))
    await assert.rejects(recoverPendingTransactions(root), /启动事务恢复失败/)
    assert.equal(await readFile(b, 'utf8'), json(777))
    await assert.rejects(writeJsonItemsAtomic(a, []), /禁止读写/)
    assert((await readdir(join(root, '.data-transactions'))).length > 0); passed('J2 无法判断的目标变化保留证据并阻止读写')
    console.log(await runV0290P02ImportTransactionSelfCheckOrThrow())
    console.log(await runBackupRestoreSelfCheckOrThrow())
    console.log(`Data safety self-check passed: ${count} groups + existing integrity/import/backup suites`)
  } finally { await rm(root, { recursive: true, force: true }) }
}
if (process.argv[2]?.startsWith('--')) {
  await child(process.argv[2], process.argv[3])
} else { await main() }
