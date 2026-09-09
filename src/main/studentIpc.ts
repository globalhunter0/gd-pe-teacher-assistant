import { ipcMain } from 'electron'
import { getStudentDeleteBlockers, parseStudentRecords } from '../shared/student/validate'
import { loadClasses } from './classStore'
import {
  analyzeStudentExcel,
  clearImportSession,
  commitStudentExcel,
  inspectSheetHeaders,
  pickStudentExcel,
  previewStudentExcel
} from './studentImport'
import { loadPeSessions } from './peSessionStore'
import { loadPeTests } from './peTestStore'
import { loadStudents, saveStudents } from './studentStore'
import { loadTrainingMembers, loadTrainingResults, loadTrainingSessions } from './trainingStore'

export function registerStudentIpc(): void {
  ipcMain.handle('students:get', async () => {
    return loadStudents()
  })

  ipcMain.handle('students:save', async (_event, items: unknown) => {
    const classes = await loadClasses()
    const knownClassIds = new Set(classes.map((item) => item.id))
    const next = parseStudentRecords(items, { knownClassIds })
    const current = await loadStudents()
    const nextIds = new Set(next.map((item) => item.id))
    const sessions = await loadPeSessions()
    const tests = await loadPeTests()
    const trainingMembers = await loadTrainingMembers()
    const trainingSessions = await loadTrainingSessions()
    const trainingResults = await loadTrainingResults()

    for (const item of current) {
      if (nextIds.has(item.id)) {
        continue
      }

      const blockers = getStudentDeleteBlockers(item.id, sessions, tests, {
        members: trainingMembers,
        sessions: trainingSessions,
        results: trainingResults
      })
      if (blockers.length > 0) {
        throw new Error('该学生仍有历史引用，不能从存储中移除。请使用删除档案（保留历史）。')
      }
    }

    return saveStudents(next, knownClassIds)
  })

  ipcMain.handle('students:importPick', async () => {
    return pickStudentExcel()
  })

  ipcMain.handle('students:importAnalyze', async (_event, sessionId: unknown) => {
    return analyzeStudentExcel(sessionId)
  })

  ipcMain.handle('students:importHeaders', async (_event, sessionId: unknown, sheetName: unknown) => {
    return inspectSheetHeaders(sessionId, sheetName)
  })

  ipcMain.handle(
    'students:importPreview',
    async (_event, sessionId: unknown, sheetName: unknown, mapping: unknown, context: unknown) => {
      return previewStudentExcel(sessionId, sheetName, mapping, context)
    }
  )

  ipcMain.handle(
    'students:importCommit',
    async (_event, sessionId: unknown, sheetName: unknown, mapping: unknown, context: unknown) => {
      return commitStudentExcel(sessionId, sheetName, mapping, context)
    }
  )

  ipcMain.handle('students:importCancel', async () => {
    clearImportSession()
  })
}
