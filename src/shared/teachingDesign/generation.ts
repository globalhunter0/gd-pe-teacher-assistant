import type { ChatMessage } from '../aiModel/types'
import {
  CATEGORY_TEACHER_BOOK_KEYWORDS,
  GRADE_LEVEL,
  LESSON_PART_LABELS,
  LEVEL_LABELS,
  defaultPartMinutes,
  findContentCategory,
  stageOfGrade,
  stageRuleForGrade
} from '../curriculum/standards'
import { editionLabel, findEdition, matchTeacherBook } from '../curriculum/textbooks'
import type { LessonPartId } from '../curriculum/types'
import type {
  BigUnitDesign,
  CompetencyObjectives,
  GenerationMeta,
  LessonDesign,
  LessonLoad,
  LessonScheduleItem,
  LessonSegment,
  UnitDesign,
  UnitOutlineItem
} from './types'
import { MAX_SEGMENTS, cleanText, createTeachingDesignId, parseLoad, parseObjectives, parseTeachingDesign } from './validate'

export type GenerationRequest =
  | { requestId: string; kind: 'bigUnit'; bigUnit: BigUnitDesign }
  | { requestId: string; kind: 'units'; bigUnit: BigUnitDesign; existingUnits: UnitDesign[] }
  | {
      requestId: string
      kind: 'lesson'
      bigUnit: BigUnitDesign
      unit: UnitDesign | null
      lessonNo: number
      maleCount: number | null
      femaleCount: number | null
      existingLessonId: string | null
    }

export type GenerationResult =
  | { kind: 'bigUnit'; bigUnit: BigUnitDesign }
  | { kind: 'units'; units: UnitDesign[] }
  | { kind: 'lesson'; lesson: LessonDesign }

const PART_ALIASES: Record<string, LessonPartId> = {
  opening: 'opening',
  开始: 'opening',
  开始部分: 'opening',
  warmup: 'warmup',
  准备: 'warmup',
  准备部分: 'warmup',
  main: 'main',
  基本: 'main',
  基本部分: 'main',
  closing: 'closing',
  结束: 'closing',
  结束部分: 'closing'
}
const PART_ORDER: LessonPartId[] = ['opening', 'warmup', 'main', 'closing']

function text(value: unknown): string {
  if (Array.isArray(value)) {
    return cleanText(value.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).join('\n'))
  }
  if (typeof value === 'number') {
    return String(value)
  }
  return cleanText(value)
}

function int(value: unknown): number | null {
  const num = typeof value === 'string' ? Number(value.match(/\d+(?:\.\d+)?/)?.[0] ?? NaN) : value
  return typeof num === 'number' && Number.isFinite(num) ? Math.round(num) : null
}

