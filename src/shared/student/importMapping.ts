import type { StudentGender } from './types'
import type { ImportColumn, ImportPreviewRow, ImportRowStatus, StudentImportMapping } from './importTypes'

const STUDENT_NO_ALIASES = new Set(['学号', '编号', '学生编号', '班内编号', '序号'])
const NAME_ALIASES = new Set(['姓名', '学生姓名', '名字'])
const GENDER_ALIASES = new Set(['性别', '男女', '性别（男/女）'])
const NOTES_ALIASES = new Set(['备注', '说明', '特殊情况'])

const MALE_VALUES = new Set(['男', '男性', 'm', 'male', '1'])
const FEMALE_VALUES = new Set(['女', '女性', 'f', 'female', '2'])
const UNSPECIFIED_VALUES = new Set(['', '未填', '未知', '不详', '/', '-'])

export const IMPORT_UNMAPPED = -1

export function normalizeHeader(value: string): string {
  return value.replace(/\u3000/g, ' ').trim()
}

export function cellToDisplayString(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'string') {
    return value.replace(/\u3000/g, ' ').trim()
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (Number.isInteger(value)) {
      return String(value)
    }

    return String(value)
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  return String(value).replace(/\u3000/g, ' ').trim()
}

export function suggestImportMapping(columns: ImportColumn[]): StudentImportMapping {
  const used = new Set<number>()

  function findAlias(aliases: Set<string>): number | null {
    const match = columns.find((column) => !used.has(column.index) && aliases.has(normalizeHeader(column.title)))
    if (!match) {
      return null
    }

    used.add(match.index)
    return match.index
  }

  return {
    name: findAlias(NAME_ALIASES),
    studentNo: findAlias(STUDENT_NO_ALIASES),
    gender: findAlias(GENDER_ALIASES),
    notes: findAlias(NOTES_ALIASES)
  }
}

export function parseImportedGender(raw: string): { gender: StudentGender; warning: string | null } {
  const value = raw.replace(/\u3000/g, ' ').trim()
  const lowered = value.toLowerCase()

  if (UNSPECIFIED_VALUES.has(value) || UNSPECIFIED_VALUES.has(lowered)) {
    return { gender: 'unspecified', warning: null }
  }

  if (MALE_VALUES.has(value) || MALE_VALUES.has(lowered)) {
    return { gender: 'male', warning: null }
  }

  if (FEMALE_VALUES.has(value) || FEMALE_VALUES.has(lowered)) {
    return { gender: 'female', warning: null }
  }

  return {
    gender: 'unspecified',
    warning: `无法识别的性别“${value}”，已按未填写导入`
  }
}

function cellAt(cells: string[], index: number | null): string {
  if (index === null || index < 0) {
    return ''
  }

  return cells[index] ?? ''
}

export function buildImportPreviewRows(
  dataRows: Array<{ excelRow: number; cells: string[] }>,
  mapping: StudentImportMapping,
  existingStudentNos: ReadonlySet<string>
): ImportPreviewRow[] {
  if (mapping.name === null) {
    return dataRows.map((row) => ({
      excelRow: row.excelRow,
      studentNo: cellAt(row.cells, mapping.studentNo),
      name: '',
      gender: 'unspecified',
      notes: cellAt(row.cells, mapping.notes),
      status: 'error',
      message: '请映射姓名列'
    }))
  }

  const fileNos = new Map<string, number>()
  const parsed = dataRows.map((row) => {
    const studentNo = cellAt(row.cells, mapping.studentNo)
    const name = cellAt(row.cells, mapping.name)
    const genderRaw = cellAt(row.cells, mapping.gender)
    const notes = cellAt(row.cells, mapping.notes)
    const genderResult = parseImportedGender(genderRaw)

    if (studentNo !== '') {
      fileNos.set(studentNo, (fileNos.get(studentNo) ?? 0) + 1)
    }

    return {
      excelRow: row.excelRow,
      studentNo,
      name,
      gender: genderResult.gender,
      notes,
      genderWarning: genderResult.warning
    }
  })

  return parsed.map((row) => {
    if (row.name === '') {
      return {
        excelRow: row.excelRow,
        studentNo: row.studentNo,
        name: row.name,
        gender: row.gender,
        notes: row.notes,
        status: 'error' as ImportRowStatus,
        message: '姓名不能为空'
      }
    }

    if (row.studentNo !== '' && (fileNos.get(row.studentNo) ?? 0) > 1) {
      return {
        excelRow: row.excelRow,
        studentNo: row.studentNo,
        name: row.name,
        gender: row.gender,
        notes: row.notes,
        status: 'duplicate' as ImportRowStatus,
        message: `Excel 内学号重复：${row.studentNo}`
      }
    }

    if (row.studentNo !== '' && existingStudentNos.has(row.studentNo)) {
      return {
        excelRow: row.excelRow,
        studentNo: row.studentNo,
        name: row.name,
        gender: row.gender,
        notes: row.notes,
        status: 'duplicate' as ImportRowStatus,
        message: `该班级已有学号 ${row.studentNo}，未覆盖`
      }
    }

    if (row.genderWarning) {
      return {
        excelRow: row.excelRow,
        studentNo: row.studentNo,
        name: row.name,
        gender: row.gender,
        notes: row.notes,
        status: 'warning' as ImportRowStatus,
        message: row.genderWarning
      }
    }

    return {
      excelRow: row.excelRow,
      studentNo: row.studentNo,
      name: row.name,
      gender: row.gender,
      notes: row.notes,
      status: 'importable' as ImportRowStatus,
      message: ''
    }
  })
}

export function summarizeImportRows(rows: ImportPreviewRow[]): {
  totalRows: number
  importable: number
  warning: number
  error: number
  duplicate: number
} {
  return {
    totalRows: rows.length,
    importable: rows.filter((row) => row.status === 'importable').length,
    warning: rows.filter((row) => row.status === 'warning').length,
    error: rows.filter((row) => row.status === 'error').length,
    duplicate: rows.filter((row) => row.status === 'duplicate').length
  }
}

export function mappingFromPayload(input: unknown): StudentImportMapping {
  if (typeof input !== 'object' || input === null) {
    throw new Error('字段映射不正确')
  }

  const record = input as Record<string, unknown>

  function readIndex(key: string): number | null {
    const value = record[key]
    if (value === null || value === undefined || value === '' || value === IMPORT_UNMAPPED) {
      return null
    }

    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
      throw new Error('字段映射不正确')
    }

    return value
  }

  const mapping: StudentImportMapping = {
    studentNo: readIndex('studentNo'),
    name: readIndex('name'),
    gender: readIndex('gender'),
    notes: readIndex('notes')
  }

  const chosen = [mapping.studentNo, mapping.name, mapping.gender, mapping.notes].filter(
    (index): index is number => index !== null
  )
  if (new Set(chosen).size !== chosen.length) {
    throw new Error('同一列不能映射到多个字段')
  }

  return mapping
}
