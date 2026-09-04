import { app } from 'electron'
import { access, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { parseTeachingPlans } from '../shared/teachingPlan/validate'
import type { TeachingPlan } from '../shared/teachingPlan/types'

interface TeachingPlanFile {
  version: 1
  updatedAt: string
  items: TeachingPlan[]
}

export function getTeachingPlanFilePath(): string {
  return join(app.getPath('userData'), 'teaching-plans.json')
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function writeTeachingPlanFile(items: TeachingPlan[]): Promise<void> {
  const filePath = getTeachingPlanFilePath()
  await mkdir(dirname(filePath), { recursive: true })
  const payload: TeachingPlanFile = {
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

export async function loadTeachingPlans(): Promise<TeachingPlan[]> {
  const filePath = getTeachingPlanFilePath()

  if (!(await fileExists(filePath))) {
    await writeTeachingPlanFile([])
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

    return parseTeachingPlans(itemsSource)
  } catch (error) {
    const backupPath = join(app.getPath('userData'), `teaching-plans.bak-${Date.now()}.json`)
    try {
      await rename(filePath, backupPath)
    } catch {
      // Ignore backup failures and continue with an empty list.
    }

    console.error('教学计划文件读取失败，已重置为空列表', error)
    await writeTeachingPlanFile([])
    return []
  }
}

export async function saveTeachingPlans(input: unknown): Promise<TeachingPlan[]> {
  const items = parseTeachingPlans(input)
  await writeTeachingPlanFile(items)
  return items
}
