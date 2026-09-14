import { GRADES } from '../class/types'
import { NATIONAL_FITNESS_ITEM_SPECS } from './items'
import type { NationalFitnessStandardMetadata } from './types'
import { NATIONAL_STUDENT_FITNESS_FAMILY } from './types'

export const NATIONAL_FITNESS_2014_ID = 'cn-national-student-fitness-2014'

export const NATIONAL_STUDENT_FITNESS_2014: NationalFitnessStandardMetadata = {
  id: NATIONAL_FITNESS_2014_ID,
  family: NATIONAL_STUDENT_FITNESS_FAMILY,
  standardName: '国家学生体质健康标准（2014年修订）',
  version: '2014年修订',
  authority: '教育部',
  sourceDocument: '教育部关于印发《国家学生体质健康标准（2014年修订）》的通知（教体艺〔2014〕5号）',
  sourceUrl: null,
  publishedAt: '2014-07-07',
  effectiveFrom: '2014',
  effectiveTo: null,
  status: 'not_catalogued',
  scoreTableStatus: 'missing',
  stages: ['primary', 'junior', 'senior'],
  intendedGrades: [...GRADES],
  intendedGenders: ['male', 'female'],
  intendedItems: NATIONAL_FITNESS_ITEM_SPECS,
  scoreTables: [],
  bonusTables: [],
  weights: [],
  notes:
    '本目录登记《国家学生体质健康标准（2014年修订）》小学至高中 12 年级项目适用、官方权重与附加分结构。基础单项评分表已按教体艺〔2014〕5号表1-1至表1-16核验录入；附加分换算表尚未录入。禁止混入 2007 版或更早结构，禁止套用体育中考/体育高考评分表。历史成绩必须使用测试当时的年级快照（gradeSnapshot）。'
}

export function listNationalFitnessCatalog(): NationalFitnessStandardMetadata[] {
  return [NATIONAL_STUDENT_FITNESS_2014]
}

export function getNationalFitness2014(): NationalFitnessStandardMetadata {
  return NATIONAL_STUDENT_FITNESS_2014
}

export function nationalFitnessAllowsOfficialConvert(_standardId?: string): false {
  return false
}

export function isNationalFitnessStandardId(id: string): boolean {
  return id === NATIONAL_FITNESS_2014_ID
}
