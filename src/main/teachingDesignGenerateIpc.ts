import { dialog, ipcMain } from 'electron'
import { writeFile } from 'node:fs/promises'
import { IPC_CHANNELS } from '../shared/appApi'
import { requestChatJson } from '../shared/aiModel/client'
import { findProviderPreset } from '../shared/aiModel/config'
import { AiRequestError, type ChatMessage } from '../shared/aiModel/types'
import { DEFAULT_MATERIAL_CHARS, selectRelevantMaterial } from '../shared/materials/select'
import { buildBigUnitDocx, buildLessonDocx, safeDocxFileName } from '../shared/teachingDesign/docxExport'
import {
  applyBigUnitJson,
  applyLessonJson,
  applyUnitsJson,
  buildBigUnitMessages,
  buildLessonMessages,
  buildUnitsMessages,
  materialKeywords,
  type GenerationRequest,
  type GenerationResult
} from '../shared/teachingDesign/generation'
import type { BigUnitDesign, LessonDesign, TeachingDesign, UnitDesign } from '../shared/teachingDesign/types'
import { parseTeachingDesign, unitsOfBigUnit } from '../shared/teachingDesign/validate'
import { getAiModelStore } from './aiModelIpc'
import { getMainWindow } from './mainWindow'
import { loadMaterials, materialSources } from './materialService'
import { loadTeachingDesigns } from './teachingDesignStore'

const running = new Map<string, AbortController>()

function asBigUnit(value: unknown): BigUnitDesign {
  const parsed = parseTeachingDesign(value)
  if (parsed.kind !== 'bigUnit') {
    throw new Error('大单元数据不正确')
  }
  return parsed
}

function asUnit(value: unknown): UnitDesign {
  const parsed = parseTeachingDesign(value)
  if (parsed.kind !== 'unit') {
    throw new Error('单元数据不正确')
  }
  return parsed
}

async function materialText(bigUnit: BigUnitDesign, keywords: string[]): Promise<string> {
  if (bigUnit.materialResourceIds.length === 0) {
    return ''
  }
  const materials = await loadMaterials(bigUnit.materialResourceIds)
  return selectRelevantMaterial(materialSources(materials), keywords, DEFAULT_MATERIAL_CHARS)
}

async function callModel(messages: ChatMessage[], signal: AbortSignal): Promise<{ data: Record<string, unknown>; provider: string; model: string }> {
  const store = getAiModelStore()
  const config = await store.getConfig()
  const apiKey = await store.getApiKey()
  if (!apiKey) {
    throw new AiRequestError('not_configured', '尚未配置大模型 API Key，请先到“备份与恢复”页的“大模型”卡片中填写并测试连接')
  }
  const { data, result } = await requestChatJson({
    baseUrl: config.baseUrl,
    apiKey,
    model: config.model,
    messages,
    temperature: config.temperature,
    timeoutMs: config.timeoutSeconds * 1000,
    signal
  })
  return { data, provider: findProviderPreset(config.providerId).name, model: result.model }
}

export async function runGeneration(request: GenerationRequest, signal: AbortSignal): Promise<GenerationResult> {
  const bigUnit = asBigUnit(request.bigUnit)
  if (request.kind === 'bigUnit') {
    const messages = buildBigUnitMessages(bigUnit, await materialText(bigUnit, materialKeywords(bigUnit)))
    const { data, provider, model } = await callModel(messages, signal)
    return { kind: 'bigUnit', bigUnit: applyBigUnitJson(bigUnit, data, { provider, model, generatedAt: new Date().toISOString() }) }
  }
  if (request.kind === 'units') {
    if (bigUnit.unitOutline.length === 0) {
      throw new Error('请先生成或填写大单元的单元划分')
    }
    const existing = Array.isArray(request.existingUnits) ? request.existingUnits.map(asUnit).filter((unit) => unit.bigUnitId === bigUnit.id) : []
    const messages = buildUnitsMessages(bigUnit, await materialText(bigUnit, materialKeywords(bigUnit)))
    const { data, provider, model } = await callModel(messages, signal)
    return { kind: 'units', units: applyUnitsJson(bigUnit, data, { provider, model, generatedAt: new Date().toISOString() }, existing) }
  }
  if (request.kind === 'lesson') {
    const lessonNo = request.lessonNo
    if (!Number.isInteger(lessonNo) || lessonNo < 1 || lessonNo > bigUnit.totalLessons) {
      throw new Error('课次超出大单元总课时')
    }
    const unit = request.unit ? asUnit(request.unit) : null
    const designs = await loadTeachingDesigns()
    const existing = request.existingLessonId
      ? (designs.find((item): item is LessonDesign => item.kind === 'lesson' && item.id === request.existingLessonId) ?? null)
      : null
    const counts = { maleCount: request.maleCount ?? null, femaleCount: request.femaleCount ?? null }
    const messages = buildLessonMessages(bigUnit, unit, lessonNo, counts, await materialText(bigUnit, materialKeywords(bigUnit, unit, lessonNo)))
    const { data, provider, model } = await callModel(messages, signal)
    return {
      kind: 'lesson',
      lesson: applyLessonJson(bigUnit, unit, lessonNo, counts, data, { provider, model, generatedAt: new Date().toISOString() }, existing)
    }
  }
  throw new Error('生成类型不正确')
}

async function exportDocx(designId: unknown): Promise<{ canceled: true } | { canceled: false; filePath: string }> {
  const designs: TeachingDesign[] = await loadTeachingDesigns()
  const target = designs.find((item) => item.id === designId)
  if (!target || target.kind === 'unit') {
    throw new Error('找不到要导出的大单元或课时教案')
  }
  const buffer = target.kind === 'lesson' ? buildLessonDocx(target) : buildBigUnitDocx(target, unitsOfBigUnit(designs, target.id))
  const owner = getMainWindow()
  const options = {
    title: '导出 Word 文档',
    defaultPath: safeDocxFileName(target.title),
    filters: [{ name: 'Word 文档', extensions: ['docx'] }]
  }
  const saved = owner ? await dialog.showSaveDialog(owner, options) : await dialog.showSaveDialog(options)
  if (saved.canceled || !saved.filePath) {
    return { canceled: true }
  }
  await writeFile(saved.filePath, buffer)
  return { canceled: false, filePath: saved.filePath }
}

export function registerTeachingDesignGenerateIpc(): void {
  ipcMain.handle(IPC_CHANNELS.teachingDesigns.generate, async (_event, request: GenerationRequest) => {
    const requestId = typeof request?.requestId === 'string' ? request.requestId.slice(0, 80) : ''
    if (!requestId || running.has(requestId)) {
      throw new Error('生成请求编号不正确')
    }
    const controller = new AbortController()
    running.set(requestId, controller)
    try {
      return await runGeneration(request, controller.signal)
    } finally {
      running.delete(requestId)
    }
  })
  ipcMain.handle(IPC_CHANNELS.teachingDesigns.cancelGeneration, async (_event, requestId: unknown) => {
    const controller = typeof requestId === 'string' ? running.get(requestId) : undefined
    controller?.abort()
    return Boolean(controller)
  })
  ipcMain.handle(IPC_CHANNELS.teachingDesigns.exportDocx, async (_event, designId: unknown) => exportDocx(designId))
}
