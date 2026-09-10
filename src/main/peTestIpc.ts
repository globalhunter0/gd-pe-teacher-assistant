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

  ipcMain.handle('testItems:save', async (_event, items: unknown) => {
    return saveTestItems(items)
  })

  ipcMain.handle('peTests:get', async () => {
    return loadPeTests()
  })

  ipcMain.handle('peTests:save', async (_event, items: unknown) => {
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
