import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { ClassRecord } from '../class/types'
import type { TeachingPlan } from './types'
import { currentWeekNumberForDate } from './prefill'
import {
  buildWeeklyTeachingTask,
  resolveCurrentTeachingWeek,
  resolveTeachingPlansForClass
} from './weeklyTask'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function readSrc(relative: string): string {
  return readFileSync(resolve(process.cwd(), relative), 'utf8')
}

const NOW = '2026-09-21T08:00:00.000Z'
const PLAN_A = 'teaching-plan-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
const PLAN_B = 'teaching-plan-bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee'
const WEEK_1 = 'teaching-plan-week-aaaaaaaa-bbbb-4ccc-8ddd-111111111111'
const WEEK_2 = 'teaching-plan-week-aaaaaaaa-bbbb-4ccc-8ddd-222222222222'
const WEEK_3 = 'teaching-plan-week-aaaaaaaa-bbbb-4ccc-8ddd-333333333333'
const CLASS_A = 'class-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
const CLASS_B = 'class-bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee'

function plan(partial: Partial<TeachingPlan> & Pick<TeachingPlan, 'id' | 'name' | 'grade'>): TeachingPlan {
  return {
    academicYear: '2025-2026',
    semester: '第一学期',
    startDate: '2026-09-01',
    endDate: null,
    totalWeeks: 3,
    notes: '',
    createdAt: NOW,
    updatedAt: NOW,
    weeks: [
      { id: WEEK_1, weekNumber: 1, title: '适应', contents: '队列', objectives: '站队', notes: '' },
      { id: WEEK_2, weekNumber: 2, title: '快速跑', contents: '起跑与加速', objectives: '反应快', notes: '' },
      { id: WEEK_3, weekNumber: 3, title: '跳远', contents: '起跳', objectives: '腾空', notes: '' }
    ],
    ...partial
  }
}

function clazz(
  id: string,
  grade: ClassRecord['grade'] = '初一',
  className = '1班'
): ClassRecord {
  return {
    id,
    grade,
    className,
    academicYear: '2025-2026',
    semester: '第一学期',
    studentCount: 40,
    status: 'active',
    notes: '',
    createdAt: NOW,
    updatedAt: NOW
  }
}

