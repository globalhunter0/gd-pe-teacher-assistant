import { build } from 'esbuild'
import { mkdtemp, rm, readdir, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'

const directory = await mkdtemp(join(tmpdir(), 'gdpe-pe-selfchecks-'))
let count = 0
let failures = 0
try {
  for (const folder of ['', ...(await readdir(resolve('src/shared'), { withFileTypes: true })).filter(e => e.isDirectory()).map(e => e.name)]) {
    for (const file of (await readdir(resolve('src/shared', folder))).filter(name => /selfcheck\.ts$/i.test(name))) {
      const source = resolve('src/shared', folder, file)
      const body = await readFile(source, 'utf8')
      const name = body.match(/export (?:async )?function (run\w+SelfCheckOrThrow)/)?.[1]
      if (!name) continue
      const outfile = join(directory, 'check.cjs')
      await build({ stdin: { contents: `import { ${name} } from ${JSON.stringify(source)}; Promise.resolve().then(() => ${name}()).then(console.log).catch(error => { console.error(error); process.exitCode = 1 })`, resolveDir: process.cwd() }, outfile, bundle: true, platform: 'node', format: 'cjs', define: { 'import.meta.url': JSON.stringify(pathToFileURL(source).href) } })
      const result = spawnSync(process.execPath, [outfile], { encoding: 'utf8' })
      count++
      if (result.status !== 0) { failures++; console.error(`FAIL ${folder}/${file}\n${result.stderr}${result.stdout}`) }
      else console.log(`PASS ${folder}/${file}`)
    }
  }
  console.log(`Self-check suites: ${count - failures}/${count} passed`)
  process.exitCode = failures ? 1 : 0
} finally {
  await rm(directory, { recursive: true, force: true })
}
