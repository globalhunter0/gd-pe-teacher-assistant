import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { join } from 'node:path'
import { syncBuiltinESMExports } from 'node:module'
import { createDataBackup, restoreDataBackup, verifyBackupArchive } from '../src/shared/backup/service'
import { parseZip } from '../src/shared/backup/zip'
import { withWrite, withExclusiveDataAccess } from '../src/shared/persistence/writeGate'
import { writeJsonItemsAtomic, clearCorruptProtection, readJsonItemsFile } from '../src/shared/persistence/jsonFile'
import { runStagedJsonWrites } from '../src/shared/importTransaction/stagedWrite'
import { initializeUserData } from '../src/shared/persistence/initializeUserData'
import { BUSINESS_JSON_FILES } from '../src/shared/persistence/businessFiles'
import { inspectBusinessFiles } from '../src/shared/persistence/inspectBusinessFiles'
import { buildAndRunStartupHealthCheck, buildAndRunDataIntegrityAudit } from '../src/main/dataIntegrityService'
import { loadResources, importFileResource } from '../src/main/resourceStore'
import { loadSchedule } from '../src/main/scheduleStore'
import { registerTrainingIpc } from '../src/main/trainingIpc'

const base = process.env.GDPE_TEST_ROOT!
assert(base.includes('gdpe-rc-check-'))
let count = 0
const deferred = () => { let resolve!: () => void; const promise = new Promise<void>(r => { resolve = r }); return { promise, resolve } }
async function check(name: string, action: (root: string) => Promise<void>) {
  const root = join(base, String(++count)); await fs.mkdir(root); process.env.GDPE_TEST_ROOT = root
  await action(root); console.log(`PASS RC ${count}: ${name}`)
}
async function seed(root: string, generation = 0) {
  for (const name of ['classes.json', 'students.json']) await writeJsonItemsAtomic(join(root, name), [{ generation }])
}
async function generations(archive: string) {
  const entries = parseZip(await fs.readFile(archive))
  return ['classes.json', 'students.json'].map(n => JSON.parse(entries.find(e => e.name === `files/${n}`)!.data.toString()).items[0].generation)
}
async function pauseBackup(root: string, action: (backup: Promise<unknown>) => Promise<void>) {
  const started = deferred(), resume = deferred(), original = fs.readFile
  let intercepted = false
  fs.readFile = (async (...args: Parameters<typeof original>) => {
    if (!intercepted && String(args[0]) === join(root, 'classes.json')) {
      intercepted = true; started.resolve(); await resume.promise
    }
    return original(...args)
  }) as typeof original
  syncBuiltinESMExports()
  const backup = createDataBackup(root, join(root, 'snapshot.gdpebak'))
  try { await started.promise; await action(backup) }
  finally { resume.resolve(); fs.readFile = original; syncBuiltinESMExports(); await backup }
}

