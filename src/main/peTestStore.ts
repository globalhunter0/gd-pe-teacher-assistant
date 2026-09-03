import { app } from 'electron'
import { access, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { parsePeTestSessions } from '../shared/peTest/validate'
import type { PETestSession } from '../shared/peTest/types'

interface PeTestFile {
  version: 1
  updatedAt: string
  items: PETestSession[]
}

export function getPeTestFilePath(): string {
  return join(app.getPath('userData'), 'pe-tests.json')
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function writePeTestFile(items: PETestSession[]): Promise<void> {
  const filePath = getPeTestFilePath()
  await mkdir(dirname(filePath), { recursive: true })
  const payload: PeTestFile = {
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
      // ignore
    }
  }
}

export async function loadPeTests(): Promise<PETestSession[]> {
  const filePath = getPeTestFilePath()

  if (!(await fileExists(filePath))) {
    await writePeTestFile([])
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
    return parsePeTestSessions(itemsSource)
  } catch (error) {
    const backupPath = join(app.getPath('userData'), `pe-tests.bak-${Date.now()}.json`)
    try {
      await rename(filePath, backupPath)
    } catch {
      // ignore
    }

    console.error('体育测试文件读取失败，已重置为空列表', error)
    await writePeTestFile([])
    return []
  }
}

export async function savePeTests(
  input: unknown,
  knownClassIds: ReadonlySet<string>,
  knownItemIds: ReadonlySet<string>
): Promise<PETestSession[]> {
  const items = parsePeTestSessions(input, { knownClassIds, knownItemIds })
  await writePeTestFile(items)
  return items
}
