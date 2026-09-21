import type { TestDirection, TestRecordStatus } from './types'

/** 学生历史成绩展示用状态（中文业务字段，非内部枚举）。 */
export type PeTestHistoryStatusLabel = '已测' | '未测' | '缺考' | '免考' | '异常'

export function peTestHistoryStatusLabel(status: TestRecordStatus): PeTestHistoryStatusLabel {
  if (status === 'pending') {
    return '未测'
  }
  if (status === 'absent') {
    return '缺考'
  }
  if (status === 'exempt') {
    return '免考'
  }
  if (status === 'invalid') {
    return '异常'
  }
  return '已测'
}

/** 成绩方向：复用 TestItem / session 快照，禁止在 UI 里散落判断。 */
export function getResultDirection(
  source: { direction?: TestDirection; directionSnapshot?: TestDirection } | null | undefined
): TestDirection {
  if (source?.direction === 'higherBetter' || source?.direction === 'lowerBetter' || source?.direction === 'neutral') {
    return source.direction
  }
  if (
    source?.directionSnapshot === 'higherBetter' ||
    source?.directionSnapshot === 'lowerBetter' ||
    source?.directionSnapshot === 'neutral'
  ) {
    return source.directionSnapshot
  }
  return 'neutral'
}

export function isValidPeTestHistoryResult(status: TestRecordStatus, rawValue: number | null): boolean {
  return status === 'valid' && rawValue !== null
}
