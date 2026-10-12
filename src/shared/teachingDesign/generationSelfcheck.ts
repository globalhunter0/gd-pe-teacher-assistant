import { requestChatJson, type FetchLike } from '../aiModel/client'
import type { ChatMessage } from '../aiModel/types'
import { defaultPartMinutes, editionsForStage, stageRuleForGrade } from '../curriculum'
import { extractDocxText } from '../materials/docx'
import { readZipEntry } from '../materials/zipRead'
import { buildBigUnitDocx, buildLessonDocx, safeDocxFileName } from './docxExport'
import {
  applyBigUnitJson,
  applyLessonJson,
  applyUnitsJson,
  buildBigUnitMessages,
  buildLessonMessages,
  buildUnitsMessages,
  checkLessonCompliance,
  createTeachingDesignId,
  mainSegmentMinutes,
  materialKeywords,
  normalizeSegments,
  parseTeachingDesigns,
  repairOutline,
  type BigUnitDesign,
  type GenerationMeta,
  type LessonDesign
} from './index'

const NOW = '2026-10-12T08:00:00.000Z'
const META: GenerationMeta = { provider: 'deepseek', model: 'deepseek-chat', generatedAt: NOW }

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`[teaching-design generation selfcheck] ${message}`)
  }
}

function emptyBigUnit(overrides: Partial<BigUnitDesign> = {}): BigUnitDesign {
  return {
    id: createTeachingDesignId(),
    kind: 'bigUnit',
    title: '七年级篮球大单元',
    notes: '班级 45 人，两块篮球场',
    generation: null,
    createdAt: NOW,
    updatedAt: NOW,
    grade: '初一',
    academicYear: '2026-2027',
    semester: '第一学期',
    editionId: editionsForStage('compulsory')[0]?.id ?? null,
    categoryId: 'ball',
    sportItem: '篮球',
    totalLessons: 18,
    lessonMinutes: 40,
    teachingPlanId: null,
    materialResourceIds: [],
    guidingIdeas: '',
    learnerAnalysis: '',
    contentAnalysis: '',
    objectives: { sportAbility: '', healthBehavior: '', sportsMorality: '' },
    keyPoints: '',
    difficulties: '',
    unitOutline: [],
    assessment: '',
    safety: '',
    ...overrides
  }
}

const OBJECTIVES_CN = {
  运动能力: '在3对3比赛中，80%学生能运用运球突破与传球配合',
  健康行为: '能主动做好运动前热身与运动后放松',
  体育品德: '比赛中遵守规则、尊重裁判和对手'
}

function checkPrompts(): void {
  const junior = emptyBigUnit()
  const rule = stageRuleForGrade('初一')
  const [system, user] = buildBigUnitMessages(junior, '篮球行进间运球技术要点：按拍球的后上方')
  assert(system.role === 'system' && system.content.includes(rule.standard.title), '系统提示须写明义务教育课标名称')
  assert(system.content.includes(`≥${rule.load.groupDensityMinPct}%`) && system.content.includes(`${rule.load.heartRateMin}～${rule.load.heartRateMax}`), '系统提示须含运动负荷硬性指标')
  assert(system.content.includes('JSON'), '系统提示须要求只输出 JSON')
  assert(user.content.includes('第 18 课时') && user.content.includes('篮球'), '大单元提示须含总课时与项目')
  assert(user.content.includes('<<<资料开始') && user.content.includes('按拍球的后上方'), '教师资料须进入提示')
  assert(!buildBigUnitMessages(junior, '')[1].content.includes('<<<资料开始'), '无资料时不应出现资料块')
  assert(user.content.includes('班级 45 人'), '教师补充要求须进入提示')

  const senior = emptyBigUnit({ grade: '高一', editionId: editionsForStage('senior')[0]?.id ?? null, title: '高一篮球模块' })
  const seniorSystem = buildBigUnitMessages(senior, '')[0].content
  assert(seniorSystem.includes(stageRuleForGrade('高一').standard.title) && seniorSystem.includes('普通高中'), '高中须引用普通高中课标')
  assert(buildBigUnitMessages(senior, '')[1].content.includes('模块（大单元）'), '高中大单元称为模块')

  const keywords = materialKeywords(junior)
  assert(keywords.includes('篮球') && keywords.every((item) => item.length >= 2), '资料检索关键词须含项目且过滤单字')

  const [m1, m2, m3] = mainSegmentMinutes(40)
  assert(m1 + m2 + m3 === defaultPartMinutes(40).main, '基本部分三段时间之和须等于基本部分时间')
  for (const minutes of [30, 40, 45, 80, 90]) {
    const parts = defaultPartMinutes(minutes)
    assert(parts.opening + parts.warmup + parts.main + parts.closing === minutes, `${minutes} 分钟课的四部分时间须合计正确`)
    assert(mainSegmentMinutes(minutes).every((value) => value > 0), `${minutes} 分钟课的基本部分各段须为正数`)
  }
}

