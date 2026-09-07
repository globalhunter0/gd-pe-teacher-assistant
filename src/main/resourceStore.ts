import { app, shell } from 'electron'
import { copyFile, mkdir, readdir, readFile, realpath, rename, stat, unlink, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import {
  createResourceId,
  isAllowedResourceExtension,
  parseResourceFileImportInput,
  parseResourceItems,
  parseResourceLinkInput,
  parseResourceNoteInput,
  parseResourceUpdateInput,
  parseResourceUrl,
  storedFileNameFor
} from '../shared/resource/validate'
import { MAX_RESOURCE_FILE_BYTES, type ResourceItem } from '../shared/resource/types'

interface ResourceFile {
  version: 1
  updatedAt: string
  items: ResourceItem[]
}

export function getResourceMetaPath(): string {
  return join(app.getPath('userData'), 'resources.json')
}

export function getResourceFilesDir(): string {
  return join(app.getPath('userData'), 'resources', 'files')
}

function getResourceTmpDir(): string {
  return join(getResourceFilesDir(), '.tmp')
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await accessStat(filePath)
    return true
  } catch {
    return false
  }
}

async function accessStat(filePath: string): Promise<void> {
  await stat(filePath)
}

function isInsideDirectory(filePath: string, directory: string): boolean {
  const relativePath = relative(resolve(directory), resolve(filePath))
  return relativePath !== '' && !relativePath.startsWith(`..${sep}`) && !relativePath.startsWith('..') && !isAbsolute(relativePath)
}

