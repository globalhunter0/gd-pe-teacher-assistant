import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { BUSINESS_JSON_FILES } from './businessFiles'
import { validateBusinessDocument } from './businessValidation'
import { UserDataCorruptError } from './jsonFile'
import type { DataIntegrityFileStatus } from '../dataIntegrity/types'

/** Reads exact on-disk bytes, never initializes, normalizes, quarantines or deletes. */
export async function inspectBusinessFiles(root: string): Promise<DataIntegrityFileStatus[]> {
  let backupCandidates: string[] = []
  try { backupCandidates = (await readdir(join(root, 'safety-backups'))).filter(n => n.endsWith('.gdpebak')) } catch { /* reported as unknown, never a promised recovery source */ }
  return Promise.all(BUSINESS_JSON_FILES.map(async fileName => {
    const status: DataIntegrityFileStatus = { fileName, exists: true, parseable: false, structureInvalid: false,
      quarantined: false, writeBlocked: false, recoverySource: backupCandidates.length ? '存在备份候选，需校验' : '未确认可恢复来源' }
    try {
      const raw = await readFile(join(root, fileName), 'utf8')
      const parsed: unknown = JSON.parse(raw)
      status.parseable = true
      validateBusinessDocument(fileName, parsed)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') { status.exists = false; return status }
      status.errorType = error instanceof SyntaxError ? 'invalid_json' : status.parseable ? 'invalid_structure' : 'read_error'
      status.structureInvalid = status.parseable
      status.parseError = `${status.errorType}: ${error instanceof Error ? error.message : String(error)}`
      status.writeBlocked = true
      new UserDataCorruptError(join(root, fileName), error)
    }
    return status
  }))
}