function loadFrom(value: unknown): LessonLoad {
  const source = record(value)
  return parseLoad({
    groupDensityPct: int(source.groupDensityPct),
    individualDensityPct: int(source.individualDensityPct),
    avgHeartRate: int(source.avgHeartRate),
    peakHeartRate: int(source.peakHeartRate),
    fitnessMinutes: int(source.fitnessMinutes),
    note: text(source.note)
  })
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function objectivesFrom(value: unknown): CompetencyObjectives {
  const source = record(value)
  return parseObjectives({
    sportAbility: text(source.sportAbility ?? source['运动能力']),
    healthBehavior: text(source.healthBehavior ?? source['健康行为']),
    sportsMorality: text(source.sportsMorality ?? source['体育品德'])
  })
}

/** 课时表述与课标对齐的公共约束，所有生成请求共用。 */
export function systemPrompt(bigUnit: BigUnitDesign): string {
  const stage = stageOfGrade(bigUnit.grade)
  const rule = stageRuleForGrade(bigUnit.grade)
  return [
    '你是广东省资深体育与健康教研员，负责为一线体育教师撰写可直接使用的教学设计。',
    `必须严格执行${rule.standard.title}（${rule.standard.issuer}）的要求：`,
    ...rule.principles.map((item, index) => `${index + 1}. ${item}`),
    `运动负荷硬性要求：群体运动密度≥${rule.load.groupDensityMinPct}%，个体运动密度≥${rule.load.individualDensityMinPct}%，班级平均心率${rule.load.heartRateMin}～${rule.load.heartRateMax}次/分，每节课体能练习${rule.load.fitnessMinutesTarget}分钟左右。`,
    `学段：${stage === 'senior' ? '普通高中' : '义务教育'}，${LEVEL_LABELS[GRADE_LEVEL[bigUnit.grade]]}，${bigUnit.grade}。`,
    '写作要求：学习目标分运动能力、健康行为、体育品德三个维度，每条写明条件、行为与表现、结果，使用可观察、可评价的行为动词；内容具体到练习方法、组织形式、次数组数或时间，不写空话套话；体现“学、练、赛、评”一体化，关注安全与差异化。',
    '只输出一个 JSON 对象，不要输出 Markdown、解释或其他文字。所有字段用简体中文。'
  ].join('\n')
}

function contextLines(bigUnit: BigUnitDesign): string[] {
  const category = findContentCategory(bigUnit.categoryId)
  const edition = findEdition(bigUnit.editionId)
  const teacherBook = edition ? matchTeacherBook(edition, bigUnit.sportItem, CATEGORY_TEACHER_BOOK_KEYWORDS[bigUnit.categoryId]) : null
  return [
    `年级：${bigUnit.grade}；学年学期：${bigUnit.academicYear} ${bigUnit.semester}`,
    `课程内容类别：${category?.name ?? bigUnit.categoryId}；运动项目 / 学习内容：${bigUnit.sportItem}`,
    edition ? `所用教材：${editionLabel(edition)}${teacherBook ? `；对应教师用书分册：《${teacherBook}》` : ''}` : '所用教材：未指定（按课标要求编写）',
    `大单元总课时：${bigUnit.totalLessons} 课时，每课时 ${bigUnit.lessonMinutes} 分钟`
  ]
}

function materialBlock(materialText: string): string[] {
  return materialText
    ? ['以下是教师提供的教材 / 教参节选，请优先依据其中的教学内容、技术要点与练习方法：', '<<<资料开始', materialText, '资料结束>>>']
    : []
}

export function materialKeywords(bigUnit: BigUnitDesign, unit: UnitDesign | null = null, lessonNo: number | null = null): string[] {
  const category = findContentCategory(bigUnit.categoryId)
  const keywords = [bigUnit.sportItem, ...bigUnit.sportItem.split(/[、，,\s/]+/), category?.name ?? '', bigUnit.grade]
  if (unit) {
    keywords.push(unit.title, unit.keyPoints)
    const item = unit.lessonSchedule.find((entry) => entry.lessonNo === lessonNo)
    if (item) {
      keywords.push(item.topic, ...item.content.split(/[、，,；;\s]+/).slice(0, 6))
    }
  }
  return keywords.map((keyword) => keyword.trim()).filter((keyword) => keyword.length >= 2 && keyword.length <= 20)
}

export function buildBigUnitMessages(bigUnit: BigUnitDesign, materialText: string): ChatMessage[] {
  const unitHint = bigUnit.totalLessons >= 12 ? '划分 3～4 个单元' : '划分 1～3 个单元'
  return [
    { role: 'system', content: systemPrompt(bigUnit) },
    {
      role: 'user',
      content: [
        `请撰写“${bigUnit.title}”的${stageOfGrade(bigUnit.grade) === 'senior' ? '模块（大单元）' : '大单元'}教学计划。`,
        ...contextLines(bigUnit),
        bigUnit.notes ? `教师补充要求与学情：${bigUnit.notes}` : '',
        `${unitHint}，单元课次必须从第 1 课时连续覆盖到第 ${bigUnit.totalLessons} 课时，不重叠不断档；单元之间体现由易到难、由技术到运用、由练到赛的进阶。`,
        '输出 JSON 字段：',
        '{"guidingIdeas":"指导思想（结合课标理念，150字内）","learnerAnalysis":"学情分析","contentAnalysis":"教材与内容分析","objectives":{"sportAbility":"","healthBehavior":"","sportsMorality":""},"keyPoints":"教学重点","difficulties":"教学难点","unitOutline":[{"title":"单元一 ……","lessonFrom":1,"lessonTo":6,"focus":"本单元学习重点"}],"assessment":"学习评价（过程性与终结性、评价内容与方式）","safety":"安全保障措施"}'
      ]
        .concat(materialBlock(materialText))
        .filter(Boolean)
        .join('\n')
    }
  ]
}

export function buildUnitsMessages(bigUnit: BigUnitDesign, materialText: string): ChatMessage[] {
  return [
    { role: 'system', content: systemPrompt(bigUnit) },
    {
      role: 'user',
      content: [
        `请根据以下大单元教学计划，逐个撰写单元教学计划，并为每个课时安排学练内容。`,
        ...contextLines(bigUnit),
        `大单元目标：运动能力：${bigUnit.objectives.sportAbility}；健康行为：${bigUnit.objectives.healthBehavior}；体育品德：${bigUnit.objectives.sportsMorality}`,
        `大单元重点：${bigUnit.keyPoints}；难点：${bigUnit.difficulties}`,
        '单元划分（必须原样沿用，units 数组顺序与此一致）：',
        ...bigUnit.unitOutline.map((item, index) => `${index + 1}. ${item.title}（第${item.lessonFrom}～${item.lessonTo}课时）：${item.focus}`),
        '每个课时的 practiceAndCompetition 写本课的练习与比赛（对抗、挑战或展示）安排；assessment 写可观察的评价要点。lessonSchedule 必须覆盖本单元的每一个课次。',
        '输出 JSON 字段：',
        '{"units":[{"title":"","objectives":{"sportAbility":"","healthBehavior":"","sportsMorality":""},"keyPoints":"","difficulties":"","assessment":"","lessonSchedule":[{"lessonNo":1,"topic":"课题","content":"主要学习内容","practiceAndCompetition":"","assessment":""}]}]}'
      ]
        .concat(materialBlock(materialText))
        .join('\n')
    }
  ]
}

export function mainSegmentMinutes(lessonMinutes: number): number[] {
  const { main } = defaultPartMinutes(lessonMinutes)
  const first = Math.max(4, Math.round((main * 6) / 30))
  const second = Math.max(6, Math.round((main * 10) / 30))
  return [first, second, main - first - second]
}

export function buildLessonMessages(
  bigUnit: BigUnitDesign,
  unit: UnitDesign | null,
  lessonNo: number,
  counts: { maleCount: number | null; femaleCount: number | null },
  materialText: string
): ChatMessage[] {
  const parts = defaultPartMinutes(bigUnit.lessonMinutes)
  const [m1, m2, m3] = mainSegmentMinutes(bigUnit.lessonMinutes)
  const schedule = unit?.lessonSchedule.find((item) => item.lessonNo === lessonNo)
  const neighbours = unit?.lessonSchedule.filter((item) => Math.abs(item.lessonNo - lessonNo) === 1) ?? []
  const rule = stageRuleForGrade(bigUnit.grade)
  const senior = rule.stage === 'senior'
  return [
    { role: 'system', content: systemPrompt(bigUnit) },
    {
      role: 'user',
      content: [
        `请按“广州市统一课时教案模板”撰写第 ${lessonNo} 课时（共 ${bigUnit.totalLessons} 课时）的课时教案。`,
        ...contextLines(bigUnit),
        counts.maleCount !== null || counts.femaleCount !== null ? `班级人数：男 ${counts.maleCount ?? '—'} 人，女 ${counts.femaleCount ?? '—'} 人` : '',
        unit ? `所属单元：${unit.title}（第${unit.lessonFrom}～${unit.lessonTo}课时）；单元重点：${unit.keyPoints}；单元难点：${unit.difficulties}` : '',
        schedule ? `本课安排：课题“${schedule.topic}”；内容：${schedule.content}；练习与比赛：${schedule.practiceAndCompetition}；评价：${schedule.assessment}` : '',
        neighbours.length ? `前后课衔接：${neighbours.map((item) => `第${item.lessonNo}课时“${item.topic}”`).join('，')}` : '',
        bigUnit.notes ? `教师补充要求与场地条件：${bigUnit.notes}` : '',
        `课的结构固定为四部分，segments 按顺序：开始部分 ${parts.opening} 分钟（opening，1段）、准备部分 ${parts.warmup} 分钟（warmup，1段）、基本部分（main，3段，参考 ${m1}/${m2}/${m3} 分钟：技能学习、学练与比赛、体能练习约${rule.load.fitnessMinutesTarget}分钟）、结束部分 ${parts.closing} 分钟（closing，1段）；各段 minutes 合计必须等于 ${bigUnit.lessonMinutes}。`,
        '每段写清：goal 达成目标、content 教学内容、teacherActivities 教师活动（分条，含讲解示范要点、指导纠错、组织比赛）、studentActivities 学生活动（分条）、organization 组织方法（队形、分组、场地布置）、requirements 学练要求（含安全要求）。',
        `load 填预计运动负荷：groupDensityPct（≥${rule.load.groupDensityMinPct}）、individualDensityPct（≥${rule.load.individualDensityMinPct}）、avgHeartRate（${rule.load.heartRateMin}～${rule.load.heartRateMax}）、peakHeartRate、fitnessMinutes（约${rule.load.fitnessMinutesTarget}），note 写强度变化说明。`,
        `${senior ? 'safetyPlan 写安全防范措施' : 'safetyPlan 写安全预案'}；venueEquipment 写场地器材（含数量）；flow 用“→”串起教学流程。`,
        '输出 JSON 字段：',
        '{"title":"课题","objectives":{"sportAbility":"","healthBehavior":"","sportsMorality":""},"content":"教学内容","safetyPlan":"","keyPoint":"重点","difficulty":"难点","flow":"","segments":[{"part":"opening","minutes":2,"goal":"","content":"","teacherActivities":"","studentActivities":"","organization":"","requirements":""}],"load":{"groupDensityPct":78,"individualDensityPct":55,"avgHeartRate":148,"peakHeartRate":175,"fitnessMinutes":10,"note":""},"venueEquipment":""}'
      ]
        .concat(materialBlock(materialText))
        .filter(Boolean)
        .join('\n')
    }
  ]
}

/** 让单元划分从 1 连续覆盖到总课时；模型偶尔断档或越界时自动修正。 */
export function repairOutline(outline: ReadonlyArray<UnitOutlineItem>, totalLessons: number): UnitOutlineItem[] {
  const sorted = [...outline]
    .filter((item) => item.title || item.focus)
    .sort((a, b) => a.lessonFrom - b.lessonFrom || a.lessonTo - b.lessonTo)
  const repaired: UnitOutlineItem[] = []
  let next = 1
  for (const [index, item] of sorted.entries()) {
    if (next > totalLessons) {
      break
    }
    const isLast = index === sorted.length - 1
    const to = isLast ? totalLessons : Math.min(totalLessons, Math.max(next, item.lessonTo))
    repaired.push({ ...item, lessonFrom: next, lessonTo: to })
    next = to + 1
  }
  if (repaired.length === 0) {
    return [{ title: '单元一', lessonFrom: 1, lessonTo: totalLessons, focus: '' }]
  }
  return repaired
}

export function applyBigUnitJson(bigUnit: BigUnitDesign, json: Record<string, unknown>, meta: GenerationMeta): BigUnitDesign {
  const outline = Array.isArray(json.unitOutline)
    ? json.unitOutline.map((entry, index) => {
        const item = record(entry)
        return {
          title: text(item.title) || `单元${index + 1}`,
          lessonFrom: int(item.lessonFrom) ?? 1,
          lessonTo: int(item.lessonTo) ?? bigUnit.totalLessons,
          focus: text(item.focus)
        }
      })
    : []
  const next: BigUnitDesign = {
    ...bigUnit,
    guidingIdeas: text(json.guidingIdeas),
    learnerAnalysis: text(json.learnerAnalysis),
    contentAnalysis: text(json.contentAnalysis),
    objectives: objectivesFrom(json.objectives),
    keyPoints: text(json.keyPoints),
    difficulties: text(json.difficulties),
    unitOutline: repairOutline(outline, bigUnit.totalLessons),
    assessment: text(json.assessment),
    safety: text(json.safety),
    generation: meta,
    updatedAt: meta.generatedAt
  }
  return parseTeachingDesign(next) as BigUnitDesign
}

function scheduleFor(raw: unknown, from: number, to: number): LessonScheduleItem[] {
  const entries = Array.isArray(raw) ? raw.map(record) : []
  const used = new Set<number>()
  const result: LessonScheduleItem[] = []
  for (let lessonNo = from; lessonNo <= to; lessonNo += 1) {
    let index = entries.findIndex((entry, position) => !used.has(position) && int(entry.lessonNo) === lessonNo)
    if (index < 0) {
      index = entries.findIndex((_entry, position) => !used.has(position) && position === lessonNo - from)
    }
    const entry = index >= 0 ? entries[index] : {}
    if (index >= 0) used.add(index)
    result.push({
      lessonNo,
      topic: text(entry.topic),
      content: text(entry.content),
      practiceAndCompetition: text(entry.practiceAndCompetition),
      assessment: text(entry.assessment)
    })
  }
  return result
}

/** 单元按大单元划分逐一对应；已有单元保留 ID，课时教案的单元引用不会断开。 */
export function applyUnitsJson(
  bigUnit: BigUnitDesign,
  json: Record<string, unknown>,
  meta: GenerationMeta,
  existingUnits: ReadonlyArray<UnitDesign>
): UnitDesign[] {
  const raw = Array.isArray(json.units) ? json.units.map(record) : []
  return bigUnit.unitOutline.map((outline, index) => {
    const source = raw[index] ?? {}
    const existing = existingUnits.find((unit) => unit.order === index + 1)
    const unit: UnitDesign = {
      id: existing?.id ?? createTeachingDesignId(),
      kind: 'unit',
      title: outline.title,
      notes: existing?.notes ?? '',
      generation: meta,
      createdAt: existing?.createdAt ?? meta.generatedAt,
      updatedAt: meta.generatedAt,
      bigUnitId: bigUnit.id,
      order: index + 1,
      lessonFrom: outline.lessonFrom,
      lessonTo: outline.lessonTo,
      objectives: objectivesFrom(source.objectives),
      keyPoints: text(source.keyPoints) || outline.focus,
      difficulties: text(source.difficulties),
      lessonSchedule: scheduleFor(source.lessonSchedule, outline.lessonFrom, outline.lessonTo),
      assessment: text(source.assessment)
    }
    return parseTeachingDesign(unit) as UnitDesign
  })
}

/** 归一课的结构：识别中文部分名、按模板顺序排列、补齐缺失部分并把时间差额计入基本部分。 */
export function normalizeSegments(raw: unknown, lessonMinutes: number): LessonSegment[] {
  const defaults = defaultPartMinutes(lessonMinutes)
  const parsed: LessonSegment[] = (Array.isArray(raw) ? raw : []).slice(0, MAX_SEGMENTS).flatMap((entry) => {
    const item = record(entry)
    const part = PART_ALIASES[text(item.part).replace(/\s/g, '')]
    if (!part) {
      return []
    }
    const minutes = int(item.minutes)
    return [
      {
        part,
        minutes: minutes !== null && minutes >= 0 && minutes <= lessonMinutes ? minutes : 0,
        goal: text(item.goal),
        content: text(item.content),
        teacherActivities: text(item.teacherActivities),
        studentActivities: text(item.studentActivities),
        organization: text(item.organization),
        requirements: text(item.requirements)
      }
    ]
  })
  const ordered = PART_ORDER.flatMap((part) => {
    const matches = parsed.filter((segment) => segment.part === part)
    if (matches.length > 0) {
      return matches
    }
    return [{ part, minutes: defaults[part], goal: '', content: '', teacherActivities: '', studentActivities: '', organization: '', requirements: '' }]
  })
  const total = ordered.reduce((sum, segment) => sum + segment.minutes, 0)
  const diff = lessonMinutes - total
  if (diff !== 0) {
    const mains = ordered.filter((segment) => segment.part === 'main')
    const target = [...mains].sort((a, b) => b.minutes - a.minutes)[0]
    if (target && target.minutes + diff >= 1) {
      target.minutes += diff
    }
  }
  return ordered
}

export function applyLessonJson(
  bigUnit: BigUnitDesign,
  unit: UnitDesign | null,
  lessonNo: number,
  counts: { maleCount: number | null; femaleCount: number | null },
  json: Record<string, unknown>,
  meta: GenerationMeta,
  existing: LessonDesign | null
): LessonDesign {
  const schedule = unit?.lessonSchedule.find((item) => item.lessonNo === lessonNo)
  const topic = text(json.title) || schedule?.topic || bigUnit.sportItem
  const lesson: LessonDesign = {
    id: existing?.id ?? createTeachingDesignId(),
    kind: 'lesson',
    title: `第${lessonNo}课时 ${topic}`.slice(0, 120),
    notes: existing?.notes ?? '',
    generation: meta,
    createdAt: existing?.createdAt ?? meta.generatedAt,
    updatedAt: meta.generatedAt,
    bigUnitId: bigUnit.id,
    unitId: unit?.id ?? null,
    lessonNo,
    grade: bigUnit.grade,
    maleCount: counts.maleCount,
    femaleCount: counts.femaleCount,
    lessonMinutes: bigUnit.lessonMinutes,
    objectives: objectivesFrom(json.objectives),
    content: text(json.content) || schedule?.content || '',
    safetyPlan: text(json.safetyPlan),
    keyPoint: text(json.keyPoint),
    difficulty: text(json.difficulty),
    flow: text(json.flow),
    segments: normalizeSegments(json.segments, bigUnit.lessonMinutes),
    load: loadFrom(json.load),
    venueEquipment: text(json.venueEquipment),
    reflection: existing?.reflection ?? ''
  }
  return parseTeachingDesign(lesson) as LessonDesign
}

export function partLabel(part: LessonPartId): string {
  return LESSON_PART_LABELS[part]
}
