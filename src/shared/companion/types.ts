import type { ClassRecord } from '../class/types'
import type { PEClassSession } from '../peSession/types'
import type { PETestSession, TestItem } from '../peTest'
import type { ScheduleItem } from '../schedule/types'
import type { StudentRecord } from '../student'

export const COMPANION_SNAPSHOT_KIND = 'gdpe-companion' as const
export const COMPANION_SNAPSHOT_SCHEMA_VERSION = 1 as const

/** Phone ↔ Windows sync package for the free Safari companion. */
export interface CompanionSnapshot {
  kind: typeof COMPANION_SNAPSHOT_KIND
  schemaVersion: typeof COMPANION_SNAPSHOT_SCHEMA_VERSION
  exportedAt: string
  appVersion: string
  classes: ClassRecord[]
  students: StudentRecord[]
  testItems: TestItem[]
  peTests: PETestSession[]
  /** Absent on older sync packages: importers keep the existing schedule. */
  schedule?: ScheduleItem[]
  /** Absent on older sync packages: importers keep existing classroom records. */
  peSessions?: PEClassSession[]
}

export interface CompanionSnapshotBuildInput {
  appVersion: string
  exportedAt?: string
  classes: ClassRecord[]
  students: StudentRecord[]
  testItems: TestItem[]
  peTests: PETestSession[]
  schedule?: ScheduleItem[]
  peSessions?: PEClassSession[]
}
