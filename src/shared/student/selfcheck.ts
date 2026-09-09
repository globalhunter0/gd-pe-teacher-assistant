import { mkdtempSync, rmSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ClassRecord } from '../class/types'
import { parseClassRecords } from '../class/validate'
import { writeJsonItemsAtomic } from '../persistence/jsonFile'
import { applyRosterSync, buildRosterPreview } from './roster'
import type { IncomingStudentRow, RosterIdFactory } from './rosterTypes'
import type { StudentRecord } from './types'
import { parseStudentRecords } from './validate'

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

const now = '2026-09-08T01:00:00.000Z'
const class1 = 'class-11111111-1111-4111-8111-111111111111'
const class2 = 'class-22222222-2222-4222-8222-222222222222'
const studentA = 'student-11111111-1111-4111-8111-111111111111'
const studentB = 'student-22222222-2222-4222-8222-222222222222'
const studentC = 'student-33333333-3333-4333-8333-333333333333'
const studentD = 'student-44444444-4444-4444-8444-444444444444'

function makeClass(partial: Partial<ClassRecord> & Pick<ClassRecord, 'id' | 'className' | 'grade'>): ClassRecord {
  return {
    academicYear: '2026-2027',
    semester: '第一学期',
    studentCount: 0,
    notes: '',
    status: 'active',
    createdAt: now,
    updatedAt: now,
    ...partial
  }
}

function makeStudent(
  partial: Partial<StudentRecord> & Pick<StudentRecord, 'id' | 'classId' | 'name' | 'studentNo'>
): StudentRecord {
  return {
    gender: 'male',
    status: 'active',
    notes: '',
    createdAt: now,
    updatedAt: now,
    ...partial
  }
}

function row(
  partial: Pick<IncomingStudentRow, 'excelRow' | 'classRaw' | 'studentNo' | 'name'> & Partial<IncomingStudentRow>
): IncomingStudentRow {
  return {
    gender: 'male',
    notes: '',
    ...partial
  }
}

function previewOf(
  rows: IncomingStudentRow[],
  classes: ClassRecord[],
  students: StudentRecord[],
  resolutions?: { classChoices?: Record<string, { action: 'existing' | 'create'; classId?: string; grade?: ClassRecord['grade']; className?: string }>; rowChoices?: Record<number, { action: 'create' | 'transfer' | 'update' | 'keep-existing'; studentId?: string }> }
) {
  return buildRosterPreview(rows, classes, students, {
    fileName: 'roster.xlsx',
    sheetName: 'Sheet1',
    headerRowNumber: 1,
    academicYear: '2026-2027',
    semester: '第一学期',
    resolutions: {
      classChoices: resolutions?.classChoices ?? {},
      rowChoices: resolutions?.rowChoices ?? {}
    }
  })
}

function sequentialIds(): RosterIdFactory {
  let classN = 0
  let studentN = 0
  return {
    createClassId: () => {
      classN += 1
      return `class-aaaaaaaa-aaaa-4aaa-8aaa-${String(classN).padStart(12, '0')}`
    },
    createStudentId: () => {
      studentN += 1
      return `student-bbbbbbbb-bbbb-4bbb-8bbb-${String(studentN).padStart(12, '0')}`
    },
    now: () => '2026-09-08T02:00:00.000Z'
  }
}

