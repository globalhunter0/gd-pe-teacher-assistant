import { withExclusiveDataAccess } from '../shared/persistence/writeGate'
import { shell } from 'electron'
import { copyFile, mkdir, readFile, realpath, rename, stat, unlink } from 'node:fs/promises'
import { basename, extname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { loadJsonItemsFile, writeJsonItemsAtomic } from '../shared/persistence/jsonFile'
import { getUserDataRoot } from './userDataPaths'
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

export function getResourceMetaPath(): string {
  return join(getUserDataRoot(), 'resources.json')
}

export function getResourceFilesDir(): string {
  return join(getUserDataRoot(), 'resources', 'files')
}

function getResourceTmpDir(): string {
  return join(getResourceFilesDir(), '.tmp')
}

function isInsideDirectory(filePath: string, directory: string): boolean {
  const relativePath = relative(resolve(directory), resolve(filePath))
  return relativePath !== '' && !relativePath.startsWith(`..${sep}`) && !relativePath.startsWith('..') && !isAbsolute(relativePath)
}

async function writeResourceFile(items: ResourceItem[]): Promise<void> {
  await writeJsonItemsAtomic(getResourceMetaPath(), items)
}

async function readResourceItems(): Promise<ResourceItem[]> {
  return loadJsonItemsFile(getResourceMetaPath(), parseResourceItems, [])
}

async function removeIfExists(filePath: string): Promise<void> {
  try {
    await unlink(filePath)
  } catch {
    // ignore
  }
}

/** Reading an incomplete index never authorizes deleting user attachments. */
export async function loadResources(): Promise<ResourceItem[]> {
  return readResourceItems()
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

/** 只读取资料中心托管目录内的附件，供生成教学设计时提取参考文本。 */
export async function readManagedResourceFile(storedFileName: string): Promise<Buffer> {
  const filePath = await resolveManagedFile(storedFileName)
  const info = await stat(filePath)
  if (info.size > MAX_RESOURCE_FILE_BYTES) {
    throw new Error('资料文件过大')
  }
  return readFile(filePath)
}

export async function createNoteResource(input: unknown): Promise<ResourceItem[]> {
  return withExclusiveDataAccess(() => createNoteResourceExclusive(input))
}

async function createNoteResourceExclusive(input: unknown): Promise<ResourceItem[]> {
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
  return withExclusiveDataAccess(() => createLinkResourceExclusive(input))
}

async function createLinkResourceExclusive(input: unknown): Promise<ResourceItem[]> {
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
  return withExclusiveDataAccess(() => importFileResourceExclusive(sourcePath, input))
}

async function importFileResourceExclusive(sourcePath: string, input: unknown): Promise<ResourceItem[]> {
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
  return withExclusiveDataAccess(() => updateResourceExclusive(id, input))
}

async function updateResourceExclusive(id: unknown, input: unknown): Promise<ResourceItem[]> {
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
  return withExclusiveDataAccess(() => deleteResourceExclusive(id))
}

async function deleteResourceExclusive(id: unknown): Promise<{ items: ResourceItem[]; warning: string | null }> {
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
      warning = '资料已删除，应用内副本未能清除。残留文件已保留，不会自动清理。'
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
