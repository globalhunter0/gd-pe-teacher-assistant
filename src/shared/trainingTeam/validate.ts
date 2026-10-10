import { TEST_DIRECTIONS, TEST_UNITS, TEST_VALUE_TYPES, TIME_INPUT_MODES } from '../peTest/types'
import type { TestDirection, TestUnit, TestValueType, TimeInputMode } from '../peTest/types'
import { STUDENT_GENDERS, type StudentGender } from '../student/types'
import type {
  TrainingAttendance,
  TrainingExercise,
  TrainingExerciseKind,
  TrainingItem,
  TrainingMemberStatus,
  TrainingPlan,
  TrainingPlanBlueprint,
  TrainingPlanSessionResult,
  TrainingPlanStatus,
  TrainingParticipation,
  TrainingCompletion,
  TrainingResult,
  TrainingResultKind,
  TrainingResultStatus,
  TrainingSession,
  TrainingSessionRecordResult,
  TrainingPhase,
  TrainingSessionFocus,
  TrainingSport,
  TrainingTeam,
  TrainingTeamDeleteCheck,
  TrainingTeamDeleteCounts,
  TrainingTeamMember,
  TrainingTeamSafeDeleteResult,
  TrainingTeamStatus
} from './types'
import { getSportProgram, isSchoolStage, isTrainingLevel } from './sportProgram'
import {
  TRAINING_COMPLETIONS,
  TRAINING_EXERCISE_KINDS,
  TRAINING_MEMBER_STATUSES,
  TRAINING_PARTICIPATIONS,
  TRAINING_PHASES,
  TRAINING_PLAN_STATUSES,
  TRAINING_SESSION_FOCUSES,
  TRAINING_RESULT_KINDS,
  TRAINING_RESULT_STATUSES,
  TRAINING_SPORTS,
  TRAINING_TEAM_STATUSES
} from './types'

const TEAM_ID = /^training-team-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MEMBER_ID = /^training-member-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SESSION_ID = /^training-session-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EXERCISE_ID = /^training-exercise-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ATTENDANCE_ID = /^training-attendance-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ITEM_CUSTOM_ID = /^training-item-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ITEM_BUILTIN_ID = /^training-item-builtin-[a-z0-9-]+$/
const RESULT_ID = /^training-result-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const BLOCK_ID = /^training-block-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PLAN_ID = /^training-plan-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const STUDENT_ID = /^student-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

export function createTrainingTeamId(): string {
  return `training-team-${crypto.randomUUID()}`
}

export function createTrainingMemberId(): string {
  return `training-member-${crypto.randomUUID()}`
}

export function createTrainingSessionId(): string {
  return `training-session-${crypto.randomUUID()}`
}

export function createTrainingPlanId(): string {
  return `training-plan-${crypto.randomUUID()}`
}

export function createTrainingExerciseId(): string {
  return `training-exercise-${crypto.randomUUID()}`
}

export function createTrainingAttendanceId(): string {
  return `training-attendance-${crypto.randomUUID()}`
}

export function createTrainingItemId(): string {
  return `training-item-${crypto.randomUUID()}`
}

export function createTrainingResultId(): string {
  return `training-result-${crypto.randomUUID()}`
}

export function formatTrainingDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    throw new Error(`${label}格式不正确`)
  }
  return value as Record<string, unknown>
}

function parseText(value: unknown, label: string, required = false, max = 200): string {
  if (value === undefined || value === null) {
    if (required) {
      throw new Error(`${label}不能为空`)
    }
    return ''
  }
  if (typeof value !== 'string') {
    throw new Error(`${label}格式不正确`)
  }
  const text = value.trim()
  if (required && text === '') {
    throw new Error(`${label}不能为空`)
  }
  if (text.length > max) {
    throw new Error(`${label}过长`)
  }
  return text
}

function parseOptionalInt(value: unknown, label: string, min = 0, max = 100000): number | null {
  if (value === undefined || value === null || value === '') {
    return null
  }
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${label}不正确`)
  }
  return value
}

function parseRequiredNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label}不正确`)
  }
  return value
}

function isSport(value: unknown): value is TrainingSport {
  return TRAINING_SPORTS.includes(value as TrainingSport)
}

function parsePlanBlueprint(value: unknown): TrainingPlanBlueprint | undefined {
  if (value === undefined || value === null) {
    return undefined
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('训练计划来源格式不正确')
  }
  const record = value as Record<string, unknown>
  if (!isSchoolStage(record.stage) || !isTrainingLevel(record.level) || typeof record.programId !== 'string') {
    throw new Error('训练计划来源不正确')
  }
  if (!getSportProgram(record.programId)) {
    throw new Error('训练计划来源项目不存在')
  }
  const blueprint: TrainingPlanBlueprint = {
    stage: record.stage,
    programId: record.programId,
    level: record.level
  }
  const durationMinutes = parseOptionalInt(record.durationMinutes, '训练计划时长', 10, 600)
  if (durationMinutes !== null) {
    blueprint.durationMinutes = durationMinutes
  }
  if (record.blockId !== undefined && record.blockId !== null) {
    if (typeof record.blockId !== 'string' || !BLOCK_ID.test(record.blockId)) {
      throw new Error('训练周期编号不正确')
    }
    blueprint.blockId = record.blockId
  }
  const ints = [
    ['week', 1, 52],
    ['session', 1, 14],
    ['totalWeeks', 1, 52],
    ['sessionsPerWeek', 1, 14]
  ] as const
  for (const [key, min, max] of ints) {
    const value = parseOptionalInt(record[key], '训练计划来源', min, max)
    if (value !== null) {
      blueprint[key] = value
    }
  }
  if (record.phase !== undefined && record.phase !== null) {
    if (!TRAINING_PHASES.includes(record.phase as TrainingPhase)) {
      throw new Error('训练计划阶段不正确')
    }
    blueprint.phase = record.phase as TrainingPhase
  }
  if (record.focus !== undefined && record.focus !== null) {
    if (!TRAINING_SESSION_FOCUSES.includes(record.focus as TrainingSessionFocus)) {
      throw new Error('训练计划课次重点不正确')
    }
    blueprint.focus = record.focus as TrainingSessionFocus
  }
  return blueprint
}

