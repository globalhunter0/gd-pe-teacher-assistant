import { GUANGZHOU_MIDDLE_2024_2026 } from './data/guangzhouMiddle2024-2026'
import { GUANGDONG_GAOKAO_SPORTS_2026 } from './data/gaokaoSports2026'
import { assertExamCatalogIntegrity } from './integrity'
import { attachExamItemAliases } from './itemAliases'
import type { ExamStandard } from './types'
import { parseExamStandards } from './validate'

export const BUILTIN_EXAM_STANDARDS: ExamStandard[] = parseExamStandards([
  GUANGZHOU_MIDDLE_2024_2026,
  GUANGDONG_GAOKAO_SPORTS_2026
]).map(attachExamItemAliases)

assertExamCatalogIntegrity(BUILTIN_EXAM_STANDARDS)

export function assertBuiltinExamCatalog(): void {
  assertExamCatalogIntegrity(BUILTIN_EXAM_STANDARDS)
}

export function listBuiltinExamStandards(): ExamStandard[] {
  return BUILTIN_EXAM_STANDARDS
}
