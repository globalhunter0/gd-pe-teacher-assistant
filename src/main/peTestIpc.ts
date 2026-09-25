import { loadPeSessions } from './peSessionStore'
import { parsePeTestSessions } from '../shared/peTest/validate'
import { handleCollectionSave } from './collectionIpc'
import { ipcMain } from 'electron'
import { loadClasses } from './classStore'
import { loadPeTests, savePeTests } from './peTestStore'
import { loadTestItems, saveTestItems } from './testItemStore'
import { loadStudents } from './studentStore'
import { executeImportExamBatchToPeTests } from '../shared/examBatch/peTestImport/execute'

export function registerPeTestIpc(): void {
  ipcMain.handle('testItems:get', async () => {
    return loadTestItems()
  })

  handleCollectionSave('testItems:save', loadTestItems, async (_event, items: unknown) => {
    return saveTestItems(items)
  })

  ipcMain.handle('peTests:get', async () => {
    return loadPeTests()
  })

  handleCollectionSave('peTests:save', loadPeTests, async (_event, items: unknown) => {
    const current = await loadPeTests()
    const classrooms = await loadPeSessions()
    for (const test of parsePeTestSessions(items)) {
      if (!current.some(old => old.id === test.id) && test.peSessionId && !classrooms.some(session => session.id === test.peSessionId)) {
        throw new Error('关联课堂不存在或已删除，不能创建课堂测评')
      }
    }
    const classes = await loadClasses()
    const testItems = await loadTestItems()
    return savePeTests(
      items,
      new Set(classes.map((item) => item.id)),
      new Set(testItems.map((item) => item.id))
    )
  })

  ipcMain.handle('peTests:importExamBatch', async (_event, payload: unknown) => {
    return executeImportExamBatchToPeTests(payload, {
      loadClasses,
      loadStudents,
      loadTestItems,
      loadPeTests,
      savePeTests: async (items) => {
        const classes = await loadClasses()
        const testItems = await loadTestItems()
        return savePeTests(
          items,
          new Set(classes.map((item) => item.id)),
          new Set(testItems.map((item) => item.id))
        )
      }
    })
  })
}
