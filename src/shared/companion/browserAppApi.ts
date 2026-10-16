import type { AppApi } from '../appApi/types'
import { unsupportedAppUpdateStatus } from '../appUpdate'
import { APP_VERSION } from '../appVersion'
import { parseClassRecords } from '../class/validate'
import { defaultAiModelConfig } from '../aiModel/config'
import { assertCollectionUnchanged } from '../persistence/collectionConflict'
import { findExistingPeSession } from '../peSession/workbenchToday'
import { parsePeSessions } from '../peSession/validate'
import { BUILTIN_TEST_ITEMS, mergeBuiltinTestItems } from '../peTest/builtinItems'
import { parsePeTestSessions, parseTestItems } from '../peTest/validate'
import { parseScheduleItems } from '../schedule/validate'
import { parseStudentRecords } from '../student/validate'
import { defaultUserPreferences, parseUserPreferences } from '../userPreferences'
import { buildCompanionSnapshot, parseCompanionSnapshot } from './parse'
import type { CompanionDataStore } from './store'

const DESKTOP_ONLY = '此功能仅在 Windows 桌面版可用。免费网页版支持查评分标准、查看/录入体育测试与手机同步。'

function desktopOnly(): never {
  throw new Error(DESKTOP_ONLY)
}

function healthyReport() {
  return {
    checkedAt: new Date().toISOString(),
    status: 'healthy' as const,
    issueCount: { info: 0, warning: 0, error: 0 },
    issues: []
  }
}

async function saveCollection<T>(
  load: () => Promise<T[]>,
  write: (items: T[]) => Promise<T[]>,
  items: T[],
  expected: T[]
): Promise<T[]> {
  assertCollectionUnchanged(await load(), expected)
  return write(items)
}

