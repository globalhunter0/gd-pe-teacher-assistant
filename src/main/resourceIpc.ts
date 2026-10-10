import { dialog, ipcMain } from 'electron'
import { IPC_CHANNELS } from '../shared/appApi'
import { extname } from 'node:path'
import { stat } from 'node:fs/promises'
import {
  ALLOWED_RESOURCE_EXTENSIONS,
  MAX_RESOURCE_FILE_BYTES
} from '../shared/resource/types'
import { isAllowedResourceExtension } from '../shared/resource/validate'
import { getMainWindow } from './mainWindow'
import {
  createLinkResource,
  createNoteResource,
  deleteResource,
  importFileResource,
  loadResources,
  openResource,
  updateResource
} from './resourceStore'

interface FilePickSession {
  filePath: string
  originalFileName: string
}

let filePick: FilePickSession | null = null

function dialogFilters(): Electron.FileFilter[] {
  const extensions = ALLOWED_RESOURCE_EXTENSIONS.map((item) => item.slice(1))
  return [
    { name: '教学资料', extensions },
    { name: '所有文件', extensions: ['*'] }
  ]
}

export function registerResourceIpc(): void {
  ipcMain.handle(IPC_CHANNELS.resources.get, async () => {
    return loadResources()
  })

  ipcMain.handle(IPC_CHANNELS.resources.selectFile, async () => {
    const owner = getMainWindow()
    const options: Electron.OpenDialogOptions = {
      title: '选择资料文件',
      properties: ['openFile'],
      filters: dialogFilters()
    }
    const picked = owner ? await dialog.showOpenDialog(owner, options) : await dialog.showOpenDialog(options)
    if (picked.canceled || !picked.filePaths[0]) {
      return { canceled: true as const }
    }

    const filePath = picked.filePaths[0]
    const extension = extname(filePath).toLowerCase()
    if (!isAllowedResourceExtension(extension)) {
      filePick = null
      throw new Error('不支持该文件类型')
    }

    const fileStat = await stat(filePath)
    if (!fileStat.isFile()) {
      filePick = null
      throw new Error('请选择一个文件')
    }
    if (fileStat.size > MAX_RESOURCE_FILE_BYTES) {
      filePick = null
      throw new Error('文件超过 200MB，请选择更小的文件')
    }

    const originalFileName = filePath.split(/[/\\]/).pop() ?? '未命名文件'
    filePick = { filePath, originalFileName }
    return { canceled: false as const, originalFileName }
  })

  ipcMain.handle(IPC_CHANNELS.resources.cancelSelect, async () => {
    filePick = null
  })

  ipcMain.handle(IPC_CHANNELS.resources.importFile, async (_event, input: unknown) => {
    if (!filePick) {
      throw new Error('请先选择文件')
    }

    const sourcePath = filePick.filePath
    const items = await importFileResource(sourcePath, input)
    filePick = null
    return items
  })

  ipcMain.handle(IPC_CHANNELS.resources.createNote, async (_event, input: unknown) => {
    return createNoteResource(input)
  })

  ipcMain.handle(IPC_CHANNELS.resources.createLink, async (_event, input: unknown) => {
    return createLinkResource(input)
  })

  ipcMain.handle(IPC_CHANNELS.resources.update, async (_event, id: unknown, input: unknown) => {
    return updateResource(id, input)
  })

  ipcMain.handle(IPC_CHANNELS.resources.delete, async (_event, id: unknown) => {
    return deleteResource(id)
  })

  ipcMain.handle(IPC_CHANNELS.resources.open, async (_event, id: unknown) => {
    await openResource(id)
  })
}
