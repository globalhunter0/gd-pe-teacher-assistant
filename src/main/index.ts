import { app, BrowserWindow, Menu, shell } from 'electron'
import { join } from 'node:path'
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

app.whenReady().then(() => {
  registerScheduleIpc()
  registerClassIpc()
  registerStudentIpc()
  registerPeSessionIpc()
  registerPeTestIpc()
  registerTeachingPlanIpc()
  registerResourceIpc()
  assertBuiltinExamCatalog()
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
