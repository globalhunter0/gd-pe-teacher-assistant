import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import type { IpcChannel } from '../shared/appApi'
import { assertCollectionUnchanged } from '../shared/persistence/collectionConflict'
import { withExclusiveDataAccess } from '../shared/persistence/writeGate'

/** Check and commit share the existing P0 write gate; no disk format changes. */
export function handleCollectionSave<T>(
  channel: IpcChannel,
  load: () => Promise<T[]>,
  save: (event: IpcMainInvokeEvent, input: unknown) => Promise<T[]>
): void {
  ipcMain.handle(channel, (event, input: unknown, expected: unknown) =>
    withExclusiveDataAccess(async () => {
      assertCollectionUnchanged(await load(), expected)
      return save(event, input)
    })
  )
}
