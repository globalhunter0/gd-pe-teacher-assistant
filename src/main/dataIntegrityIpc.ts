import { ipcMain } from 'electron'
import { buildAndRunDataIntegrityAudit } from './dataIntegrityService'

export function registerDataIntegrityIpc(): void {
  ipcMain.handle('dataIntegrity:audit', async () => {
    return buildAndRunDataIntegrityAudit()
  })
}
