export type DataIntegritySeverity = 'info' | 'warning' | 'error'

export type DataIntegrityDomain =
  | 'classes'
  | 'students'
  | 'schedule'
  | 'pe-sessions'
  | 'pe-tests'
  | 'teaching-plans'
  | 'training-teams'
  | 'training-members'
  | 'training-sessions'
  | 'training-results'
  | 'resources'
  | 'settings'
  | 'files'
  | 'cross'

export interface DataIntegrityIssue {
  severity: DataIntegritySeverity
  domain: DataIntegrityDomain
  code: string
  entityId: string
  message: string
  repairable: boolean
  details?: Record<string, unknown>
}

export type DataIntegrityStatus = 'healthy' | 'warning' | 'error'

export interface DataIntegrityReport {
  checkedAt: string
  status: DataIntegrityStatus
  issueCount: { info: number; warning: number; error: number }
  issues: DataIntegrityIssue[]
}

export interface DataIntegrityFileStatus {
  fileName: string
  exists: boolean
  parseError?: string
  errorType?: string
  parseable?: boolean
  structureInvalid?: boolean
  quarantined?: boolean
  writeBlocked?: boolean
  recoverySource?: string
}

export interface DataIntegritySnapshot {
  classes: ReadonlyArray<{ id: string; status: string }>
  students: ReadonlyArray<{ id: string; classId: string; status: string }>
  schedule: ReadonlyArray<{ id: string; classId?: string; trainingTeamId?: string }>
  peSessions: ReadonlyArray<{
    id: string
    classId: string
    scheduleLessonId: string | null
    teachingPlanId?: string | null
    status?: string
    date: string
  }>
  peTests: ReadonlyArray<{
    id: string
    classId: string
    peSessionId?: string | null
    status?: string
    date: string
  }>
  teachingPlans: ReadonlyArray<{ id: string }>
  trainingTeams: ReadonlyArray<{ id: string; status: string }>
  trainingMembers: ReadonlyArray<{ id: string; teamId: string; studentId: string; status: string }>
  trainingSessions: ReadonlyArray<{ id: string; teamId: string; planId?: string | null }>
  trainingResults: ReadonlyArray<{
    id: string
    teamId: string
    sessionId?: string | null
    studentId: string
  }>
  resources?: ReadonlyArray<{ id: string }>
  fileStatuses?: ReadonlyArray<DataIntegrityFileStatus>
}

export function emptyIntegrityReport(checkedAt: string = new Date().toISOString()): DataIntegrityReport {
  return {
    checkedAt,
    status: 'healthy',
    issueCount: { info: 0, warning: 0, error: 0 },
    issues: []
  }
}

export function summarizeIntegrityIssues(issues: ReadonlyArray<DataIntegrityIssue>): DataIntegrityReport {
  const issueCount = { info: 0, warning: 0, error: 0 }
  for (const issue of issues) {
    issueCount[issue.severity] += 1
  }
  const status: DataIntegrityStatus =
    issueCount.error > 0 ? 'error' : issueCount.warning > 0 ? 'warning' : 'healthy'
  return {
    checkedAt: new Date().toISOString(),
    status,
    issueCount,
    issues: [...issues]
  }
}