function checkOutlineRepair(): void {
  const gap = repairOutline(
    [
      { title: '单元二', lessonFrom: 8, lessonTo: 14, focus: 'b' },
      { title: '单元一', lessonFrom: 1, lessonTo: 5, focus: 'a' },
      { title: '单元三', lessonFrom: 16, lessonTo: 30, focus: 'c' }
    ],
    18
  )
  assert(gap.map((item) => item.title).join() === '单元一,单元二,单元三', '单元划分须按起始课次排序')
  assert(gap[0].lessonFrom === 1 && gap[gap.length - 1].lessonTo === 18, '单元划分须覆盖 1～总课时')
  for (let index = 1; index < gap.length; index += 1) {
    assert(gap[index].lessonFrom === gap[index - 1].lessonTo + 1, '单元划分须连续不重叠')
  }
  const overflow = repairOutline(
    [
      { title: 'A', lessonFrom: 1, lessonTo: 20, focus: '' },
      { title: 'B', lessonFrom: 21, lessonTo: 30, focus: '' }
    ],
    18
  )
  assert(overflow.length === 1 && overflow[0].lessonTo === 18, '越界的单元须截断并丢弃多余单元')
  const empty = repairOutline([], 10)
  assert(empty.length === 1 && empty[0].lessonFrom === 1 && empty[0].lessonTo === 10, '空划分须兜底为一个单元')
}

function checkSegmentNormalization(): void {
  const parts = defaultPartMinutes(40)
  const segments = normalizeSegments(
    [
      { part: '结束部分', minutes: 4, content: '放松' },
      { part: '基本部分', minutes: 10, content: '学习' },
      { part: '基本部分', minutes: 8, content: '比赛' },
      { part: '准备', minutes: parts.warmup, content: '热身' },
      { part: '未知部分', minutes: 5, content: '应丢弃' }
    ],
    40
  )
  assert(segments.map((item) => item.part).join() === 'opening,warmup,main,main,closing', '课的结构须按模板顺序并补齐开始部分')
  assert(segments[0].minutes === parts.opening, '缺失部分按默认时间补齐')
  assert(segments.reduce((sum, item) => sum + item.minutes, 0) === 40, '各部分时间合计须等于课时长')
  assert(!segments.some((item) => item.content === '应丢弃'), '无法识别的部分须丢弃')
  const fallback = normalizeSegments('不是数组', 45)
  assert(fallback.length === 4 && fallback.reduce((sum, item) => sum + item.minutes, 0) === 45, '非法输入须生成完整默认结构')
}

