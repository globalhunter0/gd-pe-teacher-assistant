import { WEEKDAY_LABELS } from './types'
import type { CourseType, Period, ScheduleItem, Weekday } from './types'
import type {
  IncomingScheduleRow,
  SchedulePreviewResult,
  ScheduleSyncLine,
  ScheduleSyncResolutions
} from './importTypes'
import { parseScheduleItems, scheduleSlotId } from './validate'

const EMPTY_RESOLUTIONS: ScheduleSyncResolutions = {
  slotChoices: {},
  clearLinks: {},
  acknowledgeRemoves: false
}

export function emptyScheduleResolutions(): ScheduleSyncResolutions {
  return { slotChoices: {}, clearLinks: {}, acknowledgeRemoves: false }
}

function slotLabel(weekday: Weekday, period: Period): string {
  return `${WEEKDAY_LABELS[weekday]} 第${period}节`
}

function sameCore(
  current: ScheduleItem,
  incoming: IncomingScheduleRow
): boolean {
  return (
    current.team === incoming.team &&
    current.startTime === incoming.startTime &&
    current.endTime === incoming.endTime &&
    current.courseType === incoming.courseType
  )
}

function snapshot(item: ScheduleItem): NonNullable<ScheduleSyncLine['current']> {
  return {
    team: item.team,
    startTime: item.startTime,
    endTime: item.endTime,
    courseType: item.courseType,
    classId: item.classId,
    trainingTeamId: item.trainingTeamId
  }
}

function toCreatedItem(incoming: IncomingScheduleRow): ScheduleItem {
  if (incoming.weekday === null || incoming.period === null) {
    throw new Error('课位不完整，不能新增')
  }
  return {
    id: scheduleSlotId(incoming.weekday, incoming.period),
    weekday: incoming.weekday,
    period: incoming.period,
    startTime: incoming.startTime,
    endTime: incoming.endTime,
    team: incoming.team,
    courseType: incoming.courseType
  }
}

function applyIncomingToCurrent(
  current: ScheduleItem,
  incoming: IncomingScheduleRow,
  clearLink: boolean
): ScheduleItem {
  const next: ScheduleItem = {
    ...current,
    team: incoming.team,
    startTime: incoming.startTime,
    endTime: incoming.endTime,
    courseType: incoming.courseType
  }
  if (clearLink) {
    delete next.classId
    delete next.trainingTeamId
  }
  return next
}

