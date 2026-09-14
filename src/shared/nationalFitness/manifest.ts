import { GRADES, type Grade } from '../class/types'
import type { ExamGender } from '../examStandard/types'
import { listNationalFitnessEvaluationItems } from './apply'
import { NATIONAL_FITNESS_2014_ID, getNationalFitness2014 } from './catalog'
import { stageForGrade } from './grades'
import type { NationalFitnessDirection, NationalFitnessTableStatus } from './types'

export interface NationalFitnessScoreTableManifestEntry {
  standardId: string
  standardName: string
  version: string
  schoolStage: 'primary' | 'junior' | 'senior'
  grade: Grade
  gender: Exclude<ExamGender, 'all'>
  itemKey: string
  testItemId: string | null
  unit: string
  direction: NationalFitnessDirection
  weight: number
  isBonusItem: boolean
  scoreTableStatus: Extract<NationalFitnessTableStatus, 'missing' | 'pending-verification'>
}

export function buildNationalFitnessScoreTableManifest(): NationalFitnessScoreTableManifestEntry[] {
  const meta = getNationalFitness2014()
  const entries: NationalFitnessScoreTableManifestEntry[] = []
  for (const grade of GRADES) {
    for (const gender of ['male', 'female'] as const) {
      for (const item of listNationalFitnessEvaluationItems(grade, gender)) {
        entries.push({
          standardId: NATIONAL_FITNESS_2014_ID,
          standardName: meta.standardName,
          version: meta.version,
          schoolStage: stageForGrade(grade),
          grade,
          gender,
          itemKey: item.itemKey,
          testItemId: item.testItemId,
          unit: item.unitLabel,
          direction: item.direction,
          weight: item.weightPercent ?? 0,
          isBonusItem: item.bonusApplicable,
          scoreTableStatus: 'pending-verification'
        })
      }
    }
  }
  return entries
}
