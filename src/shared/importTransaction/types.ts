export type ImportTransactionDomain = 'students' | 'schedule' | 'pe-tests'

/**
 * 统一导入事务报告：同一输入重复导入时结果应可预测，失败时明确是否已 rollback。
 */
export interface ImportTransactionReport {
  domain: ImportTransactionDomain
  created: number
  updated: number
  unchanged: number
  skipped: number
  conflicts: number
  errors: string[]
  /** 写入失败后是否已恢复到导入前状态 */
  rolledBack: boolean
  ok: boolean
}

export function emptyImportTransactionReport(
  domain: ImportTransactionDomain,
  partial: Partial<ImportTransactionReport> = {}
): ImportTransactionReport {
  return {
    domain,
    created: 0,
    updated: 0,
    unchanged: 0,
    skipped: 0,
    conflicts: 0,
    errors: [],
    rolledBack: false,
    ok: true,
    ...partial
  }
}
