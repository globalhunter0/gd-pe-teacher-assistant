import type { Grade, SchoolStage } from '../class/types'

export type CurriculumStage = 'compulsory' | 'senior'

/** 义务教育课标的四级水平目标；高中按模块与学业质量水平组织。 */
export type CurriculumLevel = 'level1' | 'level2' | 'level3' | 'level4' | 'senior'

export type ContentCategoryId =
  | 'basic-motor'
  | 'fitness'
  | 'health'
  | 'ball'
  | 'track-field'
  | 'gymnastics'
  | 'water-ice'
  | 'traditional'
  | 'emerging'
  | 'interdisciplinary'

export interface ContentCategory {
  id: ContentCategoryId
  name: string
  /** 是否属于专项运动技能（六类之一）。 */
  specialized: boolean
  levels: CurriculumLevel[]
  items: string[]
}

export interface SourceDocument {
  title: string
  issuer: string
  url: string
}

export interface TextbookEdition {
  id: string
  stage: CurriculumStage
  /** 常用简称，如“人教版”。 */
  shortName: string
  publisher: string
  compiler: string
  chiefEditors: string[]
  studentBooks: string[]
  teacherBooks: string[]
  schoolSystem: '六三学制' | '五四学制'
  source: SourceDocument
}

export interface LessonPartDefinition {
  part: LessonPartId
  label: string
}

export type LessonPartId = 'opening' | 'warmup' | 'main' | 'closing'

export interface LoadRequirement {
  groupDensityMinPct: number
  individualDensityMinPct: number
  heartRateMin: number
  heartRateMax: number
  fitnessMinutesTarget: number
}

export interface StageRule {
  stage: CurriculumStage
  standard: SourceDocument
  load: LoadRequirement
  /** 大单元（义务教育）或模块（高中）的最少课时。 */
  minUnitLessons: number
  coreCompetencies: readonly ['运动能力', '健康行为', '体育品德']
  lessonPlanElements: string[]
  principles: string[]
}

export type GradeStageMap = Record<Grade, SchoolStage>
