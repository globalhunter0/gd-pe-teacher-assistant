import { requestChatJson, type FetchLike } from '../aiModel/client'
import type { TrainingPlan, TrainingTeam, TrainingTeamMember } from './types'
import { exercisesFromPlanContent } from './planGenerator'
import { parseTrainingPlans } from './validate'
import {
  applyTrainingPlanAiJson,
  buildTrainingPlanAiContext,
  buildTrainingPlanAiMessages,
  parseTrainingPlanAiRequest,
  trainingPlanAiSectionMinutes
} from './aiGeneration'

const NOW = '2026-10-12T08:00:00.000Z'
const TEAM_ID = 'training-team-11111111-1111-4111-8111-111111111111'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[training plan AI selfcheck] ${message}`)
}

function expectThrow(run: () => unknown, contains: string): void {
  try {
    run()
    throw new Error(`应抛出包含“${contains}”的错误`)
  } catch (error) {
    assert(error instanceof Error && error.message.includes(contains), `错误提示应包含“${contains}”`)
  }
}

function member(overrides: Partial<TrainingTeamMember> = {}): TrainingTeamMember {
  return {
    source: 'student',
    id: 'training-member-private-id',
    teamId: TEAM_ID,
    studentId: 'student-private-id',
    joinedAt: '2026-09-01',
    leftAt: null,
    status: 'active',
    nameSnapshot: '隐私姓名张三',
    studentNoSnapshot: '20260001',
    classNameSnapshot: '七年级1班',
    genderSnapshot: 'male',
    specialty: '控球',
    position: '后卫',
    trainingGroup: '基础组',
    trainingNotes: '个人隐私备注',
    notes: '',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides
  }
}

function request() {
  return parseTrainingPlanAiRequest({
    requestId: 'request-1',
    trainingTeamId: TEAM_ID,
    date: '2026-10-15',
    stage: 'junior',
    programId: 'basketball',
    level: 'basic',
    durationMinutes: 90,
    requirements: '重点练习传切配合'
  })
}

function sampleJson(): Record<string, unknown> {
  return {
    title: '篮球传切配合与基础力量',
    goal: '巩固传切配合，建议整体 RPE 5–6，sRPE 约 450–540 AU。',
    content: [
      '◆ 训练概览：传切配合与动作质量',
      '【准备活动 · 15分钟】',
      '慢跑与动态活动｜5分钟｜逐步升温',
      'RAMP 专项热身｜10分钟｜动作质量优先',
      '【专项技术 · 25分钟】',
      '传切配合｜5组×4次，组间60秒｜传球后快速切入',
      '【专项应用 · 25分钟】',
      '3对3限制赛｜5轮×4分钟，轮间1分钟｜观察空切时机',
      '【力量与动作能力 · 15分钟】',
      '杯式深蹲｜3组×8次，组间90秒｜膝尖与脚尖同向',
      '【整理与恢复 · 10分钟】',
      '慢走与拉伸｜10分钟｜呼吸恢复后再离场'
    ].join('\n'),
    notes: '检查场地；疼痛、头晕或动作变形立即停止。'
  }
}

async function checkMockStreaming(messages: ReturnType<typeof buildTrainingPlanAiMessages>): Promise<Record<string, unknown>> {
  const encoded = new TextEncoder()
  const json = JSON.stringify(sampleJson())
  const chunks = [
    `data: ${JSON.stringify({ model: 'mock-training-model', choices: [{ delta: { content: json.slice(0, 60) } }] })}\n\n`,
    `data: ${JSON.stringify({ choices: [{ delta: { content: json.slice(60) } }], usage: { total_tokens: 321 } })}\n\n`,
    'data: [DONE]\n\n'
  ]
  let body = ''
  const fetchImpl: FetchLike = async (_url, init) => {
    body = init.body
    return {
      ok: true,
      status: 200,
      text: async () => '',
      body: new ReadableStream<Uint8Array>({
        start(controller) {
          chunks.forEach((chunk) => controller.enqueue(encoded.encode(chunk)))
          controller.close()
        }
      })
    }
  }
  const response = await requestChatJson({
    baseUrl: 'https://mock.local/v1',
    apiKey: 'sk-test',
    model: 'mock-training',
    messages,
    temperature: 0.4,
    stream: true,
    maxTokens: 4000,
    timeoutMs: 5000,
    fetchImpl
  })
  const sent = JSON.parse(body) as { stream?: boolean; max_tokens?: number }
  assert(sent.stream === true && sent.max_tokens === 4000, '训练计划应使用流式长文本请求')
  assert(response.result.model === 'mock-training-model' && response.result.totalTokens === 321, '应读取流式模型与用量')
  return response.data
}

export async function runTrainingPlanAiSelfCheckOrThrow(): Promise<string> {
  const parsed = request()
  expectThrow(() => parseTrainingPlanAiRequest({ ...parsed, durationMinutes: 20 }), '时长')
  expectThrow(() => parseTrainingPlanAiRequest({ ...parsed, programId: 'unknown' }), '项目')

  const team: TrainingTeam = {
    id: TEAM_ID,
    parentTeamId: null,
    name: '校篮球队',
    sport: 'basketball',
    coach: '教练',
    notes: '',
    status: 'active',
    createdAt: NOW,
    updatedAt: NOW
  }
  const context = buildTrainingPlanAiContext(parsed, team, [
    member(),
    member({ id: 'left-private-id', studentId: 'left-student', status: 'left', leftAt: '2026-10-01', specialty: '中锋' })
  ])
  assert(context.activeMemberCount === 1 && context.specialties.join() === '控球', '只聚合当前在队队员资料')
  const messages = buildTrainingPlanAiMessages(context)
  const prompt = messages.map((item) => item.content).join('\n')
  for (const privateValue of ['隐私姓名张三', 'training-member-private-id', 'student-private-id', '20260001', '七年级1班', '个人隐私备注']) {
    assert(!prompt.includes(privateValue), `提示词不得包含队员隐私：${privateValue}`)
  }
  assert(prompt.includes('控球') && prompt.includes('后卫') && prompt.includes('基础组'), '提示词应只使用去标识的聚合画像')
  assert(prompt.includes('RAMP') && prompt.includes('session-RPE') && prompt.includes('90 分钟'), '提示词应包含安全、负荷与时长要求')

  const data = await checkMockStreaming(messages)
  const draft = applyTrainingPlanAiJson(context, data, {
    provider: 'mock',
    model: 'mock-training-model',
    generatedAt: NOW
  })
  assert(trainingPlanAiSectionMinutes(draft.content).reduce((sum, value) => sum + value, 0) === 90, '分段时长应等于计划时长')
  assert(exercisesFromPlanContent(draft.content).length === 6, '生成内容应兼容训练记录练习解析')
  expectThrow(
    () => applyTrainingPlanAiJson(context, { ...sampleJson(), content: '【准备活动 · 10分钟】\n慢跑｜10分钟｜放松' }, draft.generation),
    '总时长'
  )

  const plan: TrainingPlan = {
    id: 'training-plan-22222222-2222-4222-8222-222222222222',
    trainingTeamId: TEAM_ID,
    date: draft.date,
    title: draft.title,
    goal: draft.goal,
    content: draft.content,
    notes: draft.notes,
    status: 'planned',
    blueprint: draft.blueprint,
    createdAt: NOW,
    updatedAt: NOW
  }
  const [saved] = parseTrainingPlans([plan], { knownTeamIds: new Set([TEAM_ID]) })
  assert(saved.blueprint?.durationMinutes === 90 && saved.blueprint.programId === 'basketball', 'AI 草稿应兼容既有计划保存结构')

  return 'training plan AI selfcheck ok (request / privacy aggregation / prompt / streaming / duration / persistence)'
}

if (process.argv[1] && /trainingTeam[\\/]aiGenerationSelfcheck\.ts$/.test(process.argv[1])) {
  runTrainingPlanAiSelfCheckOrThrow().then(
    (message) => console.log(message),
    (error) => {
      console.error(error)
      process.exitCode = 1
    }
  )
}
