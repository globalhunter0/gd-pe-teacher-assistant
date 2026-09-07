import { itemSupportsAutoScore } from '../examStandard/score'
import type { ExamItemDefinition, ExamStandard } from '../examStandard/types'
import { expectedRawFormat } from './parseRaw'
import type { ExamWorkbookSavePayload } from './types'

export const EXAM_TEMPLATE_VERSION = 'v0.10.1'
export const EXAM_TEMPLATE_SCORE_SHEET = '成绩登记'
export const EXAM_TEMPLATE_GUIDE_SHEET = '填写说明'
export const EXAM_TEMPLATE_IDENTITY_HEADERS = ['姓名', '学号', '班级', '性别', '考生类别'] as const
export const EXAM_TEMPLATE_CANDIDATE_HEADER = '考生类别'

export interface ExamTemplateItemColumn {
  itemKey: string
  header: string
  sampleItem: ExamItemDefinition
}

export interface ExamTemplateStudentRow {
  name: string
  studentNo: string
  className: string
  genderLabel: string
}

export function templateItemColumns(standard: ExamStandard): ExamTemplateItemColumn[] {
  const supported = standard.items.filter((item) => itemSupportsAutoScore(item))
  const grouped = new Map<string, ExamItemDefinition[]>()
  for (const item of supported) {
    const list = grouped.get(item.itemKey) ?? []
    list.push(item)
    grouped.set(item.itemKey, list)
  }
  return [...grouped.entries()].map(([itemKey, items]) => {
    const sampleItem = items.find((item) => item.gender === 'all') ?? items[0]
    return { itemKey, header: sampleItem.name, sampleItem }
  })
}

export function examTemplateScoreHeaders(standard: ExamStandard): string[] {
  return [...EXAM_TEMPLATE_IDENTITY_HEADERS, ...templateItemColumns(standard).map((column) => column.header)]
}

export function isOfficialExamTemplateHeaders(titles: string[]): boolean {
  return EXAM_TEMPLATE_IDENTITY_HEADERS.every((header, index) => titles[index] === header)
}

export function sanitizeTemplateFileName(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '').trim()
}

export function examTemplateFileBaseName(standard: ExamStandard, className?: string): string {
  const year =
    standard.yearFrom === standard.yearTo ? String(standard.yearFrom) : `${standard.yearFrom}-${standard.yearTo}`
  if (standard.examType === 'gaokao_sports') {
    const base = className
      ? `体育成绩登记表_${className}_广东体育高考_${year}`
      : `体育成绩登记模板_广东体育高考_${year}`
    return sanitizeTemplateFileName(base)
  }
  const region = standard.cityName || '地区'
  const base = className ? `体育成绩登记表_${className}_${region}_${year}` : `体育成绩登记模板_${region}_${year}`
  return sanitizeTemplateFileName(base)
}

function exampleValues(item: ExamItemDefinition): string[] {
  if (item.valueType === 'time' && item.timeInputMode === 'minutesSeconds') {
    return ['3.39', '3:39', '219']
  }
  if (item.valueType === 'time') {
    return item.itemKey.includes('50') ? ['7.35'] : ['11.48']
  }
  if (item.unit === 'times') {
    return ['154']
  }
  if (item.itemKey === 'standing-long-jump') {
    return ['2.35']
  }
  return ['8.6']
}

function buildGuideRows(standard: ExamStandard, columns: ExamTemplateItemColumn[], generatedAt: string): Array<Array<string | number>> {
  const year =
    standard.yearFrom === standard.yearTo ? String(standard.yearFrom) : `${standard.yearFrom}-${standard.yearTo}`
  const region = standard.examType === 'gaokao_sports' ? '广东省' : standard.cityName
  const rows: Array<Array<string | number>> = [
    ['模板版本', EXAM_TEMPLATE_VERSION],
    ['生成标准', standard.title],
    ['地区', region],
    ['年份', year],
    ['生成时间', generatedAt],
    [],
    ['填写说明'],
    ['1. 不要修改第一行字段名称'],
    ['2. 不要合并单元格'],
    ['3. 每名学生一行'],
    ['4. 姓名必填'],
    ['5. 性别填写“男”或“女”'],
    ['6. 考生类别默认“正常”'],
    ['7. 每个体育项目一个独立成绩列'],
    ['8. 不参加的项目保持空白'],
    ['9. 不要在成绩格填写“1000米”等项目名称'],
    ['10. 不要在成绩中加入“秒、次、米”等单位'],
    [],
    ['项目填写示例（仅列出当前可自动换算项目）']
  ]
  for (const column of columns) {
    rows.push([column.header, expectedRawFormat(column.sampleItem), exampleValues(column.sampleItem).join(' 或 ')])
  }
  return rows
}

export function buildExamTemplatePayload(input: {
  standard: ExamStandard
  students?: ExamTemplateStudentRow[]
  generatedAt?: string
  className?: string
}): ExamWorkbookSavePayload {
  const columns = templateItemColumns(input.standard)
  const headers = [...EXAM_TEMPLATE_IDENTITY_HEADERS, ...columns.map((column) => column.header)]
  const scoreRows: Array<Array<string | number>> = [headers]
  const students = input.students ?? []
  for (const student of students) {
    scoreRows.push([student.name, student.studentNo, student.className, student.genderLabel, '正常', ...columns.map(() => '')])
  }
  return {
    defaultFileName: `${examTemplateFileBaseName(input.standard, input.className)}.xlsx`,
    sheets: [
      { name: EXAM_TEMPLATE_SCORE_SHEET, rows: scoreRows },
      {
        name: EXAM_TEMPLATE_GUIDE_SHEET,
        rows: buildGuideRows(input.standard, columns, input.generatedAt ?? new Date().toISOString())
      }
    ]
  }
}
