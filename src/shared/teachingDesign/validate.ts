import { GRADES, SEMESTERS, type Grade, type Semester } from '../class/types'
import { CONTENT_CATEGORIES, MAX_LESSON_MINUTES, MIN_LESSON_MINUTES } from '../curriculum/standards'
import type { ContentCategoryId, LessonPartId } from '../curriculum/types'
import type {
  BigUnitDesign,
  CompetencyObjectives,
  GenerationMeta,
  LessonDesign,
  LessonLoad,
  LessonScheduleItem,
  LessonSegment,
  TeachingDesign,
  UnitDesign,
  UnitOutlineItem
} from './types'

const DESIGN_ID = /^teaching-design-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PLAN_ID = /^teaching-plan-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const YEAR_PATTERN = /^\d{4}-\d{4}$/
const LESSON_PARTS: LessonPartId[] = ['opening', 'warmup', 'main', 'closing']
export const MAX_DESIGN_TEXT = 20000
export const MAX_BIG_UNIT_LESSONS = 72
export const MAX_SEGMENTS = 12

export function createTeachingDesignId(): string {
  return `teaching-design-${crypto.randomUUID()}`
}

export function isTeachingDesignId(value: unknown): value is string {
  return typeof value === 'string' && DESIGN_ID.test(value)
}

function record(entry: unknown, label: string): Record<string, unknown> {
  if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
    throw new Error(`${label}格式不正确`)
  }
  return entry as Record<string, unknown>
}

export function cleanText(value: unknown): string {
  if (typeof value !== 'string') {
    return ''
  }
  const trimmed = value.replace(/\r\n/g, '\n').trim()
  return trimmed.length > MAX_DESIGN_TEXT ? trimmed.slice(0, MAX_DESIGN_TEXT) : trimmed
}

function positiveInt(value: unknown, label: string, max: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > max) {
    throw new Error(`${label}必须是 1～${max} 的整数`)
  }
  return value
}

function optionalNumber(value: unknown, min: number, max: number): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }
  const num = typeof value === 'string' ? Number(value) : value
  if (typeof num !== 'number' || !Number.isFinite(num) || num < min || num > max) {
    return null
  }
  return Math.round(num)
}

function optionalCount(value: unknown): number | null {
  return optionalNumber(value, 0, 200)
}

function lessonMinutes(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < MIN_LESSON_MINUTES || value > MAX_LESSON_MINUTES) {
    throw new Error(`课时长度必须是 ${MIN_LESSON_MINUTES}～${MAX_LESSON_MINUTES} 分钟的整数`)
  }
  return value
}

function optionalDesignRef(value: unknown, label: string): string | null {
  if (value === null || value === undefined || value === '') {
    return null
  }
  if (!isTeachingDesignId(value)) {
    throw new Error(`${label} ID 不正确`)
  }
  return value
}

export function parseObjectives(value: unknown): CompetencyObjectives {
  const source = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
  return {
    sportAbility: cleanText(source.sportAbility),
    healthBehavior: cleanText(source.healthBehavior),
    sportsMorality: cleanText(source.sportsMorality)
  }
}

function parseGeneration(value: unknown): GenerationMeta | null {
  if (value === null || value === undefined) {
    return null
  }
  const source = record(value, '生成记录')
  if (typeof source.generatedAt !== 'string') {
    return null
  }
  return {
    provider: cleanText(source.provider),
    model: cleanText(source.model),
    generatedAt: source.generatedAt
  }
}

function parseOutline(value: unknown): UnitOutlineItem[] {
  if (value === undefined || value === null) {
    return []
  }
  if (!Array.isArray(value)) {
    throw new Error('单元划分格式不正确')
  }
  return value.map((entry) => {
    const item = record(entry, '单元划分')
    return {
      title: cleanText(item.title),
      lessonFrom: positiveInt(item.lessonFrom, '单元起始课次', MAX_BIG_UNIT_LESSONS),
      lessonTo: positiveInt(item.lessonTo, '单元结束课次', MAX_BIG_UNIT_LESSONS),
      focus: cleanText(item.focus)
    }
  })
}