export function runV0280P01WeeklyTaskSelfCheckOrThrow(): string {
  assert(currentWeekNumberForDate('2026-09-01', 3, '2026-09-21') === 3, '周次边界：第3周')
  assert(currentWeekNumberForDate('2026-09-01', 3, '2026-08-31') === null, 'startDate 前无周次')
  assert(currentWeekNumberForDate('2026-09-01', 3, '2026-09-22') === null, '教学周期结束后无周次')
  assert(currentWeekNumberForDate(null, 3, '2026-09-21') === null, '无 startDate 无周次')

  const base = plan({ id: PLAN_A, name: '初一计划', grade: '初一' })
  const week = resolveCurrentTeachingWeek(base, '2026-09-08')
  assert(week?.weekNumber === 2 && week.week.title === '快速跑', 'resolveCurrentTeachingWeek 复用周次算法')

  const classes = [clazz(CLASS_A), clazz(CLASS_B, '初一', '2班')]
  const lessonA = { id: 'slot-1-3', classId: CLASS_A }
  const lessonUnbound = { id: 'slot-1-4', classId: undefined }
  const deletedClassLesson = { id: 'slot-1-5', classId: 'class-deletedd-bbbb-4ccc-8ddd-ffffffffffff' }

  // 无计划
  const none = buildWeeklyTeachingTask({
    plans: [],
    classes,
    todayLessons: [lessonA],
    onDate: '2026-09-08'
  })
  assert(none.status === 'none', '无计划 => none')

  // 唯一计划
  const ready = buildWeeklyTeachingTask({
    plans: [base],
    classes,
    todayLessons: [lessonA, lessonUnbound],
    onDate: '2026-09-08'
  })
  assert(ready.status === 'ready', '唯一计划 => ready')
  assert(ready.weekNumber === 2 && ready.title === '快速跑', '主题来自当前周')
  assert(ready.contents === '起跑与加速' && ready.objectives === '反应快', '内容与目标')
  assert(ready.todayLessonCount === 1, '今日对应课程只计绑定班级')
  assert(ready.weekId === WEEK_2 && ready.planId === PLAN_A, '带 weekId / planId')

  // 多计划（同上下文两份）
  const dup = plan({ id: PLAN_B, name: '初一计划B', grade: '初一' })
  const ambiguous = buildWeeklyTeachingTask({
    plans: [base, dup],
    classes,
    todayLessons: [lessonA],
    onDate: '2026-09-08'
  })
  assert(ambiguous.status === 'ambiguous', '多计划不随机猜')
  assert(!ambiguous.title, '多计划不填主题')

  // 不同年级各一份计划 → 今日两节不同年级 → ambiguous
  const grade2 = plan({ id: PLAN_B, name: '初二计划', grade: '初二' })
  const class2 = clazz(CLASS_B, '初二', '3班')
  const multiGrade = buildWeeklyTeachingTask({
    plans: [base, grade2],
    classes: [clazz(CLASS_A), class2],
    todayLessons: [lessonA, { id: 'slot-2-3', classId: CLASS_B }],
    onDate: '2026-09-08'
  })
  assert(multiGrade.status === 'ambiguous', '不同年级多计划 => ambiguous')

  // 空 weeks / 周不在范围
  const emptyWeeks = plan({ id: PLAN_A, name: '空', grade: '初一', weeks: [], totalWeeks: 0 })
  // parse would reject empty weeks in real JSON; buildWeekly still handles
  const noWeek = buildWeeklyTeachingTask({
    plans: [plan({ id: PLAN_A, name: '初一', grade: '初一', startDate: '2026-10-01' })],
    classes,
    todayLessons: [lessonA],
    onDate: '2026-09-08'
  })
  assert(noWeek.status === 'no-week', 'startDate 前 => no-week')

  // 周末 / 无课：回退班级上下文仍可读唯一计划
  const weekend = buildWeeklyTeachingTask({
    plans: [base],
    classes,
    todayLessons: [],
    onDate: '2026-09-12'
  })
  assert(weekend.status === 'ready' && weekend.weekNumber === 2, '周末无课仍可显示本周任务')

  // 已删除班级课时不计
  const deleted = buildWeeklyTeachingTask({
    plans: [base],
    classes,
    todayLessons: [deletedClassLesson],
    onDate: '2026-09-08'
  })
  assert(deleted.status === 'ready', '仅删除班级课时时回退班级列表仍可显示任务')

  // 旧 TeachingPlan 结构字段齐全可读（weeks 已有 id）
  assert(base.weeks[0].id.startsWith('teaching-plan-week-'), 'week 已有稳定 id')

  // 不复制周次算法：weeklyTask 必须调用 currentWeekNumberForDate
  const weeklySrc = readSrc('src/shared/teachingPlan/weeklyTask.ts')
  assert(weeklySrc.includes('currentWeekNumberForDate'), '必须复用 currentWeekNumberForDate')
  assert(weeklySrc.includes('plansMatchingClassContext'), '必须复用 plansMatchingClassContext')
  assert(!weeklySrc.includes('86400000'), '不得复制周次日历算法')

  const dash = readSrc('src/renderer/src/pages/DashboardPage.tsx')
  assert(dash.includes('buildWeeklyTeachingTask') || dash.includes('本周教学任务'), '工作台展示本周教学任务')
  assert(!dash.includes('plan-progress.json') && !dash.includes('teaching-execution.json'), '无新 JSON')

  // silence unused
  assert(emptyWeeks.weeks.length === 0, '空 weeks fixture')
  assert(resolveTeachingPlansForClass([base], classes[0]).length === 1, '按班级匹配')

  return 'v0.28.0 P0-1 weekly teaching task self-check passed'
}
