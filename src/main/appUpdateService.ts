import { app } from 'electron'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { autoUpdater, type UpdateInfo } from 'electron-updater'
import { APP_VERSION } from '../shared/appVersion'
import {
  APP_UPDATE_DISABLE_ENV,
  APP_UPDATE_ISOLATED_TEST_ENV,
  APP_UPDATE_NSIS_UNINSTALLER,
  APP_UPDATE_STARTUP_CHECK_DELAY_MS,
  canEnableDesktopAutoUpdate,
  parseAppUpdateStatus,
  unsupportedAppUpdateStatus,
  type AppUpdateStatus
} from '../shared/appUpdate'

const listeners = new Set<(next: AppUpdateStatus) => void>()

let status: AppUpdateStatus = unsupportedAppUpdateStatus(APP_VERSION)
let configured = false
let checking = false
let downloading = false
let startupTimer: ReturnType<typeof setTimeout> | null = null
let startupCheckCanceled = false

function currentVersion(): string {
  try {
    return app.getVersion() || APP_VERSION
  } catch {
    return APP_VERSION
  }
}

function readEnablement(): boolean {
  return canEnableDesktopAutoUpdate({
    isPackaged: app.isPackaged,
    rendererDevUrl: process.env.ELECTRON_RENDERER_URL,
    isolatedTestRoot: process.env[APP_UPDATE_ISOLATED_TEST_ENV],
    disableFlag: process.env[APP_UPDATE_DISABLE_ENV],
    hasUpdateYml: existsSync(join(process.resourcesPath, 'app-update.yml')),
    hasNsisUninstaller: existsSync(join(dirname(app.getPath('exe')), APP_UPDATE_NSIS_UNINSTALLER))
  })
}

export function isAppUpdateRuntimeEnabled(): boolean {
  return readEnablement()
}

function emit(next: AppUpdateStatus): AppUpdateStatus {
  status = next
  for (const listener of listeners) {
    listener(status)
  }
  return status
}

function setStatus(partial: Partial<AppUpdateStatus>): AppUpdateStatus {
  const enabled = readEnablement()
  return emit(
    parseAppUpdateStatus({
      ...status,
      currentVersion: currentVersion(),
      supported: enabled,
      installKind: enabled ? 'restart' : 'unsupported',
      ...partial
    })
  )
}

function releaseNotesFrom(info: UpdateInfo): string | undefined {
  const notes = info.releaseNotes
  if (typeof notes === 'string' && notes.trim()) {
    return notes.trim()
  }
  if (Array.isArray(notes)) {
    const text = notes
      .map((item) => (typeof item.note === 'string' ? item.note : ''))
      .filter((item) => item.trim())
      .join('\n')
      .trim()
    return text || undefined
  }
  return undefined
}

function toUserMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  if (/ENOTFOUND|ETIMEDOUT|ECONN|net::|offline|network|getaddrinfo/i.test(message)) {
    return '无法连接更新服务器。请检查网络后重试。'
  }
  if (/latest\.yml|Cannot find channel|404|HttpError: 404/i.test(message)) {
    return '未找到可用的更新信息。'
  }
  return '检查或下载更新失败，请稍后重试。'
}

function ensureConfigured(): boolean {
  if (!readEnablement()) {
    emit(unsupportedAppUpdateStatus(currentVersion()))
    return false
  }
  if (configured) {
    return true
  }
  configured = true
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false
  autoUpdater.allowPrerelease = false
  autoUpdater.forceDevUpdateConfig = false
  autoUpdater.on('checking-for-update', () => {
    setStatus({ state: 'checking', errorMessage: undefined })
  })
  autoUpdater.on('update-available', (info) => {
    setStatus({
      state: 'available',
      availableVersion: info.version,
      releaseNotes: releaseNotesFrom(info),
      errorMessage: undefined
    })
  })
  autoUpdater.on('update-not-available', () => {
    setStatus({
      state: 'not-available',
      availableVersion: undefined,
      errorMessage: undefined
    })
  })
  autoUpdater.on('download-progress', (progress) => {
    setStatus({
      state: 'downloading',
      progressPercent: progress.percent,
      errorMessage: undefined
    })
  })
  autoUpdater.on('update-downloaded', (info) => {
    setStatus({
      state: 'readyToInstall',
      availableVersion: info.version,
      releaseNotes: releaseNotesFrom(info),
      progressPercent: 100,
      errorMessage: undefined
    })
  })
  autoUpdater.on('error', (error) => {
    checking = false
    downloading = false
    setStatus({
      state: 'error',
      errorMessage: toUserMessage(error)
    })
  })
  return true
}

export function getAppUpdateStatus(): AppUpdateStatus {
  if (!readEnablement()) {
    return emit(unsupportedAppUpdateStatus(currentVersion()))
  }
  if (!status.supported || status.installKind === 'unsupported') {
    return setStatus({
      supported: true,
      installKind: 'restart',
      currentVersion: currentVersion()
    })
  }
  return status
}

export function subscribeAppUpdateStatus(listener: (next: AppUpdateStatus) => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export async function checkForUpdates(): Promise<AppUpdateStatus> {
  cancelStartupUpdateCheck()
  if (!ensureConfigured()) {
    return getAppUpdateStatus()
  }
  if (checking || downloading || status.state === 'readyToInstall') {
    return getAppUpdateStatus()
  }
  checking = true
  try {
    await autoUpdater.checkForUpdates()
  } catch (error) {
    setStatus({
      state: 'error',
      errorMessage: toUserMessage(error)
    })
  } finally {
    checking = false
  }
  return getAppUpdateStatus()
}

export async function startDownload(): Promise<AppUpdateStatus> {
  cancelStartupUpdateCheck()
  if (!ensureConfigured()) {
    return getAppUpdateStatus()
  }
  const current = getAppUpdateStatus()
  if (current.state === 'readyToInstall' || current.state === 'downloading') {
    return current
  }
  if (current.state !== 'available' && !(current.state === 'error' && current.availableVersion)) {
    return current
  }
  downloading = true
  try {
    setStatus({
      state: 'downloading',
      progressPercent: current.progressPercent ?? 0,
      errorMessage: undefined
    })
    await autoUpdater.downloadUpdate()
  } catch (error) {
    setStatus({
      state: 'error',
      errorMessage: toUserMessage(error)
    })
  } finally {
    downloading = false
  }
  return getAppUpdateStatus()
}

export async function quitAndInstall(): Promise<void> {
  if (!ensureConfigured()) {
    return
  }
  if (getAppUpdateStatus().state !== 'readyToInstall') {
    return
  }
  try {
    autoUpdater.quitAndInstall(true, true)
  } catch (error) {
    setStatus({
      state: 'error',
      errorMessage: toUserMessage(error)
    })
  }
}

export function scheduleStartupUpdateCheck(delayMs = APP_UPDATE_STARTUP_CHECK_DELAY_MS): void {
  cancelStartupUpdateCheck()
  if (!readEnablement()) {
    emit(unsupportedAppUpdateStatus(currentVersion()))
    return
  }
  startupCheckCanceled = false
  startupTimer = setTimeout(() => {
    startupTimer = null
    if (startupCheckCanceled) {
      return
    }
    void checkForUpdates().catch((error) => {
      console.warn('[app-update] startup check failed', error instanceof Error ? error.name : 'UnknownError')
    })
  }, delayMs)
}

export function cancelStartupUpdateCheck(): void {
  startupCheckCanceled = true
  if (startupTimer) {
    clearTimeout(startupTimer)
    startupTimer = null
  }
}
