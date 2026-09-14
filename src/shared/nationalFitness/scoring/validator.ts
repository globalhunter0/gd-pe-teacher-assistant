import { coverageRowsFor } from '../coverage'
import { findNationalFitnessItemSpec } from '../items'
import { NATIONAL_FITNESS_2014_ID } from '../catalog'
import { rangesOverlap } from './match'
import type { NationalFitnessScoreTable } from './types'

export interface NationalFitnessScoreTableIssue {
  tableId: string
  code: string
  message: string
}

function sameNumber(left: number, right: number): boolean {
  return Math.abs(left - right) < 1e-9
}

export function validateNationalFitnessScoreTable(table: NationalFitnessScoreTable): NationalFitnessScoreTableIssue[] {
  const issues: NationalFitnessScoreTableIssue[] = []
  const push = (code: string, message: string): void => {
    issues.push({ tableId: table.id, code, message })
  }

  if (table.standardId !== NATIONAL_FITNESS_2014_ID) {
    push('STANDARD', '评分表必须属于《国家学生体质健康标准（2014年修订）》')
  }
  if (table.verificationStatus === 'verified' && !table.source) {
    push('SOURCE', 'verified 评分表必须带来源')
  }
  if (table.verificationStatus === 'verified' && table.source) {
    if (!table.source.documentNo || !table.source.tableNo || !table.source.tableName) {
      push('SOURCE', 'verified 评分表必须标明文号、表号与表名')
    }
    if (table.source.grade !== table.grade || table.source.gender !== table.gender || table.source.itemId !== table.itemId) {
      push('SOURCE', 'sourceReference 年级/性别/项目必须与评分表一致')
    }
  }
  if (table.verificationStatus === 'pending' && table.source === undefined) {
    push('SOURCE', '评分表必须标记来源或显式为 null')
  }
  if (!table.source && table.verificationStatus === 'verified') {
    push('SOURCE', '已核验数据不能没有来源')
  }

  const spec = findNationalFitnessItemSpec(table.itemId)
  if (!spec) {
    push('ITEM', `未知项目 ${table.itemId}`)
  } else {
    if (spec.unit !== table.unit && !(spec.itemKey === 'bmi' && table.unit === 'other')) {
      push('UNIT', `${table.itemId} 单位与 catalog 不一致`)
    }
    if (table.valueKind === 'time' && spec.valueType !== 'time') {
      push('TIME', `${table.itemId} 不是时间项目，不能按秒评分`)
    }
    if (table.valueKind === 'time' && table.unit !== 's') {
      push('TIME', '时间项目内部单位必须是秒')
    }
    if (table.ruleKind === 'higherBetter' && spec.direction !== 'higherBetter' && spec.direction !== 'derived') {
      push('DIRECTION', `${table.itemId} 方向应为 higherBetter`)
    }
    if (table.ruleKind === 'lowerBetter' && spec.direction !== 'lowerBetter') {
      push('DIRECTION', `${table.itemId} 方向应为 lowerBetter`)
    }
    if (table.ruleKind === 'range' && spec.itemKey !== 'bmi' && spec.direction !== 'derived' && spec.direction !== 'neutral') {
      push('DIRECTION', 'RANGE 仅用于 BMI 等区间评价，不得套到速度/耐力阈值表')
    }
  }

  const coverage = coverageRowsFor(table.grade).filter((row) => row.itemKey === table.itemId)
  if (coverage.length === 0) {
    push('GRADE', `${table.grade} 不包含项目 ${table.itemId}`)
  } else if (!coverage.some((row) => row.gender === 'all' || row.gender === table.gender)) {
    push('GENDER', `${table.grade} ${table.gender} 不适用 ${table.itemId}`)
  }

  if (table.ruleKind === 'range') {
    if (table.rangeEntries.length === 0) {
      push('EMPTY', 'RANGE 表不能为空')
    }
    for (let index = 0; index < table.rangeEntries.length; index += 1) {
      const band = table.rangeEntries[index]
      if (band.min !== null && band.max !== null && band.min > band.max) {
        push('ORDER', `RANGE 下限大于上限：${band.min} > ${band.max}`)
      }
      for (let other = index + 1; other < table.rangeEntries.length; other += 1) {
        if (rangesOverlap(band, table.rangeEntries[other])) {
          push('OVERLAP', `RANGE 区间重叠：${band.score} 与 ${table.rangeEntries[other].score}`)
        }
      }
    }
  } else {
    if (table.thresholdEntries.length === 0) {
      push('EMPTY', '阈值表不能为空')
    }
    const thresholds = new Set<number>()
    const scores = new Set<number>()
    for (const entry of table.thresholdEntries) {
      if (!Number.isFinite(entry.threshold) || !Number.isFinite(entry.score)) {
        push('NUMBER', '阈值或分数不是有限数字')
      }
      const key = entry.threshold
      if ([...thresholds].some((item) => sameNumber(item, key))) {
        push('THRESHOLD_DUP', `阈值重复：${entry.threshold}`)
      }
      thresholds.add(entry.threshold)
      if (scores.has(entry.score)) {
        push('SCORE_DUP', `分数重复：${entry.score}`)
      }
      scores.add(entry.score)
    }
    const byScore = [...table.thresholdEntries].sort((a, b) => a.score - b.score)
    for (let index = 1; index < byScore.length; index += 1) {
      const prev = byScore[index - 1]
      const current = byScore[index]
      if (current.score <= prev.score) {
        push('SCORE_ORDER', '分数必须严格递增')
      }
      if (table.ruleKind === 'higherBetter' && current.threshold <= prev.threshold) {
        push('DIRECTION', 'HIGHER_IS_BETTER 时更高分档的阈值必须更大')
      }
      if (table.ruleKind === 'lowerBetter' && current.threshold >= prev.threshold) {
        push('DIRECTION', 'LOWER_IS_BETTER 时更高分档的阈值必须更小')
      }
    }
  }

  return issues
}

export function validateNationalFitnessScoreTables(tables: readonly NationalFitnessScoreTable[]): NationalFitnessScoreTableIssue[] {
  const issues: NationalFitnessScoreTableIssue[] = []
  const ids = new Set<string>()
  const keys = new Set<string>()
  for (const table of tables) {
    if (ids.has(table.id)) {
      issues.push({ tableId: table.id, code: 'ID_DUP', message: '评分表 id 重复' })
    }
    ids.add(table.id)
    const key = `${table.standardId}/${table.grade}/${table.gender}/${table.itemId}`
    if (keys.has(key)) {
      issues.push({ tableId: table.id, code: 'KEY_DUP', message: `定位键重复：${key}` })
    }
    keys.add(key)
    issues.push(...validateNationalFitnessScoreTable(table))
  }
  return issues
}
