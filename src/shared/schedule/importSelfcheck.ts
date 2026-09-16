import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readJsonItemsFile, writeJsonItemsAtomic } from '../persistence/jsonFile'
import { DEFAULT_SCHEDULE } from './defaultSchedule'
import {
  detectScheduleWorkbook,
  extractScheduleWorkbook,
  parsePeriodCell,
  parseTimeRangeCell,
  parseWeekdayCell
} from './detectSchedule'
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
  assert(
    parseTimeRangeCell('8:00–8:40')?.startTime === '08:00' &&
      parseTimeRangeCell('8:00 至 8:40')?.endTime === '08:40',
    '应兼容 Unicode 与中文时间连接符'
  )

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
  assert(extractScheduleWorkbook(detected).rows.length === 2, '旧的简单标准模板仍应识别全部课程')

  const realWorkbenchRows = [
    ['郁添睿 · 课程表工作台'],
    ['2026学年第一学期七年级｜黄色单元格为体育与健康课'],
    ['节次', '时间', '星期一', '星期二', '星期三', '星期四', '星期五'],
    ['第1节', '8:00–8:40', '升旗仪式', '', '', '', ''],
    ['第2节', '8:50–9:30', '', '', '团队5（初一4班） · 体育与健康', '', ''],
    ['大课间', '9:30–10:00', '大课间（每天）', '', '', '', ''],
    [
      '第3节',
      '10:00–10:40',
      '',
      '团队3（初一2班） · 体育与健康',
      '团队3（初一2班） · 体育与健康',
      '团队2（初一8班） · 体育与健康',
      ''
    ],
    ['第4节', '10:50–11:30', '', '团队2（初一8班） · 体育与健康', '', '', '团队5（初一4班） · 体育与健康'],
    [
      '第5节',
      '11:40–12:20',
      '团队1 · 大体育课',
      '团队5（初一4班） · 体育与健康',
      '',
      '团队5（初一4班） · 体育与健康',
      '团队2（初一8班） · 体育与健康'
    ],
    ['第6节', '14:15–14:55', '', '', '团队2（初一8班） · 体育与健康', '', '团队4（初一9班） · 体育与健康'],
    [
      '第7节',
      '15:10–15:50',
      '',
      '团队4（初一9班） · 体育与健康',
      '团队4（初一9班） · 体育与健康',
      '团队3（初一2班） · 体育与健康',
      ''
    ],
    ['第8节', '16:05–16:45', '', '', '', '团队4（初一9班） · 体育与健康', '团队3（初一2班） · 体育与健康'],
    [],
    ['本周合计', '17 节', '常规体育课', '16 节', '大体育课', '1 节'],
    [],
    ['已纳入周一升旗仪式、每日大课间；周四团队5（初一4班）体育课为第5节。']
  ]
  const workbenchDetected = detectScheduleWorkbook('郁添睿课程表工作台.xlsx', [
    {
      name: '郁添睿课程表工作台',
      rows: realWorkbenchRows,
      merges: [{ s: { r: 5, c: 2 }, e: { r: 5, c: 6 } }]
    }
  ])
  const workbenchTable = workbenchDetected.tables[0]
  assert(workbenchTable?.headerRowNumber === 3, '工作台课表应自动找到第3行表头')
  assert(workbenchTable?.layout === 'weekly-grid', '工作台课表应识别为星期矩阵')
  assert(
    workbenchTable?.dataStartRowNumber === 4 && workbenchTable.dataEndRowNumber === 12,
    `有效范围应排除标题和表尾说明，布局 ${workbenchTable?.layout}，实际 ${workbenchTable?.dataStartRowNumber}–${workbenchTable?.dataEndRowNumber}`
  )
  const workbenchExtraction = extractScheduleWorkbook(workbenchDetected)
  assert(workbenchExtraction.rows.length === 18, '真实周课表应识别 17 节体育课和 1 次升旗仪式')
  assert(
    workbenchExtraction.rows.filter((item) => /体育与健康|大体育课/.test(item.team)).length === 17,
    '真实周课表体育课程数量必须为 17'
  )
  assert(workbenchExtraction.summary.specialEventCount === 1, '升旗仪式应识别为特殊事件')
  assert(workbenchExtraction.rows.some((item) => item.team === '团队1 · 大体育课' && item.courseType === 'big'), '大体育课名称与类型应正常解析')
  assert(
    workbenchExtraction.rows.some((item) => item.team === '团队5（初一4班） · 体育与健康'),
    '中文括号和间隔点课程名称不得被过滤'
  )
  assert(workbenchExtraction.summary.skipped.length === 1, '暂不支持的大课间行应明确跳过一次')
  assert(workbenchExtraction.summary.skipped[0].reason.includes('暂不支持的特殊时段'), '大课间应给出明确跳过原因')
  assert(workbenchExtraction.rows[0].startTime === '08:00' && workbenchExtraction.rows[0].endTime === '08:40', 'Unicode 时间范围应规范化')
  assert(!workbenchExtraction.rows.some((item) => item.team.includes('本周合计') || item.team.includes('已纳入')), '汇总和备注不得成为课程')
  assert(
    workbenchExtraction.rows.every((item) => !('trainingTeamId' in item)),
    '团队文本不得自动生成 trainingTeamId'
  )

  const badCellRows = realWorkbenchRows.map((row) => [...row])
  badCellRows[6][1] = '无法识别的时间'
  const badCellExtraction = extractScheduleWorkbook(
    detectScheduleWorkbook('含坏单元格的课表.xlsx', [
      {
        name: '课表',
        rows: badCellRows,
        merges: [{ s: { r: 5, c: 2 }, e: { r: 5, c: 6 } }]
      }
    ])
  )
  assert(badCellExtraction.rows.length === 15, '一个坏时间单元格只能跳过所在行，不能清空整张课表')
  assert(
    badCellExtraction.summary.skipped.some((item) => item.reason.includes('无法识别时间范围')),
    '坏时间行必须提供明确跳过原因'
  )

  const workbenchApplied = applyScheduleSync([], workbenchExtraction.rows, {
    ...emptyScheduleResolutions(),
    acknowledgeRemoves: true
  })
  assert(workbenchApplied.every((item) => item.trainingTeamId === undefined), '矩阵导入结果不得误绑训练队')

  const dir = mkdtempSync(join(tmpdir(), 'gdpe-schedule-import-'))
  const filePath = join(dir, 'schedule.json')
  try {
    await writeJsonItemsAtomic(filePath, current)
    await writeJsonItemsAtomic(filePath, synced)
    const reloaded = await readJsonItemsFile(filePath, parseScheduleItems)
    assert(reloaded.length === 3, '重载后同步结果存在')
    assert(reloaded.find((item) => item.id === scheduleSlotId(1, 1))?.classId, '重载后 classId 仍在')
    await writeJsonItemsAtomic(filePath, workbenchApplied)
    const workbenchReloaded = await readJsonItemsFile(filePath, parseScheduleItems)
    assert(JSON.stringify(workbenchReloaded) === JSON.stringify(parseScheduleItems(workbenchApplied)), '工作台课表保存重读应一致')
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
