import type { ScoreRule, ScoreTableEntry } from '../types'

/** 官方表“2′57″”为 2 分 57 秒。 */
export function shantouClockToSeconds(value: string): number {
  const match = value.trim().match(/^(\d+)['′:](\d{2})["″]?$/)
  if (!match) {
    throw new Error(`无法解析汕头时间档 ${value}`)
  }
  return Number(match[1]) * 60 + Number(match[2])
}

function linearRule(entries: ScoreTableEntry[]): ScoreRule {
  return {
    kind: 'thresholdTable',
    scoreMode: 'linear',
    maxScore: 120,
    minScore: 0,
    scorePrecision: 1,
    entries
  }
}

const CLOCK = shantouClockToSeconds
const SIX_MINUTES = 6 * 60

export const SHANTOU_NATIONAL_REASON =
  '《国家学生体质健康标准》按七至九年级合格年数赋 0/2/4/7 分，由学校审核上报，官方未提供可从现场原始成绩自动换算的对照表。'

export const SHANTOU_NATIONAL_UNSUPPORTED: ScoreRule = {
  kind: 'unsupported',
  reason: SHANTOU_NATIONAL_REASON,
  maxScore: 7,
  minScore: 0
}

export const SHANTOU_MALE_1000M = linearRule([
  { score: 120, threshold: CLOCK("2'57") },
  { score: 115, threshold: CLOCK("3'07") },
  { score: 110, threshold: CLOCK("3'17") },
  { score: 105, threshold: CLOCK("3'27") },
  { score: 100, threshold: CLOCK("3'37") },
  { score: 95, threshold: CLOCK("3'45") },
  { score: 90, threshold: CLOCK("3'53") },
  { score: 85, threshold: CLOCK("4'01") },
  { score: 80, threshold: CLOCK("4'09") },
  { score: 75, threshold: CLOCK("4'17") },
  { score: 70, threshold: CLOCK("4'25") },
  { score: 65, threshold: CLOCK("4'30") },
  { score: 60, threshold: CLOCK("4'35") },
  { score: 55, threshold: CLOCK("4'40") },
  { score: 50, threshold: CLOCK("4'45") },
  { score: 45, threshold: CLOCK("4'50") },
  { score: 40, threshold: CLOCK("4'55") },
  { score: 35, threshold: CLOCK("5'00") },
  { score: 30, threshold: CLOCK("5'05") },
  { score: 25, threshold: SIX_MINUTES }
])

export const SHANTOU_FEMALE_800M = linearRule([
  { score: 120, threshold: CLOCK("2'42") },
  { score: 115, threshold: CLOCK("2'52") },
  { score: 110, threshold: CLOCK("3'02") },
  { score: 105, threshold: CLOCK("3'12") },
  { score: 100, threshold: CLOCK("3'22") },
  { score: 95, threshold: CLOCK("3'30") },
  { score: 90, threshold: CLOCK("3'38") },
  { score: 85, threshold: CLOCK("3'46") },
  { score: 80, threshold: CLOCK("3'54") },
  { score: 75, threshold: CLOCK("4'02") },
  { score: 70, threshold: CLOCK("4'10") },
  { score: 65, threshold: CLOCK("4'15") },
  { score: 60, threshold: CLOCK("4'20") },
  { score: 55, threshold: CLOCK("4'25") },
  { score: 50, threshold: CLOCK("4'30") },
  { score: 45, threshold: CLOCK("4'35") },
  { score: 40, threshold: CLOCK("4'40") },
  { score: 35, threshold: CLOCK("4'45") },
  { score: 30, threshold: CLOCK("4'50") },
  { score: 25, threshold: SIX_MINUTES }
])

export const SHANTOU_MALE_LONG_JUMP = linearRule([
  { score: 120, threshold: 2.85 },
  { score: 115, threshold: 2.75 },
  { score: 110, threshold: 2.65 },
  { score: 105, threshold: 2.55 },
  { score: 100, threshold: 2.45 },
  { score: 95, threshold: 2.35 },
  { score: 90, threshold: 2.32 },
  { score: 85, threshold: 2.29 },
  { score: 80, threshold: 2.26 },
  { score: 75, threshold: 2.23 },
  { score: 70, threshold: 2.2 },
  { score: 65, threshold: 2.17 },
  { score: 60, threshold: 2.14 },
  { score: 55, threshold: 2.11 },
  { score: 50, threshold: 2.08 },
  { score: 45, threshold: 2.05 },
  { score: 40, threshold: 2.02 },
  { score: 35, threshold: 1.99 },
  { score: 30, threshold: 1.96 }
])

export const SHANTOU_FEMALE_LONG_JUMP = linearRule([
  { score: 120, threshold: 2.37 },
  { score: 115, threshold: 2.27 },
  { score: 110, threshold: 2.17 },
  { score: 105, threshold: 2.07 },
  { score: 100, threshold: 1.97 },
  { score: 95, threshold: 1.87 },
  { score: 90, threshold: 1.84 },
  { score: 85, threshold: 1.81 },
  { score: 80, threshold: 1.78 },
  { score: 75, threshold: 1.75 },
  { score: 70, threshold: 1.72 },
  { score: 65, threshold: 1.69 },
  { score: 60, threshold: 1.66 },
  { score: 55, threshold: 1.63 },
  { score: 50, threshold: 1.6 },
  { score: 45, threshold: 1.57 },
  { score: 40, threshold: 1.54 },
  { score: 35, threshold: 1.51 },
  { score: 30, threshold: 1.48 }
])

export const SHANTOU_MALE_MEDICINE_BALL = linearRule([
  { score: 120, threshold: 13.4 },
  { score: 115, threshold: 12.6 },
  { score: 110, threshold: 11.8 },
  { score: 105, threshold: 11 },
  { score: 100, threshold: 10.2 },
  { score: 95, threshold: 9.4 },
  { score: 90, threshold: 9 },
  { score: 85, threshold: 8.6 },
  { score: 80, threshold: 8.2 },
  { score: 75, threshold: 7.8 },
  { score: 70, threshold: 7.4 },
  { score: 65, threshold: 7 },
  { score: 60, threshold: 6.8 },
  { score: 55, threshold: 6.6 },
  { score: 50, threshold: 6.4 },
  { score: 45, threshold: 6.2 },
  { score: 40, threshold: 6 },
  { score: 35, threshold: 5.8 },
  { score: 30, threshold: 5.6 }
])

export const SHANTOU_FEMALE_MEDICINE_BALL = linearRule([
  { score: 120, threshold: 10.4 },
  { score: 115, threshold: 9.6 },
  { score: 110, threshold: 8.8 },
  { score: 105, threshold: 8 },
  { score: 100, threshold: 7.2 },
  { score: 95, threshold: 6.4 },
  { score: 90, threshold: 6.1 },
  { score: 85, threshold: 5.8 },
  { score: 80, threshold: 5.5 },
  { score: 75, threshold: 5.2 },
  { score: 70, threshold: 4.9 },
  { score: 65, threshold: 4.6 },
  { score: 60, threshold: 4.45 },
  { score: 55, threshold: 4.3 },
  { score: 50, threshold: 4.15 },
  { score: 45, threshold: 4 },
  { score: 40, threshold: 3.85 },
  { score: 35, threshold: 3.7 },
  { score: 30, threshold: 3.55 }
])

export const SHANTOU_ROPE = linearRule([
  { score: 120, threshold: 239 },
  { score: 115, threshold: 224 },
  { score: 110, threshold: 209 },
  { score: 105, threshold: 194 },
  { score: 100, threshold: 179 },
  { score: 95, threshold: 164 },
  { score: 90, threshold: 156 },
  { score: 85, threshold: 148 },
  { score: 80, threshold: 140 },
  { score: 75, threshold: 132 },
  { score: 70, threshold: 124 },
  { score: 65, threshold: 116 },
  { score: 60, threshold: 108 },
  { score: 55, threshold: 100 },
  { score: 50, threshold: 92 },
  { score: 45, threshold: 84 },
  { score: 40, threshold: 76 },
  { score: 35, threshold: 68 },
  { score: 30, threshold: 60 },
  { score: 25, threshold: 28 }
])

/** 官方空单元格未补录：70/60/50/40/30 分档无次数。 */
export const SHANTOU_MALE_PULL_UP = linearRule([
  { score: 120, threshold: 21 },
  { score: 115, threshold: 19 },
  { score: 110, threshold: 17 },
  { score: 105, threshold: 15 },
  { score: 100, threshold: 13 },
  { score: 95, threshold: 11 },
  { score: 90, threshold: 10 },
  { score: 85, threshold: 9 },
  { score: 80, threshold: 8 },
  { score: 75, threshold: 7 },
  { score: 65, threshold: 6 },
  { score: 55, threshold: 5 },
  { score: 45, threshold: 4 },
  { score: 35, threshold: 3 },
  { score: 25, threshold: 1 }
])

export const SHANTOU_FEMALE_SIT_UP = linearRule([
  { score: 120, threshold: 65 },
  { score: 115, threshold: 60 },
  { score: 110, threshold: 55 },
  { score: 105, threshold: 50 },
  { score: 100, threshold: 45 },
  { score: 95, threshold: 40 },
  { score: 90, threshold: 38 },
  { score: 85, threshold: 36 },
  { score: 80, threshold: 34 },
  { score: 75, threshold: 32 },
  { score: 70, threshold: 30 },
  { score: 65, threshold: 28 },
  { score: 60, threshold: 26 },
  { score: 55, threshold: 24 },
  { score: 50, threshold: 22 },
  { score: 45, threshold: 20 },
  { score: 40, threshold: 18 },
  { score: 35, threshold: 16 },
  { score: 30, threshold: 14 },
  { score: 25, threshold: 10 }
])
