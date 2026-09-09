import { contextBridge, ipcRenderer } from 'electron'
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
  TrainingItem,
  TrainingResult,
  TrainingSession,
  TrainingTeam,
  TrainingTeamMember
} from '../shared/trainingTeam/types'

const electronAPI = {
  schedule: {
    get: (): Promise<ScheduleItem[]> => ipcRenderer.invoke('schedule:get'),
    save: (items: ScheduleItem[]): Promise<ScheduleItem[]> => ipcRenderer.invoke('schedule:save', items),
    importPick: (): Promise<ImportPickResult> => ipcRenderer.invoke('schedule:importPick'),
    importAnalyze: (sessionId: string): Promise<import('../shared/schedule/detectTypes').DetectedScheduleWorkbook> =>
      ipcRenderer.invoke('schedule:importAnalyze', sessionId),
    importPreview: (
      sessionId: string,
      mapping: import('../shared/schedule/importTypes').ScheduleImportMapping | null,
      resolutions: import('../shared/schedule/importTypes').ScheduleSyncResolutions
    ): Promise<import('../shared/schedule/importTypes').SchedulePreviewResult> =>
      ipcRenderer.invoke('schedule:importPreview', sessionId, mapping, resolutions),
    importCommit: (
      sessionId: string,
      mapping: import('../shared/schedule/importTypes').ScheduleImportMapping | null,
      resolutions: import('../shared/schedule/importTypes').ScheduleSyncResolutions
    ): Promise<import('../shared/schedule/importTypes').ScheduleImportCommitResult> =>
      ipcRenderer.invoke('schedule:importCommit', sessionId, mapping, resolutions),
    importCancel: (): Promise<void> => ipcRenderer.invoke('schedule:importCancel')
  },
  classes: {
    get: (): Promise<ClassRecord[]> => ipcRenderer.invoke('classes:get'),
    save: (items: ClassRecord[]): Promise<ClassRecord[]> => ipcRenderer.invoke('classes:save', items)
  },
  students: {
    get: (): Promise<StudentRecord[]> => ipcRenderer.invoke('students:get'),
    save: (items: StudentRecord[]): Promise<StudentRecord[]> => ipcRenderer.invoke('students:save', items),
    importPick: (): Promise<ImportPickResult> => ipcRenderer.invoke('students:importPick'),
    importAnalyze: (sessionId: string): Promise<import('../shared/student/detectTypes').DetectedWorkbook> =>
      ipcRenderer.invoke('students:importAnalyze', sessionId),
    importHeaders: (
      sessionId: string,
      sheetName: string
    ): Promise<{
      columns: ImportColumn[]
      suggestedMapping: StudentImportMapping
      headerRowNumber: number
      detection: import('../shared/student/detectTypes').DetectedWorkbook
    }> => ipcRenderer.invoke('students:importHeaders', sessionId, sheetName),
    importPreview: (
      sessionId: string,
      sheetName: string,
      mapping: StudentImportMapping | null,
      context?: {
        academicYear?: string
        semester?: string
        resolutions?: import('../shared/student/rosterTypes').RosterResolutions
      }
    ): Promise<import('../shared/student/rosterTypes').RosterPreviewResult> =>
      ipcRenderer.invoke('students:importPreview', sessionId, sheetName, mapping, context),
    importCommit: (
      sessionId: string,
      sheetName: string,
      mapping: StudentImportMapping | null,
      context?: {
        academicYear?: string
        semester?: string
        resolutions?: import('../shared/student/rosterTypes').RosterResolutions
      }
    ): Promise<ImportCommitResult> => ipcRenderer.invoke('students:importCommit', sessionId, sheetName, mapping, context),
    importCancel: (): Promise<void> => ipcRenderer.invoke('students:importCancel')
  },
  peSessions: {
    get: (): Promise<PEClassSession[]> => ipcRenderer.invoke('peSessions:get'),
    save: (items: PEClassSession[]): Promise<PEClassSession[]> => ipcRenderer.invoke('peSessions:save', items)
  },
  testItems: {
    get: (): Promise<TestItem[]> => ipcRenderer.invoke('testItems:get'),
    save: (items: TestItem[]): Promise<TestItem[]> => ipcRenderer.invoke('testItems:save', items)
  },
  peTests: {
    get: (): Promise<PETestSession[]> => ipcRenderer.invoke('peTests:get'),
    save: (items: PETestSession[]): Promise<PETestSession[]> => ipcRenderer.invoke('peTests:save', items)
  },
  teachingPlans: {
    get: (): Promise<TeachingPlan[]> => ipcRenderer.invoke('teachingPlans:get'),
    save: (items: TeachingPlan[]): Promise<TeachingPlan[]> => ipcRenderer.invoke('teachingPlans:save', items)
  },
  resources: {
    get: (): Promise<ResourceItem[]> => ipcRenderer.invoke('resources:get'),
    selectFile: (): Promise<ResourceSelectResult> => ipcRenderer.invoke('resources:selectFile'),
    cancelSelect: (): Promise<void> => ipcRenderer.invoke('resources:cancelSelect'),
    importFile: (input: ResourceFileImportInput): Promise<ResourceItem[]> =>
      ipcRenderer.invoke('resources:importFile', input),
    createNote: (input: ResourceNoteInput): Promise<ResourceItem[]> => ipcRenderer.invoke('resources:createNote', input),
    createLink: (input: ResourceLinkInput): Promise<ResourceItem[]> => ipcRenderer.invoke('resources:createLink', input),
    update: (id: string, input: ResourceUpdateInput): Promise<ResourceItem[]> =>
      ipcRenderer.invoke('resources:update', id, input),
    delete: (id: string): Promise<ResourceDeleteResult> => ipcRenderer.invoke('resources:delete', id),
    open: (id: string): Promise<void> => ipcRenderer.invoke('resources:open', id)
  },
  examBatch: {
    pick: (): Promise<ExamPickResult> => ipcRenderer.invoke('examBatch:pick'),
    loadSheet: (sessionId: string, sheetName: string): Promise<ExamSheetSnapshot> =>
      ipcRenderer.invoke('examBatch:loadSheet', sessionId, sheetName),
    cancel: (): Promise<void> => ipcRenderer.invoke('examBatch:cancel'),
    export: (payload: ExamExportPayload): Promise<ExamExportResult> => ipcRenderer.invoke('examBatch:export', payload),
    saveWorkbook: (payload: ExamWorkbookSavePayload): Promise<ExamExportResult> =>
      ipcRenderer.invoke('examBatch:saveWorkbook', payload)
  },
  trainingTeams: {
    get: (): Promise<TrainingTeam[]> => ipcRenderer.invoke('trainingTeams:get'),
    save: (items: TrainingTeam[]): Promise<TrainingTeam[]> => ipcRenderer.invoke('trainingTeams:save', items),
    deleteCheck: (teamId: string): Promise<string[]> => ipcRenderer.invoke('trainingTeams:deleteCheck', teamId)
  },
  trainingMembers: {
    get: (): Promise<TrainingTeamMember[]> => ipcRenderer.invoke('trainingMembers:get'),
    save: (items: TrainingTeamMember[]): Promise<TrainingTeamMember[]> => ipcRenderer.invoke('trainingMembers:save', items)
  },
  trainingSessions: {
    get: (): Promise<TrainingSession[]> => ipcRenderer.invoke('trainingSessions:get'),
    save: (items: TrainingSession[]): Promise<TrainingSession[]> => ipcRenderer.invoke('trainingSessions:save', items)
  },
  trainingItems: {
    get: (): Promise<TrainingItem[]> => ipcRenderer.invoke('trainingItems:get'),
    save: (items: TrainingItem[]): Promise<TrainingItem[]> => ipcRenderer.invoke('trainingItems:save', items)
  },
  trainingResults: {
    get: (): Promise<TrainingResult[]> => ipcRenderer.invoke('trainingResults:get'),
    save: (items: TrainingResult[]): Promise<TrainingResult[]> => ipcRenderer.invoke('trainingResults:save', items)
  },
  backup: {
    create: (): Promise<
      { canceled: true } | { canceled: false; filePath: string; fileCount: number; createdAt: string }
    > => ipcRenderer.invoke('backup:create'),
    restore: (): Promise<
      { canceled: true } | { canceled: false; safetyBackupPath: string; restoredCount: number }
    > => ipcRenderer.invoke('backup:restore')
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