function sampleLessonJson(lessonMinutes: number): Record<string, unknown> {
  const parts = defaultPartMinutes(lessonMinutes)
  const [m1, m2, m3] = mainSegmentMinutes(lessonMinutes)
  const rule = stageRuleForGrade('初一')
  const segment = (part: string, minutes: number, content: string): Record<string, unknown> => ({
    part,
    minutes,
    goal: `${content}目标`,
    content,
    teacherActivities: ['1.讲解示范', '2.巡回指导'],
    studentActivities: '1.认真观察\n2.分组练习',
    organization: '四列横队',
    requirements: '注意安全'
  })
  return {
    title: '行进间运球 <进阶> & 比赛',
    objectives: OBJECTIVES_CN,
    content: '行进间运球；运球接力赛',
    safetyPlan: '检查场地器材，练习间距 2 米',
    keyPoint: '按拍球的后上方',
    difficulty: '抬头观察',
    flow: '课堂常规→热身→技能学习→比赛→体能→放松',
    segments: [
      segment('开始部分', parts.opening, '课堂常规'),
      segment('准备部分', parts.warmup, '球性练习'),
      segment('基本部分', m1, '行进间运球学习'),
      segment('基本部分', m2, '运球接力比赛'),
      segment('基本部分', m3, '体能练习：折返跑'),
      segment('结束部分', parts.closing, '放松与小结')
    ],
    load: {
      groupDensityPct: '78%',
      individualDensityPct: 55,
      avgHeartRate: rule.load.heartRateMin + 10,
      peakHeartRate: 178,
      fitnessMinutes: rule.load.fitnessMinutesTarget,
      note: '强度先升后降'
    },
    venueEquipment: '篮球场 2 块，篮球 45 个，标志桶 20 个'
  }
}

