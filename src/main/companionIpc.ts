import { app, dialog, ipcMain } from 'electron'
import { join } from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'
import { IPC_CHANNELS } from '../shared/appApi'
import { APP_VERSION } from '../shared/appVersion'
import {
  buildCompanionSnapshot,
  companionSnapshotFileName,
  createLiveSyncToken,
  normalizeLiveSyncToken,
  parseCompanionSnapshot,
  serializeCompanionSnapshot,
  type CompanionLiveSyncStatus
} from '../shared/companion'
import { startCompanionLiveServer, type CompanionLiveServer } from '../shared/companion/liveSyncServer'
import { startCloudflareTunnel } from './companionLiveTunnel'
import { getMainWindow } from './mainWindow'
import { loadClasses, saveClasses } from './classStore'
import { loadPeSessions, savePeSessions } from './peSessionStore'
import { loadPeTests, savePeTests } from './peTestStore'
import { loadSchedule, saveSchedule } from './scheduleStore'
import { loadStudents, saveStudents } from './studentStore'
import { loadTestItems, saveTestItems } from './testItemStore'

async function loadCompanionSnapshot() {
  const [classes, students, testItems, peTests, schedule, peSessions] = await Promise.all([
    loadClasses(),
    loadStudents(),
    loadTestItems(),
    loadPeTests(),
    loadSchedule(),
    loadPeSessions()
  ])
  return buildCompanionSnapshot({
    appVersion: APP_VERSION,
    classes,
    students,
    testItems,
    peTests,
    schedule,
    peSessions
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
  if (snapshot.schedule) {
    await saveSchedule(snapshot.schedule)
  }
  if (snapshot.peSessions) {
    await savePeSessions(snapshot.peSessions, classIds)
  }
  const extra =
    snapshot.schedule || snapshot.peSessions
      ? `课表 ${snapshot.schedule?.length ?? 0} 节、课堂 ${snapshot.peSessions?.length ?? 0} 条。`
      : ''
  return {
    ok: true,
    message: `已导入手机同步包：班级 ${snapshot.classes.length}、学生 ${snapshot.students.length}、测试 ${snapshot.peTests.length}。${extra}对应数据已整表替换。`
  }
}

const stoppedLiveSync: CompanionLiveSyncStatus = {
  running: false,
  token: '',
  localUrl: '',
  publicUrl: null,
  revision: 0,
  tunnelError: null,
  connectedClients: 0
}

let liveServer: CompanionLiveServer | null = null
let stopTunnel: (() => void) | null = null

async function readOrCreateLiveToken(): Promise<string> {
  const file = join(app.getPath('userData'), 'companion-live-token.txt')
  try {
    const existing = (await readFile(file, 'utf8')).trim()
    if (normalizeLiveSyncToken(existing).length === 12) {
      return existing
    }
  } catch {
    // create a new code below
  }
  const token = createLiveSyncToken()
  await writeFile(file, `${token}\n`, 'utf8')
  return token
}

async function stopLiveSync(): Promise<CompanionLiveSyncStatus> {
  stopTunnel?.()
  stopTunnel = null
  const current = liveServer
  liveServer = null
  await current?.stop()
  return stoppedLiveSync
}

async function startLiveSync(): Promise<CompanionLiveSyncStatus> {
  if (liveServer) {
    return liveServer.status()
  }
  const token = await readOrCreateLiveToken()
  const server = await startCompanionLiveServer({
    token,
    load: loadCompanionSnapshot,
    apply: async (snapshot) => {
      await applyCompanionSnapshot(snapshot)
    },
    onRemoteApplied: () => {
      getMainWindow()?.webContents.reload()
    }
  })
  liveServer = server
  const port = Number(new URL(server.status().localUrl).port)
  void startCloudflareTunnel(port, join(app.getPath('userData'), 'cloudflared.exe'))
    .then((tunnel) => {
      if (liveServer !== server) {
        tunnel.stop()
        return
      }
      stopTunnel = tunnel.stop
      server.setPublicUrl(tunnel.url, null)
    })
    .catch((error: unknown) => {
      if (liveServer !== server) {
        return
      }
      server.setPublicUrl(null, error instanceof Error ? error.message : '在线地址创建失败')
    })
  return server.status()
}

export function registerCompanionIpc(): void {
  app.on('before-quit', () => {
    void stopLiveSync()
  })

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

  ipcMain.handle(IPC_CHANNELS.companion.liveSyncStart, async () => startLiveSync())
  ipcMain.handle(IPC_CHANNELS.companion.liveSyncStop, async () => stopLiveSync())
  ipcMain.handle(IPC_CHANNELS.companion.liveSyncStatus, async () => liveServer?.status() ?? stoppedLiveSync)
}
