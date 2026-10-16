import { useEffect, useState } from 'react'
import {
  companionSnapshotHasUserData,
  decryptLiveSyncPayload,
  digestCompanionSnapshot,
  encryptLiveSyncPayload,
  normalizeLiveSyncToken,
  parseCompanionSnapshot,
  serializeCompanionSnapshot
} from '@shared/companion'
import { getAppApi } from '../platform/appApi'

const URL_KEY = 'gdpe-live-url'
const TOKEN_KEY = 'gdpe-live-token'
const ENABLED_KEY = 'gdpe-live-enabled'

export interface CompanionLiveClientStatus {
  enabled: boolean
  phase: 'off' | 'connecting' | 'live' | 'error'
  message: string
  revision: number
}

const idle: CompanionLiveClientStatus = { enabled: false, phase: 'off', message: '未连接', revision: 0 }
let status: CompanionLiveClientStatus = { ...idle }
const listeners = new Set<(value: CompanionLiveClientStatus) => void>()
let runToken = 0

function emit(next: CompanionLiveClientStatus): void {
  status = next
  for (const listener of listeners) {
    listener(status)
  }
}

export function readSavedLiveSync(): { url: string; token: string; enabled: boolean } {
  return {
    url: localStorage.getItem(URL_KEY) ?? '',
    token: localStorage.getItem(TOKEN_KEY) ?? '',
    enabled: localStorage.getItem(ENABLED_KEY) === '1'
  }
}

export function saveLiveSyncConnection(url: string, token: string, enabled: boolean): void {
  localStorage.setItem(URL_KEY, url.trim().replace(/\/$/, ''))
  localStorage.setItem(TOKEN_KEY, token.trim())
  localStorage.setItem(ENABLED_KEY, enabled ? '1' : '0')
  if (!enabled) {
    emit({ ...idle })
  }
}

function headers(token: string): HeadersInit {
  return { 'content-type': 'application/json', 'x-gdpe-token': normalizeLiveSyncToken(token) }
}

async function pullSnapshot(baseUrl: string, token: string): Promise<{ revision: number; json: string }> {
  const response = await fetch(`${baseUrl}/sync/snapshot`, { headers: headers(token), cache: 'no-store' })
  if (response.status === 401) {
    throw new Error('同步码不正确')
  }
  if (!response.ok) {
    throw new Error('暂时连不上电脑')
  }
  const body = (await response.json()) as { revision: number; iv: string; ciphertext: string }
  const json = await decryptLiveSyncPayload(token, body.iv, body.ciphertext)
  return { revision: body.revision, json }
}

export function useCompanionLiveSyncEngine(): void {
  useEffect(() => {
    let disposed = false
    let baselineDigest = ''

    async function pushLocal(baseUrl: string, token: string, baseRevision: number, localDigest: string): Promise<void> {
      const api = await getAppApi()
      const local = await api.companion.getSnapshot()
      const sealed = await encryptLiveSyncPayload(token, serializeCompanionSnapshot(local))
      const response = await fetch(`${baseUrl}/sync/snapshot`, {
        method: 'PUT',
        headers: headers(token),
        body: JSON.stringify({ baseRevision, ...sealed })
      })
      if (response.status === 409) {
        return
      }
      if (!response.ok) {
        throw new Error('手机上的修改没有传回电脑')
      }
      const body = (await response.json()) as { revision: number }
      baselineDigest = localDigest
      emit({ enabled: true, phase: 'live', message: '已把手机上的修改传到电脑', revision: body.revision })
    }

    async function align(baseUrl: string, token: string): Promise<void> {
      const remote = await pullSnapshot(baseUrl, token)
      const remoteSnapshot = parseCompanionSnapshot(JSON.parse(remote.json))
      const remoteDigest = await digestCompanionSnapshot(remoteSnapshot)
      const api = await getAppApi()
      const local = await api.companion.getSnapshot()
      const localDigest = await digestCompanionSnapshot(local)

      if (localDigest === remoteDigest) {
        baselineDigest = localDigest
        emit({ enabled: true, phase: 'live', message: '已和电脑保持同步', revision: remote.revision })
        return
      }

      if (baselineDigest === '') {
        const localHasData = companionSnapshotHasUserData(local)
        const remoteHasData = companionSnapshotHasUserData(remoteSnapshot)
        if (localHasData && !remoteHasData) {
          await pushLocal(baseUrl, token, remote.revision, localDigest)
          return
        }
        if (localHasData && remoteHasData) {
          const confirmed = window.confirm('电脑和手机都有数据，且内容不同。继续后以电脑当前数据为准，手机上不同的部分会被替换。')
          if (!confirmed) {
            saveLiveSyncConnection(baseUrl, token, false)
            notifyLiveSyncConfigChanged()
            return
          }
        }
        await api.companion.applySnapshot(remoteSnapshot)
        window.location.reload()
        return
      }

      if (localDigest !== baselineDigest) {
        await pushLocal(baseUrl, token, remote.revision, localDigest)
        return
      }

      await api.companion.applySnapshot(remoteSnapshot)
      window.location.reload()
    }

    async function loop(generation: number): Promise<void> {
      const saved = readSavedLiveSync()
      if (!saved.enabled || !saved.url || !saved.token) {
        emit({ ...idle })
        return
      }
      emit({ enabled: true, phase: 'connecting', message: '正在连接电脑…', revision: status.revision })
      while (!disposed && generation === runToken) {
        try {
          await align(saved.url, saved.token)
          await new Promise((resolve) => window.setTimeout(resolve, 2000))
        } catch (error) {
          if (disposed || generation !== runToken) {
            return
          }
          emit({
            enabled: true,
            phase: 'error',
            message: error instanceof Error ? error.message : '连接中断，正在重试',
            revision: status.revision
          })
          await new Promise((resolve) => window.setTimeout(resolve, 3000))
        }
      }
    }

    void loop(runToken)
    const onStorage = () => {
      runToken += 1
      baselineDigest = ''
      void loop(runToken)
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('gdpe-live-sync-changed', onStorage)
    return () => {
      disposed = true
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('gdpe-live-sync-changed', onStorage)
    }
  }, [])
}

export function useCompanionLiveSyncStatus(): CompanionLiveClientStatus {
  const [value, setValue] = useState(status)
  useEffect(() => {
    const listener = (next: CompanionLiveClientStatus) => setValue(next)
    listeners.add(listener)
    setValue(status)
    return () => {
      listeners.delete(listener)
    }
  }, [])
  return value
}

export function notifyLiveSyncConfigChanged(): void {
  window.dispatchEvent(new Event('gdpe-live-sync-changed'))
}
