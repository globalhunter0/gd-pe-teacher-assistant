import type { AppApi } from '../shared/appApi'
import type { AppUpdateStatus } from '../shared/appUpdate'

export type ElectronAPI = AppApi

declare global {
  interface Window {
    electronAPI: AppApi
    appUpdateEvents?: {
      subscribe: (listener: (status: AppUpdateStatus) => void) => () => void
    }
  }
}

export {}
