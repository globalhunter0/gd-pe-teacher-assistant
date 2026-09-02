import { contextBridge, ipcRenderer } from 'electron'
import type { ScheduleItem } from '../shared/schedule/types'

const electronAPI = {
  schedule: {
    get: (): Promise<ScheduleItem[]> => ipcRenderer.invoke('schedule:get'),
    save: (items: ScheduleItem[]): Promise<ScheduleItem[]> => ipcRenderer.invoke('schedule:save', items)
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
