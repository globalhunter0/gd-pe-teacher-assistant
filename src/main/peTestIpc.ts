import { loadPeSessions } from './peSessionStore'
import { assertPeTestSaveIdentity } from '../shared/peTest/saveIdentity'
import { parsePeTestSessions } from '../shared/peTest/validate'
import { IPC_CHANNELS } from '../shared/appApi'
import { handleCollectionSave } from './collectionIpc'
import { ipcMain } from 'electron'
import { loadClasses } from './classStore'
import { loadPeTests, savePeTests } from './peTestStore'
import { loadTestItems, saveTestItems } from './testItemStore'
import { loadStudents } from './studentStore'
import { executeImportExamBatchToPeTests } from '../shared/examBatch/peTestImport/execute'

export function registerPeTestIpc(): void {
  ipcMain.handle(IPC_CHANNELS.testItems.get, async () => {
    return loadTestItems()
  })

  handleCollectionSave(IPC_CHANNELS.testItems.save, loadTestItems, async (_event, items: unknown) => {
    return saveTestItems(items)
  })

  ipcMain.handle(IPC_CHANNELS.peTests.get, async () => {
    return loadPeTests()
  })

  handleCollectionSave(IPC_CHANNELS.peTests.save, loadPeTests, async (_event, items: unknown) => {
    const current = await loadPeTests()
    const classrooms = await loadPeSessions()
    for (const test of parsePeTestSessions(items)) {
      if (!current.some(old => old.id === test.id) && test.peSessionId && !classrooms.some(session => session.id === test.peSessionId)) {
        throw new Error('关联课堂不存在或已删除，不能创建课堂测评')
      }
    }
    const classes = await loadClasses()
    const testItems = await loadTestItems()
    for (const test of parsePeTestSessions(items)) {
      if (!current.some(old => old.id === test.id) && !test.peSessionId) {
        const classroom = classes.find(entry => entry.id === test.classId)
        if (!classroom || classroom.grade !== test.gradeSnapshot || classroom.className !== test.classNameSnapshot) {
          throw new Error('新测试的班级、年级快照与当前班级不一致')
        }
      }
    }
    assertPeTestSaveIdentity(parsePeTestSessions(items), current, await loadStudents(), testItems, classrooms)
    return savePeTests(
      items,
      new Set(classes.map((item) => item.id)),
      new Set(testItems.map((item) => item.id))
    )
  })

  ipcMain.handle(IPC_CHANNELS.peTests.importExamBatch, async (_event, payload: unknown) => {
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