/** 用假的模型服务跑通：提示词 → OpenAI 兼容请求 → JSON 抽取 → 写入设计结构。 */
async function checkGenerationChain(): Promise<void> {
  const requests: Array<{ messages: ChatMessage[]; responseFormat: unknown }> = []
  const replies: string[] = []
  const fetchImpl: FetchLike = async (_url, init) => {
    const body = JSON.parse(init.body) as { messages: ChatMessage[]; response_format?: unknown }
    requests.push({ messages: body.messages, responseFormat: body.response_format })
    const content = replies.shift() ?? '{}'
    return { ok: true, status: 200, text: async () => JSON.stringify({ model: 'deepseek-chat', choices: [{ message: { content } }] }) }
  }
  const call = async (messages: ChatMessage[]): Promise<Record<string, unknown>> =>
    (await requestChatJson({ baseUrl: 'https://mock.local/v1', apiKey: 'sk-test', model: 'deepseek-chat', messages, temperature: 0.7, timeoutMs: 5000, fetchImpl })).data

  const draft = emptyBigUnit()
  replies.push(
    '```json\n' +
      JSON.stringify({
        guidingIdeas: '坚持健康第一',
        learnerAnalysis: ['初一学生好动', '基础差异大'],
        contentAnalysis: '篮球是集体对抗项目',
        objectives: OBJECTIVES_CN,
        keyPoints: '运球与传接球衔接',
        difficulties: '对抗中运用',
        unitOutline: [
          { title: '单元一 运球', lessonFrom: 1, lessonTo: 6, focus: '运球' },
          { title: '单元二 传接球', lessonFrom: 7, lessonTo: 12, focus: '传接球' },
          { title: '单元三 比赛', lessonFrom: 13, lessonTo: 17, focus: '比赛' }
        ],
        assessment: '过程性评价 + 技能测评',
        safety: '课前检查场地'
      }) +
      '\n```'
  )
  const generatedBigUnit = applyBigUnitJson(draft, await call(buildBigUnitMessages(draft, '')), META)
  assert(requests[0].responseFormat !== undefined, '生成请求须使用 JSON 模式')
  assert(generatedBigUnit.id === draft.id && generatedBigUnit.createdAt === NOW, '生成大单元须保留原 ID 与创建时间')
  assert(generatedBigUnit.objectives.sportAbility === OBJECTIVES_CN.运动能力, '中文键名的学习目标须被识别')
  assert(generatedBigUnit.learnerAnalysis.includes('初一学生好动\n基础差异大'), '数组形式的文本须合并为多行')
  assert(generatedBigUnit.unitOutline[2].lessonTo === 18, '模型漏掉的末尾课次须并入最后一个单元')
  assert(generatedBigUnit.generation?.model === 'deepseek-chat', '须记录生成来源')

  replies.push(
    JSON.stringify({
      units: [
        {
          objectives: OBJECTIVES_CN,
          keyPoints: '运球手型',
          difficulties: '抬头运球',
          assessment: '运球达标',
          lessonSchedule: [
            { lessonNo: 2, topic: '行进间运球', content: '直线运球', practiceAndCompetition: '运球接力赛', assessment: '速度' },
            { lessonNo: 1, topic: '原地运球', content: '高低运球', practiceAndCompetition: '运球挑战', assessment: '次数' }
          ]
        },
        { keyPoints: '传接球', lessonSchedule: [] }
      ]
    })
  )
  const units = applyUnitsJson(generatedBigUnit, await call(buildUnitsMessages(generatedBigUnit, '')), META, [])
  assert(units.length === 3, '单元数须与单元划分一致（模型少给的单元也要建）')
  assert(units[0].lessonSchedule.length === 6 && units[0].lessonSchedule[0].topic === '原地运球', '课次安排须按课次号对齐并覆盖整个单元')
  assert(units[2].keyPoints === '比赛' && units[2].lessonSchedule.length === 6, '缺失单元须以划分重点兜底并保留完整课次')
  assert(units.every((item, index) => item.order === index + 1 && item.bigUnitId === generatedBigUnit.id), '单元须挂在大单元下并按序号排列')

  replies.push(JSON.stringify({ units: [{ keyPoints: '重写后' }] }))
  const regenerated = applyUnitsJson(generatedBigUnit, await call(buildUnitsMessages(generatedBigUnit, '')), META, units)
  assert(regenerated.every((item, index) => item.id === units[index].id), '重新生成单元须保留已有单元 ID，教案引用不断开')
  assert(requests[2].messages[1].content.includes('单元一 运球（第1～6课时）'), '单元提示须原样列出单元划分')

  const counts = { maleCount: 23, femaleCount: 22 }
  replies.push(`好的，以下是教案：${JSON.stringify(sampleLessonJson(40))}`)
  const lessonMessages = buildLessonMessages(generatedBigUnit, units[0], 1, counts, '')
  assert(lessonMessages[1].content.includes('广州市统一课时教案模板') && lessonMessages[1].content.includes('原地运球'), '课时提示须引用模板与本课安排')
  assert(lessonMessages[1].content.includes('男 23 人，女 22 人'), '课时提示须含男女人数')
  const lesson = applyLessonJson(generatedBigUnit, units[0], 1, counts, await call(lessonMessages), META, null)
  assert(lesson.title.startsWith('第1课时 '), '课时教案标题须带课次')
  assert(lesson.unitId === units[0].id && lesson.bigUnitId === generatedBigUnit.id && lesson.lessonNo === 1, '课时教案须关联单元与大单元')
  assert(lesson.load.groupDensityPct === 78, '带百分号的负荷数值须解析')
  assert(lesson.segments.length === 6 && lesson.segments.reduce((sum, item) => sum + item.minutes, 0) === 40, '课的结构须完整且时间合计正确')
  assert(lesson.segments[2].teacherActivities === '1.讲解示范\n2.巡回指导', '分条数组须转成多行文本')
  const errors = checkLessonCompliance(lesson).filter((issue) => issue.severity === 'error')
  assert(errors.length === 0, `符合课标的生成教案不应有不符合项：${errors.map((issue) => issue.message).join('；')}`)

  const withReflection: LessonDesign = { ...lesson, reflection: '学生运球抬头不足', notes: '备注' }
  replies.push(JSON.stringify(sampleLessonJson(40)))
  const again = applyLessonJson(generatedBigUnit, units[0], 1, counts, await call(lessonMessages), { ...META, generatedAt: '2026-10-13T08:00:00.000Z' }, withReflection)
  assert(again.id === lesson.id && again.createdAt === lesson.createdAt, '重新生成须保留教案 ID 与创建时间')
  assert(again.reflection === '学生运球抬头不足' && again.notes === '备注', '重新生成须保留教师写的反思与备注')

  replies.push('{"title":"缺字段"}')
  const sparse = applyLessonJson(generatedBigUnit, null, 18, { maleCount: null, femaleCount: null }, await call(buildLessonMessages(generatedBigUnit, null, 18, { maleCount: null, femaleCount: null }, '')), META, null)
  assert(sparse.unitId === null && sparse.segments.length === 4 && sparse.segments.reduce((sum, item) => sum + item.minutes, 0) === 40, '字段缺失时须生成完整可编辑的结构')

  const roundTrip = parseTeachingDesigns([generatedBigUnit, ...regenerated, again, sparse])
  assert(roundTrip.length === 6, '生成结果须能通过持久化校验')

  replies.push('这不是 JSON')
  let rejected = false
  try {
    await call(lessonMessages)
  } catch {
    rejected = true
  }
  assert(rejected, '模型返回非 JSON 时须报错而不是写入空教案')
}

