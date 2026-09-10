import type { ScoreRule, ScoreTableEntry } from '../types'

const BANDS = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 0] as const

/** 肇庆官方表“3.37”为 3 分 37 秒。 */
export function zhaoqingDotTimeToSeconds(value: number): number {
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

function linearRule(entries: ScoreTableEntry[]): ScoreRule {
  return {
    kind: 'thresholdTable',
    scoreMode: 'linear',
    maxScore: 100,
    minScore: 0,
    entries
  }
}

const CLOCK = zhaoqingDotTimeToSeconds

export const ZHAOQING_MALE_1000M = linearRule(
  zip([3.37, 3.45, 3.55, 4.02, 4.09, 4.15, 4.21, 4.26, 4.32, 4.37, 4.42, 4.47, 4.52, 4.56, 5.01, 5.05, 5.09, 5.12, 5.14, 5.16, 5.19], CLOCK)
)

export const ZHAOQING_FEMALE_800M = linearRule(
  zip([3.22, 3.31, 3.4, 3.46, 3.52, 3.57, 4.03, 4.09, 4.14, 4.2, 4.26, 4.31, 4.37, 4.41, 4.46, 4.5, 4.54, 4.57, 4.59, 5.01, 5.04], CLOCK)
)

export const ZHAOQING_MALE_100M_SWIM = linearRule(
  zip([2.18, 2.3, 2.42, 2.54, 3.06, 3.14, 3.22, 3.3, 3.36, 3.42, 3.48, 3.54, 4.0, 4.06, 4.11, 4.16, 4.21, 4.26, 4.31, 4.34, 4.37], CLOCK)
)

export const ZHAOQING_FEMALE_100M_SWIM = linearRule(
  zip([2.25, 2.37, 2.49, 3.01, 3.13, 3.21, 3.29, 3.37, 3.43, 3.49, 3.55, 4.01, 4.07, 4.13, 4.18, 4.23, 4.28, 4.33, 4.38, 4.43, 4.49], CLOCK)
)

export const ZHAOQING_MALE_50M = linearRule(
  zip([7.3, 7.4, 7.5, 7.6, 7.7, 7.9, 8.1, 8.3, 8.5, 8.7, 8.9, 9.1, 9.3, 9.5, 9.7, 9.9, 10.1, 10.3, 10.5, 10.7, 10.9])
)

export const ZHAOQING_FEMALE_50M = linearRule(
  zip([7.9, 8, 8.1, 8.4, 8.7, 8.9, 9.1, 9.3, 9.5, 9.7, 9.9, 10.1, 10.3, 10.5, 10.7, 10.9, 11.1, 11.3, 11.5, 11.7, 11.9])
)

export const ZHAOQING_MALE_MEDICINE_BALL = linearRule(
  zip([11, 10.2, 9.4, 9.2, 9, 8.8, 8.6, 8.4, 8.2, 8, 7.8, 7.6, 7.4, 7.2, 7, 6.8, 6.6, 6.4, 6.2, 6, 5.8])
)

export const ZHAOQING_FEMALE_MEDICINE_BALL = linearRule(
  zip([8, 7.2, 6.4, 6.25, 6.1, 5.95, 5.8, 5.65, 5.5, 5.35, 5.2, 5.05, 4.9, 4.75, 4.6, 4.45, 4.3, 4.15, 4, 3.85, 3.7])
)

export const ZHAOQING_MALE_STANDING_LONG_JUMP = linearRule(
  zip([2.5, 2.45, 2.4, 2.33, 2.25, 2.21, 2.17, 2.13, 2.09, 2.05, 2.01, 1.97, 1.93, 1.89, 1.85, 1.8, 1.75, 1.7, 1.65, 1.6, 1.55])
)

export const ZHAOQING_FEMALE_STANDING_LONG_JUMP = linearRule(
  zip([2.02, 1.96, 1.9, 1.83, 1.76, 1.73, 1.7, 1.67, 1.64, 1.61, 1.58, 1.55, 1.52, 1.49, 1.46, 1.41, 1.36, 1.31, 1.26, 1.21, 1.16])
)

export const ZHAOQING_MALE_PULL_UP = linearRule(
  zip([11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, null, null, null, null, null, null, null, null, null, 0])
)

export const ZHAOQING_FEMALE_SIT_UP = linearRule(
  zip([52, 50, 48, 45, 42, 40, 38, 36, 34, 32, 30, 28, 26, 24, 22, 20, 18, 16, 14, 12, 10])
)

export const ZHAOQING_MALE_BASKETBALL = linearRule(
  zip([19, 21.5, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60])
)

export const ZHAOQING_FEMALE_BASKETBALL = linearRule(
  zip([23, 25.5, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64])
)

export const ZHAOQING_MALE_FOOTBALL = linearRule(
  zip([11, 12.5, 14, 15.5, 17, 17.5, 18, 18.5, 19, 19.5, 20, 20.5, 21, 21.5, 22, 22.5, 23, 23.5, 24, 24.5, 25])
)

export const ZHAOQING_FEMALE_FOOTBALL = linearRule(
  zip([14, 15.5, 17, 18.5, 20, 20.5, 21, 21.5, 22, 22.5, 23, 23.5, 24, 24.5, 25, 25.5, 26, 26.5, 27, 27.5, 28])
)

export const ZHAOQING_MALE_VOLLEYBALL = linearRule(
  zip([28, 29.5, 31, 32.5, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 66])
)

export const ZHAOQING_FEMALE_VOLLEYBALL = linearRule(
  zip([30.5, 32, 33.5, 35, 36.5, 38.5, 40.5, 42.5, 44.5, 46.5, 48.5, 50.5, 52.5, 54.5, 56.5, 58.5, 60.5, 62.5, 64.5, 66.5, 68.5])
)

export const ZHAOQING_ROPE = linearRule(
  zip([194, 179, 164, 156, 148, 140, 132, 124, 116, 108, 100, 92, 84, 76, 68, 60, 52, 44, 36, 28, 20])
)

export const ZHAOQING_PROCESS_REASON =
  '体育素质综合评价按七至九年级体育课成绩和《国家学生体质健康标准》学年结果赋分，不是现场项目对照表，本版不自动换算。'
