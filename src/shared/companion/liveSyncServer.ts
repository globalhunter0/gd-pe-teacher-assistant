import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { timingSafeEqual } from 'node:crypto'
import {
  decryptLiveSyncPayload,
  digestCompanionSnapshot,
  encryptLiveSyncPayload,
  normalizeLiveSyncToken
} from './liveSyncCrypto'
import { parseCompanionSnapshot, serializeCompanionSnapshot } from './parse'
import type { CompanionSnapshot } from './types'

export interface CompanionLiveSyncStatus {
  running: boolean
  token: string
  localUrl: string
  publicUrl: string | null
  revision: number
  tunnelError: string | null
  connectedClients: number
}

interface LiveSyncDeps {
  token: string
  load: () => Promise<CompanionSnapshot>
  apply: (snapshot: CompanionSnapshot) => Promise<void>
  onRemoteApplied?: () => void
}

interface SseClient {
  res: ServerResponse
}

export interface CompanionLiveServer {
  status: () => CompanionLiveSyncStatus
  setPublicUrl: (url: string | null, error: string | null) => void
  stop: () => Promise<void>
}

function tokenMatches(expected: string, received: string | undefined): boolean {
  if (!received) {
    return false
  }
  const left = Buffer.from(normalizeLiveSyncToken(expected))
  const right = Buffer.from(normalizeLiveSyncToken(received))
  return left.length === right.length && left.length > 0 && timingSafeEqual(left, right)
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > 32 * 1024 * 1024) {
        reject(new Error('同步数据过大'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(payload)
  })
  res.end(payload)
}

export async function startCompanionLiveServer(deps: LiveSyncDeps): Promise<CompanionLiveServer> {
  let revision = 0
  let snapshot = await deps.load()
  let digest = await digestCompanionSnapshot(snapshot)
  let publicUrl: string | null = null
  let tunnelError: string | null = null
  let applyingRemote = false
  const clients = new Set<SseClient>()

  async function publishLocal(): Promise<void> {
    if (applyingRemote) {
      return
    }
    const loaded = await deps.load()
    const nextDigest = await digestCompanionSnapshot(loaded)
    if (nextDigest === digest) {
      return
    }
    snapshot = loaded
    digest = nextDigest
    revision += 1
    broadcast()
  }

  function broadcast(): void {
    const payload = JSON.stringify({ revision })
    for (const client of clients) {
      client.res.write(`event: revision\ndata: ${payload}\n\n`)
    }
  }

  const poll = setInterval(() => {
    void publishLocal().catch(() => undefined)
  }, 1500)

  const server = createServer((req, res) => {
    const origin = req.headers.origin
    if (typeof origin === 'string' && origin) {
      res.setHeader('access-control-allow-origin', origin)
      res.setHeader('vary', 'Origin')
    }
    res.setHeader('access-control-allow-methods', 'GET, PUT, OPTIONS')
    res.setHeader('access-control-allow-headers', 'content-type, x-gdpe-token')
    res.setHeader('access-control-max-age', '600')

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    const url = new URL(req.url ?? '/', 'http://127.0.0.1')
    if (!tokenMatches(deps.token, req.headers['x-gdpe-token'] as string | undefined)) {
      sendJson(res, 401, { error: '同步码不正确' })
      return
    }

    if (req.method === 'GET' && url.pathname === '/sync/events') {
      res.writeHead(200, {
        'content-type': 'text/event-stream; charset=utf-8',
        'cache-control': 'no-store',
        connection: 'keep-alive'
      })
      res.write(`event: revision\ndata: ${JSON.stringify({ revision })}\n\n`)
      const client = { res }
      clients.add(client)
      req.on('close', () => clients.delete(client))
      return
    }

    if (req.method === 'GET' && url.pathname === '/sync/snapshot') {
      void encryptLiveSyncPayload(deps.token, serializeCompanionSnapshot(snapshot))
        .then((sealed) => sendJson(res, 200, { revision, ...sealed }))
        .catch((error: unknown) => sendJson(res, 500, { error: error instanceof Error ? error.message : '读取失败' }))
      return
    }

    if (req.method === 'PUT' && url.pathname === '/sync/snapshot') {
      void readBody(req)
        .then(async (raw) => {
          const body = JSON.parse(raw) as { baseRevision?: unknown; iv?: unknown; ciphertext?: unknown }
          if (body.baseRevision !== revision || typeof body.iv !== 'string' || typeof body.ciphertext !== 'string') {
            sendJson(res, 409, { revision })
            return
          }
          const json = await decryptLiveSyncPayload(deps.token, body.iv, body.ciphertext)
          const parsed = parseCompanionSnapshot(JSON.parse(json))
          applyingRemote = true
          try {
            await deps.apply(parsed)
            snapshot = parsed
            digest = await digestCompanionSnapshot(parsed)
            revision += 1
          } finally {
            applyingRemote = false
          }
          sendJson(res, 200, { revision })
          broadcast()
          deps.onRemoteApplied?.()
        })
        .catch((error: unknown) => {
          applyingRemote = false
          sendJson(res, 400, { error: error instanceof Error ? error.message : '同步失败' })
        })
      return
    }

    sendJson(res, 404, { error: '未知接口' })
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve())
  })
  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : 0

  return {
    status: () => ({
      running: true,
      token: deps.token,
      localUrl: `http://127.0.0.1:${port}`,
      publicUrl,
      revision,
      tunnelError,
      connectedClients: clients.size
    }),
    setPublicUrl(url, error) {
      publicUrl = url
      tunnelError = error
    },
    async stop() {
      clearInterval(poll)
      for (const client of clients) {
        client.res.end()
      }
      clients.clear()
      await new Promise<void>((resolve) => server.close(() => resolve()))
    }
  }
}
