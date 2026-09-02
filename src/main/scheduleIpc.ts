import { ipcMain } from 'electron'
import { loadSchedule, saveSchedule } from './scheduleStore'

export function registerScheduleIpc(): void {
  ipcMain.handle('schedule:get', async () => {
    return loadSchedule()
  })

  ipcMain.handle('schedule:save', async (_event, items: unknown) => {
    return saveSchedule(items)
  })
}