/** Browser / PWA host implementing AppApi against a CompanionDataStore. */
export function createBrowserAppApi(store: CompanionDataStore): AppApi {
  return {
    schedule: {
      get: () => store.getSchedule(),
      save: (items, expected) =>
        saveCollection(store.getSchedule, store.setSchedule, parseScheduleItems(items), expected),
      importPick: async () => desktopOnly(),
      importAnalyze: async () => desktopOnly(),
      importPreview: async () => desktopOnly(),
      importCommit: async () => desktopOnly(),
      importCancel: async () => desktopOnly()
    },
    classes: {
      get: () => store.getClasses(),
      save: (items, expected) =>
        saveCollection(store.getClasses, store.setClasses, parseClassRecords(items), expected)
    },
    students: {
      get: () => store.getStudents(),
      save: (items, expected) =>
        saveCollection(store.getStudents, store.setStudents, parseStudentRecords(items), expected),
      importPick: async () => desktopOnly(),
      importAnalyze: async () => desktopOnly(),
      importHeaders: async () => desktopOnly(),
      importPreview: async () => desktopOnly(),
      importCommit: async () => desktopOnly(),
      importCancel: async () => desktopOnly()
    },
    peSessions: {
      create: async (item) => {
        const parsed = parsePeSessions([item])[0]
        if (!parsed) {
          throw new Error('课堂记录无效')
        }
        const current = await store.getPeSessions()
        const existing = findExistingPeSession(current, parsed)
        if (existing) {
          return { session: existing, sessions: current }
        }
        if (current.some((session) => session.id === parsed.id)) {
          throw new Error('课堂 ID 已存在，不能改写历史身份')
        }
        const saved = await store.setPeSessions([...current, parsed])
        const created = saved.find((session) => session.id === parsed.id)
        if (!created) {
          throw new Error('课堂记录没有写入')
        }
        return { session: created, sessions: saved }
      },
      get: () => store.getPeSessions(),
      save: (items, expected) =>
        saveCollection(store.getPeSessions, store.setPeSessions, parsePeSessions(items), expected)
    },
    testItems: {
      get: async () => {
        const loaded = await store.getTestItems()
        const merged = mergeBuiltinTestItems(loaded.length > 0 ? loaded : BUILTIN_TEST_ITEMS)
        if (merged.added > 0 || merged.patched > 0 || loaded.length === 0) {
          await store.setTestItems(merged.items)
        }
        return merged.items
      },
      save: (items, expected) =>
        saveCollection(store.getTestItems, store.setTestItems, parseTestItems(items), expected)
    },
    peTests: {
      get: () => store.getPeTests(),
      save: (items, expected) =>
        saveCollection(store.getPeTests, store.setPeTests, parsePeTestSessions(items), expected),
      importExamBatch: async () => desktopOnly()
    },
    teachingPlans: {
      get: async () => [],
      save: async () => desktopOnly()
    },
    teachingDesigns: {
      get: async () => [],
      save: async () => desktopOnly(),
      generate: async () => desktopOnly(),
      cancelGeneration: async () => false,
      exportDocx: async () => desktopOnly()
    },
    aiModel: {
      getStatus: async () => ({
        config: defaultAiModelConfig(),
        hasApiKey: false,
        encryptionAvailable: false
      }),
      save: async () => desktopOnly(),
      test: async () => desktopOnly()
    },
    materials: {
      preview: async () => desktopOnly()
    },
    resources: {
      get: async () => [],
      selectFile: async () => desktopOnly(),
      cancelSelect: async () => undefined,
      importFile: async () => desktopOnly(),
      createNote: async () => desktopOnly(),
      createLink: async () => desktopOnly(),
      update: async () => desktopOnly(),
      delete: async () => desktopOnly(),
      open: async () => desktopOnly()
    },
    examBatch: {
      pick: async () => desktopOnly(),
      loadSheet: async () => desktopOnly(),
      cancel: async () => undefined,
      export: async () => desktopOnly(),
      saveWorkbook: async () => desktopOnly()
    },
    trainingTeams: {
      get: async () => [],
      save: async () => desktopOnly(),
      archive: async () => desktopOnly(),
      deleteCheck: async () => desktopOnly(),
      safeDelete: async () => desktopOnly()
    },
    trainingPlans: {
      get: async () => [],
      save: async () => desktopOnly(),
      generate: async () => desktopOnly(),
      cancelGeneration: async () => false
    },
    trainingMembers: {
      add: async () => desktopOnly(),
      get: async () => [],
      save: async () => desktopOnly()
    },
    trainingSessions: {
      get: async () => [],
      save: async () => desktopOnly(),
      record: async () => desktopOnly()
    },
    trainingItems: {
      get: async () => [],
      save: async () => desktopOnly()
    },
    trainingResults: {
      get: async () => [],
      save: async () => desktopOnly()
    },
    backup: {
      create: async () => desktopOnly(),
      restore: async () => desktopOnly()
    },
    dataIntegrity: {
      audit: async () => healthyReport(),
      startupStatus: async () => null,
      safeRepair: async () => ({
        ok: true,
        safetyBackupPath: null,
        repairedCount: 0,
        message: '网页版无需桌面数据修复。',
        reportAfter: healthyReport()
      })
    },
    userPreferences: {
      get: () => store.getUserPreferences(),
      save: async (input) => store.setUserPreferences(parseUserPreferences(input ?? defaultUserPreferences()))
    },
    appUpdate: {
      getStatus: async () => unsupportedAppUpdateStatus(APP_VERSION),
      checkForUpdates: async () => ({
        ...unsupportedAppUpdateStatus(APP_VERSION),
        state: 'not-available' as const,
        errorMessage: '网页版随网站更新，无需桌面安装包更新。'
      }),
      startDownload: async () => desktopOnly(),
      quitAndInstall: async () => desktopOnly()
    },
    companion: {
      getSnapshot: async () => {
        const parts = await store.readSnapshotParts()
        return buildCompanionSnapshot({
          appVersion: APP_VERSION,
          ...parts
        })
      },
      applySnapshot: async (payload) => {
        const snapshot = parseCompanionSnapshot(payload)
        await store.applySnapshot(snapshot)
        return {
          ok: true as const,
          message: `已导入手机同步包：班级 ${snapshot.classes.length}、学生 ${snapshot.students.length}、测试 ${snapshot.peTests.length}。本机网页数据已整表替换。`
        }
      },
      exportToFile: async () => desktopOnly(),
      importFromFile: async () => desktopOnly(),
      liveSyncStart: async () => desktopOnly(),
      liveSyncStop: async () => desktopOnly(),
      liveSyncStatus: async () => ({
        running: false,
        token: '',
        localUrl: '',
        publicUrl: null,
        revision: 0,
        tunnelError: null,
        connectedClients: 0
      })
    }
  }
}

export const COMPANION_DESKTOP_ONLY_MESSAGE = DESKTOP_ONLY
