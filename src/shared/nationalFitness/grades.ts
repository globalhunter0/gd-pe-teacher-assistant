import {
  GRADE_LABELS,
  GRADE_STAGE,
  GRADES,
  JUNIOR_GRADES,
  PRIMARY_GRADES,
  SENIOR_GRADES,
  type Grade,
  type SchoolStage
} from '../class/types'

export const NATIONAL_FITNESS_JUNIOR_STAGE = 'junior' as const

export const NATIONAL_FITNESS_STAGE_LABELS: Record<SchoolStage, string> = {
  primary: '小学',
  junior: '初中',
  senior: '高中'
}

export const NATIONAL_GRADE_LABELS: Record<Grade, string> = {
  一年级: '一年级',
  二年级: '二年级',
  三年级: '三年级',
  四年级: '四年级',
  五年级: '五年级',
  六年级: '六年级',
  初一: '七年级',
  初二: '八年级',
  初三: '九年级',
  高一: '高一',
  高二: '高二',
  高三: '高三'
}

export const JUNIOR_GRADE_NATIONAL_LABELS: Record<'初一' | '初二' | '初三', string> = {
  初一: '七年级',
  初二: '八年级',
  初三: '九年级'
}

export const JUNIOR_GRADE_OPTIONS: Array<{ grade: Grade; nationalLabel: string }> = JUNIOR_GRADES.map((grade) => ({
  grade,
  nationalLabel: NATIONAL_GRADE_LABELS[grade]
}))

export const NATIONAL_FITNESS_STAGE_OPTIONS: Array<{ stage: SchoolStage; label: string; grades: Grade[] }> = [
  { stage: 'primary', label: NATIONAL_FITNESS_STAGE_LABELS.primary, grades: PRIMARY_GRADES },
  { stage: 'junior', label: NATIONAL_FITNESS_STAGE_LABELS.junior, grades: JUNIOR_GRADES },
  { stage: 'senior', label: NATIONAL_FITNESS_STAGE_LABELS.senior, grades: SENIOR_GRADES }
]

export function nationalLabelForGrade(grade: Grade): string {
  return NATIONAL_GRADE_LABELS[grade]
}

export function stageForGrade(grade: Grade): SchoolStage {
  return GRADE_STAGE[grade]
}

export function gradesForStage(stage: SchoolStage): Grade[] {
  if (stage === 'primary') {
    return PRIMARY_GRADES
  }
  if (stage === 'senior') {
    return SENIOR_GRADES
  }
  return JUNIOR_GRADES
}

export function gradeKeyFromSnapshot(gradeSnapshot: Grade): Grade {
  return gradeSnapshot
}

const LABEL_TO_GRADE: Record<string, Grade> = {
  ...Object.fromEntries(GRADES.map((grade) => [grade, grade])),
  ...Object.fromEntries(GRADES.map((grade) => [GRADE_LABELS[grade], grade])),
  ...Object.fromEntries(GRADES.map((grade) => [NATIONAL_GRADE_LABELS[grade], grade])),
  七年级: '初一',
  八年级: '初二',
  九年级: '初三'
}

export function parseJuniorGradeInput(value: string): Grade | null {
  const grade = LABEL_TO_GRADE[value.trim()]
  if (!grade || !JUNIOR_GRADES.includes(grade)) {
    return null
  }
  return grade
}

export function parseNationalFitnessGradeInput(value: string): Grade | null {
  return LABEL_TO_GRADE[value.trim()] ?? null
}

export function isJuniorGrade(grade: Grade): boolean {
  return JUNIOR_GRADES.includes(grade)
}

export function isPrimaryGrade(grade: Grade): boolean {
  return PRIMARY_GRADES.includes(grade)
}

export function isSeniorGrade(grade: Grade): boolean {
  return SENIOR_GRADES.includes(grade)
}

export function isNationalFitnessGrade(grade: Grade): boolean {
  return GRADES.includes(grade)
}
