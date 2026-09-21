import type { ExamWorkbookSavePayload } from '../examBatch/types'
import { listBuiltinExamStandards } from '../examStandard/catalog'
import type { ExamStandard } from '../examStandard/types'
import { STUDENT_GENDER_LABELS } from '../student'
import { SCORE_BAND_LABELS, classifyScoreBand, resolveExamItemFullScore } from '../statistics/analytics'
import { formatTestScore } from '../statistics/tests'
import { BUILTIN_TEST_ITEMS } from './builtinItems'
import { isGenderLinkedSession, resolveActualTestItem, sessionDisplayItemName } from './groupedItems'
import { formatPeTestItemScoreText } from './scoringBasis'
import { sortQuickEntryRecords } from './quickEntry/nav'
import { isClassroomPeTest, testUnitDisplay, type PETestRecord, type PETestSession, type TestItem } from './types'

export const PE_TEST_EXPORT_HEADERS = [
  '序号',
  '姓名',
  '学号',
  '班级',
  '性别',
  '测试日期',
  '测试项目',
  '原始成绩',
  '单位',
  '换算分',
  '等级',
  '状态',
  '备注'
] as const

export type PeTestExportStatusLabel = '已测' | '未测' | '缺考' | '免考' | '异常'

export interface PeTestExportRow {
  序号: number
  姓名: string
  学号: string
  班级: string
  性别: string
  测试日期: string
  测试项目: string
  原始成绩: string
  单位: string
  换算分: string
  等级: string
  状态: PeTestExportStatusLabel
  备注: string
}

/** Excel formula injection：用户文本以 = + - @ 开头时加前缀，避免被当公式。 */
export function escapeExcelText(value: string): string {
  if (value === '') {
    return value
  }
  const first = value[0]
  if (first === '=' || first === '+' || first === '-' || first === '@') {
    return `'${value}`
  }
  return value
}

export function sanitizePeTestExportFileName(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '').trim()
}

export function peTestExportClassLabel(session: Pick<PETestSession, 'gradeSnapshot' | 'classNameSnapshot'>): string {
  return `${session.gradeSnapshot}${session.classNameSnapshot}`.trim() || '未分班'
}

export function peTestExportStatusLabel(status: PETestRecord['status']): PeTestExportStatusLabel {
  if (status === 'pending') {
    return '未测'
  }
  if (status === 'absent') {
    return '缺考'
  }
  if (status === 'exempt') {
    return '免考'
  }
  if (status === 'invalid') {
    return '异常'
  }
  return '已测'
}

export function peTestExportUnitLabel(
  session: Pick<PETestSession, 'unitSnapshot' | 'customUnitLabelSnapshot' | 'valueTypeSnapshot' | 'timeInputModeSnapshot'>,
  testItem: TestItem | undefined,
  status: PETestRecord['status']
): string {
  if (status === 'pending' || status === 'absent' || status === 'exempt') {
    return '—'
  }
  const timeMode = testItem?.timeInputMode ?? session.timeInputModeSnapshot
  if (session.valueTypeSnapshot === 'time' && timeMode === 'minutesSeconds') {
    return ''
  }
  if (session.valueTypeSnapshot === 'time') {
    return '秒'
  }
  const unit = testUnitDisplay(
    testItem?.unit ?? session.unitSnapshot,
    testItem?.customUnitLabel ?? session.customUnitLabelSnapshot
  )
  return unit || '—'
}

export function peTestExportBandLabel(
  session: Pick<PETestSession, 'examStandardId' | 'testItemId'>,
  record: PETestRecord,
  standards: ReadonlyArray<ExamStandard>
): string {
  if (record.status !== 'valid' || record.examScore === null) {
    return '—'
  }
  const full = resolveExamItemFullScore(session, record, standards)
  if (full === null) {
    return '—'
  }
  return SCORE_BAND_LABELS[classifyScoreBand(record.examScore, full)]
}

export function peTestExportRawText(
  session: PETestSession,
  record: PETestRecord,
  testItem: TestItem | undefined
): string {
  if (record.status === 'pending' || record.status === 'absent' || record.status === 'exempt' || record.rawValue === null) {
    return '—'
  }
  return formatTestScore(record.rawValue, session, testItem)
}

export function peTestExportScoreText(record: PETestRecord): string {
  if (record.status === 'pending' || record.status === 'absent' || record.status === 'exempt') {
    return '—'
  }
  return formatPeTestItemScoreText(record)
}

export function buildPeTestSessionExportRows(
  session: PETestSession,
  options: {
    testItem?: TestItem
    items?: ReadonlyArray<TestItem>
    standards?: ReadonlyArray<ExamStandard>
  } = {}
): PeTestExportRow[] {
  const catalog = options.items ?? BUILTIN_TEST_ITEMS
  const standards = options.standards ?? listBuiltinExamStandards()
  const classLabel = peTestExportClassLabel(session)
  const sorted = sortQuickEntryRecords(session.records)

  return sorted.map((record, index) => {
    const actual = resolveActualTestItem(session, record, catalog)
    const resolvedItem = actual.ok ? actual.item : options.testItem
    const itemName = actual.ok ? actual.item.name : sessionDisplayItemName(session)
    const status = peTestExportStatusLabel(record.status)

    return {
      序号: index + 1,
      姓名: escapeExcelText(record.nameSnapshot),
      学号: escapeExcelText(record.studentNoSnapshot),
      班级: escapeExcelText(classLabel),
      性别: STUDENT_GENDER_LABELS[record.genderSnapshot] ?? '未填写',
      测试日期: session.date,
      测试项目: escapeExcelText(itemName),
      原始成绩: peTestExportRawText(session, record, resolvedItem),
      单位: peTestExportUnitLabel(session, resolvedItem, record.status),
      换算分: peTestExportScoreText(record),
      等级: peTestExportBandLabel(session, record, standards),
      状态: status,
      备注: escapeExcelText(record.note ?? '')
    }
  })
}

export function peTestExportFileBaseName(
  session: PETestSession,
  _options: { items?: ReadonlyArray<TestItem> } = {}
): string {
  const classLabel = peTestExportClassLabel(session)
  const itemPart = isGenderLinkedSession(session)
    ? '体育测试'
    : sessionDisplayItemName(session) || session.testItemNameSnapshot || '体育测试'
  const originPart = isClassroomPeTest(session) ? '课堂小测_' : ''
  return sanitizePeTestExportFileName(`${classLabel}_${originPart}${itemPart}_${session.date}`)
}

export function buildPeTestSessionExportPayload(
  session: PETestSession,
  options: {
    testItem?: TestItem
    items?: ReadonlyArray<TestItem>
    standards?: ReadonlyArray<ExamStandard>
  } = {}
): ExamWorkbookSavePayload {
  const rows = buildPeTestSessionExportRows(session, options)
  const dataRows: Array<Array<string | number>> = [
    [...PE_TEST_EXPORT_HEADERS],
    ...rows.map((row) => PE_TEST_EXPORT_HEADERS.map((header) => row[header]))
  ]
  return {
    defaultFileName: `${peTestExportFileBaseName(session, options)}.xlsx`,
    sheets: [{ name: isClassroomPeTest(session) ? '课堂小测' : '成绩表', rows: dataRows }]
  }
}

/** 纯读取：导出构造不得改动输入 session。 */
export function cloneSessionForExportGuard(session: PETestSession): PETestSession {
  return {
    ...session,
    records: session.records.map((record) => ({ ...record }))
  }
}
