import type { ScoreRule, ScoreTableEntry } from '../types'

function row(score: number, threshold: number): ScoreTableEntry {
  return { score, threshold }
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

/** 粤考院函〔2025〕147号扫描附件第7页 表1 男子100米跑。介于两档取较低分。 */
export const MALE_100M = stepRule(75, [
  row(75, 11.48),
  row(74, 11.52),
  row(73, 11.56),
  row(72, 11.6),
  row(71, 11.64),
  row(70, 11.68),
  row(69, 11.72),
  row(68, 11.76),
  row(67, 11.8),
  row(66, 11.84),
  row(65, 11.88),
  row(64, 11.91),
  row(63, 11.94),
  row(62, 11.97),
  row(61, 12),
  row(60, 12.02),
  row(59, 12.04),
  row(58, 12.06),
  row(57, 12.08),
  row(56, 12.1),
  row(55, 12.12),
  row(54, 12.14),
  row(53, 12.16),
  row(52, 12.18),
  row(51, 12.2),
  row(50, 12.22),
  row(49, 12.25),
  row(48, 12.28),
  row(47, 12.31),
  row(46, 12.35),
  row(45, 12.39),
  row(44, 12.43),
  row(43, 12.47),
  row(42, 12.52),
  row(41, 12.57),
  row(40, 12.62),
  row(39, 12.68),
  row(38, 12.75),
  row(37, 12.82),
  row(36, 12.9),
  row(35, 12.98),
  row(34, 13.06),
  row(33, 13.15),
  row(32, 13.24),
  row(31, 13.33),
  row(30, 13.42),
  row(29, 13.51),
  row(28, 13.6),
  row(27, 13.69),
  row(26, 13.78),
  row(25, 13.87),
  row(24, 13.96),
  row(23, 14.15),
  row(22, 14.25),
  row(21, 14.35),
  row(20, 14.45),
  row(19, 14.55),
  row(18, 14.65),
  row(17, 14.75),
  row(16, 14.85),
  row(15, 14.95),
  row(14, 15.07),
  row(13, 15.19),
  row(12, 15.31),
  row(11, 15.43),
  row(10, 15.55),
  row(9, 15.67),
  row(8, 15.79),
  row(7, 15.91),
  row(6, 16.03),
  row(5, 16.15),
  row(4, 16.27),
  row(3, 16.39),
  row(2, 16.52),
  row(1, 16.65)
])

/** 粤考院函〔2025〕147号扫描附件第8页 表2 女子100米跑。介于两档取较低分。 */
export const FEMALE_100M = stepRule(75, [
  row(75, 13),
  row(74, 13.05),
  row(73, 13.1),
  row(72, 13.15),
  row(71, 13.2),
  row(70, 13.25),
  row(69, 13.3),
  row(68, 13.35),
  row(67, 13.4),
  row(66, 13.45),
  row(65, 13.5),
  row(64, 13.55),
  row(63, 13.59),
  row(62, 13.63),
  row(61, 13.67),
  row(60, 13.71),
  row(59, 13.74),
  row(58, 13.77),
  row(57, 13.8),
  row(56, 13.83),
  row(55, 13.86),
  row(54, 13.89),
  row(53, 13.92),
  row(52, 13.95),
  row(51, 13.98),
  row(50, 14.01),
  row(49, 14.06),
  row(48, 14.11),
  row(47, 14.16),
  row(46, 14.21),
  row(45, 14.26),
  row(44, 14.31),
  row(43, 14.36),
  row(42, 14.42),
  row(41, 14.49),
  row(40, 14.56),
  row(39, 14.64),
  row(38, 14.72),
  row(37, 14.81),
  row(36, 14.9),
  row(35, 14.99),
  row(34, 15.08),
  row(33, 15.17),
  row(32, 15.26),
  row(31, 15.35),
  row(30, 15.44),
  row(29, 15.53),
  row(28, 15.62),
  row(27, 15.71),
  row(26, 15.8),
  row(25, 15.89),
  row(24, 15.98),
  row(23, 16.07),
  row(22, 16.16),
  row(21, 16.25),
  row(20, 16.34),
  row(19, 16.43),
  row(18, 16.52),
  row(17, 16.61),
  row(16, 16.7),
  row(15, 16.79),
  row(14, 16.88),
  row(13, 16.97),
  row(12, 17.06),
  row(11, 17.15),
  row(10, 17.24),
  row(9, 17.33),
  row(8, 17.42),
  row(7, 17.51),
  row(6, 17.6),
  row(5, 17.69),
  row(4, 17.78),
  row(3, 17.87),
  row(2, 17.96),
  row(1, 18.05)
])

function r2(value: number): number {
  return Math.round(value * 100) / 100
}

/** 按分值从高到低生成档位。delta 为相邻更低分档的阈值增量。 */
function byScore(fromScore: number, toScore: number, startThreshold: number, delta: number): ScoreTableEntry[] {
  const entries: ScoreTableEntry[] = []
  let threshold = startThreshold
  for (let score = fromScore; score >= toScore; score -= 1) {
    entries.push(row(score, r2(threshold)))
    threshold += delta
  }
  return entries
}

/** 粤考院函〔2025〕147号 第11页 表3 男子立定三级跳远。1分档官方为 6.50 米。 */
export const MALE_STANDING_TRIPLE_JUMP = stepRule(75, [
  ...byScore(75, 45, 9.5, -0.03),
  ...byScore(44, 35, 8.56, -0.04),
  ...byScore(34, 1, 8.15, -0.05)
])

/** 第12页 表4 女子立定三级跳远。 */
export const FEMALE_STANDING_TRIPLE_JUMP = stepRule(75, [
  ...byScore(75, 70, 7.9, -0.02),
  ...byScore(69, 40, 7.77, -0.03),
  row(39, 6.86),
  ...byScore(38, 35, 6.82, -0.04),
  ...byScore(34, 1, 6.65, -0.05)
])

/** 第15页 表5 男子原地推铅球（5公斤）。 */
export const MALE_SHOT_PUT = stepRule(75, [
  ...byScore(75, 71, 12.3, -0.06),
  ...byScore(70, 41, 11.98, -0.08),
  ...byScore(40, 16, 9.56, -0.1),
  ...byScore(15, 7, 7.04, -0.12),
  ...byScore(6, 1, 5.94, -0.14)
])

/** 第16页 表6 女子原地推铅球（4公斤）。 */
export const FEMALE_SHOT_PUT = stepRule(75, [
  ...byScore(75, 71, 9.5, -0.03),
  ...byScore(70, 41, 9.33, -0.05),
  row(40, 7.81),
  ...byScore(39, 16, 7.74, -0.07),
  row(15, 6.04),
  ...byScore(14, 7, 5.95, -0.09),
  ...byScore(6, 1, 5.23, -0.11)
])

/** 第19页 表7 男子20秒连续俯卧撑。≤7次=0分。 */
export const MALE_PUSH_UP_20S = stepRule(50, [
  ...Array.from({ length: 23 }, (_, index) => {
    const reps = 30 - index
    return row(50 - index * 2, reps)
  }),
  row(0, 7)
])

/** 第19页 表8 女子15秒连续俯卧撑。≤5次=0分。 */
export const FEMALE_PUSH_UP_15S = stepRule(50, [
  ...Array.from({ length: 15 }, (_, index) => {
    const reps = 20 - index
    return row(50 - index * 3, reps)
  }),
  row(0, 5)
])

/** 第22页 表9 男子20秒两头起。≤5次=0分。 */
export const MALE_V_UP_20S = stepRule(50, [
  ...Array.from({ length: 23 }, (_, index) => {
    const reps = 28 - index
    return row(50 - index * 2, reps)
  }),
  row(0, 5)
])

/** 第22页 表10 女子20秒两头起。19次起由每档少3分改为少2分，按官方表录入。≤5次=0分。 */
export const FEMALE_V_UP_20S = stepRule(50, [
  ...Array.from({ length: 6 }, (_, index) => {
    const reps = 25 - index
    return row(50 - index * 3, reps)
  }),
  ...Array.from({ length: 14 }, (_, index) => {
    const reps = 19 - index
    return row(33 - index * 2, reps)
  }),
  row(0, 5)
])

/** 第25页 表11 男子3×10米8字绕杆跑。>20.60秒=0分。无3/2/1分档。 */
export const MALE_FIGURE8_RUN = stepRule(50, byScore(50, 4, 16, 0.1))

/** 第26页 表12 女子3×10米8字绕杆跑。>21.60秒=0分。无3/2/1分档。 */
export const FEMALE_FIGURE8_RUN = stepRule(50, byScore(50, 4, 17, 0.1))

/** 第30页 表13 男子足球运球绕杆射门。介于两档取较低分。 */
export const MALE_FOOTBALL = stepRule(75, [
  row(75, 15),
  row(74, 15.6),
  row(73, 16),
  row(72, 16.5),
  row(71, 17),
  row(70, 17.5),
  row(69, 17.8),
  row(68, 18.1),
  row(67, 18.5),
  row(66, 18.9),
  row(65, 19.2),
  row(64, 19.4),
  row(63, 19.6),
  row(62, 19.8),
  row(61, 20),
  row(60, 20.1),
  row(59, 20.3),
  row(58, 20.5),
  row(57, 20.7),
  row(56, 20.9),
  row(55, 21),
  row(54, 21.1),
  row(53, 21.2),
  row(52, 21.3),
  row(51, 21.4),
  ...byScore(50, 35, 21.5, 0.1),
  ...byScore(34, 1, 23.2, 0.2)
])

/** 第31页 表14 女子足球运球绕杆射门。 */
export const FEMALE_FOOTBALL = stepRule(75, [
  row(75, 17),
  row(74, 17.4),
  row(73, 17.9),
  row(72, 18.3),
  row(71, 18.7),
  row(70, 19.1),
  row(69, 19.4),
  row(68, 19.7),
  row(67, 20.1),
  row(66, 20.3),
  row(65, 20.5),
  ...byScore(64, 51, 20.6, 0.1),
  ...byScore(50, 41, 22, 0.1),
  ...byScore(40, 26, 23.1, 0.2),
  ...byScore(25, 1, 26.1, 0.2)
])

/** 第36页 表15 男子篮球运球绕杆定点投篮。 */
export const MALE_BASKETBALL = stepRule(75, [...byScore(75, 65, 29.5, 0.2), ...byScore(64, 1, 31.8, 0.3)])

/** 第37页 表16 女子篮球运球绕杆定点投篮。 */
export const FEMALE_BASKETBALL = stepRule(75, [...byScore(75, 65, 33, 0.2), ...byScore(64, 1, 35.3, 0.3)])

/** 第43页 表19 乒乓球左推右攻，男女同一张表。不是每个整数分都有档。0分=≤5板。 */
export const TABLE_TENNIS_PUSH_ATTACK = stepRule(75, [
  row(75, 60),
  row(73, 59),
  row(70, 58),
  row(67, 57),
  row(64, 56),
  row(61, 55),
  row(58, 54),
  row(55, 53),
  row(52, 52),
  row(50, 51),
  row(48, 50),
  row(46, 49),
  row(44, 48),
  row(42, 47),
  ...Array.from({ length: 41 }, (_, index) => {
    const score = 41 - index
    return row(score, score + 5)
  }),
  row(0, 5)
])
