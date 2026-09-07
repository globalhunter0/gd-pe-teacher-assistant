import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createDataBackup, restoreDataBackup, verifyBackupArchive } from './service'
import { parseBackupManifest } from './manifest'
import { parseZip, buildZip } from './zip'
import { ARCHIVE_MANIFEST_NAME, BACKUP_FORMAT_VERSION, BUSINESS_JSON_FILES } from './types'
import { loadJsonItemsFile, readJsonItemsFile, writeJsonItemsAtomic } from '../persistence/jsonFile'

function parseAnyItems(input: unknown): unknown[] {
  if (!Array.isArray(input)) {
    throw new Error('items 不是数组')
  }
  return input
}

async function seedUserData(root: string): Promise<void> {
  await writeJsonItemsAtomic(join(root, 'classes.json'), [{ id: 'class-1', className: '初一1班' }])
  await writeJsonItemsAtomic(join(root, 'students.json'), [{ id: 'student-1', name: '张三', classId: 'class-1' }])
  await writeJsonItemsAtomic(join(root, 'schedule.json'), [{ id: 'w1-p1', team: '初一1班' }])
  await writeJsonItemsAtomic(join(root, 'pe-sessions.json'), [])
  await writeJsonItemsAtomic(join(root, 'test-items.json'), [{ id: 'item-1', name: '50米' }])
  await writeJsonItemsAtomic(join(root, 'pe-tests.json'), [{ id: 'test-1', records: [] }])
  await writeJsonItemsAtomic(join(root, 'teaching-plans.json'), [{ id: 'plan-1', name: '初一计划' }])
  await writeJsonItemsAtomic(join(root, 'resources.json'), [{ id: 'res-1', storedFileName: 'res-1.bin' }])
  await writeJsonItemsAtomic(join(root, 'training-teams.json'), [{ id: 'team-1', name: '田径队' }])
  await writeJsonItemsAtomic(join(root, 'training-members.json'), [])
  await writeJsonItemsAtomic(join(root, 'training-sessions.json'), [])
  await writeJsonItemsAtomic(join(root, 'training-items.json'), [])
  await writeJsonItemsAtomic(join(root, 'training-results.json'), [])

  const filesDir = join(root, 'resources', 'files')
  await mkdir(filesDir, { recursive: true })
  await writeFile(join(filesDir, 'res-1.bin'), Buffer.from([0, 1, 2, 3, 9, 8, 7]))
}

