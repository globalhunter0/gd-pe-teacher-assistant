import type { ClassRecord, Grade, Semester } from '../class/types'
import type { StudentGender, StudentRecord } from './types'

export type RosterLineKind = 'keep' | 'create' | 'remove' | 'update' | 'conflict' | 'suspect_transfer'

export type ClassMatchKind = 'existing' | 'create' | 'confirm'

export interface IncomingStudentRow {
  excelRow: number
  classRaw: string
  studentNo: string
  name: string
  gender: StudentGender
  notes: string
}

export interface ClassGroupMatch {
  groupKey: string
  classRaw: string
  grade: Grade | null
  className: string
  academicYear: string
  semester: Semester
  match: ClassMatchKind
  existingId?: string
}

export interface RosterLine {
  kind: RosterLineKind
  excelRow?: number
  existingId?: string
  incoming?: IncomingStudentRow
  message: string
  preserveExisting?: boolean
  suspect?: {
    studentId: string
    fromClassId: string
    name: string
    studentNo: string
  }
}

export interface ClassRosterPreview {
  groupKey: string
  classLabel: string
  match: ClassGroupMatch
  currentActiveCount: number
  excelCount: number
  keep: number
  create: number
  remove: number
  update: number
  conflict: number
  lines: RosterLine[]
}

export interface RosterPreviewResult {
  fileName: string
  sheetName: string
  headerRowNumber: number
  academicYear: string
  semester: Semester
  canCommit: boolean
  totals: {
    keep: number
    create: number
    remove: number
    update: number
    conflict: number
    classesToCreate: number
  }
  groups: ClassRosterPreview[]
}

export interface RosterClassChoice {
  action: 'existing' | 'create'
  classId?: string
  grade?: Grade
  className?: string
}

export interface RosterRowChoice {
  action: 'create' | 'transfer' | 'update' | 'keep-existing'
  studentId?: string
}

export interface RosterResolutions {
  classChoices: Record<string, RosterClassChoice>
  rowChoices: Record<number, RosterRowChoice>
}

export interface RosterCommitResult {
  classes: ClassRecord[]
  students: StudentRecord[]
  createdClassCount: number
  createdStudentCount: number
  updatedStudentCount: number
  removedFromRosterCount: number
}

export interface RosterIdFactory {
  createClassId: () => string
  createStudentId: () => string
  now: () => string
}
