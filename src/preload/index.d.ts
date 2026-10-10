import type { AppApi } from '../shared/appApi'

export type ElectronAPI = AppApi

declare global {
  interface Window {
    electronAPI: AppApi
  }
}

export {}
