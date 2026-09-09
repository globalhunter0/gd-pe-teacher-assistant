import { DEFAULT_ACADEMIC_YEAR, type ClassRecord, type Semester } from '../class/types'
import { findExactClass, namesEqual, parseClassLabel } from './classLabel'
import type { StudentRecord } from './types'
import type {
  ClassGroupMatch,
  ClassRosterPreview,
  IncomingStudentRow,
  RosterClassChoice,
  RosterCommitResult,
  RosterIdFactory,
  RosterLine,
  RosterPreviewResult,
  RosterResolutions,
  RosterRowChoice
} from './rosterTypes'

function emptyResolutions(): RosterResolutions {
  return { classChoices: {}, rowChoices: {} }
}

function countKinds(lines: RosterLine[]): Pick<ClassRosterPreview, 'keep' | 'create' | 'remove' | 'update' | 'conflict'> {
  return {
    keep: lines.filter((item) => item.kind === 'keep').length,
    create: lines.filter((item) => item.kind === 'create').length,
    remove: lines.filter((item) => item.kind === 'remove').length,
    update: lines.filter((item) => item.kind === 'update').length,
    conflict: lines.filter((item) => item.kind === 'conflict' || item.kind === 'suspect_transfer').length
  }
}

function fieldsChanged(existing: StudentRecord, incoming: IncomingStudentRow): boolean {
  return (
    !namesEqual(existing.name, incoming.name) ||
    existing.studentNo !== incoming.studentNo ||
    existing.gender !== incoming.gender ||
    existing.notes !== incoming.notes ||
    existing.status !== 'active'
  )
}

function groupIncoming(
  rows: IncomingStudentRow[],
  classes: ReadonlyArray<ClassRecord>,
  academicYear: string,
  semester: Semester,
  classChoices: Record<string, RosterClassChoice>
): { match: ClassGroupMatch; rows: IncomingStudentRow[] }[] {
  const buckets = new Map<string, IncomingStudentRow[]>()
  for (const row of rows) {
    const parsed = parseClassLabel(row.classRaw)
    const groupKey = parsed.parseable
      ? `${parsed.grade}|${parsed.className}|${academicYear}|${semester}`
      : `raw|${parsed.raw}|${academicYear}|${semester}`
    const list = buckets.get(groupKey) ?? []
    list.push(row)
    buckets.set(groupKey, list)
  }

  return [...buckets.entries()].map(([groupKey, groupRows]) => {
    const sample = groupRows[0]
    const parsed = parseClassLabel(sample.classRaw)
    const choice = classChoices[groupKey]
    let match: ClassGroupMatch = {
      groupKey,
      classRaw: parsed.raw,
      grade: parsed.grade,
      className: parsed.className,
      academicYear,
      semester,
      match: 'confirm'
    }

    if (choice?.action === 'existing' && choice.classId) {
      match = { ...match, match: 'existing', existingId: choice.classId, grade: parsed.grade }
    } else if (choice?.action === 'create' && choice.grade && choice.className) {
      match = {
        ...match,
        match: 'create',
        grade: choice.grade,
        className: choice.className
      }
    } else if (parsed.parseable && parsed.grade) {
      const existing = findExactClass(classes, parsed.grade, parsed.className, academicYear, semester)
      if (existing) {
        match = { ...match, match: 'existing', existingId: existing.id, grade: parsed.grade }
      } else {
        match = { ...match, match: 'create', grade: parsed.grade }
      }
    }

    return { match, rows: groupRows }
  })
}

