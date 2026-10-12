import { mkdtempSync, rmSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createDataBackup, restoreDataBackup } from '../backup/service'
import { writeJsonItemsAtomic } from '../persistence/jsonFile'
import { extractJsonObject, requestChatCompletion, requestChatJson } from './client'
import {
  AI_PROVIDER_PRESETS,
  aiModelExtraBody,
  defaultAiModelConfig,
  isSiliconFlowBaseUrl,
  normalizeApiKey,
  normalizeBaseUrl,
  parseAiModelConfig,
  parseStoredAiModelConfig
} from './config'
import { AI_MODEL_CONFIG_FILE, AI_MODEL_KEY_FILE, createAiModelStore, type SecretCipher } from './store'
import { AiRequestError } from './types'

const SECRET = 'sk-selfcheck-0123456789abcdef'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`[ai-model selfcheck] ${message}`)
  }
}

function expectThrow(fn: () => unknown, message: string): void {
  try {
    fn()
  } catch {
    return
  }
  throw new Error(`[ai-model selfcheck] 应当拒绝：${message}`)
}

async function expectCode(promise: Promise<unknown>, code: string, message: string): Promise<void> {
  try {
    await promise
  } catch (error) {
    assert(error instanceof AiRequestError && error.code === code, `${message}：期望 ${code}，实际 ${error instanceof AiRequestError ? error.code : String(error)}`)
    return
  }
  throw new Error(`[ai-model selfcheck] ${message}：应当失败`)
}

function checkConfig(): void {
  for (const preset of AI_PROVIDER_PRESETS) {
    if (preset.baseUrl) {
      assert(normalizeBaseUrl(preset.baseUrl) === preset.baseUrl, `预设地址应已规范：${preset.id}`)
      assert(preset.baseUrl.startsWith('https://'), `预设地址必须 https：${preset.id}`)
    }
    if (preset.defaultModel) {
      assert(parseAiModelConfig(defaultAiModelConfig(preset.id)).providerId === preset.id, `预设可直接保存：${preset.id}`)
    }
  }
  expectThrow(() => normalizeBaseUrl('http://api.example.com/v1'), '非本机 http')
  expectThrow(() => normalizeBaseUrl('ftp://api.example.com'), 'ftp')
  expectThrow(() => normalizeBaseUrl('https://user:pw@api.example.com/v1'), '地址带账号')
  expectThrow(() => normalizeBaseUrl('https://api.example.com/v1?key=1'), '地址带查询参数')
  assert(normalizeBaseUrl('http://127.0.0.1:11434/v1/') === 'http://127.0.0.1:11434/v1', '本机 http 允许并去掉末尾斜杠')
  assert(normalizeBaseUrl('https://api.example.com/v1/chat/completions') === 'https://api.example.com/v1', '误填完整路径时自动去掉 /chat/completions')
  expectThrow(() => parseAiModelConfig({ ...defaultAiModelConfig(), model: 'deepseek chat' }), '模型名含空格')
  assert(
    parseAiModelConfig({ ...defaultAiModelConfig('siliconflow'), model: 'deepseek-ai\\DeepSeek-V4-Flash' }).model ===
      'deepseek-ai/DeepSeek-V4-Flash',
    '模型 ID 的反斜杠须自动纠正'
  )
  expectThrow(() => parseAiModelConfig({ ...defaultAiModelConfig(), providerId: 'unknown' }), '未知服务商')
  expectThrow(() => parseAiModelConfig([]), '数组配置')
  const clamped = parseAiModelConfig({ ...defaultAiModelConfig(), temperature: 9, timeoutSeconds: 3 })
  assert(clamped.temperature === 1.5 && clamped.timeoutSeconds === 15, '温度与超时应限制在范围内')
  const siliconFlow = defaultAiModelConfig('siliconflow')
  assert(siliconFlow.baseUrl === 'https://api.siliconflow.cn/v1' && siliconFlow.model.includes('/'), '硅基流动预设须使用官方地址和完整模型 ID')
  assert(isSiliconFlowBaseUrl(siliconFlow.baseUrl) && isSiliconFlowBaseUrl('https://api.siliconflow.com/v1'), '识别硅基流动国内与国际地址')
  assert(aiModelExtraBody(siliconFlow)?.enable_thinking === false, '硅基流动默认关闭深度思考')
  assert(aiModelExtraBody({ ...siliconFlow, thinkingEnabled: true })?.enable_thinking === true, '硅基流动可显式开启深度思考')
  assert(aiModelExtraBody(defaultAiModelConfig('deepseek')) === undefined, '其他服务商不得收到硅基流动扩展参数')
  const legacy = { ...siliconFlow } as Record<string, unknown>
  delete legacy.thinkingEnabled
  assert(parseAiModelConfig(legacy).thinkingEnabled === false, '旧配置缺少深度思考字段时须默认关闭')
  assert(parseStoredAiModelConfig({ broken: true }).providerId === 'deepseek', '损坏配置回退默认值')
  expectThrow(() => normalizeApiKey('sk 123'), 'API Key 含空格')
  expectThrow(() => normalizeApiKey('密钥'), 'API Key 含中文')
  assert(normalizeApiKey(`  ${SECRET}\n`) === SECRET, 'API Key 去首尾空白')
}

