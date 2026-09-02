import { app } from 'electron'
import { access, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { DEFAULT_SCHEDULE } from '../shared/schedule/defaultSchedule'
import { parseScheduleItems } from '../shared/schedule/validate'
import type { ScheduleItem } from '../shared/schedule/types'

interface ScheduleFile {
  version: 1
  updatedAt: string
  items: ScheduleItem[]
}

export function getScheduleFilePath(): string {
  return join(app.getPath('userData'), 'schedule.json')
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

function cloneDefault(): ScheduleItem[] {
  return DEFAULT_SCHEDULE.map((item) => ({ ...item }))
}

async function writeScheduleFile(items: ScheduleItem[]): Promise<void> {
  const filePath = getScheduleFilePath()
  await mkdir(dirname(filePath), { recursive: true })

  const payload: ScheduleFile = {
    version: 1,
    updatedAt: new Date().toISOString(),
    items
  }

  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
}

export async function loadSchedule(): Promise<ScheduleItem[]> {
  const filePath = getScheduleFilePath()

  if (!(await fileExists(filePath))) {
    const items = cloneDefault()
    await writeScheduleFile(items)
    return items
  }

  try {
    const raw = await readFile(filePath, 'utf8')
    const parsed: unknown = JSON.parse(raw)
    const itemsSource = Array.isArray(parsed)
      ? parsed
      : parsed !== null && typeof parsed === 'object' && 'items' in parsed
        ? (parsed as { items: unknown }).items
        : null

    return parseScheduleItems(itemsSource)
  } catch (error) {
    const backupPath = join(app.getPath('userData'), `schedule.bak-${Date.now()}.json`)
    try {
      await rename(filePath, backupPath)
    } catch {
      // Ignore backup failures and continue with default data.
    }

    console.error('课表文件读取失败，已恢复默认课表', error)
    const items = cloneDefault()
    await writeScheduleFile(items)
    return items
  }
}

export async function saveSchedule(input: unknown): Promise<ScheduleItem[]> {
  const items = parseScheduleItems(input)
  await writeScheduleFile(items)
  return items
}