function isTeamStatus(value: unknown): value is TrainingTeamStatus {
  return TRAINING_TEAM_STATUSES.includes(value as TrainingTeamStatus)
}

function isMemberStatus(value: unknown): value is TrainingMemberStatus {
  return TRAINING_MEMBER_STATUSES.includes(value as TrainingMemberStatus)
}

function isParticipation(value: unknown): value is TrainingParticipation {
  return TRAINING_PARTICIPATIONS.includes(value as TrainingParticipation)
}

function isCompletion(value: unknown): value is TrainingCompletion {
  return TRAINING_COMPLETIONS.includes(value as TrainingCompletion)
}

function isExerciseKind(value: unknown): value is TrainingExerciseKind {
  return TRAINING_EXERCISE_KINDS.includes(value as TrainingExerciseKind)
}

function isResultKind(value: unknown): value is TrainingResultKind {
  return TRAINING_RESULT_KINDS.includes(value as TrainingResultKind)
}

function isResultStatus(value: unknown): value is TrainingResultStatus {
  return TRAINING_RESULT_STATUSES.includes(value as TrainingResultStatus)
}

function isPlanStatus(value: unknown): value is TrainingPlanStatus {
  return TRAINING_PLAN_STATUSES.includes(value as TrainingPlanStatus)
}

function isGender(value: unknown): value is StudentGender {
  return STUDENT_GENDERS.includes(value as StudentGender)
}

export function parseTrainingTeams(input: unknown): TrainingTeam[] {
  if (!Array.isArray(input)) {
    throw new Error('训练队数据格式不正确')
  }

  const teams = input.map((entry) => {
    const record = asRecord(entry, '训练队')
    const id = record.id
    const parentTeamId = record.parentTeamId
    if (typeof id !== 'string' || !TEAM_ID.test(id)) {
      throw new Error('训练队编号不正确')
    }
    if (parentTeamId !== null && (typeof parentTeamId !== 'string' || !TEAM_ID.test(parentTeamId))) {
      throw new Error('上级训练队编号不正确')
    }
    if (parentTeamId === id) {
      throw new Error('训练队不能以自己为上级')
    }
    if (!isSport(record.sport) || !isTeamStatus(record.status)) {
      throw new Error('训练队项目或状态不正确')
    }
    if (typeof record.createdAt !== 'string' || typeof record.updatedAt !== 'string') {
      throw new Error('训练队时间字段不正确')
    }
    return {
      id,
      parentTeamId,
      name: parseText(record.name, '训练队名称', true, 80),
      sport: record.sport,
      coach: parseText(record.coach, '教练', false, 40),
      notes: parseText(record.notes, '训练队备注', false, 500),
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    } satisfies TrainingTeam
  })

  const ids = new Set<string>()
  for (const team of teams) {
    if (ids.has(team.id)) {
      throw new Error('训练队编号不能重复')
    }
    ids.add(team.id)
  }

  for (const team of teams) {
    if (!team.parentTeamId) {
      continue
    }
    const parent = teams.find((item) => item.id === team.parentTeamId)
    if (!parent) {
      throw new Error(`找不到上级训练队：${team.name}`)
    }
    if (parent.parentTeamId) {
      throw new Error('训练组只能挂在队伍下，不能再嵌套')
    }
  }

  return teams.sort((a, b) => a.sport.localeCompare(b.sport) || a.name.localeCompare(b.name, 'zh-CN'))
}

export interface ParseTrainingPlanOptions {
  knownTeamIds?: ReadonlySet<string>
}

export function parseTrainingPlans(
  input: unknown,
  options: ParseTrainingPlanOptions = {}
): TrainingPlan[] {
  if (!Array.isArray(input)) {
    throw new Error('训练计划数据格式不正确')
  }
  const plans = input.map((entry) => {
    const record = asRecord(entry, '训练计划')
    if (typeof record.id !== 'string' || !PLAN_ID.test(record.id)) {
      throw new Error('训练计划编号不正确')
    }
    if (
      typeof record.trainingTeamId !== 'string' ||
      !TEAM_ID.test(record.trainingTeamId)
    ) {
      throw new Error('训练计划所属队伍不正确')
    }
    if (
      options.knownTeamIds &&
      !options.knownTeamIds.has(record.trainingTeamId)
    ) {
      throw new Error('训练计划所属队伍不存在')
    }
    if (typeof record.date !== 'string' || !DATE_PATTERN.test(record.date)) {
      throw new Error('训练计划日期不正确')
    }
    if (!isPlanStatus(record.status)) {
      throw new Error('训练计划状态不正确')
    }
    if (
      typeof record.createdAt !== 'string' ||
      typeof record.updatedAt !== 'string'
    ) {
      throw new Error('训练计划时间字段不正确')
    }
    const blueprint = parsePlanBlueprint(record.blueprint)
    return {
      id: record.id,
      trainingTeamId: record.trainingTeamId,
      date: record.date,
      title: parseText(record.title, '训练主题', true, 80),
      goal: parseText(record.goal, '训练目标', false, 1000),
      content: parseText(record.content, '训练内容', true, 4000),
      notes: parseText(record.notes, '训练计划备注', false, 1000),
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      ...(blueprint ? { blueprint } : {})
    } satisfies TrainingPlan
  })
  const ids = new Set<string>()
  for (const plan of plans) {
    if (ids.has(plan.id)) {
      throw new Error('训练计划编号不能重复')
    }
    ids.add(plan.id)
  }
  return plans.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.createdAt.localeCompare(b.createdAt) ||
      a.id.localeCompare(b.id)
  )
}

