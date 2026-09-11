import { normalizeExamLabel } from './matchExamItem'

const SCORE_HEADER_EXACT = ['得分', '分数', '换算分', '评分']
const SCORE_SUFFIX = ['得分', '分数', '换算分']

export interface DeclaredScoreColumn {
  scoreColumnIndex: number
  scoreHeader: string
  rawHeaderGuess: string
}

export function isDeclaredScoreHeader(header: string): boolean {
  const normalized = normalizeExamLabel(header)
  if (SCORE_HEADER_EXACT.some((item) => normalizeExamLabel(item) === normalized)) {
    return true
  }
  return SCORE_SUFFIX.some((suffix) => normalized.endsWith(normalizeExamLabel(suffix)) && normalized !== normalizeExamLabel(suffix))
}

export function detectDeclaredScoreColumns(headers: ReadonlyArray<string>): DeclaredScoreColumn[] {
  return headers.flatMap((header, index) => {
    if (!isDeclaredScoreHeader(header)) {
      return []
    }
    const rawHeaderGuess = SCORE_SUFFIX.reduce((current, suffix) => current.replace(new RegExp(`${suffix}$`), ''), header).trim()
    return [{ scoreColumnIndex: index, scoreHeader: header, rawHeaderGuess }]
  })
}

export function compareDeclaredScoreWithEngine(
  declared: number | null,
  engineScore: number | null
): { kind: 'match' | 'mismatch' | 'skip'; message: string | null } {
  if (declared === null || engineScore === null) {
    return { kind: 'skip', message: null }
  }
  if (Math.abs(declared - engineScore) < 0.051) {
    return { kind: 'match', message: null }
  }
  return {
    kind: 'mismatch',
    message: 'Excel得分与当前评分标准计算结果不同。'
  }
}
