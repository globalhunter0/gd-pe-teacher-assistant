import type { ScoreRule, ScoreTableEntry } from '../types'

const BANDS = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 0] as const

/** 官方表“3:40”为 3 分 40 秒。 */
export function foshanClockToSeconds(value: string): number {
  const [minutesText, secondsText] = value.split(':')
  return Number(minutesText) * 60 + Number(secondsText)
}

function zip<T extends number | string>(values: Array<T | null>, convert: (value: T) => number = (value) => Number(value)): ScoreTableEntry[] {
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

const CLOCK = (value: string) => foshanClockToSeconds(value)

export const FOSHAN_MALE_1000M = linearRule(
  zip(['3:40', '3:50', '4:00', '4:08', '4:16', '4:21', '4:28', '4:34', '4:40', '4:45', '4:50', '4:55', '5:00', '5:04', '5:09', '5:12', '5:17', '5:19', '5:21', '5:23', '5:25'], CLOCK)
)

export const FOSHAN_FEMALE_800M = linearRule(
  zip(['3:25', '3:35', '3:45', '3:51', '3:57', '4:02', '4:09', '4:15', '4:21', '4:27', '4:33', '4:39', '4:45', '4:50', '4:55', '5:00', '5:03', '5:05', '5:07', '5:09', '5:10'], CLOCK)
)

export const FOSHAN_MALE_100M_SWIM = linearRule(
  zip(['2:30', '2:35', '2:40', '2:45', '2:50', '2:55', '3:00', '3:05', '3:10', '3:15', '3:20', '3:25', '3:30', '3:35', '3:40', '3:45', '3:50', '3:55', '4:00', '4:05', '4:10'], CLOCK)
)

export const FOSHAN_FEMALE_100M_SWIM = linearRule(
  zip(['2:40', '2:45', '2:50', '2:55', '3:00', '3:05', '3:10', '3:15', '3:20', '3:25', '3:30', '3:35', '3:40', '3:45', '3:50', '3:55', '4:00', '4:05', '4:10', '4:15', '4:20'], CLOCK)
)

export const FOSHAN_2026_ROPE = linearRule(
  zip([182, 177, 172, 167, 162, 157, 152, 147, 142, 132, 122, 112, 102, 92, 82, 72, 62, 52, 42, 32, 22])
)

export const FOSHAN_2025_ROPE = linearRule(
  zip([208, 193, 178, 163, 148, 140, 132, 124, 116, 108, 100, 92, 84, 76, 68, 60, 52, 44, 36, 28, 20])
)

export const FOSHAN_MALE_MEDICINE_BALL = linearRule(
  zip([12.2, 11.4, 10.6, 9.8, 9.0, 8.8, 8.6, 8.4, 8.2, 8.0, 7.8, 7.6, 7.4, 7.2, 7.0, 6.8, 6.6, 6.4, 6.2, 6.0, 5.8])
)

export const FOSHAN_FEMALE_MEDICINE_BALL = linearRule(
  zip([9.3, 8.5, 7.7, 6.9, 6.1, 5.95, 5.8, 5.65, 5.5, 5.35, 5.2, 5.05, 4.9, 4.75, 4.6, 4.45, 4.3, 4.15, 4.0, 3.85, 3.7])
)

export const FOSHAN_MALE_BASKETBALL_DRIBBLE = linearRule(
  zip([17, 19.5, 22, 24.5, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51, 53, 55, 57, 59])
)

export const FOSHAN_FEMALE_BASKETBALL_DRIBBLE = linearRule(
  zip([21, 23.5, 26, 28.5, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51, 53, 55, 57, 59, 61, 63])
)

export const FOSHAN_SHUTTLECOCK = linearRule(
  zip([85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 36, 33, 30, 26, 23, 20, 16, 13, 10, 5, 0])
)

export const FOSHAN_MALE_SIT_UP = linearRule(
  zip([64, 58, 52, 46, 40, 38, 36, 34, 32, 30, 28, 26, 24, 22, 20, 18, 16, 14, 12, 10, 8])
)

export const FOSHAN_FEMALE_SIT_UP = linearRule(
  zip([60, 54, 48, 42, 36, 34, 32, 30, 28, 26, 24, 22, 20, 18, 16, 14, 12, 10, 8, 6, 4])
)

export const FOSHAN_MALE_TRIPLE_FROG = linearRule(
  zip([8.0, 7.7, 7.4, 7.1, 6.8, 6.7, 6.6, 6.5, 6.4, 6.3, 6.2, 6.1, 6.0, 5.9, 5.8, 5.7, 5.6, 5.5, 5.4, 5.3, 5.2])
)

export const FOSHAN_FEMALE_TRIPLE_FROG = linearRule(
  zip([6.9, 6.6, 6.3, 6.0, 5.7, 5.6, 5.5, 5.4, 5.3, 5.2, 5.1, 5.0, 4.9, 4.8, 4.7, 4.6, 4.5, 4.4, 4.3, 4.2, 4.1])
)

export const FOSHAN_MALE_STANDING_LONG_JUMP = linearRule(
  zip([2.69, 2.59, 2.49, 2.39, 2.29, 2.26, 2.23, 2.2, 2.17, 2.14, 2.11, 2.08, 2.05, 2.02, 1.99, 1.96, 1.93, 1.9, 1.87, 1.84, 1.81])
)

export const FOSHAN_FEMALE_STANDING_LONG_JUMP = linearRule(
  zip([2.21, 2.11, 2.01, 1.91, 1.81, 1.78, 1.75, 1.72, 1.69, 1.66, 1.63, 1.6, 1.57, 1.54, 1.51, 1.48, 1.45, 1.42, 1.39, 1.36, 1.33])
)

export const FOSHAN_BASKETBALL_SHOT = linearRule(
  zip([5, null, 4, null, 3, null, null, 2, null, null, 1, null, null, null, null, null, null, null, null, null, null])
)

export const FOSHAN_MALE_SHOT_PUT = linearRule(
  zip([10.4, 10.1, 9.8, 9.5, 9.2, 9.0, 8.8, 8.6, 8.4, 8.2, 8.0, 7.8, 7.6, 7.4, 7.2, 7.0, 6.8, 6.6, 6.4, 6.2, 6.0])
)

export const FOSHAN_FEMALE_SHOT_PUT = linearRule(
  zip([7.7, 7.4, 7.1, 6.8, 6.5, 6.3, 6.1, 5.9, 5.7, 5.5, 5.3, 5.1, 4.9, 4.7, 4.5, 4.3, 4.1, 3.9, 3.7, 3.5, 3.3])
)

export const FOSHAN_MALE_FOOTBALL = linearRule(
  zip([12.0, 13.5, 15.0, 16.5, 18.0, 18.5, 19.0, 19.5, 20.0, 20.5, 21.0, 21.5, 22.0, 22.5, 23.0, 23.5, 24.0, 24.5, 25.0, 25.5, 26.0])
)

export const FOSHAN_FEMALE_FOOTBALL = linearRule(
  zip([17.0, 18.5, 20.0, 21.5, 23.0, 23.5, 24.0, 24.5, 25.0, 25.5, 26.0, 26.5, 27.0, 27.5, 28.0, 28.5, 29.0, 29.5, 30.0, 30.5, 31.0])
)

export const FOSHAN_MALE_PULL_UP = linearRule(zip([15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, null, 4, null, 3, null, 2, null, 1, null, 0]))

export const FOSHAN_PROCESS_REASON =
  '《国标》与《体评》按学年等级赋分，由学校审核上报，官方未提供可自动换算的原始成绩对照表。'

export const FOSHAN_PROCESS_UNSUPPORTED: ScoreRule = {
  kind: 'unsupported',
  reason: FOSHAN_PROCESS_REASON,
  maxScore: 6,
  minScore: 0
}
