import type { ClassRecord } from '@shared/class/types'
import type { CompanionDataStore, CompanionSnapshot } from '@shared/companion'
import { BUILTIN_TEST_ITEMS, mergeBuiltinTestItems } from '@shared/peTest/builtinItems'
import type { PEClassSession } from '@shared/peSession/types'
import type { PETestSession, TestItem } from '@shared/peTest'
import type { ScheduleItem } from '@shared/schedule/types'
import type { StudentRecord } from '@shared/student'
import { defaultUserPreferences, type UserPreferences } from '@shared/userPreferences'

const DB_NAME = 'gdpe-companion'
const DB_VERSION = 1
const STORE_NAME = 'kv'

type KvKey =
  | 'classes'
  | 'students'
  | 'testItems'
  | 'peTests'
  | 'schedule'
  | 'peSessions'
  | 'userPreferences'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB 打开失败'))
  })
}

async function idbGet<T>(key: KvKey): Promise<T | undefined> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(key)
    req.onsuccess = () => resolve(req.result as T | undefined)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB 读取失败'))
  })
}

async function idbSet(key: KvKey, value: unknown): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB 写入失败'))
  })
}

export function createIdbCompanionStore(): CompanionDataStore {
  return {
    async getClasses() {
      return (await idbGet<ClassRecord[]>('classes')) ?? []
    },
    async setClasses(items) {
      await idbSet('classes', items)
      return items
    },
    async getStudents() {
      return (await idbGet<StudentRecord[]>('students')) ?? []
    },
    async setStudents(items) {
      await idbSet('students', items)
      return items
    },
    async getTestItems() {
      const loaded = await idbGet<TestItem[]>('testItems')
      if (!loaded || loaded.length === 0) {
        return BUILTIN_TEST_ITEMS
      }
      return loaded
    },
    async setTestItems(items) {
      await idbSet('testItems', items)
      return items
    },
    async getPeTests() {
      return (await idbGet<PETestSession[]>('peTests')) ?? []
    },
    async setPeTests(items) {
      await idbSet('peTests', items)
      return items
    },
    async getSchedule() {
      return (await idbGet<ScheduleItem[]>('schedule')) ?? []
    },
    async setSchedule(items) {
      await idbSet('schedule', items)
      return items
    },
    async getPeSessions() {
      return (await idbGet<PEClassSession[]>('peSessions')) ?? []
    },
    async setPeSessions(items) {
      await idbSet('peSessions', items)
      return items
    },
    async getUserPreferences() {
      return (await idbGet<UserPreferences>('userPreferences')) ?? defaultUserPreferences()
    },
    async setUserPreferences(prefs) {
      await idbSet('userPreferences', prefs)
      return prefs
    },
    async applySnapshot(snapshot: CompanionSnapshot) {
      const mergedItems = mergeBuiltinTestItems(snapshot.testItems).items
      await idbSet('classes', snapshot.classes)
      await idbSet('students', snapshot.students)
      await idbSet('testItems', mergedItems)
      await idbSet('peTests', snapshot.peTests)
    },
    async readSnapshotParts() {
      return {
        classes: await this.getClasses(),
        students: await this.getStudents(),
        testItems: mergeBuiltinTestItems(await this.getTestItems()).items,
        peTests: await this.getPeTests()
      }
    }
  }
}
