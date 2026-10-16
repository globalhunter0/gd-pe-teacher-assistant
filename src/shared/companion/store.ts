import type { ClassRecord } from '../class/types'
import type { PEClassSession } from '../peSession/types'
import type { PETestSession, TestItem } from '../peTest'
import { BUILTIN_TEST_ITEMS, mergeBuiltinTestItems } from '../peTest/builtinItems'
import type { ScheduleItem } from '../schedule/types'
import type { StudentRecord } from '../student'
import { defaultUserPreferences, type UserPreferences } from '../userPreferences'
import type { CompanionSnapshot } from './types'

export type CompanionCollectionKey =
  | 'classes'
  | 'students'
  | 'testItems'
  | 'peTests'
  | 'schedule'
  | 'peSessions'

export interface CompanionDataStore {
  getClasses(): Promise<ClassRecord[]>
  setClasses(items: ClassRecord[]): Promise<ClassRecord[]>
  getStudents(): Promise<StudentRecord[]>
  setStudents(items: StudentRecord[]): Promise<StudentRecord[]>
  getTestItems(): Promise<TestItem[]>
  setTestItems(items: TestItem[]): Promise<TestItem[]>
  getPeTests(): Promise<PETestSession[]>
  setPeTests(items: PETestSession[]): Promise<PETestSession[]>
  getSchedule(): Promise<ScheduleItem[]>
  setSchedule(items: ScheduleItem[]): Promise<ScheduleItem[]>
  getPeSessions(): Promise<PEClassSession[]>
  setPeSessions(items: PEClassSession[]): Promise<PEClassSession[]>
  getUserPreferences(): Promise<UserPreferences>
  setUserPreferences(prefs: UserPreferences): Promise<UserPreferences>
  applySnapshot(snapshot: CompanionSnapshot): Promise<void>
  readSnapshotParts(): Promise<Omit<CompanionSnapshot, 'kind' | 'schemaVersion' | 'exportedAt' | 'appVersion'>>
}

export function createMemoryCompanionStore(): CompanionDataStore {
  let classes: ClassRecord[] = []
  let students: StudentRecord[] = []
  let testItems: TestItem[] = mergeBuiltinTestItems([]).items
  let peTests: PETestSession[] = []
  let schedule: ScheduleItem[] = []
  let peSessions: PEClassSession[] = []
  let preferences: UserPreferences = defaultUserPreferences()

  return {
    async getClasses() {
      return classes
    },
    async setClasses(items) {
      classes = items
      return classes
    },
    async getStudents() {
      return students
    },
    async setStudents(items) {
      students = items
      return students
    },
    async getTestItems() {
      return testItems.length > 0 ? testItems : BUILTIN_TEST_ITEMS
    },
    async setTestItems(items) {
      testItems = items
      return testItems
    },
    async getPeTests() {
      return peTests
    },
    async setPeTests(items) {
      peTests = items
      return peTests
    },
    async getSchedule() {
      return schedule
    },
    async setSchedule(items) {
      schedule = items
      return schedule
    },
    async getPeSessions() {
      return peSessions
    },
    async setPeSessions(items) {
      peSessions = items
      return peSessions
    },
    async getUserPreferences() {
      return preferences
    },
    async setUserPreferences(prefs) {
      preferences = prefs
      return preferences
    },
    async applySnapshot(snapshot) {
      classes = snapshot.classes
      students = snapshot.students
      testItems = mergeBuiltinTestItems(snapshot.testItems).items
      peTests = snapshot.peTests
      if (snapshot.schedule) {
        schedule = snapshot.schedule
      }
      if (snapshot.peSessions) {
        peSessions = snapshot.peSessions
      }
    },
    async readSnapshotParts() {
      return {
        classes,
        students,
        testItems: await this.getTestItems(),
        peTests,
        schedule,
        peSessions
      }
    }
  }
}
