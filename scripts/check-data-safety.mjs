import { build } from 'esbuild'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const directory = await mkdtemp(join(tmpdir(), 'gdpe-check-runner-'))
try {
  const outfile = join(directory, 'check.mjs')
  await build({ entryPoints: ['src/shared/persistence/selfcheck.ts'], outfile, bundle: true, platform: 'node', format: 'esm' })
  const result = spawnSync(process.execPath, [outfile], { stdio: 'inherit' })
  process.exitCode = result.status ?? 1
} finally {
  await rm(directory, { recursive: true, force: true })
}