export function assertTrainingPlanChanges(
  current: ReadonlyArray<TrainingPlan>,
  next: ReadonlyArray<TrainingPlan>,
  teams: ReadonlyArray<TrainingTeam>,
  sessions: ReadonlyArray<TrainingSession>
): void {
  const currentById = new Map(current.map((plan) => [plan.id, plan]))
  const nextById = new Map(next.map((plan) => [plan.id, plan]))
  const teamById = new Map(teams.map((team) => [team.id, team]))

  for (const plan of next) {
    const previous = currentById.get(plan.id)
    const team = teamById.get(plan.trainingTeamId)
    if (!previous) {
      if (!team || team.status !== 'active' || plan.status !== 'planned') {
        throw new Error('只能为启用中的训练队新建待执行计划')
      }
      continue
    }
    if (previous.trainingTeamId !== plan.trainingTeamId) {
      throw new Error('训练计划创建后不能更换所属训练队')
    }
    if (previous.status === 'completed' || previous.status === 'cancelled') {
      if (JSON.stringify(previous) !== JSON.stringify(plan)) {
        throw new Error('已完成或已取消的训练计划不能修改')
      }
      continue
    }
    if (!team || team.status !== 'active') {
      throw new Error('已停用训练队的待执行计划不能修改')
    }
    if (plan.status === 'completed') {
      throw new Error('训练计划只能在保存关联训练记录后完成')
    }
    if (
      plan.status === 'cancelled' &&
      sessions.some((session) => session.planId === plan.id)
    ) {
      throw new Error('已有训练记录的计划不能取消')
    }
  }

  for (const plan of current) {
    if (nextById.has(plan.id)) {
      continue
    }
    if (
      plan.status === 'completed' ||
      sessions.some((session) => session.planId === plan.id)
    ) {
      throw new Error('已有训练记录的计划不能删除')
    }
  }
}

export function cancelPlannedTrainingPlansForTeams(
  plans: ReadonlyArray<TrainingPlan>,
  teamIds: ReadonlySet<string>,
  now: string
): TrainingPlan[] {
  return plans.map((plan) =>
    teamIds.has(plan.trainingTeamId) && plan.status === 'planned'
      ? { ...plan, status: 'cancelled', updatedAt: now }
      : plan
  )
}

export function completeTrainingPlanWithSession(
  plans: ReadonlyArray<TrainingPlan>,
  sessions: ReadonlyArray<TrainingSession>,
  planId: string,
  session: TrainingSession,
  now: string
): TrainingPlanSessionResult {
  const plan = plans.find((item) => item.id === planId)
  if (!plan) {
    throw new Error('训练计划不存在')
  }
  if (plan.status !== 'planned') {
    throw new Error('该训练计划已经完成或取消，不能重复开始训练')
  }
  if (sessions.some((item) => item.planId === planId)) {
    throw new Error('该训练计划已经生成训练记录')
  }
  if (session.planId !== planId || session.teamId !== plan.trainingTeamId) {
    throw new Error('训练记录与训练计划归属不一致')
  }
  if (sessions.some((item) => item.id === session.id)) {
    throw new Error('训练记录编号已存在')
  }
  return {
    plans: plans.map((item) =>
      item.id === planId
        ? { ...item, status: 'completed', updatedAt: now }
        : item
    ),
    sessions: [...sessions, session]
  }
}

/** A new session started from a plan completes that plan; the session's bound results are replaced as a whole. */
export function recordTrainingSession(
  plans: ReadonlyArray<TrainingPlan>,
  sessions: ReadonlyArray<TrainingSession>,
  results: ReadonlyArray<TrainingResult>,
  session: TrainingSession,
  sessionResults: ReadonlyArray<TrainingResult>,
  now: string
): TrainingSessionRecordResult {
  if (sessionResults.some((item) => item.sessionId !== session.id)) {
    throw new Error('当堂成绩必须绑定到本次训练记录')
  }
  const isNew = !sessions.some((item) => item.id === session.id)
  const next: TrainingPlanSessionResult =
    session.planId && isNew
      ? completeTrainingPlanWithSession(plans, sessions, session.planId, session, now)
      : {
          plans: [...plans],
          sessions: isNew
            ? [...sessions, session]
            : sessions.map((item) => (item.id === session.id ? session : item))
        }
  return {
    ...next,
    results: [...results.filter((item) => item.sessionId !== session.id), ...sessionResults]
  }
}

export function linkedTrainingSessionForPlan(
  sessions: ReadonlyArray<TrainingSession>,
  planId: string
): TrainingSession | undefined {
  return sessions.find((item) => item.planId === planId)
}

