import { parseScoreInput } from '../peTest/scoreFormat'
import { BUILTIN_TEST_ITEMS } from '../peTest/builtinItems'
import { listBuiltinExamStandards } from '../examStandard/catalog'
import { canMutateTrainingTeam, currentRosterStudents, filterSchoolWideStudents, hasActiveMembership, isActiveMembership, isActiveTrainingTeam, isArchivedTrainingTeam, isListedTrainingTeam, latestSessionForTeam } from './roster'
import {
  buildTrainingTeamStats,
  personalBest,
  summarizeAthleteSessions,
  summarizeTeam,
  trainingResultsForTeam
} from './stats'
import { mergeBuiltinTrainingItems, BUILTIN_TRAINING_ITEMS } from './builtinItems'
import {
  applyTrainingTeamSafeDelete,
  assertTrainingPlanChanges,
  cancelPlannedTrainingPlansForTeams,
  checkTrainingTeamSafeDelete,
  collectTrainingStudentDeleteBlockers,
  collectTrainingReferenceIssues,
  completeTrainingPlanWithSession,
  hasTrainingTeamIdentityRefs,
  linkedTrainingSessionForPlan,
  parseTrainingItems,
  parseTrainingMembers,
  parseTrainingPlans,
  parseTrainingResults,
  parseTrainingSessions,
  parseTrainingTeams
} from './validate'
import type { TrainingPlan, TrainingResult, TrainingSession, TrainingTeam, TrainingTeamMember } from './types'
import { TRAINING_SPORTS } from './types'
import { SCHOOL_STAGES, SPORT_PROGRAMS, TRAINING_LEVELS, generateBasicTrainingPlan } from './sportProgram'
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
  assert(physical.action === 'physical_delete', '空训练队 preflight 允许物理删除')
  assert(physical.check.canPhysicallyDelete, '空训练队 canPhysicallyDelete=true')
  assert(physical.teams.length === 0, '无历史训练队可以物理删除')

  const studentCopy = students.map((item) => ({ ...item }))
  const afterSession = applyTrainingTeamSafeDelete(teams, members, groupA, now, [loadedSession], timeResults)
  const archived = afterSession.teams.find((item) => item.id === groupA)
  assert(afterSession.action === 'archive', '有 TrainingSession 的训练队必须转安全归档')
  assert(archived?.status === 'archived', '有 TrainingSession 的训练队归档而非删除')
  assert(isListedTrainingTeam(archived!), '归档队伍仍保留在历史列表')
  assert(!isActiveTrainingTeam(archived!), '归档队伍不出现在 active 默认列表')
  assert(!canMutateTrainingTeam(archived!), '归档后不能开始新训练')
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
  assert(afterResults.action === 'archive', '有 TrainingResult 的训练队必须归档')
  assert(afterResults.teams.find((item) => item.id === resultOnlyId)?.status === 'archived', '有 TrainingResult 的训练队保留身份')
  assert(
    afterResults.teams.find((item) => item.id === resultOnlyId)?.status === 'archived' &&
      [{ ...timeResults[0], id: result4, teamId: resultOnlyId }].length === 1,
    '删除队伍后成绩对象仍保留在调用方数组中（不物理删除）'
  )

  const activeOnlyCheck = checkTrainingTeamSafeDelete(
    [emptyTeam],
    [member({ id: member1, teamId: emptyId, studentId: studentZhang, status: 'active' })],
    emptyId
  )
  assert(!activeOnlyCheck.canPhysicallyDelete, '有 active member 不得物理删除')
  assert(activeOnlyCheck.total.activeMemberCount === 1, 'preflight 统计 active member')

  const historicalOnlyCheck = checkTrainingTeamSafeDelete(
    [emptyTeam],
    [member({ id: memberLeft, teamId: emptyId, studentId: studentLi, status: 'left' })],
    emptyId
  )
  assert(!historicalOnlyCheck.canPhysicallyDelete, '有 archived/left member 不得物理删除')
  assert(historicalOnlyCheck.total.historicalMemberCount === 1, 'preflight 统计历史队员')

  const sessionOnlyCheck = checkTrainingTeamSafeDelete(
    [{ ...emptyTeam, id: groupA }],
    [],
    groupA,
    [loadedSession]
  )
  assert(sessionOnlyCheck.total.sessionCount === 1 && sessionOnlyCheck.action === 'archive', '有训练场次必须归档')

  const linkedResult = { ...timeResults[0], sessionId }
  const linkedResultCheck = checkTrainingTeamSafeDelete(
    [{ ...emptyTeam, id: groupA }],
    [],
    groupA,
    [loadedSession],
    [linkedResult]
  )
  assert(linkedResultCheck.total.sessionLinkedResultCount === 1, 'preflight 统计 sessionResult')
  const linkedAfter = applyTrainingTeamSafeDelete(
    [{ ...emptyTeam, id: groupA }],
    [],
    groupA,
    now,
    [loadedSession],
    [linkedResult]
  )
  assert(linkedAfter.teams.some((item) => item.id === groupA), '归档保留 session 的 teamId 目标')
  const linkedSessionReread = parseTrainingSessions([loadedSession], {
    knownTeamIds: new Set(linkedAfter.teams.map((item) => item.id))
  })
  const linkedResultReread = parseTrainingResults([linkedResult], {
    knownTeamIds: new Set(linkedAfter.teams.map((item) => item.id)),
    knownStudentIds: new Set([studentZhang]),
    knownItemIds: new Set([item1000]),
    knownSessionIds: new Set(linkedSessionReread.map((item) => item.id))
  })
  assert(linkedResultReread[0].sessionId === linkedSessionReread[0].id, '归档不破坏 TrainingResult.sessionId')

  const linkedSchedule = [{ trainingTeamId: groupA }]
  const hierarchyTeams = teams.filter((item) => item.id === teamA || item.id === groupA)
  const hierarchyCheck = checkTrainingTeamSafeDelete(
    hierarchyTeams,
    members,
    teamA,
    [loadedSession],
    timeResults,
    linkedSchedule
  )
  assert(hierarchyCheck.descendantCount === 1, 'preflight 统计间接关联子组')
  assert(hierarchyCheck.total.scheduleLinkCount === 1, 'preflight 统计子组课表关联')
  assert(hierarchyCheck.total.resultCount === timeResults.length, 'preflight 汇总子组成绩')
  assert(
    hasTrainingTeamIdentityRefs(groupA, hierarchyTeams, [], [], [], linkedSchedule),
    '常规保存边界必须把课表 trainingTeamId 视为训练队身份引用'
  )
  const hierarchyArchived = applyTrainingTeamSafeDelete(
    hierarchyTeams,
    members,
    teamA,
    now,
    [loadedSession],
    timeResults,
    linkedSchedule
  )
  assert(hierarchyArchived.action === 'archive', '有课表关联时不得物理删除训练队')
  assert(
    hierarchyArchived.teams.every((item) => item.status === 'archived'),
    '有课表关联的训练队及子组必须安全归档'
  )
  assert(linkedSchedule[0].trainingTeamId === groupA, '安全归档不得清除历史课表 trainingTeamId')

  // ---- v0.24.0 P0-1 ----
  const legacyMemberRaw = {
    id: member1,
    teamId: groupA,
    studentId: studentZhang,
    joinedAt: now,
    leftAt: null,
    status: 'active',
    nameSnapshot: '张三',
    studentNoSnapshot: 'A01',
    classNameSnapshot: '七年级3班',
    genderSnapshot: 'male',
    notes: '旧备注',
    createdAt: now,
    updatedAt: now
  }
  const legacyParsed = parseTrainingMembers([legacyMemberRaw], {
    knownTeamIds: new Set([groupA]),
    knownStudentIds: new Set([studentZhang])
  })
  assert(legacyParsed[0].specialty === '', '老队员无 specialty 仍可读')
  assert(legacyParsed[0].position === '', '老队员无 position 仍可读')
  assert(legacyParsed[0].trainingGroup === '', '老队员无 trainingGroup 仍可读')
  assert(legacyParsed[0].trainingNotes === '', '老队员无 trainingNotes 仍可读')
  assert(legacyParsed[0].notes === '旧备注', '老队员 notes 保留')

  const profiled = parseTrainingMembers(
    [
      {
        ...legacyMemberRaw,
        specialty: '100米',
        position: '',
        trainingGroup: '短跑一组',
        trainingNotes: '左踝注意热身'
      }
    ],
    { knownTeamIds: new Set([groupA]), knownStudentIds: new Set([studentZhang]) }
  )
  assert(profiled[0].specialty === '100米' && profiled[0].trainingGroup === '短跑一组', '运动员档案字段可保存')
  assert(profiled[0].trainingNotes === '左踝注意热身', '训练备注可保存')

  const boundResult = parseTrainingResults(
    [
      {
        ...baseResult,
        id: result1,
        date: '2026-09-10',
        rawInput: '3.39',
        rawValue: 219,
        sessionId
      }
    ],
    {
      knownTeamIds: new Set([groupA]),
      knownStudentIds: new Set([studentZhang]),
      knownItemIds: new Set([item1000]),
      knownSessionIds: new Set([sessionId])
    }
  )
  assert(boundResult[0].sessionId === sessionId, '课内成绩必须绑定 sessionId')

  const independent = parseTrainingResults(
    [{ ...baseResult, id: result2, date: '2026-09-11', rawInput: '3.40', rawValue: 220, sessionId: null }],
    {
      knownTeamIds: new Set([groupA]),
      knownStudentIds: new Set([studentZhang]),
      knownItemIds: new Set([item1000]),
      knownSessionIds: new Set([sessionId])
    }
  )
  assert(independent[0].sessionId === null, '独立成绩允许 sessionId 为空')

  const archivedTeam: TrainingTeam = {
    ...teams[0],
    id: teamA,
    status: 'archived',
    updatedAt: now
  }
  assert(isListedTrainingTeam(archivedTeam), 'archived 仍算 listed（历史区）')
  assert(!isActiveTrainingTeam(archivedTeam), 'archived 不得出现在 active 默认列表')
  assert(isArchivedTrainingTeam(archivedTeam), 'archived 语义')
  assert(!canMutateTrainingTeam(archivedTeam), 'archived 不能再开始新训练')

  const olderSession: TrainingSession = {
    ...loadedSession,
    id: 'training-session-99999999-9999-4999-8999-999999999999',
    date: '2026-09-01',
    updatedAt: '2026-09-01T10:00:00.000Z'
  }
  const newerSession: TrainingSession = {
    ...loadedSession,
    id: sessionId,
    date: '2026-09-10',
    updatedAt: '2026-09-10T10:00:00.000Z'
  }
  // 故意把较旧的放在数组前面，验证不按存储顺序
  const latestByDate = latestSessionForTeam([olderSession, newerSession], groupA)
  assert(latestByDate?.id === sessionId && latestByDate.date === '2026-09-10', 'latestSessionForTeam 按日期而非数组顺序')

  const customItem = parseTrainingItems([
    {
      id: 'training-item-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      builtinKey: null,
      name: '30米',
      valueType: 'time',
      timeInputMode: 'seconds',
      unit: 's',
      customUnitLabel: '',
      direction: 'lowerBetter',
      decimalPlaces: 2,
      isBuiltin: false,
      isActive: true,
      notes: '',
      createdAt: now,
      updatedAt: now
    }
  ])
  assert(customItem[0].valueType === 'time' && customItem[0].unit === 's', '自定义计时项目 round-trip')
  const customCount = parseTrainingItems([
    {
      id: 'training-item-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      builtinKey: null,
      name: '药球投掷次数',
      valueType: 'number',
      timeInputMode: 'seconds',
      unit: 'times',
      customUnitLabel: '',
      direction: 'higherBetter',
      decimalPlaces: 0,
      isBuiltin: false,
      isActive: true,
      notes: '',
      createdAt: now,
      updatedAt: now
    }
  ])
  assert(customCount[0].unit === 'times' && customCount[0].valueType === 'number', '自定义次数项目 round-trip')

  // ---- v0.24.0 P0-4 unified statistics ----
  const emptyStats = buildTrainingTeamStats(emptyId, [], [], [])
  assert(
    emptyStats.activeMemberCount === 0 &&
      emptyStats.historicalMemberCount === 0 &&
      emptyStats.sessionCount === 0 &&
      emptyStats.resultCount === 0 &&
      emptyStats.latestSessionDate === null,
    '空训练队统计应全部为 0 且不报错'
  )

  const linkedBySession: TrainingResult = {
    ...boundResult[0],
    id: result1,
    teamId: teamB,
    sessionId
  }
  const independentForGroup: TrainingResult = {
    ...independent[0],
    id: result2,
    teamId: groupA,
    sessionId: null
  }
  const independentForOtherTeam: TrainingResult = {
    ...independent[0],
    id: result3,
    teamId: teamB,
    sessionId: null
  }
  const orphanLinkedResult: TrainingResult = {
    ...boundResult[0],
    id: result4,
    teamId: groupA,
    sessionId: 'training-session-dddddddd-dddd-4ddd-8ddd-dddddddddddd'
  }
  const attributionResults = [
    linkedBySession,
    independentForGroup,
    independentForOtherTeam,
    orphanLinkedResult
  ]
  const groupStats = buildTrainingTeamStats(
    groupA,
    members,
    [olderSession, newerSession],
    attributionResults
  )
  assert(groupStats.activeMemberCount === 1, 'active member 正确计入当前队员')
  assert(
    groupStats.historicalMemberCount === 1 && groupStats.totalMemberCount === 2,
    'left member 不计 active 但保留历史与总成员统计'
  )
  assert(
    groupStats.sessionCount === 2 &&
      groupStats.completedSessionCount === 2 &&
      groupStats.latestSessionDate === '2026-09-10',
    '训练次数与最近训练日期必须按 trainingTeamId 统一统计'
  )
  assert(
    groupStats.sessionLinkedResultCount === 1 &&
      groupStats.independentResultCount === 1 &&
      groupStats.resultCount === 2,
    'linked result 按 session 归属，independent result 仅按显式 teamId 归属'
  )
  assert(groupStats.itemStats[0]?.resultCount === 2, '训练项目成绩记录数量统计正确')
  assert(groupStats.latestResult?.id === independentForGroup.id, '最近一次成绩必须按日期计算而非数组顺序')
  const activeMemberStats = groupStats.memberStats.find((item) => item.memberId === member1)
  const historicalMemberStats = groupStats.memberStats.find((item) => item.memberId === memberLeft)
  assert(
    activeMemberStats?.trainingSessionCount === 2 &&
      activeMemberStats.scoredSessionCount === 1 &&
      activeMemberStats.resultCount === 2,
    '成员训练次数、有成绩训练次数和队内成绩数量正确'
  )
  assert(
    historicalMemberStats?.isCurrentMember === false &&
      historicalMemberStats.trainingSessionCount === 2,
    'left member 仍保留历史训练统计'
  )
  const otherTeamStats = buildTrainingTeamStats(teamB, members, [], attributionResults)
  assert(
    otherTeamStats.resultCount === 1 &&
      otherTeamStats.independentResultCount === 1 &&
      otherTeamStats.sessionLinkedResultCount === 0,
    '同一学生属于多个训练队时统计不得串队'
  )
  assert(
    trainingResultsForTeam(groupA, [newerSession], attributionResults).every(
      (item) => item.id !== independentForOtherTeam.id && item.id !== orphanLinkedResult.id
    ),
    '其它队独立成绩和丢失 session 的 linked result 不得猜测归入当前队'
  )
  const archivedStats = buildTrainingTeamStats(
    groupA,
    afterSession.members,
    [newerSession],
    [linkedBySession, independentForGroup]
  )
  assert(
    archivedStats.activeMemberCount === 0 &&
      archivedStats.historicalMemberCount >= 1 &&
      archivedStats.sessionCount === 1 &&
      archivedStats.resultCount === 2,
    'archived team 仍可读取成员、训练和成绩历史统计'
  )

  // ---- v0.24.0 P0-5 training plan → session ----
  assert(parseTrainingPlans([]).length === 0, '旧 JSON 无 TrainingPlan 时应视为空列表')
  assert(loadedSession.planId === undefined, '独立 TrainingSession 无 planId 仍正常')

  const planId = 'training-plan-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  const futurePlanId = 'training-plan-cccccccc-cccc-4ccc-8ccc-cccccccccccc'
  const cancelledPlanId = 'training-plan-dddddddd-dddd-4ddd-8ddd-dddddddddddd'
  const planSessionId = 'training-session-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  const knownTeamIds = new Set([teamA, teamB, groupA])
  const plannedPlan: TrainingPlan = {
    id: planId,
    trainingTeamId: teamA,
    date: '2026-09-16',
    title: '篮球基础进攻',
    goal: '提高行进间传接球稳定性',
    content: '1. 动态热身\n2. 两人移动传接球\n3. 三人快攻',
    notes: '重点观察无球队员跑位',
    status: 'planned',
    createdAt: now,
    updatedAt: now
  }
  const parsedPlans = parseTrainingPlans([plannedPlan], { knownTeamIds })
  assert(parsedPlans[0].trainingTeamId === teamA, '训练计划必须绑定 trainingTeamId')
  assert(parsedPlans[0].blueprint === undefined, '旧训练计划没有生成来源时不得补写 blueprint')
  assertTrainingPlanChanges([], parsedPlans, teams, [])

  let archivedCreateFailed = false
  try {
    assertTrainingPlanChanges(
      [],
      parsedPlans,
      teams.map((item) => (item.id === teamA ? { ...item, status: 'archived' as const } : item)),
      []
    )
  } catch {
    archivedCreateFailed = true
  }
  assert(archivedCreateFailed, 'archived team 不可新建计划')

  let missingTeamFailed = false
  try {
    parseTrainingPlans([plannedPlan], { knownTeamIds: new Set() })
  } catch {
    missingTeamFailed = true
  }
  assert(missingTeamFailed, 'deleted/missing team 不得新建计划')

  const editedPlan = {
    ...parsedPlans[0],
    title: '篮球基础进攻（修订）',
    updatedAt: '2026-09-16T11:00:00.000Z'
  }
  assertTrainingPlanChanges(parsedPlans, [editedPlan], teams, [])

  const cancelledPlan = {
    ...parsedPlans[0],
    status: 'cancelled' as const,
    updatedAt: '2026-09-16T12:00:00.000Z'
  }
  assertTrainingPlanChanges(parsedPlans, [cancelledPlan], teams, [])

  let completeViaSaveFailed = false
  try {
    assertTrainingPlanChanges(
      parsedPlans,
      [{ ...parsedPlans[0], status: 'completed' as const }],
      teams,
      []
    )
  } catch {
    completeViaSaveFailed = true
  }
  assert(completeViaSaveFailed, 'planned 计划不能通过普通保存改成 completed')

  const planSession: TrainingSession = {
    ...sessionPayload,
    id: planSessionId,
    teamId: teamA,
    title: plannedPlan.title,
    notes: plannedPlan.notes,
    planId
  }
  const completed = completeTrainingPlanWithSession(parsedPlans, [], planId, planSession, now)
  assert(completed.sessions[0].teamId === teamA, '从计划创建的 session.trainingTeamId 必须正确')
  assert(completed.sessions[0].planId === planId, '从计划创建的 session.planId 必须正确')
  assert(completed.plans[0].status === 'completed', '保存关联 session 后计划应变 completed')
  assert(
    linkedTrainingSessionForPlan(completed.sessions, planId)?.id === planSessionId,
    'completed plan 应能定位到唯一关联训练记录'
  )

  let duplicateStartFailed = false
  try {
    completeTrainingPlanWithSession(
      completed.plans,
      completed.sessions,
      planId,
      {
        ...planSession,
        id: 'training-session-cccccccc-cccc-4ccc-8ccc-cccccccccccc'
      },
      now
    )
  } catch {
    duplicateStartFailed = true
  }
  assert(duplicateStartFailed, 'completed plan 不能重复生成第二个 session')

  let duplicatePlanIdFailed = false
  try {
    parseTrainingSessions(
      [
        planSession,
        {
          ...planSession,
          id: 'training-session-cccccccc-cccc-4ccc-8ccc-cccccccccccc'
        }
      ],
      { knownTeamIds, knownPlanIds: new Set([planId]) }
    )
  } catch {
    duplicatePlanIdFailed = true
  }
  assert(duplicatePlanIdFailed, '同一 planId 不能绑定两次训练记录')

  const editedLinkedSession = {
    ...completed.sessions[0],
    title: '现场改为防守对抗',
    notes: '根据当天情况调整'
  }
  assert(completed.plans[0].title === '篮球基础进攻', '修改 session 不得重写原计划内容')
  assert(editedLinkedSession.planId === planId, '编辑 session 后 plan → session 历史关联仍保留')

  let deleteCompletedFailed = false
  try {
    assertTrainingPlanChanges(completed.plans, [], teams, completed.sessions)
  } catch {
    deleteCompletedFailed = true
  }
  assert(deleteCompletedFailed, '已有训练记录的计划不能删除')

  const leftoverCancelled: TrainingPlan = {
    ...plannedPlan,
    id: cancelledPlanId,
    status: 'cancelled',
    title: '未执行计划'
  }
  assertTrainingPlanChanges([leftoverCancelled], [], teams, completed.sessions)
  assert(completed.sessions[0].id === planSessionId, '删除/取消计划不得破坏 TrainingSession')

  const futurePlan: TrainingPlan = {
    ...plannedPlan,
    id: futurePlanId,
    date: '2026-09-20',
    title: '未来力量课'
  }
  const afterArchivePlans = cancelPlannedTrainingPlansForTeams(
    [...completed.plans, futurePlan],
    new Set([teamA]),
    now
  )
  assert(
    afterArchivePlans.find((item) => item.id === futurePlanId)?.status === 'cancelled',
    '归档时未执行 planned 计划应转为 cancelled'
  )
  assert(
    afterArchivePlans.find((item) => item.id === planId)?.status === 'completed',
    '归档后历史已完成计划必须保留'
  )

  const planOnEmpty: TrainingPlan = { ...futurePlan, trainingTeamId: emptyId }
  const planOnlyCheck = checkTrainingTeamSafeDelete(
    [emptyTeam],
    [],
    emptyId,
    [],
    [],
    [],
    [planOnEmpty]
  )
  assert(planOnlyCheck.action === 'archive' && planOnlyCheck.total.planCount === 1, '有训练计划的空队不得物理删除')
  assert(
    hasTrainingTeamIdentityRefs(teamA, teams, [], [], [], [], [futurePlan]),
    '训练计划 trainingTeamId 视为训练队身份引用'
  )

  const statsAfterPlans = buildTrainingTeamStats(
    groupA,
    members,
    [olderSession, newerSession],
    attributionResults
  )
  assert(
    statsAfterPlans.sessionCount === 2 &&
      statsAfterPlans.resultCount === 2 &&
      statsAfterPlans.latestSessionDate === '2026-09-10',
    'P0-4 统计仍然正确，训练计划不改写统一统计'
  )

  // ---- v0.24.0 P0-6 reference integrity ----
  const consistentIssues = collectTrainingReferenceIssues({
    teams,
    members,
    sessions: completed.sessions,
    plans: completed.plans,
    results: attributionResults.filter((item) => item.teamId === teamA || item.sessionId === planSessionId)
  })
  assert(consistentIssues.length === 0, `一致数据不应有引用问题：${consistentIssues.join('；')}`)

  const independentIssues = collectTrainingReferenceIssues({
    teams,
    sessions: [loadedSession],
    plans: []
  })
  assert(independentIssues.length === 0, '无 planId 的旧 TrainingSession 引用应保持正常')

  const missingSessionIssues = collectTrainingReferenceIssues({
    teams,
    sessions: [],
    plans: completed.plans
  })
  assert(
    missingSessionIssues.some((item) => item.includes('没有关联训练记录')),
    'completed 计划缺少关联 session 必须被检出'
  )

  const duplicateSessionIssues = collectTrainingReferenceIssues({
    teams,
    sessions: [
      planSession,
      { ...planSession, id: 'training-session-cccccccc-cccc-4ccc-8ccc-cccccccccccc' }
    ],
    plans: completed.plans
  })
  assert(
    duplicateSessionIssues.some((item) => item.includes('多条正式训练记录')),
    '同一 plan 多条正式 session 必须被检出'
  )

  const archivedPlannedIssues = collectTrainingReferenceIssues({
    teams: teams.map((item) => (item.id === teamA ? { ...item, status: 'archived' as const } : item)),
    sessions: [],
    plans: [futurePlan]
  })
  assert(
    archivedPlannedIssues.some((item) => item.includes('已停用训练队仍有待执行计划')),
    '归档后仍残留 planned 计划必须被检出'
  )

  const orphanPlanIssues = collectTrainingReferenceIssues({
    teams: teams.filter((item) => item.id !== teamA),
    sessions: [],
    plans: [futurePlan]
  })
  assert(
    orphanPlanIssues.some((item) => item.includes('孤立训练计划')),
    '删除队伍后悬空计划必须被检出'
  )

  const trackNames = ['短跑', '中长跑', '跳高', '跳远', '三级跳远', '跨栏', '投掷', '接力']
  assert(new Set(SPORT_PROGRAMS.map((item) => item.id)).size === SPORT_PROGRAMS.length, '训练项目编号不能重复')
  assert(
    trackNames.every((name) => SPORT_PROGRAMS.some((item) => item.sport === 'track' && item.name === name)),
    '田径必须包含短跑、中长跑、跳高、跳远、三级跳远、跨栏、投掷、接力'
  )
  assert(
    TRAINING_SPORTS.filter((sport) => sport !== 'other').every((sport) =>
      SPORT_PROGRAMS.some((item) => item.sport === sport)
    ),
    '除“其他”外，每个队伍项目都要能生成基础计划'
  )
  const seen = new Set<string>()
  for (const program of SPORT_PROGRAMS) {
    for (const stage of SCHOOL_STAGES) {
      for (const level of TRAINING_LEVELS) {
        const generated = generateBasicTrainingPlan({ stage, programId: program.id, level })
        const key = `${stage}|${program.id}|${level}`
        assert(!seen.has(generated.content), `${key} 的训练内容与其他组合重复`)
        seen.add(generated.content)
        assert(generated.title.includes(program.name), `${key} 标题必须带项目名`)
        assert(generated.content.includes('课前确认'), `${key} 必须先写安全确认`)
        assert(generated.blueprint.programId === program.id, `${key} 来源项目不正确`)
        assert(generated.blueprint.stage === stage && generated.blueprint.level === level, `${key} 来源学段或水平不正确`)
      }
    }
  }
  const swim = generateBasicTrainingPlan({ stage: 'primary', programId: 'swimming', level: 'starter' })
  assert(swim.content.includes('看护') && swim.content.includes('浅水'), '小学游泳入门必须写明看护和浅水')
  const triple = generateBasicTrainingPlan({ stage: 'primary', programId: 'track-triple-jump', level: 'starter' })
  assert(triple.content.includes('沙坑') && triple.content.includes('硬地'), '小学三级跳远必须限制硬地')
  const throwsPlan = generateBasicTrainingPlan({ stage: 'junior', programId: 'track-throws', level: 'basic' })
  assert(throwsPlan.content.includes('口令'), '投掷计划必须要求统一口令捡器械')
  const seniorSprint = generateBasicTrainingPlan({ stage: 'senior', programId: 'track-sprint', level: 'developing' })
  const primarySprint = generateBasicTrainingPlan({ stage: 'primary', programId: 'track-sprint', level: 'developing' })
  assert(seniorSprint.content !== primarySprint.content, '同一项目和水平在不同学段的剂量必须不同')

  const generatedPlanId = 'training-plan-eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
  const generated = generateBasicTrainingPlan({ stage: 'junior', programId: 'basketball', level: 'basic' })
  const roundTrip = parseTrainingPlans(
    [
      {
        id: generatedPlanId,
        trainingTeamId: teamA,
        date: '2026-09-20',
        title: generated.title,
        goal: generated.goal,
        content: generated.content,
        notes: generated.notes,
        status: 'planned',
        blueprint: generated.blueprint,
        createdAt: now,
        updatedAt: now
      }
    ],
    { knownTeamIds }
  )
  assert(
    roundTrip[0].blueprint?.stage === 'junior' &&
      roundTrip[0].blueprint.programId === 'basketball' &&
      roundTrip[0].blueprint.level === 'basic',
    '生成来源必须能保存后再读出'
  )
  assertTrainingPlanChanges(parsedPlans, [...parsedPlans, roundTrip[0]], teams, [])

  let invalidBlueprint = false
  try {
    parseTrainingPlans([{ ...plannedPlan, id: generatedPlanId, blueprint: { stage: 'junior', programId: 'missing', level: 'basic' } }])
  } catch {
    invalidBlueprint = true
  }
  assert(invalidBlueprint, '不存在的生成项目必须拒绝')

  const volleyballTeam = parseTrainingTeams([
    {
      id: 'training-team-dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      parentTeamId: null,
      name: '校排球队',
      sport: 'volleyball',
      coach: '',
      notes: '',
      status: 'active',
      createdAt: now,
      updatedAt: now
    }
  ])
  assert(volleyballTeam[0].sport === 'volleyball', '新增项目排球必须能从旧解析入口读入')
  let unknownSport = false
  try {
    parseTrainingTeams([
      {
        id: 'training-team-dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        parentTeamId: null,
        name: '未知项目',
        sport: 'tennis',
        coach: '',
        notes: '',
        status: 'active',
        createdAt: now,
        updatedAt: now
      }
    ])
  } catch {
    unknownSport = true
  }
  assert(unknownSport, '未接入的项目名称必须拒绝')
}

export function runTrainingTeamSelfCheckOrThrow(): string {
  runTrainingTeamSelfCheck()
  return 'training team self-check passed'
}
