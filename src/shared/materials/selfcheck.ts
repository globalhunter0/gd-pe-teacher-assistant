import { deflateRawSync } from 'node:zlib'
import { docxXmlToText, extractDocxText } from './docx'
import { decodeText, extractMaterialText, isSupportedMaterial } from './extract'
import { extractPdfText } from './pdf'
import { selectRelevantMaterial, splitIntoChunks } from './select'
import { readZipEntry } from './zipRead'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`[materials selfcheck] ${message}`)
  }
}

async function expectReject(promise: Promise<unknown>, message: string): Promise<void> {
  try {
    await promise
  } catch {
    return
  }
  throw new Error(`[materials selfcheck] 应当拒绝：${message}`)
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(data: Buffer): number {
  let crc = 0xffffffff
  for (const byte of data) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

/** 测试用 ZIP 生成器：模拟 Word 保存的 deflate 压缩条目。 */
function buildDeflateZip(entries: Array<{ name: string; data: Buffer; store?: boolean }>): Buffer {
  const locals: Buffer[] = []
  const centrals: Buffer[] = []
  let offset = 0
  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8')
    const compressed = entry.store ? entry.data : deflateRawSync(entry.data)
    const method = entry.store ? 0 : 8
    const crc = crc32(entry.data)
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(0x0800, 6)
    local.writeUInt16LE(method, 8)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(compressed.length, 18)
    local.writeUInt32LE(entry.data.length, 22)
    local.writeUInt16LE(name.length, 26)
    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(20, 4)
    central.writeUInt16LE(20, 6)
    central.writeUInt16LE(0x0800, 8)
    central.writeUInt16LE(method, 10)
    central.writeUInt32LE(crc, 16)
    central.writeUInt32LE(compressed.length, 20)
    central.writeUInt32LE(entry.data.length, 24)
    central.writeUInt16LE(name.length, 28)
    central.writeUInt32LE(offset, 42)
    locals.push(local, name, compressed)
    centrals.push(central, name)
    offset += local.length + name.length + compressed.length
  }
  const centralBuffer = Buffer.concat(centrals)
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0)
  eocd.writeUInt16LE(entries.length, 8)
  eocd.writeUInt16LE(entries.length, 10)
  eocd.writeUInt32LE(centralBuffer.length, 12)
  eocd.writeUInt32LE(offset, 16)
  return Buffer.concat([...locals, centralBuffer, eocd])
}

const DOCUMENT_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
<w:p><w:r><w:t>第一课 篮球运球</w:t></w:r></w:p>
<w:p><w:r><w:t xml:space="preserve">教学目标：</w:t></w:r><w:r><w:t>运球 &amp; 传球 &lt;基础&gt;</w:t></w:r></w:p>
<w:tbl><w:tr><w:tc><w:p><w:r><w:t>重点</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>手型</w:t></w:r></w:p></w:tc></w:tr></w:tbl>
<w:p><w:r><w:t>换行前</w:t></w:r><w:r><w:br/><w:t>换行后</w:t><w:tab/><w:t>制表</w:t></w:r></w:p>
</w:body></w:document>`

function buildPdf(text: string): Buffer {
  const stream = `BT /F1 18 Tf 20 100 Td (${text}) Tj ET`
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 144] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  ]
  let body = '%PDF-1.4\n'
  const offsets: number[] = []
  objects.forEach((object, index) => {
    offsets.push(body.length)
    body += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xref = body.length
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((value) => `${String(value).padStart(10, '0')} 00000 n \n`).join('')}`
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return Buffer.from(body, 'latin1')
}

