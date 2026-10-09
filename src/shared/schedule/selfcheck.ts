import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readJsonItemsFile, writeJsonItemsAtomic } from '../persistence/jsonFile'
import { LEGACY_SCHEDULE_FIXTURE } from './__fixtures__/legacySchedule'
import {
  assertScheduleLinksRoundTrip,
  assertScheduleTrainingTeamSelections,
  parseScheduleItems,
  resolveScheduleTrainingTeamLink
} from './validate'
import type { ScheduleItem } from './types'
import type { TrainingTeam } from '../trainingTeam/types'
import { workbenchBoundClassId, workbenchClockStatus, workbenchUsesTrainingTeam } from './workbench'

const CLASS_ID = 'class-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
const TRAINING_TEAM_ID = 'training-team-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
const TRAINING_TEAM_ID_2 = 'training-team-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const TRAINING_NOW = '2026-09-16T00:00:00.000Z'

function trainingTeam(
  id: string,
  name: string,
  status: TrainingTeam['status']
): TrainingTeam {
  return {
    id,
    parentTeamId: null,
    name,
    sport: 'track',
    coach: '',
    notes: '',
    status,
    createdAt: TRAINING_NOW,
    updatedAt: TRAINING_NOW
  }
}

function oldFormatItems(): Array<Omit<ScheduleItem, 'id' | 'classId' | 'trainingTeamId'>> {
  return LEGACY_SCHEDULE_FIXTURE.map((item) => ({
    weekday: item.weekday,
    period: item.period,
    startTime: item.startTime,
    endTime: item.endTime,
    team: item.team,
    courseType: item.courseType
  }))
}

function assertUnchangedCore(loaded: ScheduleItem[]): void {
  if (loaded.length !== 17) {
    throw new Error(`旧课表应仍为 17 节，实际 ${loaded.length}`)
  }
  for (let i = 0; i < LEGACY_SCHEDULE_FIXTURE.length; i++) {
    const original = LEGACY_SCHEDULE_FIXTURE[i]
    const item = loaded[i]
    if (
      item.team !== original.team ||
      item.courseType !== original.courseType ||
      item.weekday !== original.weekday ||
      item.period !== original.period ||
      item.startTime !== original.startTime ||
      item.endTime !== original.endTime
    ) {
      throw new Error('课表文本或格子被改写了')
    }
  }
}

function withLinks(
  items: ScheduleItem[],
  patch: Pick<ScheduleItem, 'classId' | 'trainingTeamId'>
): ScheduleItem[] {
  return items.map((item, index) => {
    if (index !== 0) {
      return item
    }
    const next: ScheduleItem = { ...item }
    if (patch.classId) {
      next.classId = patch.classId
    } else {
      delete next.classId
    }
    if (patch.trainingTeamId) {
      next.trainingTeamId = patch.trainingTeamId
    } else {
      delete next.trainingTeamId
    }
    return next
  })
}

async function persistAndReload(filePath: string, items: ScheduleItem[]): Promise<ScheduleItem[]> {
  const parsed = parseScheduleItems(items)
  await writeJsonItemsAtomic(filePath, parsed)
  return readJsonItemsFile(filePath, parseScheduleItems)
}

