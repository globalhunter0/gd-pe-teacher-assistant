import type { ExamGender } from '../examStandard/types'

const MALE = new Set(['男', '男性', 'm', 'male'])
const FEMALE = new Set(['女', '女性', 'f', 'female'])

export function parseExamBatchGender(raw: string): Exclude<ExamGender, 'all'> | null {
  const value = raw.replace(/\u3000/g, ' ').trim()
  if (value === '') {
    return null
  }

  const lowered = value.toLowerCase()
  if (MALE.has(value) || MALE.has(lowered)) {
    return 'male'
  }
  if (FEMALE.has(value) || FEMALE.has(lowered)) {
    return 'female'
  }

  return null
}
