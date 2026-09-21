import type { Grade } from '../class/types'
import { GRADES } from '../class/types'
import type { StudentGender } from '../student/types'
import { STUDENT_GENDERS } from '../student/types'
import { parsePeTestSessionStatus } from './sessionLifecycle'
import { parsePeTestOrigin } from './types'
import type {
  PETestRecord,
  PETestSession,
  TestCategory,
  TestDirection,
  TestGenderRule,
  TestItem,
  TestRecordStatus,
  TestUnit,
  TestValueType,
  TimeInputMode
} from './types'
import {
  TEST_CATEGORIES,
  TEST_DIRECTIONS,
  TEST_GENDER_RULES,
  TEST_RECORD_STATUSES,
  TEST_UNITS,
  TEST_VALUE_TYPES,
  TIME_INPUT_MODES
} from './types'

const CUSTOM_ITEM_ID = /^test-item-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const BUILTIN_ITEM_ID = /^test-item-builtin-[a-z0-9-]+$/
const SESSION_ID = /^pe-test-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const RECORD_ID = /^pe-test-record-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const CLASS_ID = /^class-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const STUDENT_ID = /^student-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export interface ParsePeTestOptions {
  knownClassIds?: ReadonlySet<string>
  knownItemIds?: ReadonlySet<string>
}

function isUnit(value: unknown): value is TestUnit {
  return TEST_UNITS.includes(value as TestUnit)
}

function isDirection(value: unknown): value is TestDirection {
  return TEST_DIRECTIONS.includes(value as TestDirection)
}

function isGenderRule(value: unknown): value is TestGenderRule {
  return TEST_GENDER_RULES.includes(value as TestGenderRule)
}

function isCategory(value: unknown): value is TestCategory {
  return TEST_CATEGORIES.includes(value as TestCategory)
}

function isValueType(value: unknown): value is TestValueType {
  return TEST_VALUE_TYPES.includes(value as TestValueType)
}

function isTimeInputMode(value: unknown): value is TimeInputMode {
  return TIME_INPUT_MODES.includes(value as TimeInputMode)
}

function isStatus(value: unknown): value is TestRecordStatus {
  return TEST_RECORD_STATUSES.includes(value as TestRecordStatus)
}

function isGrade(value: unknown): value is Grade {
  return GRADES.includes(value as Grade)
}

function isGender(value: unknown): value is StudentGender {
  return STUDENT_GENDERS.includes(value as StudentGender)
}

function parseOptionalNumber(value: unknown, label: string): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  throw new Error(`${label}不正确`)
}

export function createTestItemId(): string {
  return `test-item-${crypto.randomUUID()}`
}

export function createPeTestId(): string {
  return `pe-test-${crypto.randomUUID()}`
}