export function buildSchedulePreview(
  currentItems: ReadonlyArray<ScheduleItem>,
  incoming: ReadonlyArray<IncomingScheduleRow>,
  options: { fileName?: string; resolutions?: ScheduleSyncResolutions } = {}
): SchedulePreviewResult {
  const resolutions = options.resolutions ?? EMPTY_RESOLUTIONS
  const current = parseScheduleItems(currentItems.map((item) => ({ ...item })))
  const mode: SchedulePreviewResult['mode'] = current.length === 0 ? 'first' : 'sync'
  const bySlot = new Map<string, IncomingScheduleRow[]>()
  const orphanConflicts: ScheduleSyncLine[] = []

  for (const row of incoming) {
    if (row.weekday === null || row.period === null || row.team.trim() === '') {
      orphanConflicts.push({
        kind: 'conflict',
        slotId: `excel-${row.excelRow}`,
        incoming: row,
        message: `第 ${row.excelRow} 行无法识别星期或节次，不能静默写入`
      })
      continue
    }
    const slotId = scheduleSlotId(row.weekday, row.period)
    const list = bySlot.get(slotId) ?? []
    list.push(row)
    bySlot.set(slotId, list)
  }

  const currentById = new Map(current.map((item) => [item.id, item]))
  const lines: ScheduleSyncLine[] = [...orphanConflicts]
  const target: ScheduleItem[] = []
  let keep = 0
  let create = 0
  let update = 0
  let remove = 0
  let conflict = orphanConflicts.length

  const seen = new Set<string>()

  for (const [slotId, rows] of bySlot) {
    seen.add(slotId)
    const existing = currentById.get(slotId)
    const choice = resolutions.slotChoices[slotId]
    const unique = rows

    const resolvedIncoming =
      choice?.action === 'incoming' && unique.some((item) => item.excelRow === choice.excelRow)
    const resolvedKeep = choice?.action === 'keep' && Boolean(existing)
    if (unique.length > 1 && !resolvedIncoming && !resolvedKeep) {
      conflict += 1
      lines.push({
        kind: 'conflict',
        slotId,
        weekday: unique[0].weekday ?? undefined,
        period: unique[0].period ?? undefined,
        current: existing ? snapshot(existing) : undefined,
        incomingCandidates: unique,
        message: `${slotLabel(unique[0].weekday as Weekday, unique[0].period as Period)} 在 Excel 中出现 ${unique.length} 次，请选择保留哪一行，禁止静默覆盖`
      })
      if (existing) {
        target.push(existing)
      }
      continue
    }

    const selected =
      choice?.action === 'incoming'
        ? (unique.find((item) => item.excelRow === choice.excelRow) ?? unique[0])
        : unique[0]

    if (choice?.action === 'keep' && existing) {
      keep += 1
      lines.push({
        kind: 'keep',
        slotId,
        weekday: existing.weekday,
        period: existing.period,
        current: snapshot(existing),
        incoming: selected,
        message: `${slotLabel(existing.weekday, existing.period)} 保持现有课表`
      })
      target.push(existing)
      continue
    }

    if (!existing) {
      create += 1
      lines.push({
        kind: 'create',
        slotId,
        weekday: selected.weekday ?? undefined,
        period: selected.period ?? undefined,
        incoming: selected,
        message: `新增 ${slotLabel(selected.weekday as Weekday, selected.period as Period)} ${selected.team}`
      })
      target.push(toCreatedItem(selected))
      continue
    }

    if (sameCore(existing, selected)) {
      keep += 1
      const clearLink = Boolean(resolutions.clearLinks[slotId])
      lines.push({
        kind: 'keep',
        slotId,
        weekday: existing.weekday,
        period: existing.period,
        current: snapshot(existing),
        incoming: selected,
        message: `保留 ${slotLabel(existing.weekday, existing.period)} ${existing.team}`
      })
      target.push(clearLink ? applyIncomingToCurrent(existing, selected, true) : existing)
      continue
    }

    update += 1
    const clearLink = Boolean(resolutions.clearLinks[slotId])
    lines.push({
      kind: 'update',
      slotId,
      weekday: existing.weekday,
      period: existing.period,
      current: snapshot(existing),
      incoming: selected,
      message: `更新 ${slotLabel(existing.weekday, existing.period)}：${existing.team} → ${selected.team}`
    })
    target.push(applyIncomingToCurrent(existing, selected, clearLink))
  }

  for (const item of current) {
    if (seen.has(item.id)) {
      continue
    }
    remove += 1
    lines.push({
      kind: 'remove',
      slotId: item.id,
      weekday: item.weekday,
      period: item.period,
      current: snapshot(item),
      message: `${slotLabel(item.weekday, item.period)} ${item.team}`
    })
  }

  const blockingReasons: string[] = []
  if (conflict > 0) {
    blockingReasons.push('存在冲突课位，确认前不会覆盖')
  }
  if (incoming.filter((item) => item.weekday !== null && item.period !== null && item.team.trim()).length === 0) {
    blockingReasons.push('没有可识别的课表行')
  }
  const removeNotice =
    remove > 0
      ? '新课表中未发现以下原有课时，确认同步后将从当前课表移除。'
      : null
  if (remove > 0 && !resolutions.acknowledgeRemoves) {
    blockingReasons.push('请确认待移除课时后再同步')
  }

  const canCommit = blockingReasons.length === 0
  const parsedTarget = canCommit ? parseScheduleItems(target) : undefined

  return {
    mode,
    fileName: options.fileName ?? '',
    lines,
    totals: { keep, create, update, remove, conflict },
    canCommit,
    blockingReasons,
    removeNotice,
    target: parsedTarget
  }
}

export function applyScheduleSync(
  currentItems: ReadonlyArray<ScheduleItem>,
  incoming: ReadonlyArray<IncomingScheduleRow>,
  resolutions: ScheduleSyncResolutions = EMPTY_RESOLUTIONS
): ScheduleItem[] {
  const preview = buildSchedulePreview(currentItems, incoming, { resolutions })
  if (!preview.canCommit || !preview.target) {
    throw new Error(preview.blockingReasons[0] ?? '课表同步尚未确认，不能写入')
  }
  return parseScheduleItems(preview.target)
}
