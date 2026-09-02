import { contextBridge, ipcRenderer } from 'electron'
import type { ClassRecord } from '../shared/class/types'
import type { ScheduleItem } from '../shared/schedule/types'
import type { StudentRecord } from '../shared/student/types'

const electronAPI = {
  schedule: {
    get: (): Promise<ScheduleItem[]> => ipcRenderer.invoke('schedule:get'),
    save: (items: ScheduleItem[]): Promise<ScheduleItem[]> => ipcRenderer.invoke('schedule:save', items)
  },
  classes: {
    get: (): Promise<ClassRecord[]> => ipcRenderer.invoke('classes:get'),
    save: (items: ClassRecord[]): Promise<ClassRecord[]> => ipcRenderer.invoke('classes:save', items)
  },
  students: {
    get: (): Promise<StudentRecord[]> => ipcRenderer.invoke('students:get'),
    save: (items: StudentRecord[]): Promise<StudentRecord[]> => ipcRenderer.invoke('students:save', items)
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
