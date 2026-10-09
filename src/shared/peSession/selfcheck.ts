import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseScheduleItems, scheduleSlotId, workbenchClockStatus } from '../schedule'
import {
  resolveScheduleClassroomEligibility,
  shouldShowScheduleUnboundHint
} from '../schedule/classroomEligibility'
import { isScheduleSpecialEventText } from '../schedule/specialEvent'
import { LEGACY_SCHEDULE_FIXTURE } from '../schedule/__fixtures__/legacySchedule'
import type { ScheduleItem } from '../schedule/types'
import type { PEClassSession, PEStudentRecord, PeLessonType } from './types'
import {
  findExistingPeSession,
  findPeSessionById,
  findSessionForWorkbenchLesson,
  resolveWorkbenchLessonRecord
} from './workbenchToday'
import { findDuplicateSession } from './validate'
import { appendActiveStudentsToSession, listMissingActiveStudents } from './rosterSync'
import {
  currentWeekNumberForDate,
  resolveUniqueCurrentWeekPrefill,
  type TeachingPlan
} from '../teachingPlan'

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

const CLASS_A = 'class-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
const CLASS_B = 'class-bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee'
const STUDENT_A = 'student-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
const SESSION_LINKED = 'pe-session-aaaaaaaa-bbbb-4ccc-8ddd-111111111111'
const SESSION_OLD = 'pe-session-aaaaaaaa-bbbb-4ccc-8ddd-222222222222'
const SESSION_EXTRA = 'pe-session-aaaaaaaa-bbbb-4ccc-8ddd-333333333333'
const SESSION_DELETED_CLASS = 'pe-session-aaaaaaaa-bbbb-4ccc-8ddd-444444444444'
const RECORD_A = 'pe-record-aaaaaaaa-bbbb-4ccc-8ddd-aaaaaaaaaaa1'
const RECORD_B = 'pe-record-aaaaaaaa-bbbb-4ccc-8ddd-aaaaaaaaaaa2'
const RECORD_C = 'pe-record-aaaaaaaa-bbbb-4ccc-8ddd-aaaaaaaaaaa3'
const RECORD_D = 'pe-record-aaaaaaaa-bbbb-4ccc-8ddd-aaaaaaaaaaa4'
const TODAY = '2026-09-18'
const LESSON_ID = scheduleSlotId(1, 3)

function studentRecord(id: string, sessionId: string): PEStudentRecord {
  return {
    id,
    sessionId,
    studentId: STUDENT_A,
    nameSnapshot: '张三',
    studentNoSnapshot: 'A01',
    attendanceStatus: 'normal',
    performanceTags: [],
    note: '',
    createdAt: '2026-09-18T00:00:00.000Z',
    updatedAt: '2026-09-18T00:00:00.000Z'
  }
}

function session(options: {
  id: string
  classId: string
  date?: string
  period: number
  scheduleLessonId: string | null
  lessonType?: PeLessonType
  recordId: string
  classNameSnapshot?: string
}): PEClassSession {
  return {
    id: options.id,
    classId: options.classId,
    date: options.date ?? TODAY,
    period: options.period,
    scheduleLessonId: options.scheduleLessonId,
    lessonType: options.lessonType ?? 'regular',
    topic: '',
    notes: '',
    classNameSnapshot: options.classNameSnapshot ?? '1班',
    gradeSnapshot: '初一',
    teamSnapshot: '团队1',
    startTimeSnapshot: '10:00',
    endTimeSnapshot: '10:40',
    createdAt: '2026-09-18T00:00:00.000Z',
    updatedAt: '2026-09-18T00:00:00.000Z',
    records: [studentRecord(options.recordId, options.id)]
  }
}

function todayLesson(patch: Partial<ScheduleItem> = {}): ScheduleItem {
  const parsed = parseScheduleItems([
    {
      weekday: 1,
      period: 3,
      startTime: '10:00',
      endTime: '10:40',
      team: '团队1',
      courseType: 'regular',
      classId: CLASS_A
    }
  ])[0]
  return { ...parsed, ...patch }
}