function fakeCipher(available = true): SecretCipher {
  return {
    isAvailable: () => available,
    encrypt: (plain) => Buffer.from(`enc:${Buffer.from(plain).toString('base64').split('').reverse().join('')}`),
    decrypt: (data) => {
      const text = data.toString('utf8')
      if (!text.startsWith('enc:')) throw new Error('bad cipher')
      return Buffer.from(text.slice(4).split('').reverse().join(''), 'base64').toString('utf8')
    }
  }
}

async function checkStore(): Promise<void> {
  const root = mkdtempSync(join(tmpdir(), 'gdpe-ai-model-'))
  const outside = mkdtempSync(join(tmpdir(), 'gdpe-ai-model-bak-'))
  try {
    const store = createAiModelStore(root, fakeCipher())
    const initial = await store.getStatus()
    assert(!initial.hasApiKey && initial.config.providerId === 'deepseek' && initial.encryptionAvailable, '首次读取为默认配置且无密钥')

    const config = { ...defaultAiModelConfig('qwen'), model: 'qwen-max' }
    const saved = await store.save({ config, apiKey: SECRET })
    assert(saved.hasApiKey && saved.config.model === 'qwen-max', '保存配置与密钥')
    assert(!JSON.stringify(saved).includes(SECRET), '状态不得包含明文密钥')
    const configText = await readFile(join(root, AI_MODEL_CONFIG_FILE), 'utf8')
    const keyBytes = await readFile(join(root, AI_MODEL_KEY_FILE))
    assert(!configText.includes(SECRET), '配置文件不得包含密钥')
    assert(!keyBytes.toString('utf8').includes(SECRET), '密钥文件不得为明文')
    assert((await store.getApiKey()) === SECRET, '密钥可解密读回')

    await store.save({ config: { ...config, model: 'qwen-plus' } })
    assert((await store.getApiKey()) === SECRET && (await store.getConfig()).model === 'qwen-plus', '不传 apiKey 时保留原密钥')

    const reopened = createAiModelStore(root, fakeCipher())
    assert((await reopened.getStatus()).hasApiKey && (await reopened.getConfig()).model === 'qwen-plus', '重新打开后配置与密钥仍在')

    await writeJsonItemsAtomic(join(root, 'classes.json'), [])
    const archive = join(outside, 'with-ai.gdpebak')
    const backup = await createDataBackup(root, archive, '1.0.1-selfcheck')
    assert(!backup.manifest.files.some((file) => file.path.startsWith('ai-model')), '备份包不得包含模型配置与密钥')
    await restoreDataBackup(root, archive, { appVersion: '1.0.1-selfcheck' })
    assert((await reopened.getApiKey()) === SECRET, '恢复备份不影响本机模型密钥')

    await expectThrowAsync(createAiModelStore(root, fakeCipher(false)).save({ config, apiKey: 'sk-new' }), '系统加密不可用时拒绝保存密钥')
    assert((await store.getApiKey()) === SECRET, '加密不可用的失败保存不改动原密钥')
    assert(!(await createAiModelStore(root, fakeCipher(false)).getStatus()).hasApiKey, '加密不可用时视为无密钥')

    await writeFile(join(root, AI_MODEL_KEY_FILE), 'garbage')
    assert(!(await store.getStatus()).hasApiKey, '密钥文件损坏时视为无密钥而不崩溃')
    await store.save({ config, apiKey: SECRET })
    const cleared = await store.save({ config, apiKey: '' })
    assert(!cleared.hasApiKey, '传空字符串清除密钥')
    await store.save({ config, apiKey: '' })

    await writeFile(join(root, AI_MODEL_CONFIG_FILE), '{broken')
    assert((await store.getConfig()).providerId === 'deepseek', '配置文件损坏时回退默认值')
    await expectThrowAsync(store.save({ config: { ...config, baseUrl: 'http://evil.example.com' } }), '保存非法地址')
  } finally {
    rmSync(root, { recursive: true, force: true })
    rmSync(outside, { recursive: true, force: true })
  }
}