export function collectTrainingReferenceIssues(input: {
  teams: ReadonlyArray<Pick<TrainingTeam, 'id' | 'status'>>
  members?: ReadonlyArray<Pick<TrainingTeamMember, 'id' | 'teamId'>>
  sessions?: ReadonlyArray<Pick<TrainingSession, 'id' | 'teamId' | 'planId'>>
  plans?: ReadonlyArray<Pick<TrainingPlan, 'id' | 'trainingTeamId' | 'status'>>
  results?: ReadonlyArray<Pick<TrainingResult, 'id' | 'teamId' | 'sessionId'>>
  scheduleItems?: ReadonlyArray<{ trainingTeamId?: string }>
}): string[] {
  const issues: string[] = []
  const teamIds = new Set(input.teams.map((item) => item.id))
  const teamStatus = new Map(input.teams.map((item) => [item.id, item.status]))
  const sessionIds = new Set((input.sessions ?? []).map((item) => item.id))
  const planIds = new Set((input.plans ?? []).map((item) => item.id))
  const sessionsByPlan = new Map<string, Array<Pick<TrainingSession, 'id' | 'teamId' | 'planId'>>>()

  for (const member of input.members ?? []) {
    if (!teamIds.has(member.teamId)) {
      issues.push(`孤立队员引用 ${member.id}`)
    }
  }

  for (const session of input.sessions ?? []) {
    if (!teamIds.has(session.teamId)) {
      issues.push(`孤立训练记录 ${session.id}`)
    }
    if (session.planId) {
      if (!planIds.has(session.planId)) {
        issues.push(`训练记录 ${session.id} 的 planId 不存在`)
      }
      const list = sessionsByPlan.get(session.planId) ?? []
      list.push(session)
      sessionsByPlan.set(session.planId, list)
    }
  }

  for (const [planId, linked] of sessionsByPlan) {
    if (linked.length > 1) {
      issues.push(`训练计划 ${planId} 关联了多条正式训练记录`)
    }
  }

  for (const plan of input.plans ?? []) {
    if (!teamIds.has(plan.trainingTeamId)) {
      issues.push(`孤立训练计划 ${plan.id}`)
    }
    const linked = sessionsByPlan.get(plan.id) ?? []
    if (plan.status === 'completed' && linked.length === 0) {
      issues.push(`已完成计划 ${plan.id} 没有关联训练记录`)
    }
    if (plan.status === 'planned' && linked.length > 0) {
      issues.push(`待执行计划 ${plan.id} 已有关联训练记录`)
    }
    if (teamStatus.get(plan.trainingTeamId) === 'archived' && plan.status === 'planned') {
      issues.push(`已停用训练队仍有待执行计划 ${plan.id}`)
    }
    if (linked[0] && linked[0].teamId !== plan.trainingTeamId) {
      issues.push(`计划 ${plan.id} 与训练记录队伍不一致`)
    }
  }

  for (const result of input.results ?? []) {
    if (!teamIds.has(result.teamId)) {
      issues.push(`孤立成绩 ${result.id}`)
    }
    if (result.sessionId && !sessionIds.has(result.sessionId)) {
      issues.push(`成绩 ${result.id} 的 sessionId 不存在`)
    }
  }

  for (const item of input.scheduleItems ?? []) {
    if (item.trainingTeamId && !teamIds.has(item.trainingTeamId)) {
      issues.push(`课表 trainingTeamId ${item.trainingTeamId} 指向不存在的训练队`)
    }
  }

  return issues
}

export interface ParseMemberOptions {
  knownTeamIds?: ReadonlySet<string>
  knownStudentIds?: ReadonlySet<string>
}

export function parseTrainingMembers(input: unknown, options: ParseMemberOptions = {}): TrainingTeamMember[] {
  if (!Array.isArray(input)) {
    throw new Error('训练队员数据格式不正确')
  }

  const members = input.map((entry) => {
    const record = asRecord(entry, '训练队员')
    if (typeof record.id !== 'string' || !MEMBER_ID.test(record.id)) {
      throw new Error('队员关系编号不正确')
    }
    if (typeof record.teamId !== 'string' || !TEAM_ID.test(record.teamId)) {
      throw new Error('队员所属训练队不正确')
    }
    if (typeof record.studentId !== 'string' || !STUDENT_ID.test(record.studentId)) {
      throw new Error('队员必须关联现有学生编号')
    }
    if (options.knownTeamIds && !options.knownTeamIds.has(record.teamId)) {
      throw new Error('队员所属训练队不存在')
    }
    if (record.source !== undefined && record.source !== 'student' && record.source !== 'manual') throw new Error('队员来源不正确')
    if (record.source !== 'manual' && options.knownStudentIds && !options.knownStudentIds.has(record.studentId)) {
      throw new Error('队员关联的学生不存在')
    }
    if (!isMemberStatus(record.status) || !isGender(record.genderSnapshot)) {
      throw new Error('队员状态或性别快照不正确')
    }
    const leftAt = record.leftAt === null || record.leftAt === undefined ? null : parseText(record.leftAt, '退出时间', true, 40)
    if (record.status === 'active' && leftAt !== null) {
      throw new Error('在队队员不应填写退出时间')
    }
    if (record.status === 'left' && leftAt === null) {
      throw new Error('已退出队员必须填写退出时间')
    }
    if (typeof record.joinedAt !== 'string' || typeof record.createdAt !== 'string' || typeof record.updatedAt !== 'string') {
      throw new Error('队员时间字段不正确')
    }
    return {
      id: record.id,
      teamId: record.teamId,
      studentId: record.studentId,
      ...(record.source === 'manual' ? { source: 'manual' as const } : {}),
      joinedAt: record.joinedAt,
      leftAt,
      status: record.status,
      nameSnapshot: parseText(record.nameSnapshot, '姓名快照', true, 40),
      studentNoSnapshot: parseText(record.studentNoSnapshot, '学号快照', false, 40),
      classNameSnapshot: parseText(record.classNameSnapshot, '班级快照', false, 40),
      genderSnapshot: record.genderSnapshot,
      specialty: parseText(record.specialty ?? '', '专项/主项', false, 40),
      position: parseText(record.position ?? '', '位置', false, 40),
      trainingGroup: parseText(record.trainingGroup ?? '', '训练分组', false, 40),
      trainingNotes: parseText(record.trainingNotes ?? '', '训练备注', false, 500),
      notes: parseText(record.notes, '队员备注', false, 500),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    } satisfies TrainingTeamMember
  })

  const ids = new Set<string>()
  const activeKeys = new Set<string>()
  for (const member of members) {
    if (ids.has(member.id)) {
      throw new Error('队员关系编号不能重复')
    }
    ids.add(member.id)
    if (member.status !== 'active') {
      continue
    }
    const key = `${member.teamId}|${member.studentId}`
    if (activeKeys.has(key)) {
      throw new Error('同一学生不能重复加入同一有效训练队或训练组')
    }
    activeKeys.add(key)
  }

  return members.sort((a, b) => a.teamId.localeCompare(b.teamId) || a.joinedAt.localeCompare(b.joinedAt) || a.id.localeCompare(b.id))
}

