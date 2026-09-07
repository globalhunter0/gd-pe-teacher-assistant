import type { ClassRecord } from '../shared/class/types'
import type { PEClassSession } from '../shared/peSession/types'
import type { ScheduleItem } from '../shared/schedule/types'
import type { PETestSession, TestItem } from '../shared/peTest'
import type { TeachingPlan } from '../shared/teachingPlan'
import type {
  ResourceDeleteResult,
  ResourceFileImportInput,
  ResourceItem,
  ResourceLinkInput,
  ResourceNoteInput,
  ResourceSelectResult,
  ResourceUpdateInput
} from '../shared/resource'
import type {
  ImportColumn,
  ImportCommitResult,
  ImportPickResult,
  ImportPreviewResult,
  StudentImportMapping,
  StudentRecord
} from '../shared/student'
import type {
  ExamExportPayload,
  ExamExportResult,
  ExamPickResult,
  ExamSheetSnapshot,
  ExamWorkbookSavePayload
} from '../shared/examBatch/types'
import type {
  TrainingItem,
  TrainingResult,
  TrainingSession,
  TrainingTeam,
  TrainingTeamMember
} from '../shared/trainingTeam'

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
  testItems: {
    get: () => Promise<TestItem[]>
    save: (items: TestItem[]) => Promise<TestItem[]>
  }
  peTests: {
    get: () => Promise<PETestSession[]>
    save: (items: PETestSession[]) => Promise<PETestSession[]>
  }
  teachingPlans: {
    get: () => Promise<TeachingPlan[]>
    save: (items: TeachingPlan[]) => Promise<TeachingPlan[]>
  }
  resources: {
    get: () => Promise<ResourceItem[]>
    selectFile: () => Promise<ResourceSelectResult>
    cancelSelect: () => Promise<void>
    importFile: (input: ResourceFileImportInput) => Promise<ResourceItem[]>
    createNote: (input: ResourceNoteInput) => Promise<ResourceItem[]>
    createLink: (input: ResourceLinkInput) => Promise<ResourceItem[]>
    update: (id: string, input: ResourceUpdateInput) => Promise<ResourceItem[]>
    delete: (id: string) => Promise<ResourceDeleteResult>
    open: (id: string) => Promise<void>
  }
  examBatch: {
    pick: () => Promise<ExamPickResult>
    loadSheet: (sessionId: string, sheetName: string) => Promise<ExamSheetSnapshot>
    cancel: () => Promise<void>
    export: (payload: ExamExportPayload) => Promise<ExamExportResult>
    saveWorkbook: (payload: ExamWorkbookSavePayload) => Promise<ExamExportResult>
  }
  trainingTeams: {
    get: () => Promise<TrainingTeam[]>
    save: (items: TrainingTeam[]) => Promise<TrainingTeam[]>
    deleteCheck: (teamId: string) => Promise<string[]>
  }
  trainingMembers: {
    get: () => Promise<TrainingTeamMember[]>
    save: (items: TrainingTeamMember[]) => Promise<TrainingTeamMember[]>
  }
  trainingSessions: {
    get: () => Promise<TrainingSession[]>
    save: (items: TrainingSession[]) => Promise<TrainingSession[]>
  }
  trainingItems: {
    get: () => Promise<TrainingItem[]>
    save: (items: TrainingItem[]) => Promise<TrainingItem[]>
  }
  trainingResults: {
    get: () => Promise<TrainingResult[]>
    save: (items: TrainingResult[]) => Promise<TrainingResult[]>
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