async function expectThrowAsync(promise: Promise<unknown>, message: string): Promise<void> {
  try {
    await promise
  } catch {
    return
  }
  throw new Error(`[ai-model selfcheck] 应当拒绝：${message}`)
}

interface Captured {
  path: string
  auth: string
  body: Record<string, unknown>
}

async function startMockServer(): Promise<{ baseUrl: string; captured: Captured[]; close: () => Promise<void> }> {
  const captured: Captured[] = []
  const server = createServer((request: IncomingMessage, response: ServerResponse) => {
    let raw = ''
    request.on('data', (chunk: Buffer) => {
      raw += chunk.toString('utf8')
    })
    request.on('end', () => {
      const body = JSON.parse(raw || '{}') as Record<string, unknown>
      captured.push({ path: request.url ?? '', auth: String(request.headers.authorization ?? ''), body })
      const send = (status: number, payload: unknown): void => {
        response.writeHead(status, { 'Content-Type': 'application/json' })
        response.end(typeof payload === 'string' ? payload : JSON.stringify(payload))
      }
      const model = String(body.model)
      if (request.headers.authorization !== `Bearer ${SECRET}`) {
        send(401, { error: { message: 'Invalid API key' } })
      } else if (model === 'busy') {
        send(429, { error: { message: 'rate limited' } })
      } else if (model === 'broken') {
        send(500, 'upstream exploded')
      } else if (model === 'not-json') {
        send(200, '<html>gateway</html>')
      } else if (model === 'empty') {
        send(200, { choices: [{ message: { content: '' } }] })
      } else if (model === 'plain-only' && body.response_format) {
        send(400, { error: { message: 'response_format is not supported' } })
      } else if (model === 'stream') {
        response.writeHead(200, { 'Content-Type': 'text/event-stream' })
        response.write(`data: ${JSON.stringify({ model: 'stream-server', choices: [{ delta: { content: '{"title":"流' } }] })}\n\n`)
        response.write(`data: ${JSON.stringify({ choices: [{ delta: { content: '式大单元","lessons":18}' } }], usage: { total_tokens: 55 } })}\n\n`)
        response.end('data: [DONE]\n\n')
      } else if (model === 'slow') {
        setTimeout(() => send(200, { choices: [{ message: { content: '{}' } }] }), 1500)
      } else {
        send(200, {
          model: `${model}-server`,
          usage: { total_tokens: 42 },
          choices: [{ message: { content: '好的，结果如下：\n```json\n{"title":"篮球大单元","lessons":18}\n```' } }]
        })
      }
    })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = (server.address() as AddressInfo).port
  return {
    baseUrl: `http://127.0.0.1:${port}/v1`,
    captured,
    close: () => new Promise((resolve) => server.close(() => resolve()))
  }
}

async function checkClient(): Promise<void> {
  const mock = await startMockServer()
  const base = { baseUrl: mock.baseUrl, apiKey: SECRET, messages: [{ role: 'user' as const, content: '你好' }], temperature: 0.5, timeoutMs: 5000 }
  try {
    const { data, result } = await requestChatJson({
      ...base,
      model: 'deepseek-chat',
      extraBody: { enable_thinking: false, model: '不得覆盖模型', stream: true }
    })
    assert(data.title === '篮球大单元' && data.lessons === 18, '应从代码块中解析 JSON')
    assert(result.model === 'deepseek-chat-server' && result.totalTokens === 42, '返回模型名与用量')
    const first = mock.captured[0]
    assert(first.path === '/v1/chat/completions', `请求路径：${first.path}`)
    assert(first.auth === `Bearer ${SECRET}`, '应使用 Bearer 认证头')
    assert((first.body.response_format as { type?: string })?.type === 'json_object' && first.body.stream === false, 'JSON 模式请求体')
    assert(first.body.enable_thinking === false && first.body.model === 'deepseek-chat', '服务商扩展参数须保留且不得覆盖核心字段')

    const streamed = await requestChatJson({ ...base, model: 'stream', stream: true, maxTokens: 123 })
    assert(streamed.data.title === '流式大单元' && streamed.data.lessons === 18, '须拼接 SSE 分片并解析 JSON')
    assert(streamed.result.model === 'stream-server' && streamed.result.totalTokens === 55, '流式响应须返回模型名与用量')
    const streamRequest = mock.captured.find((item) => item.body.model === 'stream')
    assert(streamRequest?.body.stream === true && streamRequest.body.max_tokens === 123, '流式请求须携带 stream 与 max_tokens')

    const before = mock.captured.length
    const plain = await requestChatJson({ ...base, model: 'plain-only' })
    assert(plain.data.title === '篮球大单元' && mock.captured.length === before + 2 && !mock.captured[before + 1].body.response_format, '不支持 response_format 时自动去掉重试一次')

    await expectCode(requestChatCompletion({ ...base, apiKey: 'sk-wrong', model: 'x' }), 'auth', '错误密钥')
    await expectCode(requestChatCompletion({ ...base, model: 'busy' }), 'rate_limit', '限流')
    await expectCode(requestChatCompletion({ ...base, model: 'broken' }), 'server', '服务端错误')
    await expectCode(requestChatCompletion({ ...base, model: 'not-json' }), 'bad_response', '非 JSON 响应')
    await expectCode(requestChatCompletion({ ...base, model: 'empty' }), 'bad_response', '空内容')
    await expectCode(requestChatCompletion({ ...base, apiKey: '', model: 'x' }), 'not_configured', '未配置密钥')
    await expectCode(requestChatCompletion({ ...base, model: 'slow', timeoutMs: 200 }), 'timeout', '超时')
    const controller = new AbortController()
    const canceled = requestChatCompletion({ ...base, model: 'slow', signal: controller.signal })
    setTimeout(() => controller.abort(), 100)
    await expectCode(canceled, 'canceled', '取消')
    const preAborted = new AbortController()
    preAborted.abort()
    await expectCode(requestChatCompletion({ ...base, model: 'x', signal: preAborted.signal }), 'canceled', '已取消的信号')
    await expectCode(requestChatCompletion({ ...base, baseUrl: 'http://127.0.0.1:1/v1', model: 'x' }), 'network', '无法连接')
  } finally {
    await mock.close()
  }

  assert(extractJsonObject('{"a":1}').a === 1, '纯 JSON')
  assert(extractJsonObject('前言 {"a":{"b":2}} 结尾').a !== undefined, '前后有说明文字')
  expectThrow(() => extractJsonObject('[1,2]'), '数组不是对象')
  expectThrow(() => extractJsonObject('没有 JSON'), '无 JSON')
}

export async function runAiModelSelfCheckOrThrow(): Promise<string> {
  checkConfig()
  await checkStore()
  await checkClient()
  return 'ai model selfcheck ok (config / encrypted key store / backup exclusion / streaming / client errors / timeout / cancel / json fallback)'
}

if (process.argv[1] && /aiModel[\\/]selfcheck\.ts$/.test(process.argv[1])) {
  runAiModelSelfCheckOrThrow().then(
    (message) => console.log(message),
    (error) => {
      console.error(error)
      process.exitCode = 1
    }
  )
}
