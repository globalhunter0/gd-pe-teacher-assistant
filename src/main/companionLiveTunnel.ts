import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'

const CLOUDFLARED_URL =
  'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe'

async function ensureCloudflared(executablePath: string): Promise<void> {
  try {
    const info = await stat(executablePath)
    if (info.size > 1_000_000) {
      return
    }
  } catch {
    // download below
  }
  const response = await fetch(CLOUDFLARED_URL)
  if (!response.ok || !response.body) {
    throw new Error(`无法下载在线同步组件（${response.status}）`)
  }
  await pipeline(Readable.fromWeb(response.body), createWriteStream(executablePath))
}

export async function startCloudflareTunnel(
  port: number,
  executablePath: string
): Promise<{ url: string; stop: () => void }> {
  await ensureCloudflared(executablePath)
  const child: ChildProcess = spawn(
    executablePath,
    ['tunnel', '--url', `http://127.0.0.1:${port}`, '--no-autoupdate', '--protocol', 'http2'],
    { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }
  )
  const url = await new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('在线地址等待超时，请检查网络后重试')), 45_000)
    const onData = (chunk: Buffer) => {
      const matched = chunk.toString('utf8').match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)
      if (matched) {
        clearTimeout(timer)
        resolve(matched[0])
      }
    }
    child.stdout?.on('data', onData)
    child.stderr?.on('data', onData)
    child.once('exit', (code) => {
      clearTimeout(timer)
      reject(new Error(`在线同步通道已退出（${code ?? 'unknown'}）`))
    })
    child.once('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
  })

  return {
    url,
    stop() {
      if (!child.pid) {
        return
      }
      if (process.platform === 'win32') {
        spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { windowsHide: true })
      } else {
        child.kill()
      }
    }
  }
}
