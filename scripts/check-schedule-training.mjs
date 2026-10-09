import { build } from 'esbuild'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const directory = await mkdtemp(join(tmpdir(), 'gdpe-schedule-training-'))
try {
  const outfile = join(directory, 'check.cjs')
  await build({
    entryPoints: ['scripts/schedule-training-regression.ts'], outfile, bundle: true, platform: 'node', format: 'cjs',
    alias: { '@shared': resolve('src/shared') },
    plugins: [{ name: 'isolated-electron', setup(builder) {
      builder.onResolve({ filter: /^electron$/ }, () => ({ path: 'electron', namespace: 'mock' }))
      builder.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({ contents: `
        export const app = { getPath: () => { if (!process.env.GDPE_TEST_ROOT) throw new Error('test root missing'); return process.env.GDPE_TEST_ROOT } };
        export const ipcMain = { handle: (name, fn) => { globalThis.__handlers ??= new Map(); globalThis.__handlers.set(name, fn) } };
        export const dialog = {};
      ` }))
    } }]
  })
  const result = spawnSync(process.execPath, [outfile], {
    stdio: 'inherit', env: { ...process.env, GDPE_TEST_ROOT: directory }
  })
  process.exitCode = result.status ?? 1

} finally {
  await rm(directory, { recursive: true, force: true })
}
