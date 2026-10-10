import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../shared/appApi'
import { parseAppUpdateStatus } from '../shared/appUpdate'
import {
  checkForUpdates,
  getAppUpdateStatus,
  quitAndInstall,
  startDownload
} from './appUpdateService'

export function registerAppUpdateIpc(): void {
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
