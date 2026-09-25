import { handleCollectionSave } from './collectionIpc'
import { ipcMain } from 'electron'
import { parseTeachingPlans } from '../shared/teachingPlan/validate'
import { loadTeachingPlans, saveTeachingPlans } from './teachingPlanStore'

export function registerTeachingPlanIpc(): void {
  ipcMain.handle('teachingPlans:get', async () => {
    return loadTeachingPlans()
  })

  handleCollectionSave('teachingPlans:save', loadTeachingPlans, async (_event, items: unknown) => {
    return saveTeachingPlans(parseTeachingPlans(items))
  })
}
