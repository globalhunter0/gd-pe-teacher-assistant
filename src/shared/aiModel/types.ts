export type AiProviderId = 'deepseek' | 'siliconflow' | 'qwen' | 'kimi' | 'zhipu' | 'doubao' | 'openai' | 'custom'

export interface AiProviderPreset {
  id: AiProviderId
  name: string
  baseUrl: string
  defaultModel: string
  suggestedModels: string[]
  keyHint: string
}

export interface AiModelConfig {
  providerId: AiProviderId
  baseUrl: string
  model: string
  temperature: number
  timeoutSeconds: number
  /** 硅基流动兼容接口支持；关闭可显著降低结构化长文本生成耗时。 */
  thinkingEnabled: boolean
}

/** 返回给界面的状态；API Key 永不返回，只告知是否已保存。 */
export interface AiModelStatus {
  config: AiModelConfig
  hasApiKey: boolean
  encryptionAvailable: boolean
}

/** apiKey: undefined 保留原密钥；'' 清除；其他字符串替换。 */
export interface AiModelSaveInput {
  config: AiModelConfig
  apiKey?: string
}

export interface AiConnectionTestResult {
  ok: boolean
  message: string
  model: string
  latencyMs: number
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type AiErrorCode =
  | 'not_configured'
  | 'invalid_config'
  | 'auth'
  | 'rate_limit'
  | 'timeout'
  | 'network'
  | 'server'
  | 'bad_response'
  | 'canceled'

export class AiRequestError extends Error {
  readonly code: AiErrorCode
  readonly status: number | null

  constructor(code: AiErrorCode, message: string, status: number | null = null) {
    super(message)
    this.name = 'AiRequestError'
    this.code = code
    this.status = status
  }
}
