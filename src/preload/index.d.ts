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
  ExamBatchPeTestImportResult,
  ImportExamBatchToPeTestsPayload
} from '../shared/examBatch/peTestImport/types'
import type {
  TrainingItem,
  TrainingPlan,
  TrainingPlanSessionResult,
  TrainingResult,
  TrainingSession,
  TrainingTeam,
  TrainingTeamDeleteCheck,
  TrainingTeamMember,
  TrainingTeamSafeDeleteResult
} from '../shared/trainingTeam'
import type { DataIntegrityReport } from '../shared/dataIntegrity'
import type { UserPreferences } from '../shared/userPreferences'

export interface ElectronAPI {
  schedule: {
    get: () => Promise<ScheduleItem[]>
    save: (items: ScheduleItem[]) => Promise<ScheduleItem[]>
    importPick: () => Promise<ImportPickResult>
    importAnalyze: (sessionId: string) => Promise<import('../shared/schedule/detectTypes').DetectedScheduleWorkbook>
    importPreview: (
      sessionId: string,
      mapping: import('../shared/schedule/importTypes').ScheduleImportMapping | null,
      resolutions: import('../shared/schedule/importTypes').ScheduleSyncResolutions
    ) => Promise<import('../shared/schedule/importTypes').SchedulePreviewResult>
    importCommit: (
      sessionId: string,
      mapping: import('../shared/schedule/importTypes').ScheduleImportMapping | null,
      resolutions: import('../shared/schedule/importTypes').ScheduleSyncResolutions
    ) => Promise<import('../shared/schedule/importTypes').ScheduleImportCommitResult>
    importCancel: () => Promise<void>
  }
  classes: {
    get: () => Promise<ClassRecord[]>
    save: (items: ClassRecord[]) => Promise<ClassRecord[]>
  }
  students: {
    get: () => Promise<StudentRecord[]>
    save: (items: StudentRecord[]) => Promise<StudentRecord[]>
    importPick: () => Promise<ImportPickResult>
    importAnalyze: (sessionId: string) => Promise<import('../shared/student/detectTypes').DetectedWorkbook>
    importHeaders: (
      sessionId: string,
      sheetName: string
    ) => Promise<{
      columns: ImportColumn[]
      suggestedMapping: StudentImportMapping
      headerRowNumber: number
      detection: import('../shared/student/detectTypes').DetectedWorkbook
    }>
    importPreview: (
      sessionId: string,
      sheetName: string,
      mapping: StudentImportMapping | null,
      context?: {
        academicYear?: string
        semester?: string
        resolutions?: import('../shared/student/rosterTypes').RosterResolutions
      }
    ) => Promise<import('../shared/student/rosterTypes').RosterPreviewResult>
    importCommit: (
      sessionId: string,
      sheetName: string,
      mapping: StudentImportMapping | null,
      context?: {
        academicYear?: string
        semester?: string
        resolutions?: import('../shared/student/rosterTypes').RosterResolutions
      }
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
    importExamBatch: (payload: ImportExamBatchToPeTestsPayload) => Promise<ExamBatchPeTestImportResult>
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
    archive: (teamId: string) => Promise<{ teams: TrainingTeam[]; plans: TrainingPlan[] }>
    deleteCheck: (teamId: string) => Promise<TrainingTeamDeleteCheck>
    safeDelete: (teamId: string) => Promise<TrainingTeamSafeDeleteResult & { plans: TrainingPlan[] }>
  }
  trainingPlans: {
    get: () => Promise<TrainingPlan[]>
    save: (items: TrainingPlan[]) => Promise<TrainingPlan[]>
    completeWithSession: (planId: string, session: TrainingSession) => Promise<TrainingPlanSessionResult>
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
  backup: {
    create: () => Promise<
      { canceled: true } | { canceled: false; filePath: string; fileCount: number; createdAt: string }
    >
    restore: () => Promise<
      { canceled: true } | { canceled: false; safetyBackupPath: string; restoredCount: number; keptPaths: string[] }
    >
  }
  dataIntegrity: {
    audit: () => Promise<DataIntegrityReport>
  }
  userPreferences: {
    get: () => Promise<UserPreferences>
    save: (input: UserPreferences) => Promise<UserPreferences>
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
