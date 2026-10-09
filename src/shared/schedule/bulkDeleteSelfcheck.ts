import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readJsonItemsFile, writeJsonItemsAtomic } from '../persistence/jsonFile'
import { LEGACY_SCHEDULE_FIXTURE } from './__fixtures__/legacySchedule'
import { applyScheduleBulkDelete, parseScheduleItems } from './validate'
import type { ScheduleItem } from './types'

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

function workbenchWeeklyTotal(items: ReadonlyArray<ScheduleItem>): number {
  return items.length
}

function workbenchTodayCount(items: ReadonlyArray<ScheduleItem>, weekday: ScheduleItem['weekday']): number {
  return items.filter((item) => item.weekday === weekday).length
}

export async function runScheduleBulkDeleteSelfCheckOrThrow(): Promise<string> {
  const defaultSnapshot = JSON.stringify(LEGACY_SCHEDULE_FIXTURE)
  assert(LEGACY_SCHEDULE_FIXTURE.length === 17, 'defaultSchedule 必须保持 17 节')

  const parsed = parseScheduleItems(LEGACY_SCHEDULE_FIXTURE)
  assert(parsed.length === 17, '模拟课表应为 17 节')
  const studentMarker = [{ id: 'student-keep', classId: parsed[0].classId ?? 'class-keep' }]
  const withClass = parseScheduleItems(
    parsed.map((item, index) => (index === 0 ? { ...item, classId: 'class-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' } : item))
  )
  const keepClassId = withClass.find((item) => item.classId)?.classId
  assert(keepClassId, '应存在带 classId 的未删除项')

  const selected = withClass.slice(1, 4).map((item) => item.id)
  assert(selected.length === 3, '应选择 3 节')
  const remainingIds = withClass.filter((item) => !selected.includes(item.id)).map((item) => item.id)

  const emptyAttempt = applyScheduleBulkDelete(withClass, [])
  assert(emptyAttempt === null, '删除 0 项不得产生可写入结果')

  const next = applyScheduleBulkDelete(withClass, selected)
  if (!next) {
    throw new Error('选择 3 节后应得到新课表')
  }
  assert(next.length === 14, '批量删除后应为 14 节')
  assert(
    next.map((item) => item.id).join('|') === remainingIds.join('|'),
    '未选择项应保持原顺序'
  )
  assert(next.some((item) => item.classId === keepClassId), '删除不得改写未选项的 classId')
  assert(studentMarker[0].id === 'student-keep', '删除不得影响学生数据')

  const beforeToday = workbenchTodayCount(withClass, 2)
  const afterToday = workbenchTodayCount(next, 2)
  assert(workbenchWeeklyTotal(withClass) === 17, '删除前工作台本周课时为 17')
  assert(workbenchWeeklyTotal(next) === 14, '工作台本周课时随删除更新')
  assert(afterToday === beforeToday - selected.filter((id) => id.startsWith('w2-')).length, '工作台今日课程随删除更新')

  const dir = mkdtempSync(join(tmpdir(), 'gdpe-schedule-bulk-'))
  const filePath = join(dir, 'schedule.json')
  let writes = 0
  async function persist(items: ScheduleItem[]): Promise<void> {
    writes += 1
    await writeJsonItemsAtomic(filePath, parseScheduleItems(items))
  }

  try {
    await persist(withClass)
    const planned = applyScheduleBulkDelete(withClass, selected)
    if (!planned) {
      throw new Error('持久化前应已算出完整目标课表')
    }
    await persist(planned)
    assert(writes === 2, '批量删除应一次写出完整课表（外加初始种子）')

    const reloaded = await readJsonItemsFile(filePath, parseScheduleItems)
    assert(reloaded.length === 14, '重载后仍为 14 节')
    assert(
      reloaded.map((item) => item.id).join('|') === remainingIds.join('|'),
      '重载后未选择项顺序不变'
    )

    const noWrite = applyScheduleBulkDelete(reloaded, [])
    assert(noWrite === null, '删除 0 项不得写入')
    assert(writes === 2, '删除 0 项后写入次数不得增加')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }

  assert(JSON.stringify(LEGACY_SCHEDULE_FIXTURE) === defaultSnapshot, 'defaultSchedule 模板不得被批量删除改写')
  assert(LEGACY_SCHEDULE_FIXTURE.length === 17, 'defaultSchedule 仍保持 17 节')
  return 'schedule bulk-delete self-check passed'
}
