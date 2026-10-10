import { APP_VERSION } from '../shared/appVersion'
import { unsupportedAppUpdateStatus, type AppUpdateStatus } from '../shared/appUpdate'

let status: AppUpdateStatus = unsupportedAppUpdateStatus(APP_VERSION)
const listeners = new Set<(next: AppUpdateStatus) => void>()

export function getAppUpdateStatus(): AppUpdateStatus {
  return status
}

export function subscribeAppUpdateStatus(listener: (next: AppUpdateStatus) => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function isAppUpdateRuntimeEnabled(): boolean {
  return false
}

export async function checkForUpdates(): Promise<AppUpdateStatus> {
  return getAppUpdateStatus()
}

export async function startDownload(): Promise<AppUpdateStatus> {
  return getAppUpdateStatus()
}

export async function quitAndInstall(): Promise<void> {
  return undefined
}

export function scheduleStartupUpdateCheck(_delayMs = 8000): void {
  return undefined
}

export function cancelStartupUpdateCheck(): void {
  return undefined
}
