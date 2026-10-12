import { extractMaterialText, isSupportedMaterial } from '../shared/materials/extract'
import type { MaterialSource } from '../shared/materials/select'
import type { MaterialPreview } from '../shared/materials/types'
import { loadResources, readManagedResourceFile } from './resourceStore'

const MAX_MATERIALS = 10
const cache = new Map<string, { text: string; note: string | null }>()

export interface LoadedMaterial extends MaterialPreview {
  text: string
}

function parseIds(input: unknown): string[] {
  if (!Array.isArray(input)) {
    throw new Error('参考资料列表格式不正确')
  }
  const ids = Array.from(new Set(input.filter((id): id is string => typeof id === 'string' && id.length <= 120)))
  if (ids.length > MAX_MATERIALS) {
    throw new Error(`一次最多选择 ${MAX_MATERIALS} 份参考资料`)
  }
  return ids
}

export async function loadMaterials(input: unknown): Promise<LoadedMaterial[]> {
  const ids = parseIds(input)
  if (ids.length === 0) {
    return []
  }
  const resources = await loadResources()
  const results: LoadedMaterial[] = []
  for (const id of ids) {
    const resource = resources.find((item) => item.id === id)
    if (!resource) {
      results.push({ resourceId: id, title: '（已删除的资料）', chars: 0, note: null, error: '资料已从资料中心删除', text: '' })
      continue
    }
    try {
      let extracted: { text: string; note: string | null }
      if (resource.type === 'note') {
        extracted = { text: [resource.description, resource.body].filter(Boolean).join('\n\n'), note: null }
      } else if (resource.type === 'file' && resource.storedFileName) {
        const fileName = resource.originalFileName ?? resource.storedFileName
        if (!isSupportedMaterial(fileName)) {
          throw new Error('只支持 txt、md、docx、pdf 格式的参考资料')
        }
        const cacheKey = `${resource.id}:${resource.updatedAt}:${resource.storedFileName}`
        extracted = cache.get(cacheKey) ?? (await extractMaterialText(fileName, await readManagedResourceFile(resource.storedFileName)))
        cache.set(cacheKey, extracted)
      } else {
        throw new Error('网页链接无法作为参考资料，请把内容保存为文字笔记或文件')
      }
      results.push({ resourceId: id, title: resource.title, chars: extracted.text.length, note: extracted.note, error: null, text: extracted.text })
    } catch (error) {
      results.push({
        resourceId: id,
        title: resource.title,
        chars: 0,
        note: null,
        error: error instanceof Error ? error.message : String(error),
        text: ''
      })
    }
  }
  return results
}

export async function previewMaterials(input: unknown): Promise<MaterialPreview[]> {
  return (await loadMaterials(input)).map(({ text: _text, ...preview }) => preview)
}

export function materialSources(materials: ReadonlyArray<LoadedMaterial>): MaterialSource[] {
  return materials.filter((item) => item.text).map((item) => ({ title: item.title, text: item.text }))
}
