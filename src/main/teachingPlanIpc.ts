import { ipcMain } from 'electron'
import { parseTeachingPlans } from '../shared/teachingPlan/validate'
import { loadTeachingPlans, saveTeachingPlans } from './teachingPlanStore'

export function registerTeachingPlanIpc(): void {
  ipcMain.handle('teachingPlans:get', async () => {
    return loadTeachingPlans()
  })

  ipcMain.handle('teachingPlans:save', async (_event, items: unknown) => {
    return saveTeachingPlans(parseTeachingPlans(items))
  })
}
