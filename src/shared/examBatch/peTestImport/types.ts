import type { BatchAssessmentRow } from '../types'
import type { ExamStandard } from '../../examStandard/types'
import type { PETestSession, TestItem, TestRecordStatus } from '../../peTest/types'
import type { StudentRecord } from '../../student/types'
import type { ClassRecord } from '../../class/types'

export type DuplicateTestAction = 'skip' | 'cancel'

export type StudentMatchKind = 'studentId' | 'studentNo' | 'nameGender' | 'needs_confirm'

export interface StudentMatchResult {
  excelRow: number
  studentName: string
  studentNo: string
  kind: StudentMatchKind
  student: StudentRecord | null
  reason: string
}

export interface ExamToPeTestStatusMap {
  peStatus: TestRecordStatus
  rawValue: number | null
  examScore: number | null
  note: string
  blockImport: boolean
  skipCell: boolean
}

export interface ImportExamBatchToPeTestsPayload {
  classId: string
  testDate: string
  examStandardId: string
  scoringCity: string
  scoringVersion: string
  rows: BatchAssessmentRow[]
  duplicateAction: DuplicateTestAction
}

export interface PlannedPeTestImport {
  ok: boolean
  errors: string[]
  matches: StudentMatchResult[]
  duplicateKeys: Array<{ classId: string; date: string; testItemId: string; existingSessionId: string }>
  sessions: PETestSession[]
}

export interface PlanImportContext {
  classRecord: ClassRecord
  students: StudentRecord[]
  testItems: TestItem[]
  existingSessions: PETestSession[]
  standard: ExamStandard
  nowIso?: string
}

export interface ExamBatchPeTestImportResult {
  classId: string
  className: string
  testDate: string
  createdCount: number
  skippedCount: number
  validCount: number
  absentCount: number
  nonScoreCount: number
  sessions: Array<{
    id: string
    testItemId: string
    testItemName: string
    studentCount: number
    validCount: number
    absentCount: number
  }>
}
