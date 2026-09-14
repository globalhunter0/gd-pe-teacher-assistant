import { listBuiltinExamStandards } from '../examStandard/catalog'
import { standardAllowsOfficialConvert } from '../examStandard/score'
import type { ExamStandard } from '../examStandard/types'
import { NATIONAL_FITNESS_2014_ID, getNationalFitness2014, isNationalFitnessStandardId } from '../nationalFitness/catalog'
import { nationalFitnessBelowOfficialMinimumMessage } from '../nationalFitness/scoring/types'
import type { PETestRecord, PETestSession } from './types'

export const CLASSROOM_NATIONAL_FITNESS_STANDARD_ID = NATIONAL_FITNESS_2014_ID

export const CLASSROOM_NATIONAL_FITNESS_LABEL = '国家学生体质健康标准（2014年修订）'

export interface ClassroomScoringOption {
  id: string
  label: string
  group: 'raw' | 'national-fitness' | 'middle_school_exam' | 'gaokao_sports'
}

export function emptyClassroomScoreFields(): {
  examScore: null
  examItemId: null
  baseScore: null
  bonusScore: null
  scoreOutcome: null
  officialMinimumScore: null
} {
  return {
    examScore: null,
    examItemId: null,
    baseScore: null,
    bonusScore: null,
    scoreOutcome: null,
    officialMinimumScore: null
  }
}

export function listClassroomScoringOptions(standards: ReadonlyArray<ExamStandard> = listBuiltinExamStandards()): ClassroomScoringOption[] {
  const examOptions = standards
    .filter((item) => standardAllowsOfficialConvert(item))
    .map((item) => ({
      id: item.id,
      label:
        item.examType === 'gaokao_sports'
          ? `体育高考 · ${item.policyLabel}`
          : `体育中考 · ${item.cityName} ${item.policyLabel}`,
      group: item.examType === 'gaokao_sports' ? ('gaokao_sports' as const) : ('middle_school_exam' as const)
    }))
  return [
    { id: '', label: '仅记录原始成绩', group: 'raw' },
    { id: CLASSROOM_NATIONAL_FITNESS_STANDARD_ID, label: CLASSROOM_NATIONAL_FITNESS_LABEL, group: 'national-fitness' },
    ...examOptions
  ]
}

export function classroomScoringSnapshots(
  examStandardId: string | null,
  standards: ReadonlyArray<ExamStandard> = listBuiltinExamStandards()
): { scoringCitySnapshot: string; scoringVersionSnapshot: string } {
  if (!examStandardId) {
    return { scoringCitySnapshot: '', scoringVersionSnapshot: '' }
  }
  if (isNationalFitnessStandardId(examStandardId)) {
    const meta = getNationalFitness2014()
    return { scoringCitySnapshot: '国家', scoringVersionSnapshot: meta.standardName }
  }
  const found = standards.find((item) => item.id === examStandardId)
  return {
    scoringCitySnapshot: found?.cityName ?? '',
    scoringVersionSnapshot: found?.policyLabel ?? ''
  }
}

export function classroomScoringLabel(session: Pick<PETestSession, 'examStandardId' | 'scoringCitySnapshot' | 'scoringVersionSnapshot'>): string {
  if (session.examStandardId && isNationalFitnessStandardId(session.examStandardId)) {
    return CLASSROOM_NATIONAL_FITNESS_LABEL
  }
  const city = session.scoringCitySnapshot.trim()
  const version = session.scoringVersionSnapshot.trim()
  if (city || version) {
    return [city, version].filter(Boolean).join(' ')
  }
  if (!session.examStandardId) {
    return '仅记录原始成绩'
  }
  const found = listBuiltinExamStandards().find((item) => item.id === session.examStandardId)
  return found ? `${found.cityName} ${found.policyLabel}` : '未指定评分标准'
}

export function formatPeTestItemScoreText(
  record: Pick<PETestRecord, 'examScore' | 'baseScore' | 'bonusScore' | 'scoreOutcome' | 'officialMinimumScore'> & {
    status?: PETestRecord['status']
  }
): string {
  if (record.scoreOutcome === 'below_official_minimum') {
    return nationalFitnessBelowOfficialMinimumMessage(record.officialMinimumScore ?? 10)
  }
  if (record.examScore === null || record.examScore === undefined) {
    return record.status === 'valid' ? '未评分' : '—'
  }
  const bonus = record.bonusScore ?? 0
  const base = record.baseScore ?? record.examScore
  if (bonus > 0) {
    return `${base} + ${bonus} = ${record.examScore}`
  }
  return Number.isInteger(record.examScore) ? String(record.examScore) : record.examScore.toFixed(2)
}

export function isBelowOfficialMinimumRecord(record: Pick<PETestRecord, 'scoreOutcome'>): boolean {
  return record.scoreOutcome === 'below_official_minimum'
}

export function countBelowOfficialMinimum(
  records: ReadonlyArray<Pick<PETestRecord, 'scoreOutcome'>>
): number {
  return records.filter(isBelowOfficialMinimumRecord).length
}

export function applyClassroomScoringBasis(
  session: PETestSession,
  examStandardId: string | null
): PETestSession {
  return {
    ...session,
    examStandardId,
    ...classroomScoringSnapshots(examStandardId)
  }
}
