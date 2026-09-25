import { randomUUID } from 'node:crypto'
import { mkdir, open, rename, unlink } from 'node:fs/promises'
import { dirname } from 'node:path'

/** Never open the destination for writing. A failed replacement leaves it intact. */
export async function replaceFileAtomic(filePath: string, data: string | Uint8Array): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true })
  const temp = `${filePath}.${process.pid}.${randomUUID()}.tmp`
  try {
    const handle = await open(temp, 'wx')
    try {
      await handle.writeFile(data)
      await handle.sync()
    } finally {
      await handle.close()
    }
    await rename(temp, filePath)
    await syncDirectory(dirname(filePath))
  } catch (cause) {
    try {
      await unlink(temp)
    } catch (cleanup) {
      if ((cleanup as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw new AggregateError([cause, cleanup], `安全写入失败；临时文件需保留检查：${temp}`)
      }
    }
    throw new Error(`安全替换失败：${filePath}；禁止截断覆盖，请检查权限、磁盘空间或文件占用。`, { cause })
  }
}

export async function syncDirectory(path: string): Promise<void> {
  // Windows Node does not expose a directory FlushFileBuffers handle. File fsync
  // still runs above; startup journal hashes detect incomplete disk persistence.
  if (process.platform === 'win32') return
  const handle = await open(path, 'r')
  try { await handle.sync() } finally { await handle.close() }
}
