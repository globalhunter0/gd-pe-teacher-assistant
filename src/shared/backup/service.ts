import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { sha256Buffer, sha256File } from './checksum'
import { parseBackupManifest } from './manifest'
import {
  APP_RELEASE_VERSION,
  ARCHIVE_FILES_PREFIX,
  ARCHIVE_MANIFEST_NAME,
  BACKUP_FORMAT_VERSION,
  BUSINESS_JSON_FILES,
  RESOURCE_FILES_DIR,
  SAFETY_BACKUPS_DIR,
  type BackupFileEntry,
  type BackupManifest,
  type BackupResult,
  type RestoreResult
} from './types'
import { buildZip, parseZip, type ZipEntry } from './zip'
import { pathExists } from '../persistence/jsonFile'

const MAX_ARCHIVE_BYTES = 512 * 1024 * 1024

function posixJoin(...parts: string[]): string {
  return parts.join('/').replace(/\\/g, '/').replace(/\/+/g, '/')
}

function isInside(root: string, candidate: string): boolean {
  const relativePath = relative(resolve(root), resolve(candidate))
  return (
    relativePath === '' ||
    (!relativePath.startsWith(`..${sep}`) && !relativePath.startsWith('..') && !isAbsolute(relativePath))
  )
}

async function collectResourceFileRelPaths(userDataRoot: string): Promise<string[]> {
  const filesDir = join(userDataRoot, RESOURCE_FILES_DIR)
  if (!(await pathExists(filesDir))) {
    return []
  }

  const collected: string[] = []

  async function walk(dir: string): Promise<void> {
    const names = await readdir(dir, { withFileTypes: true })
    for (const entry of names) {
      if (entry.name === '.tmp' || entry.name.startsWith('.')) {
        continue
      }
      const full = join(dir, entry.name)
      if (!isInside(filesDir, full)) {
        continue
      }
      if (entry.isDirectory()) {
        await walk(full)
      } else if (entry.isFile()) {
        const rel = posixJoin(RESOURCE_FILES_DIR, relative(filesDir, full).split(sep).join('/'))
        collected.push(rel)
      }
    }
  }

  await walk(filesDir)
  collected.sort((a, b) => a.localeCompare(b))
  return collected
}

export async function listManagedRelativePaths(userDataRoot: string): Promise<string[]> {
  const paths: string[] = []
  for (const name of BUSINESS_JSON_FILES) {
    if (await pathExists(join(userDataRoot, name))) {
      paths.push(name)
    }
  }
  paths.push(...(await collectResourceFileRelPaths(userDataRoot)))
  return paths
}

async function buildManifestEntries(userDataRoot: string, relativePaths: string[]): Promise<BackupFileEntry[]> {
  const files: BackupFileEntry[] = []
  for (const rel of relativePaths) {
    const full = join(userDataRoot, rel)
    const info = await stat(full)
    if (!info.isFile()) {
      throw new Error(`无法备份：${rel} 不是文件`)
    }
    files.push({
      path: rel.replace(/\\/g, '/'),
      size: info.size,
      sha256: await sha256File(full)
    })
  }
  return files
}

function zipNameFor(relPath: string): string {
  return `${ARCHIVE_FILES_PREFIX}${relPath.replace(/\\/g, '/')}`
}

function relPathFromZipName(zipName: string): string | null {
  const name = zipName.replace(/\\/g, '/')
  if (name === ARCHIVE_MANIFEST_NAME) {
    return null
  }
  if (!name.startsWith(ARCHIVE_FILES_PREFIX)) {
    throw new Error(`备份包含未知条目：${zipName}`)
  }
  const rel = name.slice(ARCHIVE_FILES_PREFIX.length)
  if (rel === '' || rel.includes('..')) {
    throw new Error(`备份包含不安全路径：${zipName}`)
  }
  return rel
}

