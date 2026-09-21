import { useMemo, useState } from 'react'
import { listedClassRecords, type ClassRecord } from '@shared/class'
import { countIncompletePeTestSessions } from '@shared/peTest'
import {
  ATTENDANCE_LABELS,
  formatLocalDate,
  mapScheduleCourseType,
  resolveWorkbenchLessonRecord,
  workbenchActionLabel,
  WORKBENCH_RECORD_STATUS_LABELS,
  type PeSessionPrefill
} from '@shared/peSession'
import { workbenchClockStatus, workbenchListedClass, WORKBENCH_CLOCK_LABELS } from '@shared/schedule'
import { buildWeeklyTeachingTask, deriveWeeklyPlanExecution } from '@shared/teachingPlan'
import { isActiveTrainingTeam } from '@shared/trainingTeam'
import heroSportsTech from '@assets/dashboard/hero-sports-tech.png'
import EmptyState from '../components/EmptyState'
import PageLayout from '../components/PageLayout'
import { AccentLine, GlowOrb, SpeedLines, TechGrid } from '../components/hud/HudDecor'
import { useClasses } from '../context/ClassContext'
import { usePeSessions } from '../context/PeSessionContext'
import { usePeTests } from '../context/PeTestContext'
import { useSchedule, useScheduleService } from '../context/ScheduleContext'
import { useTeachingPlans } from '../context/TeachingPlanContext'
import { useTraining } from '../context/TrainingContext'
import { useUserPreferences } from '../context/UserPreferencesContext'
import { COURSE_TYPE_LABELS, formatTimeRange, type ScheduleItem } from '../data/schedule'
import { useNow } from '../hooks/useNow'
import type { NavKey } from '../navigation'

export interface PlanNavContext {
  grade: ClassRecord['grade']
  className: string
  academicYear: string
  semester: ClassRecord['semester']
}

interface DashboardPageProps {
  onStartRecord: (prefill: PeSessionPrefill) => void
  onOpenSession: (sessionId: string) => void
  onOpenStudents: (classId: string) => void
  onOpenTests: (classId: string) => void
  onOpenPlan: (context: PlanNavContext) => void
  onNavigate: (key: NavKey) => void
}

function greetingFor(now: Date): string {
  const hour = now.getHours()
  if (hour < 12) {
    return '上午好'
  }
  if (hour < 18) {
    return '下午好'
  }
  return '晚上好'
}

function formatDateLabel(now: Date): { date: string; weekday: string } {
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return {
    date: `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`,
    weekday: weekdays[now.getDay()]
  }
}

function KpiIcon({ kind }: { kind: 'class' | 'week' | 'test' | 'team' }): React.JSX.Element {
  const common = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7 }
  if (kind === 'class') {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3" />
        <path d="M4 19c.8-3 2.8-5 5-5s4.2 2 5 5" />
      </svg>
    )
  }
  if (kind === 'week') {
    return (
      <svg {...common}>
        <path d="M4 19V9M10 19V6M16 19v-8M20 19H3" />
      </svg>
    )
  }
  if (kind === 'test') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l2.4 1.5" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path d="M7 8h10M6 12h12M8 16h8" />
    </svg>
  )
}

function QuickIcon({ kind }: { kind: 'students' | 'schedule' | 'lessons' | 'tests' | 'training' | 'stats' }): React.JSX.Element {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 }
  if (kind === 'students') {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3" />
        <path d="M4 19c.8-3 2.8-5 5-5s4.2 2 5 5" />
      </svg>
    )
  }
  if (kind === 'schedule') {
    return (
      <svg {...common}>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M4 10h16" />
      </svg>
    )
  }
  if (kind === 'lessons') {
    return (
      <svg {...common}>
        <path d="M5 5h11v15H7a2 2 0 0 1-2-2V5z" />
      </svg>
    )
  }
  if (kind === 'tests') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l2.4 1.5" />
      </svg>
    )
  }
  if (kind === 'training') {
    return (
      <svg {...common}>
        <path d="M7 8h10M6 12h12M8 16h8" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path d="M4 19V10M10 19V5M16 19v-7M20 19H3" />
    </svg>
  )
}

