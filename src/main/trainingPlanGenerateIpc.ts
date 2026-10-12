import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../shared/appApi'
import { requestChatJson } from '../shared/aiModel/client'
import { aiModelExtraBody, findProviderPreset } from '../shared/aiModel/config'
import { AiRequestError } from '../shared/aiModel/types'
import {
  applyTrainingPlanAiJson,
  buildTrainingPlanAiContext,
  buildTrainingPlanAiMessages,
  parseTrainingPlanAiRequest,
  type TrainingPlanAiDraft,
  type TrainingPlanAiRequest
} from '../shared/trainingTeam'
import { getAiModelStore } from './aiModelIpc'
import { loadTrainingMembers, loadTrainingTeams } from './trainingStore'

const running = new Map<string, AbortController>()

export async function runTrainingPlanAiGeneration(
  requestInput: unknown,
  signal: AbortSignal
): Promise<TrainingPlanAiDraft> {
  const request: TrainingPlanAiRequest = parseTrainingPlanAiRequest(requestInput)
  const [teams, members] = await Promise.all([loadTrainingTeams(), loadTrainingMembers()])
  const team = teams.find((item) => item.id === request.trainingTeamId)
  if (!team) throw new Error('找不到要制定计划的训练队')
  const context = buildTrainingPlanAiContext(request, team, members)

  const store = getAiModelStore()
  const config = await store.getConfig()
  const apiKey = await store.getApiKey()
  if (!apiKey) {
    throw new AiRequestError('not_configured', '尚未配置大模型 API Key，请先到“AI 助手”中填写并测试连接')
  }
  const { data, result } = await requestChatJson({
    baseUrl: config.baseUrl,
    apiKey,
    model: config.model,
    messages: buildTrainingPlanAiMessages(context),
    temperature: config.temperature,
    stream: true,
    maxTokens: 4000,
    timeoutMs: config.timeoutSeconds * 1000,
    signal,
    extraBody: aiModelExtraBody(config)
  })
  return applyTrainingPlanAiJson(context, data, {
    provider: findProviderPreset(config.providerId).name,
    model: result.model,
    generatedAt: new Date().toISOString()
  })
}

export function registerTrainingPlanGenerateIpc(): void {
  ipcMain.handle(IPC_CHANNELS.trainingPlans.generate, async (_event, input: unknown) => {
    const request = parseTrainingPlanAiRequest(input)
    if (running.has(request.requestId)) {
      throw new Error('生成请求编号重复')
    }
    const controller = new AbortController()
    running.set(request.requestId, controller)
    try {
      return await runTrainingPlanAiGeneration(request, controller.signal)
    } finally {
      running.delete(request.requestId)
    }
  })
  ipcMain.handle(IPC_CHANNELS.trainingPlans.cancelGeneration, async (_event, requestId: unknown) => {
    const controller = typeof requestId === 'string' ? running.get(requestId) : undefined
    controller?.abort()
    return Boolean(controller)
  })
}