export async function runBackupRestoreSelfCheckOrThrow(): Promise<string> {
  const root = mkdtempSync(join(tmpdir(), 'gdpe-backup-selfcheck-'))
  const outside = mkdtempSync(join(tmpdir(), 'gdpe-backup-artifacts-'))

  try {
    await seedUserData(root)
    const archivePath = join(outside, 'full.gdpebak')
    const created = await createDataBackup(root, archivePath, '0.12.0-selfcheck')
    if (created.fileCount < BUSINESS_JSON_FILES.length) {
      throw new Error(`备份文件数量不足：${created.fileCount}`)
    }
    if (!created.manifest.files.some((file) => file.path === 'resources/files/res-1.bin')) {
      throw new Error('备份未包含资料附件')
    }

    const verified = await verifyBackupArchive(archivePath)
    parseBackupManifest(verified)
    if (verified.backupFormatVersion !== BACKUP_FORMAT_VERSION) {
      throw new Error('manifest 版本不正确')
    }
    if (verified.files.some((file) => !/^[a-f0-9]{64}$/.test(file.sha256))) {
      throw new Error('checksum 缺失')
    }

    await writeJsonItemsAtomic(join(root, 'students.json'), [
      { id: 'student-1', name: '被改过的名字', classId: 'class-1' }
    ])
    await writeFile(join(root, 'resources', 'files', 'res-1.bin'), Buffer.from([9, 9, 9]))

    const restored = await restoreDataBackup(root, archivePath, { appVersion: '0.12.0-selfcheck' })
    if (!restored.safetyBackupPath.includes('safety-backups')) {
      throw new Error('恢复未生成安全备份路径')
    }

    const students = await readJsonItemsFile(join(root, 'students.json'), parseAnyItems)
    const first = students[0] as { name?: string }
    if (first.name !== '张三') {
      throw new Error('JSON 恢复不正确')
    }
    const attachment = await readFile(join(root, 'resources', 'files', 'res-1.bin'))
    if (!attachment.equals(Buffer.from([0, 1, 2, 3, 9, 8, 7]))) {
      throw new Error('附件恢复不正确')
    }

    const zipBuf = await readFile(archivePath)
    const brokenPath = join(outside, 'broken.gdpebak')
    await writeFile(brokenPath, zipBuf.subarray(0, Math.max(20, zipBuf.byteLength - 40)))
    let rejectedBroken = false
    try {
      await verifyBackupArchive(brokenPath)
    } catch {
      rejectedBroken = true
    }
    if (!rejectedBroken) {
      throw new Error('损坏备份应当被拒绝')
    }

    const entries = parseZip(zipBuf)
    const manifestEntry = entries.find((entry) => entry.name === ARCHIVE_MANIFEST_NAME)
    if (!manifestEntry) {
      throw new Error('缺少 manifest')
    }
    const manifestJson = JSON.parse(manifestEntry.data.toString('utf8')) as {
      files: Array<{ path: string; sha256: string; size: number }>
    }
    manifestJson.files[0].sha256 = '0'.repeat(64)
    const tampered = buildZip(
      entries.map((entry) =>
        entry.name === ARCHIVE_MANIFEST_NAME
          ? { name: entry.name, data: Buffer.from(`${JSON.stringify(manifestJson, null, 2)}\n`) }
          : entry
      )
    )
    const tamperedPath = join(outside, 'tampered.gdpebak')
    await writeFile(tamperedPath, tampered)
    let rejectedChecksum = false
    try {
      await verifyBackupArchive(tamperedPath)
    } catch {
      rejectedChecksum = true
    }
    if (!rejectedChecksum) {
      throw new Error('checksum 错误的备份应当被拒绝')
    }

    const unsupported = buildZip([
      {
        name: ARCHIVE_MANIFEST_NAME,
        data: Buffer.from(
          `${JSON.stringify({ backupFormatVersion: 99, appVersion: 'x', createdAt: 't', files: [] }, null, 2)}\n`
        )
      }
    ])
    const unsupportedPath = join(outside, 'unsupported.gdpebak')
    await writeFile(unsupportedPath, unsupported)
    let rejectedUnsupported = false
    try {
      await verifyBackupArchive(unsupportedPath)
    } catch {
      rejectedUnsupported = true
    }
    if (!rejectedUnsupported) {
      throw new Error('不支持的备份格式应当被拒绝')
    }

    const corruptPath = join(root, 'students.json')
    const beforeCorrupt = 'this is not json {{{'
    await writeFile(corruptPath, beforeCorrupt, 'utf8')
    let threw = false
    try {
      await loadJsonItemsFile(corruptPath, parseAnyItems, [])
    } catch {
      threw = true
    }
    if (!threw) {
      throw new Error('损坏 JSON 应当读取失败')
    }
    const still = await readFile(corruptPath, 'utf8')
    if (still !== beforeCorrupt) {
      throw new Error('损坏 JSON 被自动覆盖了')
    }

    await writeJsonItemsAtomic(join(root, 'students.json'), [
      { id: 'student-1', name: '张三', classId: 'class-1' }
    ])

    const beforeSafety = await readFile(join(root, 'students.json'), 'utf8')
    let stopped = false
    try {
      await restoreDataBackup(root, archivePath, {
        createSafetyBackup: async () => {
          throw new Error('simulated safety backup failure')
        }
      })
    } catch (error) {
      if (error instanceof Error && error.message.includes('恢复前安全备份失败')) {
        stopped = true
      } else {
        throw error
      }
    }
    if (!stopped) {
      throw new Error('安全备份失败后应当停止恢复')
    }
    const afterSafety = await readFile(join(root, 'students.json'), 'utf8')
    if (afterSafety !== beforeSafety) {
      throw new Error('安全备份失败后业务数据被改动')
    }

    await writeJsonItemsAtomic(join(root, 'students.json'), [
      { id: 'student-1', name: '恢复前当前数据', classId: 'class-1' }
    ])
    try {
      await restoreDataBackup(root, archivePath, { injectFailure: 'after-place' })
      throw new Error('注入失败应当抛错')
    } catch (error) {
      if (error instanceof Error && error.message === '注入失败应当抛错') {
        throw error
      }
      if (!(error instanceof Error) || !error.message.includes('injected restore failure')) {
        throw error
      }
    }
    const rolled = await readJsonItemsFile(join(root, 'students.json'), parseAnyItems)
    const rolledFirst = rolled[0] as { name?: string }
    if (rolledFirst.name !== '恢复前当前数据') {
      throw new Error('恢复失败后未能 rollback')
    }

    return 'backup/restore self-check passed'
  } finally {
    rmSync(root, { recursive: true, force: true })
    rmSync(outside, { recursive: true, force: true })
  }
}
