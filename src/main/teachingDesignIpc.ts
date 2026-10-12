import { IPC_CHANNELS } from '../shared/appApi'
import { handleCollectionSave } from './collectionIpc'
import { ipcMain } from 'electron'
import { parseTeachingDesigns } from '../shared/teachingDesign/validate'
import { loadTeachingDesigns, saveTeachingDesigns } from './teachingDesignStore'

export function registerTeachingDesignIpc(): void {
  ipcMain.handle(IPC_CHANNELS.teachingDesigns.get, async () => {
    return loadTeachingDesigns()
  })

  handleCollectionSave(IPC_CHANNELS.teachingDesigns.save, loadTeachingDesigns, async (_event, items: unknown) => {
    return saveTeachingDesigns(parseTeachingDesigns(items))
  })
}