function parseSchedule(value: unknown): LessonScheduleItem[] {
  if (value === undefined || value === null) {
    return []
  }
  if (!Array.isArray(value)) {
    throw new Error('课次安排格式不正确')
  }
  return value.map((entry) => {
    const item = record(entry, '课次安排')
    return {
      lessonNo: positiveInt(item.lessonNo, '课次', MAX_BIG_UNIT_LESSONS),
      topic: cleanText(item.topic),
      content: cleanText(item.content),
      practiceAndCompetition: cleanText(item.practiceAndCompetition),
      assessment: cleanText(item.assessment)
    }
  })
}

export function parseSegments(value: unknown): LessonSegment[] {
  if (!Array.isArray(value)) {
    throw new Error('课的结构格式不正确')
  }
  if (value.length > MAX_SEGMENTS) {
    throw new Error(`课的结构最多 ${MAX_SEGMENTS} 段`)
  }
  return value.map((entry) => {
    const item = record(entry, '课的结构')
    if (!LESSON_PARTS.includes(item.part as LessonPartId)) {
      throw new Error('课的部分不正确')
    }
    const minutes = typeof item.minutes === 'number' && Number.isInteger(item.minutes) && item.minutes >= 0 && item.minutes <= MAX_LESSON_MINUTES
      ? item.minutes
      : null
    if (minutes === null) {
      throw new Error('各部分时间必须是非负整数分钟')
    }
    return {
      part: item.part as LessonPartId,
      minutes,
      goal: cleanText(item.goal),
      content: cleanText(item.content),
      teacherActivities: cleanText(item.teacherActivities),
      studentActivities: cleanText(item.studentActivities),
      organization: cleanText(item.organization),
      requirements: cleanText(item.requirements)
    }
  })
}

export function parseLoad(value: unknown): LessonLoad {
  const source = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
  return {
    groupDensityPct: optionalNumber(source.groupDensityPct, 0, 100),
    individualDensityPct: optionalNumber(source.individualDensityPct, 0, 100),
    avgHeartRate: optionalNumber(source.avgHeartRate, 40, 230),
    peakHeartRate: optionalNumber(source.peakHeartRate, 40, 230),
    fitnessMinutes: optionalNumber(source.fitnessMinutes, 0, MAX_LESSON_MINUTES),
    note: cleanText(source.note)
  }
}

type BaseFields = Pick<TeachingDesign, 'id' | 'title' | 'notes' | 'generation' | 'createdAt' | 'updatedAt'>

function parseBase(item: Record<string, unknown>): BaseFields {
  if (!isTeachingDesignId(item.id)) {
    throw new Error('教学设计 ID 不正确')
  }
  const title = cleanText(item.title)
  if (!title) {
    throw new Error('教学设计名称不能为空')
  }
  if (typeof item.createdAt !== 'string' || typeof item.updatedAt !== 'string') {
    throw new Error('教学设计时间字段不正确')
  }
  return {
    id: item.id,
    title,
    notes: cleanText(item.notes),
    generation: parseGeneration(item.generation),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  }
}

function parseGrade(value: unknown): Grade {
  if (!GRADES.includes(value as Grade)) {
    throw new Error('年级不正确')
  }
  return value as Grade
}

