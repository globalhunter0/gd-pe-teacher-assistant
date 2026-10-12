import { extname } from 'node:path'
import { extractDocxText } from './docx'
import { extractPdfText } from './pdf'

export const MAX_MATERIAL_FILE_BYTES = 40 * 1024 * 1024
export const MAX_MATERIAL_TEXT_CHARS = 400000
export const SUPPORTED_MATERIAL_EXTENSIONS = ['.txt', '.md', '.docx', '.pdf'] as const

export interface ExtractedMaterial {
  text: string
  note: string | null
}

export function isSupportedMaterial(fileName: string): boolean {
  return (SUPPORTED_MATERIAL_EXTENSIONS as readonly string[]).includes(extname(fileName).toLowerCase())
}

/** 兼容 UTF-8（含 BOM）、UTF-16 LE/BE（BOM）与 GBK 编码的纯文本。 */
export function decodeText(buffer: Buffer): string {
  if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return buffer.subarray(3).toString('utf8')
  }
  if (buffer[0] === 0xff && buffer[1] === 0xfe) {
    return new TextDecoder('utf-16le').decode(buffer.subarray(2))
  }
  if (buffer[0] === 0xfe && buffer[1] === 0xff) {
    return new TextDecoder('utf-16be').decode(buffer.subarray(2))
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  } catch {
    return new TextDecoder('gbk').decode(buffer)
  }
}

export async function extractMaterialText(fileName: string, buffer: Buffer): Promise<ExtractedMaterial> {
  if (buffer.byteLength > MAX_MATERIAL_FILE_BYTES) {
    throw new Error('文件超过 40MB，请拆分后再作为参考资料')
  }
  const extension = extname(fileName).toLowerCase()
  let text: string
  let note: string | null = null
  if (extension === '.txt' || extension === '.md') {
    text = decodeText(buffer)
  } else if (extension === '.docx') {
    text = extractDocxText(buffer)
  } else if (extension === '.pdf') {
    const pdf = await extractPdfText(buffer)
    text = pdf.text
    if (pdf.truncated) {
      note = `PDF 共 ${pdf.pages} 页，只读取了前面部分`
    }
    if (!text.trim()) {
      note = 'PDF 没有可提取的文字（可能是扫描件），请改用 Word 或文字版 PDF'
    }
  } else {
    throw new Error('只支持 txt、md、docx、pdf 格式的参考资料')
  }
  text = text.replace(/\r\n?/g, '\n').replace(/\u0000/g, '')
  if (text.length > MAX_MATERIAL_TEXT_CHARS) {
    text = text.slice(0, MAX_MATERIAL_TEXT_CHARS)
    note = note ?? '资料较长，只读取了前面部分'
  }
  return { text, note }
}
