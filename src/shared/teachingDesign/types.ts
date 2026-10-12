import type { Grade, Semester } from '../class/types'
import type { ContentCategoryId, LessonPartId } from '../curriculum/types'

export type TeachingDesignKind = 'bigUnit' | 'unit' | 'lesson'

/** 三维学习目标，对应课标核心素养：运动能力、健康行为、体育品德。 */
export interface CompetencyObjectives {
  sportAbility: string
  healthBehavior: string
  sportsMorality: string
}

export interface GenerationMeta {
  provider: string
  model: string
  generatedAt: string
}

interface TeachingDesignBase {
  id: string
  kind: TeachingDesignKind
  title: string
  notes: string
  generation: GenerationMeta | null
  createdAt: string
  updatedAt: string
}

export interface UnitOutlineItem {
  title: string
  lessonFrom: number
  lessonTo: number
  focus: string
}

/** 大单元教学计划（高中为“模块教学计划”）。 */
export interface BigUnitDesign extends TeachingDesignBase {
  kind: 'bigUnit'
  grade: Grade
  academicYear: string
  semester: Semester
  editionId: string | null
  categoryId: ContentCategoryId
  sportItem: string
  totalLessons: number
  lessonMinutes: number
  teachingPlanId: string | null
  materialResourceIds: string[]
  guidingIdeas: string
  learnerAnalysis: string
  contentAnalysis: string
  objectives: CompetencyObjectives
  keyPoints: string
  difficulties: string
  unitOutline: UnitOutlineItem[]
  assessment: string
  safety: string
}

export interface LessonScheduleItem {
  lessonNo: number
  topic: string
  content: string
  practiceAndCompetition: string
  assessment: string
}

export interface UnitDesign extends TeachingDesignBase {
  kind: 'unit'
  bigUnitId: string
  order: number
  lessonFrom: number
  lessonTo: number
  objectives: CompetencyObjectives
  keyPoints: string
  difficulties: string
  lessonSchedule: LessonScheduleItem[]
  assessment: string
}

export interface LessonSegment {
  part: LessonPartId
  minutes: number
  goal: string
  content: string
  teacherActivities: string
  studentActivities: string
  organization: string
  requirements: string
}

export interface LessonLoad {
  groupDensityPct: number | null
  individualDensityPct: number | null
  avgHeartRate: number | null
  peakHeartRate: number | null
  fitnessMinutes: number | null
  note: string
}

/** 课时教案，字段对应广州市统一课时教案模板。 */
export interface LessonDesign extends TeachingDesignBase {
  kind: 'lesson'
  bigUnitId: string | null
  unitId: string | null
  lessonNo: number | null
  grade: Grade
  maleCount: number | null
  femaleCount: number | null
  lessonMinutes: number
  objectives: CompetencyObjectives
  content: string
  safetyPlan: string
  keyPoint: string
  difficulty: string
  flow: string
  segments: LessonSegment[]
  load: LessonLoad
  venueEquipment: string
  reflection: string
}

export type TeachingDesign = BigUnitDesign | UnitDesign | LessonDesign

export type ComplianceSeverity = 'error' | 'warning'

export interface ComplianceIssue {
  severity: ComplianceSeverity
  field: string
  message: string
}
