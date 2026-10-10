import { dialog, ipcMain } from 'electron'
import { IPC_CHANNELS } from '../shared/appApi'
import { APP_RELEASE_VERSION, BACKUP_FILE_EXTENSION } from '../shared/backup/types'
import { createDataBackup, restoreDataBackup } from '../shared/backup/service'
import { getMainWindow } from './mainWindow'
import { getUserDataRoot } from './userDataPaths'

function defaultBackupName(): string {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  return `体育教师助手备份-${stamp}.${BACKUP_FILE_EXTENSION}`
}

export function registerBackupIpc(): void {
  ipcMain.handle(IPC_CHANNELS.backup.create, async () => {
    const owner = getMainWindow()
    const options = {
      title: '保存数据备份',
      defaultPath: defaultBackupName(),
      filters: [{ name: '数据备份', extensions: [BACKUP_FILE_EXTENSION] }]
    }
    const picked = owner ? await dialog.showSaveDialog(owner, options) : await dialog.showSaveDialog(options)
    if (picked.canceled || !picked.filePath) {
      return { canceled: true as const }
    }

    const result = await createDataBackup(getUserDataRoot(), picked.filePath, APP_RELEASE_VERSION)
    return {
      canceled: false as const,
      filePath: result.archivePath,
      fileCount: result.fileCount,
      createdAt: result.manifest.createdAt
    }
  })

  ipcMain.handle(IPC_CHANNELS.backup.restore, async () => {
    const owner = getMainWindow()
    const options = {
      title: '选择数据备份',
      properties: ['openFile'] as Array<'openFile'>,
      filters: [{ name: '数据备份', extensions: [BACKUP_FILE_EXTENSION, 'zip'] }]
    }
    const picked = owner ? await dialog.showOpenDialog(owner, options) : await dialog.showOpenDialog(options)
    if (picked.canceled || !picked.filePaths[0]) {
      return { canceled: true as const }
    }

    const result = await restoreDataBackup(getUserDataRoot(), picked.filePaths[0], {
      appVersion: APP_RELEASE_VERSION
    })
    return {
      canceled: false as const,
      safetyBackupPath: result.safetyBackupPath,
      restoredCount: result.restoredCount,
      keptPaths: result.keptPaths
    }
  })
}