export function createPeTestRecordId(): string {
  return `pe-test-record-${crypto.randomUUID()}`
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseTestItems(input: unknown): TestItem[] {
  if (!Array.isArray(input)) {
    throw new Error('测试项目数据格式不正确')
  }

  const items = input.map((entry) => {
    if (typeof entry !== 'object' || entry === null) {
      throw new Error('测试项目格式不正确')
    }

    const record = entry as Record<string, unknown>
    const id = record.id
    const isBuiltin = record.isBuiltin === true
    const builtinKey = record.builtinKey === null || record.builtinKey === undefined ? null : record.builtinKey

    if (typeof id !== 'string' || (isBuiltin ? !BUILTIN_ITEM_ID.test(id) : !CUSTOM_ITEM_ID.test(id))) {
      throw new Error('测试项目 ID 不正确')
    }

    if (isBuiltin) {
      if (typeof builtinKey !== 'string' || builtinKey.trim() === '') {
        throw new Error('内置项目缺少稳定键')
      }
    } else if (builtinKey !== null) {
      throw new Error('自定义项目不能带内置键')
    }

    if (typeof record.name !== 'string' || record.name.trim() === '') {
      throw new Error('测试项目名称不能为空')
    }

    if (!isCategory(record.category) || !isValueType(record.valueType) || !isUnit(record.unit)) {
      throw new Error('测试项目类型或单位不正确')
    }

    if (!isDirection(record.direction) || !isGenderRule(record.genderRule)) {
      throw new Error('测试项目方向或性别规则不正确')
    }

    const timeInputMode = isTimeInputMode(record.timeInputMode)
      ? record.timeInputMode
      : record.timeInputMode === undefined
        ? 'seconds'
        : null
    if (timeInputMode === null) {
      throw new Error('时间输入模式不正确')
    }

    const decimalPlaces = record.decimalPlaces
    if (typeof decimalPlaces !== 'number' || !Number.isInteger(decimalPlaces) || decimalPlaces < 0 || decimalPlaces > 2) {
      throw new Error('小数位数必须是 0 到 2 的整数')
    }

    if (typeof record.createdAt !== 'string' || typeof record.updatedAt !== 'string') {
      throw new Error('测试项目时间字段不正确')
    }

    const item: TestItem = {
      id,
      builtinKey,
      name: record.name.trim(),
      category: record.category,
      valueType: record.valueType,
      timeInputMode,
      unit: record.unit,
      customUnitLabel: typeof record.customUnitLabel === 'string' ? record.customUnitLabel.trim() : '',
      direction: record.direction,
      genderRule: record.genderRule,
      decimalPlaces,
      minValue: parseOptionalNumber(record.minValue, '最小值'),
      maxValue: parseOptionalNumber(record.maxValue, '最大值'),
      isBuiltin,
      isActive: record.isActive !== false,
      notes: typeof record.notes === 'string' ? record.notes.trim() : '',
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }

    if (item.unit === 'other' && item.customUnitLabel === '') {
      throw new Error('自定义单位不能为空')
    }

    return item
  })

  const ids = new Set<string>()
  const keys = new Set<string>()
  for (const item of items) {
    if (ids.has(item.id)) {
      throw new Error('测试项目 ID 不能重复')
    }
    ids.add(item.id)
    if (item.builtinKey) {
      if (keys.has(item.builtinKey)) {
        throw new Error('内置项目键不能重复')
      }
      keys.add(item.builtinKey)
    }
  }

  return items
}

function parseRecord(entry: unknown, testSessionId: string): PETestRecord {
  if (typeof entry !== 'object' || entry === null) {
    throw new Error('测试成绩格式不正确')
  }

  const record = entry as Record<string, unknown>
  const id = record.id
  const studentId = record.studentId
  const status = record.status
  const rawValue = record.rawValue

  if (typeof id !== 'string' || !RECORD_ID.test(id)) {
    throw new Error('测试成绩 ID 不正确')
  }

  if (record.testSessionId !== undefined && record.testSessionId !== testSessionId) {
    throw new Error('测试成绩与测试不匹配')
  }

  if (typeof studentId !== 'string' || !STUDENT_ID.test(studentId)) {
    throw new Error('测试成绩缺少有效学生')
  }

  if (typeof record.nameSnapshot !== 'string' || record.nameSnapshot.trim() === '') {
    throw new Error('学生姓名快照不能为空')
  }

  if (!isGender(record.genderSnapshot) || !isStatus(status)) {
    throw new Error('性别快照或成绩状态不正确')
  }

  let parsedRaw: number | null = null
  if (rawValue !== null && rawValue !== undefined && rawValue !== '') {
    if (typeof rawValue !== 'number' || !Number.isFinite(rawValue)) {
      throw new Error('标准化成绩不正确')
    }
    parsedRaw = rawValue
  }

  if (status === 'valid' && parsedRaw === null) {
    throw new Error('有效成绩必须包含数值')
  }

  if (typeof record.createdAt !== 'string' || typeof record.updatedAt !== 'string') {
    throw new Error('测试成绩时间字段不正确')
  }

  return {
    id,
    testSessionId,
    studentId,
    nameSnapshot: record.nameSnapshot.trim(),
    studentNoSnapshot: typeof record.studentNoSnapshot === 'string' ? record.studentNoSnapshot.trim() : '',
    genderSnapshot: record.genderSnapshot,
    rawValue: parsedRaw,
    status,
    note: typeof record.note === 'string' ? record.note.trim() : '',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    examScore: parseOptionalNumber(record.examScore, '中考换算分'),
    rawOriginal: typeof record.rawOriginal === 'string' ? record.rawOriginal.trim() : '',
    examItemId: typeof record.examItemId === 'string' && record.examItemId.trim() !== '' ? record.examItemId.trim() : null,
    resolvedTestItemId:
      typeof record.resolvedTestItemId === 'string' && record.resolvedTestItemId.trim() !== ''
        ? record.resolvedTestItemId.trim()
        : null,
    baseScore: parseOptionalNumber(record.baseScore, '基础分'),
    bonusScore: parseOptionalNumber(record.bonusScore, '附加分'),
    scoreOutcome:
      record.scoreOutcome === 'official' || record.scoreOutcome === 'below_official_minimum' ? record.scoreOutcome : null,
    officialMinimumScore: parseOptionalNumber(record.officialMinimumScore, '官方最低档')
  }
}

export function parsePeTestSessions(input: unknown, options: ParsePeTestOptions = {}): PETestSession[] {
  if (!Array.isArray(input)) {
    throw new Error('体育测试数据格式不正确')
  }

  const sessions = input.map((entry) => {
    if (typeof entry !== 'object' || entry === null) {
      throw new Error('测试记录格式不正确')
    }

    const record = entry as Record<string, unknown>
    const id = record.id
    const classId = record.classId
    const testItemId = record.testItemId

    if (typeof id !== 'string' || !SESSION_ID.test(id)) {
      throw new Error('测试记录 ID 不正确')
    }

    if (typeof classId !== 'string' || !CLASS_ID.test(classId)) {
      throw new Error('测试所属班级不正确')
    }

    if (options.knownClassIds && !options.knownClassIds.has(classId)) {
      throw new Error('所属班级不存在')
    }

    if (typeof testItemId !== 'string') {
      throw new Error('测试项目不正确')
    }

    if (options.knownItemIds && !options.knownItemIds.has(testItemId)) {
      throw new Error('测试项目不存在')
    }

    if (typeof record.date !== 'string' || !DATE_PATTERN.test(record.date)) {
      throw new Error('测试日期格式应为 YYYY-MM-DD')
    }

    if (typeof record.title !== 'string' || record.title.trim() === '') {
      throw new Error('测试名称不能为空')
    }

    if (typeof record.classNameSnapshot !== 'string' || record.classNameSnapshot.trim() === '') {
      throw new Error('班级名称快照不能为空')
    }

    if (!isGrade(record.gradeSnapshot) || !isUnit(record.unitSnapshot) || !isDirection(record.directionSnapshot)) {
      throw new Error('测试快照字段不正确')
    }

    if (!isValueType(record.valueTypeSnapshot)) {
      throw new Error('测试值类型快照不正确')
    }

    const timeInputModeSnapshot = isTimeInputMode(record.timeInputModeSnapshot)
      ? record.timeInputModeSnapshot
      : record.timeInputModeSnapshot === undefined
        ? 'seconds'
        : null
    if (timeInputModeSnapshot === null) {
      throw new Error('时间输入模式快照不正确')
    }

    if (typeof record.testItemNameSnapshot !== 'string' || record.testItemNameSnapshot.trim() === '') {
      throw new Error('项目名称快照不能为空')
    }

    if (typeof record.createdAt !== 'string' || typeof record.updatedAt !== 'string') {
      throw new Error('测试时间字段不正确')
    }

    if (!Array.isArray(record.records) || record.records.length === 0) {
      throw new Error('测试必须包含学生成绩记录')
    }

    const records = record.records.map((item) => parseRecord(item, id))
    const studentIds = new Set<string>()
    for (const item of records) {
      if (studentIds.has(item.studentId)) {
        throw new Error('同一测试中学生不能重复')
      }
      studentIds.add(item.studentId)
    }

    const importSource = record.importSource
    if (importSource !== undefined && importSource !== 'manual' && importSource !== 'exam-batch') {
      throw new Error('测试来源不正确')
    }

    const session: PETestSession = {
      id,
      classId,
      testItemId,
      date: record.date,
      title: record.title.trim(),
      notes: typeof record.notes === 'string' ? record.notes.trim() : '',
      classNameSnapshot: record.classNameSnapshot.trim(),
      gradeSnapshot: record.gradeSnapshot,
      testItemNameSnapshot: record.testItemNameSnapshot.trim(),
      unitSnapshot: record.unitSnapshot,
      customUnitLabelSnapshot:
        typeof record.customUnitLabelSnapshot === 'string' ? record.customUnitLabelSnapshot.trim() : '',
      directionSnapshot: record.directionSnapshot,
      valueTypeSnapshot: record.valueTypeSnapshot,
      timeInputModeSnapshot,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      records,
      importSource: importSource === 'exam-batch' ? 'exam-batch' : 'manual',
      examStandardId: typeof record.examStandardId === 'string' && record.examStandardId.trim() !== '' ? record.examStandardId.trim() : null,
      scoringCitySnapshot: typeof record.scoringCitySnapshot === 'string' ? record.scoringCitySnapshot.trim() : '',
      scoringVersionSnapshot: typeof record.scoringVersionSnapshot === 'string' ? record.scoringVersionSnapshot.trim() : '',
      testGroupId: typeof record.testGroupId === 'string' && record.testGroupId.trim() !== '' ? record.testGroupId.trim() : null,
      status: parsePeTestSessionStatus(record.status),
      completedAt:
        typeof record.completedAt === 'string' && record.completedAt.trim() !== '' ? record.completedAt.trim() : null,
      origin: parsePeTestOrigin(record.origin),
      peSessionId:
        typeof record.peSessionId === 'string' && record.peSessionId.trim() !== '' ? record.peSessionId.trim() : null
    }

    if (session.status !== 'completed') {
      session.completedAt = null
    }

    return session
  })

  const ids = new Set<string>()
  for (const session of sessions) {
    if (ids.has(session.id)) {
      throw new Error('测试记录 ID 不能重复')
    }
    ids.add(session.id)
  }

  return sessions.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'zh-CN'))
}

export function countTestRecords(records: ReadonlyArray<Pick<PETestRecord, 'status'>>): {
  pending: number
  valid: number
  entered: number
} {
  let pending = 0
  let valid = 0
  for (const record of records) {
    if (record.status === 'pending') {
      pending += 1
    } else {
      if (record.status === 'valid') {
        valid += 1
      }
    }
  }

  return { pending, valid, entered: records.length - pending }
}

export function genderWarning(genderRule: TestGenderRule, gender: StudentGender): string | null {
  if (genderRule === 'all') {
    return null
  }

  if (gender === 'unspecified') {
    return '性别未填写，无法按项目适用性别筛选'
  }

  if (genderRule === 'male' && gender !== 'male') {
    return '该项目通常适用于男生'
  }

  if (genderRule === 'female' && gender !== 'female') {
    return '该项目通常适用于女生'
  }

  return null
}

export function rangeWarning(rawValue: number | null, minValue: number | null, maxValue: number | null): string | null {
  if (rawValue === null) {
    return null
  }

  if (minValue !== null && rawValue < minValue) {
    return '成绩低于常见范围，请确认'
  }

  if (maxValue !== null && rawValue > maxValue) {
    return '成绩高于常见范围，请确认'
  }

  return null
}
