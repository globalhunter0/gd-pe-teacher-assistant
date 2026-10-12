import { readZipEntry } from './zipRead'

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

function decodeXml(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_match, code: string) => {
    if (code[0] === '#') {
      const value = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
      return Number.isFinite(value) ? String.fromCodePoint(value) : ''
    }
    return ENTITIES[code.toLowerCase()] ?? ''
  })
}

/** 提取 word/document.xml 的正文：段落换行，表格单元格以制表符分隔。 */
export function docxXmlToText(xml: string): string {
  const token = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:t(?:\s[^>]*)?\/>|<w:tab\/>|<w:br\b[^>]*\/>|<w:tc\b[^>]*>|<\/w:tc>|<\/w:tr>|<\/w:p>/g
  let cellDepth = 0
  let out = ''
  for (const match of xml.matchAll(token)) {
    const tag = match[0]
    if (match[1] !== undefined) {
      out += decodeXml(match[1])
    } else if (tag === '<w:tab/>') {
      out += '\t'
    } else if (tag.startsWith('<w:br')) {
      out += cellDepth > 0 ? ' ' : '\n'
    } else if (tag.startsWith('<w:tc')) {
      cellDepth += 1
    } else if (tag === '</w:tc>') {
      cellDepth = Math.max(0, cellDepth - 1)
      out += '\t'
    } else if (tag === '</w:tr>') {
      out += '\n'
    } else if (tag === '</w:p>') {
      out += cellDepth > 0 ? ' ' : '\n'
    }
  }
  return out
    .split('\n')
    .map((line) => line.replace(/[ \u00a0]+/g, ' ').replace(/ *\t */g, '\t').replace(/\t+$/g, '').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function extractDocxText(buffer: Buffer): string {
  const xml = readZipEntry(buffer, 'word/document.xml')
  if (!xml) {
    throw new Error('DOCX 中找不到正文（word/document.xml）')
  }
  return docxXmlToText(xml.toString('utf8'))
}
