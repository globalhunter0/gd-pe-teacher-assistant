import { dialog, ipcMain } from 'electron'
import { readFile, writeFile } from 'node:fs/promises'
import { IPC_CHANNELS } from '../shared/appApi'
import { APP_VERSION } from '../shared/appVersion'
import {
  buildCompanionSnapshot,
  companionSnapshotFileName,
  parseCompanionSnapshot,
  serializeCompanionSnapshot
} from '../shared/companion'
import { getMainWindow } from './mainWindow'
import { loadClasses, saveClasses } from './classStore'
import { loadPeTests, savePeTests } from './peTestStore'
import { loadStudents, saveStudents } from './studentStore'
import { loadTestItems, saveTestItems } from './testItemStore'

async function loadCompanionSnapshot() {
  const [classes, students, testItems, peTests] = await Promise.all([
    loadClasses(),
    loadStudents(),
    loadTestItems(),
    loadPeTests()
  ])
  return buildCompanionSnapshot({
    appVersion: APP_VERSION,
    classes,
    students,
    testItems,
    peTests
  })
}

async function applyCompanionSnapshot(payload: unknown): Promise<{ ok: true; message: string }> {
  const snapshot = parseCompanionSnapshot(payload)
  const classes = await saveClasses(snapshot.classes)
  const testItems = await saveTestItems(snapshot.testItems)
  const classIds = new Set(classes.map((item) => item.id))
  const itemIds = new Set(testItems.map((item) => item.id))
  await saveStudents(snapshot.students, classIds)
  await savePeTests(snapshot.peTests, classIds, itemIds)
  return {
    ok: true,
    message: `已导入手机同步包：班级 ${snapshot.classes.length}、学生 ${snapshot.students.length}、测试 ${snapshot.peTests.length}。对应数据已整表替换。`
  }
}

export function registerCompanionIpc(): void {
  ipcMain.handle(IPC_CHANNELS.companion.getSnapshot, async () => loadCompanionSnapshot())

  ipcMain.handle(IPC_CHANNELS.companion.applySnapshot, async (_event, payload: unknown) =>
    applyCompanionSnapshot(payload)
  )

  ipcMain.handle(IPC_CHANNELS.companion.exportToFile, async () => {
    const snapshot = await loadCompanionSnapshot()
    const owner = getMainWindow()
    const options = {
      title: '导出手机同步包',
      defaultPath: companionSnapshotFileName(snapshot.exportedAt),
      filters: [{ name: '手机同步包', extensions: ['json'] }]
    }
    const picked = owner ? await dialog.showSaveDialog(owner, options) : await dialog.showSaveDialog(options)
    if (picked.canceled || !picked.filePath) {
      return { canceled: true as const }
    }
    await writeFile(picked.filePath, serializeCompanionSnapshot(snapshot), 'utf8')
    return { canceled: false as const, filePath: picked.filePath }
  })

  ipcMain.handle(IPC_CHANNELS.companion.importFromFile, async () => {
    const owner = getMainWindow()
    const options = {
      title: '选择手机同步包',
      properties: ['openFile'] as Array<'openFile'>,
      filters: [{ name: '手机同步包', extensions: ['json'] }]
    }
    const picked = owner ? await dialog.showOpenDialog(owner, options) : await dialog.showOpenDialog(options)
    if (picked.canceled || !picked.filePaths[0]) {
      return { canceled: true as const }
    }
    const raw = await readFile(picked.filePaths[0], 'utf8')
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      throw new Error('手机同步包不是有效的 JSON 文件')
    }
    const result = await applyCompanionSnapshot(parsed)
    return { canceled: false as const, message: result.message }
  })
}
