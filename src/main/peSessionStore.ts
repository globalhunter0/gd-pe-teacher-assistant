import { app } from 'electron'
import { access, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { parsePeSessions } from '../shared/peSession/validate'
import type { PEClassSession } from '../shared/peSession/types'

interface PeSessionFile {
  version: 1
  updatedAt: string
  items: PEClassSession[]
}

export function getPeSessionFilePath(): string {
  return join(app.getPath('userData'), 'pe-sessions.json')
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function writePeSessionFile(items: PEClassSession[]): Promise<void> {
  const filePath = getPeSessionFilePath()
  await mkdir(dirname(filePath), { recursive: true })

  const payload: PeSessionFile = {
    version: 1,
    updatedAt: new Date().toISOString(),
    items
  }
  const text = `${JSON.stringify(payload, null, 2)}\n`
  const tmpPath = `${filePath}.${process.pid}.tmp`

  await writeFile(tmpPath, text, 'utf8')
  try {
    await rename(tmpPath, filePath)
  } catch {
    await writeFile(filePath, text, 'utf8')
    try {
      await unlink(tmpPath)
    } catch {
      // Ignore leftover temp file.
    }
  }
}

export async function loadPeSessions(): Promise<PEClassSession[]> {
  const filePath = getPeSessionFilePath()

  if (!(await fileExists(filePath))) {
    await writePeSessionFile([])
    return []
  }

  try {
    const raw = await readFile(filePath, 'utf8')
    const parsed: unknown = JSON.parse(raw)
    const itemsSource = Array.isArray(parsed)
      ? parsed
      : parsed !== null && typeof parsed === 'object' && 'items' in parsed
        ? (parsed as { items: unknown }).items
        : null

    return parsePeSessions(itemsSource)
  } catch (error) {
    const backupPath = join(app.getPath('userData'), `pe-sessions.bak-${Date.now()}.json`)
    try {
      await rename(filePath, backupPath)
    } catch {
      // Ignore backup failures.
    }

    console.error('体育课记录文件读取失败，已重置为空列表', error)
    await writePeSessionFile([])
    return []
  }
}

export async function savePeSessions(
  input: unknown,
  knownClassIds: ReadonlySet<string>
): Promise<PEClassSession[]> {
  const items = parsePeSessions(input, { knownClassIds })
  await writePeSessionFile(items)
  return items
}
