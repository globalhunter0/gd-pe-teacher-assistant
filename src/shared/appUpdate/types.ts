import { APP_VERSION } from '../appVersion'

export const APP_UPDATE_STATUS_EVENT = 'appUpdate:statusChanged'

export const APP_UPDATE_STATES = [
  'idle',
  'checking',
  'available',
  'not-available',
  'downloading',
  'readyToInstall',
  'error'
] as const

export type AppUpdateState = (typeof APP_UPDATE_STATES)[number]

export const APP_UPDATE_INSTALL_KINDS = ['restart', 'store', 'unsupported'] as const

export type AppUpdateInstallKind = (typeof APP_UPDATE_INSTALL_KINDS)[number]

export interface AppUpdateStatus {
  supported: boolean
  state: AppUpdateState
  currentVersion: string
  availableVersion?: string
  releaseNotes?: string
  progressPercent?: number
  errorMessage?: string
  installKind: AppUpdateInstallKind
}

export function isAppUpdateState(value: unknown): value is AppUpdateState {
  return typeof value === 'string' && (APP_UPDATE_STATES as readonly string[]).includes(value)
}

export function isAppUpdateInstallKind(value: unknown): value is AppUpdateInstallKind {
  return typeof value === 'string' && (APP_UPDATE_INSTALL_KINDS as readonly string[]).includes(value)
}

export function unsupportedAppUpdateStatus(currentVersion: string = APP_VERSION): AppUpdateStatus {
  return {
    supported: false,
    state: 'idle',
    currentVersion,
    installKind: 'unsupported'
  }
}

function optionalTrimmedString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function optionalProgressPercent(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined
  }
  return Math.min(100, Math.max(0, value))
}

export function parseAppUpdateStatus(input: unknown, fallbackVersion: string = APP_VERSION): AppUpdateStatus {
  if (input == null || typeof input !== 'object' || Array.isArray(input)) {
    return unsupportedAppUpdateStatus(fallbackVersion)
  }

  const record = input as Record<string, unknown>
  const currentVersion = optionalTrimmedString(record.currentVersion) ?? fallbackVersion
  const supported = record.supported === true
  const state = isAppUpdateState(record.state) ? record.state : 'idle'
  const installKind = isAppUpdateInstallKind(record.installKind)
    ? record.installKind
    : supported
      ? 'restart'
      : 'unsupported'

  const status: AppUpdateStatus = {
    supported,
    state,
    currentVersion,
    installKind
  }

  const availableVersion = optionalTrimmedString(record.availableVersion)
  if (availableVersion) {
    status.availableVersion = availableVersion
  }
  const releaseNotes = optionalTrimmedString(record.releaseNotes)
  if (releaseNotes) {
    status.releaseNotes = releaseNotes
  }
  const progressPercent = optionalProgressPercent(record.progressPercent)
  if (progressPercent !== undefined) {
    status.progressPercent = progressPercent
  }
  const errorMessage = optionalTrimmedString(record.errorMessage)
  if (errorMessage) {
    status.errorMessage = errorMessage
  }

  return status
}

export function shouldPromptAppUpdate(status: AppUpdateStatus): boolean {
  if (!status.supported) {
    return false
  }
  return status.state === 'available' || status.state === 'downloading' || status.state === 'readyToInstall'
}

export function formatAppUpdateVersion(version: string): string {
  const trimmed = version.trim()
  if (!trimmed) {
    return ''
  }
  return trimmed.startsWith('v') ? trimmed : `v${trimmed}`
}

export function formatAppUpdateStatusMessage(status: AppUpdateStatus): string {
  if (!status.supported) {
    return '当前环境不支持应用内更新。'
  }
  switch (status.state) {
    case 'checking':
      return '正在检查更新…'
    case 'available':
      return status.availableVersion
        ? `发现新版本 ${formatAppUpdateVersion(status.availableVersion)}。`
        : '发现新版本。'
    case 'not-available':
      return '已是最新版本。'
    case 'downloading':
      return `正在下载更新… ${Math.round(status.progressPercent ?? 0)}%`
    case 'readyToInstall':
      return status.installKind === 'store'
        ? '新版本已准备好，请前往应用商店安装。'
        : '更新已下载完成，重启后安装。'
    case 'error':
      return status.errorMessage ?? '检查或下载更新失败，请稍后重试。'
    default:
      return '可以检查是否有新版本。'
  }
}

export function appUpdateInstallActionLabel(kind: AppUpdateInstallKind): string {
  if (kind === 'store') {
    return '前往应用商店'
  }
  if (kind === 'restart') {
    return '重启安装'
  }
  return '关闭'
}
