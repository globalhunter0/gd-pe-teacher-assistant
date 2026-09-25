import type { TestUnit } from '../types'

/** 把日常测试存储单位换算成考试评分表单位。不复制评分表。 */
export function convertPeTestRawToExamRaw(testUnit: TestUnit, examUnit: TestUnit, rawValue: number): number {
  if (testUnit === examUnit) {
    return rawValue
  }
  if (testUnit === 'cm' && examUnit === 'm') {
    return Number((rawValue / 100).toPrecision(15))
  }
  if (testUnit === 'm' && examUnit === 'cm') {
    return Number((rawValue * 100).toPrecision(15))
  }
  throw new Error('评分单位与测试项目不兼容')
}
