import { app, BrowserWindow, Menu, shell } from 'electron'
import { join } from 'node:path'
import { registerClassIpc } from './classIpc'
import { getClassFilePath, loadClasses } from './classStore'
import { registerScheduleIpc } from './scheduleIpc'
import { getScheduleFilePath, loadSchedule } from './scheduleStore'

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
  void loadSchedule().then((items) => {
    console.log(`[schedule] ${items.length} 节课程，文件：${getScheduleFilePath()}`)
  })
  void loadClasses().then((items) => {
    console.log(`[classes] ${items.length} 个班级，文件：${getClassFilePath()}`)
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