function reconcileGroup(
  groupRows: IncomingStudentRow[],
  classId: string | undefined,
  students: ReadonlyArray<StudentRecord>,
  rowChoices: Record<number, RosterRowChoice>
): RosterLine[] {
  const lines: RosterLine[] = []
  const noCounts = new Map<string, number>()
  for (const row of groupRows) {
    if (row.studentNo !== '') {
      noCounts.set(row.studentNo, (noCounts.get(row.studentNo) ?? 0) + 1)
    }
  }

  const matchedIds = new Set<string>()
  const currentActive = classId
    ? students.filter((item) => item.classId === classId && item.status === 'active')
    : []

  for (const row of groupRows) {
    const choice = rowChoices[row.excelRow]
    if (row.name === '') {
      lines.push({ kind: 'conflict', excelRow: row.excelRow, incoming: row, message: '姓名不能为空' })
      continue
    }
    if (row.studentNo !== '' && (noCounts.get(row.studentNo) ?? 0) > 1) {
      lines.push({
        kind: 'conflict',
        excelRow: row.excelRow,
        incoming: row,
        message: `Excel 内学号重复：${row.studentNo}`
      })
      continue
    }

    if (choice?.action === 'keep-existing' && choice.studentId) {
      matchedIds.add(choice.studentId)
      lines.push({
        kind: 'keep',
        excelRow: row.excelRow,
        existingId: choice.studentId,
        incoming: row,
        preserveExisting: true,
        message: '已跳过该行，保留原学生'
      })
      continue
    }

    if (choice?.action === 'create') {
      lines.push({ kind: 'create', excelRow: row.excelRow, incoming: row, message: '作为新学生' })
      continue
    }

    if ((choice?.action === 'transfer' || choice?.action === 'update') && choice.studentId) {
      const existing = students.find((item) => item.id === choice.studentId)
      if (!existing) {
        lines.push({ kind: 'conflict', excelRow: row.excelRow, incoming: row, message: '指定学生不存在' })
        continue
      }
      matchedIds.add(existing.id)
      const kind = choice.action === 'transfer' || fieldsChanged(existing, row) || existing.classId !== classId ? 'update' : 'keep'
      lines.push({
        kind,
        excelRow: row.excelRow,
        existingId: existing.id,
        incoming: row,
        message: choice.action === 'transfer' ? '确认转班' : '确认同一人并更新'
      })
      continue
    }

    if (row.studentNo !== '') {
      const sameClass = classId
        ? students.filter(
            (item) => item.classId === classId && item.studentNo === row.studentNo && item.status !== 'deleted'
          )
        : []
      if (sameClass.length === 1) {
        const existing = sameClass[0]
        if (!namesEqual(existing.name, row.name)) {
          lines.push({
            kind: 'conflict',
            excelRow: row.excelRow,
            existingId: existing.id,
            incoming: row,
            message: `学号 ${row.studentNo} 已存在，但姓名不同（现有：${existing.name}）`
          })
          continue
        }
        matchedIds.add(existing.id)
        const kind = fieldsChanged(existing, row) ? 'update' : 'keep'
        lines.push({
          kind,
          excelRow: row.excelRow,
          existingId: existing.id,
          incoming: row,
          message: kind === 'update' ? '信息更新或恢复当前名单' : '保留'
        })
        continue
      }
      if (sameClass.length > 1) {
        lines.push({
          kind: 'conflict',
          excelRow: row.excelRow,
          incoming: row,
          message: `班内学号 ${row.studentNo} 不唯一`
        })
        continue
      }

      const cross = students.filter(
        (item) =>
          item.status !== 'deleted' &&
          (!classId || item.classId !== classId) &&
          item.studentNo === row.studentNo &&
          namesEqual(item.name, row.name)
      )
      if (cross.length === 1) {
        const existing = cross[0]
        lines.push({
          kind: 'suspect_transfer',
          excelRow: row.excelRow,
          existingId: existing.id,
          incoming: row,
          message: '疑似已有学生，请确认是否转班',
          suspect: {
            studentId: existing.id,
            fromClassId: existing.classId,
            name: existing.name,
            studentNo: existing.studentNo
          }
        })
        continue
      }
      if (cross.length > 1) {
        lines.push({
          kind: 'conflict',
          excelRow: row.excelRow,
          incoming: row,
          message: '多个班级存在相同学号和姓名，无法自动判断'
        })
        continue
      }

      lines.push({ kind: 'create', excelRow: row.excelRow, incoming: row, message: '新增' })
      continue
    }

    if (!classId) {
      lines.push({ kind: 'create', excelRow: row.excelRow, incoming: row, message: '新增到新班级' })
      continue
    }

    const emptyCandidates = currentActive.filter(
      (item) =>
        item.studentNo === '' &&
        !matchedIds.has(item.id) &&
        namesEqual(item.name, row.name) &&
        item.gender === row.gender &&
        item.gender !== 'unspecified' &&
        row.gender !== 'unspecified'
    )
    const sameNameExcel = groupRows.filter(
      (item) => item.studentNo === '' && namesEqual(item.name, row.name) && item.gender === row.gender
    )
    if (emptyCandidates.length === 1 && sameNameExcel.length === 1) {
      const existing = emptyCandidates[0]
      matchedIds.add(existing.id)
      const kind = fieldsChanged(existing, row) ? 'update' : 'keep'
      lines.push({
        kind,
        excelRow: row.excelRow,
        existingId: existing.id,
        incoming: row,
        message: kind === 'update' ? '空学号唯一匹配，信息更新' : '空学号唯一匹配，保留'
      })
      continue
    }

    lines.push({
      kind: 'conflict',
      excelRow: row.excelRow,
      incoming: row,
      message: '空学号无法可靠确认身份，请人工确认'
    })
  }

  if (classId) {
    for (const existing of currentActive) {
      if (matchedIds.has(existing.id)) {
        continue
      }
      const claimed = lines.some((line) => line.existingId === existing.id && line.kind !== 'conflict')
      if (claimed) {
        continue
      }
      lines.push({
        kind: 'remove',
        existingId: existing.id,
        message: '移出当前名单'
      })
    }
  }

  return lines
}

