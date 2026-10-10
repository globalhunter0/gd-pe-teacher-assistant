import {
  applyClassSafeDelete,
  collectClassDeleteImpact,
  formatClassDeleteConfirm,
  listedClassRecords,
  parseClassRecords
} from '../class/validate'
import { parsePeSessions } from '../peSession/validate'
import { parsePeTestSessions } from '../peTest/validate'
import { LEGACY_SCHEDULE_FIXTURE } from '../schedule/__fixtures__/legacySchedule'
import { parseScheduleItems } from '../schedule/validate'
import { workbenchBoundClassId, workbenchListedClass, workbenchUsesTrainingTeam } from '../schedule/workbench'
import { collectStudentOptions } from '../statistics/students'
import { summarizeClassLessons, summarizeStudentLessons } from '../statistics/lessons'
import { summarizeStudentTests } from '../statistics/tests'
import { filterSchoolWideStudents, hasActiveMembership } from '../trainingTeam/roster'
import type { TrainingTeamMember } from '../trainingTeam/types'
import { findExactClass } from './classLabel'
import { applyRosterSync } from './roster'
import type { StudentRecord } from './types'
import { applyStudentSafeDelete, isRosterVisibleStudent, parseStudentRecords } from './validate'

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

const now = '2026-09-09T02:00:00.000Z'
const class1 = 'class-11111111-1111-4111-8111-111111111111'
const class2 = 'class-22222222-2222-4222-8222-222222222222'
const studentA = 'student-11111111-1111-4111-8111-111111111111'
const studentB = 'student-22222222-2222-4222-8222-222222222222'
const studentC = 'student-33333333-3333-4333-8333-333333333333'

function student(partial: Partial<StudentRecord> & Pick<StudentRecord, 'id' | 'classId' | 'name'>): StudentRecord {
  return {
    studentNo: '',
    gender: 'male',
    status: 'active',
    notes: '',
    createdAt: now,
    updatedAt: now,
    ...partial
  }
}

function member(partial: Partial<TrainingTeamMember> & Pick<TrainingTeamMember, 'id' | 'teamId' | 'studentId'>): TrainingTeamMember {
  return {
    joinedAt: now,
    leftAt: null,
    status: 'active',
    nameSnapshot: '张三',
    studentNoSnapshot: 'A01',
    classNameSnapshot: '初一 1班',
    genderSnapshot: 'male',
    specialty: '',
    position: '',
    trainingGroup: '',
    trainingNotes: '',
    notes: '',
    createdAt: now,
    updatedAt: now,
    ...partial
  }
}

