import type { ScoreRule, ScoreTableEntry } from '../types'

const BANDS = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 0] as const

/** 江门官方表“分.秒”：3.33=3分33秒，3.4=3分40秒。 */
export function jiangmenDotTimeToSeconds(value: number): number {
  const minutes = Math.trunc(value)
  const seconds = Math.round((value - minutes) * 100 + 1e-8)
  return minutes * 60 + seconds
}

function zip(values: Array<number | null>, convert: (value: number) => number = (value) => value): ScoreTableEntry[] {
  return BANDS.flatMap((score, index) => {
    const value = values[index]
    if (value == null) {
      return []
    }
    return [{ score, threshold: convert(value) }]
  })
}

function stepRule(entries: ScoreTableEntry[]): ScoreRule {
  return {
    kind: 'thresholdTable',
    scoreMode: 'step',
    maxScore: 100,
    minScore: 0,
    entries
  }
}

export const JIANGMEN_MALE_1000M = stepRule(
  zip([3.33, 3.4, 3.47, 3.52, 3.57, 4.02, 4.07, 4.12, 4.17, 4.22, 4.27, 4.32, 4.37, 4.42, 4.47, 4.52, 4.57, 5.02, 5.07, 5.12, 5.17], jiangmenDotTimeToSeconds)
)

export const JIANGMEN_FEMALE_800M = stepRule(
  zip([3.18, 3.25, 3.32, 3.37, 3.42, 3.47, 3.52, 3.57, 4.02, 4.07, 4.12, 4.17, 4.22, 4.27, 4.32, 4.37, 4.42, 4.47, 4.52, 4.57, 5.02], jiangmenDotTimeToSeconds)
)

export const JIANGMEN_MALE_100M_SWIM = stepRule(
  zip([2.05, 2.15, 2.25, 2.35, 2.45, 2.53, 3.01, 3.09, 3.17, 3.25, 3.33, 3.41, 3.49, 3.57, 4.05, 4.13, 4.21, 4.29, 4.37, 4.45, 4.53], jiangmenDotTimeToSeconds)
)

export const JIANGMEN_FEMALE_100M_SWIM = stepRule(
  zip([2.25, 2.35, 2.45, 2.55, 3.05, 3.13, 3.21, 3.29, 3.37, 3.45, 3.53, 4.01, 4.09, 4.17, 4.25, 4.33, 4.41, 4.49, 4.57, 5.05, 5.13], jiangmenDotTimeToSeconds)
)

export const JIANGMEN_MALE_PULL_UP = stepRule(zip([15, 13, 12, 11, 10, 9, 8, 7, 6, null, 5, null, 4, null, 3, null, 2, null, 1, null, null]))

export const JIANGMEN_MALE_VOLLEYBALL = stepRule(zip([45, 43, 40, 37, 34, 31, 29, 26, 23, 20, 18, 16, 14, 12, 10, 8, 6, 4, 2, 1, 0]))

export const JIANGMEN_FEMALE_VOLLEYBALL = stepRule(zip([45, 43, 40, 37, 34, 31, 29, 26, 23, 20, 18, 16, 14, 12, 10, 8, 6, 4, 2, 1, 0]))

export const JIANGMEN_FEMALE_SIT_UP = stepRule(zip([55, 50, 45, 40, 38, 36, 34, 32, 30, 28, 26, 24, 22, 20, 18, 16, 14, 12, 10, 8, 6]))

export const JIANGMEN_MALE_BASKETBALL_DRIBBLE = stepRule(
  zip([15, 17.5, 20, 22.5, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51, 53, 55, 57])
)

export const JIANGMEN_FEMALE_BASKETBALL_DRIBBLE = stepRule(
  zip([19, 21.5, 24, 26.5, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51, 53, 55, 57, 59, 61])
)

export const JIANGMEN_BASKETBALL_SHOT = stepRule(zip([5, null, 4, null, 3, null, null, null, 2, null, null, null, 1, null, null, null, null, null, null, null, 0]))

export const JIANGMEN_MALE_STANDING_LONG_JUMP = stepRule(
  zip([2.55, 2.45, 2.35, 2.32, 2.29, 2.26, 2.23, 2.2, 2.17, 2.14, 2.11, 2.08, 2.05, 2.02, 1.99, 1.96, 1.93, 1.9, 1.87, 1.84, 1.81])
)

export const JIANGMEN_FEMALE_STANDING_LONG_JUMP = stepRule(
  zip([2.07, 1.97, 1.87, 1.84, 1.81, 1.78, 1.75, 1.72, 1.69, 1.66, 1.63, 1.6, 1.57, 1.54, 1.51, 1.48, 1.45, 1.42, 1.39, 1.36, 1.33])
)

export const JIANGMEN_ROPE_SKIP_1MIN = stepRule(
  zip([176, 166, 156, 150, 144, 138, 132, 126, 120, 112, 104, 96, 88, 80, 72, 64, 56, 48, 40, 32, 24])
)

export const JIANGMEN_MALE_MEDICINE_BALL = stepRule(
  zip([11, 10.2, 9.4, 9.2, 9, 8.8, 8.6, 8.4, 8.2, 8, 7.8, 7.6, 7.4, 7.2, 7, 6.8, 6.6, 6.4, 6.2, 6, 5.8])
)

export const JIANGMEN_FEMALE_MEDICINE_BALL = stepRule(
  zip([8, 7.2, 6.4, 6.25, 6.1, 5.95, 5.8, 5.65, 5.5, 5.35, 5.2, 5.05, 4.9, 4.75, 4.6, 4.45, 4.3, 4.15, 4, 3.85, 3.7])
)

export const JIANGMEN_MALE_FOOTBALL = stepRule(
  zip([12, 14.5, 16, 17.5, 19, 19.5, 20, 20.5, 21, 21.5, 22, 22.5, 23, 23.5, 24, 24.5, 25, 25.5, 26, 26.5, 27])
)

export const JIANGMEN_FEMALE_FOOTBALL = stepRule(
  zip([16, 17.5, 19, 20.5, 22, 22.5, 23, 23.5, 24, 24.5, 25, 25.5, 26, 26.5, 27, 27.5, 28, 28.5, 29, 29.5, 30])
)

export const JIANGMEN_QUALITY_UNSUPPORTED: ScoreRule = {
  kind: 'unsupported',
  reason: '体育素质综合评价按七、八、九年级《国家学生体质健康标准》等次计分，不是单一现场成绩，本版不自动换算。',
  maxScore: 10,
  minScore: 0
}