export async function createDataBackup(
  userDataRoot: string,
  archivePath: string,
  appVersion: string = APP_RELEASE_VERSION
): Promise<BackupResult> {
  const relativePaths = await listManagedRelativePaths(userDataRoot)
  const files = await buildManifestEntries(userDataRoot, relativePaths)
  const manifest: BackupManifest = {
    backupFormatVersion: BACKUP_FORMAT_VERSION,
    appVersion,
    createdAt: new Date().toISOString(),
    files
  }

  const zipEntries: ZipEntry[] = [
    {
      name: ARCHIVE_MANIFEST_NAME,
      data: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
    }
  ]

  for (const rel of relativePaths) {
    zipEntries.push({
      name: zipNameFor(rel),
      data: await readFile(join(userDataRoot, rel))
    })
  }

  const zip = buildZip(zipEntries)
  if (zip.byteLength > MAX_ARCHIVE_BYTES) {
    throw new Error('备份包超过 512MB，请先清理过大的资料文件')
  }

  await mkdir(dirname(archivePath), { recursive: true })
  const tmpPath = `${archivePath}.${process.pid}.tmp`
  await writeFile(tmpPath, zip)
  await rename(tmpPath, archivePath)

  await verifyBackupArchive(archivePath)
  return { archivePath, fileCount: files.length, manifest }
}

export async function verifyBackupArchive(archivePath: string): Promise<BackupManifest> {
  const zipStat = await stat(archivePath)
  if (!zipStat.isFile()) {
    throw new Error('备份包不是文件')
  }
  if (zipStat.size > MAX_ARCHIVE_BYTES) {
    throw new Error('备份包过大')
  }

  const zipBuf = await readFile(archivePath)
  const entries = parseZip(zipBuf)
  const byName = new Map(entries.map((entry) => [entry.name.replace(/\\/g, '/'), entry]))
  const manifestEntry = byName.get(ARCHIVE_MANIFEST_NAME)
  if (!manifestEntry) {
    throw new Error('备份包缺少 manifest.json')
  }

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(manifestEntry.data.toString('utf8'))
  } catch {
    throw new Error('备份清单无法解析')
  }
  const manifest = parseBackupManifest(parsedJson)

  if (byName.size !== manifest.files.length + 1) {
    throw new Error('备份包文件数量与清单不一致')
  }

  for (const file of manifest.files) {
    const entry = byName.get(zipNameFor(file.path))
    if (!entry) {
      throw new Error(`备份包缺少文件：${file.path}`)
    }
    if (entry.data.byteLength !== file.size) {
      throw new Error(`备份包文件大小与清单不符：${file.path}`)
    }
    const digest = sha256Buffer(entry.data)
    if (digest !== file.sha256) {
      throw new Error(`备份包校验失败：${file.path}`)
    }
  }

  for (const entry of entries) {
    const name = entry.name.replace(/\\/g, '/')
    if (name === ARCHIVE_MANIFEST_NAME) {
      continue
    }
    const rel = relPathFromZipName(name)
    if (!rel || !manifest.files.some((file) => file.path === rel)) {
      throw new Error(`备份包含清单未登记的文件：${name}`)
    }
  }

  return manifest
}

async function removeIfExists(target: string): Promise<void> {
  await rm(target, { recursive: true, force: true })
}

async function moveManagedAside(userDataRoot: string, outgoingDir: string): Promise<void> {
  await mkdir(outgoingDir, { recursive: true })
  for (const name of BUSINESS_JSON_FILES) {
    const source = join(userDataRoot, name)
    if (await pathExists(source)) {
      await rename(source, join(outgoingDir, name))
    }
  }

  const filesDir = join(userDataRoot, RESOURCE_FILES_DIR)
  if (await pathExists(filesDir)) {
    const dest = join(outgoingDir, RESOURCE_FILES_DIR)
    await mkdir(dirname(dest), { recursive: true })
    await rename(filesDir, dest)
  }
}

