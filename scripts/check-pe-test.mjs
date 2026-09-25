import { build } from 'esbuild'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const directory = await mkdtemp(join(tmpdir(), 'gdpe-pe-regression-'))
try {
  const outfile = join(directory, 'check.cjs')
  await build({ entryPoints: ['scripts/pe-test-regression.ts'], outfile, bundle: true, platform: 'node', format: 'cjs', alias: { '@shared': resolve('src/shared') } })
  const result = spawnSync(process.execPath, [outfile], { stdio: 'inherit' })
  process.exitCode = result.status ?? 1
  if (process.exitCode === 0) {
    const uiOut = join(directory, 'ui.cjs')
    const harness = resolve('scripts/ui-hook-harness.ts')
    await build({
      entryPoints: ['scripts/pe-test-ui-regression.ts'], outfile: uiOut, bundle: true, platform: 'node', format: 'cjs',
      alias: { '@shared': resolve('src/shared') }, jsx: 'automatic',
      plugins: [{ name: 'component-state-adapter', setup(builder) {
        builder.onResolve({ filter: /^react(?:\/jsx-runtime)?$/ }, () => ({ path: harness }))
        builder.onResolve({ filter: /\/context\/.*Context$/ }, args => ({ path: args.path.split('/').pop().replace('Context', ''), namespace: 'context' }))
        builder.onLoad({ filter: /.*/, namespace: 'context' }, args => {
          const hook = { Class: 'useClasses', Student: 'useStudents', Schedule: 'useSchedule', TeachingPlan: 'useTeachingPlans', PeSession: 'usePeSessions', PeTest: 'usePeTests', TestItem: 'useTestItems' }[args.path]
          return { resolveDir: process.cwd(), contents: `import {contexts} from ${JSON.stringify(harness)}; export const ${hook}=()=>contexts.${args.path};` }
        })
        builder.onResolve({ filter: /(?:components\/|^\.\/)(?:PageLayout|TestAnalyticsPanel|ExamTemplateActions|StatusBadge|ds\/DataTable|workspace\/TechEmptyState|workspace\/OverviewBar)$/ }, args => ({ path: args.path, namespace: 'view' }))
        builder.onLoad({ filter: /.*/, namespace: 'view' }, () => ({ contents: 'export default function View(){}; export function PageHeader(){};' }))
      } }]
    })
    const uiResult = spawnSync(process.execPath, [uiOut], { stdio: 'inherit' })
    process.exitCode = uiResult.status ?? 1
  }
} finally {
  await rm(directory, { recursive: true, force: true })
}
