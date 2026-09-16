import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createDataBackup, restoreDataBackup, verifyBackupArchive, backupCoversResources, listReplaceableBusinessJson } from './service'
import { parseBackupManifest } from './manifest'
import { parseZip, buildZip } from './zip'
import { ARCHIVE_FILES_PREFIX, ARCHIVE_MANIFEST_NAME, BACKUP_FORMAT_VERSION, BUSINESS_JSON_FILES } from './types'
import { loadJsonItemsFile, pathExists, readJsonItemsFile, writeJsonItemsAtomic } from '../persistence/jsonFile'

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

// 早期版本备份包只管理这几个业务域，用于模拟旧版 .gdpebak。
const LEGACY_CORE_FILES = ['schedule.json', 'classes.json', 'students.json', 'pe-sessions.json']

// 旧版备份包之后才加入的业务域，恢复旧包时必须原样保留。
const LATER_DOMAIN_FILES = BUSINESS_JSON_FILES.filter((name) => !LEGACY_CORE_FILES.includes(name))

function omitTraining(path: string): boolean {
  return path.startsWith('training-')
}

function omitTrainingAndResources(path: string): boolean {
  return omitTraining(path) || path === 'resources.json' || path.startsWith('resources/')
}

async function writeFilteredArchive(
  sourceArchive: string,
  destPath: string,
  omit: (path: string) => boolean
): Promise<void> {
  const zipBuf = await readFile(sourceArchive)
  const entries = parseZip(zipBuf)
  const manifestEntry = entries.find((entry) => entry.name === ARCHIVE_MANIFEST_NAME)
  if (!manifestEntry) {
    throw new Error('缺少 manifest')
  }
  const manifest = JSON.parse(manifestEntry.data.toString('utf8')) as {
    backupFormatVersion: number
    appVersion: string
    createdAt: string
    files: Array<{ path: string; sha256: string; size: number }>
  }
  manifest.files = manifest.files.filter((file) => !omit(file.path))
  const keptZipNames = new Set([
    ARCHIVE_MANIFEST_NAME,
    ...manifest.files.map((file) => `${ARCHIVE_FILES_PREFIX}${file.path}`)
  ])
  const filtered = buildZip([
    {
      name: ARCHIVE_MANIFEST_NAME,
      data: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`)
    },
    ...entries.filter(
      (entry) => entry.name !== ARCHIVE_MANIFEST_NAME && keptZipNames.has(entry.name.replace(/\\/g, '/'))
    )
  ])
  await writeFile(destPath, filtered)
}

async function readFirstName(filePath: string): Promise<string | undefined> {
  const items = await readJsonItemsFile(filePath, parseAnyItems)
  const first = items[0] as { name?: string }
  return first?.name
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
    if (restored.keptPaths.length !== 0) {
      throw new Error(`完整备份恢复不应保留缺失域：${restored.keptPaths.join(',')}`)
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

    await seedUserData(root)
    await writeJsonItemsAtomic(join(root, 'students.json'), [
      { id: 'student-1', name: '当前学生', classId: 'class-1' }
    ])
    await writeJsonItemsAtomic(join(root, 'training-teams.json'), [
      { id: 'team-keep', name: '应保留的训练队' }
    ])
    await writeJsonItemsAtomic(join(root, 'resources.json'), [
      { id: 'res-1', storedFileName: 'res-1.bin' },
      { id: 'res-keep', storedFileName: 'keep.bin' }
    ])
    await writeFile(join(root, 'resources', 'files', 'keep.bin'), Buffer.from('KEEP-ME'))

    const sparseOldPath = join(outside, 'sparse-old.gdpebak')
    await writeFilteredArchive(archivePath, sparseOldPath, omitTrainingAndResources)
    const sparseManifest = await verifyBackupArchive(sparseOldPath)
    if (sparseManifest.files.some((file) => omitTrainingAndResources(file.path))) {
      throw new Error('稀疏旧备份仍包含训练队或资料')
    }
    if (backupCoversResources(sparseManifest.files.map((file) => file.path))) {
      throw new Error('稀疏旧备份不应覆盖资料域')
    }
    if (listReplaceableBusinessJson(sparseManifest.files.map((file) => file.path)).includes('training-teams.json')) {
      throw new Error('稀疏旧备份不应替换训练队')
    }

    const sparseRestored = await restoreDataBackup(root, sparseOldPath, { appVersion: '0.12.0-selfcheck' })
    if (!sparseRestored.keptPaths.includes('training-teams.json')) {
      throw new Error('旧备份缺少训练队时应当保留当前训练队')
    }
    if (!sparseRestored.keptPaths.includes('resources.json')) {
      throw new Error('旧备份缺少资料时应当保留当前资料清单')
    }
    if (!sparseRestored.keptPaths.includes('resources/files/keep.bin')) {
      throw new Error('旧备份缺少附件时应当保留当前附件')
    }
    if ((await readFirstName(join(root, 'students.json'))) !== '张三') {
      throw new Error('稀疏恢复未写入备份中的学生数据')
    }
    if ((await readFirstName(join(root, 'training-teams.json'))) !== '应保留的训练队') {
      throw new Error('旧备份缺少训练队时删除了现有训练队')
    }
    const keptResources = await readJsonItemsFile(join(root, 'resources.json'), parseAnyItems)
    if (!keptResources.some((item) => (item as { id?: string }).id === 'res-keep')) {
      throw new Error('旧备份缺少资料时删除了现有资料清单')
    }
    const keptAttachment = await readFile(join(root, 'resources', 'files', 'keep.bin'))
    if (!keptAttachment.equals(Buffer.from('KEEP-ME'))) {
      throw new Error('旧备份缺少附件时删除了现有附件')
    }

    await writeJsonItemsAtomic(join(root, 'students.json'), [
      { id: 'student-1', name: '稀疏恢复前', classId: 'class-1' }
    ])
    try {
      await restoreDataBackup(root, sparseOldPath, { injectFailure: 'after-place' })
      throw new Error('稀疏恢复注入失败应当抛错')
    } catch (error) {
      if (error instanceof Error && error.message === '稀疏恢复注入失败应当抛错') {
        throw error
      }
      if (!(error instanceof Error) || !error.message.includes('injected restore failure')) {
        throw error
      }
    }
    if ((await readFirstName(join(root, 'students.json'))) !== '稀疏恢复前') {
      throw new Error('稀疏恢复失败后未能 rollback 学生数据')
    }
    if ((await readFirstName(join(root, 'training-teams.json'))) !== '应保留的训练队') {
      throw new Error('稀疏恢复失败后丢失了应保留的训练队')
    }
    if (!(await pathExists(join(root, 'resources', 'files', 'keep.bin')))) {
      throw new Error('稀疏恢复失败后丢失了应保留的附件')
    }

    await writeJsonItemsAtomic(join(root, 'students.json'), [
      { id: 'student-1', name: '资料域恢复前', classId: 'class-1' }
    ])
    const noTrainingPath = join(outside, 'no-training.gdpebak')
    await writeFilteredArchive(archivePath, noTrainingPath, omitTraining)
    const domainRestored = await restoreDataBackup(root, noTrainingPath, { appVersion: '0.12.0-selfcheck' })
    if (!domainRestored.keptPaths.includes('training-teams.json')) {
      throw new Error('缺少训练队的备份应当保留当前训练队')
    }
    if (domainRestored.keptPaths.includes('resources.json')) {
      throw new Error('备份包含资料域时不应把资料清单当作保留项')
    }
    if ((await readFirstName(join(root, 'training-teams.json'))) !== '应保留的训练队') {
      throw new Error('备份包含资料但不含训练队时删除了现有训练队')
    }
    const restoredResources = await readJsonItemsFile(join(root, 'resources.json'), parseAnyItems)
    if (restoredResources.some((item) => (item as { id?: string }).id === 'res-keep')) {
      throw new Error('备份包含资料域时应当替换资料清单')
    }
    if (await pathExists(join(root, 'resources', 'files', 'keep.bin'))) {
      throw new Error('备份包含资料域时应当替换附件目录')
    }
    const restoredAttachment = await readFile(join(root, 'resources', 'files', 'res-1.bin'))
    if (!restoredAttachment.equals(Buffer.from([0, 1, 2, 3, 9, 8, 7]))) {
      throw new Error('备份包含资料域时附件未按备份恢复')
    }

    await seedUserData(root)
    await writeJsonItemsAtomic(join(root, 'training-teams.json'), [
      { id: 'team-keep', name: '旧包恢复后应保留的训练队' }
    ])
    await writeJsonItemsAtomic(join(root, 'training-results.json'), [{ id: 'tr-keep' }])
    await writeJsonItemsAtomic(join(root, 'teaching-plans.json'), [{ id: 'plan-keep', name: '应保留的教案' }])
    await writeJsonItemsAtomic(join(root, 'pe-tests.json'), [{ id: 'pe-test-keep', records: [] }])
    await writeFile(join(root, 'resources', 'files', 'keep.bin'), Buffer.from('KEEP-ME'))

    const legacyPath = join(outside, 'legacy-core.gdpebak')
    await writeFilteredArchive(archivePath, legacyPath, (path) => !LEGACY_CORE_FILES.includes(path))
    const legacyManifest = await verifyBackupArchive(legacyPath)
    if (legacyManifest.files.length !== LEGACY_CORE_FILES.length) {
      throw new Error(`旧版极简备份文件数量不符：${legacyManifest.files.length}`)
    }
    const legacyRestored = await restoreDataBackup(root, legacyPath, { appVersion: '0.12.0-selfcheck' })
    if (legacyRestored.restoredCount !== LEGACY_CORE_FILES.length) {
      throw new Error('旧版极简备份恢复数量不符')
    }
    for (const laterDomain of LATER_DOMAIN_FILES) {
      if (!legacyRestored.keptPaths.includes(laterDomain)) {
        throw new Error(`旧版极简备份未把后来新增的业务域标记为保留：${laterDomain}`)
      }
      if (!(await pathExists(join(root, laterDomain)))) {
        throw new Error(`旧版极简备份删除了后来新增的业务域：${laterDomain}`)
      }
    }
    if ((await readFirstName(join(root, 'training-teams.json'))) !== '旧包恢复后应保留的训练队') {
      throw new Error('旧版极简备份覆盖了现有训练队')
    }
    if ((await readFirstName(join(root, 'teaching-plans.json'))) !== '应保留的教案') {
      throw new Error('旧版极简备份覆盖了现有教案')
    }
    const legacyPeTests = await readJsonItemsFile(join(root, 'pe-tests.json'), parseAnyItems)
    if (!legacyPeTests.some((item) => (item as { id?: string }).id === 'pe-test-keep')) {
      throw new Error('旧版极简备份清空了现有体育测试数据')
    }
    if (!(await pathExists(join(root, 'resources', 'files', 'keep.bin')))) {
      throw new Error('旧版极简备份删除了现有附件')
    }
    if ((await readFirstName(join(root, 'students.json'))) !== '张三') {
      throw new Error('旧版极简备份未恢复其包含的学生数据')
    }

    const emptyRoot = join(outside, 'empty-domain-root')
    await mkdir(emptyRoot, { recursive: true })
    await seedUserData(emptyRoot)
    await writeJsonItemsAtomic(join(emptyRoot, 'training-teams.json'), [])
    await writeJsonItemsAtomic(join(emptyRoot, 'resources.json'), [])
    await rm(join(emptyRoot, 'resources', 'files', 'res-1.bin'), { force: true })
    const emptyDomainPath = join(outside, 'empty-domain.gdpebak')
    await createDataBackup(emptyRoot, emptyDomainPath, '0.12.0-selfcheck')

    const emptyRestored = await restoreDataBackup(root, emptyDomainPath, { appVersion: '0.12.0-selfcheck' })
    if (emptyRestored.keptPaths.includes('training-teams.json')) {
      throw new Error('备份显式包含空训练队时不应判定为缺失域')
    }
    if (emptyRestored.keptPaths.includes('resources.json')) {
      throw new Error('备份显式包含空资料域时不应判定为缺失域')
    }
    const emptyTeams = await readJsonItemsFile(join(root, 'training-teams.json'), parseAnyItems)
    if (emptyTeams.length !== 0) {
      throw new Error('备份显式包含空训练队时应当恢复为空')
    }
    const emptyResources = await readJsonItemsFile(join(root, 'resources.json'), parseAnyItems)
    if (emptyResources.length !== 0) {
      throw new Error('备份显式包含空资料域时应当恢复为空')
    }
    if (await pathExists(join(root, 'resources', 'files', 'keep.bin'))) {
      throw new Error('备份显式包含空资料域时应当清空附件目录')
    }

    await writeJsonItemsAtomic(join(root, 'training-teams.json'), [
      { id: 'team-after-empty', name: '损坏包恢复前的训练队' }
    ])
    await writeJsonItemsAtomic(join(root, 'students.json'), [
      { id: 'student-1', name: '损坏包恢复前', classId: 'class-1' }
    ])
    for (const badPath of [brokenPath, tamperedPath, unsupportedPath]) {
      let rejectedRestore = false
      try {
        await restoreDataBackup(root, badPath, { appVersion: '0.12.0-selfcheck' })
      } catch {
        rejectedRestore = true
      }
      if (!rejectedRestore) {
        throw new Error(`非法备份应当被拒绝恢复：${badPath}`)
      }
      if ((await readFirstName(join(root, 'students.json'))) !== '损坏包恢复前') {
        throw new Error(`非法备份恢复破坏了现有学生数据：${badPath}`)
      }
      if ((await readFirstName(join(root, 'training-teams.json'))) !== '损坏包恢复前的训练队') {
        throw new Error(`非法备份恢复破坏了现有训练队：${badPath}`)
      }
    }

    await seedUserData(root)
    const profileTeamId = 'training-team-a0240aaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    const profileMemberId = 'training-member-a0240aaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    const profileSessionId = 'training-session-a0240aaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    const profileResultId = 'training-result-a0240aaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    await writeJsonItemsAtomic(join(root, 'training-teams.json'), [
      {
        id: profileTeamId,
        parentTeamId: null,
        name: 'P0档案队',
        sport: 'track',
        coach: '',
        notes: '',
        status: 'active',
        createdAt: '2026-09-15T00:00:00.000Z',
        updatedAt: '2026-09-15T00:00:00.000Z'
      }
    ])
    await writeJsonItemsAtomic(join(root, 'training-members.json'), [
      {
        id: profileMemberId,
        teamId: profileTeamId,
        studentId: 'student-1',
        joinedAt: '2026-09-01T00:00:00.000Z',
        leftAt: null,
        status: 'active',
        nameSnapshot: '张三',
        studentNoSnapshot: 'A01',
        classNameSnapshot: '初一1班',
        genderSnapshot: 'male',
        specialty: '100米',
        position: '',
        trainingGroup: '短跑一组',
        trainingNotes: '注意热身',
        notes: '',
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z'
      }
    ])
    await writeJsonItemsAtomic(join(root, 'training-sessions.json'), [
      {
        id: profileSessionId,
        teamId: profileTeamId,
        date: '2026-09-10',
        startTime: '16:00',
        title: '速度课',
        place: '田径场',
        durationMinutes: 90,
        notes: '',
        teamNameSnapshot: 'P0档案队',
        createdAt: '2026-09-10T00:00:00.000Z',
        updatedAt: '2026-09-10T00:00:00.000Z',
        exercises: [],
        attendance: []
      }
    ])
    await writeJsonItemsAtomic(join(root, 'training-results.json'), [
      {
        id: profileResultId,
        teamId: profileTeamId,
        studentId: 'student-1',
        studentNameSnapshot: '张三',
        studentNoSnapshot: 'A01',
        classNameSnapshot: '初一1班',
        genderSnapshot: 'male',
        date: '2026-09-10',
        itemId: 'training-item-builtin-run-1000m',
        itemNameSnapshot: '1000米',
        unitSnapshot: 's',
        customUnitLabelSnapshot: '',
        directionSnapshot: 'lowerBetter',
        valueTypeSnapshot: 'time',
        timeInputModeSnapshot: 'minutesSeconds',
        decimalPlacesSnapshot: 1,
        rawInput: '3.39',
        rawValue: 219,
        kind: 'training',
        sessionId: profileSessionId,
        status: 'valid',
        note: '',
        createdAt: '2026-09-10T00:00:00.000Z',
        updatedAt: '2026-09-10T00:00:00.000Z'
      }
    ])
    await writeJsonItemsAtomic(join(root, 'schedule.json'), [
      {
        id: 'w1-p8',
        weekday: 1,
        period: 8,
        startTime: '16:30',
        endTime: '18:00',
        team: '校田径队训练',
        courseType: 'other',
        trainingTeamId: profileTeamId
      }
    ])
    const profileArchive = join(outside, 'training-profile.gdpebak')
    await createDataBackup(root, profileArchive, '0.24.0-selfcheck')
    await writeJsonItemsAtomic(join(root, 'training-members.json'), [])
    await writeJsonItemsAtomic(join(root, 'training-results.json'), [])
    await writeJsonItemsAtomic(join(root, 'schedule.json'), [])
    await restoreDataBackup(root, profileArchive, { appVersion: '0.24.0-selfcheck' })
    const restoredMembers = await readJsonItemsFile(join(root, 'training-members.json'), parseAnyItems)
    const restoredMember = restoredMembers[0] as {
      specialty?: string
      trainingGroup?: string
      trainingNotes?: string
    }
    if (restoredMember.specialty !== '100米' || restoredMember.trainingGroup !== '短跑一组') {
      throw new Error('backup/restore 后运动员档案字段丢失')
    }
    if (restoredMember.trainingNotes !== '注意热身') {
      throw new Error('backup/restore 后训练备注丢失')
    }
    const restoredResults = await readJsonItemsFile(join(root, 'training-results.json'), parseAnyItems)
    const restoredResult = restoredResults[0] as { sessionId?: string | null }
    if (restoredResult.sessionId !== profileSessionId) {
      throw new Error('backup/restore 后 sessionId 绑定丢失')
    }
    const restoredSchedule = await readJsonItemsFile(join(root, 'schedule.json'), parseAnyItems)
    if ((restoredSchedule[0] as { trainingTeamId?: string }).trainingTeamId !== profileTeamId) {
      throw new Error('backup/restore 后课表 trainingTeamId 关联丢失')
    }

    const archivedAt = '2026-09-16T00:00:00.000Z'
    await writeJsonItemsAtomic(join(root, 'training-teams.json'), [
      {
        id: profileTeamId,
        parentTeamId: null,
        name: 'P0档案队',
        sport: 'track',
        coach: '',
        notes: '',
        status: 'archived',
        createdAt: '2026-09-15T00:00:00.000Z',
        updatedAt: archivedAt
      }
    ])
    await writeJsonItemsAtomic(join(root, 'training-members.json'), [
      {
        ...(restoredMembers[0] as Record<string, unknown>),
        status: 'left',
        leftAt: archivedAt,
        updatedAt: archivedAt
      }
    ])
    const safeDeleteArchive = join(outside, 'training-safe-delete.gdpebak')
    await createDataBackup(root, safeDeleteArchive, '0.24.0-selfcheck')
    for (const fileName of [
      'training-teams.json',
      'training-members.json',
      'training-sessions.json',
      'training-results.json',
      'schedule.json'
    ]) {
      await writeJsonItemsAtomic(join(root, fileName), [])
    }
    await restoreDataBackup(root, safeDeleteArchive, { appVersion: '0.24.0-selfcheck' })
    const lifecycleTeams = await readJsonItemsFile(join(root, 'training-teams.json'), parseAnyItems)
    const lifecycleMembers = await readJsonItemsFile(join(root, 'training-members.json'), parseAnyItems)
    const lifecycleSessions = await readJsonItemsFile(join(root, 'training-sessions.json'), parseAnyItems)
    const lifecycleResults = await readJsonItemsFile(join(root, 'training-results.json'), parseAnyItems)
    const lifecycleSchedule = await readJsonItemsFile(join(root, 'schedule.json'), parseAnyItems)
    if ((lifecycleTeams[0] as { status?: string }).status !== 'archived') {
      throw new Error('backup/restore 后安全删除的 archived 状态丢失')
    }
    if (
      (lifecycleMembers[0] as { status?: string; leftAt?: string | null }).status !== 'left' ||
      (lifecycleMembers[0] as { leftAt?: string | null }).leftAt !== archivedAt
    ) {
      throw new Error('backup/restore 后安全删除的历史队籍丢失')
    }
    if ((lifecycleSessions[0] as { id?: string }).id !== profileSessionId) {
      throw new Error('backup/restore 后安全删除的训练场次丢失')
    }
    if (
      (lifecycleResults[0] as { sessionId?: string | null }).sessionId !== profileSessionId
    ) {
      throw new Error('backup/restore 后安全删除的成绩课次关联丢失')
    }
    if ((lifecycleSchedule[0] as { trainingTeamId?: string }).trainingTeamId !== profileTeamId) {
      throw new Error('backup/restore 后 archived 训练队的课表关联丢失')
    }

    const leftovers = (await readdir(root)).filter(
      (name) => name.startsWith('.restore-staging-') || name.startsWith('.restore-outgoing-')
    )
    if (leftovers.length > 0) {
      throw new Error(`恢复流程遗留了临时目录：${leftovers.join(',')}`)
    }

    return 'backup/restore self-check passed'
  } finally {
    rmSync(root, { recursive: true, force: true })
    rmSync(outside, { recursive: true, force: true })
  }
}