export function buildRosterPreview(
  rows: IncomingStudentRow[],
  classes: ReadonlyArray<ClassRecord>,
  students: ReadonlyArray<StudentRecord>,
  options: {
    fileName: string
    sheetName: string
    headerRowNumber: number
    academicYear?: string
    semester?: Semester
    resolutions?: RosterResolutions
  }
): RosterPreviewResult {
  const academicYear = options.academicYear ?? DEFAULT_ACADEMIC_YEAR
  const semester = options.semester ?? '第一学期'
  const resolutions = options.resolutions ?? emptyResolutions()
  const grouped = groupIncoming(rows, classes, academicYear, semester, resolutions.classChoices)

  const groups: ClassRosterPreview[] = grouped.map(({ match, rows: groupRows }) => {
    const classId = match.existingId
    const currentActiveCount = classId
      ? students.filter((item) => item.classId === classId && item.status === 'active').length
      : 0
    const validExcel = groupRows.filter((item) => item.name !== '' && item.classRaw.trim() !== '')
    const lines = reconcileGroup(groupRows, classId, students, resolutions.rowChoices)
    const counts = countKinds(lines)
    const classLabel =
      match.grade && match.className
        ? `${match.grade} ${match.className}`
        : match.classRaw || '未识别班级'

    return {
      groupKey: match.groupKey,
      classLabel,
      match,
      currentActiveCount,
      excelCount: validExcel.length,
      ...counts,
      lines
    }
  })

  const claimedIds = new Set<string>()
  for (const group of groups) {
    for (const line of group.lines) {
      if (
        line.existingId &&
        (line.kind === 'keep' || line.kind === 'update' || line.kind === 'create')
      ) {
        claimedIds.add(line.existingId)
      }
    }
  }
  for (const group of groups) {
    const filtered = group.lines.filter(
      (line) => !(line.kind === 'remove' && line.existingId && claimedIds.has(line.existingId))
    )
    if (filtered.length !== group.lines.length) {
      const counts = countKinds(filtered)
      group.lines = filtered
      group.keep = counts.keep
      group.create = counts.create
      group.remove = counts.remove
      group.update = counts.update
      group.conflict = counts.conflict
    }
  }

  const totals = {
    keep: groups.reduce((sum, item) => sum + item.keep, 0),
    create: groups.reduce((sum, item) => sum + item.create, 0),
    remove: groups.reduce((sum, item) => sum + item.remove, 0),
    update: groups.reduce((sum, item) => sum + item.update, 0),
    conflict: groups.reduce((sum, item) => sum + item.conflict, 0),
    classesToCreate: groups.filter((item) => item.match.match === 'create').length
  }

  const classUnresolved = groups.some((item) => item.match.match === 'confirm')
  const canCommit = !classUnresolved && totals.conflict === 0 && groups.length > 0

  return {
    fileName: options.fileName,
    sheetName: options.sheetName,
    headerRowNumber: options.headerRowNumber,
    academicYear,
    semester,
    canCommit,
    totals,
    groups
  }
}

function defaultIds(): RosterIdFactory {
  return {
    createClassId: () => `class-${crypto.randomUUID()}`,
    createStudentId: () => `student-${crypto.randomUUID()}`,
    now: () => new Date().toISOString()
  }
}

