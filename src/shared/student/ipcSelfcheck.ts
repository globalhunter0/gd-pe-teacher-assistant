import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

function collectFiles(dir: string, suffix: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectFiles(full, suffix))
    } else if (entry.name.endsWith(suffix)) {
      files.push(full)
    }
  }
  return files
}

function uniqueSorted(values: Iterable<string>): string[] {
  return [...new Set(values)].sort()
}

export function runStudentImportIpcSelfCheck(): void {
  const root = process.cwd()
  const preloadSource = readFileSync(join(root, 'src/preload/index.ts'), 'utf8')
  const preloadTypes = readFileSync(join(root, 'src/preload/index.d.ts'), 'utf8')
  const mainIndex = readFileSync(join(root, 'src/main/index.ts'), 'utf8')
  const mainSource = collectFiles(join(root, 'src/main'), '.ts')
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n')
  const rendererSource = collectFiles(join(root, 'src/renderer/src'), '.ts')
    .concat(collectFiles(join(root, 'src/renderer/src'), '.tsx'))
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n')

  const preloadChannels = uniqueSorted(
    [...preloadSource.matchAll(/ipcRenderer\.invoke\(\s*'([^']+)'/g)].map((item) => item[1])
  )
  const mainChannels = uniqueSorted(
    // Collection saves now register through the conflict-checking IPC adapter.
    // Its runtime behavior is covered by classroom-regression (including stale saves).
    [...mainSource.matchAll(/(?:ipcMain\.handle|handleCollectionSave)\(\s*'([^']+)'/g)].map((item) => item[1])
  )
  const collectionAdapter = readFileSync(join(root, 'src/main/collectionIpc.ts'), 'utf8')
  assert(/ipcMain\.handle\(channel,/.test(collectionAdapter), '集合保存适配器必须实际注册 IPC handler')
  const studentPreloadChannels = preloadChannels.filter((channel) => channel.startsWith('students:'))
  const studentMainChannels = mainChannels.filter((channel) => channel.startsWith('students:'))

  const requiredImportChannels = [
    'students:importPick',
    'students:importAnalyze',
    'students:importHeaders',
    'students:importPreview',
    'students:importCommit',
    'students:importCancel'
  ]

  assert(/registerStudentIpc\(\)/.test(mainIndex), 'main/index.ts 必须调用 registerStudentIpc()')
  assert(mainSource.includes('pickStudentExcel'), 'studentIpc 必须调用 pickStudentExcel')

  for (const channel of requiredImportChannels) {
    assert(studentPreloadChannels.includes(channel), `preload 缺少 invoke ${channel}`)
    assert(studentMainChannels.includes(channel), `main 未注册 handle ${channel}`)
  }

  for (const channel of studentPreloadChannels) {
    assert(studentMainChannels.includes(channel), `preload 调用了 ${channel}，但 main 没有 ipcMain.handle`)
  }

  const studentsBlockMatch = preloadSource.match(/students:\s*\{([\s\S]*?)\n  \},/)
  assert(studentsBlockMatch !== null, 'preload 必须暴露 students API')
  const studentsBlock = studentsBlockMatch?.[1] ?? ''
  const preloadApiMethods = uniqueSorted([...studentsBlock.matchAll(/^\s+(\w+)\s*:/gm)].map((item) => item[1]))
  assert(preloadApiMethods.length > 0, 'preload students API 不能为空')
  const rendererStudentMethods = uniqueSorted(
    [...rendererSource.matchAll(/window\.electronAPI\.students\.(\w+)/g)].map((item) => item[1])
  )

  for (const method of rendererStudentMethods) {
    assert(preloadApiMethods.includes(method), `renderer 调用 students.${method}，但 preload 未暴露`)
  }

  for (const method of ['importPick', 'importAnalyze', 'importHeaders', 'importPreview', 'importCommit', 'importCancel']) {
    assert(preloadApiMethods.includes(method), `preload students 缺少 ${method}`)
    assert(preloadTypes.includes(`${method}:`), `preload 类型声明缺少 ${method}`)
  }
}

export function runStudentImportIpcSelfCheckOrThrow(): string {
  runStudentImportIpcSelfCheck()
  return 'student import IPC self-check passed'
}