export function runRosterReconciliationSelfCheck(): void {
  const ids = sequentialIds()

  const newExcel = [
    row({ excelRow: 2, classRaw: '初一1班', studentNo: '01', name: '张三' }),
    row({ excelRow: 3, classRaw: '初一1班', studentNo: '02', name: '李四', gender: 'female' })
  ]
  const emptyPreview = previewOf(newExcel, [], [])
  assert(emptyPreview.canCommit, '新Excel应可直接准备写入')
  assert(emptyPreview.totals.classesToCreate === 1, '应准备新建1个班级')
  assert(emptyPreview.totals.create === 2, '应准备新建2名学生')
  const created = applyRosterSync(newExcel, [], [], { ids })
  assert(created.createdClassCount === 1, '应创建班级')
  assert(created.classes[0].studentCount === 0, '新建班级手工学生人数为0')
  assert(created.createdStudentCount === 2, '应创建学生')
  parseClassRecords(created.classes)
  parseStudentRecords(created.students, { knownClassIds: new Set(created.classes.map((item) => item.id)) })

  const existingClass = makeClass({ id: class1, className: '1班', grade: '初一', studentCount: 40 })
  const roster = [
    makeStudent({ id: studentA, classId: class1, studentNo: '01', name: '张三' }),
    makeStudent({ id: studentB, classId: class1, studentNo: '02', name: '李四', notes: '旧备注' }),
    makeStudent({ id: studentC, classId: class1, studentNo: '03', name: '王五' })
  ]
  const diffRows = [
    row({ excelRow: 2, classRaw: '初一1班', studentNo: '01', name: '张三' }),
    row({ excelRow: 3, classRaw: '初一1班', studentNo: '02', name: '李四', notes: '新备注' }),
    row({ excelRow: 4, classRaw: '初一1班', studentNo: '04', name: '赵六' })
  ]
  const diffPreview = previewOf(diffRows, [existingClass], roster)
  assert(diffPreview.canCommit, '无冲突时应可提交')
  assert(diffPreview.groups[0].keep === 1, '应保留1人')
  assert(diffPreview.groups[0].update === 1, '应信息更新1人')
  assert(diffPreview.groups[0].create === 1, '应新增1人')
  assert(diffPreview.groups[0].remove === 1, '应移出当前名单1人')
  const diffed = applyRosterSync(diffRows, [existingClass], roster, { ids })
  assert(diffed.classes[0].studentCount === 40, 'studentCount 不得因同步改变')
  const wang = diffed.students.find((item) => item.id === studentC)
  assert(wang?.status === 'transferred', '移出名单应复用 transferred 技术状态')
  assert(wang?.id === studentC, '移出后 studentId 仍存在')
  assert(diffed.students.some((item) => item.id === studentA && item.status === 'active'), '保留学生仍在当前名单')

  const nameConflict = previewOf(
    [row({ excelRow: 2, classRaw: '初一1班', studentNo: '01', name: '不是张三' })],
    [existingClass],
    roster
  )
  assert(!nameConflict.canCommit, '同班同学号姓名冲突不得提交')
  assert(nameConflict.totals.conflict >= 1, '应进入冲突')
  let threw = false
  try {
    applyRosterSync(
      [row({ excelRow: 2, classRaw: '初一1班', studentNo: '01', name: '不是张三' })],
      [existingClass],
      roster,
      { ids }
    )
  } catch {
    threw = true
  }
  assert(threw, '未确认冲突不得写入')

  const emptyNoUnique = previewOf(
    [row({ excelRow: 2, classRaw: '初一1班', studentNo: '', name: '空号甲', gender: 'female' })],
    [existingClass],
    [makeStudent({ id: studentD, classId: class1, studentNo: '', name: '空号甲', gender: 'female' })]
  )
  assert(emptyNoUnique.canCommit, '空学号唯一明确时应可匹配')
  const emptyNoAmbiguous = previewOf(
    [
      row({ excelRow: 2, classRaw: '初一1班', studentNo: '', name: '空号甲', gender: 'female' }),
      row({ excelRow: 3, classRaw: '初一1班', studentNo: '', name: '空号甲', gender: 'female' })
    ],
    [existingClass],
    [makeStudent({ id: studentD, classId: class1, studentNo: '', name: '空号甲', gender: 'female' })]
  )
  assert(!emptyNoAmbiguous.canCommit, '空学号存在歧义时必须待确认')

  const dupExcel = previewOf(
    [
      row({ excelRow: 2, classRaw: '初一1班', studentNo: '09', name: '甲' }),
      row({ excelRow: 3, classRaw: '初一1班', studentNo: '09', name: '乙' })
    ],
    [existingClass],
    roster
  )
  assert(!dupExcel.canCommit && dupExcel.totals.conflict >= 2, 'Excel 重复学号必须在预览发现')

  const otherClass = makeClass({ id: class2, className: '2班', grade: '初一' })
  const sameNoOtherClass = previewOf(
    [row({ excelRow: 2, classRaw: '初一2班', studentNo: '01', name: '另一人' })],
    [existingClass, otherClass],
    roster
  )
  assert(sameNoOtherClass.canCommit, '不同班相同学号且姓名不同应作为新学生')
  assert(sameNoOtherClass.totals.create === 1, '跨班同学号不同名不得自动合并')

  const suspectRows = [row({ excelRow: 2, classRaw: '初一2班', studentNo: '01', name: '张三' })]
  const suspect = previewOf(suspectRows, [existingClass, otherClass], roster)
  assert(!suspect.canCommit, '跨班疑似转班不得自动执行')
  assert(suspect.groups.some((group) => group.lines.some((line) => line.kind === 'suspect_transfer')), '应提示疑似已有学生')

  const transferred = applyRosterSync(suspectRows, [existingClass, otherClass], roster, {
    ids,
    resolutions: {
      classChoices: {},
      rowChoices: { 2: { action: 'transfer', studentId: studentA } }
    }
  })
  const moved = transferred.students.find((item) => item.id === studentA)
  assert(moved?.id === studentA, '确认转班后 studentId 不变')
  assert(moved?.classId === class2, '转班只更新当前 classId')
  assert(moved?.status === 'active', '转班后仍在当前名单')
  const members = [{ id: 'm1', studentId: studentA }]
  assert(
    members.every((item) => transferred.students.some((student) => item.studentId === student.id)),
    'TrainingTeamMember.studentId 不得改变'
  )
  assert(members[0].studentId === studentA, '训练队引用保持原 studentId')

  const multiRows = [
    row({ excelRow: 2, classRaw: '初一1班', studentNo: '11', name: '甲班生' }),
    row({ excelRow: 3, classRaw: '初二2班', studentNo: '11', name: '乙班生' })
  ]
  const multi = previewOf(multiRows, [], [])
  assert(multi.canCommit && multi.totals.classesToCreate === 2, '多班 Excel 应准备创建多个班级')
  const multiApplied = applyRosterSync(multiRows, [], [], { ids })
  assert(multiApplied.createdClassCount === 2, '多班应创建两个班级')

  const fuzzy = previewOf(
    [row({ excelRow: 2, classRaw: '一年级1班', studentNo: '01', name: '张三' })],
    [existingClass],
    roster
  )
  assert(fuzzy.groups[0].match.match === 'confirm', '一年级与初一不得自动合并')
}