async function restoreOutgoing(userDataRoot: string, outgoingDir: string): Promise<void> {
  if (!(await pathExists(outgoingDir))) {
    return
  }
  for (const name of BUSINESS_JSON_FILES) {
    const saved = join(outgoingDir, name)
    const dest = join(userDataRoot, name)
    if (await pathExists(saved)) {
      if (await pathExists(dest)) {
        await removeIfExists(dest)
      }
      await rename(saved, dest)
    }
  }
  const savedFiles = join(outgoingDir, RESOURCE_FILES_DIR)
  const destFiles = join(userDataRoot, RESOURCE_FILES_DIR)
  if (await pathExists(savedFiles)) {
    if (await pathExists(destFiles)) {
      await removeIfExists(destFiles)
    }
    await mkdir(dirname(destFiles), { recursive: true })
    await rename(savedFiles, destFiles)
  }
}

async function placeStaging(userDataRoot: string, stagingDir: string, relativePaths: string[]): Promise<void> {
  for (const rel of relativePaths) {
    const source = join(stagingDir, rel)
    const dest = join(userDataRoot, rel)
    if (!isInside(userDataRoot, dest) || !isInside(stagingDir, source)) {
      throw new Error(`恢复路径不安全：${rel}`)
    }
    await mkdir(dirname(dest), { recursive: true })
    await rename(source, dest)
  }
}

export interface RestoreOptions {
  appVersion?: string
  createSafetyBackup?: (userDataRoot: string) => Promise<string>
  injectFailure?: 'after-place'
}

async function defaultSafetyBackup(userDataRoot: string, appVersion: string): Promise<string> {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const dir = join(userDataRoot, SAFETY_BACKUPS_DIR)
  await mkdir(dir, { recursive: true })
  const archivePath = join(dir, `pre-restore-${stamp}.${'gdpebak'}`)
  await createDataBackup(userDataRoot, archivePath, appVersion)
  return archivePath
}

export async function restoreDataBackup(
  userDataRoot: string,
  archivePath: string,
  options: RestoreOptions = {}
): Promise<RestoreResult> {
  const appVersion = options.appVersion ?? APP_RELEASE_VERSION
  const manifest = await verifyBackupArchive(archivePath)

  let safetyBackupPath: string
  try {
    safetyBackupPath = options.createSafetyBackup
      ? await options.createSafetyBackup(userDataRoot)
      : await defaultSafetyBackup(userDataRoot, appVersion)
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(`恢复前安全备份失败，已停止恢复。${reason}`)
  }

  if (!safetyBackupPath || !(await pathExists(safetyBackupPath))) {
    throw new Error('恢复前安全备份失败，已停止恢复。未生成安全备份文件。')
  }

  const token = `${process.pid}-${Date.now()}`
  const stagingDir = join(userDataRoot, `.restore-staging-${token}`)
  const outgoingDir = join(userDataRoot, `.restore-outgoing-${token}`)
  await mkdir(stagingDir, { recursive: true })

  try {
    const zipBuf = await readFile(archivePath)
    const entries = parseZip(zipBuf)
    const relativePaths: string[] = []
    for (const entry of entries) {
      const rel = relPathFromZipName(entry.name.replace(/\\/g, '/'))
      if (!rel) {
        continue
      }
      const dest = join(stagingDir, rel)
      if (!isInside(stagingDir, dest)) {
        throw new Error(`恢复路径不安全：${rel}`)
      }
      await mkdir(dirname(dest), { recursive: true })
      await writeFile(dest, entry.data)
      relativePaths.push(rel)
    }

    await moveManagedAside(userDataRoot, outgoingDir)
    await placeStaging(userDataRoot, stagingDir, relativePaths)
    if (options.injectFailure === 'after-place') {
      throw new Error('injected restore failure')
    }

    for (const file of manifest.files) {
      const restored = join(userDataRoot, file.path)
      if (!(await pathExists(restored))) {
        throw new Error(`恢复后缺少文件：${file.path}`)
      }
      const digest = await sha256File(restored)
      if (digest !== file.sha256) {
        throw new Error(`恢复后校验失败：${file.path}`)
      }
    }

    await removeIfExists(outgoingDir)
    await removeIfExists(stagingDir)
    return { safetyBackupPath, restoredCount: manifest.files.length }
  } catch (error) {
    try {
      await restoreOutgoing(userDataRoot, outgoingDir)
    } catch {
      // keep original error
    }
    await removeIfExists(stagingDir)
    throw error
  }
}
