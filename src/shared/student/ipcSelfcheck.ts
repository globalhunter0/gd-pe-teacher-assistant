import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { IPC_CHANNELS } from '../appApi'

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
  const apiTypes = readFileSync(join(root, 'src/shared/appApi/types.ts'), 'utf8')
  const mainIndex = readFileSync(join(root, 'src/main/index.ts'), 'utf8')
  const mainSource = collectFiles(join(root, 'src/main'), '.ts')
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n')
  const rendererSource = collectFiles(join(root, 'src/renderer/src'), '.ts')
    .concat(collectFiles(join(root, 'src/renderer/src'), '.tsx'))
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n')

  const collectionAdapter = readFileSync(join(root, 'src/main/collectionIpc.ts'), 'utf8')
  assert(/ipcMain\.handle\(channel,/.test(collectionAdapter), '集合保存适配器必须实际注册 IPC handler')
  const studentChannels = Object.values(IPC_CHANNELS.students)

  assert(/registerStudentIpc\(\)/.test(mainIndex), 'main/index.ts 必须调用 registerStudentIpc()')
  assert(mainSource.includes('pickStudentExcel'), 'studentIpc 必须调用 pickStudentExcel')
  assert(preloadSource.includes('createAppApi'), 'preload 必须通过 createAppApi 暴露 students')

  for (const channel of studentChannels) {
    const method = channel.slice('students:'.length)
    assert(mainSource.includes(`IPC_CHANNELS.students.${method}`), `main 未用常量注册 ${channel}`)
    assert(new RegExp(`${method}:`).test(apiTypes), `AppApi 缺少 students.${method}`)
  }

  const rendererStudentMethods = uniqueSorted(
    [...rendererSource.matchAll(/(?:getAppApi\(\)|api)\.students\.(\w+)/g)].map((item) => item[1])
  )
  const apiStudentMethods = Object.keys(IPC_CHANNELS.students)
  for (const method of rendererStudentMethods) {
    assert(apiStudentMethods.includes(method), `renderer 调用 students.${method}，但 AppApi 未暴露`)
  }

  for (const method of ['importPick', 'importAnalyze', 'importHeaders', 'importPreview', 'importCommit', 'importCancel']) {
    assert(apiStudentMethods.includes(method), `AppApi students 缺少 ${method}`)
  }
}

export function runStudentImportIpcSelfCheckOrThrow(): string {
  runStudentImportIpcSelfCheck()
  return 'student import IPC self-check passed'
}
