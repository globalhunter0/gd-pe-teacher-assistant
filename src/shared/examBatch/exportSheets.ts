import type { BatchAssessmentRow, ExamBatchLayout, ExamExportMeta } from './types'
import { EXAM_BATCH_STATUS_LABELS } from './types'

export interface ExportSheet {
  name: string
  rows: Array<Array<string | number>>
}

function detailHeaders(): string[] {
  return ['Excel行号', '学号', '姓名', '班级', '性别', '项目', '原始成绩', '标准化成绩', '换算分数', '状态', '备注']
}

function detailRow(row: BatchAssessmentRow): Array<string | number> {
  return [
    row.sourceRow,
    row.studentNo,
    row.studentName,
    row.className,
    row.gender === 'male' ? '男' : row.gender === 'female' ? '女' : '',
    row.examItemName,
    row.rawValueOriginal,
    row.rawValueNormalized ?? '',
    row.score ?? '',
    EXAM_BATCH_STATUS_LABELS[row.status],
    row.message
  ]
}

function uniqueItems(rows: BatchAssessmentRow[]): string[] {
  const names: string[] = []
  for (const row of rows) {
    if (row.examItemName && !names.includes(row.examItemName)) {
      names.push(row.examItemName)
    }
  }
  return names
}

function studentKey(row: BatchAssessmentRow): string {
  return `${row.studentNo}\u0000${row.studentName}\u0000${row.className}\u0000${row.gender ?? ''}`
}

function summaryRows(rows: BatchAssessmentRow[]): Array<Array<string | number>> {
  const items = uniqueItems(rows)
  const header = ['学号', '姓名', '班级', '性别', ...items.flatMap((name) => [`${name}原始成绩`, `${name}换算分`]), '成功项目数', '异常项目数']
  const groups = new Map<string, BatchAssessmentRow[]>()
  for (const row of rows) {
    const key = studentKey(row)
    const list = groups.get(key) ?? []
    list.push(row)
    groups.set(key, list)
  }

  const body = [...groups.values()].map((group) => {
    const first = group[0]
    const cells: Array<string | number> = [
      first.studentNo,
      first.studentName,
      first.className,
      first.gender === 'male' ? '男' : first.gender === 'female' ? '女' : ''
    ]
    for (const name of items) {
      const hit = group.find((row) => row.examItemName === name)
      cells.push(hit?.rawValueOriginal ?? '', hit?.score ?? '')
    }
    cells.push(group.filter((row) => row.status === 'success').length, group.filter((row) => row.status !== 'success').length)
    return cells
  })

  return [header, ...body]
}

function notesRows(meta: ExamExportMeta): Array<Array<string | number>> {
  return [
    ['换算说明'],
    ['考试类型', meta.examTypeLabel],
    ['地区', meta.regionName],
    ['标准名称', meta.standardTitle],
    ['适用年份', meta.yearLabel],
    ['标准状态', meta.statusLabel],
    ['官方来源', meta.sourceTitle],
    ['来源链接', meta.sourceUrl ?? ''],
    ['导出时间', meta.exportedAt],
    [],
    ['说明', '换算结果依据所选评分标准计算。未覆盖原始 Excel 文件。导入成绩不会写入学生档案或体育测试记录。']
  ]
}

export function buildExamExportSheets(
  rows: BatchAssessmentRow[],
  meta: ExamExportMeta,
  layout: ExamBatchLayout
): ExportSheet[] {
  const detail = [detailHeaders(), ...rows.map(detailRow)]
  const errors = [detailHeaders(), ...rows.filter((row) => row.status !== 'success').map(detailRow)]
  const summary = layout === 'wide' || rows.length > 0 ? summaryRows(rows) : [['学号', '姓名', '班级', '性别', '成功项目数', '异常项目数']]

  return [
    { name: '成绩汇总', rows: summary },
    { name: '成绩明细', rows: detail },
    { name: '异常记录', rows: errors },
    { name: '换算说明', rows: notesRows(meta) }
  ]
}

export function defaultExportFileName(meta: ExamExportMeta): string {
  return `${meta.fileBaseName}.xlsx`
}
