import {
  FEMALE_GENDER_VALUES,
  lookupHeaderAlias,
  MALE_GENDER_VALUES,
  UNSPECIFIED_GENDER_VALUES
} from './detectAliases'
import type { ImportColumn, ImportPreviewRow, ImportRowStatus, StudentImportMapping } from './importTypes'
import type { IncomingStudentRow } from './rosterTypes'
import type { StudentGender } from './types'

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

  function findField(field: 'name' | 'studentNo' | 'gender' | 'className' | 'notes', allowSerial = false): number | null {
    const match = columns.find((column) => {
      if (used.has(column.index)) {
        return false
      }
      const alias = lookupHeaderAlias(column.title)
      if (!alias) {
        return false
      }
      if (alias.field === field) {
        return true
      }
      return allowSerial && alias.field === 'serial' && field === 'studentNo'
    })
    if (!match) {
      return null
    }
    used.add(match.index)
    return match.index
  }

  const studentNo = findField('studentNo')
  return {
    className: findField('className'),
    name: findField('name'),
    studentNo: studentNo ?? findField('studentNo', true),
    gender: findField('gender'),
    notes: findField('notes')
  }
}

export function parseImportedGender(raw: string): { gender: StudentGender; warning: string | null } {
  const value = raw.replace(/\u3000/g, ' ').trim()
  const lowered = value.toLowerCase()

  if (UNSPECIFIED_GENDER_VALUES.has(value) || UNSPECIFIED_GENDER_VALUES.has(lowered)) {
    return { gender: 'unspecified', warning: null }
  }

  if (MALE_GENDER_VALUES.has(value) || MALE_GENDER_VALUES.has(lowered)) {
    return { gender: 'male', warning: null }
  }

  if (FEMALE_GENDER_VALUES.has(value) || FEMALE_GENDER_VALUES.has(lowered)) {
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

export function buildIncomingStudentRows(
  dataRows: Array<{ excelRow: number; cells: string[] }>,
  mapping: StudentImportMapping
): IncomingStudentRow[] {
  return dataRows.map((row) => {
    const genderResult = parseImportedGender(cellAt(row.cells, mapping.gender))
    return {
      excelRow: row.excelRow,
      classRaw: cellAt(row.cells, mapping.className),
      studentNo: cellAt(row.cells, mapping.studentNo),
      name: cellAt(row.cells, mapping.name),
      gender: genderResult.gender,
      notes: cellAt(row.cells, mapping.notes)
    }
  })
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
    className: readIndex('className'),
    studentNo: readIndex('studentNo'),
    name: readIndex('name'),
    gender: readIndex('gender'),
    notes: readIndex('notes')
  }

  const chosen = [mapping.className, mapping.studentNo, mapping.name, mapping.gender, mapping.notes].filter(
    (index): index is number => index !== null
  )
  if (new Set(chosen).size !== chosen.length) {
    throw new Error('同一列不能映射到多个字段')
  }

  return mapping
}
