import { handleCollectionSave } from './collectionIpc'
import { ipcMain } from 'electron'
import { loadClasses } from './classStore'
import { loadPeSessions, savePeSessions } from './peSessionStore'
import { parsePeSessions } from '../shared/peSession/validate'
import { findExistingPeSession } from '../shared/peSession/workbenchToday'
import { withExclusiveDataAccess } from '../shared/persistence/writeGate'

let creationQueue: Promise<unknown> = Promise.resolve()

export function registerPeSessionIpc(): void {
  ipcMain.handle('peSessions:create', (_event, input: unknown) => {
    const operation = creationQueue.then(() => withExclusiveDataAccess(async () => {
      const item = parsePeSessions([input])[0]
      const current = await loadPeSessions()
      const existing = findExistingPeSession(current, item)
      if (existing) return { session: existing, sessions: current }
      if (current.some(session => session.id === item.id)) throw new Error('课堂 ID 已存在，不能改写历史身份')
      const classes = await loadClasses()
      const saved = await savePeSessions([...current, item], new Set(classes.map(entry => entry.id)))
      return { session: saved.find(entry => entry.id === item.id)!, sessions: saved }
    }))
    creationQueue = operation.catch(() => undefined)
    return operation
  })
  ipcMain.handle('peSessions:get', async () => {
    return loadPeSessions()
  })

  handleCollectionSave('peSessions:save', loadPeSessions, async (_event, items: unknown) => {
    const classes = await loadClasses()
    const knownClassIds = new Set(classes.map((item) => item.id))
    return savePeSessions(items, knownClassIds)
  })
}
