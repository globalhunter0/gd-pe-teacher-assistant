export interface StagedWriteStep {
  name: string
  write: () => Promise<void>
  restore: () => Promise<void>
}

export type StagedWriteResult =
  | { ok: true; rolledBack: false }
  | { ok: false; rolledBack: boolean; error: unknown; failedStage: string }

/**
 * JSON 多文件“准事务”：
 * 读取完整旧状态后，在调用方内存构建新状态并校验，再分阶段安全写入。
 * 任一阶段失败则按反序恢复已写入阶段；恢复失败时 rolledBack=false。
 */
export async function runStagedJsonWrites(stages: ReadonlyArray<StagedWriteStep>): Promise<StagedWriteResult> {
  const writtenRestores: Array<() => Promise<void>> = []
  let failedStage = ''
  try {
    for (const stage of stages) {
      failedStage = stage.name
      await stage.write()
      writtenRestores.push(stage.restore)
    }
    return { ok: true, rolledBack: false }
  } catch (error) {
    let rolledBack = true
    for (const restore of [...writtenRestores].reverse()) {
      try {
        await restore()
      } catch {
        rolledBack = false
      }
    }
    return { ok: false, rolledBack, error, failedStage }
  }
}
