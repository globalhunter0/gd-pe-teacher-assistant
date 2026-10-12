import type { ChatMessage } from '../aiModel'
import {
  PLAN_DURATION_MAX,
  PLAN_DURATION_MIN,
  TRAINING_PLAN_REFERENCES
} from './planGenerator'
import {
  SCHOOL_STAGE_LABELS,
  TRAINING_LEVEL_LABELS,
  getSportProgram,
  isSchoolStage,
  isTrainingLevel
} from './sportProgram'
import type {
  SchoolStage,
  TrainingLevel,
  TrainingPlanBlueprint,
  TrainingSport,
  TrainingTeam,
  TrainingTeamMember
} from './types'

export interface TrainingPlanAiRequest {
  requestId: string
  trainingTeamId: string
  date: string
  stage: SchoolStage
  programId: string
  level: TrainingLevel
  durationMinutes: number
  requirements: string
}

export interface TrainingPlanAiContext extends Omit<TrainingPlanAiRequest, 'requestId' | 'trainingTeamId'> {
  teamSport: TrainingSport
  activeMemberCount: number
  specialties: string[]
  positions: string[]
  groups: string[]
}

export interface TrainingPlanAiDraft {
  date: string
  title: string
  goal: string
  content: string
  notes: string
  blueprint: TrainingPlanBlueprint
  generation: {
    provider: string
    model: string
    generatedAt: string
  }
}

const MAX_REQUIREMENTS = 1000

function cleanText(value: unknown, max: number): string {
  const text = Array.isArray(value)
    ? value.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).join('\n')
    : typeof value === 'string' || typeof value === 'number'
      ? String(value)
      : ''
  return text.replace(/\r\n?/g, '\n').trim().slice(0, max)
}

function unique(values: unknown, maxItems = 20): string[] {
  if (!Array.isArray(values)) return []
  return [...new Set(values.map((item) => cleanText(item, 40)).filter(Boolean))].slice(0, maxItems)
}

export function parseTrainingPlanAiRequest(input: unknown): TrainingPlanAiRequest {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('AI 训练计划请求格式不正确')
  }
  const source = input as Record<string, unknown>
  const requestId = cleanText(source.requestId, 100)
  const trainingTeamId = cleanText(source.trainingTeamId, 100)
  const date = cleanText(source.date, 10)
  const programId = cleanText(source.programId, 100)
  const durationMinutes = Number(source.durationMinutes)
  if (!requestId || !trainingTeamId) throw new Error('AI 训练计划请求编号不正确')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('请选择训练日期')
  if (!isSchoolStage(source.stage) || !isTrainingLevel(source.level)) {
    throw new Error('学段或训练水平不正确')
  }
  if (!getSportProgram(programId)) throw new Error('训练项目不正确')
  if (!Number.isInteger(durationMinutes) || durationMinutes < PLAN_DURATION_MIN || durationMinutes > PLAN_DURATION_MAX) {
    throw new Error(`单次训练时长应为 ${PLAN_DURATION_MIN}–${PLAN_DURATION_MAX} 分钟`)
  }
  return {
    requestId,
    trainingTeamId,
    date,
    stage: source.stage,
    programId,
    level: source.level,
    durationMinutes,
    requirements: cleanText(source.requirements, MAX_REQUIREMENTS)
  }
}

export function parseTrainingPlanAiContext(input: unknown): TrainingPlanAiContext {
  const request = parseTrainingPlanAiRequest({
    ...(input as Record<string, unknown>),
    requestId: 'context',
    trainingTeamId: 'context'
  })
  const source = input as Record<string, unknown>
  return {
    date: request.date,
    stage: request.stage,
    programId: request.programId,
    level: request.level,
    durationMinutes: request.durationMinutes,
    requirements: request.requirements,
    teamSport: source.teamSport as TrainingSport,
    activeMemberCount:
      typeof source.activeMemberCount === 'number' && Number.isInteger(source.activeMemberCount)
        ? Math.max(0, Math.min(500, source.activeMemberCount))
        : 0,
    specialties: unique(source.specialties),
    positions: unique(source.positions),
    groups: unique(source.groups)
  }
}

export function buildTrainingPlanAiContext(
  request: TrainingPlanAiRequest,
  team: TrainingTeam,
  members: TrainingTeamMember[]
): TrainingPlanAiContext {
  if (team.id !== request.trainingTeamId || team.status !== 'active') {
    throw new Error('找不到可用的训练队')
  }
  const active = members.filter((item) => item.teamId === team.id && item.status === 'active')
  return {
    date: request.date,
    stage: request.stage,
    programId: request.programId,
    level: request.level,
    durationMinutes: request.durationMinutes,
    requirements: request.requirements,
    teamSport: team.sport,
    activeMemberCount: active.length,
    specialties: unique(active.map((item) => item.specialty)),
    positions: unique(active.map((item) => item.position)),
    groups: unique(active.map((item) => item.trainingGroup))
  }
}

