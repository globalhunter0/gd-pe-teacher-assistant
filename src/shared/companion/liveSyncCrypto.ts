import type { CompanionSnapshot } from './types'

const TOKEN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function createLiveSyncToken(): string {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  let raw = ''
  for (const byte of bytes) {
    raw += TOKEN_ALPHABET[byte % TOKEN_ALPHABET.length]
  }
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`
}

export function normalizeLiveSyncToken(input: string): string {
  return input.replace(/[^0-9a-z]/gi, '').toUpperCase()
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

async function syncKey(token: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalizeLiveSyncToken(token)))
  return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

export async function encryptLiveSyncPayload(token: string, json: string): Promise<{ iv: string; ciphertext: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await syncKey(token)
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(json))
  return { iv: bytesToBase64(iv), ciphertext: bytesToBase64(new Uint8Array(encrypted)) }
}

export async function decryptLiveSyncPayload(token: string, iv: string, ciphertext: string): Promise<string> {
  const key = await syncKey(token)
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(iv) },
    key,
    base64ToBytes(ciphertext)
  )
  return new TextDecoder().decode(plain)
}

export function companionContentKey(snapshot: CompanionSnapshot): string {
  return JSON.stringify({
    classes: snapshot.classes,
    students: snapshot.students,
    testItems: snapshot.testItems,
    peTests: snapshot.peTests,
    schedule: snapshot.schedule ?? null,
    peSessions: snapshot.peSessions ?? null
  })
}

export async function digestCompanionSnapshot(snapshot: CompanionSnapshot): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(companionContentKey(snapshot)))
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function companionSnapshotHasUserData(snapshot: CompanionSnapshot): boolean {
  return (
    snapshot.classes.length +
      snapshot.students.length +
      snapshot.peTests.length +
      (snapshot.schedule?.length ?? 0) +
      (snapshot.peSessions?.length ?? 0) >
    0
  )
}
