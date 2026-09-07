import { BACKUP_FORMAT_VERSION, type BackupManifest } from './types'

export function parseBackupManifest(input: unknown): BackupManifest {
  if (input === null || typeof input !== 'object') {
    throw new Error('备份清单格式不正确')
  }
  const record = input as Record<string, unknown>
  if (record.backupFormatVersion !== BACKUP_FORMAT_VERSION) {
    throw new Error(
      `不支持的备份格式版本（${String(record.backupFormatVersion)}）。当前软件只支持 ${BACKUP_FORMAT_VERSION}。`
    )
  }
  if (typeof record.appVersion !== 'string' || record.appVersion.trim() === '') {
    throw new Error('备份清单缺少应用版本')
  }
  if (typeof record.createdAt !== 'string' || record.createdAt.trim() === '') {
    throw new Error('备份清单缺少创建时间')
  }
  if (!Array.isArray(record.files)) {
    throw new Error('备份清单缺少文件列表')
  }

  const files = record.files.map((entry, index) => {
    if (entry === null || typeof entry !== 'object') {
      throw new Error(`备份清单第 ${index + 1} 个文件条目无效`)
    }
    const item = entry as Record<string, unknown>
    if (typeof item.path !== 'string' || item.path.trim() === '' || item.path.includes('..')) {
      throw new Error(`备份清单第 ${index + 1} 个路径无效`)
    }
    if (typeof item.size !== 'number' || !Number.isInteger(item.size) || item.size < 0) {
      throw new Error(`备份清单第 ${index + 1} 个文件大小无效`)
    }
    if (typeof item.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(item.sha256)) {
      throw new Error(`备份清单第 ${index + 1} 个校验和不正确`)
    }
    return {
      path: item.path.replace(/\\/g, '/'),
      size: item.size,
      sha256: item.sha256
    }
  })

  const seen = new Set<string>()
  for (const file of files) {
    if (seen.has(file.path)) {
      throw new Error(`备份清单存在重复文件：${file.path}`)
    }
    seen.add(file.path)
  }

  return {
    backupFormatVersion: BACKUP_FORMAT_VERSION,
    appVersion: record.appVersion.trim(),
    createdAt: record.createdAt.trim(),
    files
  }
}
