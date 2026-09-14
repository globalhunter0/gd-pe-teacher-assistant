import { NATIONAL_FITNESS_SCORE_MODEL } from '../types'

export function capNationalFitnessYearTotals(input: { standardScore: number; bonusScore: number }): {
  standardScore: number
  bonusScore: number
  totalScore: number
} {
  const standardScore = Math.min(NATIONAL_FITNESS_SCORE_MODEL.standardScoreFullMark, Math.max(0, input.standardScore))
  const bonusScore = Math.min(NATIONAL_FITNESS_SCORE_MODEL.additionalScoreFullMark, Math.max(0, input.bonusScore))
  return {
    standardScore,
    bonusScore,
    totalScore: Math.min(NATIONAL_FITNESS_SCORE_MODEL.yearTotalFullMark, standardScore + bonusScore)
  }
}
