import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

export const MAX_PDF_PAGES = 400

interface PdfTextItem {
  str?: string
  hasEOL?: boolean
}

interface PdfJsModule {
  getDocument: (options: Record<string, unknown>) => {
    promise: Promise<{
      numPages: number
      getPage: (index: number) => Promise<{ getTextContent: () => Promise<{ items: PdfTextItem[] }>; cleanup: () => void }>
      destroy: () => Promise<void>
    }>
  }
}

let pdfjsPromise: Promise<{ pdfjs: PdfJsModule; root: string }> | null = null

function loadPdfJs(): Promise<{ pdfjs: PdfJsModule; root: string }> {
  pdfjsPromise ??= (async () => {
    const require = createRequire(import.meta.url)
    const entry = require.resolve('pdfjs-dist/legacy/build/pdf.mjs')
    const pdfjs = (await import(/* @vite-ignore */ pathToFileURL(entry).href)) as PdfJsModule
    return { pdfjs, root: dirname(dirname(dirname(entry))) }
  })()
  return pdfjsPromise
}

/** 提取文字版 PDF 的文本；扫描件没有文字层，会返回空字符串。 */
export async function extractPdfText(buffer: Buffer): Promise<{ text: string; pages: number; truncated: boolean }> {
  const { pdfjs, root } = await loadPdfJs()
  const task = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    cMapUrl: `${join(root, 'cmaps')}/`,
    cMapPacked: true,
    standardFontDataUrl: `${join(root, 'standard_fonts')}/`,
    useSystemFonts: false,
    isEvalSupported: false,
    disableFontFace: true,
    verbosity: 0
  })
  const document = await task.promise
  try {
    const pages = Math.min(document.numPages, MAX_PDF_PAGES)
    const parts: string[] = []
    for (let index = 1; index <= pages; index += 1) {
      const page = await document.getPage(index)
      const content = await page.getTextContent()
      parts.push(content.items.map((item) => `${item.str ?? ''}${item.hasEOL ? '\n' : ''}`).join(''))
      page.cleanup()
    }
    return { text: parts.join('\n\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim(), pages: document.numPages, truncated: document.numPages > pages }
  } finally {
    await document.destroy()
  }
}
