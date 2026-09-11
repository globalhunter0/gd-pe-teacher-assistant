import { nonScoreLabelFromBatchRow } from '../parseRaw'
import type { BatchAssessmentRow } from '../types'
import type { ExamToPeTestStatusMap } from './types'

const BLOCK_STATUSES: ReadonlySet<BatchAssessmentRow['status']> = new Set([
  'unrecognized_student_field',
  'unrecognized_gender',
  'unrecognized_item',
  'invalid_raw_value',
  'unsupported_item',
  'no_verified_standard',
  'no_score_table',
  'ambiguous_item',
  'header_used_as_value',
  'needs_review'
])

export function mapExamRowToPeTestStatus(row: BatchAssessmentRow): ExamToPeTestStatusMap {
  if (row.status === 'not_applicable') {
    return {
      peStatus: 'pending',
      rawValue: null,
      examScore: null,
      note: '',
      blockImport: false,
      skipCell: true
    }
  }

  if (BLOCK_STATUSES.has(row.status)) {
    return {
      peStatus: 'invalid',
      rawValue: null,
      examScore: null,
      note: row.message,
      blockImport: true,
      skipCell: true
    }
  }

  if (row.status === 'success') {
    return {
      peStatus: 'valid',
      rawValue: row.rawValueParsed,
      examScore: row.score,
      note: '',
      blockImport: false,
      skipCell: false
    }
  }

  const label = nonScoreLabelFromBatchRow(row)
  if (row.status === 'non_score_record' || label) {
    if (!label && row.rawValueOriginal.trim() === '') {
      return {
        peStatus: 'pending',
        rawValue: null,
        examScore: null,
        note: '原始记录为空白，记为未测',
        blockImport: false,
        skipCell: false
      }
    }
    if (label === '缺考') {
      return {
        peStatus: 'absent',
        rawValue: null,
        examScore: null,
        note: '原始记录为缺考，未参与评分',
        blockImport: false,
        skipCell: false
      }
    }
    if (label === '免考') {
      return {
        peStatus: 'exempt',
        rawValue: null,
        examScore: null,
        note: '原始记录为免考，未参与评分',
        blockImport: false,
        skipCell: false
      }
    }
    if (label === '未测' || label === '未测试') {
      return {
        peStatus: 'pending',
        rawValue: null,
        examScore: null,
        note: `原始记录为${label}，未参与评分`,
        blockImport: false,
        skipCell: false
      }
    }
    if (label === '缓考' || label === '请假') {
      return {
        peStatus: 'pending',
        rawValue: null,
        examScore: null,
        note: `原始记录为${label}（现有测试无独立状态，记入备注，未当作缺考）`,
        blockImport: false,
        skipCell: false
      }
    }
  }

  return {
    peStatus: 'invalid',
    rawValue: null,
    examScore: null,
    note: row.message || '无法映射的成绩状态',
    blockImport: true,
    skipCell: true
  }
}