export async function runScheduleLinkageSelfCheckOrThrow(): Promise<string> {
  const parsedOld = parseScheduleItems(oldFormatItems())
  assertUnchangedCore(parsedOld)
  for (const item of parsedOld) {
    if (item.classId !== undefined || item.trainingTeamId !== undefined) {
      throw new Error('旧课表不应带出 classId / trainingTeamId')
    }
  }

  const boundClass = parseScheduleItems(withLinks(parsedOld, { classId: CLASS_ID }))
  if (boundClass[0].classId !== CLASS_ID) {
    throw new Error('绑定 classId 后内存解析丢失')
  }
  if (boundClass.slice(1).some((item) => item.classId || item.trainingTeamId)) {
    throw new Error('未绑定格子被错误写入了关联')
  }

  const teamOnly = parseScheduleItems(withLinks(parsedOld, { trainingTeamId: TRAINING_TEAM_ID }))
  if (teamOnly[0].trainingTeamId !== TRAINING_TEAM_ID || teamOnly[0].classId !== undefined) {
    throw new Error('trainingTeamId 必须可独立于 classId 保存')
  }

  const boundTeam = parseScheduleItems(withLinks(boundClass, { classId: CLASS_ID, trainingTeamId: TRAINING_TEAM_ID }))
  if (boundTeam[0].trainingTeamId !== TRAINING_TEAM_ID || boundTeam[0].classId !== CLASS_ID) {
    throw new Error('绑定 trainingTeamId 后内存解析丢失')
  }
  if (workbenchBoundClassId(teamOnly[0]) !== undefined || workbenchUsesTrainingTeam(teamOnly[0])) {
    throw new Error('工作台不得依赖 legacy trainingTeamId')
  }
  if (workbenchBoundClassId(boundClass[0]) !== CLASS_ID) {
    throw new Error('工作台应只使用 classId')
  }
  if (workbenchUsesTrainingTeam(boundTeam[0]) || workbenchBoundClassId(boundTeam[0]) !== CLASS_ID) {
    throw new Error('同时存在 classId 与 trainingTeamId 时工作台仍不得使用训练队')
  }
  if (workbenchClockStatus(boundClass[0], new Date(2026, 8, 18, 23, 0, 0), undefined, undefined) !== 'done') {
    throw new Error('工作台时钟状态不得把下课当成课堂已记录')
  }

  const cleared = parseScheduleItems(withLinks(boundTeam, {}))
  if (cleared[0].classId !== undefined || cleared[0].trainingTeamId !== undefined) {
    throw new Error('清除绑定后字段仍残留')
  }

  const activeTeam = trainingTeam(TRAINING_TEAM_ID, '校田径队', 'active')
  const secondActiveTeam = trainingTeam(TRAINING_TEAM_ID_2, '校篮球队', 'active')
  const archivedTeam = trainingTeam(TRAINING_TEAM_ID, '校田径队', 'archived')

  assertScheduleTrainingTeamSelections(parsedOld, teamOnly, [activeTeam])
  assertScheduleTrainingTeamSelections(teamOnly, teamOnly, [archivedTeam])
  if (resolveScheduleTrainingTeamLink(TRAINING_TEAM_ID, [archivedTeam]).label !== '校田径队（已归档）') {
    throw new Error('历史课表关联 archived 训练队时必须显示名称与已归档状态')
  }

  let rejectedArchivedNewBinding = false
  try {
    assertScheduleTrainingTeamSelections(parsedOld, teamOnly, [archivedTeam])
  } catch {
    rejectedArchivedNewBinding = true
  }
  if (!rejectedArchivedNewBinding) {
    throw new Error('archived 训练队不得成为新的课表绑定目标')
  }

  const switched = parseScheduleItems(
    withLinks(teamOnly, { trainingTeamId: TRAINING_TEAM_ID_2 })
  )
  assertScheduleTrainingTeamSelections(teamOnly, switched, [activeTeam, secondActiveTeam])
  if (switched[0].trainingTeamId !== TRAINING_TEAM_ID_2) {
    throw new Error('编辑课表更换 active 训练队失败')
  }
  assertScheduleTrainingTeamSelections(switched, cleared, [activeTeam, secondActiveTeam])
  if (cleared[0].trainingTeamId !== undefined) {
    throw new Error('课表必须可从绑定状态改回不关联训练队')
  }

  const missingDisplay = resolveScheduleTrainingTeamLink(TRAINING_TEAM_ID, [])
  if (missingDisplay.state !== 'missing' || missingDisplay.label !== '原训练队已不存在') {
    throw new Error('不存在的 trainingTeamId 必须非破坏性显示缺失提示')
  }
  assertScheduleTrainingTeamSelections(teamOnly, teamOnly, [])

  let rejected = false
  try {
    parseScheduleItems([{ ...oldFormatItems()[0], classId: 'not-a-class-id' }])
  } catch {
    rejected = true
  }
  if (!rejected) {
    throw new Error('非法 classId 应当拒绝')
  }

  const dir = mkdtempSync(join(tmpdir(), 'gdpe-schedule-link-'))
  const filePath = join(dir, 'schedule.json')
  try {
    const fromOldFile = await persistAndReload(filePath, parsedOld)
    assertUnchangedCore(fromOldFile)
    if (fromOldFile.some((item) => item.classId || item.trainingTeamId)) {
      throw new Error('旧格式写入后再读取不应出现关联字段')
    }

    const afterTeamOnly = await persistAndReload(filePath, withLinks(fromOldFile, { trainingTeamId: TRAINING_TEAM_ID }))
    if (afterTeamOnly[0].classId !== undefined || afterTeamOnly[0].trainingTeamId !== TRAINING_TEAM_ID) {
      throw new Error('仅绑定 trainingTeamId 时不得要求或写出 classId')
    }
    assertUnchangedCore(afterTeamOnly)

    const afterClass = await persistAndReload(filePath, withLinks(fromOldFile, { classId: CLASS_ID }))
    if (afterClass[0].classId !== CLASS_ID) {
      throw new Error('classId 写入 JSON 后再读取不一致')
    }
    assertScheduleLinksRoundTrip(withLinks(fromOldFile, { classId: CLASS_ID }), afterClass)
    assertUnchangedCore(afterClass)

    const afterTeam = await persistAndReload(
      filePath,
      withLinks(afterClass, { classId: CLASS_ID, trainingTeamId: TRAINING_TEAM_ID })
    )
    if (afterTeam[0].trainingTeamId !== TRAINING_TEAM_ID || afterTeam[0].classId !== CLASS_ID) {
      throw new Error('trainingTeamId 写入 JSON 后再读取不一致')
    }
    assertUnchangedCore(afterTeam)

    const afterClear = await persistAndReload(filePath, withLinks(afterTeam, {}))
    if (afterClear[0].classId !== undefined || afterClear[0].trainingTeamId !== undefined) {
      throw new Error('清除绑定写入 JSON 后再读取仍残留')
    }
    assertUnchangedCore(afterClear)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }

  return 'schedule linkage self-check passed'
}
