import type { ClassRecord } from '../shared/class/types'
import type { PEClassSession } from '../shared/peSession/types'
import type { ScheduleItem } from '../shared/schedule/types'
import type {
  ImportColumn,
  ImportCommitResult,
  ImportPickResult,
  ImportPreviewResult,
  StudentImportMapping,
  StudentRecord
} from '../shared/student'

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
    importPick: () => Promise<ImportPickResult>
    importHeaders: (
      sessionId: string,
      sheetName: string
    ) => Promise<{ columns: ImportColumn[]; suggestedMapping: StudentImportMapping; headerRowNumber: number }>
    importPreview: (
      sessionId: string,
      sheetName: string,
      mapping: StudentImportMapping,
      classId: string
    ) => Promise<ImportPreviewResult>
    importCommit: (
      sessionId: string,
      sheetName: string,
      mapping: StudentImportMapping,
      classId: string
    ) => Promise<ImportCommitResult>
    importCancel: () => Promise<void>
  }
  peSessions: {
    get: () => Promise<PEClassSession[]>
    save: (items: PEClassSession[]) => Promise<PEClassSession[]>
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
