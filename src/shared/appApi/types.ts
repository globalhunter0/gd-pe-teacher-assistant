import type { ClassRecord } from '../class/types'
import type { DataIntegrityReport } from '../dataIntegrity'
import type {
  ExamExportPayload,
  ExamExportResult,
  ExamPickResult,
  ExamSheetSnapshot,
  ExamWorkbookSavePayload
} from '../examBatch/types'
import type { ExamBatchPeTestImportResult, ImportExamBatchToPeTestsPayload } from '../examBatch/peTestImport/types'
import type { PEClassSession } from '../peSession/types'
import type { PETestSession, TestItem } from '../peTest'
import type {
  ResourceDeleteResult,
  ResourceFileImportInput,
  ResourceItem,
  ResourceLinkInput,
  ResourceNoteInput,
  ResourceSelectResult,
  ResourceUpdateInput
} from '../resource'
import type { ScheduleItem } from '../schedule/types'
import type { DetectedScheduleWorkbook } from '../schedule/detectTypes'
import type { ScheduleImportCommitResult, ScheduleImportMapping, SchedulePreviewResult, ScheduleSyncResolutions } from '../schedule/importTypes'
import type { ImportColumn, ImportCommitResult, ImportPickResult, StudentImportMapping, StudentRecord } from '../student'
import type { DetectedWorkbook } from '../student/detectTypes'
import type { RosterPreviewResult, RosterResolutions } from '../student/rosterTypes'
import type { TeachingPlan } from '../teachingPlan'
import type { TeachingDesign } from '../teachingDesign'
import type { AiConnectionTestResult, AiModelSaveInput, AiModelStatus } from '../aiModel/types'
import type { MaterialPreview } from '../materials/types'
import type {
  TrainingItem,
  TrainingPlan,
  TrainingResult,
  TrainingSession,
  TrainingSessionRecordResult,
  TrainingTeam,
  TrainingTeamDeleteCheck,
  TrainingTeamMember,
  TrainingTeamSafeDeleteResult
} from '../trainingTeam'
import type { AppUpdateStatus } from '../appUpdate'
import type { UserPreferences } from '../userPreferences'

export interface StudentImportContext {
  academicYear?: string
  semester?: string
  resolutions?: RosterResolutions
}

export interface StudentImportHeaders {
  columns: ImportColumn[]
  suggestedMapping: StudentImportMapping
  headerRowNumber: number
  detection: DetectedWorkbook
}

export type BackupCreateResult =
  | { canceled: true }
  | { canceled: false; filePath: string; fileCount: number; createdAt: string }

export type BackupRestoreResult =
  | { canceled: true }
  | { canceled: false; safetyBackupPath: string; restoredCount: number; keptPaths: string[] }

export interface DataIntegrityRepairResult {
  ok: boolean
  safetyBackupPath: string | null
  repairedCount: number
  message: string
  reportAfter: DataIntegrityReport | null
}