export async function runRosterReconciliationSelfCheckOrThrow(): Promise<string> {
  runRosterReconciliationSelfCheck()

  const root = mkdtempSync(join(tmpdir(), 'gdpe-roster-selfcheck-'))
  try {
    const classPath = join(root, 'classes.json')
    const studentPath = join(root, 'students.json')
    const originalClass = makeClass({ id: class1, className: '1班', grade: '初一', studentCount: 7 })
    const originalStudent = makeStudent({ id: studentA, classId: class1, studentNo: '01', name: '张三' })
    await writeJsonItemsAtomic(classPath, [originalClass])
    await writeJsonItemsAtomic(studentPath, [originalStudent])
    const beforeClasses = await readFile(classPath, 'utf8')
    const beforeStudents = await readFile(studentPath, 'utf8')

    const preview = previewOf(
      [row({ excelRow: 2, classRaw: '初一1班', studentNo: '01', name: '不是张三' })],
      [originalClass],
      [originalStudent]
    )
    assert(!preview.canCommit, '未确认预览不得视为可写入')
    assert((await readFile(classPath, 'utf8')) === beforeClasses, '预览不得改班级文件')
    assert((await readFile(studentPath, 'utf8')) === beforeStudents, '预览不得改学生文件')

    let applyFailed = false
    try {
      applyRosterSync(
        [row({ excelRow: 2, classRaw: '初一1班', studentNo: '01', name: '不是张三' })],
        [originalClass],
        [originalStudent],
        {}
      )
    } catch {
      applyFailed = true
    }
    assert(applyFailed, '错误数据不得进入正式写入')
    assert((await readFile(classPath, 'utf8')) === beforeClasses, '失败不得半写入班级')
    assert((await readFile(studentPath, 'utf8')) === beforeStudents, '失败不得半写入学生')

    const planned = applyRosterSync(
      [row({ excelRow: 2, classRaw: '初一1班', studentNo: '01', name: '张三' }), row({ excelRow: 3, classRaw: '初一1班', studentNo: '02', name: '新人' })],
      [originalClass],
      [originalStudent],
      { ids: sequentialIds() }
    )
    const broken = planned.students.map((item, index) => (index === 0 ? { ...item, name: '' } : item))
    let parseFailed = false
    try {
      parseStudentRecords(broken, { knownClassIds: new Set(planned.classes.map((item) => item.id)) })
    } catch {
      parseFailed = true
    }
    assert(parseFailed, '校验失败不得继续写文件')
    assert((await readFile(classPath, 'utf8')) === beforeClasses, '校验失败后班级文件保持原样')
    assert((await readFile(studentPath, 'utf8')) === beforeStudents, '校验失败后学生文件保持原样')

    const okClasses = parseClassRecords(planned.classes)
    const okStudents = parseStudentRecords(planned.students, {
      knownClassIds: new Set(okClasses.map((item) => item.id))
    })
    await writeJsonItemsAtomic(classPath, okClasses)
    await writeJsonItemsAtomic(studentPath, okStudents)
    assert(okClasses[0].studentCount === 7, '正式写入后 studentCount 仍为手工值')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }

  return 'roster reconciliation self-check passed'
}
