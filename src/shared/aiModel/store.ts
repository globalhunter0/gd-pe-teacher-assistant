import { readFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { replaceFileAtomic } from '../persistence/atomicFile'
import { defaultAiModelConfig, normalizeApiKey, parseAiModelConfig, parseStoredAiModelConfig } from './config'
import type { AiModelConfig, AiModelSaveInput, AiModelStatus } from './types'

/** 模型配置与密钥不属于教学业务数据：不进入备份包，换电脑需重新填写密钥。 */
export const AI_MODEL_CONFIG_FILE = 'ai-model.json'
export const AI_MODEL_KEY_FILE = 'ai-model.key'

export interface SecretCipher {
  isAvailable: () => boolean
  encrypt: (plain: string) => Buffer
  decrypt: (data: Buffer) => string
}

export interface AiModelStore {
  getStatus: () => Promise<AiModelStatus>
  getConfig: () => Promise<AiModelConfig>
  getApiKey: () => Promise<string>
  save: (input: AiModelSaveInput) => Promise<AiModelStatus>
}

async function readOptional(path: string): Promise<Buffer | null> {
  try {
    return await readFile(path)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    throw error
  }
}

export function createAiModelStore(root: string, cipher: SecretCipher): AiModelStore {
  const configPath = join(root, AI_MODEL_CONFIG_FILE)
  const keyPath = join(root, AI_MODEL_KEY_FILE)

  async function getConfig(): Promise<AiModelConfig> {
    const raw = await readOptional(configPath)
    if (!raw) {
      return defaultAiModelConfig()
    }
    try {
      const parsed = JSON.parse(raw.toString('utf8')) as { data?: unknown }
      return parseStoredAiModelConfig(parsed?.data ?? parsed)
    } catch {
      return defaultAiModelConfig()
    }
  }

  async function getApiKey(): Promise<string> {
    const raw = await readOptional(keyPath)
    if (!raw || raw.byteLength === 0 || !cipher.isAvailable()) {
      return ''
    }
    try {
      return cipher.decrypt(raw)
    } catch {
      return ''
    }
  }

  async function getStatus(): Promise<AiModelStatus> {
    return {
      config: await getConfig(),
      hasApiKey: (await getApiKey()).length > 0,
      encryptionAvailable: cipher.isAvailable()
    }
  }

  async function save(input: AiModelSaveInput): Promise<AiModelStatus> {
    if (typeof input !== 'object' || input === null) {
      throw new Error('模型配置格式不正确')
    }
    const config = parseAiModelConfig(input.config)
    if (input.apiKey !== undefined) {
      const key = normalizeApiKey(input.apiKey)
      if (key) {
        if (!cipher.isAvailable()) {
          throw new Error('本机系统加密不可用，无法安全保存 API Key')
        }
        await replaceFileAtomic(keyPath, cipher.encrypt(key))
      } else {
        await unlink(keyPath).catch((error: NodeJS.ErrnoException) => {
          if (error.code !== 'ENOENT') throw error
        })
      }
    }
    const payload = { version: 1, updatedAt: new Date().toISOString(), data: config }
    await replaceFileAtomic(configPath, `${JSON.stringify(payload, null, 2)}\n`)
    return getStatus()
  }

  return { getStatus, getConfig, getApiKey, save }
}
