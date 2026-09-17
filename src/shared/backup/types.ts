export const BACKUP_FORMAT_VERSION = 1

export const BACKUP_FILE_EXTENSION = 'gdpebak'

export const APP_RELEASE_VERSION = '0.13.1'

export const BUSINESS_JSON_FILES = [
  'schedule.json',
  'classes.json',
  'students.json',
  'pe-sessions.json',
  'test-items.json',
  'pe-tests.json',
  'teaching-plans.json',
  'resources.json',
  'training-teams.json',
  'training-members.json',
  'training-plans.json',
  'training-sessions.json',
  'training-items.json',
  'training-results.json'
] as const

export const RESOURCE_FILES_DIR = 'resources/files'

export const SAFETY_BACKUPS_DIR = 'safety-backups'

export const ARCHIVE_FILES_PREFIX = 'files/'

export const ARCHIVE_MANIFEST_NAME = 'manifest.json'

export interface BackupFileEntry {
  path: string
  size: number
  sha256: string
}

export interface BackupManifest {
  backupFormatVersion: number
  appVersion: string
  createdAt: string
  files: BackupFileEntry[]
}

export interface BackupResult {
  archivePath: string
  fileCount: number
  manifest: BackupManifest
}

export interface RestoreResult {
  safetyBackupPath: string
  restoredCount: number
  keptPaths: string[]
}
