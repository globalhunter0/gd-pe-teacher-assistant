import { AiRequestError, type ChatMessage } from './types'

export type FetchLike = (input: string, init: {
  method: string
  headers: Record<string, string>
  body: string
  signal: AbortSignal
}) => Promise<{ ok: boolean; status: number; text: () => Promise<string> }>

export interface ChatRequest {
  baseUrl: string
  apiKey: string
  model: string
  messages: ChatMessage[]
  temperature: number
  timeoutMs: number
  jsonMode?: boolean
  maxTokens?: number
  signal?: AbortSignal
  fetchImpl?: FetchLike
}

export interface ChatResult {
  content: string
  model: string
  totalTokens: number | null
}

function errorFromStatus(status: number, body: string): AiRequestError {
  const detail = extractErrorMessage(body)
  const suffix = detail ? `：${detail}` : ''
  if (status === 401 || status === 403) {
    return new AiRequestError('auth', `API Key 无效或无权限${suffix}`, status)
  }
  if (status === 429) {
    return new AiRequestError('rate_limit', `请求过于频繁或额度不足${suffix}`, status)
  }
  if (status === 404) {
    return new AiRequestError('invalid_config', `接口地址或模型名称不存在${suffix}`, status)
  }
  if (status >= 500) {
    return new AiRequestError('server', `模型服务暂时不可用（${status}）${suffix}`, status)
  }
  return new AiRequestError('bad_response', `模型服务拒绝请求（${status}）${suffix}`, status)
}

function extractErrorMessage(body: string): string {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: unknown } | string; message?: unknown }
    const message = typeof parsed.error === 'string' ? parsed.error : parsed.error?.message ?? parsed.message
    return typeof message === 'string' ? message.slice(0, 200) : ''
  } catch {
    return body.trim().slice(0, 120)
  }
}

function linkSignals(timeoutMs: number, external?: AbortSignal): { signal: AbortSignal; timedOut: () => boolean; dispose: () => void } {
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  const onAbort = (): void => controller.abort()
  if (external) {
    if (external.aborted) {
      controller.abort()
    } else {
      external.addEventListener('abort', onAbort, { once: true })
    }
  }
  return {
    signal: controller.signal,
    timedOut: () => timedOut,
    dispose: () => {
      clearTimeout(timer)
      external?.removeEventListener('abort', onAbort)
    }
  }
}

async function postOnce(request: ChatRequest, jsonMode: boolean): Promise<ChatResult> {
  const fetchImpl: FetchLike = request.fetchImpl ?? ((input, init) => fetch(input, init))
  const body: Record<string, unknown> = {
    model: request.model,
    messages: request.messages,
    temperature: request.temperature,
    stream: false
  }
  if (request.maxTokens) {
    body.max_tokens = request.maxTokens
  }
  if (jsonMode) {
    body.response_format = { type: 'json_object' }
  }
  const linked = linkSignals(request.timeoutMs, request.signal)
  let status = 0
  let text = ''
  try {
    const response = await fetchImpl(`${request.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${request.apiKey}`
      },
      body: JSON.stringify(body),
      signal: linked.signal
    })
    status = response.status
    text = await response.text()
    if (!response.ok) {
      throw errorFromStatus(status, text)
    }
  } catch (error) {
    if (error instanceof AiRequestError) {
      throw error
    }
    if (linked.timedOut()) {
      throw new AiRequestError('timeout', `模型响应超时（${Math.round(request.timeoutMs / 1000)} 秒），可在设置中调大超时时间后重试`)
    }
    if (request.signal?.aborted) {
      throw new AiRequestError('canceled', '已取消生成')
    }
    throw new AiRequestError('network', `无法连接模型服务：${error instanceof Error ? error.message : String(error)}`)
  } finally {
    linked.dispose()
  }

  let parsed: { choices?: Array<{ message?: { content?: unknown } }>; model?: unknown; usage?: { total_tokens?: unknown } }
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new AiRequestError('bad_response', '模型服务返回的不是 JSON', status)
  }
  const content = parsed.choices?.[0]?.message?.content
  if (typeof content !== 'string' || !content.trim()) {
    throw new AiRequestError('bad_response', '模型没有返回内容', status)
  }
  return {
    content,
    model: typeof parsed.model === 'string' ? parsed.model : request.model,
    totalTokens: typeof parsed.usage?.total_tokens === 'number' ? parsed.usage.total_tokens : null
  }
}

/** 部分服务不支持 response_format，遇到 400 时自动去掉后重试一次。 */
export async function requestChatCompletion(request: ChatRequest): Promise<ChatResult> {
  if (!request.apiKey) {
    throw new AiRequestError('not_configured', '尚未配置 API Key，请先在“设置”中配置大模型')
  }
  try {
    return await postOnce(request, request.jsonMode ?? false)
  } catch (error) {
    if (request.jsonMode && error instanceof AiRequestError && error.status === 400) {
      return postOnce(request, false)
    }
    throw error
  }
}

/** 从模型输出中取出 JSON 对象：兼容 ```json 代码块、前后说明文字。 */
export function extractJsonObject(text: string): Record<string, unknown> {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidates = [text.trim(), fenced?.[1]?.trim() ?? '']
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start >= 0 && end > start) {
    candidates.push(text.slice(start, end + 1))
  }
  for (const candidate of candidates) {
    if (!candidate) {
      continue
    }
    try {
      const parsed: unknown = JSON.parse(candidate)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      // try next candidate
    }
  }
  throw new AiRequestError('bad_response', '模型返回内容不是有效的 JSON，请重试')
}

export async function requestChatJson(request: ChatRequest): Promise<{ data: Record<string, unknown>; result: ChatResult }> {
  const result = await requestChatCompletion({ ...request, jsonMode: true })
  return { data: extractJsonObject(result.content), result }
}