function list(label: string, values: string[]): string {
  return values.length > 0 ? `${label}：${values.join('、')}` : `${label}：未填写`
}

export function buildTrainingPlanAiMessages(context: TrainingPlanAiContext): ChatMessage[] {
  const program = getSportProgram(context.programId)
  if (!program) throw new Error('训练项目不正确')
  const stage = SCHOOL_STAGE_LABELS[context.stage]
  const level = TRAINING_LEVEL_LABELS[context.level]
  const references = TRAINING_PLAN_REFERENCES.map((item) => `${item.title}（用于${item.use}）`).join('；')
  return [
    {
      role: 'system',
      content: [
        '你是熟悉青少年长期运动发展、专项训练和校园训练安全的资深体育教练。',
        '训练计划必须遵循渐进负荷、动作质量优先、专项与一般体能结合、充分恢复和个体差异原则。',
        '准备活动使用 RAMP 结构；主训练写明动作、组次/次数/距离/时间、间歇与技术要点；结束部分安排整理恢复。',
        '按学段控制训练风险，不安排极限负荷、力竭训练或带伤训练；出现疼痛、头晕、胸闷或动作明显变形必须停止。',
        '使用 session-RPE 管理负荷，在目标或备注中写明建议 RPE 和 sRPE（RPE×分钟）。',
        '只输出一个 JSON 对象，不要输出 Markdown、解释或思维过程。所有字段使用简体中文。'
      ].join('\n')
    },
    {
      role: 'user',
      content: [
        `请制定一节可直接由教练审核修改的训练计划。日期：${context.date}；学段：${stage}；水平：${level}；单次时长：${context.durationMinutes}分钟。`,
        `项目：${program.name}；队伍当前在队人数：${context.activeMemberCount}人。不要输出任何队员姓名、学号或班级。`,
        list('队员专项概况', context.specialties),
        list('场上位置概况', context.positions),
        list('训练分组概况', context.groups),
        `项目说明：${program.summary}`,
        `准备活动方向：${program.prep}`,
        `学段负荷要求：${program.dose[context.stage]}`,
        `安全要求：${program.safety}`,
        `避免事项：${program.avoid}`,
        `可用器材建议：${program.equipment}`,
        context.requirements ? `教练补充要求：${context.requirements}` : '教练补充要求：无',
        `编排依据：${references}`,
        'content 必须使用以下纯文本格式：',
        '◆ 训练概览/课前确认等说明',
        '【准备活动 · N分钟】',
        '动作名称｜剂量（组次、次数、距离或时间，含间歇）｜技术与安全要点',
        '【专项技术 · N分钟】、【专项应用 · N分钟】、【力量与动作能力 · N分钟】、【能量系统 · N分钟】可按项目取舍，但至少保留两个主训练部分。',
        '【整理与恢复 · N分钟】',
        `所有【】标题中的分钟数合计必须等于 ${context.durationMinutes} 分钟。`,
        '输出 JSON 字段：',
        '{"title":"训练主题（80字内）","goal":"训练目标、负荷目标和前后衔接（1000字内）","content":"完整训练内容（4000字内）","notes":"组织、安全、差异化和课后监控提醒（1000字内）"}'
      ].join('\n')
    }
  ]
}

export function trainingPlanAiSectionMinutes(content: string): number[] {
  return [...content.matchAll(/^【.+?·\s*(\d+)分钟】\s*$/gmu)]
    .map((match) => Number(match[1]))
    .filter((value) => Number.isInteger(value) && value > 0)
}

export function applyTrainingPlanAiJson(
  context: TrainingPlanAiContext,
  json: Record<string, unknown>,
  meta: TrainingPlanAiDraft['generation']
): TrainingPlanAiDraft {
  const program = getSportProgram(context.programId)
  if (!program) throw new Error('训练项目不正确')
  const title = cleanText(json.title, 80)
  const goal = cleanText(json.goal, 1000)
  const content = cleanText(json.content, 4000)
  const notes = cleanText(json.notes, 1000)
  if (!title || !goal || !content) {
    throw new Error('模型返回的训练计划不完整，请重试')
  }
  const sectionMinutes = trainingPlanAiSectionMinutes(content)
  if (sectionMinutes.length < 4 || sectionMinutes.reduce((sum, value) => sum + value, 0) !== context.durationMinutes) {
    throw new Error(`模型返回的训练分段不完整，或总时长不等于 ${context.durationMinutes} 分钟，请重试`)
  }
  return {
    date: context.date,
    title,
    goal,
    content,
    notes,
    blueprint: {
      stage: context.stage,
      programId: program.id,
      level: context.level,
      durationMinutes: context.durationMinutes
    },
    generation: meta
  }
}
