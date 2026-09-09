import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readJsonItemsFile, writeJsonItemsAtomic } from '../persistence/jsonFile'
import { DEFAULT_SCHEDULE } from './defaultSchedule'
import { detectScheduleWorkbook, parsePeriodCell, parseWeekdayCell } from './detectSchedule'
import type { IncomingScheduleRow } from './importTypes'
import { applyScheduleSync, buildSchedulePreview, emptyScheduleResolutions } from './reconcile'
import type { ScheduleItem } from './types'
import { parseScheduleItems, scheduleSlotId } from './validate'

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

function incoming(
  excelRow: number,
  weekday: IncomingScheduleRow['weekday'],
  period: IncomingScheduleRow['period'],
  team: string,
  startTime = '08:00',
  endTime = '08:40'
): IncomingScheduleRow {
  return {
    excelRow,
    weekdayRaw: weekday ? `周${weekday}` : '',
    periodRaw: period ? `第${period}节` : '',
    teamRaw: team,
    weekday,
    period,
    startTime,
    endTime,
    team,
    courseType: 'regular'
  }
}

export async function runScheduleImportSelfCheckOrThrow(): Promise<string> {
  const defaultSnapshot = JSON.stringify(DEFAULT_SCHEDULE)
  assert(DEFAULT_SCHEDULE.length === 17, 'defaultSchedule 必须保持 17 节')
  assert(parseWeekdayCell('星期一') === 1 && parsePeriodCell('第2节') === 2, '应能识别星期和节次')

  const firstRows = [incoming(2, 1, 1, '团队1'), incoming(3, 1, 2, '团队2')]
  const firstPreview = buildSchedulePreview([], firstRows, {
    fileName: 'empty.xlsx',
    resolutions: { ...emptyScheduleResolutions(), acknowledgeRemoves: true }
  })
  assert(firstPreview.mode === 'first', '空课表应为首次导入')
  assert(firstPreview.totals.create === 2 && firstPreview.totals.remove === 0, '首次导入应全部新增')
  const firstApplied = applyScheduleSync([], firstRows, { ...emptyScheduleResolutions(), acknowledgeRemoves: true })
  assert(firstApplied.length === 2, '空课表首次导入应写入 2 节')

  const current = parseScheduleItems([
    {
      id: scheduleSlotId(1, 1),
      weekday: 1,
      period: 1,
      startTime: '08:00',
      endTime: '08:40',
      team: '团队1',
      courseType: 'regular',
      classId: 'class-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
    },
    {
      id: scheduleSlotId(1, 2),
      weekday: 1,
      period: 2,
      startTime: '08:50',
      endTime: '09:30',
      team: '团队2',
      courseType: 'regular'
    },
    {
      id: scheduleSlotId(2, 3),
      weekday: 2,
      period: 3,
      startTime: '10:00',
      endTime: '10:40',
      team: '团队3',
      courseType: 'regular'
    }
  ])

  const excel = [
    incoming(2, 1, 1, '团队1', '08:00', '08:40'),
    incoming(3, 1, 2, '团队5', '08:50', '09:30'),
    incoming(4, 3, 4, '团队4', '10:50', '11:30')
  ]
  const unresolved = buildSchedulePreview(current, excel, { fileName: 'next.xlsx' })
  assert(unresolved.mode === 'sync', '已有课表应进入二次同步')
  assert(unresolved.totals.keep === 1, '应识别保留项')
  assert(unresolved.totals.update === 1, '应识别更新项')
  assert(unresolved.totals.create === 1, '应识别新增项')
  assert(unresolved.totals.remove === 1, '应识别待移除项')
  assert(!unresolved.canCommit, '待移除未确认时不得写入')
  assert(unresolved.removeNotice?.includes('确认同步后将从当前课表移除'), '待移除必须提示确认')

  const canceledItems = [...current]
  assert(canceledItems.length === 3, '用户取消同步不得写入')

  const confirmed = buildSchedulePreview(current, excel, {
    resolutions: { ...emptyScheduleResolutions(), acknowledgeRemoves: true }
  })
  assert(confirmed.canCommit, '确认待移除后应可同步')
  const synced = applyScheduleSync(current, excel, { ...emptyScheduleResolutions(), acknowledgeRemoves: true })
  assert(synced.length === 3, '同步后应为 3 节')
  assert(synced.find((item) => item.id === scheduleSlotId(1, 1))?.classId === 'class-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'Excel 无 classId 时不得清空原绑定')
  assert(synced.find((item) => item.id === scheduleSlotId(1, 2))?.team === '团队5', '同一课位名称变化应更新而非新增')
  assert(synced.some((item) => item.id === scheduleSlotId(3, 4)), '应新增新课位')
  assert(!synced.some((item) => item.id === scheduleSlotId(2, 3)), '确认后才移除旧课位')
  assert(workbenchWeekly(current) === 3, '取消后当前课表不变')
  assert(workbenchWeekly(synced) === 3, '工作台本周课时跟随同步后课表')

  const seventeen = parseScheduleItems(DEFAULT_SCHEDULE)
  const secondWave = seventeen.slice(0, 16).map((item, index) =>
    incoming(index + 2, item.weekday, item.period, index === 0 ? `${item.team}-改` : item.team, item.startTime, item.endTime)
  )
  const seventeenPreview = buildSchedulePreview(seventeen, secondWave, {
    resolutions: { ...emptyScheduleResolutions(), acknowledgeRemoves: true }
  })
  assert(seventeenPreview.totals.update === 1, '17 节二次导入应识别更新')
  assert(seventeenPreview.totals.remove === 1, '17 节二次导入应识别待移除')
  assert(seventeenPreview.totals.keep + seventeenPreview.totals.update === 16, '其余课位应保留或更新')

  const oldJson = parseScheduleItems(
    seventeen.map(({ id: _id, ...rest }) => rest)
  )
  assert(oldJson.length === 17 && oldJson[0].id === DEFAULT_SCHEDULE[0].id, '旧 JSON 无 id 字段仍兼容')

  const conflictPreview = buildSchedulePreview(current, [incoming(2, 1, 1, '甲'), incoming(3, 1, 1, '乙')], {
    resolutions: { ...emptyScheduleResolutions(), acknowledgeRemoves: true }
  })
  assert(conflictPreview.totals.conflict >= 1 && !conflictPreview.canCommit, '同一课位重复不得静默覆盖')
  let threw = false
  try {
    applyScheduleSync(current, [incoming(2, 1, 1, '甲'), incoming(3, 1, 1, '乙')], {
      ...emptyScheduleResolutions(),
      acknowledgeRemoves: true
    })
  } catch {
    threw = true
  }
  assert(threw, '冲突时 apply 不得写入')

  const detected = detectScheduleWorkbook('schedule.xlsx', [
    {
      name: '课表',
      rows: [
        ['星期', '节次', '开始时间', '结束时间', '课程', '类型'],
        ['星期一', '第1节', '08:00', '08:40', '团队1', '体育与健康'],
        ['星期一', '第2节', '08:50', '09:30', '团队5', '体育与健康']
      ]
    }
  ])
  assert(!detected.needsColumnMapping, '标准课表 Excel 应自动识别列')

  const dir = mkdtempSync(join(tmpdir(), 'gdpe-schedule-import-'))
  const filePath = join(dir, 'schedule.json')
  try {
    await writeJsonItemsAtomic(filePath, current)
    await writeJsonItemsAtomic(filePath, synced)
    const reloaded = await readJsonItemsFile(filePath, parseScheduleItems)
    assert(reloaded.length === 3, '重载后同步结果存在')
    assert(reloaded.find((item) => item.id === scheduleSlotId(1, 1))?.classId, '重载后 classId 仍在')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }

  assert(JSON.stringify(DEFAULT_SCHEDULE) === defaultSnapshot, 'defaultSchedule 不得被导入改写')
  assert(DEFAULT_SCHEDULE.length === 17, 'defaultSchedule 仍保持 17 节')
  return 'schedule import reconciliation self-check passed'
}

function workbenchWeekly(items: ReadonlyArray<ScheduleItem>): number {
  return items.length
}