function parseExercise(value: unknown): TrainingExercise {
  const record = asRecord(value, '训练内容')
  if (typeof record.id !== 'string' || !EXERCISE_ID.test(record.id)) {
    throw new Error('训练内容编号不正确')
  }
  if (!isExerciseKind(record.kind)) {
    throw new Error('训练内容类型不正确')
  }
  if (typeof record.sortOrder !== 'number' || !Number.isInteger(record.sortOrder) || record.sortOrder < 0) {
    throw new Error('训练内容顺序不正确')
  }
  return {
    id: record.id,
    sortOrder: record.sortOrder,
    name: parseText(record.name, '训练内容名称', true, 80),
    kind: record.kind,
    sets: parseOptionalInt(record.sets, '组数', 0, 99),
    reps: parseOptionalInt(record.reps, '次数', 0, 999),
    distanceM: parseOptionalInt(record.distanceM, '距离', 0, 100000),
    durationSec: parseOptionalInt(record.durationSec, '时间秒数', 0, 36000),
    notes: parseText(record.notes, '训练内容备注', false, 200)
  }
}

function parseAttendance(value: unknown): TrainingAttendance {
  const record = asRecord(value, '训练出勤')
  if (typeof record.id !== 'string' || !ATTENDANCE_ID.test(record.id)) {
    throw new Error('出勤记录编号不正确')
  }
  if (typeof record.studentId !== 'string' || !STUDENT_ID.test(record.studentId)) {
    throw new Error('出勤学生编号不正确')
  }
  if (!isParticipation(record.participation) || !isCompletion(record.completion)) {
    throw new Error('训练状态或完成度不正确')
  }
  const rpe = record.rpe === null || record.rpe === undefined || record.rpe === '' ? null : record.rpe
  if (rpe !== null && (typeof rpe !== 'number' || !Number.isInteger(rpe) || rpe < 0 || rpe > 10)) {
    throw new Error('RPE 必须是 0 到 10 的整数')
  }
  return {
    id: record.id,
    studentId: record.studentId,
    nameSnapshot: parseText(record.nameSnapshot, '出勤姓名快照', true, 40),
    studentNoSnapshot: parseText(record.studentNoSnapshot, '出勤学号快照', false, 40),
    classNameSnapshot: parseText(record.classNameSnapshot, '出勤班级快照', false, 40),
    participation: record.participation,
    rpe,
    completion: record.completion,
    note: parseText(record.note, '出勤备注', false, 200)
  }
}

export interface ParseSessionOptions {
  knownTeamIds?: ReadonlySet<string>
  knownPlanIds?: ReadonlySet<string>
}

export function parseTrainingSessions(input: unknown, options: ParseSessionOptions = {}): TrainingSession[] {
  if (!Array.isArray(input)) {
    throw new Error('训练记录数据格式不正确')
  }

  const sessions = input.map((entry) => {
    const record = asRecord(entry, '训练记录')
    if (typeof record.id !== 'string' || !SESSION_ID.test(record.id)) {
      throw new Error('训练记录编号不正确')
    }
    if (typeof record.teamId !== 'string' || !TEAM_ID.test(record.teamId)) {
      throw new Error('训练记录所属队伍不正确')
    }
    if (options.knownTeamIds && !options.knownTeamIds.has(record.teamId)) {
      throw new Error('训练记录所属队伍不存在')
    }
    if (typeof record.date !== 'string' || !DATE_PATTERN.test(record.date)) {
      throw new Error('训练日期不正确')
    }
    const startTime = parseText(record.startTime, '开始时间', false, 8)
    if (startTime !== '' && !TIME_PATTERN.test(startTime)) {
      throw new Error('开始时间格式应为 16:00')
    }
    if (typeof record.createdAt !== 'string' || typeof record.updatedAt !== 'string') {
      throw new Error('训练记录时间字段不正确')
    }
    const planId =
      record.planId === undefined || record.planId === null || record.planId === ''
        ? undefined
        : parseText(record.planId, '来源训练计划', true, 80)
    if (planId && !PLAN_ID.test(planId)) {
      throw new Error('来源训练计划编号不正确')
    }
    if (planId && options.knownPlanIds && !options.knownPlanIds.has(planId)) {
      throw new Error('来源训练计划不存在')
    }
    if (!Array.isArray(record.exercises) || !Array.isArray(record.attendance)) {
      throw new Error('训练内容或出勤名单格式不正确')
    }
    const exercises = record.exercises.map(parseExercise).sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
    const attendance = record.attendance.map(parseAttendance)
    const seenStudents = new Set<string>()
    for (const row of attendance) {
      if (seenStudents.has(row.studentId)) {
        throw new Error('同一次训练中同一学生不能出现两行出勤')
      }
      seenStudents.add(row.studentId)
    }
    const session: TrainingSession = {
      id: record.id,
      teamId: record.teamId,
      date: record.date,
      startTime,
      title: parseText(record.title, '训练主题', true, 80),
      place: parseText(record.place, '地点', false, 80),
      durationMinutes: parseOptionalInt(record.durationMinutes, '训练时长', 0, 600),
      notes: parseText(record.notes, '训练备注', false, 1000),
      teamNameSnapshot: parseText(record.teamNameSnapshot, '队伍名称快照', true, 80),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      exercises,
      attendance
    }
    if (planId) {
      session.planId = planId
    }
    return session
  })

  const ids = new Set<string>()
  const usedPlanIds = new Set<string>()
  for (const session of sessions) {
    if (ids.has(session.id)) {
      throw new Error('训练记录编号不能重复')
    }
    ids.add(session.id)
    if (session.planId) {
      if (usedPlanIds.has(session.planId)) {
        throw new Error('同一训练计划不能关联多次训练记录')
      }
      usedPlanIds.add(session.planId)
    }
  }

  return sessions.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
}

