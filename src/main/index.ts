import { app, BrowserWindow, Menu } from 'electron'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { initializeUserData } from '../shared/persistence/initializeUserData'
import { registerStartupDiagnostics, showStartupFailure } from './startupDiagnostics'
import { registerClassIpc } from './classIpc'
import { getClassFilePath, loadClasses } from './classStore'
import { setMainWindow } from './mainWindow'
import { registerScheduleIpc } from './scheduleIpc'
import { getScheduleFilePath, loadSchedule } from './scheduleStore'
import { registerPeSessionIpc } from './peSessionIpc'
import { getPeSessionFilePath, loadPeSessions } from './peSessionStore'
import { registerPeTestIpc } from './peTestIpc'
import { getPeTestFilePath, loadPeTests } from './peTestStore'
import { registerStudentIpc } from './studentIpc'
import { getStudentFilePath, loadStudents } from './studentStore'
import { getTestItemFilePath, loadTestItems } from './testItemStore'
import { registerTeachingPlanIpc } from './teachingPlanIpc'
import { getTeachingPlanFilePath, loadTeachingPlans } from './teachingPlanStore'
import { registerTeachingDesignIpc } from './teachingDesignIpc'
import { getTeachingDesignFilePath, loadTeachingDesigns } from './teachingDesignStore'
import { registerResourceIpc } from './resourceIpc'
import { getResourceMetaPath, loadResources } from './resourceStore'
import { registerExamBatchIpc } from './examBatchIpc'
import { registerTrainingIpc } from './trainingIpc'
import { registerBackupIpc } from './backupIpc'
import { registerDataIntegrityIpc } from './dataIntegrityIpc'
import { buildAndRunStartupHealthCheck } from './dataIntegrityService'
import { registerUserPreferencesIpc } from './userPreferencesIpc'
import { registerAppUpdateIpc } from './appUpdateIpc'
import { scheduleStartupUpdateCheck } from './appUpdateService'
import { APP_UPDATE_STARTUP_CHECK_DELAY_MS } from '../shared/appUpdate'
import {
  getTrainingItemFilePath,
  getTrainingMemberFilePath,
  getTrainingPlanFilePath,
  getTrainingResultFilePath,
  getTrainingSessionFilePath,
  getTrainingTeamFilePath,
  loadTrainingItems,
  loadTrainingMembers,
  loadTrainingPlans,
  loadTrainingResults,
  loadTrainingSessions,
  loadTrainingTeams
} from './trainingStore'
import { recoverPendingTransactions } from '../shared/persistence/diskTransaction'

import { getUserDataRoot } from './userDataPaths'
import { installMainWindowNavigationGuards } from './windowGuards'
import { assertBuiltinExamCatalog } from '@shared/examStandard'

// Explicit isolated smoke mode; a missing sentinel fails before any business access.
const testRoot = process.env.GDPE_RC_TEST_ROOT
if (testRoot) {
  const target = resolve(testRoot)
  if (!existsSync(join(target, '.rc-test-root')) || readFileSync(join(target, '.rc-test-root'), 'utf8') !== 'isolated-rc-test' || target === resolve(app.getPath('userData'))) {
    throw new Error('Invalid isolated RC test directory')
  }
  app.setPath('userData', target)
  app.setPath('sessionData', join(target, 'chromium'))
}
registerStartupDiagnostics()

function createMainWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    title: '广东省初中体育教师管理助手',
    backgroundColor: '#f3f3f3',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  })

  mainWindow.webContents.on('did-fail-load', (_event, code, _description, _url, isMainFrame) => {
    if (isMainFrame && code !== -3) void showStartupFailure('renderer-load-failed', new Error('Renderer load failed'))
  })
  mainWindow.webContents.on('render-process-gone', () => { void showStartupFailure('renderer-process-gone', new Error('Renderer exited')) })
  mainWindow.webContents.on('preload-error', (_event, _path, error) => { void showStartupFailure('preload-failed', error) })
  setMainWindow(mainWindow)
  mainWindow.on('closed', () => {
    setMainWindow(null)
  })

  Menu.setApplicationMenu(null)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    scheduleStartupUpdateCheck(APP_UPDATE_STARTUP_CHECK_DELAY_MS)
  })

  installMainWindowNavigationGuards(mainWindow.webContents, {
    devServerUrl: process.env.ELECTRON_RENDERER_URL,
    rendererFileUrl: pathToFileURL(join(__dirname, '../renderer/index.html')).href
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

const ownsDataLock = app.requestSingleInstanceLock()
if (!ownsDataLock) app.quit()

app.whenReady().then(async () => {
  if (!ownsDataLock) return
  await recoverPendingTransactions(getUserDataRoot())
  await initializeUserData(getUserDataRoot())
  registerScheduleIpc()
  registerClassIpc()
  registerStudentIpc()
  registerPeSessionIpc()
  registerPeTestIpc()
  registerTeachingPlanIpc()
  registerTeachingDesignIpc()
  registerResourceIpc()
  registerExamBatchIpc()
  registerTrainingIpc()
  registerBackupIpc()
  registerDataIntegrityIpc()
  registerUserPreferencesIpc()
  registerAppUpdateIpc()
  assertBuiltinExamCatalog()
  await buildAndRunStartupHealthCheck().then((report) => {
    if (report.status === 'healthy') {
      console.log('[data-integrity] startup health: healthy')
    } else {
      console.warn(
        `[data-integrity] startup health: ${report.status} (error=${report.issueCount.error}, warning=${report.issueCount.warning})`
      )
    }
  })
  void loadSchedule().then((items) => {
    console.log(`[schedule] ${items.length} 节课程，文件：${getScheduleFilePath()}`)
  })
  void loadClasses().then((items) => {
    console.log(`[classes] ${items.length} 个班级，文件：${getClassFilePath()}`)
  })
  void loadStudents().then((items) => {
    console.log(`[students] ${items.length} 名学生，文件：${getStudentFilePath()}`)
  })
  void loadPeSessions().then((items) => {
    console.log(`[pe-sessions] ${items.length} 节课堂记录，文件：${getPeSessionFilePath()}`)
  })
  void loadTestItems().then((items) => {
    console.log(`[test-items] ${items.length} 个测试项目，文件：${getTestItemFilePath()}`)
  })
  void loadPeTests().then((items) => {
    console.log(`[pe-tests] ${items.length} 次体育测试，文件：${getPeTestFilePath()}`)
  })
  void loadTeachingPlans().then((items) => {
    console.log(`[teaching-plans] ${items.length} 份教学计划，文件：${getTeachingPlanFilePath()}`)
  })
  void loadTeachingDesigns().then((items) => {
    console.log(`[teaching-designs] ${items.length} 份教学设计，文件：${getTeachingDesignFilePath()}`)
  })
  void loadResources().then((items) => {
    console.log(`[resources] ${items.length} 条资料，文件：${getResourceMetaPath()}`)
  })
  void loadTrainingTeams().then((items) => {
    console.log(`[training-teams] ${items.length} 支训练队，文件：${getTrainingTeamFilePath()}`)
  })
  void loadTrainingMembers().then((items) => {
    console.log(`[training-members] ${items.length} 条队员关系，文件：${getTrainingMemberFilePath()}`)
  })
  void loadTrainingPlans().then((items) => {
    console.log(`[training-plans] ${items.length} 条训练计划，文件：${getTrainingPlanFilePath()}`)
  })
  void loadTrainingSessions().then((items) => {
    console.log(`[training-sessions] ${items.length} 次训练，文件：${getTrainingSessionFilePath()}`)
  })
  void loadTrainingItems().then((items) => {
    console.log(`[training-items] ${items.length} 个训练项目，文件：${getTrainingItemFilePath()}`)
  })
  void loadTrainingResults().then((items) => {
    console.log(`[training-results] ${items.length} 条训练成绩，文件：${getTrainingResultFilePath()}`)
  })
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
}).catch(async error => {
  await showStartupFailure('main-startup-failed', error)
  app.quit()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
