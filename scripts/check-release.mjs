import { spawnSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'

if (!process.env.npm_execpath) throw new Error('Run with npm run check:release')
await mkdir('release', { recursive: true })
const results = []
for (const script of ['check:node', 'check:web', 'build', 'check:data-safety', 'check:classroom', 'check:pe-test', 'check:selfchecks', 'check:schedule-training', 'check:rc']) {
  const start = Date.now()
  const result = spawnSync(process.execPath, [process.env.npm_execpath, 'run', script], { encoding: 'utf8', timeout: 240000 })
  await writeFile(`release/${script.replaceAll(':', '-')}.log`, `${result.stdout ?? ''}${result.stderr ?? ''}`)
  results.push({ script, status: result.status, seconds: (Date.now() - start) / 1000 })
  console.log(`${result.status === 0 ? 'PASS' : 'FAIL'} ${script}`)
  if (result.status !== 0) { console.error(result.stdout, result.stderr, result.error ?? ''); process.exitCode = 1; break }
}
await writeFile('release/rc-regression-results.json', JSON.stringify(results, null, 2))