export function applyRosterSync(
  rows: IncomingStudentRow[],
  classes: ReadonlyArray<ClassRecord>,
  students: ReadonlyArray<StudentRecord>,
  options: {
    academicYear?: string
    semester?: Semester
    resolutions?: RosterResolutions
    ids?: RosterIdFactory
  } = {}
): RosterCommitResult {
  const preview = buildRosterPreview(rows, classes, students, {
    fileName: '',
    sheetName: '',
    headerRowNumber: 1,
    academicYear: options.academicYear,
    semester: options.semester,
    resolutions: options.resolutions
  })
  if (!preview.canCommit) {
    throw new Error('仍有班级匹配或学生身份冲突未确认，不能写入')
  }

  const ids = options.ids ?? defaultIds()
  const now = ids.now()
  const nextClasses = [...classes]
  const classIdByGroup = new Map<string, string>()
  let createdClassCount = 0

  for (const group of preview.groups) {
    if (group.match.match === 'existing' && group.match.existingId) {
      classIdByGroup.set(group.groupKey, group.match.existingId)
      continue
    }
    if (group.match.match !== 'create' || !group.match.grade || !group.match.className) {
      throw new Error('班级尚未确认，不能写入')
    }
    const duplicate = findExactClass(
      nextClasses,
      group.match.grade,
      group.match.className,
      group.match.academicYear,
      group.match.semester
    )
    if (duplicate) {
      classIdByGroup.set(group.groupKey, duplicate.id)
      continue
    }
    const created: ClassRecord = {
      id: ids.createClassId(),
      className: group.match.className,
      grade: group.match.grade,
      academicYear: group.match.academicYear,
      semester: group.match.semester,
      studentCount: 0,
      notes: '',
      status: 'active',
      createdAt: now,
      updatedAt: now
    }
    nextClasses.push(created)
    classIdByGroup.set(group.groupKey, created.id)
    createdClassCount += 1
  }

  const nextById = new Map(students.map((item) => [item.id, { ...item }]))
  let createdStudentCount = 0
  let updatedStudentCount = 0
  let removedFromRosterCount = 0
  const claimedExistingIds = new Set<string>()

  for (const group of preview.groups) {
    const classId = classIdByGroup.get(group.groupKey)
    if (!classId) {
      throw new Error('班级编号缺失')
    }
    for (const line of group.lines) {
      if ((line.kind === 'keep' || line.kind === 'update') && line.existingId) {
        const current = nextById.get(line.existingId)
        if (!current) {
          throw new Error('匹配到的学生不存在')
        }
        claimedExistingIds.add(line.existingId)
        if (line.preserveExisting || !line.incoming) {
          continue
        }
        const next: StudentRecord = {
          ...current,
          classId,
          studentNo: line.incoming.studentNo,
          name: line.incoming.name,
          gender: line.incoming.gender,
          notes: line.incoming.notes,
          status: 'active',
          updatedAt: now
        }
        nextById.set(line.existingId, next)
        claimedExistingIds.add(line.existingId)
        if (line.kind === 'update' || current.classId !== classId || current.status !== 'active') {
          updatedStudentCount += 1
        }
        continue
      }

      if (line.kind === 'create' && line.incoming) {
        const created: StudentRecord = {
          id: ids.createStudentId(),
          classId,
          studentNo: line.incoming.studentNo,
          name: line.incoming.name,
          gender: line.incoming.gender,
          status: 'active',
          notes: line.incoming.notes,
          createdAt: now,
          updatedAt: now
        }
        nextById.set(created.id, created)
        createdStudentCount += 1
      }
    }
  }

  for (const group of preview.groups) {
    for (const line of group.lines) {
      if (line.kind !== 'remove' || !line.existingId) {
        continue
      }
      if (claimedExistingIds.has(line.existingId)) {
        continue
      }
      const current = nextById.get(line.existingId)
      if (!current) {
        continue
      }
      nextById.set(line.existingId, { ...current, status: 'transferred', updatedAt: now })
      removedFromRosterCount += 1
    }
  }

  return {
    classes: nextClasses,
    students: [...nextById.values()],
    createdClassCount,
    createdStudentCount,
    updatedStudentCount,
    removedFromRosterCount
  }
}
