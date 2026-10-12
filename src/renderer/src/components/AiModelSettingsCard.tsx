import { useEffect, useState } from 'react'
import {
  AI_PROVIDER_PRESETS,
  defaultAiModelConfig,
  findProviderPreset,
  isSiliconFlowBaseUrl,
  type AiModelConfig,
  type AiModelStatus,
  type AiProviderId
} from '@shared/aiModel'
import { getAppApi } from '../platform/appApi'

export default function AiModelSettingsCard(): React.JSX.Element {
  const [status, setStatus] = useState<AiModelStatus | null>(null)
  const [config, setConfig] = useState<AiModelConfig>(defaultAiModelConfig())
  const [apiKey, setApiKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void getAppApi()
      .then((api) => api.aiModel.getStatus())
      .then((loaded) => {
        if (!cancelled) {
          setStatus(loaded)
          setConfig(loaded.config)
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : '读取模型配置失败')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const preset = findProviderPreset(config.providerId)

  function changeProvider(providerId: AiProviderId): void {
    const next = findProviderPreset(providerId)
    setConfig((current) => ({ ...current, providerId, baseUrl: next.baseUrl, model: next.defaultModel }))
  }

  function pendingInput(): { config: AiModelConfig; apiKey?: string } {
    return apiKey.trim() ? { config, apiKey: apiKey.trim() } : { config }
  }

  async function run(action: 'save' | 'test' | 'clear'): Promise<void> {
    setBusy(true)
    setMessage(null)
    setError(null)
    try {
      const api = await getAppApi()
      if (action === 'test') {
        const result = await api.aiModel.test(pendingInput())
        if (result.ok) {
          setMessage(`${result.message}（${result.model}，${(result.latencyMs / 1000).toFixed(1)} 秒）`)
        } else {
          setError(`连接失败：${result.message}`)
        }
        return
      }
      const saved = await api.aiModel.save(action === 'clear' ? { config, apiKey: '' } : pendingInput())
      setStatus(saved)
      setConfig(saved.config)
      setApiKey('')
      setMessage(action === 'clear' ? '已清除 API Key' : '模型配置已保存')
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : '操作失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="info-panel">
      <h3>大模型（AI 生成教学设计）</h3>
      <p className="settings-copy">
        用于生成大单元教学计划、单元教学计划和课时教案。需联网，费用由所选平台按用量计费。API Key 经系统加密保存在本机，不进入备份包，也不会显示在界面上。
      </p>
      {error ? <p className="page-error">{error}</p> : null}
      {message ? <p className="page-ok">{message}</p> : null}
      <label className="settings-field">
        服务商
        <select value={config.providerId} onChange={(event) => changeProvider(event.target.value as AiProviderId)} disabled={busy}>
          {AI_PROVIDER_PRESETS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="settings-field">
        接口地址
        <input
          value={config.baseUrl}
          onChange={(event) => setConfig((current) => ({ ...current, baseUrl: event.target.value }))}
          placeholder="https://…/v1"
          disabled={busy}
        />
      </label>
      <label className="settings-field">
        模型名称
        <input
          value={config.model}
          list="ai-model-suggestions"
          onChange={(event) => setConfig((current) => ({ ...current, model: event.target.value }))}
          placeholder={preset.defaultModel || '例如 deepseek-chat'}
          disabled={busy}
        />
        <datalist id="ai-model-suggestions">
          {preset.suggestedModels.map((model) => (
            <option key={model} value={model} />
          ))}
        </datalist>
      </label>
      <label className="settings-field">
        API Key{status?.hasApiKey ? '（已保存，留空则不修改）' : ''}
        <input
          type="password"
          autoComplete="off"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          placeholder={status?.hasApiKey ? '••••••••' : preset.keyHint}
          disabled={busy}
        />
      </label>
      <label className="settings-field">
        超时（秒）
        <input
          type="number"
          min={15}
          max={600}
          value={config.timeoutSeconds}
          onChange={(event) => setConfig((current) => ({ ...current, timeoutSeconds: Number(event.target.value) || 0 }))}
          disabled={busy}
        />
      </label>
      {isSiliconFlowBaseUrl(config.baseUrl) ? (
        <label className="settings-field">
          深度思考
          <select
            value={config.thinkingEnabled ? 'on' : 'off'}
            onChange={(event) => setConfig((current) => ({ ...current, thinkingEnabled: event.target.value === 'on' }))}
            disabled={busy}
          >
            <option value="off">关闭（推荐，生成更快）</option>
            <option value="on">开启（更慢、费用可能更高）</option>
          </select>
        </label>
      ) : null}
      {status && !status.encryptionAvailable ? (
        <p className="page-error">本机系统加密不可用，暂时无法保存 API Key。</p>
      ) : null}
      <div className="settings-health-actions">
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void run('save')}>
          {busy ? '处理中…' : '保存'}
        </button>
        <button type="button" className="btn" disabled={busy || (!apiKey.trim() && !status?.hasApiKey)} onClick={() => void run('test')}>
          测试连接
        </button>
        {status?.hasApiKey ? (
          <button type="button" className="btn" disabled={busy} onClick={() => void run('clear')}>
            清除 API Key
          </button>
        ) : null}
      </div>
    </article>
  )
}
