import {
  ALLOWED_RESOURCE_EXTENSIONS,
  PRESET_RESOURCE_CATEGORIES,
  RESOURCE_TYPES,
  type ResourceFileImportInput,
  type ResourceItem,
  type ResourceLinkInput,
  type ResourceNoteInput,
  type ResourceType,
  type ResourceUpdateInput
} from './types'
import { isAllowedExternalUrl } from '../security/externalUrl'

const RESOURCE_ID = /^resource-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ALLOWED_EXT = new Set<string>(ALLOWED_RESOURCE_EXTENSIONS)
const MAX_TITLE = 200
const MAX_CATEGORY = 20
const MAX_DESCRIPTION = 2000
const MAX_NOTES = 5000
const MAX_BODY = 100000
const MAX_URL = 2000
const MAX_TAG = 20
const MAX_TAGS = 20

export function createResourceId(): string {
  return `resource-${crypto.randomUUID()}`
}

export function isResourceType(value: unknown): value is ResourceType {
  return RESOURCE_TYPES.includes(value as ResourceType)
}

export function normalizeTags(input: unknown): string[] {
  const source = Array.isArray(input)
    ? input
    : typeof input === 'string'
      ? input.split(/[,，]/)
      : []
  const seen = new Set<string>()
  const tags: string[] = []

  for (const entry of source) {
    if (typeof entry !== 'string') {
      continue
    }
    const tag = entry.trim()
    if (tag === '' || tag.length > MAX_TAG || seen.has(tag)) {
      continue
    }
    seen.add(tag)
    tags.push(tag)
    if (tags.length >= MAX_TAGS) {
      break
    }
  }

  return tags
}

export function normalizeCategory(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('分类不能为空')
  }

  const category = value.trim()
  if (category === '') {
    throw new Error('分类不能为空')
  }

  if (category.length > MAX_CATEGORY) {
    throw new Error(`分类不能超过 ${MAX_CATEGORY} 个字`)
  }

  return category
}

export function isAllowedResourceExtension(extension: string): boolean {
  return ALLOWED_EXT.has(extension.toLowerCase())
}

export function storedFileNameFor(id: string, extension: string): string {
  const ext = extension.toLowerCase()
  if (!RESOURCE_ID.test(id) || !isAllowedResourceExtension(ext)) {
    throw new Error('资料文件名不正确')
  }

  return `${id}${ext}`
}

function trimText(value: unknown, label: string, max: number, required: boolean): string {
  if (value === undefined || value === null) {
    if (required) {
      throw new Error(`${label}不能为空`)
    }
    return ''
  }

  if (typeof value !== 'string') {
    throw new Error(`${label}格式不正确`)
  }

  const text = value.trim()
  if (required && text === '') {
    throw new Error(`${label}不能为空`)
  }

  if (text.length > max) {
    throw new Error(`${label}过长`)
  }

  return text
}

export function parseResourceUrl(value: unknown): string {
  const url = trimText(value, '链接', MAX_URL, true)
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('链接格式不正确，请使用 http 或 https 地址')
  }

  if (!isAllowedExternalUrl(parsed.toString())) {
    throw new Error('只允许打开 http 或 https 链接')
  }

  return parsed.toString()
}

export function parseResourceNoteInput(input: unknown): ResourceNoteInput {
  if (typeof input !== 'object' || input === null) {
    throw new Error('笔记资料格式不正确')
  }

  const record = input as Record<string, unknown>
  return {
    title: trimText(record.title, '标题', MAX_TITLE, true),
    body: trimText(record.body, '正文', MAX_BODY, true),
    category: normalizeCategory(record.category),
    tags: normalizeTags(record.tags)
  }
}

export function parseResourceLinkInput(input: unknown): ResourceLinkInput {
  if (typeof input !== 'object' || input === null) {
    throw new Error('链接资料格式不正确')
  }

  const record = input as Record<string, unknown>
  return {
    title: trimText(record.title, '标题', MAX_TITLE, true),
    url: parseResourceUrl(record.url),
    category: normalizeCategory(record.category),
    tags: normalizeTags(record.tags),
    description: trimText(record.description, '描述', MAX_DESCRIPTION, false),
    notes: trimText(record.notes, '备注', MAX_NOTES, false)
  }
}

export function parseResourceFileImportInput(input: unknown): ResourceFileImportInput {
  if (typeof input !== 'object' || input === null) {
    throw new Error('文件资料格式不正确')
  }

  const record = input as Record<string, unknown>
  return {
    title: trimText(record.title, '标题', MAX_TITLE, true),
    category: normalizeCategory(record.category),
    tags: normalizeTags(record.tags),
    description: trimText(record.description, '描述', MAX_DESCRIPTION, false),
    notes: trimText(record.notes, '备注', MAX_NOTES, false)
  }
}