function checkDocx(): void {
  const bigUnit = emptyBigUnit({
    guidingIdeas: '健康第一',
    unitOutline: [{ title: '单元一 运球', lessonFrom: 1, lessonTo: 18, focus: '运球' }]
  })
  const lesson = applyLessonJson(bigUnit, null, 3, { maleCount: 20, femaleCount: 21 }, sampleLessonJson(40), META, null)
  const buffer = buildLessonDocx(lesson)
  for (const entry of ['[Content_Types].xml', '_rels/.rels', 'word/document.xml']) {
    assert(readZipEntry(buffer, entry), `教案 DOCX 缺少 ${entry}`)
  }
  const xml = readZipEntry(buffer, 'word/document.xml')!.toString('utf8')
  assert((xml.match(/<w:tr>/g) ?? []).length === (xml.match(/<\/w:tr>/g) ?? []).length, 'DOCX 表格行须闭合')
  assert(xml.includes('&lt;进阶&gt; &amp;') && !xml.includes('<进阶>'), 'DOCX 须转义特殊字符')
  assert(xml.includes('w:vMerge w:val="restart"'), '基本部分多段须纵向合并部分名称')
  const text = extractDocxText(buffer)
  for (const label of ['教学目标', '教学内容', '安全预案', '重点', '难点', '教学流程', '开始部分', '准备部分', '基本部分', '结束部分', '预计运动负荷', '场地器材', '男20人', '行进间运球学习']) {
    assert(text.replace(/\s/g, '').includes(label.replace(/\s/g, '')), `教案 DOCX 缺少「${label}」`)
  }
  assert(!text.includes('教学反思'), '义务教育且未写反思时不输出教学反思行')

  const senior = applyLessonJson(emptyBigUnit({ grade: '高一', editionId: null }), null, 1, { maleCount: null, femaleCount: null }, sampleLessonJson(40), META, null)
  const seniorText = extractDocxText(buildLessonDocx(senior))
  assert(seniorText.includes('安全防范措施') && seniorText.includes('教学反思'), '高中教案须用安全防范措施并保留教学反思行')

  const units = applyUnitsJson(bigUnit, { units: [{ keyPoints: '运球手型', lessonSchedule: [{ lessonNo: 1, topic: '原地运球' }] }] }, META, [])
  const bigText = extractDocxText(buildBigUnitDocx(bigUnit, units))
  for (const label of ['健康第一', '单元一 运球', '原地运球', '第18课时']) {
    assert(bigText.replace(/\s/g, '').includes(label.replace(/\s/g, '')), `大单元 DOCX 缺少「${label}」`)
  }

  assert(safeDocxFileName('第1课时 运球/传球:*?') === '第1课时 运球_传球___.docx' || !/[\\/:*?"<>|]/.test(safeDocxFileName('第1课时 运球/传球:*?')), '导出文件名须去掉非法字符')
  assert(safeDocxFileName('  ').endsWith('.docx'), '空标题也须得到合法文件名')
}

export async function runTeachingDesignGenerationSelfCheckOrThrow(): Promise<string> {
  checkPrompts()
  checkOutlineRepair()
  checkSegmentNormalization()
  await checkGenerationChain()
  checkDocx()
  return 'teaching design generation selfcheck ok (prompts / outline / segments / mock LLM chain / docx)'
}

if (process.argv[1] && /teachingDesign[\\/]generationSelfcheck\.ts$/.test(process.argv[1])) {
  runTeachingDesignGenerationSelfCheckOrThrow().then(
    (message) => console.log(message),
    (error: unknown) => {
      console.error(error)
      process.exitCode = 1
    }
  )
}
