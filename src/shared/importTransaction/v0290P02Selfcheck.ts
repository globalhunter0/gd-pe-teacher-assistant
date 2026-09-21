import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { listBuiltinExamStandards } from '../examStandard/catalog'
import { executeImportExamBatchToPeTests } from '../examBatch/peTestImport/execute'
import { buildExamBatchPeTestImportPayload } from '../examBatch/peTestImport/entry'
import { worksheetRowsToSnapshot } from '../examBatch/readSheet'
import { convertWorkbookExamBatch, detectWorkbookColumns } from '../examBatch/workbook'
import { emptyImportTransactionReport, runStagedJsonWrites } from '../importTransaction'
import { readJsonItemsFile, writeJsonItemsAtomic } from '../persistence/jsonFile'
import { BUILTIN_TEST_ITEMS } from '../peTest/builtinItems'
import type { PETestSession } from '../peTest/types'
import { applyScheduleSync, buildSchedulePreview, emptyScheduleResolutions } from '../schedule/reconcile'
import type { IncomingScheduleRow } from '../schedule/importTypes'
import { parseScheduleItems, scheduleSlotId } from '../schedule/validate'
import { applyRosterSync, buildRosterPreview } from '../student/roster'
import type { ClassRecord } from '../class/types'
import type { IncomingStudentRow, RosterIdFactory } from '../student/rosterTypes'
import type { StudentRecord } from '../student/types'
import { parseClassRecords } from '../class/validate'
import { parseStudentRecords } from '../student/validate'
import * as XLSX from 'xlsx'
import { runV0290P01IntegritySelfCheckOrThrow } from '../dataIntegrity/v0290P01Selfcheck'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function readSrc(relative: string): string {
  return readFileSync(resolve(process.cwd(), relative), 'utf8')
}

const NOW = '2026-09-21T08:00:00.000Z'
const CLASS_ID = 'class-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const STU_A = 'student-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const STU_B = 'student-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

function makeClass(): ClassRecord {
  return {
    id: CLASS_ID,
    className: '1班',
    grade: '初一',
    academicYear: '2026-2027',
    semester: '第一学期',
    studentCount: 2,
    notes: '',
    status: 'active',
    createdAt: NOW,
    updatedAt: NOW
  }
}

function makeStudent(id: string, studentNo: string, name: string): StudentRecord {
  return {
    id,
    classId: CLASS_ID,
    studentNo,
    name,
    gender: 'male',
    status: 'active',
    notes: '',
    createdAt: NOW,
    updatedAt: NOW
  }
}

function row(
  partial: Pick<IncomingStudentRow, 'excelRow' | 'classRaw' | 'studentNo' | 'name'>
): IncomingStudentRow {
  return { gender: 'male', notes: '', ...partial }
}

function fixedIds(): RosterIdFactory {
  let studentN = 0
  return {
    createClassId: () => 'class-cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    createStudentId: () => {
      studentN += 1
      return `student-dddddddd-dddd-4ddd-8ddd-${String(studentN).padStart(12, '0')}`
    },
    now: () => '2026-09-21T09:00:00.000Z'
  }
}

function scheduleIncoming(
  excelRow: number,
  weekday: IncomingScheduleRow['weekday'],
  period: IncomingScheduleRow['period'],
  team: string
): IncomingScheduleRow {
  return {
    excelRow,
    weekdayRaw: `周${weekday}`,
    periodRaw: `第${period}节`,
    teamRaw: team,
    weekday,
    period,
    startTime: '08:00',
    endTime: '08:40',
    team,
    courseType: 'regular'
  }
}

function snapshotFromAoa(aoa: unknown[][]) {
  const sheet = XLSX.utils.aoa_to_sheet(aoa)
  return worksheetRowsToSnapshot(
    XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: '', blankrows: true }),
    XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: '', blankrows: true }),
    'temp-v0290-p02.xlsx',
    'Sheet1'
  )
}