function parseBigUnit(item: Record<string, unknown>): BigUnitDesign {
  const base = parseBase(item)
  if (typeof item.academicYear !== 'string' || !YEAR_PATTERN.test(item.academicYear.trim())) {
    throw new Error('学年格式应为 YYYY-YYYY')
  }
  if (!SEMESTERS.includes(item.semester as Semester)) {
    throw new Error('学期不正确')
  }
  if (!CONTENT_CATEGORIES.some((category) => category.id === item.categoryId)) {
    throw new Error('课程内容类别不正确')
  }
  const sportItem = cleanText(item.sportItem)
  if (!sportItem) {
    throw new Error('运动项目 / 学习内容不能为空')
  }
  const teachingPlanId =
    typeof item.teachingPlanId === 'string' && PLAN_ID.test(item.teachingPlanId) ? item.teachingPlanId : null
  const materialResourceIds = Array.isArray(item.materialResourceIds)
    ? Array.from(new Set(item.materialResourceIds.filter((id): id is string => typeof id === 'string' && id.length <= 120)))
    : []
  return {
    ...base,
    kind: 'bigUnit',
    grade: parseGrade(item.grade),
    academicYear: item.academicYear.trim(),
    semester: item.semester as Semester,
    editionId: typeof item.editionId === 'string' && item.editionId.trim() ? item.editionId.trim() : null,
    categoryId: item.categoryId as ContentCategoryId,
    sportItem,
    totalLessons: positiveInt(item.totalLessons, '总课时', MAX_BIG_UNIT_LESSONS),
    lessonMinutes: lessonMinutes(item.lessonMinutes),
    teachingPlanId,
    materialResourceIds,
    guidingIdeas: cleanText(item.guidingIdeas),
    learnerAnalysis: cleanText(item.learnerAnalysis),
    contentAnalysis: cleanText(item.contentAnalysis),
    objectives: parseObjectives(item.objectives),
    keyPoints: cleanText(item.keyPoints),
    difficulties: cleanText(item.difficulties),
    unitOutline: parseOutline(item.unitOutline),
    assessment: cleanText(item.assessment),
    safety: cleanText(item.safety)
  }
}

function parseUnit(item: Record<string, unknown>): UnitDesign {
  const base = parseBase(item)
  if (!isTeachingDesignId(item.bigUnitId)) {
    throw new Error('单元所属大单元 ID 不正确')
  }
  const lessonFrom = positiveInt(item.lessonFrom, '单元起始课次', MAX_BIG_UNIT_LESSONS)
  const lessonTo = positiveInt(item.lessonTo, '单元结束课次', MAX_BIG_UNIT_LESSONS)
  if (lessonFrom > lessonTo) {
    throw new Error('单元起始课次不能晚于结束课次')
  }
  return {
    ...base,
    kind: 'unit',
    bigUnitId: item.bigUnitId,
    order: positiveInt(item.order, '单元序号', MAX_BIG_UNIT_LESSONS),
    lessonFrom,
    lessonTo,
    objectives: parseObjectives(item.objectives),
    keyPoints: cleanText(item.keyPoints),
    difficulties: cleanText(item.difficulties),
    lessonSchedule: parseSchedule(item.lessonSchedule),
    assessment: cleanText(item.assessment)
  }
}

function parseLesson(item: Record<string, unknown>): LessonDesign {
  const base = parseBase(item)
  return {
    ...base,
    kind: 'lesson',
    bigUnitId: optionalDesignRef(item.bigUnitId, '所属大单元'),
    unitId: optionalDesignRef(item.unitId, '所属单元'),
    lessonNo: item.lessonNo === null || item.lessonNo === undefined ? null : positiveInt(item.lessonNo, '课次', MAX_BIG_UNIT_LESSONS),
    grade: parseGrade(item.grade),
    maleCount: optionalCount(item.maleCount),
    femaleCount: optionalCount(item.femaleCount),
    lessonMinutes: lessonMinutes(item.lessonMinutes),
    objectives: parseObjectives(item.objectives),
    content: cleanText(item.content),
    safetyPlan: cleanText(item.safetyPlan),
    keyPoint: cleanText(item.keyPoint),
    difficulty: cleanText(item.difficulty),
    flow: cleanText(item.flow),
    segments: parseSegments(item.segments),
    load: parseLoad(item.load),
    venueEquipment: cleanText(item.venueEquipment),
    reflection: cleanText(item.reflection)
  }
}

export function parseTeachingDesign(entry: unknown): TeachingDesign {
  const item = record(entry, '教学设计')
  if (item.kind === 'bigUnit') {
    return parseBigUnit(item)
  }
  if (item.kind === 'unit') {
    return parseUnit(item)
  }
  if (item.kind === 'lesson') {
    return parseLesson(item)
  }
  throw new Error('教学设计类型不正确')
}