export function parseTrainingItems(input: unknown): TrainingItem[] {
  if (!Array.isArray(input)) {
    throw new Error('训练项目数据格式不正确')
  }

  const items = input.map((entry) => {
    const record = asRecord(entry, '训练项目')
    if (typeof record.id !== 'string' || !(ITEM_CUSTOM_ID.test(record.id) || ITEM_BUILTIN_ID.test(record.id))) {
      throw new Error('训练项目编号不正确')
    }
    const builtinKey =
      record.builtinKey === null || record.builtinKey === undefined ? null : parseText(record.builtinKey, '内置项目键', true, 40)
    if (typeof record.isBuiltin !== 'boolean' || typeof record.isActive !== 'boolean') {
      throw new Error('训练项目标记不正确')
    }
    if (!TEST_VALUE_TYPES.includes(record.valueType as TestValueType)) {
      throw new Error('训练项目数值类型不正确')
    }
    if (!TIME_INPUT_MODES.includes(record.timeInputMode as TimeInputMode)) {
      throw new Error('训练项目时间输入方式不正确')
    }
    if (!TEST_UNITS.includes(record.unit as TestUnit)) {
      throw new Error('训练项目单位不正确')
    }
    if (!TEST_DIRECTIONS.includes(record.direction as TestDirection)) {
      throw new Error('训练项目方向不正确')
    }
    if (typeof record.decimalPlaces !== 'number' || !Number.isInteger(record.decimalPlaces) || record.decimalPlaces < 0 || record.decimalPlaces > 3) {
      throw new Error('训练项目小数位不正确')
    }
    if (typeof record.createdAt !== 'string' || typeof record.updatedAt !== 'string') {
      throw new Error('训练项目时间字段不正确')
    }
    return {
      id: record.id,
      builtinKey,
      name: parseText(record.name, '训练项目名称', true, 40),
      valueType: record.valueType as TestValueType,
      timeInputMode: record.timeInputMode as TimeInputMode,
      unit: record.unit as TestUnit,
      customUnitLabel: parseText(record.customUnitLabel, '自定义单位', false, 20),
      direction: record.direction as TestDirection,
      decimalPlaces: record.decimalPlaces,
      isBuiltin: record.isBuiltin,
      isActive: record.isActive,
      notes: parseText(record.notes, '训练项目备注', false, 200),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    } satisfies TrainingItem
  })

  const ids = new Set<string>()
  for (const item of items) {
    if (ids.has(item.id)) {
      throw new Error('训练项目编号不能重复')
    }
    ids.add(item.id)
  }
  return items
}

export interface ParseResultOptions {
  knownTeamIds?: ReadonlySet<string>
  knownStudentIds?: ReadonlySet<string>
  knownItemIds?: ReadonlySet<string>
  knownSessionIds?: ReadonlySet<string>
}

export function parseTrainingResults(input: unknown, options: ParseResultOptions = {}): TrainingResult[] {
  if (!Array.isArray(input)) {
    throw new Error('训练成绩数据格式不正确')
  }

  const results = input.map((entry) => {
    const record = asRecord(entry, '训练成绩')
    if (typeof record.id !== 'string' || !RESULT_ID.test(record.id)) {
      throw new Error('训练成绩编号不正确')
    }
    if (typeof record.teamId !== 'string' || !TEAM_ID.test(record.teamId)) {
      throw new Error('训练成绩所属队伍不正确')
    }
    if (typeof record.studentId !== 'string' || !STUDENT_ID.test(record.studentId)) {
      throw new Error('训练成绩学生编号不正确')
    }
    if (typeof record.itemId !== 'string' || !(ITEM_CUSTOM_ID.test(record.itemId) || ITEM_BUILTIN_ID.test(record.itemId))) {
      throw new Error('训练成绩项目不正确')
    }
    if (options.knownTeamIds && !options.knownTeamIds.has(record.teamId)) {
      throw new Error('训练成绩所属队伍不存在')
    }
    if (options.knownStudentIds && !options.knownStudentIds.has(record.studentId)) {
      throw new Error('训练成绩关联的学生不存在')
    }
    if (options.knownItemIds && !options.knownItemIds.has(record.itemId)) {
      throw new Error('训练成绩项目不存在')
    }
    if (typeof record.date !== 'string' || !DATE_PATTERN.test(record.date)) {
      throw new Error('训练成绩日期不正确')
    }
    const sessionId =
      record.sessionId === null || record.sessionId === undefined || record.sessionId === ''
        ? null
        : parseText(record.sessionId, '关联训练', true, 80)
    if (sessionId && !SESSION_ID.test(sessionId)) {
      throw new Error('关联训练编号不正确')
    }
    if (sessionId && options.knownSessionIds && !options.knownSessionIds.has(sessionId)) {
      throw new Error('关联的训练记录不存在')
    }
    if (!isGender(record.genderSnapshot) || !isResultKind(record.kind) || !isResultStatus(record.status)) {
      throw new Error('训练成绩状态不正确')
    }
    if (!TEST_UNITS.includes(record.unitSnapshot as TestUnit) || !TEST_DIRECTIONS.includes(record.directionSnapshot as TestDirection)) {
      throw new Error('训练成绩单位或方向快照不正确')
    }
    if (!TEST_VALUE_TYPES.includes(record.valueTypeSnapshot as TestValueType) || !TIME_INPUT_MODES.includes(record.timeInputModeSnapshot as TimeInputMode)) {
      throw new Error('训练成绩类型快照不正确')
    }
    if (
      typeof record.decimalPlacesSnapshot !== 'number' ||
      !Number.isInteger(record.decimalPlacesSnapshot) ||
      record.decimalPlacesSnapshot < 0 ||
      record.decimalPlacesSnapshot > 3
    ) {
      throw new Error('训练成绩小数位快照不正确')
    }
    if (typeof record.createdAt !== 'string' || typeof record.updatedAt !== 'string') {
      throw new Error('训练成绩时间字段不正确')
    }
    return {
      id: record.id,
      teamId: record.teamId,
      studentId: record.studentId,
      studentNameSnapshot: parseText(record.studentNameSnapshot, '成绩姓名快照', true, 40),
      studentNoSnapshot: parseText(record.studentNoSnapshot, '成绩学号快照', false, 40),
      classNameSnapshot: parseText(record.classNameSnapshot, '成绩班级快照', false, 40),
      genderSnapshot: record.genderSnapshot,
      date: record.date,
      itemId: record.itemId,
      itemNameSnapshot: parseText(record.itemNameSnapshot, '项目名称快照', true, 40),
      unitSnapshot: record.unitSnapshot as TestUnit,
      customUnitLabelSnapshot: parseText(record.customUnitLabelSnapshot, '自定义单位快照', false, 20),
      directionSnapshot: record.directionSnapshot as TestDirection,
      valueTypeSnapshot: record.valueTypeSnapshot as TestValueType,
      timeInputModeSnapshot: record.timeInputModeSnapshot as TimeInputMode,
      decimalPlacesSnapshot: record.decimalPlacesSnapshot,
      rawInput: parseText(record.rawInput, '原始输入', true, 40),
      rawValue: parseRequiredNumber(record.rawValue, '标准化成绩'),
      kind: record.kind,
      sessionId,
      status: record.status,
      note: parseText(record.note, '成绩备注', false, 200),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    } satisfies TrainingResult
  })

  const ids = new Set<string>()
  for (const result of results) {
    if (ids.has(result.id)) {
      throw new Error('训练成绩编号不能重复')
    }
    ids.add(result.id)
  }
  return results.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
}

