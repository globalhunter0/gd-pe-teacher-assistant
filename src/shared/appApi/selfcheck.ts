import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ALL_IPC_CHANNELS, IPC_CHANNELS, createAppApi, type IpcChannel } from './index'

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

function collectFiles(dir: string, suffixes: readonly string[]): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectFiles(full, suffixes))
    } else if (suffixes.some((suffix) => entry.name.endsWith(suffix))) {
      files.push(full)
    }
  }
  return files
}

function uniqueSorted(values: Iterable<string>): string[] {
  return [...new Set(values)].sort()
}

function read(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf8')
}

function mainRegisteredChannels(): IpcChannel[] {
  const mainSource = collectFiles(join(process.cwd(), 'src/main'), ['.ts'])
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n')
  const found = new Set<IpcChannel>()
  for (const match of mainSource.matchAll(/IPC_CHANNELS\.(\w+)\.(\w+)/g)) {
    const domain = match[1] as keyof typeof IPC_CHANNELS
    const method = match[2] as keyof (typeof IPC_CHANNELS)[typeof domain]
    const group = IPC_CHANNELS[domain]
    if (group && method in group) {
      found.add(group[method] as IpcChannel)
    }
  }
  for (const match of mainSource.matchAll(/['"]([a-zA-Z]+:[a-zA-Z]+)['"]/g)) {
    if (ALL_IPC_CHANNELS.includes(match[1] as IpcChannel)) {
      found.add(match[1] as IpcChannel)
    }
  }
  return uniqueSorted(found) as IpcChannel[]
}

export function runAppApiSelfCheck(): void {
  const invoked: string[] = []
  const client = createAppApi((channel) => {
    invoked.push(channel)
    return Promise.resolve(undefined as never)
  })
  invoked.length = 0
  for (const domain of Object.keys(client) as (keyof typeof client)[]) {
    const group = client[domain]
    for (const method of Object.keys(group) as (keyof typeof group)[]) {
      const fn = group[method]
      if (typeof fn === 'function') {
        void (fn as (...args: never[]) => Promise<unknown>)()
      }
    }
  }
  assert(uniqueSorted(invoked).join(',') === uniqueSorted(ALL_IPC_CHANNELS).join(','), 'createAppApi 必须覆盖全部通道且不能多调')
  assert(new Set(ALL_IPC_CHANNELS).size === ALL_IPC_CHANNELS.length, '通道名不能重复')

  const registered = mainRegisteredChannels()
  for (const channel of ALL_IPC_CHANNELS) {
    assert(registered.includes(channel), `main 未注册 ${channel}`)
  }
  for (const channel of registered) {
    assert(ALL_IPC_CHANNELS.includes(channel), `main 注册了未列入 AppApi 的通道 ${channel}`)
  }

  const preload = read('src/preload/index.ts')
  const preloadTypes = read('src/preload/index.d.ts')
  assert(preload.includes('createAppApi'), 'preload 必须用 createAppApi 实现桌面客户端')
  assert(!/ipcRenderer\.invoke\(\s*'[a-zA-Z]+:[a-zA-Z]+'/.test(preload), 'preload 不得再手写通道字符串')
  assert(preloadTypes.includes("from '../shared/appApi'"), 'index.d.ts 必须从 AppApi 派生')
  assert(/electronAPI:\s*AppApi/.test(preloadTypes), 'Window.electronAPI 必须声明为 AppApi')

  const rendererFiles = collectFiles(join(process.cwd(), 'src/renderer/src'), ['.ts', '.tsx'])
  const allowedWindowApi = new Set([
    join(process.cwd(), 'src/renderer/src/platform/appApi.ts').toLowerCase(),
    join(process.cwd(), 'src/renderer/src/vite-env.d.ts').toLowerCase()
  ])
  for (const file of rendererFiles) {
    const text = readFileSync(file, 'utf8')
    if (!text.includes('window.electronAPI')) {
      continue
    }
    assert(allowedWindowApi.has(file.toLowerCase()), `${file.replace(process.cwd() + '\\', '')} 不得直接读 window.electronAPI`)
  }

  const platform = read('src/renderer/src/platform/appApi.ts')
  assert(platform.includes('getAppApi'), '渲染层必须有 getAppApi 适配入口')
}

export function runAppApiSelfCheckOrThrow(): string {
  runAppApiSelfCheck()
  return 'app api contract self-check passed'
}
