import { parseScoreInput } from '../peTest/scoreFormat'
import { BUILTIN_TEST_ITEMS } from '../peTest/builtinItems'
import { listBuiltinExamStandards } from '../examStandard/catalog'
import { collectTrainingStudentDeleteBlockers, parseTrainingMembers, parseTrainingResults, parseTrainingSessions, parseTrainingTeams, applyTrainingTeamSafeDelete } from './validate'
import { canMutateTrainingTeam, currentRosterStudents, filterSchoolWideStudents, hasActiveMembership, isActiveMembership, isListedTrainingTeam } from './roster'
import { personalBest, summarizeAthleteSessions, summarizeTeam } from './stats'
import { mergeBuiltinTrainingItems, BUILTIN_TRAINING_ITEMS } from './builtinItems'
import type { TrainingResult, TrainingSession, TrainingTeam, TrainingTeamMember } from './types'
import type { StudentRecord } from '../student/types'

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

const now = '2026-09-07T10:00:00.000Z'
const teamA = 'training-team-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const teamB = 'training-team-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const groupA = 'training-team-cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const studentZhang = 'student-11111111-1111-4111-8111-111111111111'
const studentLi = 'student-22222222-2222-4222-8222-222222222222'
const member1 = 'training-member-11111111-1111-4111-8111-111111111111'
const member2 = 'training-member-22222222-2222-4222-8222-222222222222'
const member3 = 'training-member-33333333-3333-4333-8333-333333333333'
const memberLeft = 'training-member-44444444-4444-4444-8444-444444444444'
const sessionId = 'training-session-55555555-5555-4555-8555-555555555555'
const exerciseId = 'training-exercise-66666666-6666-4666-8666-666666666666'
const attendanceId = 'training-attendance-77777777-7777-4777-8777-777777777777'
const attendanceLeft = 'training-attendance-88888888-8888-4888-8888-888888888888'
const item1000 = 'training-item-builtin-run-1000m'
const itemJump = 'training-item-builtin-long-jump'
const result1 = 'training-result-aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1'
const result2 = 'training-result-aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2'
const result3 = 'training-result-aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3'
const result4 = 'training-result-aaaaaaa4-aaaa-4aaa-8aaa-aaaaaaaaaaa4'

function member(partial: Partial<TrainingTeamMember> & Pick<TrainingTeamMember, 'id' | 'teamId' | 'studentId' | 'status'>): TrainingTeamMember {
  return {
    joinedAt: now,
    leftAt: partial.status === 'left' ? '2026-09-08T10:00:00.000Z' : null,
    nameSnapshot: '张三',
    studentNoSnapshot: 'A01',
    classNameSnapshot: '七年级3班',
    genderSnapshot: 'male',
    notes: '',
    createdAt: now,
    updatedAt: now,
    ...partial
  }
}

