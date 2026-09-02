import type { ClassRecord } from '../shared/class/types'
import type { ScheduleItem } from '../shared/schedule/types'
import type { StudentRecord } from '../shared/student/types'

export interface ElectronAPI {
  schedule: {
    get: () => Promise<ScheduleItem[]>
    save: (items: ScheduleItem[]) => Promise<ScheduleItem[]>
  }
  classes: {
    get: () => Promise<ClassRecord[]>
    save: (items: ClassRecord[]) => Promise<ClassRecord[]>
  }
  students: {
    get: () => Promise<StudentRecord[]>
    save: (items: StudentRecord[]) => Promise<StudentRecord[]>
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
