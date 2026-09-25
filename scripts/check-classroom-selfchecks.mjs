import { build } from 'esbuild'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'

const checks = [
  ['peSession/selfcheck.ts', 'runPeSessionWorkbenchSelfCheckOrThrow'],
  ['peSession/v0270P02Selfcheck.ts', 'runV0270P02ParticipationSelfCheckOrThrow'],
  ['peSession/v0270P03Selfcheck.ts', 'runV0270P03SessionStatusSelfCheckOrThrow'],
  ['peTest/v0270P01Selfcheck.ts', 'runV0270P01ClassroomQuizSelfCheckOrThrow'],
  ['dataIntegrity/v0290P03Selfcheck.ts', 'runV0290P03StartupRecoverySelfCheckOrThrow'],
  ['teachingPlan/v0280P03Selfcheck.ts', 'runV0280P03ExecutionSelfCheckOrThrow']
]
const directory = await mkdtemp(join(tmpdir(), 'gdpe-classroom-selfchecks-'))
try {
  for (const [relativePath, name] of checks) {
    const source = resolve('src/shared', relativePath)
    const outfile = join(directory, 'check.cjs')
    await build({
      stdin: { contents: `import { ${name} } from ${JSON.stringify(source)}; Promise.resolve().then(() => ${name}()).then(console.log).catch(error => { console.error(error); process.exitCode = 1 })`, resolveDir: process.cwd() },
      outfile, bundle: true, platform: 'node', format: 'cjs',
      define: { 'import.meta.url': JSON.stringify(pathToFileURL(source).href) }
    })
    const result = spawnSync(process.execPath, [outfile], { stdio: 'inherit' })
    if (result.status !== 0) { process.exitCode = result.status ?? 1; break }
  }
} finally {
  await rm(directory, { recursive: true, force: true })
}
