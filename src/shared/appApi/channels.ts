export const IPC_CHANNELS = {
  schedule: {
    get: 'schedule:get',
    save: 'schedule:save',
    importPick: 'schedule:importPick',
    importAnalyze: 'schedule:importAnalyze',
    importPreview: 'schedule:importPreview',
    importCommit: 'schedule:importCommit',
    importCancel: 'schedule:importCancel'
  },
  classes: {
    get: 'classes:get',
    save: 'classes:save'
  },
  students: {
    get: 'students:get',
    save: 'students:save',
    importPick: 'students:importPick',
    importAnalyze: 'students:importAnalyze',
    importHeaders: 'students:importHeaders',
    importPreview: 'students:importPreview',
    importCommit: 'students:importCommit',
    importCancel: 'students:importCancel'
  },
  peSessions: {
    create: 'peSessions:create',
    get: 'peSessions:get',
    save: 'peSessions:save'
  },
  testItems: {
    get: 'testItems:get',
    save: 'testItems:save'
  },
  peTests: {
    get: 'peTests:get',
    save: 'peTests:save',
    importExamBatch: 'peTests:importExamBatch'
  },
  teachingPlans: {
    get: 'teachingPlans:get',
    save: 'teachingPlans:save'
  },
  teachingDesigns: {
    get: 'teachingDesigns:get',
    save: 'teachingDesigns:save'
  },
  aiModel: {
    getStatus: 'aiModel:getStatus',
    save: 'aiModel:save',
    test: 'aiModel:test'
  },
  materials: {
    preview: 'materials:preview'
  },
  resources: {
    get: 'resources:get',
    selectFile: 'resources:selectFile',
    cancelSelect: 'resources:cancelSelect',
    importFile: 'resources:importFile',
    createNote: 'resources:createNote',
    createLink: 'resources:createLink',
    update: 'resources:update',
    delete: 'resources:delete',
    open: 'resources:open'
  },
  examBatch: {
    pick: 'examBatch:pick',
    loadSheet: 'examBatch:loadSheet',
    cancel: 'examBatch:cancel',
    export: 'examBatch:export',
    saveWorkbook: 'examBatch:saveWorkbook'
  },
  trainingTeams: {
    get: 'trainingTeams:get',
    save: 'trainingTeams:save',
    archive: 'trainingTeams:archive',
    deleteCheck: 'trainingTeams:deleteCheck',
    safeDelete: 'trainingTeams:safeDelete'
  },
  trainingPlans: {
    get: 'trainingPlans:get',
    save: 'trainingPlans:save'
  },
  trainingMembers: {
    add: 'trainingMembers:add',
    get: 'trainingMembers:get',
    save: 'trainingMembers:save'
  },
  trainingSessions: {
    get: 'trainingSessions:get',
    save: 'trainingSessions:save',
    record: 'trainingSessions:record'
  },
  trainingItems: {
    get: 'trainingItems:get',
    save: 'trainingItems:save'
  },
  trainingResults: {
    get: 'trainingResults:get',
    save: 'trainingResults:save'
  },
  backup: {
    create: 'backup:create',
    restore: 'backup:restore'
  },
  dataIntegrity: {
    audit: 'dataIntegrity:audit',
    startupStatus: 'dataIntegrity:startupStatus',
    safeRepair: 'dataIntegrity:safeRepair'
  },
  userPreferences: {
    get: 'userPreferences:get',
    save: 'userPreferences:save'
  },
  appUpdate: {
    getStatus: 'appUpdate:getStatus',
    checkForUpdates: 'appUpdate:checkForUpdates',
    startDownload: 'appUpdate:startDownload',
    quitAndInstall: 'appUpdate:quitAndInstall'
  }
} as const

export type IpcDomain = keyof typeof IPC_CHANNELS

export type IpcChannel = {
  [Domain in IpcDomain]: (typeof IPC_CHANNELS)[Domain][keyof (typeof IPC_CHANNELS)[Domain]]
}[IpcDomain]

export const ALL_IPC_CHANNELS: readonly IpcChannel[] = Object.values(IPC_CHANNELS).flatMap((group) =>
  Object.values(group)
) as IpcChannel[]