export default function DashboardPage({
  onStartRecord,
  onOpenSession,
  onOpenStudents,
  onOpenTests,
  onOpenPlan,
  onNavigate
}: DashboardPageProps): React.JSX.Element {
  const now = useNow()
  const { items, loading, error, saveItems } = useSchedule()
  const scheduleService = useScheduleService()
  const { classes } = useClasses()
  const { sessions } = usePeSessions()
  const { sessions: testSessions } = usePeTests()
  const { teams } = useTraining()
  const { plans } = useTeachingPlans()
  const { preferences } = useUserPreferences()
  const listedClasses = listedClassRecords(classes)
  const listedTeams = teams.filter(isActiveTrainingTeam)
  const pendingTestRecords = useMemo(
    () => countIncompletePeTestSessions(testSessions),
    [testSessions]
  )
  const summary = scheduleService.getWeeklySummary()
  const today = scheduleService.getTodayOverview(now)
  const todayDate = formatLocalDate(now)
  const dateLabel = formatDateLabel(now)
  const weeklyTask = useMemo(
    () =>
      buildWeeklyTeachingTask({
        plans,
        classes: listedClasses,
        todayLessons: today.lessons,
        onDate: todayDate
      }),
    [plans, listedClasses, today.lessons, todayDate]
  )
  const weeklyExecution = useMemo(() => {
    if (weeklyTask.status !== 'ready' || !weeklyTask.planId || !weeklyTask.weekId) {
      return null
    }
    return deriveWeeklyPlanExecution({
      teachingPlanId: weeklyTask.planId,
      teachingPlanWeekId: weeklyTask.weekId,
      sessions
    })
  }, [weeklyTask, sessions])
  const todayRecordStats = useMemo(() => {
    let unrecorded = 0
    let inProgress = 0
    let completed = 0
    for (const lesson of today.lessons) {
      const match = resolveWorkbenchLessonRecord(sessions, lesson, todayDate)
      if (match.status === 'completed') {
        completed += 1
      } else if (match.status === 'in_progress') {
        inProgress += 1
      } else {
        unrecorded += 1
      }
    }
    return { unrecorded, inProgress, completed }
  }, [sessions, today.lessons, todayDate])
  const [bindLesson, setBindLesson] = useState<ScheduleItem | null>(null)
  const [bindValue, setBindValue] = useState('')
  const [bindError, setBindError] = useState<string | null>(null)
  const [bindWorking, setBindWorking] = useState(false)

  const recentSessions = useMemo(
    () =>
      [...sessions]
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
    [sessions]
  )

  function prefillFrom(lesson: ScheduleItem, classId?: string): PeSessionPrefill {
    return {
      date: formatLocalDate(now),
      period: lesson.period,
      scheduleLessonId: lesson.id,
      lessonType: mapScheduleCourseType(lesson.courseType),
      teamSnapshot: lesson.team,
      startTimeSnapshot: lesson.startTime,
      endTimeSnapshot: lesson.endTime,
      ...(classId ? { classId } : {})
    }
  }

  function openBind(lesson: ScheduleItem): void {
    setBindLesson(lesson)
    setBindValue(workbenchListedClass(lesson, classes)?.id ?? '')
    setBindError(null)
  }

  async function saveBind(): Promise<void> {
    if (!bindLesson) {
      return
    }
    setBindWorking(true)
    setBindError(null)
    try {
      const next = items.map((item) => {
        if (item.id !== bindLesson.id) {
          return item
        }
        const patched: ScheduleItem = { ...item }
        if (bindValue) {
          patched.classId = bindValue
        } else {
          delete patched.classId
        }
        return patched
      })
      await saveItems(next)
      setBindLesson(null)
    } catch (saveError) {
      setBindError(saveError instanceof Error ? saveError.message : '保存关联失败')
    } finally {
      setBindWorking(false)
    }
  }

  if (loading) {
    return (
      <PageLayout className="page--dashboard">
        <div className="page-heading">
          <h2>工作台</h2>
          <p>正在读取本地课表…</p>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout className="page--dashboard">
      <div className="dash-stage" aria-hidden="true">
        <TechGrid />
        <GlowOrb className="dash-stage-orb" />
      </div>
      {error ? <p className="page-error">{error}</p> : null}

      <div
        className="dash-hero"
        style={{ ['--hero-photo' as string]: `url(${heroSportsTech})` }}
      >
        <div className="dash-hero-media" aria-hidden="true">
          <GlowOrb className="dash-hero-orb" />
          <TechGrid className="dash-hero-grid" />
          <SpeedLines />
          <AccentLine className="dash-hero-streak" />
        </div>
        <div className="dash-hero-content">
          <div className="dash-hero-copy">
            <p className="dash-hero-kicker">广东省初中 · 运动数据台</p>
            <h2>
              {greetingFor(now)}，<span>{preferences.teacherDisplayName}</span>！
            </h2>
            <p>今日课程、班级与开始课堂入口都在这里。工作台只处理行政班体育课。</p>
          </div>
          <div className="dash-hero-meta">
            <p className="dash-hero-weekday">{dateLabel.weekday}</p>
            <p className="dash-hero-date">{dateLabel.date}</p>
          </div>
        </div>
      </div>

      <div className="kpi-grid">
        <article className="kpi-card kpi-card--blue">
          <AccentLine />
          <span className="kpi-icon">
            <KpiIcon kind="class" />
          </span>
          <p className="kpi-label">当前班级</p>
          <p className="kpi-value">
            {listedClasses.length}
            <span>个</span>
          </p>
          <p className="kpi-hint">当前可管理的行政班</p>
        </article>
        <article className="kpi-card kpi-card--green">
          <AccentLine />
          <span className="kpi-icon">
            <KpiIcon kind="week" />
          </span>
          <p className="kpi-label">本周课时</p>
          <p className="kpi-value">
            {summary.total}
            <span>节</span>
          </p>
          <p className="kpi-hint">
            常规 {summary.regularCount} · 大体育课 {summary.bigCount}
          </p>
        </article>
        <button type="button" className="kpi-card kpi-card--orange" onClick={() => onNavigate('tests')}>
          <AccentLine />
          <span className="kpi-icon">
            <KpiIcon kind="test" />
          </span>
          <p className="kpi-label">待完成测试</p>
          <p className="kpi-value">
            {pendingTestRecords}
            <span>条</span>
          </p>
          <p className="kpi-hint">未录入成绩的测试记录</p>
        </button>
        <article className="kpi-card kpi-card--purple">
          <AccentLine />
          <span className="kpi-icon">
            <KpiIcon kind="team" />
          </span>
          <p className="kpi-label">训练队</p>
          <p className="kpi-value">
            {listedTeams.length}
            <span>支</span>
          </p>
          <p className="kpi-hint">当前可管理的训练队</p>
        </article>
      </div>

      <div className="panel-card panel-card--glass weekly-teaching-task">
        <AccentLine />
        <div className="panel-card-head">
          <h3>本周教学任务</h3>
          <button type="button" className="btn btn-ghost btn-small" onClick={() => onNavigate('plans')}>
            教学计划 →
          </button>
        </div>
        {weeklyTask.status === 'ready' ? (
          <div className="weekly-teaching-task-body">
            <p className="weekly-teaching-task-week">
              第 {weeklyTask.weekNumber} 周
              {weeklyTask.planName ? ` · ${weeklyTask.planName}` : ''}
            </p>
            <p className="weekly-teaching-task-title">{weeklyTask.title || '（未填写主题）'}</p>
            <p className="weekly-teaching-task-line">
              <span>主要内容</span>
              {weeklyTask.contents || '—'}
            </p>
            <p className="weekly-teaching-task-line">
              <span>教学目标</span>
              {weeklyTask.objectives || '—'}
            </p>
            <p className="weekly-teaching-task-meta">
              今日对应课程 {weeklyTask.todayLessonCount} 节
              {weeklyExecution ? ` · 已完成 ${weeklyExecution.completedCount} 节` : ''}
            </p>
          </div>
        ) : null}
        {weeklyTask.status === 'none' ? (
          <p className="weekly-teaching-task-empty">本周暂无教学计划。不影响开始课堂。</p>
        ) : null}
        {weeklyTask.status === 'ambiguous' ? (
          <div className="weekly-teaching-task-body">
            <p className="weekly-teaching-task-empty">存在多份匹配教学计划，请进入教学计划页确认。</p>
            <button type="button" className="btn btn-small" onClick={() => onNavigate('plans')}>
              打开教学计划
            </button>
          </div>
        ) : null}
        {weeklyTask.status === 'no-week' ? (
          <p className="weekly-teaching-task-empty">
            {weeklyTask.planName ? `「${weeklyTask.planName}」` : '教学计划'}当前日期不在教学周范围内。不影响开始课堂。
          </p>
        ) : null}
      </div>

      <div className="dash-primary">
        <div
          className={
            today.lessons.length === 0
              ? 'panel-card panel-card--glass today-courses today-courses--empty'
              : 'panel-card panel-card--glass today-courses'
          }
        >
          <AccentLine />
          <div className="panel-card-head">
            <h3>
              {today.status === 'finished' ? '今日课程 · 已全部结束' : '今日课程'}
            </h3>
            <button type="button" className="btn btn-ghost btn-small" onClick={() => onNavigate('schedule')}>
              查看完整课表 →
            </button>
          </div>
          {today.lessons.length === 0 ? (
            <div className="today-courses-empty">
              <span className="today-courses-empty-icon" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <rect x="4" y="5" width="16" height="15" rx="2.5" />
                  <path d="M4 10h16M8 3.5v4M16 3.5v4" />
                  <path d="M9 14.5h2M13 14.5h2M9 17.5h6" />
                </svg>
              </span>
              <div className="today-courses-empty-copy">
                <p className="today-courses-empty-title">今天暂无课程安排</p>
                <p className="today-courses-empty-hint">今天可以安排测试、训练或整理课堂记录</p>
              </div>
            </div>
          ) : (
            <ol className="today-lanes">
              {today.lessons.map((lesson) => {
                const boundClass = workbenchListedClass(lesson, classes)
                const classReady = Boolean(boundClass)
                const lane = workbenchClockStatus(lesson, now, today.currentLesson?.id, today.nextLesson?.id)
                const record = resolveWorkbenchLessonRecord(sessions, lesson, todayDate)
                const existingSession = record.session
                const emphasize = (lane === 'live' || lane === 'next') && record.status === 'unrecorded'
                return (
                  <li key={lesson.id} className={`today-lane is-${lane}`}>
                    <div className="today-lane-time">
                      <strong>第{lesson.period}节</strong>
                      <span>{formatTimeRange(lesson.startTime, lesson.endTime)}</span>
                    </div>
                    <div className="today-lane-body">
                      <p className="today-lane-title">
                        {boundClass ? `${boundClass.grade} ${boundClass.className}` : lesson.team}
                      </p>
                      <p className="today-lane-sub">
                        {COURSE_TYPE_LABELS[lesson.courseType]}
                        {boundClass ? ` · ${lesson.team}` : lesson.classId ? ' · 已删除班级' : ' · 未绑定行政班'}
                      </p>
                    </div>
                    <span
                      className={`badge badge-${lane}${
                        record.status === 'unrecorded'
                          ? ' badge-unrecorded'
                          : record.status === 'completed'
                            ? ' badge-completed'
                            : ' badge-recorded'
                      }`}
                    >
                      {WORKBENCH_CLOCK_LABELS[lane]} · {WORKBENCH_RECORD_STATUS_LABELS[record.status]}
                    </span>
                    <div className="today-lane-actions">
                      {existingSession ? (
                        <button
                          type="button"
                          className={emphasize ? 'btn btn-small btn-primary' : 'btn btn-small'}
                          onClick={() => onOpenSession(existingSession.id)}
                        >
                          {workbenchActionLabel(record.status)}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={emphasize ? 'btn btn-small btn-primary' : 'btn btn-small'}
                          onClick={() => onStartRecord(prefillFrom(lesson, boundClass?.id))}
                        >
                          开始课堂
                        </button>
                      )}
                      <button type="button" className="btn btn-small" onClick={() => openBind(lesson)}>
                        绑定
                      </button>
                      {classReady ? (
                        <>
                          <button type="button" className="btn btn-small" onClick={() => onOpenStudents(boundClass?.id ?? '')}>
                            学生
                          </button>
                          <button type="button" className="btn btn-small" onClick={() => onOpenTests(boundClass?.id ?? '')}>
                            测试
                          </button>
                          <button
                            type="button"
                            className="btn btn-small"
                            onClick={() =>
                              onOpenPlan({
                                grade: boundClass?.grade ?? '初一',
                                className: boundClass?.className ?? '',
                                academicYear: boundClass?.academicYear ?? '',
                                semester: boundClass?.semester ?? '第一学期'
                              })
                            }
                          >
                            计划
                          </button>
                        </>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </div>

      <div className="dash-secondary">
        <div className="panel-card panel-card--glass">
          <AccentLine />
          <div className="panel-card-head">
            <h3>快捷操作</h3>
          </div>
          <div className="quick-grid">
            <button type="button" className="quick-btn quick-btn--blue" onClick={() => onNavigate('students')}>
              <span className="quick-icon">
                <QuickIcon kind="students" />
              </span>
              <span className="quick-copy">
                <strong>导入学生名单</strong>
                <span>Excel 同步班级名单</span>
              </span>
              <span className="quick-arrow" aria-hidden="true">
                →
              </span>
            </button>
            <button type="button" className="quick-btn quick-btn--cyan" onClick={() => onNavigate('schedule')}>
              <span className="quick-icon">
                <QuickIcon kind="schedule" />
              </span>
              <span className="quick-copy">
                <strong>导入/更新课表</strong>
                <span>二次同步当前课表</span>
              </span>
              <span className="quick-arrow" aria-hidden="true">
                →
              </span>
            </button>
            <button type="button" className="quick-btn quick-btn--green" onClick={() => onNavigate('lessons')}>
              <span className="quick-icon">
                <QuickIcon kind="lessons" />
              </span>
              <span className="quick-copy">
                <strong>记录课堂</strong>
                <span>进入课堂记录</span>
              </span>
              <span className="quick-arrow" aria-hidden="true">
                →
              </span>
            </button>
            <button type="button" className="quick-btn quick-btn--orange" onClick={() => onNavigate('tests')}>
              <span className="quick-icon">
                <QuickIcon kind="tests" />
              </span>
              <span className="quick-copy">
                <strong>体育测试</strong>
                <span>登记测试成绩</span>
              </span>
              <span className="quick-arrow" aria-hidden="true">
                →
              </span>
            </button>
            <button type="button" className="quick-btn quick-btn--purple" onClick={() => onNavigate('training')}>
              <span className="quick-icon">
                <QuickIcon kind="training" />
              </span>
              <span className="quick-copy">
                <strong>训练队管理</strong>
                <span>队员与训练安排</span>
              </span>
              <span className="quick-arrow" aria-hidden="true">
                →
              </span>
            </button>
            <button type="button" className="quick-btn quick-btn--blue" onClick={() => onNavigate('stats')}>
              <span className="quick-icon">
                <QuickIcon kind="stats" />
              </span>
              <span className="quick-copy">
                <strong>数据统计</strong>
                <span>查看已有统计</span>
              </span>
              <span className="quick-arrow" aria-hidden="true">
                →
              </span>
            </button>
          </div>
        </div>

        <div className="panel-card panel-card--glass">
          <AccentLine />
          <div className="panel-card-head">
            <h3>近期课堂记录</h3>
            <button type="button" className="btn btn-ghost btn-small" onClick={() => onNavigate('lessons')}>
              查看全部
            </button>
          </div>
          {recentSessions.length === 0 ? (
            <EmptyState
              title="还没有近期课堂记录"
              description="开始一节课后，最近记录会显示在这里。"
              actionLabel="查看课堂记录"
              onAction={() => onNavigate('lessons')}
            />
          ) : (
            <ul className="recent-list">
              {recentSessions.map((session) => {
                const recorded = session.records.length
                const absent = session.records.filter((item) => item.attendanceStatus === 'absent').length
                return (
                  <li key={session.id}>
                    <button type="button" className="recent-item" onClick={() => onOpenSession(session.id)}>
                      <p className="recent-title">
                        {session.gradeSnapshot} {session.classNameSnapshot}
                      </p>
                      <p className="recent-sub">
                        {session.date} · 第{session.period}节
                        {session.topic ? ` · ${session.topic}` : ''}
                      </p>
                      {recorded > 0 ? (
                        <p className="recent-stat">
                          已记 {recorded} 人
                          {absent > 0 ? ` · ${ATTENDANCE_LABELS.absent} ${absent}` : ''}
                        </p>
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="panel-card panel-card--glass">
          <AccentLine />
          <div className="panel-card-head">
            <h3>数据概览</h3>
          </div>
          <ul className="overview-list">
            <li>
              <span>今日未记录</span>
              <strong>{todayRecordStats.unrecorded}</strong>
            </li>
            <li>
              <span>今日记录中</span>
              <strong>{todayRecordStats.inProgress}</strong>
            </li>
            <li>
              <span>今日已完成</span>
              <strong>{todayRecordStats.completed}</strong>
            </li>
            <li>
              <span>课堂记录</span>
              <strong>{sessions.length}</strong>
            </li>
            <li>
              <span>已建立测试</span>
              <strong>{testSessions.length}</strong>
            </li>
          </ul>
          <p className="kpi-hint">今日记录状态按课表格子实时计算，不是完成率估算。</p>
        </div>
      </div>

      {bindLesson ? (
        <div className="dialog-backdrop" onMouseDown={() => setBindLesson(null)}>
          <div
            className="dialog dialog--class"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dash-bind-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h3 id="dash-bind-title">绑定行政班</h3>
            <p className="dialog-slot">
              {bindLesson.team} · 第{bindLesson.period}节。工作台只关联行政班，训练队请到「训练队」模块管理。
            </p>
            <label className="dialog-span">
              关联行政班
              <select value={bindValue} onChange={(event) => setBindValue(event.target.value)}>
                <option value="">不绑定</option>
                {listedClasses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.grade} {item.className}
                  </option>
                ))}
              </select>
            </label>
            {bindError ? <p className="dialog-error">{bindError}</p> : null}
            <div className="dialog-actions">
              <span />
              <div className="dialog-actions-right">
                <button type="button" className="btn" onClick={() => setBindLesson(null)} disabled={bindWorking}>
                  取消
                </button>
                <button type="button" className="btn btn-primary" onClick={() => void saveBind()} disabled={bindWorking}>
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </PageLayout>
  )
}
