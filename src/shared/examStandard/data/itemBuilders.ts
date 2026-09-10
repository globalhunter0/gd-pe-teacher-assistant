import type { ExamItemDefinition, ScoreRule } from '../types'

export function examItem(
  rest: Omit<ExamItemDefinition, 'customUnitLabel' | 'requirement' | 'maxScore' | 'verification'> & {
    maxScore?: number
    requirement?: ExamItemDefinition['requirement']
    customUnitLabel?: string
    verification?: ExamItemDefinition['verification']
  }
): ExamItemDefinition {
  const { customUnitLabel, requirement, maxScore, verification, ...fields } = rest
  const inferred =
    rest.scoreRule.kind === 'unsupported'
      ? 'verified_unsupported'
      : rest.scoreRule.kind === 'thresholdTable' && rest.scoreRule.entries.length > 0
        ? 'verified_supported'
        : 'unverified'
  return {
    ...fields,
    customUnitLabel: customUnitLabel ?? '',
    requirement: requirement ?? 'grouped',
    maxScore: maxScore ?? 100,
    verification: verification ?? inferred
  }
}

export function timeExamItem(
  rest: Omit<
    ExamItemDefinition,
    'customUnitLabel' | 'requirement' | 'maxScore' | 'valueType' | 'unit' | 'direction' | 'scoreRule' | 'verification'
  > & {
    scoreRule: ScoreRule
    timeInputMode: ExamItemDefinition['timeInputMode']
    decimalPlaces: number
    maxScore?: number
    requirement?: ExamItemDefinition['requirement']
    verification?: ExamItemDefinition['verification']
  }
): ExamItemDefinition {
  return examItem({
    valueType: 'time',
    unit: 's',
    direction: 'lowerBetter',
    ...rest
  })
}

export function distanceExamItem(
  rest: Omit<
    ExamItemDefinition,
    'customUnitLabel' | 'requirement' | 'maxScore' | 'valueType' | 'unit' | 'direction' | 'timeInputMode' | 'verification'
  > & {
    scoreRule: ScoreRule
    decimalPlaces: number
    maxScore?: number
    requirement?: ExamItemDefinition['requirement']
    verification?: ExamItemDefinition['verification']
  }
): ExamItemDefinition {
  return examItem({
    valueType: 'number',
    timeInputMode: 'seconds',
    unit: 'm',
    direction: 'higherBetter',
    ...rest
  })
}

export function countExamItem(
  rest: Omit<
    ExamItemDefinition,
    'customUnitLabel' | 'requirement' | 'maxScore' | 'valueType' | 'unit' | 'direction' | 'timeInputMode' | 'decimalPlaces' | 'verification'
  > & {
    scoreRule: ScoreRule
    maxScore?: number
    requirement?: ExamItemDefinition['requirement']
    verification?: ExamItemDefinition['verification']
    unit?: ExamItemDefinition['unit']
    customUnitLabel?: string
  }
): ExamItemDefinition {
  return examItem({
    ...rest,
    valueType: 'number',
    timeInputMode: 'seconds',
    unit: rest.unit ?? 'times',
    direction: 'higherBetter',
    decimalPlaces: 0
  })
}

export function skillExamItem(
  rest: Omit<ExamItemDefinition, 'customUnitLabel' | 'requirement' | 'maxScore' | 'verification' | 'scoreRule'> & {
    scoreRule?: ScoreRule
    maxScore?: number
    requirement?: ExamItemDefinition['requirement']
    verification?: ExamItemDefinition['verification']
    reason: string
  }
): ExamItemDefinition {
  const { reason, scoreRule, ...fields } = rest
  return examItem({
    ...fields,
    scoreRule: scoreRule ?? {
      kind: 'unsupported',
      reason,
      maxScore: rest.maxScore ?? 100,
      minScore: 0
    }
  })
}

export function pendingOfficialTableRule(reason: string, maxScore: number): ScoreRule {
  return {
    kind: 'unsupported',
    reason,
    maxScore,
    minScore: 0
  }
}
