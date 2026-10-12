import { IPC_CHANNELS } from './channels'
import type { AppApi } from './types'

export type AppApiInvoke = <T>(channel: string, ...args: unknown[]) => Promise<T>

/** Build the desktop IPC client. A mobile host can implement AppApi without this helper. */
export function createAppApi(invoke: AppApiInvoke): AppApi {
  return {
    schedule: {
      get: () => invoke(IPC_CHANNELS.schedule.get),
      save: (items, expected) => invoke(IPC_CHANNELS.schedule.save, items, expected),
      importPick: () => invoke(IPC_CHANNELS.schedule.importPick),
      importAnalyze: (sessionId) => invoke(IPC_CHANNELS.schedule.importAnalyze, sessionId),
      importPreview: (sessionId, mapping, resolutions) =>
        invoke(IPC_CHANNELS.schedule.importPreview, sessionId, mapping, resolutions),
      importCommit: (sessionId, mapping, resolutions) =>
        invoke(IPC_CHANNELS.schedule.importCommit, sessionId, mapping, resolutions),
      importCancel: () => invoke(IPC_CHANNELS.schedule.importCancel)
    },
    classes: {
      get: () => invoke(IPC_CHANNELS.classes.get),
      save: (items, expected) => invoke(IPC_CHANNELS.classes.save, items, expected)
    },
    students: {
      get: () => invoke(IPC_CHANNELS.students.get),
      save: (items, expected) => invoke(IPC_CHANNELS.students.save, items, expected),
      importPick: () => invoke(IPC_CHANNELS.students.importPick),
      importAnalyze: (sessionId) => invoke(IPC_CHANNELS.students.importAnalyze, sessionId),
      importHeaders: (sessionId, sheetName) => invoke(IPC_CHANNELS.students.importHeaders, sessionId, sheetName),
      importPreview: (sessionId, sheetName, mapping, context) =>
        invoke(IPC_CHANNELS.students.importPreview, sessionId, sheetName, mapping, context),
      importCommit: (sessionId, sheetName, mapping, context) =>
        invoke(IPC_CHANNELS.students.importCommit, sessionId, sheetName, mapping, context),
      importCancel: () => invoke(IPC_CHANNELS.students.importCancel)
    },
    peSessions: {
      create: (item) => invoke(IPC_CHANNELS.peSessions.create, item),
      get: () => invoke(IPC_CHANNELS.peSessions.get),
      save: (items, expected) => invoke(IPC_CHANNELS.peSessions.save, items, expected)
    },
    testItems: {
      get: () => invoke(IPC_CHANNELS.testItems.get),
      save: (items, expected) => invoke(IPC_CHANNELS.testItems.save, items, expected)
    },
    peTests: {
      get: () => invoke(IPC_CHANNELS.peTests.get),
      save: (items, expected) => invoke(IPC_CHANNELS.peTests.save, items, expected),
      importExamBatch: (payload) => invoke(IPC_CHANNELS.peTests.importExamBatch, payload)
    },
    teachingPlans: {
      get: () => invoke(IPC_CHANNELS.teachingPlans.get),
      save: (items, expected) => invoke(IPC_CHANNELS.teachingPlans.save, items, expected)
    },
    teachingDesigns: {
      get: () => invoke(IPC_CHANNELS.teachingDesigns.get),
      save: (items, expected) => invoke(IPC_CHANNELS.teachingDesigns.save, items, expected)
    },
    aiModel: {
      getStatus: () => invoke(IPC_CHANNELS.aiModel.getStatus),
      save: (input) => invoke(IPC_CHANNELS.aiModel.save, input),
      test: (input) => invoke(IPC_CHANNELS.aiModel.test, input)
    },
    materials: {
      preview: (resourceIds) => invoke(IPC_CHANNELS.materials.preview, resourceIds)
    },
    resources: {
      get: () => invoke(IPC_CHANNELS.resources.get),
      selectFile: () => invoke(IPC_CHANNELS.resources.selectFile),
      cancelSelect: () => invoke(IPC_CHANNELS.resources.cancelSelect),
      importFile: (input) => invoke(IPC_CHANNELS.resources.importFile, input),
      createNote: (input) => invoke(IPC_CHANNELS.resources.createNote, input),
      createLink: (input) => invoke(IPC_CHANNELS.resources.createLink, input),
      update: (id, input) => invoke(IPC_CHANNELS.resources.update, id, input),
      delete: (id) => invoke(IPC_CHANNELS.resources.delete, id),
      open: (id) => invoke(IPC_CHANNELS.resources.open, id)
    },
    examBatch: {
      pick: () => invoke(IPC_CHANNELS.examBatch.pick),
      loadSheet: (sessionId, sheetName) => invoke(IPC_CHANNELS.examBatch.loadSheet, sessionId, sheetName),
      cancel: () => invoke(IPC_CHANNELS.examBatch.cancel),
      export: (payload) => invoke(IPC_CHANNELS.examBatch.export, payload),
      saveWorkbook: (payload) => invoke(IPC_CHANNELS.examBatch.saveWorkbook, payload)
    },
    trainingTeams: {
      get: () => invoke(IPC_CHANNELS.trainingTeams.get),
      save: (items, expected) => invoke(IPC_CHANNELS.trainingTeams.save, items, expected),
      archive: (teamId) => invoke(IPC_CHANNELS.trainingTeams.archive, teamId),
      deleteCheck: (teamId) => invoke(IPC_CHANNELS.trainingTeams.deleteCheck, teamId),
      safeDelete: (teamId) => invoke(IPC_CHANNELS.trainingTeams.safeDelete, teamId)
    },
    trainingPlans: {
      get: () => invoke(IPC_CHANNELS.trainingPlans.get),
      save: (items, expected) => invoke(IPC_CHANNELS.trainingPlans.save, items, expected)
    },
    trainingMembers: {
      add: (items) => invoke(IPC_CHANNELS.trainingMembers.add, items),
      get: () => invoke(IPC_CHANNELS.trainingMembers.get),
      save: (items, expected) => invoke(IPC_CHANNELS.trainingMembers.save, items, expected)
    },
    trainingSessions: {
      get: () => invoke(IPC_CHANNELS.trainingSessions.get),
      save: (items, expected) => invoke(IPC_CHANNELS.trainingSessions.save, items, expected),
      record: (session, results) => invoke(IPC_CHANNELS.trainingSessions.record, session, results)
    },
    trainingItems: {
      get: () => invoke(IPC_CHANNELS.trainingItems.get),
      save: (items, expected) => invoke(IPC_CHANNELS.trainingItems.save, items, expected)
    },
    trainingResults: {
      get: () => invoke(IPC_CHANNELS.trainingResults.get),
      save: (items, expected) => invoke(IPC_CHANNELS.trainingResults.save, items, expected)
    },
    backup: {
      create: () => invoke(IPC_CHANNELS.backup.create),
      restore: () => invoke(IPC_CHANNELS.backup.restore)
    },
    dataIntegrity: {
      audit: () => invoke(IPC_CHANNELS.dataIntegrity.audit),
      startupStatus: () => invoke(IPC_CHANNELS.dataIntegrity.startupStatus),
      safeRepair: () => invoke(IPC_CHANNELS.dataIntegrity.safeRepair)
    },
    userPreferences: {
      get: () => invoke(IPC_CHANNELS.userPreferences.get),
      save: (input) => invoke(IPC_CHANNELS.userPreferences.save, input)
    },
    appUpdate: {
      getStatus: () => invoke(IPC_CHANNELS.appUpdate.getStatus),
      checkForUpdates: () => invoke(IPC_CHANNELS.appUpdate.checkForUpdates),
      startDownload: () => invoke(IPC_CHANNELS.appUpdate.startDownload),
      quitAndInstall: () => invoke(IPC_CHANNELS.appUpdate.quitAndInstall)
    }
  }
}
