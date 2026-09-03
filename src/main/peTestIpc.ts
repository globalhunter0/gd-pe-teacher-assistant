import { ipcMain } from 'electron'
import { loadClasses } from './classStore'
import { loadPeTests, savePeTests } from './peTestStore'
import { loadTestItems, saveTestItems } from './testItemStore'

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
}
