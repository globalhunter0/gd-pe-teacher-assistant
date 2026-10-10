import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../shared/appApi'
import { APP_UPDATE_STATUS_EVENT, parseAppUpdateStatus } from '../shared/appUpdate'
import {
  checkForUpdates,
  getAppUpdateStatus,
  quitAndInstall,
  startDownload,
  subscribeAppUpdateStatus
} from './appUpdateService'
import { getMainWindow } from './mainWindow'

function publishStatus(status: ReturnType<typeof getAppUpdateStatus>): void {
  const window = getMainWindow()
  if (!window || window.isDestroyed() || window.webContents.isDestroyed()) {
    return
  }
  window.webContents.send(APP_UPDATE_STATUS_EVENT, parseAppUpdateStatus(status))
}

export function registerAppUpdateIpc(): void {
  subscribeAppUpdateStatus(publishStatus)
  ipcMain.handle(IPC_CHANNELS.appUpdate.getStatus, async () => {
    return parseAppUpdateStatus(getAppUpdateStatus())
  })
  ipcMain.handle(IPC_CHANNELS.appUpdate.checkForUpdates, async () => {
    return parseAppUpdateStatus(await checkForUpdates())
  })
  ipcMain.handle(IPC_CHANNELS.appUpdate.startDownload, async () => {
    return parseAppUpdateStatus(await startDownload())
  })
  ipcMain.handle(IPC_CHANNELS.appUpdate.quitAndInstall, async () => {
    await quitAndInstall()
  })
}
