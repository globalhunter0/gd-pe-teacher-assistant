import { TEST_DIRECTIONS, TEST_UNITS, TEST_VALUE_TYPES, TIME_INPUT_MODES } from '../peTest/types'
import type { TestDirection, TestUnit, TestValueType, TimeInputMode } from '../peTest/types'
import { STUDENT_GENDERS, type StudentGender } from '../student/types'
import type {
  TrainingAttendance,
  TrainingExercise,
  TrainingExerciseKind,
  TrainingItem,
  TrainingMemberStatus,
  TrainingParticipation,
  TrainingCompletion,
  TrainingResult,
  TrainingResultKind,
  TrainingResultStatus,
  TrainingSession,
  TrainingSport,
  TrainingTeam,
  TrainingTeamMember,
  TrainingTeamStatus
} from './types'
import {
  TRAINING_COMPLETIONS,
  TRAINING_EXERCISE_KINDS,
  TRAINING_MEMBER_STATUSES,
  TRAINING_PARTICIPATIONS,
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
    if (options.knownStudentIds && !options.knownStudentIds.has(record.studentId)) {
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
      joinedAt: record.joinedAt,
      leftAt,
      status: record.status,
      nameSnapshot: parseText(record.nameSnapshot, '姓名快照', true, 40),
      studentNoSnapshot: parseText(record.studentNoSnapshot, '学号快照', false, 40),
      classNameSnapshot: parseText(record.classNameSnapshot, '班级快照', false, 40),
      genderSnapshot: record.genderSnapshot,
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
    return {
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
    } satisfies TrainingSession
  })

  const ids = new Set<string>()
  for (const session of sessions) {
    if (ids.has(session.id)) {
      throw new Error('训练记录编号不能重复')
    }
    ids.add(session.id)
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

export function getTrainingTeamDeleteBlockers(
  teamId: string,
  teams: ReadonlyArray<TrainingTeam>,
  members: ReadonlyArray<TrainingTeamMember>,
  sessions: ReadonlyArray<TrainingSession>,
  results: ReadonlyArray<TrainingResult>
): string[] {
  const blockers: string[] = []
  const childCount = teams.filter((item) => item.parentTeamId === teamId).length
  if (childCount > 0) {
    blockers.push(`该队伍下仍有 ${childCount} 个训练组，请先处理训练组。`)
  }
  const memberCount = members.filter((item) => item.teamId === teamId).length
  if (memberCount > 0) {
    blockers.push(`该队伍仍有 ${memberCount} 条队员关系记录，请先退出或停用队伍。`)
  }
  const sessionCount = sessions.filter((item) => item.teamId === teamId).length
  if (sessionCount > 0) {
    blockers.push(`该队伍存在 ${sessionCount} 次训练记录，不能直接删除。可将队伍停用。`)
  }
  const resultCount = results.filter((item) => item.teamId === teamId).length
  if (resultCount > 0) {
    blockers.push(`该队伍存在 ${resultCount} 条训练成绩，不能直接删除。可将队伍停用。`)
  }
  return blockers
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