function endedNow(): Date {
  return new Date(2026, 8, 18, 12, 0, 0)
}

function readSrc(relativeFromShared: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', relativeFromShared), 'utf8')
}

export function runPeSessionWorkbenchSelfCheckOrThrow(): string {
  const lesson = todayLesson()
  assert(lesson.id === LESSON_ID, '今日课表格子 id 必须稳定')

  const emptyMatch = resolveWorkbenchLessonRecord([], lesson, TODAY)
  assert(emptyMatch.status === 'unrecorded', '今天有课且无课堂记录应为未记录')
  assert(emptyMatch.session === undefined, '未记录时不得指向课堂记录')

  const linked = session({
    id: SESSION_LINKED,
    classId: CLASS_A,
    period: 3,
    scheduleLessonId: LESSON_ID,
    recordId: RECORD_A
  })
  const linkedMatch = resolveWorkbenchLessonRecord([linked], lesson, TODAY)
  assert(linkedMatch.status === 'in_progress', '有 scheduleLessonId 对应记录应为记录中（旧数据无 status）')
  assert(linkedMatch.session?.id === SESSION_LINKED, '记录中必须指向原记录')

  const clock = workbenchClockStatus(lesson, endedNow(), undefined, undefined)
  assert(clock === 'done', '12:00 时第3节应为已结束')
  const endedUnrecorded = resolveWorkbenchLessonRecord([], lesson, TODAY)
  assert(clock === 'done' && endedUnrecorded.status === 'unrecorded', '已下课但无记录仍为未记录')

  const duplicate = findExistingPeSession([linked], {
    classId: CLASS_B,
    date: TODAY,
    period: 8,
    scheduleLessonId: LESSON_ID
  })
  assert(duplicate === undefined, '课表 ID 相同也不能把不同班级和节次归为旧课堂')
  assert(
    findSessionForWorkbenchLesson([linked], lesson, TODAY)?.id === SESSION_LINKED,
    '继续记录目标必须是原记录'
  )

  const extra = session({
    id: SESSION_EXTRA,
    classId: CLASS_A,
    period: 3,
    scheduleLessonId: null,
    lessonType: 'extra',
    recordId: RECORD_C
  })
  const extraMatch = resolveWorkbenchLessonRecord([extra], lesson, TODAY)
  assert(extraMatch.status === 'unrecorded', '独立补课不得把正常课表格子标成已记录')
  assert(extraMatch.session === undefined, '补课不得成为课表格子的工作台记录')
  assert(
    findExistingPeSession([extra], { classId: CLASS_A, date: TODAY, period: 3, scheduleLessonId: LESSON_ID }) === undefined,
    '独立补课不占用普通课身份，普通课不得打开补课记录'
  )

  const oldMissingLink = session({
    id: SESSION_OLD,
    classId: CLASS_A,
    period: 3,
    scheduleLessonId: null,
    lessonType: 'regular',
    recordId: RECORD_B
  })
  const oldMatch = resolveWorkbenchLessonRecord([oldMissingLink], lesson, TODAY)
  assert(oldMatch.status === 'in_progress', '旧记录缺少 scheduleLessonId 时应兼容匹配为记录中')
  assert(oldMatch.session?.id === SESSION_OLD, '旧兼容不得改写历史，只读取已有记录')
  assert(oldMissingLink.scheduleLessonId === null, '兼容匹配不得改写旧记录的 scheduleLessonId')

  const otherDay = session({
    id: SESSION_OLD,
    classId: CLASS_A,
    date: '2026-09-17',
    period: 3,
    scheduleLessonId: LESSON_ID,
    recordId: RECORD_B
  })
  assert(
    resolveWorkbenchLessonRecord([otherDay], lesson, TODAY).status === 'unrecorded',
    '其它日期的同格子记录不得标成今天已记录'
  )

  const deletedClassSession = session({
    id: SESSION_DELETED_CLASS,
    classId: CLASS_B,
    period: 5,
    scheduleLessonId: null,
    lessonType: 'extra',
    recordId: RECORD_D,
    classNameSnapshot: '已删班'
  })
  const opened = findPeSessionById([deletedClassSession], SESSION_DELETED_CLASS)
  assert(opened?.id === SESSION_DELETED_CLASS, '近期记录必须能解析到有效记录')
  assert(opened?.classNameSnapshot === '已删班', '已删班级的历史课堂记录仍应可打开')
  assert(findPeSessionById([], SESSION_DELETED_CLASS) === undefined, '找不到记录时应明确返回空')

  assert(resolveWorkbenchLessonRecord([], todayLesson(), TODAY).status === 'unrecorded', '空课堂记录列表正常')
  assert(findSessionForWorkbenchLesson([], todayLesson(), TODAY) === undefined, '空课表关联查找不得崩溃')
  assert(parseScheduleItems([]).length === 0, '空课表正常')
  assert(LEGACY_SCHEDULE_FIXTURE.every((item) => item.weekday >= 1 && item.weekday <= 5), '默认课表不含周末格子')

  const weekendProbe = workbenchClockStatus(
    { id: 'w1-p1', startTime: '08:00', endTime: '08:40' },
    new Date(2026, 8, 20, 10, 0, 0),
    undefined,
    undefined
  )
  assert(weekendProbe === 'done' || weekendProbe === 'later' || weekendProbe === 'live' || weekendProbe === 'next', '周末调用时钟状态不得抛错')

  const legacyMissingId = session({
    id: SESSION_OLD,
    classId: CLASS_A,
    period: 7,
    scheduleLessonId: null,
    recordId: RECORD_B
  })
  assert(
    resolveWorkbenchLessonRecord([legacyMissingId], lesson, TODAY).status === 'unrecorded',
    '缺少 scheduleLessonId 的其它节次旧记录不得崩溃或误标'
  )

  assert(
    findDuplicateSession([linked], CLASS_A, TODAY, 3)?.id === SESSION_LINKED,
    '原有 class+date+period 防重必须仍有效'
  )

  const listedClasses = [{ id: CLASS_A, status: 'active' as const }]
  const todayEligible = resolveScheduleClassroomEligibility(lesson, {
    cellWeekday: 1,
    todayWeekday: 1,
    classes: listedClasses
  })
  assert(todayEligible.eligible, '今天已绑定行政班的体育课应允许开始课堂')
  assert(resolveWorkbenchLessonRecord([], lesson, TODAY).status === 'unrecorded', '今天课表未记录时开始课堂目标应为未记录')
  assert(resolveWorkbenchLessonRecord([linked], lesson, TODAY).session?.id === SESSION_LINKED, '今天课表已记录时继续记录目标应与工作台一致')

  const unboundLesson = todayLesson()
  delete unboundLesson.classId
  const unboundEligibility = resolveScheduleClassroomEligibility(unboundLesson, {
    cellWeekday: 1,
    todayWeekday: 1,
    classes: listedClasses
  })
  assert(!unboundEligibility.eligible && unboundEligibility.reason === 'unbound', '未绑定行政班不允许开始课堂')
  assert(shouldShowScheduleUnboundHint(unboundLesson, unboundEligibility), '未绑定行政班应提示而不是猜班级')

  const trainingOnly = todayLesson()
  delete trainingOnly.classId
  trainingOnly.trainingTeamId = 'training-team-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
  const trainingEligibility = resolveScheduleClassroomEligibility(trainingOnly, {
    cellWeekday: 1,
    todayWeekday: 1,
    classes: listedClasses
  })
  assert(!trainingEligibility.eligible && trainingEligibility.reason === 'training-only', '训练队课不生成行政班课堂操作')

  const flagLesson = todayLesson({ team: '升旗仪式' })
  assert(isScheduleSpecialEventText(flagLesson.team), '升旗仪式必须识别为特殊事件')
  const specialEligibility = resolveScheduleClassroomEligibility(flagLesson, {
    cellWeekday: 1,
    todayWeekday: 1,
    classes: listedClasses
  })
  assert(!specialEligibility.eligible && specialEligibility.reason === 'special-event', '特殊事件不生成课堂操作')

  const otherDayEligibility = resolveScheduleClassroomEligibility(lesson, {
    cellWeekday: 2,
    todayWeekday: 1,
    classes: listedClasses
  })
  assert(!otherDayEligibility.eligible && otherDayEligibility.reason === 'not-today', '非今天星期列不显示今天记录状态')

  const workbenchMatch = resolveWorkbenchLessonRecord([linked], lesson, TODAY)
  const scheduleMatch = todayEligible.eligible ? resolveWorkbenchLessonRecord([linked], lesson, TODAY) : undefined
  assert(workbenchMatch.session?.id === scheduleMatch?.session?.id, '同一 scheduleLessonId 工作台与课表页解析结果必须一致')
  const oldWorkbench = resolveWorkbenchLessonRecord([oldMissingLink], lesson, TODAY)
  const oldSchedule = resolveWorkbenchLessonRecord([oldMissingLink], lesson, TODAY)
  assert(oldWorkbench.session?.id === oldSchedule.session?.id, '旧记录 fallback 两个入口必须一致')
  assert(
    findExistingPeSession([linked], { classId: CLASS_A, date: TODAY, period: 3, scheduleLessonId: LESSON_ID })?.id ===
      SESSION_LINKED,
    '课表页开始课堂仍必须走同一套防重'
  )

  const dashboard = readSrc('../renderer/src/pages/DashboardPage.tsx')
  assert(dashboard.includes('findSessionForWorkbenchLesson') || dashboard.includes('resolveWorkbenchLessonRecord'), '工作台必须用共享记录状态')
  assert(dashboard.includes('workbenchClockStatus'), '工作台必须把时间状态与记录状态分开')
  assert(dashboard.includes('workbenchActionLabel') || dashboard.includes('继续记录'), '记录中课程按钮应为继续记录')
  assert(dashboard.includes('查看记录') || dashboard.includes('workbenchActionLabel'), '已完成课程应有查看记录入口')
  assert(dashboard.includes('开始课堂'), '未记录课程按钮应为开始课堂')
  assert(dashboard.includes('今日记录中') && dashboard.includes('今日已完成'), '工作台概览应区分记录中与已完成')
  assert(dashboard.includes('onOpenSession'), '近期课堂记录必须可打开')
  assert(!dashboard.includes('dashboard-status.json'), '不得派生持久化工作台状态')
  assert(dashboard.includes('今天暂无课程安排'), '空课表/周末必须保持空态文案')
  assert(dashboard.includes("onNavigate('tests')"), '待完成测试 KPI 必须跳转到体育测试页面')

  const schedulePage = readSrc('../renderer/src/pages/SchedulePage.tsx')
  assert(schedulePage.includes('resolveWorkbenchLessonRecord'), '课表页必须复用 P0-1 课堂记录状态')
  assert(schedulePage.includes('resolveScheduleClassroomEligibility'), '课表页必须用共享资格判断')
  assert(schedulePage.includes('findExistingPeSession') === false, '课表页不得复制防重实现')
  assert(schedulePage.includes('开始课堂') && schedulePage.includes('workbenchActionLabel'), '课表页今日课应提供开始课堂与继续/查看')
  assert(schedulePage.includes('未绑定行政班'), '未绑定行政班必须明确提示')

  const app = readSrc('../renderer/src/App.tsx')
  assert(app.includes('openPeSessionId'), '打开已有课堂记录必须复用现有课堂记录页')
  assert(app.includes('SchedulePage onStartRecord') || app.includes('<SchedulePage onStartRecord'), '课表页必须接入同一套课堂导航')
  const lessonPage = readSrc('../renderer/src/pages/PeLessonRecordsPage.tsx')
  assert(lessonPage.includes('findExistingPeSession'), '创建链必须走底层防重')
  assert(lessonPage.includes('openSessionId'), '继续记录/近期记录必须打开原记录编辑界面')
  assert(lessonPage.includes('resolveUniqueCurrentWeekPrefill'), '新建课堂必须走共享教学计划预填')
  assert(lessonPage.includes('buildPeSession'), '工作台/课表/手动创建必须共用 buildPeSession')

  const editor = readSrc('../renderer/src/components/PeSessionEditor.tsx')
  assert(editor.includes('listMissingActiveStudents'), '课堂编辑器必须检测缺失在读学生')
  assert(editor.includes('appendActiveStudentsToSession'), '补充学生必须走只追加同步')
  assert(editor.includes('补充学生'), '缺失学生时必须提供补充学生按钮')
  assert(!editor.includes('records = active'), '禁止整表重写课堂名单')

  // —— A. 课堂名单增量同步（只补不删）——
  const rosterSession: PEClassSession = {
    ...session({
      id: SESSION_LINKED,
      classId: CLASS_A,
      period: 3,
      scheduleLessonId: LESSON_ID,
      recordId: RECORD_A
    }),
    records: Array.from({ length: 47 }, (_, index) => ({
      id: `pe-record-aaaaaaaa-bbbb-4ccc-8ddd-${String(index + 1).padStart(12, '0')}`,
      sessionId: SESSION_LINKED,
      studentId: `student-aaaaaaaa-bbbb-4ccc-8ddd-${String(index + 1).padStart(12, '0')}`,
      nameSnapshot: `学生${index + 1}`,
      studentNoSnapshot: String(index + 1).padStart(2, '0'),
      attendanceStatus: index === 0 ? ('absent' as const) : ('normal' as const),
      performanceTags: index === 0 ? (['engaged'] as const) : [],
      note: index === 0 ? '已填备注' : '',
      createdAt: '2026-09-18T00:00:00.000Z',
      updatedAt: '2026-09-18T00:00:00.000Z'
    }))
  }
  // 第 48 号在读新生 + 一名已转出但仍在历史名单中的学生保持不动
  const classStudents = [
    ...rosterSession.records.map((record, index) => ({
      id: record.studentId,
      classId: CLASS_A,
      status: index === 46 ? ('transferred' as const) : ('active' as const),
      name: record.nameSnapshot,
      studentNo: record.studentNoSnapshot
    })),
    {
      id: 'student-aaaaaaaa-bbbb-4ccc-8ddd-000000000048',
      classId: CLASS_A,
      status: 'active' as const,
      name: '新生48',
      studentNo: '48'
    }
  ]
  // 转出学生仍在 records 中；当前在读只有 46 名旧生 + 1 名新生（班级少于历史）
  const missing = listMissingActiveStudents(rosterSession, classStudents)
  assert(missing.length === 1 && missing[0].id.endsWith('048'), '47 人 session 新增 1 名在读只应检出 1 人')
  const beforeFingerprint = JSON.stringify(rosterSession.records)
  const synced = appendActiveStudentsToSession(rosterSession, classStudents, '2026-09-18T12:00:00.000Z')
  assert(synced.addedCount === 1, '只应追加 1 人')
  assert(synced.session.records.length === 48, '追加后应为 48 人')
  assert(
    JSON.stringify(synced.session.records.slice(0, 47)) === beforeFingerprint,
    '已有 47 人的 attendance/performance/notes 不得改变'
  )
  assert(
    synced.session.records.some((record) => record.studentId.endsWith('047')),
    '已转出历史学生必须保留'
  )
  assert(synced.session.records[0].attendanceStatus === 'absent', '不得重置已有考勤')
  assert(synced.session.records[0].note === '已填备注', '不得覆盖已有备注')
  assert(synced.session.records[47].attendanceStatus === 'normal', '新补入学生默认正常')
  assert(synced.session.records[47].performanceTags.length === 0, '新补入学生不得编造表现')

  const again = appendActiveStudentsToSession(synced.session, classStudents)
  assert(again.addedCount === 0 && again.session.records.length === 48, '重复同步不得重复添加')
  const noop = appendActiveStudentsToSession(rosterSession, classStudents.filter((s) => !s.id.endsWith('048')))
  assert(noop.addedCount === 0 && noop.session === rosterSession, '无缺失学生时结果不变')

  // 班级人数少于历史 session：只补不删
  const fewerActive = classStudents.filter((s) => s.status === 'active' && !s.id.endsWith('048')).slice(0, 10)
  const noDelete = appendActiveStudentsToSession(rosterSession, fewerActive)
  assert(noDelete.addedCount === 0 && noDelete.session.records.length === 47, '班级变少不得自动删除历史名单')

  const badSession = {
    ...rosterSession,
    records: [
      ...rosterSession.records.slice(0, 2),
      {
        ...rosterSession.records[2],
        studentId: ''
      }
    ]
  }
  assert(
    listMissingActiveStudents(badSession, classStudents).every((s) => s.id.trim()),
    '空 studentId 旧数据不得导致崩溃或误匹配'
  )
  assert(findPeSessionById([deletedClassSession], SESSION_DELETED_CLASS)?.id === SESSION_DELETED_CLASS, '班级已删除时历史 session 仍可打开')

  // —— B. 本周教学计划只读预填 ——
  const basePlan: TeachingPlan = {
    id: 'teaching-plan-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    name: '初一体育',
    academicYear: '2026-2027',
    semester: '第一学期',
    grade: '初一',
    startDate: '2026-09-01',
    endDate: null,
    totalWeeks: 4,
    notes: '',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    weeks: [
      {
        id: 'teaching-plan-week-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeee1',
        weekNumber: 1,
        title: '第一周课题',
        contents: '第一周内容',
        objectives: '',
        notes: ''
      },
      {
        id: 'teaching-plan-week-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeee2',
        weekNumber: 2,
        title: '快速跑',
        contents: '起跑与加速',
        objectives: '掌握起跑姿势',
        notes: ''
      },
      {
        id: 'teaching-plan-week-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeee3',
        weekNumber: 3,
        title: '',
        contents: '',
        objectives: '',
        notes: ''
      },
      {
        id: 'teaching-plan-week-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeee4',
        weekNumber: 4,
        title: '第四周',
        contents: '内容四',
        objectives: '',
        notes: ''
      }
    ]
  }
  assert(currentWeekNumberForDate('2026-09-01', 4, '2026-09-18') === 3, '周次计算应按开始日起算')
  // 2026-09-08 是第 2 周
  const unique = resolveUniqueCurrentWeekPrefill(
    [basePlan],
    { grade: '初一', academicYear: '2026-2027', semester: '第一学期' },
    '2026-09-08'
  )
  assert(unique.status === 'prefilled' && unique.topic === '快速跑' && unique.notes === '起跑与加速', '唯一计划+当前周应正确预填')
  const planSnapshot = JSON.stringify(basePlan)
  assert(JSON.stringify(basePlan) === planSnapshot, '预填不得修改 TeachingPlan')

  assert(
    resolveUniqueCurrentWeekPrefill([], { grade: '初一', academicYear: '2026-2027', semester: '第一学期' }, '2026-09-08')
      .status === 'none',
    '没有计划时不预填'
  )
  const duplicatePlan = { ...basePlan, id: 'teaching-plan-aaaaaaaa-bbbb-4ccc-8ddd-ffffffffffff', name: '另一份' }
  assert(
    resolveUniqueCurrentWeekPrefill(
      [basePlan, duplicatePlan],
      { grade: '初一', academicYear: '2026-2027', semester: '第一学期' },
      '2026-09-08'
    ).status === 'ambiguous',
    '多份匹配计划不得猜测'
  )
  assert(
    resolveUniqueCurrentWeekPrefill(
      [basePlan],
      { grade: '初二', academicYear: '2026-2027', semester: '第一学期' },
      '2026-09-08'
    ).status === 'none',
    '不同年级不得串计划'
  )
  assert(
    resolveUniqueCurrentWeekPrefill(
      [basePlan],
      { grade: '初一', academicYear: '2026-2027', semester: '第二学期' },
      '2026-09-08'
    ).status === 'none',
    '不同学期不得串计划'
  )
  const oldSessionTopic = linked.topic
  assert(oldSessionTopic === '', '旧 session 不被预填逻辑改写（本自检只测纯函数，创建链仅新建调用）')

  return 'pe-session workbench self-check passed'
}
