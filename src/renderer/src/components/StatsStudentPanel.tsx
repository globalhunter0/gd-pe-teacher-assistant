import { Fragment, useMemo, useState } from 'react'
import StatCard from './StatCard'
import TechEmptyState from './workspace/TechEmptyState'
import StatsDateRangeControls from './StatsDateRangeControls'
import { useClasses } from '../context/ClassContext'
import { usePeSessions } from '../context/PeSessionContext'
import { usePeTests } from '../context/PeTestContext'
import { useStudents } from '../context/StudentContext'
import { useTestItems } from '../context/TestItemContext'
import { PERFORMANCE_TAG_LABELS, type PerformanceTag } from '@shared/peSession'
import { TEST_RECORD_STATUS_LABELS, type TestRecordStatus } from '@shared/peTest'
import {
  collectStudentOptions,
  filterStudentOptions,
  resolveDateRange,
  summarizeStudentLessons,
  summarizeStudentTests,
  type StatsRangeKind
} from '@shared/statistics'

const TAG_ORDER: PerformanceTag[] = ['engaged', 'excellent', 'improved', 'discipline', 'unequipped']

export default function StatsStudentPanel(): React.JSX.Element {
  const { classes } = useClasses()
  const { students } = useStudents()
  const { sessions: lessons } = usePeSessions()
  const { sessions: tests } = usePeTests()
  const { items } = useTestItems()
  const [query, setQuery] = useState('')
  const [studentId, setStudentId] = useState('')
  const [kind, setKind] = useState<StatsRangeKind>('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

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
  const testSummary = useMemo(
    () => (studentId === '' ? [] : summarizeStudentTests(tests, studentId, items, range)),
    [tests, studentId, items, range]
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
          <select
            value={studentId}
            onChange={(event) => {
              setStudentId(event.target.value)
              setExpandedItem(null)
            }}
          >
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

      {!selected || !lessonSummary ? (
        <TechEmptyState kind="stats" title="选择学生查看档案" description="课堂历史按 studentId 查找，不按当前班级重建。没有演示数据。" />
      ) : (
        <>
          <div className="stats-profile">
            <p>
              <strong>{selected.name}</strong>
              {selected.isHistorical ? <span className="tag">历史学生</span> : null}
            </p>
            <p>学号：{selected.studentNo || '—'}</p>
            <p>当前班级：{selected.classLabel}</p>
            <p>当前状态：{selected.statusLabel}</p>
          </div>

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

          <h3 className="stats-subtitle">测试项目汇总</h3>
          {testSummary.length === 0 ? (
            <p className="empty-text">该范围没有测试记录。</p>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>项目</th>
                    <th>测试次数</th>
                    <th>首次有效成绩</th>
                    <th>最近有效成绩</th>
                    <th>最好成绩</th>
                    <th>较首次</th>
                  </tr>
                </thead>
                <tbody>
                  {testSummary.map((item) => (
                    <Fragment key={item.testItemId}>
                      <tr>
                        <td>
                          <button type="button" className="link-button" onClick={() => setExpandedItem(item.testItemId === expandedItem ? null : item.testItemId)}>
                            {item.name}
                          </button>
                        </td>
                        <td>{item.testCount}</td>
                        <td>{item.firstText}</td>
                        <td>{item.recentText}</td>
                        <td>{item.bestText}</td>
                        <td>
                          <span className={item.vsFirstKind ? `delta delta--${item.vsFirstKind}` : undefined}>{item.vsFirstText}</span>
                        </td>
                      </tr>
                      {expandedItem === item.testItemId
                        ? item.history.map((row) => (
                            <tr key={`${row.sessionId}-hist`} className="stats-history-row">
                              <td colSpan={2}>
                                {row.date} {row.title}
                              </td>
                              <td colSpan={2}>{TEST_RECORD_STATUS_LABELS[row.status as TestRecordStatus]}</td>
                              <td colSpan={2}>{row.text}</td>
                            </tr>
                          ))
                        : null}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
