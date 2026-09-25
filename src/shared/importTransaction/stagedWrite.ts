import { dirname, relative } from 'node:path'
import { stagedJsonWrites } from '../persistence/jsonFile'
import { commitFileTransaction, DiskTransactionError } from '../persistence/diskTransaction'
import { withExclusiveDataAccess } from '../persistence/writeGate'

export interface StagedWriteStep {
  name: string
  write: () => Promise<void>
  restore: () => Promise<void>
}
export type StagedWriteResult =
  | { ok: true; rolledBack: false }
  | { ok: false; rolledBack: boolean; error: unknown; failedStage: string }

/** Existing callbacks validate/serialize as before; disk writes are captured until all are ready. */
export async function runStagedJsonWrites(stages: ReadonlyArray<StagedWriteStep>): Promise<StagedWriteResult> {
  let failedStage = ''
  try {
    return await withExclusiveDataAccess(async (): Promise<StagedWriteResult> => {
      const pending = new Map<string, string>()
      const restores: Array<() => Promise<void>> = []
      try {
        await stagedJsonWrites.run(pending, async () => {
          for (const stage of stages) {
            failedStage = stage.name
            await stage.write()
            restores.push(stage.restore)
          }
        })
        if (pending.size) {
          const root = dirname(pending.keys().next().value!)
          if ([...pending.keys()].some(path => dirname(path) !== root)) throw new Error('事务文件必须位于同一数据目录')
          failedStage = 'disk-commit'
          await commitFileTransaction(root, [...pending].map(([path, data]) => ({ path: relative(root, path), data })))
        }
        return { ok: true, rolledBack: false }
      } catch (error) {
        let rolledBack = error instanceof DiskTransactionError ? error.rolledBack : true
        // In-memory test adapters have no captured disk writes. Production JSON
        // callbacks never need the old compensating writes.
        if (!pending.size) {
          for (const restore of restores.reverse()) {
            try { await restore() } catch { rolledBack = false }
          }
        }
        return { ok: false, rolledBack, error, failedStage }
      }
    })
  } catch (error) { return { ok: false, rolledBack: false, error, failedStage } }
}
