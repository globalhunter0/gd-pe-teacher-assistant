import { ipcMain, safeStorage } from 'electron'
import { IPC_CHANNELS } from '../shared/appApi'
import { normalizeApiKey, parseAiModelConfig } from '../shared/aiModel/config'
import { requestChatCompletion } from '../shared/aiModel/client'
import { createAiModelStore, type AiModelStore } from '../shared/aiModel/store'
import { AiRequestError, type AiConnectionTestResult, type AiModelSaveInput } from '../shared/aiModel/types'
import { previewMaterials } from './materialService'
import { getUserDataRoot } from './userDataPaths'

let store: AiModelStore | null = null

export function getAiModelStore(): AiModelStore {
  store ??= createAiModelStore(getUserDataRoot(), {
    isAvailable: () => safeStorage.isEncryptionAvailable(),
    encrypt: (plain) => safeStorage.encryptString(plain),
    decrypt: (data) => safeStorage.decryptString(data)
  })
  return store
}

async function testConnection(input: AiModelSaveInput): Promise<AiConnectionTestResult> {
  const started = Date.now()
  let model = ''
  try {
    const config = parseAiModelConfig(input?.config)
    model = config.model
    const apiKey = input.apiKey === undefined ? await getAiModelStore().getApiKey() : normalizeApiKey(input.apiKey)
    const result = await requestChatCompletion({
      baseUrl: config.baseUrl,
      apiKey,
      model: config.model,
      messages: [{ role: 'user', content: '请只回复“连接成功”四个字。' }],
      temperature: 0,
      maxTokens: 16,
      timeoutMs: Math.min(config.timeoutSeconds, 60) * 1000
    })
    return { ok: true, message: `连接成功：${result.content.trim().slice(0, 40)}`, model: result.model, latencyMs: Date.now() - started }
  } catch (error) {
    const message = error instanceof AiRequestError || error instanceof Error ? error.message : String(error)
    return { ok: false, message, model, latencyMs: Date.now() - started }
  }
}

export function registerAiModelIpc(): void {
  ipcMain.handle(IPC_CHANNELS.aiModel.getStatus, async () => getAiModelStore().getStatus())
  ipcMain.handle(IPC_CHANNELS.aiModel.save, async (_event, input: AiModelSaveInput) => getAiModelStore().save(input))
  ipcMain.handle(IPC_CHANNELS.aiModel.test, async (_event, input: AiModelSaveInput) => testConnection(input))
  ipcMain.handle(IPC_CHANNELS.materials.preview, async (_event, resourceIds: unknown) => previewMaterials(resourceIds))
}
