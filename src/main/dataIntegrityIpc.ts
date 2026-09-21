import { ipcMain } from 'electron'
import {
  buildAndRunDataIntegrityAudit,
  buildAndRunStartupHealthCheck,
  getLastStartupHealthReport,
  runSafeRepairWithBackup
} from './dataIntegrityService'

export function registerDataIntegrityIpc(): void {
  ipcMain.handle('dataIntegrity:audit', async () => {
    return buildAndRunDataIntegrityAudit()
  })

  ipcMain.handle('dataIntegrity:startupStatus', async () => {
    return getLastStartupHealthReport() ?? (await buildAndRunStartupHealthCheck())
  })

  ipcMain.handle('dataIntegrity:safeRepair', async () => {
    return runSafeRepairWithBackup()
  })
}