export function runV0131RegressionSelfCheck(): void {
  const parsedSchedule = parseScheduleItems(LEGACY_SCHEDULE_FIXTURE)
  assert(parsedSchedule.length === 17, '默认课表仍为 17 节')
  for (let i = 0; i < LEGACY_SCHEDULE_FIXTURE.length; i++) {
    const original = LEGACY_SCHEDULE_FIXTURE[i]
    const item = parsedSchedule[i]
    assert(
      item.team === original.team &&
        item.weekday === original.weekday &&
        item.period === original.period &&
        item.startTime === original.startTime &&
        item.endTime === original.endTime &&
        item.courseType === original.courseType,
      '17 节课表内容未改变'
    )
  }

  const legacy = parseScheduleItems([{ ...LEGACY_SCHEDULE_FIXTURE[0], trainingTeamId: 'training-team-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }])
  assert(legacy[0].trainingTeamId, 'legacy trainingTeamId 仍可读取')
  assert(workbenchBoundClassId(legacy[0]) === undefined, '工作台忽略仅有训练队的格子')
  assert(!workbenchUsesTrainingTeam(legacy[0]), '工作台不使用 trainingTeamId')

  const students = parseStudentRecords([
    student({ id: studentA, classId: class1, name: '张三', studentNo: 'A01' }),
    student({ id: studentB, classId: class2, name: '李四', studentNo: 'B01' }),
    student({ id: studentC, classId: class1, name: '王五', studentNo: 'C01' })
  ])
  const pool = filterSchoolWideStudents(students, {})
  assert(pool.length === 3, '全校学生池默认全部在读')
  assert(new Set(pool.map((item) => item.classId)).size === 2, '训练队可选不同 classId')
  assert(filterSchoolWideStudents(students, { classId: class2 }).every((item) => item.classId === class2), '可按行政班筛选')
  assert(filterSchoolWideStudents(students, { query: '张三' })[0]?.id === studentA, '可按姓名搜索')
  assert(filterSchoolWideStudents(students, { query: 'B01' })[0]?.id === studentB, '可按学号搜索')

  const teamId = 'training-team-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  const members = [
    member({ id: 'training-member-11111111-1111-4111-8111-111111111111', teamId, studentId: studentA })
  ]
  assert(hasActiveMembership(members, teamId, studentA), '已入队')
  assert(!hasActiveMembership(members, teamId, studentB), '未入队可加入')

  const lessonSessions = parsePeSessions([
    {
      id: 'pe-session-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      classId: class1,
      date: '2026-09-01',
      period: 1,
      scheduleLessonId: null,
      lessonType: 'regular',
      topic: '热身',
      notes: '',
      classNameSnapshot: '1班',
      gradeSnapshot: '初一',
      teamSnapshot: '初一1班',
      startTimeSnapshot: '08:00',
      endTimeSnapshot: '08:40',
      createdAt: now,
      updatedAt: now,
      records: [
        {
          id: 'pe-record-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          sessionId: 'pe-session-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          studentId: studentA,
          nameSnapshot: '张三',
          studentNoSnapshot: 'A01',
          attendanceStatus: 'normal',
          performanceTags: [],
          note: '',
          createdAt: now,
          updatedAt: now
        }
      ]
    }
  ])
  const testSessions = parsePeTestSessions([
    {
      id: 'pe-test-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      classId: class1,
      testItemId: 'test-item-builtin-50m',
      date: '2026-09-02',
      title: '50米',
      notes: '',
      classNameSnapshot: '1班',
      gradeSnapshot: '初一',
      testItemNameSnapshot: '50米',
      unitSnapshot: 's',
      customUnitLabelSnapshot: '',
      directionSnapshot: 'lowerBetter',
      valueTypeSnapshot: 'time',
      timeInputModeSnapshot: 'seconds',
      createdAt: now,
      updatedAt: now,
      records: [
        {
          id: 'pe-test-record-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          testSessionId: 'pe-test-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          studentId: studentA,
          nameSnapshot: '张三',
          studentNoSnapshot: 'A01',
          genderSnapshot: 'male',
          rawValue: 8.2,
          status: 'valid',
          note: '',
          createdAt: now,
          updatedAt: now
        }
      ]
    }
  ])

  const afterHistory = applyStudentSafeDelete(students, studentA, now, {
    sessions: lessonSessions,
    testSessions,
    members,
    trainingSessions: [],
    results: []
  })
  const archived = afterHistory.students.find((item) => item.id === studentA)
  assert(archived?.status === 'deleted', '有体育测试/课堂历史时应软删除')
  assert(!isRosterVisibleStudent(archived!), '删除后不出现在当前名单')
  assert(!hasActiveMembership(afterHistory.members, teamId, studentA), '删除现役队员不得留下有效队籍')
  assert(afterHistory.members.some((item) => item.studentId === studentA && item.status === 'left'), '队员历史仍保留')
  assert(parsePeSessions(lessonSessions)[0].records[0].nameSnapshot === '张三', '删除后课堂历史仍可读取')
  assert(parsePeTestSessions(testSessions)[0].records[0].nameSnapshot === '张三', '删除后体育测试仍可读取')

  const lessonSummary = summarizeStudentLessons(lessonSessions, studentA, { start: null, end: null })
  assert(lessonSummary.lessonCount === 1, '删除后课堂统计仍可按 studentId 读取')
  const testSummary = summarizeStudentTests(testSessions, studentA, [], { start: null, end: null })
  assert(testSummary.length === 1 && testSummary[0].history.length === 1, '删除后测试统计仍可读取')

  const options = collectStudentOptions(afterHistory.students, [], lessonSessions, testSessions)
  const option = options.find((item) => item.studentId === studentA)
  assert(option?.isHistorical === true, '统计页把已删除学生显示为历史学生')
  assert(option?.name === '张三', '历史学生使用快照姓名')

  const afterClean = applyStudentSafeDelete(
    [student({ id: studentC, classId: class1, name: '王五', studentNo: 'C01' })],
    studentC,
    now,
    {}
  )
  assert(!afterClean.students.some((item) => item.id === studentC), '无历史引用时允许物理删除')
  assert(afterClean.members.length === 0, '无训练队引用时没有队员残留')

  const legacyClass = parseClassRecords([
    {
      id: class1,
      className: '1班',
      grade: '初一',
      academicYear: '2026-2027',
      semester: '第一学期',
      studentCount: 40,
      notes: '',
      createdAt: now,
      updatedAt: now
    }
  ])[0]
  assert(legacyClass.status === 'active', '旧班级 JSON 缺 status 视为当前班级')
  assert(legacyClass.studentCount === 40, 'studentCount 手工语义不改变')

  const emptyDeleted = applyClassSafeDelete(
    [
      {
        ...legacyClass,
        id: class2,
        className: '2班'
      }
    ],
    class2,
    now,
    {}
  )
  assert(emptyDeleted.length === 0, '空班级可物理删除')

  const membersBefore = [
    member({ id: 'training-member-11111111-1111-4111-8111-111111111111', teamId: 'training-team-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', studentId: studentA })
  ]
  const afterClassDelete = applyClassSafeDelete([legacyClass], class1, now, {
    students,
    sessions: lessonSessions,
    testSessions,
    scheduleItems: [{ classId: class1 }]
  })
  const tombstoneClass = afterClassDelete.find((item) => item.id === class1)
  const classImpact = collectClassDeleteImpact(class1, students, lessonSessions, testSessions, [{ classId: class1 }])
  assert(formatClassDeleteConfirm(classImpact).includes('该班级当前仍有2名学生'), '有学生时改为确认而非阻止')
  assert(tombstoneClass?.status === 'deleted', '有学生的班级也可删除（软删除）')
  assert(listedClassRecords(afterClassDelete).length === 0, '删除后班级默认列表不显示')
  assert(students.every((item) => item.id === studentA || item.id === studentB || item.id === studentC), '删除班级不删除 Student')
  assert(students.filter((item) => item.classId === class1).length === 2, '学生仍保留原 classId')
  assert(parsePeSessions(lessonSessions)[0].classId === class1, '删除班级不删除课堂历史')
  assert(parsePeTestSessions(testSessions)[0].classId === class1, '删除班级不删除体育测试历史')
  assert(membersBefore[0].studentId === studentA && membersBefore[0].teamId === 'training-team-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '删除班级不删除训练队 membership')
  const boundLesson = parseScheduleItems([{ ...LEGACY_SCHEDULE_FIXTURE[0], classId: class1 }])[0]
  assert(workbenchListedClass(boundLesson, afterClassDelete) === undefined, '删除后工作台不把已删除班级当作当前绑定')
  assert(parseScheduleItems(LEGACY_SCHEDULE_FIXTURE).length === 17, '删除后课表 17 节仍存在')
  assert(summarizeClassLessons(lessonSessions).lessonCount === 1, '删除后历史统计可读取')
  assert(tombstoneClass?.studentCount === 40, '删除后 studentCount 手工值仍保留')

  const excelAgain = applyRosterSync(
    [
      { excelRow: 2, classRaw: '初一1班', studentNo: '01', name: '张三', gender: 'male', notes: '' },
      { excelRow: 3, classRaw: '初一1班', studentNo: '09', name: '新人', gender: 'male', notes: '' }
    ],
    afterClassDelete,
    students,
    {
      academicYear: '2026-2027',
      semester: '第一学期'
    }
  )
  assert(findExactClass(afterClassDelete, '初一', '1班', '2026-2027', '第一学期') === undefined, '已删除班级不得被精确匹配复活')
  assert(excelAgain.createdClassCount === 1, 'Excel 重新导入同名班级应新建而非复活')
  assert(excelAgain.classes.some((item) => item.id === class1 && item.status === 'deleted'), '旧 tombstone 仍在')
  assert(excelAgain.classes.some((item) => item.status === 'active' && item.id !== class1), '新班级使用新 id')
}

export function runV0131RegressionSelfCheckOrThrow(): string {
  runV0131RegressionSelfCheck()
  return 'v0.13.1 regression self-check passed'
}