export async function runV0290P02ImportTransactionSelfCheckOrThrow(): Promise<string> {
  // 0. 前序 P0-1
  assert(runV0290P01IntegritySelfCheckOrThrow().includes('passed'), '0. 前序 P0-1')

  // 1. ImportTransactionReport 结构
  const sample = emptyImportTransactionReport('students', {
    created: 1,
    updated: 2,
    unchanged: 3,
    skipped: 4,
    conflicts: 0,
    errors: [],
    rolledBack: false,
    ok: true
  })
  assert(sample.domain === 'students' && sample.ok && !sample.rolledBack, '1. 报告结构')

  // 2. 学生稳定身份：同班同学号匹配；重复导入新增 0
  const classes = [makeClass()]
  const students = [makeStudent(STU_A, '01', '张三'), makeStudent(STU_B, '02', '李四')]
  const sameRows = [
    row({ excelRow: 2, classRaw: '初一1班', studentNo: '01', name: '张三' }),
    row({ excelRow: 3, classRaw: '初一1班', studentNo: '02', name: '李四' })
  ]
  const preview1 = buildRosterPreview(sameRows, classes, students, {
    fileName: 'roster.xlsx',
    sheetName: 'Sheet1',
    headerRowNumber: 1,
    academicYear: '2026-2027',
    semester: '第一学期'
  })
  assert(preview1.canCommit && preview1.totals.create === 0, '2a. 重复名单可提交且无新增')
  const first = applyRosterSync(sameRows, classes, students, { ids: fixedIds() })
  assert(first.createdStudentCount === 0 && first.createdClassCount === 0, '2b. 首次同步新增学生/班级均为 0')
  const second = applyRosterSync(sameRows, first.classes, first.students, { ids: fixedIds() })
  assert(second.createdStudentCount === 0, '2c. 再次导入不得新增学生')
  assert(second.students.filter((item) => item.status === 'active').length === 2, '2d. 活跃学生仍为 2')
  const ids = new Set(second.students.map((item) => item.id))
  assert(ids.has(STU_A) && ids.has(STU_B) && ids.size === 2, '2e. 学生 ID 稳定不复制')

  // 3. 分阶段写入失败必须回滚（classes + students）
  const root = mkdtempSync(join(tmpdir(), 'gdpe-v0290-p02-'))
  try {
    const classPath = join(root, 'classes.json')
    const studentPath = join(root, 'students.json')
    const beforeClasses = [makeClass()]
    const beforeStudents = [makeStudent(STU_A, '01', '张三')]
    await writeJsonItemsAtomic(classPath, beforeClasses)
    await writeJsonItemsAtomic(studentPath, beforeStudents)

    const planned = applyRosterSync(
      [
        row({ excelRow: 2, classRaw: '初一1班', studentNo: '01', name: '张三' }),
        row({ excelRow: 3, classRaw: '初一1班', studentNo: '09', name: '新人' })
      ],
      beforeClasses,
      beforeStudents,
      { ids: fixedIds() }
    )
    const okClasses = parseClassRecords(planned.classes)
    const okStudents = parseStudentRecords(planned.students, {
      knownClassIds: new Set(okClasses.map((item) => item.id))
    })

    const failed = await runStagedJsonWrites([
      {
        name: 'classes.json',
        write: async () => {
          await writeJsonItemsAtomic(classPath, okClasses)
        },
        restore: async () => {
          await writeJsonItemsAtomic(classPath, beforeClasses)
        }
      },
      {
        name: 'students.json',
        write: async () => {
          throw new Error('模拟学生写入失败')
        },
        restore: async () => {
          await writeJsonItemsAtomic(studentPath, beforeStudents)
        }
      }
    ])
    assert(!failed.ok && failed.rolledBack && failed.failedStage === 'students.json', '3a. 学生阶段失败应回滚')
    const restoredClasses = await readJsonItemsFile(classPath, parseClassRecords)
    const restoredStudents = await readJsonItemsFile(studentPath, (input) =>
      parseStudentRecords(input, { knownClassIds: new Set([CLASS_ID]) })
    )
    assert(
      restoredClasses.length === 1 && restoredClasses[0].id === CLASS_ID,
      '3b. 班级文件已恢复'
    )
    assert(
      restoredStudents.length === 1 && restoredStudents[0].id === STU_A,
      '3c. 学生文件未半写入'
    )

    const ok = await runStagedJsonWrites([
      {
        name: 'classes.json',
        write: async () => {
          await writeJsonItemsAtomic(classPath, okClasses)
        },
        restore: async () => {
          await writeJsonItemsAtomic(classPath, beforeClasses)
        }
      },
      {
        name: 'students.json',
        write: async () => {
          await writeJsonItemsAtomic(studentPath, okStudents)
        },
        restore: async () => {
          await writeJsonItemsAtomic(studentPath, beforeStudents)
        }
      }
    ])
    assert(ok.ok && !ok.rolledBack, '3d. 成功写入 rolledBack=false')
    assert(okStudents.some((item) => item.studentNo === '09'), '3e. 成功后含新人')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }

  // 4. 课表重复导入：区分 keep/create/update，不得重复生成相同 lesson
  const currentSchedule = parseScheduleItems([
    {
      id: scheduleSlotId(1, 1),
      weekday: 1,
      period: 1,
      startTime: '08:00',
      endTime: '08:40',
      team: '团队1',
      courseType: 'regular',
      classId: CLASS_ID
    }
  ])
  const sameScheduleRows = [scheduleIncoming(2, 1, 1, '团队1')]
  const keepPreview = buildSchedulePreview(currentSchedule, sameScheduleRows, {
    resolutions: { ...emptyScheduleResolutions(), acknowledgeRemoves: true }
  })
  assert(keepPreview.totals.keep === 1 && keepPreview.totals.create === 0, '4a. 相同课表 keep=1 create=0')
  const keepApplied = applyScheduleSync(currentSchedule, sameScheduleRows, {
    ...emptyScheduleResolutions(),
    acknowledgeRemoves: true
  })
  assert(keepApplied.length === 1 && keepApplied[0].id === scheduleSlotId(1, 1), '4b. 不重复生成 lesson')
  assert(keepApplied[0].classId === CLASS_ID, '4c. 不得自动清空课堂关联 classId')

  const updateRows = [scheduleIncoming(2, 1, 1, '团队改名')]
  const updatePreview = buildSchedulePreview(currentSchedule, updateRows, {
    resolutions: { ...emptyScheduleResolutions(), acknowledgeRemoves: true }
  })
  assert(updatePreview.totals.update === 1, '4d. 内容变化为 update')

  const createRows = [scheduleIncoming(2, 1, 1, '团队1'), scheduleIncoming(3, 1, 2, '团队2')]
  const createPreview = buildSchedulePreview(currentSchedule, createRows, {
    resolutions: { ...emptyScheduleResolutions(), acknowledgeRemoves: true }
  })
  assert(createPreview.totals.create === 1 && createPreview.totals.keep === 1, '4e. 新课位 create，旧课位 keep')

  // 5. 删除旧课表不得删除 pe-sessions：仅写 schedule 文件源码约束
  const scheduleImportSrc = readSrc('src/main/scheduleImport.ts')
  assert(!scheduleImportSrc.includes('peSession') && !scheduleImportSrc.includes('pe-sessions'), '5a. 课表导入不触碰课堂')
  assert(scheduleImportSrc.includes('runStagedJsonWrites'), '5b. 课表导入使用分阶段事务')
  assert(readSrc('src/main/studentImport.ts').includes('runStagedJsonWrites'), '5c. 学生导入使用分阶段事务')

  // 6. 体育测试：skip 幂等；评分结果不变
  const guangzhou = listBuiltinExamStandards().find((item) => item.id === 'cn-gd-guangzhou-middle-2024-2026')
  assert(guangzhou, '6. 广州标准')
  const aoa = [
    ['姓名', '学号', '性别', '1000米'],
    ['张三', '1', '男', '3:40'],
    ['李四', '2', '男', '3:50']
  ]
  const snap = snapshotFromAoa(aoa)
  const detect = detectWorkbookColumns(
    snap.columns.map((column) => column.title),
    guangzhou
  )
  const converted = convertWorkbookExamBatch(guangzhou, snap, detect)
  const payload = buildExamBatchPeTestImportPayload({
    classId: CLASS_ID,
    testDate: '2026-09-21',
    standard: guangzhou,
    rows: converted.rows,
    duplicateAction: 'cancel'
  })

  let store: PETestSession[] = []
  const stores = {
    loadClasses: async () => [makeClass()],
    loadStudents: async () => [makeStudent(STU_A, '1', '张三'), makeStudent(STU_B, '2', '李四')],
    loadTestItems: async () => BUILTIN_TEST_ITEMS,
    loadPeTests: async () => store,
    savePeTests: async (items: PETestSession[]) => {
      store = items
      return items
    },
    nowIso: NOW
  }

  const firstImport = await executeImportExamBatchToPeTests(payload, stores)
  assert(firstImport.createdCount >= 1 && firstImport.transaction?.ok === true, '6a. 首次入库成功')
  const scoreSnapshot = JSON.stringify(
    store.flatMap((session) =>
      session.records.map((record) => ({
        studentId: record.studentId,
        rawValue: record.rawValue,
        examScore: record.examScore,
        status: record.status
      }))
    )
  )
  const afterFirstCount = store.length

  let cancelBlocked = false
  try {
    await executeImportExamBatchToPeTests(payload, stores)
  } catch {
    cancelBlocked = true
  }
  assert(cancelBlocked && store.length === afterFirstCount, '6b. cancel 重复导入不写')

  let skipBlocked = false
  let skipMessage = ''
  try {
    await executeImportExamBatchToPeTests({ ...payload, duplicateAction: 'skip' }, stores)
  } catch (error) {
    skipBlocked = true
    skipMessage = error instanceof Error ? error.message : String(error)
  }
  assert(skipBlocked && skipMessage.includes('已跳过'), '6c. skip 全重复时明确跳过且不新建')
  assert(store.length === afterFirstCount, '6d. skip 重复导入不增加 session')
  assert(
    JSON.stringify(
      store.flatMap((session) =>
        session.records.map((record) => ({
          studentId: record.studentId,
          rawValue: record.rawValue,
          examScore: record.examScore,
          status: record.status
        }))
      )
    ) === scoreSnapshot,
    '6e. 重复导入不得改变评分结果'
  )

  // 7. 写入失败时 pe-tests 回滚
  let peStore: PETestSession[] = [...store]
  const boomStores = {
    ...stores,
    loadPeTests: async () => peStore,
    savePeTests: async (_items: PETestSession[]) => {
      throw new Error('模拟 pe-tests 写入失败')
    }
  }
  // 换日期避免 duplicate cancel
  const freshPayload = { ...payload, testDate: '2026-09-22', duplicateAction: 'cancel' as const }
  let peFailed = false
  let peErrorMessage = ''
  try {
    await executeImportExamBatchToPeTests(freshPayload, boomStores)
  } catch (error) {
    peFailed = true
    peErrorMessage = error instanceof Error ? error.message : String(error)
  }
  assert(peFailed && peErrorMessage.includes('已回滚'), '7a. pe-tests 失败提示已回滚')
  assert(peStore.length === store.length, '7b. pe-tests 内存库未污染')

  // 8. execute 使用 staged write
  assert(readSrc('src/shared/examBatch/peTestImport/execute.ts').includes('runStagedJsonWrites'), '8. pe-test 使用事务写入')

  return 'v0.29.0 P0-2 import transaction self-check passed'
}
