import { useMemo, useState } from 'react'
import StatCard from './StatCard'
import TechEmptyState from './workspace/TechEmptyState'
import StatsDateRangeControls from './StatsDateRangeControls'
import { useClasses } from '../context/ClassContext'
import { usePeSessions } from '../context/PeSessionContext'
import { usePeTests } from '../context/PeTestContext'
import { useStudents } from '../context/StudentContext'
import { useTestItems } from '../context/TestItemContext'
import { ATTENDANCE_LABELS, PERFORMANCE_TAG_LABELS, type PerformanceTag } from '@shared/peSession'
import { TEST_RECORD_STATUS_LABELS } from '@shared/peTest'
import {
  buildStudentAttentionSignals,
  classDisplayName,
  filterLessonsByClass,
  inDateRange,
  indexPeTests,
  resolveDateRange,
  summarizeClassLessons,
  summarizeTestSession,
  type StatsRangeKind
} from '@shared/statistics'

interface StatsClassPanelProps {
  onOpenTest: (sessionId: string) => void
}

const TAG_ORDER: PerformanceTag[] = ['engaged', 'excellent', 'improved', 'discipline', 'unequipped']

export default function StatsClassPanel({ onOpenTest }: StatsClassPanelProps): React.JSX.Element {
  const { classes } = useClasses()
  const { sessions } = usePeSessions()
  const { sessions: tests } = usePeTests()
  const { items } = useTestItems()
  const { students } = useStudents()
  const [classId, setClassId] = useState(classes[0]?.id ?? '')
  const [kind, setKind] = useState<StatsRangeKind>('days30')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const range = useMemo(() => resolveDateRange(kind, customStart, customEnd), [kind, customStart, customEnd])
  const lessonSessions = useMemo(
    () => (classId === '' ? [] : filterLessonsByClass(sessions, classId, range)),
    [sessions, classId, range]
  )
  const summary = useMemo(() => summarizeClassLessons(lessonSessions), [lessonSessions])
  const recentTests = useMemo(
    () =>
      tests
        .filter((item) => item.classId === classId && inDateRange(item.date, range))
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
        .slice(0, 8),
    [tests, classId, range]
  )
  const attention = useMemo(() => {
    const index = indexPeTests(tests)
    const ids = new Set<string>(
      tests.filter((item) => item.classId === classId).flatMap((item) => item.records.map((row) => row.studentId))
    )
    for (const person of students) {
      if (person.classId === classId && person.status === 'active') {
        ids.add(person.id)
      }
    }
    return [...ids].flatMap((id) => buildStudentAttentionSignals(id, tests, items, { index })).slice(0, 20)
  }, [tests, classId, items, students])

  if (classes.length === 0) {
    return <TechEmptyState kind="stats" title="还没有班级" description="请先在班级与学生中创建班级后再查看统计。" />
  }

  return (
    <div className="stats-panel">
      <div className="stats-filters">
        <label>
          班级
          <select value={classId} onChange={(event) => setClassId(event.target.value)}>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.grade} {item.className}
                {item.status === 'deleted' ? '（已删除）' : ''}
              </option>
            ))}
          </select>
        </label>
        <StatsDateRangeControls
          kind={kind}
          customStart={customStart}
          customEnd={customEnd}
          onKindChange={setKind}
          onCustomStartChange={setCustomStart}
          onCustomEndChange={setCustomEnd}
        />
      </div>

      <p className="stats-note">按该班历史课堂记录统计。学生后来转班或转出，不会改掉当时已计入的人次。</p>

      <div className="stat-grid">
        <StatCard label="体育课次数" value={String(summary.lessonCount)} hint="课次" />
        <StatCard label="正常人次" value={String(summary.attendance.normal)} hint="人次，不是人数" />
        <StatCard label="缺勤人次" value={String(summary.attendance.absent)} hint="人次" />
        <StatCard label="请假人次" value={String(summary.attendance.leave)} hint="人次" />
        <StatCard label="迟到人次" value={String(summary.attendance.late)} hint="人次" />
        <StatCard label="见习人次" value={String(summary.attendance.observer)} hint="人次" />
      </div>

      <h3 className="stats-subtitle">课堂表现标签次数</h3>
      <div className="stat-grid">
        {TAG_ORDER.map((tag) => (
          <StatCard key={tag} label={`${PERFORMANCE_TAG_LABELS[tag]}次数`} value={String(summary.tags[tag])} hint="人次" />
        ))}
      </div>

      <h3 className="stats-subtitle">需要关注</h3>
      {attention.length === 0 ? (
        <p className="stats-muted">当前没有可解释的关注信号。</p>
      ) : (
        <ul className="growth-signals">
          {attention.map((item) => (
            <li key={`${item.studentId}-${item.title}-${item.detail}`}>
              {item.name} · {item.title} · {item.detail}
            </li>
          ))}
        </ul>
      )}

      <h3 className="stats-subtitle">范围内最近体育测试</h3>
      {recentTests.length === 0 ? (
        <TechEmptyState kind="tests" title="该范围没有体育测试" description="数字来自已保存测试记录，没有演示数据。" />
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>项目</th>
                <th>有效人次</th>
                <th>未录入人次</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {recentTests.map((item) => {
                const stats = summarizeTestSession(
                  item,
                  items.find((entry) => entry.id === item.testItemId)
                )
                return (
                  <tr key={item.id}>
                    <td>{item.date}</td>
                    <td>
                      {item.testItemNameSnapshot}
                      <div className="stats-muted">{classDisplayName(classes, item.classId, item)}</div>
                    </td>
                    <td>{stats.statuses.valid}</td>
                    <td>{stats.statuses.pending}</td>
                    <td>
                      <button type="button" className="btn btn-small" onClick={() => onOpenTest(item.id)}>
                        打开测试
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="stats-muted">{ATTENDANCE_LABELS.normal}等考勤按课堂名单记录人次累计。{TEST_RECORD_STATUS_LABELS.valid}列为该次测试有效成绩人次。</p>
    </div>
  )
}
