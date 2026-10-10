import { app } from 'electron'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
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

interface UpdateInfoLike {
  version: string
  releaseNotes?: string | Array<{ note?: string | null }> | null
}

interface AutoUpdaterLike {
  autoDownload: boolean
  autoInstallOnAppQuit: boolean
  allowPrerelease: boolean
  forceDevUpdateConfig: boolean
  on: (event: string, listener: (...args: unknown[]) => void) => unknown
  checkForUpdates: () => Promise<unknown>
  downloadUpdate: () => Promise<unknown>
  quitAndInstall: (isSilent?: boolean, isForceRunAfter?: boolean) => void
}

const listeners = new Set<(next: AppUpdateStatus) => void>()

let status: AppUpdateStatus = unsupportedAppUpdateStatus(APP_VERSION)
let updater: AutoUpdaterLike | null = null
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

function releaseNotesFrom(info: UpdateInfoLike): string | undefined {
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

async function ensureConfigured(): Promise<AutoUpdaterLike | null> {
  if (!readEnablement()) {
    emit(unsupportedAppUpdateStatus(currentVersion()))
    return null
  }
  if (configured && updater) {
    return updater
  }
  const { autoUpdater } = await import('electron-updater')
  updater = autoUpdater as AutoUpdaterLike
  updater.autoDownload = false
  updater.autoInstallOnAppQuit = false
  updater.allowPrerelease = false
  updater.forceDevUpdateConfig = false
  if (!configured) {
    updater.on('checking-for-update', () => {
      setStatus({ state: 'checking', errorMessage: undefined })
    })
    updater.on('update-available', (info) => {
      const update = info as UpdateInfoLike
      setStatus({
        state: 'available',
        availableVersion: update.version,
        releaseNotes: releaseNotesFrom(update),
        errorMessage: undefined
      })
    })
    updater.on('update-not-available', () => {
      setStatus({
        state: 'not-available',
        availableVersion: undefined,
        errorMessage: undefined
      })
    })
    updater.on('download-progress', (progress) => {
      const percent = typeof progress === 'object' && progress && 'percent' in progress ? Number(progress.percent) : 0
      setStatus({
        state: 'downloading',
        progressPercent: percent,
        errorMessage: undefined
      })
    })
    updater.on('update-downloaded', (info) => {
      const update = info as UpdateInfoLike
      setStatus({
        state: 'readyToInstall',
        availableVersion: update.version,
        releaseNotes: releaseNotesFrom(update),
        progressPercent: 100,
        errorMessage: undefined
      })
    })
    updater.on('error', (error) => {
      checking = false
      downloading = false
      setStatus({
        state: 'error',
        errorMessage: toUserMessage(error)
      })
    })
  }
  configured = true
  return updater
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
  const autoUpdater = await ensureConfigured()
  if (!autoUpdater) {
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
  const autoUpdater = await ensureConfigured()
  if (!autoUpdater) {
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
  const autoUpdater = await ensureConfigured()
  if (!autoUpdater) {
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
