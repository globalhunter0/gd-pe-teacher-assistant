import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../shared/appApi'
import {
  buildAndRunDataIntegrityAudit,
  buildAndRunStartupHealthCheck,
  getLastStartupHealthReport,
  runSafeRepairWithBackup
} from './dataIntegrityService'

export function registerDataIntegrityIpc(): void {
  ipcMain.handle(IPC_CHANNELS.dataIntegrity.audit, async () => {
    return buildAndRunDataIntegrityAudit()
  })

  ipcMain.handle(IPC_CHANNELS.dataIntegrity.startupStatus, async () => {
    return getLastStartupHealthReport() ?? (await buildAndRunStartupHealthCheck())
  })

  ipcMain.handle(IPC_CHANNELS.dataIntegrity.safeRepair, async () => {
    return runSafeRepairWithBackup()
  })
}
