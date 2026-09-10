import { GUANGZHOU_MIDDLE_2024_2026 } from './data/guangzhouMiddle2024-2026'
import { GUANGDONG_GAOKAO_SPORTS_2026 } from './data/gaokaoSports2026'
import { SHENZHEN_MIDDLE_2026 } from './data/shenzhenMiddle2026'
import { DONGGUAN_MIDDLE_2026_2027 } from './data/dongguanMiddle2026-2027'
import { JIANGMEN_MIDDLE_2026 } from './data/jiangmenMiddle2026'
import { ZHANJIANG_MIDDLE_2026 } from './data/zhanjiangMiddle2026'
import { FOSHAN_MIDDLE_2025, FOSHAN_MIDDLE_2026 } from './data/foshanMiddle'
import { ZHUHAI_MIDDLE_2026 } from './data/zhuhaiMiddle2026'
import { SHANTOU_MIDDLE_2026 } from './data/shantouMiddle2026'
import { SHAOGUAN_MIDDLE_2026 } from './data/shaoguanMiddle2026'
import { HEYUAN_MIDDLE_2026 } from './data/heyuanMiddle2026'
import { MEIZHOU_MIDDLE_2026 } from './data/meizhouMiddle2026'
import { HUIZHOU_MIDDLE_2026 } from './data/huizhouMiddle2026'
import { SHANWEI_MIDDLE_2026 } from './data/shanweiMiddle2026'
import { ZHONGSHAN_MIDDLE_STANDARDS } from './data/zhongshanMiddle2025-2029'
import { YANGJIANG_MIDDLE_2026 } from './data/yangjiangMiddle2026'
import { MAOMING_MIDDLE_2026 } from './data/maomingMiddle2026'
import { ZHAOQING_MIDDLE_2026 } from './data/zhaoqingMiddle2026'
import { QINGYUAN_MIDDLE_2026 } from './data/qingyuanMiddle2026'
import { CHAOZHOU_MIDDLE_2026 } from './data/chaozhouMiddle2026'
import { JIEYANG_MIDDLE_2026 } from './data/jieyangMiddle2026'
import { YUNFU_MIDDLE_2026 } from './data/yunfuMiddle2026'
import { assertExamCatalogIntegrity } from './integrity'
import { attachExamItemAliases } from './itemAliases'
import type { ExamStandard } from './types'
import { parseExamStandards } from './validate'

export const BUILTIN_EXAM_STANDARDS: ExamStandard[] = parseExamStandards([
  GUANGZHOU_MIDDLE_2024_2026,
  SHENZHEN_MIDDLE_2026,
  DONGGUAN_MIDDLE_2026_2027,
  JIANGMEN_MIDDLE_2026,
  ZHANJIANG_MIDDLE_2026,
  FOSHAN_MIDDLE_2026,
  FOSHAN_MIDDLE_2025,
  ZHUHAI_MIDDLE_2026,
  SHANTOU_MIDDLE_2026,
  SHAOGUAN_MIDDLE_2026,
  HEYUAN_MIDDLE_2026,
  MEIZHOU_MIDDLE_2026,
  HUIZHOU_MIDDLE_2026,
  SHANWEI_MIDDLE_2026,
  ...ZHONGSHAN_MIDDLE_STANDARDS,
  YANGJIANG_MIDDLE_2026,
  MAOMING_MIDDLE_2026,
  ZHAOQING_MIDDLE_2026,
  QINGYUAN_MIDDLE_2026,
  CHAOZHOU_MIDDLE_2026,
  JIEYANG_MIDDLE_2026,
  YUNFU_MIDDLE_2026,
  GUANGDONG_GAOKAO_SPORTS_2026
]).map(attachExamItemAliases)

assertExamCatalogIntegrity(BUILTIN_EXAM_STANDARDS)

export function assertBuiltinExamCatalog(): void {
  assertExamCatalogIntegrity(BUILTIN_EXAM_STANDARDS)
}

export function listBuiltinExamStandards(): ExamStandard[] {
  return BUILTIN_EXAM_STANDARDS
}