async function checkExtraction(): Promise<void> {
  const docx = buildDeflateZip([
    { name: '[Content_Types].xml', data: Buffer.from('<Types/>'), store: true },
    { name: 'word/document.xml', data: Buffer.from(DOCUMENT_XML, 'utf8') }
  ])
  assert(readZipEntry(docx, '[Content_Types].xml')?.toString() === '<Types/>', 'stored 条目可读')
  assert(readZipEntry(docx, 'missing.xml') === null, '缺失条目返回 null')
  const text = extractDocxText(docx)
  assert(text.includes('第一课 篮球运球'), `DOCX 段落：${text}`)
  assert(text.includes('教学目标：运球 & 传球 <基础>'), `DOCX 实体解码与多 run 合并：${text}`)
  assert(text.includes('重点\t手型'), `DOCX 表格单元格以制表符分隔：${JSON.stringify(text)}`)
  assert(text.includes('换行前\n换行后\t制表'), `DOCX 换行与制表：${JSON.stringify(text)}`)
  assert(!text.includes('<'.repeat(1) + 'w:'), 'DOCX 不应残留 XML 标签')
  assert(docxXmlToText('<w:p><w:r><w:t>&#x7BEE;&#29699;</w:t></w:r></w:p>') === '篮球', '数字实体解码')
  let rejected = false
  try {
    extractDocxText(Buffer.from('not a zip at all, definitely not'))
  } catch {
    rejected = true
  }
  assert(rejected, '非 ZIP 应拒绝')

  const pdf = await extractPdfText(buildPdf('Basketball dribble lesson'))
  assert(pdf.pages === 1 && pdf.text.includes('Basketball dribble lesson'), `PDF 文本提取：${JSON.stringify(pdf)}`)
  const viaDispatch = await extractMaterialText('教参.PDF', buildPdf('Volleyball pass'))
  assert(viaDispatch.text.includes('Volleyball pass') && viaDispatch.note === null, '按扩展名（大小写不敏感）分派 PDF')
  const blankPdf = await extractMaterialText('扫描件.pdf', buildPdf(''))
  assert(blankPdf.text === '' && blankPdf.note?.includes('扫描件'), '无文字层的 PDF 应提示扫描件')
  await expectReject(extractMaterialText('a.pdf', Buffer.from('%PDF-1.4 broken')), '损坏 PDF')

  assert(decodeText(Buffer.from([0xef, 0xbb, 0xbf, ...Buffer.from('篮球')])) === '篮球', 'UTF-8 BOM')
  assert(decodeText(Buffer.from([0xc0, 0xba, 0xc7, 0xf2])) === '篮球', 'GBK 编码')
  assert(decodeText(Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from('足球', 'utf16le')])) === '足球', 'UTF-16 LE')
  assert((await extractMaterialText('说明.md', Buffer.from('# 标题\r\n正文\u0000'))).text === '# 标题\n正文', 'Markdown 换行归一并去除空字符')
  assert((await extractMaterialText('教案.docx', docx)).text === text, 'DOCX 分派')
  assert(isSupportedMaterial('a.TXT') && !isSupportedMaterial('a.doc') && !isSupportedMaterial('a.exe'), '支持的格式判断')
  await expectReject(extractMaterialText('a.doc', Buffer.from('x')), '旧版 .doc')
  await expectReject(extractMaterialText('a.txt', Buffer.alloc(41 * 1024 * 1024)), '超过 40MB')
  const long = await extractMaterialText('long.txt', Buffer.from('长'.repeat(400010)))
  assert(long.text.length === 400000 && long.note !== null, '超长文本截断并提示')
}

function checkSelection(): void {
  const pad = (topic: string): string => `${topic}练习要求。`.repeat(80)
  const material = [
    `短跑起跑技术要点。${pad('短跑')}`,
    `篮球运球的手型要求：五指自然分开，用指根以上部位控球。${pad('控球')}`,
    `跳远助跑节奏。${pad('跳远')}`,
    `篮球传接球：双手胸前传球，篮球比赛中注意配合。${pad('传球')}`
  ].join('\n\n')
  const chunks = splitIntoChunks(material)
  assert(chunks.length === 4 && chunks.join('').includes('跳远'), `切块保留全部内容：${chunks.length}`)
  const picked = selectRelevantMaterial([{ title: '人教版教师用书', text: material }], ['篮球', '运球'], 4000)
  assert(picked.startsWith('【人教版教师用书】') && picked.includes('手型') && picked.includes('双手胸前传球'), `命中关键词：${picked}`)
  assert(!picked.includes('跳远') && !picked.includes('短跑'), '无关片段不应入选')

  const many = Array.from({ length: 60 }, (_, index) => `第${index + 1}段：篮球练习方法${'。'.repeat(200)}`).join('\n\n')
  const limited = selectRelevantMaterial([{ title: 'A', text: many }], ['篮球'], 3000)
  assert(limited.length <= 3000, `总长度不超过上限：${limited.length}`)
  assert(limited.indexOf('第1段') < limited.indexOf('第2段'), '入选片段保持原文顺序')

  const fallback = selectRelevantMaterial([{ title: 'B', text: '开头内容\n\n后面内容' }], ['游泳'], 1000)
  assert(fallback.includes('开头内容'), '无命中时取开头部分')
  assert(selectRelevantMaterial([], ['篮球']) === '', '无资料返回空')
  const huge = selectRelevantMaterial([{ title: 'C', text: '篮球'.repeat(5000) }], ['篮球'], 500)
  assert(huge.length > 0 && huge.length <= 500, '单块超长时截断而非丢弃')
  const multi = selectRelevantMaterial(
    [
      { title: '教材', text: '篮球规则简介。' },
      { title: '教参', text: '篮球教学建议。' }
    ],
    ['篮球'],
    1000
  )
  assert(multi.indexOf('【教材】') < multi.indexOf('【教参】'), '多份资料按选择顺序分标题')
}

export async function runMaterialsSelfCheckOrThrow(): Promise<string> {
  await checkExtraction()
  checkSelection()
  return 'materials selfcheck ok (docx deflate / pdf text / encodings / limits / relevant selection)'
}

if (process.argv[1] && /materials[\\/]selfcheck\.ts$/.test(process.argv[1])) {
  runMaterialsSelfCheckOrThrow().then(
    (message) => console.log(message),
    (error) => {
      console.error(error)
      process.exitCode = 1
    }
  )
}
