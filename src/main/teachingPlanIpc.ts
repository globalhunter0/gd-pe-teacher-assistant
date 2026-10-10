import { IPC_CHANNELS } from '../shared/appApi'
import { handleCollectionSave } from './collectionIpc'
import { ipcMain } from 'electron'
import { parseTeachingPlans } from '../shared/teachingPlan/validate'
import { loadTeachingPlans, saveTeachingPlans } from './teachingPlanStore'

export function registerTeachingPlanIpc(): void {
  ipcMain.handle(IPC_CHANNELS.teachingPlans.get, async () => {
    return loadTeachingPlans()
  })

  handleCollectionSave(IPC_CHANNELS.teachingPlans.save, loadTeachingPlans, async (_event, items: unknown) => {
    return saveTeachingPlans(parseTeachingPlans(items))
  })
}
