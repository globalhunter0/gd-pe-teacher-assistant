import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ALL_IPC_CHANNELS, IPC_CHANNELS, createAppApi } from '../appApi'
import { APP_VERSION } from '../appVersion'
import {
  APP_UPDATE_INSTALL_KINDS,
  APP_UPDATE_STATES,
  APP_UPDATE_STATUS_EVENT,
  parseAppUpdateStatus,
  shouldPromptAppUpdate,
  unsupportedAppUpdateStatus
} from './index'

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

function read(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf8')
}

const ELECTRON_UPDATER_IMPORT = /from\s+['"]electron-updater['"]|require\(\s*['"]electron-updater['"]\s*\)/

function assertNoElectronUpdater(dir: string, label: string): void {
  for (const file of collectFiles(join(process.cwd(), dir), ['.ts', '.tsx'])) {
    if (file.endsWith('selfcheck.ts')) {
      continue
    }
    const text = readFileSync(file, 'utf8')
    assert(!ELECTRON_UPDATER_IMPORT.test(text), `${label} 不得导入 electron-updater：${file}`)
  }
}

export function runAppUpdateSelfCheck(): void {
  const unsupported = unsupportedAppUpdateStatus('1.2.3')
  assert(unsupported.supported === false, '未支持状态必须 supported=false')
  assert(unsupported.state === 'idle', '未支持状态必须是 idle')
  assert(unsupported.installKind === 'unsupported', '未支持状态必须是 unsupported')
  assert(unsupported.currentVersion === '1.2.3', '未支持状态必须保留当前版本')
  assert(!shouldPromptAppUpdate(unsupported), '未支持状态不得自动弹窗')

  const parsedBad = parseAppUpdateStatus(undefined)
  assert(parsedBad.supported === false, '非法载荷必须回退到未支持')
  assert(parsedBad.currentVersion === APP_VERSION, '非法载荷必须回退到 APP_VERSION')
  assert(parseAppUpdateStatus(null, '9.9.9').currentVersion === '9.9.9', '非法载荷应使用 fallback 版本')
  assert(parseAppUpdateStatus('x').installKind === 'unsupported', '非对象载荷必须是 unsupported')

  const parsed = parseAppUpdateStatus({
    supported: true,
    state: 'available',
    currentVersion: ' 1.0.0 ',
    availableVersion: ' 1.0.1 ',
    releaseNotes: ' 修复更新 ',
    progressPercent: 140,
    errorMessage: '  ',
    installKind: 'restart'
  })
  assert(parsed.supported === true, '合法 supported 必须保留')
  assert(parsed.state === 'available', '合法 state 必须保留')
  assert(parsed.currentVersion === '1.0.0', 'currentVersion 必须去空白')
  assert(parsed.availableVersion === '1.0.1', 'availableVersion 必须去空白')
  assert(parsed.releaseNotes === '修复更新', 'releaseNotes 必须去空白')
  assert(parsed.progressPercent === 100, '进度必须限制在 0-100')
  assert(parsed.errorMessage === undefined, '空白错误信息必须丢掉')
  assert(parsed.installKind === 'restart', '合法 installKind 必须保留')
  assert(shouldPromptAppUpdate(parsed), '发现新版本应提示用户')

  const downloading = parseAppUpdateStatus({
    supported: true,
    state: 'downloading',
    currentVersion: '1.0.0',
    progressPercent: -8,
    installKind: 'restart'
  })
  assert(downloading.progressPercent === 0, '负进度必须收成 0')
  assert(shouldPromptAppUpdate(downloading), '下载中应保持提示')

  const ready = parseAppUpdateStatus({
    supported: true,
    state: 'readyToInstall',
    currentVersion: '1.0.0',
    availableVersion: '1.0.1',
    installKind: 'restart'
  })
  assert(shouldPromptAppUpdate(ready), '下载完成应提示重启安装')

  const storeKind = parseAppUpdateStatus({
    supported: true,
    state: 'available',
    currentVersion: '1.0.0',
    installKind: 'store'
  })
  assert(storeKind.installKind === 'store', '移动端商店更新必须保留 store')
  assert(shouldPromptAppUpdate(storeKind), '商店更新仍可由 UI 提示')

  const missingKind = parseAppUpdateStatus({
    supported: true,
    state: 'idle',
    currentVersion: '1.0.0'
  })
  assert(missingKind.installKind === 'restart', '桌面支持更新时默认 restart')
  assert(!shouldPromptAppUpdate(missingKind), 'idle 不得自动弹窗')
  assert(!shouldPromptAppUpdate(parseAppUpdateStatus({
    supported: true,
    state: 'not-available',
    currentVersion: '1.0.0',
    installKind: 'restart'
  })), '已是最新不得自动弹窗')
  assert(!shouldPromptAppUpdate(parseAppUpdateStatus({
    supported: true,
    state: 'error',
    currentVersion: '1.0.0',
    installKind: 'restart',
    errorMessage: '网络失败'
  })), '检查失败不得自动弹窗')

  assert(APP_UPDATE_STATES.includes('readyToInstall'), '状态机必须包含 readyToInstall')
  assert(APP_UPDATE_INSTALL_KINDS.includes('unsupported'), '安装方式必须包含 unsupported')
  assert(APP_UPDATE_STATUS_EVENT === 'appUpdate:statusChanged', '状态推送事件名必须稳定')
  assert(!(ALL_IPC_CHANNELS as readonly string[]).includes(APP_UPDATE_STATUS_EVENT), '推送事件不得进入 invoke 通道表')

  assert(IPC_CHANNELS.appUpdate.getStatus === 'appUpdate:getStatus', 'getStatus 通道名必须稳定')
  assert(IPC_CHANNELS.appUpdate.checkForUpdates === 'appUpdate:checkForUpdates', 'checkForUpdates 通道名必须稳定')
  assert(IPC_CHANNELS.appUpdate.startDownload === 'appUpdate:startDownload', 'startDownload 通道名必须稳定')
  assert(IPC_CHANNELS.appUpdate.quitAndInstall === 'appUpdate:quitAndInstall', 'quitAndInstall 通道名必须稳定')

  const invoked: string[] = []
  const client = createAppApi((channel) => {
    invoked.push(channel)
    return Promise.resolve(undefined as never)
  })
  invoked.length = 0
  void client.appUpdate.getStatus()
  void client.appUpdate.checkForUpdates()
  void client.appUpdate.startDownload()
  void client.appUpdate.quitAndInstall()
  assert(
    invoked.join(',') === [
      IPC_CHANNELS.appUpdate.getStatus,
      IPC_CHANNELS.appUpdate.checkForUpdates,
      IPC_CHANNELS.appUpdate.startDownload,
      IPC_CHANNELS.appUpdate.quitAndInstall
    ].join(','),
    'createAppApi.appUpdate 必须按契约调用四个通道'
  )

  const mainIpc = read('src/main/appUpdateIpc.ts')
  const mainService = read('src/main/appUpdateService.ts')
  const mainIndex = read('src/main/index.ts')
  assert(mainIndex.includes('registerAppUpdateIpc()'), 'main 启动必须注册 appUpdate IPC')
  assert(mainIpc.includes('IPC_CHANNELS.appUpdate.getStatus'), 'main 必须注册 getStatus')
  assert(mainIpc.includes('IPC_CHANNELS.appUpdate.checkForUpdates'), 'main 必须注册 checkForUpdates')
  assert(mainIpc.includes('IPC_CHANNELS.appUpdate.startDownload'), 'main 必须注册 startDownload')
  assert(mainIpc.includes('IPC_CHANNELS.appUpdate.quitAndInstall'), 'main 必须注册 quitAndInstall')
  assert(mainService.includes('unsupportedAppUpdateStatus'), '未接入更新器时服务必须回退 unsupported')
  assert(!mainService.includes('from \'electron-updater\''), 'P0 契约阶段主进程服务不得导入 electron-updater')
  assert(!mainIpc.includes('from \'electron-updater\''), 'IPC 适配层不得直接导入 electron-updater')

  assertNoElectronUpdater('src/shared/appUpdate', 'shared/appUpdate')
  assertNoElectronUpdater('src/shared/appApi', 'shared/appApi')
  assertNoElectronUpdater('src/renderer/src', 'renderer')

  const rendererFiles = collectFiles(join(process.cwd(), 'src/renderer/src'), ['.ts', '.tsx'])
  for (const file of rendererFiles) {
    const text = readFileSync(file, 'utf8')
    assert(!/\bautoUpdater\b/.test(text), `渲染层不得出现 autoUpdater：${file}`)
  }
}

export function runAppUpdateSelfCheckOrThrow(): string {
  runAppUpdateSelfCheck()
  return 'app update contract self-check passed'
}
