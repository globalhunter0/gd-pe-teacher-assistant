import { useEffect, useMemo, useState } from 'react'
import StatCard from './StatCard'
import TechEmptyState from './workspace/TechEmptyState'
import StatsDateRangeControls from './StatsDateRangeControls'
import StudentGrowthPanel from './StudentGrowthPanel'
import { useClasses } from '../context/ClassContext'
import { usePeSessions } from '../context/PeSessionContext'
import { usePeTests } from '../context/PeTestContext'
import { useStudents } from '../context/StudentContext'
import { useTestItems } from '../context/TestItemContext'
import { PERFORMANCE_TAG_LABELS, type PerformanceTag } from '@shared/peSession'
import {
  collectStudentOptions,
  filterStudentOptions,
  resolveDateRange,
  summarizeStudentLessons,
  type StatsRangeKind
} from '@shared/statistics'

const TAG_ORDER: PerformanceTag[] = ['engaged', 'excellent', 'improved', 'discipline', 'unequipped']

interface StatsStudentPanelProps {
  initialStudentId?: string | null
}

export default function StatsStudentPanel({ initialStudentId = null }: StatsStudentPanelProps): React.JSX.Element {
  const { classes } = useClasses()
  const { students } = useStudents()
  const { sessions: lessons } = usePeSessions()
  const { sessions: tests } = usePeTests()
  const { items } = useTestItems()
  const [query, setQuery] = useState('')
  const [studentId, setStudentId] = useState(initialStudentId ?? '')
  const [kind, setKind] = useState<StatsRangeKind>('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  useEffect(() => {
    if (initialStudentId) {
      setStudentId(initialStudentId)
    }
  }, [initialStudentId])

  const options = useMemo(
    () => collectStudentOptions(students, classes, lessons, tests),
    [students, classes, lessons, tests]
  )
  const visible = useMemo(() => filterStudentOptions(options, query), [options, query])
  const selected = options.find((item) => item.studentId === studentId) ?? null
  const range = useMemo(() => resolveDateRange(kind, customStart, customEnd), [kind, customStart, customEnd])
  const lessonSummary = useMemo(
    () => (studentId === '' ? null : summarizeStudentLessons(lessons, studentId, range)),
    [lessons, studentId, range]
  )

  return (
    <div className="stats-panel">
      <div className="stats-filters">
        <label>
          搜索姓名/学号
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="可输入姓名或学号" />
        </label>
        <label className="stats-filter-wide">
          学生
          <select value={studentId} onChange={(event) => setStudentId(event.target.value)}>
            <option value="">请选择学生</option>
            {visible.map((item) => (
              <option key={item.studentId} value={item.studentId}>
                {item.name}
                {item.studentNo ? ` · ${item.studentNo}` : ''}
                {item.isHistorical ? '（历史学生）' : ''}
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

      {!selected ? (
        <TechEmptyState kind="stats" title="选择学生查看成长档案" description="课堂与测试均按 studentId 查找。没有演示数据。" />
      ) : (
        <>
          {lessonSummary ? (
            <>
              <h3 className="stats-subtitle">课堂摘要</h3>
              <div className="stat-grid">
                <StatCard label="历史课堂记录次数" value={String(lessonSummary.lessonCount)} hint="按该生课堂名单记录" />
                <StatCard label="正常人次" value={String(lessonSummary.attendance.normal)} hint="人次" />
                <StatCard label="缺勤人次" value={String(lessonSummary.attendance.absent)} hint="人次" />
                <StatCard label="请假人次" value={String(lessonSummary.attendance.leave)} hint="人次" />
                <StatCard label="迟到人次" value={String(lessonSummary.attendance.late)} hint="人次" />
                <StatCard label="见习人次" value={String(lessonSummary.attendance.observer)} hint="人次" />
              </div>
              <div className="stat-grid">
                {TAG_ORDER.map((tag) => (
                  <StatCard key={tag} label={`${PERFORMANCE_TAG_LABELS[tag]}次数`} value={String(lessonSummary.tags[tag])} hint="人次" />
                ))}
              </div>
            </>
          ) : null}

          <h3 className="stats-subtitle">体育成长</h3>
          <StudentGrowthPanel
            studentId={studentId}
            sessions={tests}
            students={students}
            classes={classes}
            testItems={items}
          />
        </>
      )}
    </div>
  )
}