export interface TrainingTeamDeleteImpact {
  childCount: number
  memberCount: number
  activeMemberCount: number
  sessionCount: number
  resultCount: number
}

export function collectTrainingTeamDeleteImpact(
  teamId: string,
  teams: ReadonlyArray<TrainingTeam>,
  members: ReadonlyArray<TrainingTeamMember>,
  sessions: ReadonlyArray<TrainingSession>,
  results: ReadonlyArray<TrainingResult>
): TrainingTeamDeleteImpact {
  return {
    childCount: teams.filter((item) => item.parentTeamId === teamId && item.status !== 'deleted').length,
    memberCount: members.filter((item) => item.teamId === teamId).length,
    activeMemberCount: members.filter((item) => item.teamId === teamId && item.status === 'active' && item.leftAt === null)
      .length,
    sessionCount: sessions.filter((item) => item.teamId === teamId).length,
    resultCount: results.filter((item) => item.teamId === teamId).length
  }
}

export function hasTrainingTeamIdentityRefs(
  teamId: string,
  teams: ReadonlyArray<Pick<TrainingTeam, 'id' | 'parentTeamId'>>,
  members: ReadonlyArray<Pick<TrainingTeamMember, 'teamId'>>,
  sessions: ReadonlyArray<Pick<TrainingSession, 'teamId'>>,
  results: ReadonlyArray<Pick<TrainingResult, 'teamId'>>,
  scheduleItems: ReadonlyArray<TrainingScheduleReference> = [],
  plans: ReadonlyArray<TrainingPlanReference> = []
): boolean {
  return (
    teams.some((item) => item.parentTeamId === teamId) ||
    members.some((item) => item.teamId === teamId) ||
    sessions.some((item) => item.teamId === teamId) ||
    results.some((item) => item.teamId === teamId) ||
    scheduleItems.some((item) => item.trainingTeamId === teamId) ||
    plans.some((item) => item.trainingTeamId === teamId)
  )
}

export function leaveActiveMembershipsForTeams<
  T extends { teamId: string; status: string; leftAt: string | null; updatedAt: string }
>(members: ReadonlyArray<T>, teamIds: ReadonlySet<string>, now: string): T[] {
  return members.map((item) =>
    teamIds.has(item.teamId) && item.status === 'active' && item.leftAt === null
      ? { ...item, status: 'left' as T['status'], leftAt: now, updatedAt: now }
      : item
  )
}

export function tombstoneTrainingTeam(team: TrainingTeam, now: string): TrainingTeam {
  return { ...team, status: 'deleted', updatedAt: now }
}

type TrainingScheduleReference = { trainingTeamId?: string }
type TrainingPlanReference = { trainingTeamId: string }

function affectedTrainingTeamIds(teams: ReadonlyArray<TrainingTeam>, teamId: string): string[] {
  const affected = new Set<string>([teamId])
  let changed = true
  while (changed) {
    changed = false
    for (const team of teams) {
      if (
        team.status !== 'deleted' &&
        team.parentTeamId &&
        affected.has(team.parentTeamId) &&
        !affected.has(team.id)
      ) {
        affected.add(team.id)
        changed = true
      }
    }
  }
  return [...affected]
}

function trainingDeleteCounts(
  teamIds: ReadonlySet<string>,
  members: ReadonlyArray<TrainingTeamMember>,
  sessions: ReadonlyArray<TrainingSession>,
  results: ReadonlyArray<TrainingResult>,
  scheduleItems: ReadonlyArray<TrainingScheduleReference>,
  plans: ReadonlyArray<TrainingPlanReference>
): TrainingTeamDeleteCounts {
  const scopedMembers = members.filter((item) => teamIds.has(item.teamId))
  const scopedSessions = sessions.filter((item) => teamIds.has(item.teamId))
  const scopedSessionIds = new Set(scopedSessions.map((item) => item.id))
  const directTeamResults = results.filter((item) => teamIds.has(item.teamId))
  const sessionLinkedResults = results.filter(
    (item) => item.sessionId !== null && scopedSessionIds.has(item.sessionId)
  )
  const scopedResultIds = new Set([
    ...directTeamResults.map((item) => item.id),
    ...sessionLinkedResults.map((item) => item.id)
  ])
  return {
    activeMemberCount: scopedMembers.filter(
      (item) => item.status === 'active' && item.leftAt === null
    ).length,
    historicalMemberCount: scopedMembers.filter(
      (item) => item.status === 'left' || item.leftAt !== null
    ).length,
    sessionCount: scopedSessions.length,
    sessionLinkedResultCount: sessionLinkedResults.length,
    independentResultCount: directTeamResults.filter((item) => item.sessionId === null).length,
    resultCount: scopedResultIds.size,
    planCount: plans.filter((item) => teamIds.has(item.trainingTeamId)).length,
    scheduleLinkCount: scheduleItems.filter(
      (item) => item.trainingTeamId && teamIds.has(item.trainingTeamId)
    ).length
  }
}