async function main() {
  await check('save holder rejects backup; successful archive is entirely committed', async root => {
    await seed(root)
    await assert.rejects(createDataBackup(root, join(root, 'students.json')), /不能覆盖/)
    const entered = deferred(), resume = deferred()
    const write = withWrite(join(root, 'classes.json'), async () => { entered.resolve(); await resume.promise })
    await entered.promise
    await assert.rejects(createDataBackup(root, join(root, 'bad.gdpebak')), /保存|恢复/)
    resume.resolve(); await write
    await createDataBackup(root, join(root, 'good.gdpebak')); assert.deepEqual(await generations(join(root, 'good.gdpebak')), [0, 0])
  })
  await check('backup holder blocks save/import/restore; ordinary reads continue', async root => {
    await seed(root); await createDataBackup(root, join(root, 'source.gdpebak'))
    await pauseBackup(root, async () => {
      await assert.rejects(writeJsonItemsAtomic(join(root, 'students.json'), [{ generation: 1 }]), /备份|恢复/)
      assert.equal((await runStagedJsonWrites([{ name: 'students.json', write: () => writeJsonItemsAtomic(join(root, 'students.json'), []), restore: async () => {} }])).ok, false)
      await assert.rejects(restoreDataBackup(root, join(root, 'source.gdpebak')), /保存|恢复/)
      assert((await fs.readFile(join(root, 'students.json'), 'utf8')).includes('generation'))
      assert.deepEqual(await readJsonItemsFile(join(root, 'students.json'), input => { assert(Array.isArray(input)); return input }), [{ generation: 0 }])
    })
    assert.deepEqual(await generations(join(root, 'snapshot.gdpebak')), [0, 0])
  })
  await check('import holder rejects backup and commits a matching pair', async root => {
    await seed(root); const entered = deferred(), resume = deferred()
    const importing = runStagedJsonWrites([
      { name: 'classes.json', restore: async () => {}, write: async () => { await writeJsonItemsAtomic(join(root, 'classes.json'), [{ generation: 1 }]); entered.resolve(); await resume.promise } },
      { name: 'students.json', restore: async () => {}, write: () => writeJsonItemsAtomic(join(root, 'students.json'), [{ generation: 1 }]) }
    ])
    await entered.promise; await assert.rejects(createDataBackup(root, join(root, 'bad.gdpebak')), /事务/)
    resume.resolve(); assert((await importing).ok)
    await createDataBackup(root, join(root, 'good.gdpebak')); assert.deepEqual(await generations(join(root, 'good.gdpebak')), [1, 1])
  })
  await check('restore holder rejects backup/save and safety backup does not deadlock', async root => {
    await seed(root); await createDataBackup(root, join(root, 'old.gdpebak')); await seed(root, 1)
    const entered = deferred(), resume = deferred()
    const restoring = restoreDataBackup(root, join(root, 'old.gdpebak'), { createSafetyBackup: async () => {
      entered.resolve(); await resume.promise
      const path = join(root, 'safety.gdpebak'); await createDataBackup(root, path); return path
    } })
    await entered.promise
    await assert.rejects(createDataBackup(root, join(root, 'bad.gdpebak')), /事务/)
    await assert.rejects(writeJsonItemsAtomic(join(root, 'students.json'), []), /事务/)
    resume.resolve(); await restoring
    assert.deepEqual(await generations(join(root, 'safety.gdpebak')), [1, 1])
    await createDataBackup(root, join(root, 'after.gdpebak')); assert.deepEqual(await generations(join(root, 'after.gdpebak')), [0, 0])
  })
  await check('backup mid-read failure releases lock and never publishes a success archive', async root => {
    await seed(root); const original = fs.readFile
    fs.readFile = (async (...args: Parameters<typeof original>) => { if (String(args[0]) === join(root, 'students.json')) throw new Error('injected read failure'); return original(...args) }) as typeof original
    syncBuiltinESMExports()
    try { await assert.rejects(createDataBackup(root, join(root, 'failed.gdpebak')), /injected/) }
    finally { fs.readFile = original; syncBuiltinESMExports() }
    await assert.rejects(fs.access(join(root, 'failed.gdpebak')))
    await writeJsonItemsAtomic(join(root, 'students.json'), [{ generation: 0 }])
    for (let i = 0; i < 5; i++) { const p = join(root, `${i}.gdpebak`); await createDataBackup(root, p); await verifyBackupArchive(p); assert.deepEqual(await generations(p), [0, 0]) }
    await assert.rejects(withExclusiveDataAccess(async () => { throw new Error('holder crash simulation') }), /holder crash/)
    await createDataBackup(root, join(root, 'released.gdpebak'))
  })
  for (const state of ['missing', 'empty', 'corrupt', 'partial', 'record-missing', 'file-missing']) {
    await check(`read-only health preserves attachments with ${state} index`, async root => {
      const source = join(root, 'fixture.txt'); await fs.writeFile(source, 'attachment bytes')
      const items = await importFileResource(source, { title: '附件', category: '其他', tags: [], description: '', notes: '' })
      const files = join(root, 'resources', 'files'); await fs.writeFile(join(files, 'unindexed.txt'), 'unindexed bytes')
      const meta = join(root, 'resources.json')
      if (state === 'missing') await fs.unlink(meta)
      if (state === 'empty' || state === 'record-missing') await fs.writeFile(meta, '[]')
      if (state === 'corrupt') await fs.writeFile(meta, '{broken')
      if (state === 'file-missing') await fs.unlink(join(files, items[0].storedFileName!))
      const names = await fs.readdir(files); const before = await Promise.all(names.map(n => fs.readFile(join(files, n)).catch(() => null)))
      const original = await fs.readFile(meta).catch(() => null)
      const report = await buildAndRunStartupHealthCheck(); await buildAndRunDataIntegrityAudit()
      await loadResources().catch(() => {})
      assert.deepEqual(await fs.readdir(files), names)
      assert.deepEqual(await Promise.all(names.map(n => fs.readFile(join(files, n)).catch(() => null))), before)
      if (state !== 'missing') assert.deepEqual(await fs.readFile(meta), original)
      assert(report.issues.some(i => i.code === 'unknown_attachment'))
      if (state === 'file-missing') assert(report.issues.some(i => i.code === 'missing_attachment'))
    })
  }
  await check('all authoritative JSON files: syntax/structure details and write protection', async root => {
    for (const name of BUSINESS_JSON_FILES) {
      const path = join(root, name)
      await fs.writeFile(path, '{broken')
      let status = (await inspectBusinessFiles(root)).find(s => s.fileName === name)!
      assert.equal(status.errorType, 'invalid_json'); assert.equal(status.parseable, false); assert(status.writeBlocked); assert.equal(status.quarantined, false)
      await assert.rejects(writeJsonItemsAtomic(path, []), /禁止普通保存/)
      await fs.writeFile(path, name === 'settings.json' ? 'null' : '{}')
      status = (await inspectBusinessFiles(root)).find(s => s.fileName === name)!
      assert.equal(status.errorType, 'invalid_structure', name); assert(status.structureInvalid)
      await fs.unlink(path); clearCorruptProtection(path)
    }
  })
  await check('fresh root, directory-only, partial data, restart and saved data are preserved', async root => {
    const absent = join(root, 'absent'); assert.equal(await initializeUserData(absent), 'new'); assert.equal(await initializeUserData(absent), 'returning')
    assert.equal(await initializeUserData(root), 'new'); assert.deepEqual(await loadSchedule(), [])
    await fs.writeFile(join(root, 'students.json'), 'historical bytes'); assert.equal(await initializeUserData(root), 'returning'); assert.equal(await fs.readFile(join(root, 'students.json'), 'utf8'), 'historical bytes')
    const partial = join(root, 'partial'); await fs.mkdir(partial); await fs.writeFile(join(partial, 'classes.json'), '[]')
    assert.equal(await initializeUserData(partial), 'existing'); assert.equal(await fs.readFile(join(partial, 'classes.json'), 'utf8'), '[]')
  })
  await check('health scan never initializes missing files or rewrites healthy bytes', async root => {
    await fs.writeFile(join(root, 'classes.json'), ' [ ] \n')
    await buildAndRunStartupHealthCheck(); await buildAndRunDataIntegrityAudit()
    assert.deepEqual(await fs.readdir(root), ['classes.json']); assert.equal(await fs.readFile(join(root, 'classes.json'), 'utf8'), ' [ ] \n')
  })
  await check('training multi-file archive commits under the same transaction boundary', async root => {
    registerTrainingIpc()
    const handlers = (globalThis as unknown as { __handlers: Map<string, (...args: unknown[]) => Promise<any>> }).__handlers
    const invoke = (name: string, ...args: unknown[]) => handlers.get(name)!({}, ...args)
    const now = new Date().toISOString()
    const team = { id: 'training-team-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', parentTeamId: null, name: '事务训练队', sport: 'track', coach: '', notes: '', status: 'active', createdAt: now, updatedAt: now }
    await invoke('trainingTeams:save', [team], [])
    const result = await invoke('trainingTeams:archive', team.id)
    assert.equal(result.teams[0].status, 'archived')
    await createDataBackup(root, join(root, 'training.gdpebak'))
    await verifyBackupArchive(join(root, 'training.gdpebak'))
    assert.deepEqual(await fs.readdir(join(root, '.data-transactions')), [])
    const lock = deferred(), entered = deferred()
    const holder = withExclusiveDataAccess(async () => { entered.resolve(); await lock.promise })
    await entered.promise; await assert.rejects(invoke('trainingTeams:archive', team.id), /保存|恢复/)
    lock.resolve(); await holder
  })
  console.log(`RC regression passed: ${count} groups`)
}
main().catch(error => { console.error(error); process.exitCode = 1 })
