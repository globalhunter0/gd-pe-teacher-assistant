import { mkdir, readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { BUSINESS_JSON_FILES } from './businessFiles'
import { replaceFileAtomic } from './atomicFile'
import { withExclusiveDataAccess } from './writeGate'

/** Marker is classification only. Business files are lazily created by guarded loaders. */
export async function initializeUserData(root: string): Promise<'new' | 'existing' | 'returning'> {
  return withExclusiveDataAccess(async () => {
    await mkdir(root, { recursive: true })
    const marker = join(root, '.gdpe-initialized.json')
    try {
      await readFile(marker)
      return 'returning'
    } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
    const names = await readdir(root)
    const existing = names.some(n => BUSINESS_JSON_FILES.includes(n as typeof BUSINESS_JSON_FILES[number]) ||
      ['resources', 'safety-backups', 'corrupt-quarantine', '.data-transactions'].includes(n) || n.startsWith('.restore-'))
    await mkdir(join(root, 'resources', 'files'), { recursive: true })
    await replaceFileAtomic(marker, JSON.stringify({ version: 1, kind: existing ? 'existing' : 'new', initializedAt: new Date().toISOString() }))
    return existing ? 'existing' : 'new'
  })
}
