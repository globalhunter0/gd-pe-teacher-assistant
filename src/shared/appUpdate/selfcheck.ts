import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ALL_IPC_CHANNELS, IPC_CHANNELS, createAppApi } from '../appApi'
import { APP_VERSION } from '../appVersion'
import {
  APP_UPDATE_DISABLE_ENV,
  APP_UPDATE_INSTALL_KINDS,
  APP_UPDATE_ISOLATED_TEST_ENV,
  APP_UPDATE_NSIS_UNINSTALLER,
  APP_UPDATE_STARTUP_CHECK_DELAY_MS,
  APP_UPDATE_STATES,
  APP_UPDATE_STATUS_EVENT,
  appUpdateInstallActionLabel,
  canEnableDesktopAutoUpdate,
  formatAppUpdateStatusMessage,
  formatAppUpdateVersion,
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
  assert(formatAppUpdateVersion('1.0.1') === 'v1.0.1', '版本展示必须带 v')
  assert(formatAppUpdateVersion('v1.0.1') === 'v1.0.1', '已有 v 前缀不得重复')
  assert(formatAppUpdateStatusMessage(unsupported) === '当前环境不支持应用内更新。', '未支持环境必须给设置页说明')
  assert(formatAppUpdateStatusMessage(parsed) === '发现新版本 v1.0.1。', '发现新版本文案必须给出版本号')
  assert(formatAppUpdateStatusMessage(ready) === '更新已下载完成，重启后安装。', '桌面下载完成必须提示重启安装')
  assert(
    formatAppUpdateStatusMessage({ ...ready, installKind: 'store' }) === '新版本已准备好，请前往应用商店安装。',
    '移动端商店更新文案必须与桌面重启解耦'
  )
  assert(appUpdateInstallActionLabel('restart') === '重启安装', '桌面安装按钮必须是重启安装')
  assert(appUpdateInstallActionLabel('store') === '前往应用商店', '移动端安装按钮必须指向商店')

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
  assert(mainService.includes('unsupportedAppUpdateStatus'), '未启用更新器时服务必须回退 unsupported')
  assert(/import\(\s*['"]electron-updater['"]\s*\)/.test(mainService), 'electron-updater 必须按需动态导入')
  assert(!ELECTRON_UPDATER_IMPORT.test(mainService), '运行时代码不得静态导入 electron-updater')
  assert(!ELECTRON_UPDATER_IMPORT.test(mainIpc), 'IPC 适配层不得直接导入 electron-updater')
  assert(mainService.includes('autoDownload = false'), '必须关闭自动下载')
  assert(mainService.includes('autoInstallOnAppQuit = false'), '退出时不得自动安装')
  assert(mainService.includes('allowPrerelease = false'), '教师版不得自动升到预发布')
  assert(mainService.includes('canEnableDesktopAutoUpdate'), '启用判定必须复用纯函数')
  assert(mainService.includes('APP_UPDATE_ISOLATED_TEST_ENV'), '隔离烟测目录必须禁用更新')
  assert(mainService.includes('APP_UPDATE_NSIS_UNINSTALLER'), '解包目录必须因缺少 NSIS 卸载器而禁用')
  assert(mainIpc.includes('APP_UPDATE_STATUS_EVENT'), '状态变化必须推送到渲染进程')
  assert(mainIndex.includes('ready-to-show'), '启动检查必须挂在窗口显示之后')
  assert(mainIndex.includes('scheduleStartupUpdateCheck(APP_UPDATE_STARTUP_CHECK_DELAY_MS)'), '启动检查必须延迟且可取消')
  assert(!/scheduleStartupUpdateCheck\(/.test(mainIndex.split('createMainWindow')[0] ?? ''), '不得在建窗前启动检查')

  assert(APP_UPDATE_STARTUP_CHECK_DELAY_MS === 8000, '启动后延迟必须是 8 秒')
  assert(APP_UPDATE_DISABLE_ENV === 'GDPE_DISABLE_AUTO_UPDATE', '禁用开关环境变量必须稳定')
  assert(APP_UPDATE_ISOLATED_TEST_ENV === 'GDPE_RC_TEST_ROOT', '隔离测试环境变量必须复用现有烟测根')
  assert(APP_UPDATE_NSIS_UNINSTALLER === 'Uninstall gd-pe-teacher-assistant.exe', 'NSIS 卸载器文件名必须与 productName 一致')

  const enabledBase = {
    isPackaged: true,
    rendererDevUrl: '',
    isolatedTestRoot: '',
    disableFlag: '',
    hasUpdateYml: true,
    hasNsisUninstaller: true
  }
  assert(canEnableDesktopAutoUpdate(enabledBase), '正式 NSIS 安装且存在 app-update.yml 时应启用')
  assert(!canEnableDesktopAutoUpdate({ ...enabledBase, isPackaged: false }), '未打包进程不得检查更新')
  assert(!canEnableDesktopAutoUpdate({ ...enabledBase, rendererDevUrl: 'http://localhost:5173' }), 'electron-vite dev 不得检查更新')
  assert(!canEnableDesktopAutoUpdate({ ...enabledBase, isolatedTestRoot: 'C:/tmp/gdpe-rc' }), '隔离烟测不得访问 GitHub')
  assert(!canEnableDesktopAutoUpdate({ ...enabledBase, disableFlag: '1' }), '显式禁用开关必须生效')
  assert(!canEnableDesktopAutoUpdate({ ...enabledBase, hasUpdateYml: false }), '缺少 app-update.yml 不得启用')
  assert(!canEnableDesktopAutoUpdate({ ...enabledBase, hasNsisUninstaller: false }), 'win-unpacked 解包目录不得启用')

  const pkg = JSON.parse(read('package.json')) as {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    scripts?: Record<string, string>
  }
  assert(typeof pkg.dependencies?.['electron-updater'] === 'string', 'electron-updater 必须是生产依赖')
  assert(!pkg.devDependencies?.['electron-updater'], 'electron-updater 不得只放在 devDependencies')
  assert(pkg.scripts?.['dist:win']?.includes('package-windows.mjs nsis'), 'dist:win 必须继续走本地 NSIS 打包')
  assert(!pkg.scripts?.['dist:win']?.includes('publish'), '日常 dist:win 不得上传 Release')
  assert(pkg.scripts?.['dist:win:publish']?.includes('nsis publish'), '正式发布必须使用独立 publish 脚本')

  const builder = read('electron-builder.yml')
  assert(/provider:\s*github/.test(builder), '更新源必须是 GitHub Releases')
  assert(builder.includes('owner: globalhunter0'), 'GitHub owner 必须与仓库一致')
  assert(builder.includes('repo: gd-pe-teacher-assistant'), 'GitHub repo 必须与仓库一致')
  assert(builder.includes('latest.yml'), '打包说明必须提到 latest.yml')

  const packScript = read('scripts/package-windows.mjs')
  assert(packScript.includes("publish: shouldPublish ? 'always' : 'never'"), '未传 publish 时必须 never')
  assert(packScript.includes('GH_TOKEN'), '上传 Release 必须要求 GH_TOKEN')

  const smoke = read('scripts/packaged-smoke.mjs')
  assert(smoke.includes("running.api('appUpdate.getStatus')"), '打包烟测必须读取更新状态')
  assert(smoke.includes('updateStatus.supported, false'), '解包烟测必须断言不启用更新器')

  const mainFiles = collectFiles(join(process.cwd(), 'src/main'), ['.ts'])
  for (const file of mainFiles) {
    if (file.endsWith('appUpdateService.ts')) {
      continue
    }
    const text = readFileSync(file, 'utf8')
    assert(!ELECTRON_UPDATER_IMPORT.test(text), `electron-updater 不得出现在 ${file}`)
  }

  assertNoElectronUpdater('src/shared/appUpdate', 'shared/appUpdate')
  assertNoElectronUpdater('src/shared/appApi', 'shared/appApi')
  assertNoElectronUpdater('src/renderer/src', 'renderer')

  const rendererFiles = collectFiles(join(process.cwd(), 'src/renderer/src'), ['.ts', '.tsx'])
  const allowedWindowEvents = new Set([
    join(process.cwd(), 'src/renderer/src/platform/appApi.ts').toLowerCase()
  ])
  for (const file of rendererFiles) {
    const text = readFileSync(file, 'utf8')
    assert(!/\bautoUpdater\b/.test(text), `渲染层不得出现 autoUpdater：${file}`)
    if (text.includes('window.appUpdateEvents')) {
      assert(allowedWindowEvents.has(file.toLowerCase()), `${file} 不得直接读 window.appUpdateEvents`)
    }
  }

  const dialog = read('src/renderer/src/components/UpdateDialog.tsx')
  const host = read('src/renderer/src/components/UpdateHost.tsx')
  const port = read('src/renderer/src/platform/appUpdatePort.ts')
  const platform = read('src/renderer/src/platform/appApi.ts')
  const settings = read('src/renderer/src/pages/SettingsPage.tsx')
  const app = read('src/renderer/src/App.tsx')
  const preload = read('src/preload/index.ts')
  const preloadTypes = read('src/preload/index.d.ts')
  assert(dialog.includes('appUpdateInstallActionLabel'), '弹窗必须按 installKind 显示安装按钮')
  assert(!dialog.includes('getAppApi'), 'UpdateDialog 不得直接拿桌面 API')
  assert(!dialog.includes('electron-updater'), 'UpdateDialog 不得依赖 electron-updater')
  assert(!dialog.includes("from 'electron'"), 'UpdateDialog 不得依赖 Electron')
  assert(host.includes('getAppUpdatePort'), 'UpdateHost 必须走平台 Port')
  assert(host.includes('shouldPromptAppUpdate'), '自动弹窗必须复用共享判定')
  assert(port.includes('getAppApi'), 'Port 必须把 AppApi 包成平台无关接口')
  assert(platform.includes('subscribeAppUpdateStatus'), '桌面订阅必须收口在 platform/appApi')
  assert(settings.includes('getAppUpdatePort'), '设置页检查更新必须走 Port')
  assert(settings.includes('检查更新'), '设置页必须提供手动检查')
  assert(settings.includes('APP_VERSION_LABEL'), '设置页版本仍须使用统一标签')
  assert(app.includes('<UpdateHost'), '应用壳必须挂上更新提示')
  assert(preload.includes('APP_UPDATE_STATUS_EVENT'), 'preload 必须用共享事件名订阅状态')
  assert(preload.includes('appUpdateEvents'), 'preload 必须单独暴露更新订阅')
  assert(preloadTypes.includes('appUpdateEvents'), 'Window 类型必须包含更新订阅')
}

export function runAppUpdateSelfCheckOrThrow(): string {
  runAppUpdateSelfCheck()
  return 'app update contract self-check passed'
}
