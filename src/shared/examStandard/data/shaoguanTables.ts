import type { ScoreRule, ScoreTableEntry } from '../types'

/** 官方表“3:05”为 3 分 05 秒。 */
export function shaoguanClockToSeconds(value: string): number {
  const match = value.trim().match(/^(\d+)[:'](\d{2})$/)
  if (!match) {
    throw new Error(`无法解析韶关时间档 ${value}`)
  }
  return Number(match[1]) * 60 + Number(match[2])
}

function round2(value: number): number {
  return Math.round(value * 100 + 1e-8) / 100
}

function stepRule(maxScore: number, entries: ScoreTableEntry[]): ScoreRule {
  return {
    kind: 'thresholdTable',
    scoreMode: 'step',
    maxScore,
    minScore: 0,
    entries
  }
}

function runTable(startSeconds: number): ScoreTableEntry[] {
  const entries: ScoreTableEntry[] = []
  for (let score = 120; score >= 0; score -= 1) {
    entries.push({ score, threshold: startSeconds + (120 - score) })
  }
  return entries
}

function frogTable(high: number, mid: number): ScoreTableEntry[] {
  const entries: ScoreTableEntry[] = []
  for (let score = 120; score >= 90; score -= 1) {
    entries.push({ score, threshold: round2(high - 0.06 * (120 - score)) })
  }
  for (let score = 89; score >= 0; score -= 1) {
    entries.push({ score, threshold: round2(mid - 0.02 * (89 - score)) })
  }
  return entries
}

function ropeTable(): ScoreTableEntry[] {
  const byScore: number[] = Array.from({ length: 121 }, () => 0)
  for (let score = 120; score >= 95; score -= 1) {
    byScore[score] = 239 - 3 * (120 - score)
  }
  byScore[94] = 162
  byScore[93] = 160
  byScore[92] = 158
  byScore[91] = 157
  byScore[90] = 156
  for (let high = 90; high >= 10; high -= 5) {
    const start = byScore[high]
    byScore[high - 1] = start - 2
    byScore[high - 2] = start - 4
    byScore[high - 3] = start - 6
    byScore[high - 4] = start - 7
    byScore[high - 5] = start - 8
  }
  byScore[4] = 18
  byScore[3] = 16
  byScore[2] = 14
  byScore[1] = 12
  byScore[0] = 10
  return byScore.map((threshold, score) => ({ score, threshold })).reverse()
}

export const SHAOGUAN_MALE_1000M = stepRule(120, runTable(3 * 60 + 5))
export const SHAOGUAN_FEMALE_800M = stepRule(120, runTable(2 * 60 + 50))
export const SHAOGUAN_MALE_TRIPLE_FROG = stepRule(120, frogTable(8.8, 6.98))
export const SHAOGUAN_FEMALE_TRIPLE_FROG = stepRule(120, frogTable(7.7, 5.88))
export const SHAOGUAN_ROPE = stepRule(120, ropeTable())

const VOLLEY_MALE_LOW: Array<[number, number]> = [
  [95, 39],
  [90, 38],
  [85, 37],
  [80, 36],
  [75, 35],
  [70, 34],
  [65, 33],
  [60, 32],
  [55, 31],
  [50, 30],
  [47, 29],
  [45, 28],
  [42, 27],
  [40, 26],
  [37, 25],
  [35, 24],
  [32, 23],
  [30, 22],
  [27, 21],
  [25, 20],
  [22, 19],
  [20, 18],
  [17, 17],
  [15, 16],
  [12, 15],
  [10, 14],
  [5, 12],
  [0, 10]
]

const VOLLEY_FEMALE_LOW: Array<[number, number]> = [
  [95, 34],
  [90, 33],
  [85, 32],
  [80, 31],
  [75, 30],
  [70, 29],
  [65, 28],
  [60, 27],
  [55, 26],
  [50, 25],
  [45, 24],
  [40, 23],
  [35, 22],
  [30, 21],
  [25, 20],
  [22, 19],
  [20, 18],
  [17, 17],
  [15, 16],
  [12, 15],
  [10, 14],
  [5, 12],
  [0, 10]
]

function volleyballTable(topAt120: number, low: Array<[number, number]>): ScoreTableEntry[] {
  const entries: ScoreTableEntry[] = []
  for (let score = 120; score >= 100; score -= 1) {
    entries.push({ score, threshold: topAt120 - (120 - score) })
  }
  for (const [score, threshold] of low) {
    entries.push({ score, threshold })
  }
  return entries
}

export const SHAOGUAN_MALE_VOLLEYBALL = stepRule(120, volleyballTable(60, VOLLEY_MALE_LOW))
export const SHAOGUAN_FEMALE_VOLLEYBALL = stepRule(120, volleyballTable(55, VOLLEY_FEMALE_LOW))

function swimFoldedTable(): ScoreTableEntry[] {
  const entries: ScoreTableEntry[] = []
  for (let tableScore = 100; tableScore >= 0; tableScore -= 1) {
    entries.push({
      score: round2(tableScore * 1.5),
      threshold: 6 * 60 + (100 - tableScore)
    })
  }
  return entries
}

export const SHAOGUAN_SWIM = stepRule(150, swimFoldedTable())

function shotMaleRegular(): ScoreTableEntry[] {
  const entries: ScoreTableEntry[] = []
  for (let score = 100; score >= 90; score -= 1) {
    entries.push({ score, threshold: round2(10.8 - 0.06 * (100 - score)) })
  }
  for (let score = 89; score >= 80; score -= 1) {
    entries.push({ score, threshold: round2(10.2 - 0.06 * (90 - score)) })
  }
  for (let score = 79; score >= 0; score -= 1) {
    entries.push({ score, threshold: round2(9.6 - 0.04 * (80 - score)) })
  }
  return entries
}

function shotFemaleRegular(): ScoreTableEntry[] {
  const entries: ScoreTableEntry[] = []
  for (let score = 100; score >= 95; score -= 1) {
    entries.push({ score, threshold: round2(7.2 - 0.06 * (100 - score)) })
  }
  for (let score = 94; score >= 0; score -= 1) {
    entries.push({ score, threshold: round2(6.9 - 0.04 * (95 - score)) })
  }
  return entries
}

export const SHAOGUAN_MALE_SHOT = stepRule(100, shotMaleRegular())
export const SHAOGUAN_FEMALE_SHOT = stepRule(100, shotFemaleRegular())

/** 仅录入附件2可明确对应普通考生的档。择考生列与无法安全对齐的空单元格未补录。 */
export const SHAOGUAN_MALE_PULL_UP = stepRule(100, [
  { score: 100, threshold: 15 },
  { score: 95, threshold: 14 },
  { score: 90, threshold: 13 },
  { score: 85, threshold: 12 },
  { score: 83, threshold: 11 },
  { score: 80, threshold: 10 },
  { score: 75, threshold: 9 },
  { score: 70, threshold: 8 },
  { score: 65, threshold: 7 },
  { score: 60, threshold: 6 },
  { score: 50, threshold: 5 },
  { score: 40, threshold: 4 },
  { score: 30, threshold: 3 },
  { score: 20, threshold: 2 },
  { score: 10, threshold: 1 },
  { score: 0, threshold: 0 }
])

function ladderRegular(): ScoreTableEntry[] {
  const entries: ScoreTableEntry[] = []
  for (let score = 100; score >= 60; score -= 2) {
    entries.push({ score, threshold: round2(16 - 0.2 * (100 - score)) })
  }
  const sparse: Array<[number, number]> = [
    [57, 7.6],
    [54, 7.2],
    [51, 6.8],
    [48, 6.4],
    [45, 6],
    [42, 5.6],
    [39, 5.2],
    [36, 4.8],
    [33, 4.4],
    [30, 4],
    [27, 3.6],
    [24, 3.2],
    [21, 2.8],
    [18, 2.4],
    [12, 1.6],
    [0, 0]
  ]
  for (const [score, threshold] of sparse) {
    entries.push({ score, threshold })
  }
  return entries
}

export const SHAOGUAN_FEMALE_LADDER = stepRule(100, ladderRegular())