/** Desktop and future mobile clients implement this contract. Channel names live in IPC_CHANNELS. */
export interface AppApi {
  schedule: {
    get: () => Promise<ScheduleItem[]>
    save: (items: ScheduleItem[], expected: ScheduleItem[]) => Promise<ScheduleItem[]>
    importPick: () => Promise<ImportPickResult>
    importAnalyze: (sessionId: string) => Promise<DetectedScheduleWorkbook>
    importPreview: (
      sessionId: string,
      mapping: ScheduleImportMapping | null,
      resolutions: ScheduleSyncResolutions
    ) => Promise<SchedulePreviewResult>
    importCommit: (
      sessionId: string,
      mapping: ScheduleImportMapping | null,
      resolutions: ScheduleSyncResolutions
    ) => Promise<ScheduleImportCommitResult>
    importCancel: () => Promise<void>
  }
  classes: {
    get: () => Promise<ClassRecord[]>
    save: (items: ClassRecord[], expected: ClassRecord[]) => Promise<ClassRecord[]>
  }
  students: {
    get: () => Promise<StudentRecord[]>
    save: (items: StudentRecord[], expected: StudentRecord[]) => Promise<StudentRecord[]>
    importPick: () => Promise<ImportPickResult>
    importAnalyze: (sessionId: string) => Promise<DetectedWorkbook>
    importHeaders: (sessionId: string, sheetName: string) => Promise<StudentImportHeaders>
    importPreview: (
      sessionId: string,
      sheetName: string,
      mapping: StudentImportMapping | null,
      context?: StudentImportContext
    ) => Promise<RosterPreviewResult>
    importCommit: (
      sessionId: string,
      sheetName: string,
      mapping: StudentImportMapping | null,
      context?: StudentImportContext
    ) => Promise<ImportCommitResult>
    importCancel: () => Promise<void>
  }
  peSessions: {
    create: (item: PEClassSession) => Promise<{ session: PEClassSession; sessions: PEClassSession[] }>
    get: () => Promise<PEClassSession[]>
    save: (items: PEClassSession[], expected: PEClassSession[]) => Promise<PEClassSession[]>
  }
  testItems: {
    get: () => Promise<TestItem[]>
    save: (items: TestItem[], expected: TestItem[]) => Promise<TestItem[]>
  }
  peTests: {
    get: () => Promise<PETestSession[]>
    save: (items: PETestSession[], expected: PETestSession[]) => Promise<PETestSession[]>
    importExamBatch: (payload: ImportExamBatchToPeTestsPayload) => Promise<ExamBatchPeTestImportResult>
  }
  teachingPlans: {
    get: () => Promise<TeachingPlan[]>
    save: (items: TeachingPlan[], expected: TeachingPlan[]) => Promise<TeachingPlan[]>
  }
  teachingDesigns: {
    get: () => Promise<TeachingDesign[]>
    save: (items: TeachingDesign[], expected: TeachingDesign[]) => Promise<TeachingDesign[]>
  }
  aiModel: {
    getStatus: () => Promise<AiModelStatus>
    save: (input: AiModelSaveInput) => Promise<AiModelStatus>
    /** 用表单里尚未保存的配置测试；apiKey 省略时使用已保存的密钥。 */
    test: (input: AiModelSaveInput) => Promise<AiConnectionTestResult>
  }
  materials: {
    preview: (resourceIds: string[]) => Promise<MaterialPreview[]>
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
    save: (items: TrainingTeam[], expected: TrainingTeam[]) => Promise<TrainingTeam[]>
    archive: (teamId: string) => Promise<{ teams: TrainingTeam[]; plans: TrainingPlan[] }>
    deleteCheck: (teamId: string) => Promise<TrainingTeamDeleteCheck>
    safeDelete: (teamId: string) => Promise<TrainingTeamSafeDeleteResult & { plans: TrainingPlan[] }>
  }
  trainingPlans: {
    get: () => Promise<TrainingPlan[]>
    save: (items: TrainingPlan[], expected: TrainingPlan[]) => Promise<TrainingPlan[]>
  }
  trainingMembers: {
    add: (items: TrainingTeamMember[]) => Promise<TrainingTeamMember[]>
    get: () => Promise<TrainingTeamMember[]>
    save: (items: TrainingTeamMember[], expected: TrainingTeamMember[]) => Promise<TrainingTeamMember[]>
  }
  trainingSessions: {
    get: () => Promise<TrainingSession[]>
    save: (items: TrainingSession[], expected: TrainingSession[]) => Promise<TrainingSession[]>
    record: (session: TrainingSession, results: TrainingResult[]) => Promise<TrainingSessionRecordResult>
  }
  trainingItems: {
    get: () => Promise<TrainingItem[]>
    save: (items: TrainingItem[], expected: TrainingItem[]) => Promise<TrainingItem[]>
  }
  trainingResults: {
    get: () => Promise<TrainingResult[]>
    save: (items: TrainingResult[], expected: TrainingResult[]) => Promise<TrainingResult[]>
  }
  backup: {
    create: () => Promise<BackupCreateResult>
    restore: () => Promise<BackupRestoreResult>
  }
  dataIntegrity: {
    audit: () => Promise<DataIntegrityReport>
    startupStatus: () => Promise<DataIntegrityReport | null>
    safeRepair: () => Promise<DataIntegrityRepairResult>
  }
  userPreferences: {
    get: () => Promise<UserPreferences>
    save: (input: UserPreferences) => Promise<UserPreferences>
  }
  appUpdate: {
    getStatus: () => Promise<AppUpdateStatus>
    checkForUpdates: () => Promise<AppUpdateStatus>
    startDownload: () => Promise<AppUpdateStatus>
    quitAndInstall: () => Promise<void>
  }
}
