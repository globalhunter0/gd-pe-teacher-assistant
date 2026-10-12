import type { AiModelConfig, AiProviderId, AiProviderPreset } from './types'

/** OpenAI 兼容接口（/chat/completions）的常用国内外服务。地址取自各平台官方文档。 */
export const AI_PROVIDER_PRESETS: AiProviderPreset[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek 深度求索',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    suggestedModels: ['deepseek-chat', 'deepseek-reasoner'],
    keyHint: '在 platform.deepseek.com 创建 API Key'
  },
  {
    id: 'qwen',
    name: '通义千问（阿里云百炼）',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus',
    suggestedModels: ['qwen-plus', 'qwen-max', 'qwen-turbo'],
    keyHint: '在阿里云百炼控制台创建 API Key'
  },
  {
    id: 'kimi',
    name: 'Kimi（月之暗面）',
    baseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-32k',
    suggestedModels: ['moonshot-v1-32k', 'moonshot-v1-128k'],
    keyHint: '在 platform.moonshot.cn 创建 API Key'
  },
  {
    id: 'zhipu',
    name: '智谱 GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4-plus',
    suggestedModels: ['glm-4-plus', 'glm-4-air', 'glm-4-flash'],
    keyHint: '在 open.bigmodel.cn 创建 API Key'
  },
  {
    id: 'doubao',
    name: '豆包（火山方舟）',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    defaultModel: '',
    suggestedModels: [],
    keyHint: '在火山方舟控制台创建 API Key，模型处填写推理接入点 ID 或模型名'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    suggestedModels: ['gpt-4o-mini', 'gpt-4o'],
    keyHint: '在 platform.openai.com 创建 API Key'
  },
  {
    id: 'custom',
    name: '自定义（OpenAI 兼容）',
    baseUrl: '',
    defaultModel: '',
    suggestedModels: [],
    keyHint: '填写兼容 /chat/completions 的服务地址；本机模型可用 http://127.0.0.1'
  }
]

const PROVIDER_IDS = AI_PROVIDER_PRESETS.map((preset) => preset.id)
export const MIN_TIMEOUT_SECONDS = 15
export const MAX_TIMEOUT_SECONDS = 600
export const DEFAULT_TIMEOUT_SECONDS = 180
export const MAX_API_KEY_LENGTH = 512

export function findProviderPreset(id: AiProviderId): AiProviderPreset {
  return AI_PROVIDER_PRESETS.find((preset) => preset.id === id) ?? AI_PROVIDER_PRESETS[AI_PROVIDER_PRESETS.length - 1]
}

export function defaultAiModelConfig(providerId: AiProviderId = 'deepseek'): AiModelConfig {
  const preset = findProviderPreset(providerId)
  return {
    providerId: preset.id,
    baseUrl: preset.baseUrl,
    model: preset.defaultModel,
    temperature: 0.6,
    timeoutSeconds: DEFAULT_TIMEOUT_SECONDS
  }
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

/** 只允许 https；http 仅限本机地址，避免 API Key 明文经过网络。 */
export function normalizeBaseUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('请填写接口地址')
  }
  let url: URL
  try {
    url = new URL(value.trim())
  } catch {
    throw new Error('接口地址格式不正确')
  }
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && LOCAL_HOSTS.has(url.hostname))) {
    throw new Error('接口地址必须使用 https（本机地址可用 http）')
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error('接口地址不能包含账号、查询参数或锚点')
  }
  return url.href.replace(/\/+$/, '').replace(/\/chat\/completions$/, '')
}

export function parseAiModelConfig(input: unknown): AiModelConfig {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new Error('模型配置格式不正确')
  }
  const source = input as Record<string, unknown>
  if (!PROVIDER_IDS.includes(source.providerId as AiProviderId)) {
    throw new Error('模型服务商不正确')
  }
  const model = typeof source.model === 'string' ? source.model.trim() : ''
  if (!model || model.length > 120 || /\s/.test(model)) {
    throw new Error('请填写模型名称（不能包含空格）')
  }
  const temperature = typeof source.temperature === 'number' && Number.isFinite(source.temperature)
    ? Math.min(1.5, Math.max(0, Math.round(source.temperature * 100) / 100))
    : 0.6
  const timeoutSeconds = typeof source.timeoutSeconds === 'number' && Number.isInteger(source.timeoutSeconds)
    ? Math.min(MAX_TIMEOUT_SECONDS, Math.max(MIN_TIMEOUT_SECONDS, source.timeoutSeconds))
    : DEFAULT_TIMEOUT_SECONDS
  return {
    providerId: source.providerId as AiProviderId,
    baseUrl: normalizeBaseUrl(source.baseUrl),
    model,
    temperature,
    timeoutSeconds
  }
}

/** 读取已保存配置；损坏或缺失时回退默认值，不阻塞其他功能。 */
export function parseStoredAiModelConfig(input: unknown): AiModelConfig {
  try {
    return parseAiModelConfig(input)
  } catch {
    return defaultAiModelConfig()
  }
}

export function normalizeApiKey(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('API Key 格式不正确')
  }
  const key = value.trim()
  if (key.length > MAX_API_KEY_LENGTH || /[\s\u0000-\u001f\u007f-\uffff]/.test(key)) {
    throw new Error('API Key 只能包含英文字母、数字和符号，且不能有空格')
  }
  return key
}
