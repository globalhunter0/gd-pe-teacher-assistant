import { app } from 'electron'
import { access, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { parseStudentRecords } from '../shared/student/validate'
import type { StudentRecord } from '../shared/student/types'

interface StudentFile {
  version: 1
  updatedAt: string
  items: StudentRecord[]
}

export function getStudentFilePath(): string {
  return join(app.getPath('userData'), 'students.json')
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function writeStudentFile(items: StudentRecord[]): Promise<void> {
  const filePath = getStudentFilePath()
  await mkdir(dirname(filePath), { recursive: true })

  const payload: StudentFile = {
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

export async function loadStudents(): Promise<StudentRecord[]> {
  const filePath = getStudentFilePath()

  if (!(await fileExists(filePath))) {
    await writeStudentFile([])
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

    return parseStudentRecords(itemsSource)
  } catch (error) {
    const backupPath = join(app.getPath('userData'), `students.bak-${Date.now()}.json`)
    try {
      await rename(filePath, backupPath)
    } catch {
      // Ignore backup failures and continue with an empty list.
    }

    console.error('学生文件读取失败，已重置为空列表', error)
    await writeStudentFile([])
    return []
  }
}

export async function saveStudents(input: unknown, knownClassIds: ReadonlySet<string>): Promise<StudentRecord[]> {
  const items = parseStudentRecords(input, { knownClassIds })
  await writeStudentFile(items)
  return items
}
