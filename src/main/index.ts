import { app, BrowserWindow, Menu, shell } from 'electron'
import { join } from 'node:path'
import { inspect } from 'node:util'
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
import { registerResourceIpc } from './resourceIpc'
import { getResourceMetaPath, loadResources } from './resourceStore'
import { registerExamBatchIpc } from './examBatchIpc'
import { registerTrainingIpc } from './trainingIpc'
import { registerBackupIpc } from './backupIpc'
import { registerDataIntegrityIpc } from './dataIntegrityIpc'
import { buildAndRunStartupHealthCheck } from './dataIntegrityService'
import { registerUserPreferencesIpc } from './userPreferencesIpc'
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
import { replaceFileAtomic } from '../shared/persistence/atomicFile'
import { getUserDataRoot } from './userDataPaths'
import { assertBuiltinExamCatalog } from '@shared/examStandard'

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

  setMainWindow(mainWindow)
  mainWindow.on('closed', () => {
    setMainWindow(null)
  })

  Menu.setApplicationMenu(null)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url)
    return { action: 'deny' }
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
  try {
    await recoverPendingTransactions(getUserDataRoot())
  } catch (error) {
    console.error('[data-safety] startup recovery blocked', error)
    try {
      await replaceFileAtomic(
        join(getUserDataRoot(), 'data-safety-startup-error.log'),
        `${new Date().toISOString()}\n${inspect(error, { depth: 8 })}\n`
      )
    } catch (logError) {
      console.error('[data-safety] failed to persist recovery diagnostic', logError)
    }
    app.quit()
    return
  }
  registerScheduleIpc()
  registerClassIpc()
  registerStudentIpc()
  registerPeSessionIpc()
  registerPeTestIpc()
  registerTeachingPlanIpc()
  registerResourceIpc()
  registerExamBatchIpc()
  registerTrainingIpc()
  registerBackupIpc()
  registerDataIntegrityIpc()
  registerUserPreferencesIpc()
  assertBuiltinExamCatalog()
  void buildAndRunStartupHealthCheck().then((report) => {
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
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
