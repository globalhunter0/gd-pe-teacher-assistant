import type { ScheduleItem } from '../shared/schedule/types'

export interface ElectronAPI {
  schedule: {
    get: () => Promise<ScheduleItem[]>
    save: (items: ScheduleItem[]) => Promise<ScheduleItem[]>
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
