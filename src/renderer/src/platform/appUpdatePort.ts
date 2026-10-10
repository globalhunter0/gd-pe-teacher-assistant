import type { AppUpdateStatus } from '@shared/appUpdate'
import { getAppApi, subscribeAppUpdateStatus } from './appApi'

export interface AppUpdatePort {
  getStatus: () => Promise<AppUpdateStatus>
  checkForUpdates: () => Promise<AppUpdateStatus>
  startDownload: () => Promise<AppUpdateStatus>
  quitAndInstall: () => Promise<void>
  subscribe: (listener: (status: AppUpdateStatus) => void) => () => void
}

export async function getAppUpdatePort(): Promise<AppUpdatePort> {
  const api = await getAppApi()
  return {
    getStatus: () => api.appUpdate.getStatus(),
    checkForUpdates: () => api.appUpdate.checkForUpdates(),
    startDownload: () => api.appUpdate.startDownload(),
    quitAndInstall: () => api.appUpdate.quitAndInstall(),
    subscribe: subscribeAppUpdateStatus
  }
}
