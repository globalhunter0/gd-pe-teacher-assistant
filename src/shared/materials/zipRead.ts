import { inflateRawSync } from 'node:zlib'

const EOCD_SIGNATURE = 0x06054b50
const CENTRAL_SIGNATURE = 0x02014b50
const LOCAL_SIGNATURE = 0x04034b50
const MAX_ENTRY_BYTES = 64 * 1024 * 1024

/** 只读 ZIP（DOCX）中的指定条目，支持 stored 与 deflate。 */
export function readZipEntry(buffer: Buffer, entryName: string): Buffer | null {
  let eocd = -1
  for (let offset = buffer.length - 22; offset >= Math.max(0, buffer.length - 65557); offset -= 1) {
    if (buffer.readUInt32LE(offset) === EOCD_SIGNATURE) {
      eocd = offset
      break
    }
  }
  if (eocd < 0) {
    throw new Error('不是有效的 ZIP / DOCX 文件')
  }
  const entryCount = buffer.readUInt16LE(eocd + 10)
  let pointer = buffer.readUInt32LE(eocd + 16)
  for (let index = 0; index < entryCount; index += 1) {
    if (pointer + 46 > buffer.length || buffer.readUInt32LE(pointer) !== CENTRAL_SIGNATURE) {
      throw new Error('ZIP 目录损坏')
    }
    const method = buffer.readUInt16LE(pointer + 10)
    const compressedSize = buffer.readUInt32LE(pointer + 20)
    const uncompressedSize = buffer.readUInt32LE(pointer + 24)
    const nameLength = buffer.readUInt16LE(pointer + 28)
    const extraLength = buffer.readUInt16LE(pointer + 30)
    const commentLength = buffer.readUInt16LE(pointer + 32)
    const localOffset = buffer.readUInt32LE(pointer + 42)
    const name = buffer.subarray(pointer + 46, pointer + 46 + nameLength).toString('utf8')
    pointer += 46 + nameLength + extraLength + commentLength
    if (name !== entryName) {
      continue
    }
    if (uncompressedSize > MAX_ENTRY_BYTES) {
      throw new Error('文档内容过大')
    }
    if (localOffset + 30 > buffer.length || buffer.readUInt32LE(localOffset) !== LOCAL_SIGNATURE) {
      throw new Error('ZIP 条目损坏')
    }
    const dataStart = localOffset + 30 + buffer.readUInt16LE(localOffset + 26) + buffer.readUInt16LE(localOffset + 28)
    const data = buffer.subarray(dataStart, dataStart + compressedSize)
    if (method === 0) {
      return Buffer.from(data)
    }
    if (method === 8) {
      return inflateRawSync(data, { maxOutputLength: MAX_ENTRY_BYTES })
    }
    throw new Error(`不支持的压缩方式：${method}`)
  }
  return null
}