export function checkTrainingTeamSafeDelete(
  teams: ReadonlyArray<TrainingTeam>,
  members: ReadonlyArray<TrainingTeamMember>,
  teamId: string,
  sessions: ReadonlyArray<TrainingSession> = [],
  results: ReadonlyArray<TrainingResult> = [],
  scheduleItems: ReadonlyArray<TrainingScheduleReference> = [],
  plans: ReadonlyArray<TrainingPlanReference> = []
): TrainingTeamDeleteCheck {
  const team = teams.find((item) => item.id === teamId)
  if (!team || team.status === 'deleted') {
    throw new Error('训练队不存在或已删除')
  }

  const affectedTeamIds = affectedTrainingTeamIds(teams, teamId)
  const affectedSet = new Set(affectedTeamIds)
  const direct = trainingDeleteCounts(
    new Set([teamId]),
    members,
    sessions,
    results,
    scheduleItems,
    plans
  )
  const total = trainingDeleteCounts(
    affectedSet,
    members,
    sessions,
    results,
    scheduleItems,
    plans
  )
  const blockingReasons: string[] = []
  if (total.activeMemberCount > 0) {
    blockingReasons.push(`仍有 ${total.activeMemberCount} 名当前队员`)
  }
  if (total.historicalMemberCount > 0) {
    blockingReasons.push(`存在 ${total.historicalMemberCount} 条历史队员关系`)
  }
  if (total.sessionCount > 0) {
    blockingReasons.push(`存在 ${total.sessionCount} 次训练记录`)
  }
  if (total.resultCount > 0) {
    blockingReasons.push(`存在 ${total.resultCount} 条训练/比赛成绩`)
  }
  if (total.planCount > 0) {
    blockingReasons.push(`存在 ${total.planCount} 条训练计划`)
  }
  if (total.scheduleLinkCount > 0) {
    blockingReasons.push(`存在 ${total.scheduleLinkCount} 条课表关联`)
  }
  const canPhysicallyDelete = blockingReasons.length === 0

  return {
    team: { ...team },
    action: canPhysicallyDelete ? 'physical_delete' : 'archive',
    canPhysicallyDelete,
    blockingReasons,
    directChildCount: teams.filter(
      (item) => item.parentTeamId === teamId && item.status !== 'deleted'
    ).length,
    descendantCount: affectedTeamIds.length - 1,
    affectedTeamIds,
    direct,
    total
  }
}

export function applyTrainingTeamSafeDelete(
  teams: ReadonlyArray<TrainingTeam>,
  members: ReadonlyArray<TrainingTeamMember>,
  teamId: string,
  now: string,
  sessions: ReadonlyArray<TrainingSession> = [],
  results: ReadonlyArray<TrainingResult> = [],
  scheduleItems: ReadonlyArray<TrainingScheduleReference> = [],
  plans: ReadonlyArray<TrainingPlanReference> = []
): TrainingTeamSafeDeleteResult {
  const check = checkTrainingTeamSafeDelete(
    teams,
    members,
    teamId,
    sessions,
    results,
    scheduleItems,
    plans
  )
  const affectedSet = new Set(check.affectedTeamIds)

  if (check.action === 'physical_delete') {
    return {
      action: check.action,
      check,
      members: members.filter((item) => !affectedSet.has(item.teamId)),
      teams: teams.filter((item) => !affectedSet.has(item.id))
    }
  }

  return {
    action: check.action,
    check,
    members: leaveActiveMembershipsForTeams(members, affectedSet, now),
    teams: teams.map((item) =>
      affectedSet.has(item.id) && item.status !== 'deleted'
        ? { ...item, status: 'archived', updatedAt: now }
        : item
    )
  }
}

/** 仅用于禁止从 JSON 中物理拿掉仍被引用的队伍身份，不再作为 UI 删除拦截。 */
export function getTrainingTeamDeleteBlockers(
  teamId: string,
  teams: ReadonlyArray<TrainingTeam>,
  members: ReadonlyArray<TrainingTeamMember>,
  sessions: ReadonlyArray<TrainingSession>,
  results: ReadonlyArray<TrainingResult>
): string[] {
  return checkTrainingTeamSafeDelete(
    teams,
    members,
    teamId,
    sessions,
    results
  ).blockingReasons
}

export function getTrainingItemDeleteBlockers(itemId: string, results: ReadonlyArray<TrainingResult>): string[] {
  const count = results.filter((item) => item.itemId === itemId).length
  return count > 0 ? [`该项目已被 ${count} 条训练成绩引用，不能直接删除。可将项目停用。`] : []
}

export interface TrainingDeleteRefs {
  members?: ReadonlyArray<{ studentId: string }>
  sessions?: ReadonlyArray<{ attendance: ReadonlyArray<{ studentId: string }> }>
  results?: ReadonlyArray<{ studentId: string }>
}

export function collectTrainingStudentDeleteBlockers(studentId: string, refs: TrainingDeleteRefs = {}): string[] {
  const blockers: string[] = []
  const memberCount = (refs.members ?? []).filter((item) => item.studentId === studentId).length
  if (memberCount > 0) {
    blockers.push(`该学生存在 ${memberCount} 条训练队队员记录，不能直接删除。可将学生状态改为已转出。`)
  }
  const sessionCount = (refs.sessions ?? []).filter((session) => session.attendance.some((row) => row.studentId === studentId)).length
  if (sessionCount > 0) {
    blockers.push(`该学生存在 ${sessionCount} 次训练出勤记录，不能直接删除。可将学生状态改为已转出。`)
  }
  const resultCount = (refs.results ?? []).filter((item) => item.studentId === studentId).length
  if (resultCount > 0) {
    blockers.push(`该学生存在 ${resultCount} 条训练成绩，不能直接删除。可将学生状态改为已转出。`)
  }
  return blockers
}
