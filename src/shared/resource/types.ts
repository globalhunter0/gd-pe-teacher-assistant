export type ResourceType = 'file' | 'link' | 'note'

export interface ResourceItem {
  id: string
  title: string
  type: ResourceType
  category: string
  tags: string[]
  description: string
  notes: string
  body: string
  url: string | null
  originalFileName: string | null
  storedFileName: string | null
  createdAt: string
  updatedAt: string
}

export const RESOURCE_TYPES: ResourceType[] = ['file', 'link', 'note']

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  file: '本地文件',
  link: '网页链接',
  note: '文字笔记'
}

export const PRESET_RESOURCE_CATEGORIES = [
  '教案',
  '教学计划',
  '热身活动',
  '田径',
  '篮球',
  '足球',
  '体能',
  '体育测试',
  '规则与理论',
  '其他'
] as const

export const ALLOWED_RESOURCE_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.bmp',
  '.mp4',
  '.mov',
  '.avi',
  '.mkv',
  '.webm'
] as const

export const MAX_RESOURCE_FILE_BYTES = 200 * 1024 * 1024

export type ResourceSelectResult =
  | { canceled: true }
  | { canceled: false; originalFileName: string }

export interface ResourceDeleteResult {
  items: ResourceItem[]
  warning: string | null
}

export interface ResourceNoteInput {
  title: string
  body: string
  category: string
  tags: string[]
}

export interface ResourceLinkInput {
  title: string
  url: string
  category: string
  tags: string[]
  description: string
  notes: string
}

export interface ResourceFileImportInput {
  title: string
  category: string
  tags: string[]
  description: string
  notes: string
}

export interface ResourceUpdateInput {
  title: string
  category: string
  tags: string[]
  description: string
  notes: string
  body: string
  url: string | null
}