const KIND_ORDER: Record<TeachingDesign['kind'], number> = { bigUnit: 0, unit: 1, lesson: 2 }

export function parseTeachingDesigns(input: unknown): TeachingDesign[] {
  if (!Array.isArray(input)) {
    throw new Error('教学设计数据格式不正确')
  }
  const items = input.map((entry) => parseTeachingDesign(entry))
  const ids = new Set<string>()
  for (const item of items) {
    if (ids.has(item.id)) {
      throw new Error('教学设计 ID 不能重复')
    }
    ids.add(item.id)
  }
  return items.sort(
    (a, b) =>
      KIND_ORDER[a.kind] - KIND_ORDER[b.kind] ||
      sortKey(a) - sortKey(b) ||
      a.createdAt.localeCompare(b.createdAt) ||
      a.id.localeCompare(b.id)
  )
}

function sortKey(item: TeachingDesign): number {
  if (item.kind === 'unit') {
    return item.order
  }
  if (item.kind === 'lesson') {
    return item.lessonNo ?? Number.MAX_SAFE_INTEGER
  }
  return 0
}

export function unitsOfBigUnit(items: ReadonlyArray<TeachingDesign>, bigUnitId: string): UnitDesign[] {
  return items
    .filter((item): item is UnitDesign => item.kind === 'unit' && item.bigUnitId === bigUnitId)
    .sort((a, b) => a.order - b.order)
}

export function lessonsOfBigUnit(items: ReadonlyArray<TeachingDesign>, bigUnitId: string): LessonDesign[] {
  return items
    .filter((item): item is LessonDesign => item.kind === 'lesson' && item.bigUnitId === bigUnitId)
    .sort((a, b) => (a.lessonNo ?? Number.MAX_SAFE_INTEGER) - (b.lessonNo ?? Number.MAX_SAFE_INTEGER))
}

export function lessonsOfUnit(items: ReadonlyArray<TeachingDesign>, unitId: string): LessonDesign[] {
  return items
    .filter((item): item is LessonDesign => item.kind === 'lesson' && item.unitId === unitId)
    .sort((a, b) => (a.lessonNo ?? Number.MAX_SAFE_INTEGER) - (b.lessonNo ?? Number.MAX_SAFE_INTEGER))
}

/** 删除大单元时一并删除其单元与课时教案，避免留下悬空引用。 */
export function removeBigUnitCascade(items: ReadonlyArray<TeachingDesign>, bigUnitId: string): TeachingDesign[] {
  return items.filter((item) => {
    if (item.id === bigUnitId) {
      return false
    }
    if (item.kind === 'unit' && item.bigUnitId === bigUnitId) {
      return false
    }
    if (item.kind === 'lesson' && item.bigUnitId === bigUnitId) {
      return false
    }
    return true
  })
}

/** 删除单元时保留课时教案，只解除其单元归属。 */
export function removeUnitKeepLessons(items: ReadonlyArray<TeachingDesign>, unitId: string, nowIso: string): TeachingDesign[] {
  return items
    .filter((item) => item.id !== unitId)
    .map((item) => (item.kind === 'lesson' && item.unitId === unitId ? { ...item, unitId: null, updatedAt: nowIso } : item))
}

export function emptyObjectives(): CompetencyObjectives {
  return { sportAbility: '', healthBehavior: '', sportsMorality: '' }
}

export function emptyLoad(): LessonLoad {
  return { groupDensityPct: null, individualDensityPct: null, avgHeartRate: null, peakHeartRate: null, fitnessMinutes: null, note: '' }
}

/** 复制课时教案（例如平行班复用），生成新 ID，保留内容。 */
export function copyLessonDesign(lesson: LessonDesign, nowIso: string): LessonDesign {
  return {
    ...lesson,
    id: createTeachingDesignId(),
    title: `${lesson.title} 副本`,
    generation: lesson.generation ? { ...lesson.generation } : null,
    objectives: { ...lesson.objectives },
    segments: lesson.segments.map((segment) => ({ ...segment })),
    load: { ...lesson.load },
    createdAt: nowIso,
    updatedAt: nowIso
  }
}
