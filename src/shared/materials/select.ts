export const DEFAULT_MATERIAL_CHARS = 12000
const CHUNK_TARGET = 600

export interface MaterialSource {
  title: string
  text: string
}

/** 按段落切块，单块约 600 字，过长段落再按句切分。 */
export function splitIntoChunks(text: string): string[] {
  const paragraphs = text.split(/\n\s*\n|\n(?=[一二三四五六七八九十]+、|第[一二三四五六七八九十\d]+[章节课单元])/)
  const chunks: string[] = []
  let current = ''
  for (const raw of paragraphs) {
    const paragraph = raw.trim()
    if (!paragraph) {
      continue
    }
    const pieces = paragraph.length > CHUNK_TARGET * 2 ? paragraph.match(/[^。！？；\n]+[。！？；\n]?/g) ?? [paragraph] : [paragraph]
    for (const piece of pieces) {
      if (current && current.length + piece.length > CHUNK_TARGET) {
        chunks.push(current)
        current = ''
      }
      current = current ? `${current}\n${piece}` : piece
    }
  }
  if (current) {
    chunks.push(current)
  }
  return chunks
}

function scoreChunk(chunk: string, keywords: ReadonlyArray<string>): number {
  let score = 0
  for (const keyword of keywords) {
    if (!keyword) {
      continue
    }
    let from = 0
    let hits = 0
    while (hits < 20) {
      const index = chunk.indexOf(keyword, from)
      if (index < 0) {
        break
      }
      hits += 1
      from = index + keyword.length
    }
    score += hits * Math.min(4, keyword.length)
  }
  return score
}

/**
 * 从教师上传的教材 / 教参中挑选与本次生成最相关的片段，总长度不超过 maxChars。
 * 相关度相同时保留原文顺序；没有命中关键词时取开头部分。
 */
export function selectRelevantMaterial(
  sources: ReadonlyArray<MaterialSource>,
  keywords: ReadonlyArray<string>,
  maxChars = DEFAULT_MATERIAL_CHARS
): string {
  const uniqueKeywords = Array.from(new Set(keywords.map((keyword) => keyword.trim()).filter((keyword) => keyword.length >= 2)))
  const scored = sources.flatMap((source, sourceIndex) =>
    splitIntoChunks(source.text).map((chunk, chunkIndex) => ({
      title: source.title,
      chunk,
      score: scoreChunk(chunk, uniqueKeywords),
      order: sourceIndex * 100000 + chunkIndex
    }))
  )
  if (scored.length === 0) {
    return ''
  }
  const anyHit = scored.some((item) => item.score > 0)
  const ranked = anyHit
    ? [...scored].filter((item) => item.score > 0).sort((a, b) => b.score - a.score || a.order - b.order)
    : [...scored].sort((a, b) => a.order - b.order)
  const picked: typeof scored = []
  let used = 0
  for (const item of ranked) {
    const cost = item.chunk.length + item.title.length + 8
    if (used + cost > maxChars) {
      if (picked.length === 0) {
        picked.push({ ...item, chunk: item.chunk.slice(0, Math.max(0, maxChars - item.title.length - 8)) })
      }
      continue
    }
    picked.push(item)
    used += cost
  }
  picked.sort((a, b) => a.order - b.order)
  let lastTitle = ''
  const lines: string[] = []
  for (const item of picked) {
    if (item.title !== lastTitle) {
      lines.push(`【${item.title}】`)
      lastTitle = item.title
    }
    lines.push(item.chunk)
  }
  return lines.join('\n')
}