export function parseResourceUpdateInput(input: unknown): ResourceUpdateInput {
  if (typeof input !== 'object' || input === null) {
    throw new Error('资料更新格式不正确')
  }

  const record = input as Record<string, unknown>
  return {
    title: trimText(record.title, '标题', MAX_TITLE, true),
    category: normalizeCategory(record.category),
    tags: normalizeTags(record.tags),
    description: trimText(record.description, '描述', MAX_DESCRIPTION, false),
    notes: trimText(record.notes, '备注', MAX_NOTES, false),
    body: trimText(record.body, '正文', MAX_BODY, false),
    url: record.url === null || record.url === undefined || record.url === '' ? null : parseResourceUrl(record.url)
  }
}

function parseResourceItem(entry: unknown): ResourceItem {
  if (typeof entry !== 'object' || entry === null) {
    throw new Error('资料格式不正确')
  }

  const record = entry as Record<string, unknown>
  if (typeof record.id !== 'string' || !RESOURCE_ID.test(record.id)) {
    throw new Error('资料 ID 不正确')
  }

  if (!isResourceType(record.type)) {
    throw new Error('资料类型不正确')
  }

  if (typeof record.createdAt !== 'string' || typeof record.updatedAt !== 'string') {
    throw new Error('资料时间字段不正确')
  }

  const item: ResourceItem = {
    id: record.id,
    title: trimText(record.title, '标题', MAX_TITLE, true),
    type: record.type,
    category: normalizeCategory(record.category),
    tags: normalizeTags(record.tags),
    description: trimText(record.description, '描述', MAX_DESCRIPTION, false),
    notes: trimText(record.notes, '备注', MAX_NOTES, false),
    body: trimText(record.body, '正文', MAX_BODY, false),
    url: record.url === null || record.url === undefined || record.url === '' ? null : parseResourceUrl(record.url),
    originalFileName:
      record.originalFileName === null || record.originalFileName === undefined || record.originalFileName === ''
        ? null
        : trimText(record.originalFileName, '原文件名', 260, true),
    storedFileName:
      record.storedFileName === null || record.storedFileName === undefined || record.storedFileName === ''
        ? null
        : trimText(record.storedFileName, '存储文件名', 320, true),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  }

  if (item.type === 'file') {
    if (item.url !== null || item.body !== '') {
      throw new Error('文件资料不能包含链接或笔记正文')
    }
    if (!item.originalFileName || !item.storedFileName) {
      throw new Error('文件资料缺少文件名')
    }
    if (item.storedFileName !== storedFileNameFor(item.id, extensionOf(item.storedFileName))) {
      throw new Error('存储文件名必须与资料编号一致')
    }
  }

  if (item.type === 'link') {
    if (!item.url || item.body !== '' || item.originalFileName || item.storedFileName) {
      throw new Error('链接资料字段不正确')
    }
  }

  if (item.type === 'note') {
    if (item.body === '' || item.url !== null || item.originalFileName || item.storedFileName) {
      throw new Error('笔记资料字段不正确')
    }
  }

  return item
}

function extensionOf(fileName: string): string {
  const index = fileName.lastIndexOf('.')
  return index >= 0 ? fileName.slice(index).toLowerCase() : ''
}

export function parseResourceItems(input: unknown): ResourceItem[] {
  if (!Array.isArray(input)) {
    throw new Error('资料数据格式不正确')
  }

  const items = input.map((entry) => parseResourceItem(entry))
  const ids = new Set<string>()
  const stored = new Set<string>()

  for (const item of items) {
    if (ids.has(item.id)) {
      throw new Error('资料 ID 不能重复')
    }
    ids.add(item.id)
    if (item.storedFileName) {
      if (stored.has(item.storedFileName)) {
        throw new Error('存储文件名不能重复')
      }
      stored.add(item.storedFileName)
    }
  }

  return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.title.localeCompare(b.title, 'zh-CN'))
}

export function matchesResourceQuery(item: ResourceItem, query: string): boolean {
  const needle = query.trim().toLocaleLowerCase()
  if (needle === '') {
    return true
  }

  const haystack = [item.title, item.description, item.category, item.notes, item.body, ...item.tags]
    .join('\n')
    .toLocaleLowerCase()
  return haystack.includes(needle)
}

export function filterResources(
  items: readonly ResourceItem[],
  options: { query: string; category: string; type: string }
): ResourceItem[] {
  return items.filter((item) => {
    if (options.category !== 'all' && item.category !== options.category) {
      return false
    }
    if (options.type !== 'all' && item.type !== options.type) {
      return false
    }
    return matchesResourceQuery(item, options.query)
  })
}