async function writeResourceFile(items: ResourceItem[]): Promise<void> {
  const filePath = getResourceMetaPath()
  await mkdir(dirname(filePath), { recursive: true })
  const payload: ResourceFile = {
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

async function readResourceItems(): Promise<ResourceItem[]> {
  const filePath = getResourceMetaPath()
  if (!(await fileExists(filePath))) {
    await writeResourceFile([])
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
    return parseResourceItems(itemsSource)
  } catch (error) {
    const backupPath = join(app.getPath('userData'), `resources.bak-${Date.now()}.json`)
    try {
      await rename(filePath, backupPath)
    } catch {
      // ignore
    }
    console.error('资料文件读取失败，已重置为空列表', error)
    await writeResourceFile([])
    return []
  }
}

async function removeIfExists(filePath: string): Promise<void> {
  try {
    await unlink(filePath)
  } catch {
    // ignore
  }
}

async function sweepOrphans(items: ResourceItem[]): Promise<void> {
  const filesDir = getResourceFilesDir()
  const tmpDir = getResourceTmpDir()
  await mkdir(filesDir, { recursive: true })
  await mkdir(tmpDir, { recursive: true })

  const referenced = new Set(items.map((item) => item.storedFileName).filter((name): name is string => Boolean(name)))

  try {
    const names = await readdir(filesDir)
    for (const name of names) {
      if (name === '.tmp') {
        continue
      }
      if (referenced.has(name)) {
        continue
      }
      const target = join(filesDir, name)
      if (!isInsideDirectory(target, filesDir)) {
        continue
      }
      await removeIfExists(target)
    }
  } catch {
    // ignore missing directory
  }

  try {
    const tmpNames = await readdir(tmpDir)
    for (const name of tmpNames) {
      const target = join(tmpDir, name)
      if (!isInsideDirectory(target, tmpDir)) {
        continue
      }
      await removeIfExists(target)
    }
  } catch {
    // ignore
  }
}

export async function loadResources(): Promise<ResourceItem[]> {
  const items = await readResourceItems()
  await sweepOrphans(items)
  return items
}

async function resolveManagedFile(storedFileName: string): Promise<string> {
  const filesDir = getResourceFilesDir()
  await mkdir(filesDir, { recursive: true })
  const candidate = join(filesDir, storedFileName)
  if (!isInsideDirectory(candidate, filesDir)) {
    throw new Error('资料文件路径不安全')
  }

  const realDir = await realpath(filesDir)
  const realFile = await realpath(candidate)
  if (!isInsideDirectory(realFile, realDir)) {
    throw new Error('资料文件路径不安全')
  }

  return realFile
}

export async function createNoteResource(input: unknown): Promise<ResourceItem[]> {
  const parsed = parseResourceNoteInput(input)
  const now = new Date().toISOString()
  const item: ResourceItem = {
    id: createResourceId(),
    title: parsed.title,
    type: 'note',
    category: parsed.category,
    tags: parsed.tags,
    description: '',
    notes: '',
    body: parsed.body,
    url: null,
    originalFileName: null,
    storedFileName: null,
    createdAt: now,
    updatedAt: now
  }
  const items = parseResourceItems([...(await readResourceItems()), item])
  await writeResourceFile(items)
  return items
}

export async function createLinkResource(input: unknown): Promise<ResourceItem[]> {
  const parsed = parseResourceLinkInput(input)
  const now = new Date().toISOString()
  const item: ResourceItem = {
    id: createResourceId(),
    title: parsed.title,
    type: 'link',
    category: parsed.category,
    tags: parsed.tags,
    description: parsed.description,
    notes: parsed.notes,
    body: '',
    url: parsed.url,
    originalFileName: null,
    storedFileName: null,
    createdAt: now,
    updatedAt: now
  }
  const items = parseResourceItems([...(await readResourceItems()), item])
  await writeResourceFile(items)
  return items
}

export async function importFileResource(sourcePath: string, input: unknown): Promise<ResourceItem[]> {
  const parsed = parseResourceFileImportInput(input)
  const extension = extname(sourcePath).toLowerCase()
  if (!isAllowedResourceExtension(extension)) {
    throw new Error('不支持该文件类型')
  }

  const sourceStat = await stat(sourcePath)
  if (!sourceStat.isFile()) {
    throw new Error('请选择一个文件')
  }
  if (sourceStat.size > MAX_RESOURCE_FILE_BYTES) {
    throw new Error('文件超过 200MB，请选择更小的文件')
  }

  const id = createResourceId()
  const storedFileName = storedFileNameFor(id, extension)
  const filesDir = getResourceFilesDir()
  const tmpDir = getResourceTmpDir()
  await mkdir(filesDir, { recursive: true })
  await mkdir(tmpDir, { recursive: true })

  const tmpPath = join(tmpDir, `${storedFileName}.${process.pid}.tmp`)
  const finalPath = join(filesDir, storedFileName)
  if (!isInsideDirectory(tmpPath, tmpDir) || !isInsideDirectory(finalPath, filesDir)) {
    throw new Error('资料文件路径不安全')
  }

  let copiedToTmp = false
  let movedToFinal = false

  try {
    await copyFile(sourcePath, tmpPath)
    copiedToTmp = true
    await rename(tmpPath, finalPath)
    movedToFinal = true
    copiedToTmp = false

    const now = new Date().toISOString()
    const item: ResourceItem = {
      id,
      title: parsed.title,
      type: 'file',
      category: parsed.category,
      tags: parsed.tags,
      description: parsed.description,
      notes: parsed.notes,
      body: '',
      url: null,
      originalFileName: basename(sourcePath),
      storedFileName,
      createdAt: now,
      updatedAt: now
    }
    const items = parseResourceItems([...(await readResourceItems()), item])
    await writeResourceFile(items)
    return items
  } catch (error) {
    if (copiedToTmp) {
      await removeIfExists(tmpPath)
    }
    if (movedToFinal) {
      await removeIfExists(finalPath)
    }
    throw error
  }
}

export async function updateResource(id: unknown, input: unknown): Promise<ResourceItem[]> {
  if (typeof id !== 'string') {
    throw new Error('资料编号不正确')
  }

  const patch = parseResourceUpdateInput(input)
  const current = await readResourceItems()
  const existing = current.find((item) => item.id === id)
  if (!existing) {
    throw new Error('找不到要编辑的资料')
  }

  const now = new Date().toISOString()
  let next: ResourceItem

  if (existing.type === 'file') {
    next = {
      ...existing,
      title: patch.title,
      category: patch.category,
      tags: patch.tags,
      description: patch.description,
      notes: patch.notes,
      updatedAt: now
    }
  } else if (existing.type === 'link') {
    next = {
      ...existing,
      title: patch.title,
      category: patch.category,
      tags: patch.tags,
      description: patch.description,
      notes: patch.notes,
      url: patch.url ?? existing.url,
      updatedAt: now
    }
    if (!next.url) {
      throw new Error('链接不能为空')
    }
    parseResourceUrl(next.url)
  } else {
    next = {
      ...existing,
      title: patch.title,
      category: patch.category,
      tags: patch.tags,
      body: patch.body,
      updatedAt: now
    }
    if (next.body === '') {
      throw new Error('正文不能为空')
    }
  }

  const items = parseResourceItems(current.map((item) => (item.id === id ? next : item)))
  await writeResourceFile(items)
  return items
}

export async function deleteResource(id: unknown): Promise<{ items: ResourceItem[]; warning: string | null }> {
  if (typeof id !== 'string') {
    throw new Error('资料编号不正确')
  }

  const current = await readResourceItems()
  const existing = current.find((item) => item.id === id)
  if (!existing) {
    throw new Error('找不到要删除的资料')
  }

  const items = parseResourceItems(current.filter((item) => item.id !== id))
  await writeResourceFile(items)

  let warning: string | null = null
  if (existing.type === 'file' && existing.storedFileName) {
    try {
      const managed = await resolveManagedFile(existing.storedFileName)
      await unlink(managed)
    } catch {
      warning = '资料已删除，应用内副本未能清除。下次打开资料中心时会尝试清理残留文件。'
    }
  }

  return { items, warning }
}

export async function openResource(id: unknown): Promise<void> {
  if (typeof id !== 'string') {
    throw new Error('资料编号不正确')
  }

  const existing = (await readResourceItems()).find((item) => item.id === id)
  if (!existing) {
    throw new Error('找不到要打开的资料')
  }

  if (existing.type === 'note') {
    throw new Error('文字笔记请在应用内查看')
  }

  if (existing.type === 'link') {
    if (!existing.url) {
      throw new Error('链接为空')
    }
    const url = parseResourceUrl(existing.url)
    await shell.openExternal(url)
    return
  }

  if (!existing.storedFileName) {
    throw new Error('资料副本缺失')
  }

  try {
    const managed = await resolveManagedFile(existing.storedFileName)
    const errorMessage = await shell.openPath(managed)
    if (errorMessage) {
      throw new Error(errorMessage || '无法打开文件，请确认已安装对应程序')
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('资料文件路径不安全')) {
      throw error
    }
    throw new Error('无法打开文件，可能副本已缺失或没有对应程序')
  }
}