export function runTrainingTeamSelfCheck(): void {
  const teams = parseTrainingTeams([
    {
      id: teamA,
      parentTeamId: null,
      name: '校田径队',
      sport: 'track',
      coach: '',
      notes: '',
      status: 'active',
      createdAt: now,
      updatedAt: now
    },
    {
      id: groupA,
      parentTeamId: teamA,
      name: '短跑组',
      sport: 'track',
      coach: '',
      notes: '',
      status: 'active',
      createdAt: now,
      updatedAt: now
    },
    {
      id: teamB,
      parentTeamId: null,
      name: '校篮球队',
      sport: 'basketball',
      coach: '',
      notes: '',
      status: 'active',
      createdAt: now,
      updatedAt: now
    }
  ])
  assert(teams.length === 3, '应解析3支队伍/组')

  let duplicateFailed = false
  try {
    parseTrainingMembers([
      member({ id: member1, teamId: groupA, studentId: studentZhang, status: 'active' }),
      member({ id: member2, teamId: groupA, studentId: studentZhang, status: 'active', nameSnapshot: '张三' })
    ])
  } catch {
    duplicateFailed = true
  }
  assert(duplicateFailed, '同学生不能重复加入同一有效组')

  const members = parseTrainingMembers([
    member({ id: member1, teamId: groupA, studentId: studentZhang, status: 'active' }),
    member({ id: member2, teamId: teamB, studentId: studentZhang, status: 'active' }),
    member({ id: member3, teamId: teamB, studentId: studentLi, status: 'active', nameSnapshot: '李四', classNameSnapshot: '七年级5班' }),
    member({
      id: memberLeft,
      teamId: groupA,
      studentId: studentLi,
      status: 'left',
      nameSnapshot: '李四',
      classNameSnapshot: '七年级5班',
      leftAt: '2026-09-01T10:00:00.000Z'
    })
  ])
  assert(hasActiveMembership(members, groupA, studentZhang), '张三在短跑组')
  assert(hasActiveMembership(members, teamB, studentZhang), '张三也可以同时在篮球队')
  assert(!hasActiveMembership(members, groupA, studentLi), '李四已退出短跑组，不算有效队员')
  assert(members.some((item) => item.id === memberLeft && item.status === 'left'), '退出后 membership 历史仍在')

  const students: StudentRecord[] = [
    {
      id: studentZhang,
      classId: 'class-11111111-1111-4111-8111-111111111111',
      studentNo: 'A01',
      name: '张三新',
      gender: 'male',
      status: 'active',
      notes: '',
      createdAt: now,
      updatedAt: now
    },
    {
      id: studentLi,
      classId: 'class-22222222-2222-4222-8222-222222222222',
      studentNo: 'B01',
      name: '李四',
      gender: 'male',
      status: 'active',
      notes: '',
      createdAt: now,
      updatedAt: now
    }
  ]
  const roster = currentRosterStudents(groupA, members, students)
  assert(roster.length === 1 && roster[0].id === studentZhang, '新训练只加载当前有效且在读队员')
  assert(!roster.some((item) => item.id === studentLi), '已退出队员不进入新训练花名册')
  assert(students[0].classId !== students[1].classId, '张三与李四必须来自不同行政班')
  const pool = filterSchoolWideStudents(students, {})
  assert(pool.length === 2, '全校学生池默认包含全部在读学生')
  assert(new Set(pool.map((item) => item.classId)).size === 2, '训练队可同时添加不同 classId 的学生')
  assert(hasActiveMembership(members, teamB, studentLi), '李四已在篮球队')
  assert(hasActiveMembership(members, teamB, studentZhang), '同队可含另一班级学生')
  assert(hasActiveMembership(members, teamB, studentZhang) && hasActiveMembership(members, teamB, studentLi), '已入队学生不能再算作可加入')
  assert(
    !('classId' in (parseTrainingTeams([{
      id: teamA,
      parentTeamId: null,
      name: '校田径队',
      sport: 'track',
      coach: '',
      notes: '',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      classId: 'class-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
    }])[0] as TrainingTeam & { classId?: string })),
    'TrainingTeam 不得拥有 classId'
  )

  const sessionPayload: TrainingSession = {
    id: sessionId,
    teamId: groupA,
    date: '2026-09-10',
    startTime: '16:00',
    title: '速度耐力',
    place: '田径场',
    durationMinutes: 90,
    notes: '',
    teamNameSnapshot: '短跑组',
    createdAt: now,
    updatedAt: now,
    exercises: [
      {
        id: exerciseId,
        sortOrder: 0,
        name: '热身',
        kind: 'warmup',
        sets: null,
        reps: null,
        distanceM: null,
        durationSec: 600,
        notes: ''
      }
    ],
    attendance: [
      {
        id: attendanceId,
        studentId: studentZhang,
        nameSnapshot: '张三',
        studentNoSnapshot: 'A01',
        classNameSnapshot: '七年级3班',
        participation: 'normal',
        rpe: 6,
        completion: 'completed',
        note: ''
      },
      {
        id: attendanceLeft,
        studentId: studentLi,
        nameSnapshot: '李四旧名',
        studentNoSnapshot: 'B01',
        classNameSnapshot: '七年级5班',
        participation: 'absent',
        rpe: null,
        completion: 'not_done',
        note: '历史队员'
      }
    ]
  }
  const [loadedSession] = parseTrainingSessions([sessionPayload], { knownTeamIds: new Set([groupA, teamA, teamB]) })
  assert(loadedSession.title === '速度耐力' && loadedSession.exercises[0].name === '热身', '训练保存/读取主题和内容一致')
  assert(loadedSession.attendance[0].nameSnapshot === '张三', '出勤使用姓名快照而不是后来改名')
  assert(loadedSession.attendance[0].studentId === studentZhang, '改名后 studentId 仍能关联')
  assert(students.find((item) => item.id === studentZhang)?.name === '张三新', '学生主档可以改名')

  const parsed1000 = parseScoreInput('3.39', 'time', 'minutesSeconds')
  assert(parsed1000 === 219, `1000米 3.39 应为 219 秒，实际 ${parsed1000}`)

  const baseResult = {
    teamId: groupA,
    studentId: studentZhang,
    studentNameSnapshot: '张三',
    studentNoSnapshot: 'A01',
    classNameSnapshot: '七年级3班',
    genderSnapshot: 'male' as const,
    itemId: item1000,
    itemNameSnapshot: '1000米',
    unitSnapshot: 's' as const,
    customUnitLabelSnapshot: '',
    directionSnapshot: 'lowerBetter' as const,
    valueTypeSnapshot: 'time' as const,
    timeInputModeSnapshot: 'minutesSeconds' as const,
    decimalPlacesSnapshot: 1,
    kind: 'training' as const,
    sessionId: null,
    status: 'valid' as const,
    note: '',
    createdAt: now,
    updatedAt: now
  }
  const timeResults = parseTrainingResults(
    [
      { ...baseResult, id: result1, date: '2026-09-01', rawInput: '3.50', rawValue: 230 },
      { ...baseResult, id: result2, date: '2026-09-10', rawInput: '3.39', rawValue: 219 }
    ],
    { knownTeamIds: new Set([groupA]), knownStudentIds: new Set([studentZhang, studentLi]), knownItemIds: new Set([item1000, itemJump]) }
  )
  const timeBest = personalBest(timeResults)
  assert(timeBest?.rawValue === 219, '时间项目 PB 取更小值')

  const jumpBase: TrainingResult = {
    ...baseResult,
    id: result3,
    itemId: itemJump,
    itemNameSnapshot: '跳远',
    unitSnapshot: 'm',
    directionSnapshot: 'higherBetter',
    valueTypeSnapshot: 'number',
    timeInputModeSnapshot: 'seconds',
    decimalPlacesSnapshot: 2,
    date: '2026-09-01',
    rawInput: '5.10',
    rawValue: 5.1
  }
  const jumpResults = parseTrainingResults(
    [
      jumpBase,
      { ...jumpBase, id: result4, date: '2026-09-10', rawInput: '5.40', rawValue: 5.4, createdAt: '2026-09-10T10:00:00.000Z' }
    ],
    { knownTeamIds: new Set([groupA]), knownStudentIds: new Set([studentZhang]), knownItemIds: new Set([itemJump]) }
  )
  assert(personalBest(jumpResults)?.rawValue === 5.4, '距离项目 PB 取更大值')

  const blockers = collectTrainingStudentDeleteBlockers(studentZhang, {
    members,
    sessions: [loadedSession],
    results: timeResults
  })
  assert(blockers.length >= 2, '有 membership / 出勤 / 成绩时不得从存储中物理移除学生身份')

  const athlete = summarizeAthleteSessions([loadedSession], studentZhang, groupA)
  assert(athlete.sessionCount === 1 && athlete.presentCount === 1 && athlete.absentCount === 0, '队员训练次数按参加过的训练次数计')
  const teamStats = summarizeTeam(groupA, members, [loadedSession], new Set([studentZhang]))
  assert(teamStats.sessionCount === 1, '队伍训练次数 = 训练记录条数')
  assert(teamStats.currentMemberCount === 1, '当前队员人数 = 有效 membership 且学生仍在读')
  assert(teamStats.recentPresentPersonTimes === 1 && teamStats.recentAbsentPersonTimes === 1, '出勤人次按出勤行累计，不同于人数和训练次数')

  const merged = mergeBuiltinTrainingItems([])
  assert(merged.some((item) => item.builtinKey === 'run-1000m'), '内置 1000米')
  assert(BUILTIN_TRAINING_ITEMS.length >= 10, '内置常用项目')

  assert(BUILTIN_TEST_ITEMS.some((item) => item.builtinKey === 'run-1000m'), '原有体育测试内置项目仍在')
  const exam = listBuiltinExamStandards().find((item) => item.id === 'cn-gd-guangzhou-middle-2024-2026')
  assert(exam?.status === 'verified', '原有考试评分标准未被本模块改写')
  assert(isActiveMembership(members[0]), '有效 membership 判定')

  const emptyId = 'training-team-dddddddd-dddd-4ddd-8ddd-dddddddddddd'
  const emptyTeam = {
    id: emptyId,
    parentTeamId: null,
    name: '空队',
    sport: 'other' as const,
    coach: '',
    notes: '',
    status: 'active' as const,
    createdAt: now,
    updatedAt: now
  }
  const physical = applyTrainingTeamSafeDelete([emptyTeam], [], emptyId, now, [], [])
  assert(physical.teams.length === 0, '无历史训练队可以物理删除')

  const studentCopy = students.map((item) => ({ ...item }))
  const afterSession = applyTrainingTeamSafeDelete(teams, members, groupA, now, [loadedSession], timeResults)
  const tombstone = afterSession.teams.find((item) => item.id === groupA)
  assert(tombstone?.status === 'deleted', '有 TrainingSession 的训练队也可以删除（软删除）')
  assert(!isListedTrainingTeam(tombstone!), '删除后默认训练队列表不再出现')
  assert(!canMutateTrainingTeam(tombstone!), '删除后不能开始新训练')
  assert(!hasActiveMembership(afterSession.members, groupA, studentZhang), 'active membership 被安全结束')
  assert(afterSession.members.some((item) => item.teamId === groupA && item.studentId === studentZhang && item.status === 'left'), '历史 membership 仍保留')
  const rereadSession = parseTrainingSessions([loadedSession], { knownTeamIds: new Set(afterSession.teams.map((item) => item.id)) })
  assert(rereadSession[0].title === '速度耐力', '删除后历史 TrainingSession 仍可读取')
  assert(rereadSession[0].teamNameSnapshot === '短跑组', '历史队伍名称仍正确显示')
  const rereadResults = parseTrainingResults(timeResults, {
    knownTeamIds: new Set(afterSession.teams.map((item) => item.id)),
    knownStudentIds: new Set([studentZhang, studentLi]),
    knownItemIds: new Set([item1000, itemJump])
  })
  assert(rereadResults.length === timeResults.length, '删除后历史 TrainingResult 仍可读取')
  assert(summarizeTeam(groupA, afterSession.members, [loadedSession], new Set([studentZhang])).sessionCount === 1, '训练统计不会因删除队伍报错')
  assert(studentCopy.every((item, index) => item.id === students[index].id && item.name === students[index].name), 'Student 记录未被删除')
  assert(loadedSession.attendance.length === 2, '不级联删除历史训练记录')
  assert(timeResults.length >= 1, '不级联删除历史训练成绩')

  const resultOnlyId = 'training-team-eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
  const resultOnlyTeam: TrainingTeam = {
    id: resultOnlyId,
    parentTeamId: null,
    name: '成绩队',
    sport: 'other',
    coach: '',
    notes: '',
    status: 'active',
    createdAt: now,
    updatedAt: now
  }
  const afterResults = applyTrainingTeamSafeDelete(
    [resultOnlyTeam],
    [],
    resultOnlyId,
    now,
    [],
    [{ ...timeResults[0], id: result4, teamId: resultOnlyId }]
  )
  assert(afterResults.teams.find((item) => item.id === resultOnlyId)?.status === 'deleted', '有 TrainingResult 的训练队也可以删除')
}

export function runTrainingTeamSelfCheckOrThrow(): string {
  runTrainingTeamSelfCheck()
  return 'training team self-check passed'
}
