import { contextBridge, ipcRenderer } from 'electron'
import type { ClassRecord } from '../shared/class/types'
import type { ScheduleItem } from '../shared/schedule/types'
import type {
  ImportColumn,
  ImportCommitResult,
  ImportPickResult,
  ImportPreviewResult,
  StudentImportMapping,
  StudentRecord
} from '../shared/student'

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
    save: (items: StudentRecord[]): Promise<StudentRecord[]> => ipcRenderer.invoke('students:save', items),
    importPick: (): Promise<ImportPickResult> => ipcRenderer.invoke('students:importPick'),
    importHeaders: (
      sessionId: string,
      sheetName: string
    ): Promise<{ columns: ImportColumn[]; suggestedMapping: StudentImportMapping; headerRowNumber: number }> =>
      ipcRenderer.invoke('students:importHeaders', sessionId, sheetName),
    importPreview: (
      sessionId: string,
      sheetName: string,
      mapping: StudentImportMapping,
      classId: string
    ): Promise<ImportPreviewResult> => ipcRenderer.invoke('students:importPreview', sessionId, sheetName, mapping, classId),
    importCommit: (
      sessionId: string,
      sheetName: string,
      mapping: StudentImportMapping,
      classId: string
    ): Promise<ImportCommitResult> => ipcRenderer.invoke('students:importCommit', sessionId, sheetName, mapping, classId),
    importCancel: (): Promise<void> => ipcRenderer.invoke('students:importCancel')
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
