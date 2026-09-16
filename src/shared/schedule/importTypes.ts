import type { CourseType, Period, Weekday } from './types'

export type ScheduleImportField = 'weekday' | 'period' | 'startTime' | 'endTime' | 'team' | 'courseType'

export interface ScheduleImportMapping {
  weekday: number | null
  period: number | null
  startTime: number | null
  endTime: number | null
  team: number | null
  courseType: number | null
}

export interface IncomingScheduleRow {
  sheetName?: string
  excelRow: number
  weekdayRaw: string
  periodRaw: string
  teamRaw: string
  weekday: Weekday | null
  period: Period | null
  startTime: string
  endTime: string
  team: string
  courseType: CourseType
}

export interface ScheduleImportSkippedItem {
  sheetName: string
  excelRow: number
  label: string
  reason: string
}

export interface ScheduleImportSummary {
  sheetNames: string[]
  headerRows: Array<{ sheetName: string; rowNumber: number }>
  effectiveRanges: Array<{
    sheetName: string
    startRow: number | null
    endRow: number | null
  }>
  recognizedCount: number
  specialEventCount: number
  skipped: ScheduleImportSkippedItem[]
}

export type ScheduleLineKind = 'keep' | 'create' | 'update' | 'remove' | 'conflict'

export type ScheduleSlotChoice = { action: 'incoming'; excelRow: number } | { action: 'keep' }

export interface ScheduleSyncResolutions {
  slotChoices: Record<string, ScheduleSlotChoice>
  clearLinks: Record<string, boolean>
  acknowledgeRemoves: boolean
}

export interface ScheduleSyncLine {
  kind: ScheduleLineKind
  slotId: string
  weekday?: Weekday
  period?: Period
  current?: {
    team: string
    startTime: string
    endTime: string
    courseType: CourseType
    classId?: string
    trainingTeamId?: string
  }
  incoming?: IncomingScheduleRow
  incomingCandidates?: IncomingScheduleRow[]
  message: string
}

export interface SchedulePreviewResult {
  mode: 'first' | 'sync'
  fileName: string
  lines: ScheduleSyncLine[]
  totals: {
    keep: number
    create: number
    update: number
    remove: number
    conflict: number
  }
  canCommit: boolean
  blockingReasons: string[]
  removeNotice: string | null
  importSummary?: ScheduleImportSummary
  target?: import('./types').ScheduleItem[]
}

export interface ScheduleImportCommitResult {
  items: import('./types').ScheduleItem[]
  keep: number
  create: number
  update: number
  remove: number
  recognized: number
  specialEventCount: number
  skipped: number
}
