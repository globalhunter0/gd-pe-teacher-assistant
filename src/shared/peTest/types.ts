import type { Grade } from '../class/types'
import type { StudentGender } from '../student/types'

export type TestValueType = 'number' | 'time'

export type TimeInputMode = 'seconds' | 'minutesSeconds'

export type TestUnit = 's' | 'cm' | 'm' | 'ml' | 'kg' | 'times' | 'score' | 'other'

export type TestDirection = 'higherBetter' | 'lowerBetter' | 'neutral'

export type TestGenderRule = 'all' | 'male' | 'female'

export type TestCategory = 'body' | 'speed' | 'endurance' | 'strength' | 'flexibility' | 'other'

export type TestRecordStatus = 'pending' | 'valid' | 'absent' | 'exempt' | 'invalid'

export type PeTestImportSource = 'manual' | 'exam-batch'

export interface TestItem {
  id: string
  builtinKey: string | null
  name: string
  category: TestCategory
  valueType: TestValueType
  timeInputMode: TimeInputMode
  unit: TestUnit
  customUnitLabel: string
  direction: TestDirection
  genderRule: TestGenderRule
  decimalPlaces: number
  minValue: number | null
  maxValue: number | null
  isBuiltin: boolean
  isActive: boolean
  notes: string
  createdAt: string
  updatedAt: string
}

export interface PETestRecord {
  id: string
  testSessionId: string
  studentId: string
  nameSnapshot: string
  studentNoSnapshot: string
  genderSnapshot: StudentGender
  rawValue: number | null
  status: TestRecordStatus
  note: string
  createdAt: string
  updatedAt: string
  /** 中考换算分快照；日常手工测试为 null。缺省字段按 null 读取。 */
  examScore: number | null
  /** Excel 原始单元格文本，例如 3:39 或 缺考。 */
  rawOriginal: string
  examItemId: string | null
}

export interface PETestSession {
  id: string
  classId: string
  testItemId: string
  date: string
  title: string
  notes: string
  classNameSnapshot: string
  gradeSnapshot: Grade
  testItemNameSnapshot: string
  unitSnapshot: TestUnit
  customUnitLabelSnapshot: string
  directionSnapshot: TestDirection
  valueTypeSnapshot: TestValueType
  timeInputModeSnapshot: TimeInputMode
  createdAt: string
  updatedAt: string
  records: PETestRecord[]
  /** 缺省为手工录入，老 JSON 无此字段时按 manual。 */
  importSource: PeTestImportSource
  examStandardId: string | null
  scoringCitySnapshot: string
  scoringVersionSnapshot: string
}

export const TEST_VALUE_TYPES: TestValueType[] = ['number', 'time']
export const TIME_INPUT_MODES: TimeInputMode[] = ['seconds', 'minutesSeconds']
export const TEST_UNITS: TestUnit[] = ['s', 'cm', 'm', 'ml', 'kg', 'times', 'score', 'other']
export const TEST_DIRECTIONS: TestDirection[] = ['higherBetter', 'lowerBetter', 'neutral']
export const TEST_GENDER_RULES: TestGenderRule[] = ['all', 'male', 'female']
export const TEST_CATEGORIES: TestCategory[] = ['body', 'speed', 'endurance', 'strength', 'flexibility', 'other']
export const TEST_RECORD_STATUSES: TestRecordStatus[] = ['pending', 'valid', 'absent', 'exempt', 'invalid']

export const TEST_UNIT_LABELS: Record<TestUnit, string> = {
  s: '秒',
  cm: '厘米',
  m: '米',
  ml: '毫升',
  kg: '千克',
  times: '次',
  score: '分',
  other: '其他'
}

export const TEST_CATEGORY_LABELS: Record<TestCategory, string> = {
  body: '身体形态',
  speed: '速度',
  endurance: '耐力',
  strength: '力量',
  flexibility: '柔韧',
  other: '其他'
}

export const TEST_DIRECTION_LABELS: Record<TestDirection, string> = {
  higherBetter: '越高越好',
  lowerBetter: '越低越好',
  neutral: '中性'
}

export const TEST_GENDER_RULE_LABELS: Record<TestGenderRule, string> = {
  all: '不限',
  male: '仅男生',
  female: '仅女生'
}

export const TEST_RECORD_STATUS_LABELS: Record<TestRecordStatus, string> = {
  pending: '未录入',
  valid: '有效',
  absent: '缺测',
  exempt: '免测',
  invalid: '无效'
}

export const TEST_VALUE_TYPE_LABELS: Record<TestValueType, string> = {
  number: '数值',
  time: '时间'
}

export const TIME_INPUT_MODE_LABELS: Record<TimeInputMode, string> = {
  seconds: '按秒（如 8.32）',
  minutesSeconds: '按分秒（如 3.42 = 3分42秒）'
}

export function testUnitDisplay(unit: TestUnit, customUnitLabel: string): string {
  if (unit === 'other') {
    return customUnitLabel
  }

  return TEST_UNIT_LABELS[unit]
}
