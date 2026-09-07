import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readFile } from 'node:fs/promises'

export function sha256Buffer(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex')
}

export async function sha256File(filePath: string): Promise<string> {
  const hash = createHash('sha256')
  await new Promise<void>((resolve, reject) => {
    const stream = createReadStream(filePath)
    stream.on('data', (chunk) => {
      hash.update(chunk)
    })
    stream.on('error', reject)
    stream.on('end', () => resolve())
  })
  return hash.digest('hex')
}

export async function sha256FileOrBuffer(filePath: string | Buffer): Promise<string> {
  if (typeof filePath === 'string') {
    return sha256File(filePath)
  }
  return sha256Buffer(filePath)
}

export async function readFileSha256(filePath: string): Promise<{ data: Buffer; sha256: string; size: number }> {
  const data = await readFile(filePath)
  return { data, sha256: sha256Buffer(data), size: data.byteLength }
}
