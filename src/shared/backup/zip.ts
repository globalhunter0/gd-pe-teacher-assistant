const LOCAL_SIG = 0x04034b50
const CENTRAL_SIG = 0x02014b50
const EOCD_SIG = 0x06054b50
const UTF8_FLAG = 1 << 11

function crc32Table(): Uint32Array {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[i] = c >>> 0
  }
  return table
}

const CRC_TABLE = crc32Table()

export function crc32(data: Buffer): number {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function writeU16(target: Buffer, offset: number, value: number): void {
  target.writeUInt16LE(value, offset)
}

function writeU32(target: Buffer, offset: number, value: number): void {
  target.writeUInt32LE(value, offset)
}

export interface ZipEntry {
  name: string
  data: Buffer
}

function assertSafeName(name: string): void {
  const normalized = name.replace(/\\/g, '/')
  if (normalized.startsWith('/') || normalized.includes('..') || normalized === '') {
    throw new Error(`备份包内含有不安全路径：${name}`)
  }
}

export function buildZip(entries: ZipEntry[]): Buffer {
  const chunks: Buffer[] = []
  const centrals: Buffer[] = []
  let offset = 0

  for (const entry of entries) {
    const name = entry.name.replace(/\\/g, '/')
    assertSafeName(name)
    const nameBuf = Buffer.from(name, 'utf8')
    const data = entry.data
    if (data.byteLength > 0xfffffffe || nameBuf.byteLength > 0xffff) {
      throw new Error(`备份条目过大：${name}`)
    }
    const crc = crc32(data)
    const local = Buffer.alloc(30 + nameBuf.byteLength)
    writeU32(local, 0, LOCAL_SIG)
    writeU16(local, 4, 20)
    writeU16(local, 6, UTF8_FLAG)
    writeU16(local, 8, 0)
    writeU16(local, 10, 0)
    writeU16(local, 12, 0)
    writeU32(local, 14, crc)
    writeU32(local, 18, data.byteLength)
    writeU32(local, 22, data.byteLength)
    writeU16(local, 26, nameBuf.byteLength)
    writeU16(local, 28, 0)
    nameBuf.copy(local, 30)
    chunks.push(local, data)

    const central = Buffer.alloc(46 + nameBuf.byteLength)
    writeU32(central, 0, CENTRAL_SIG)
    writeU16(central, 4, 20)
    writeU16(central, 6, 20)
    writeU16(central, 8, UTF8_FLAG)
    writeU16(central, 10, 0)
    writeU16(central, 12, 0)
    writeU16(central, 14, 0)
    writeU32(central, 16, crc)
    writeU32(central, 20, data.byteLength)
    writeU32(central, 24, data.byteLength)
    writeU16(central, 28, nameBuf.byteLength)
    writeU16(central, 30, 0)
    writeU16(central, 32, 0)
    writeU16(central, 34, 0)
    writeU16(central, 36, 0)
    writeU32(central, 38, 0)
    writeU32(central, 42, offset)
    nameBuf.copy(central, 46)
    centrals.push(central)
    offset += local.byteLength + data.byteLength
  }

  const centralDir = Buffer.concat(centrals)
  const eocd = Buffer.alloc(22)
  writeU32(eocd, 0, EOCD_SIG)
  writeU16(eocd, 4, 0)
  writeU16(eocd, 6, 0)
  writeU16(eocd, 8, entries.length)
  writeU16(eocd, 10, entries.length)
  writeU32(eocd, 12, centralDir.byteLength)
  writeU32(eocd, 16, offset)
  writeU16(eocd, 20, 0)

  return Buffer.concat([...chunks, centralDir, eocd])
}

function readU16(buf: Buffer, offset: number): number {
  return buf.readUInt16LE(offset)
}

function readU32(buf: Buffer, offset: number): number {
  return buf.readUInt32LE(offset)
}

function findEocd(buf: Buffer): number {
  const min = Math.max(0, buf.byteLength - 22 - 65535)
  for (let i = buf.byteLength - 22; i >= min; i--) {
    if (readU32(buf, i) === EOCD_SIG) {
      return i
    }
  }
  throw new Error('不是有效的备份包（缺少 ZIP 目录）')
}

export function parseZip(buf: Buffer): ZipEntry[] {
  if (buf.byteLength < 22) {
    throw new Error('不是有效的备份包')
  }
  const eocd = findEocd(buf)
  const count = readU16(buf, eocd + 10)
  const centralSize = readU32(buf, eocd + 12)
  const centralOffset = readU32(buf, eocd + 16)
  if (centralOffset + centralSize > buf.byteLength) {
    throw new Error('备份包目录损坏')
  }

  const entries: ZipEntry[] = []
  let cursor = centralOffset
  for (let i = 0; i < count; i++) {
    if (readU32(buf, cursor) !== CENTRAL_SIG) {
      throw new Error('备份包目录损坏')
    }
    const flags = readU16(buf, cursor + 8)
    const method = readU16(buf, cursor + 10)
    const crc = readU32(buf, cursor + 16)
    const compSize = readU32(buf, cursor + 20)
    const uncompSize = readU32(buf, cursor + 24)
    const nameLen = readU16(buf, cursor + 28)
    const extraLen = readU16(buf, cursor + 30)
    const commentLen = readU16(buf, cursor + 32)
    const localOffset = readU32(buf, cursor + 42)
    const name = buf.subarray(cursor + 46, cursor + 46 + nameLen).toString(flags & UTF8_FLAG ? 'utf8' : 'latin1')
    assertSafeName(name)
    if (method !== 0) {
      throw new Error(`不支持的备份压缩方式：${name}`)
    }
    if (readU32(buf, localOffset) !== LOCAL_SIG) {
      throw new Error(`备份包条目损坏：${name}`)
    }
    const localNameLen = readU16(buf, localOffset + 26)
    const localExtraLen = readU16(buf, localOffset + 28)
    const dataStart = localOffset + 30 + localNameLen + localExtraLen
    const data = buf.subarray(dataStart, dataStart + uncompSize)
    if (data.byteLength !== uncompSize || data.byteLength !== compSize) {
      throw new Error(`备份包条目长度不正确：${name}`)
    }
    if (crc32(data) !== crc) {
      throw new Error(`备份包 CRC 校验失败：${name}`)
    }
    entries.push({ name, data: Buffer.from(data) })
    cursor += 46 + nameLen + extraLen + commentLen
  }

  return entries
}
