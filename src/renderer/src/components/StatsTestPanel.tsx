import { useMemo, useState } from 'react'
import StatsDateRangeControls from './StatsDateRangeControls'
import { useClasses } from '../context/ClassContext'
import { usePeTests } from '../context/PeTestContext'
import { useTestItems } from '../context/TestItemContext'
import { TEST_RECORD_STATUS_LABELS, TEST_RECORD_STATUSES, type PETestRecord, type TestRecordStatus } from '@shared/peTest'
import { STUDENT_GENDER_LABELS } from '@shared/student'
import {
  classDisplayName,
  filterTests,
  formatTestScoreWithUnit,
  resolveDateRange,
  summarizeTestSession,
  type StatsRangeKind
} from '@shared/statistics'

interface StatsTestPanelProps {
  onOpenTest: (sessionId: string) => void
}

export default function StatsTestPanel({ onOpenTest }: StatsTestPanelProps): React.JSX.Element {
  const { classes } = useClasses()
  const { items } = useTestItems()
  const { sessions } = usePeTests()
  const [classId, setClassId] = useState(classes[0]?.id ?? '')
  const [testItemId, setTestItemId] = useState(items[0]?.id ?? '')
  const [kind, setKind] = useState<StatsRangeKind>('days30')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | TestRecordStatus>('all')
  const [sortByScore, setSortByScore] = useState(false)

  const range = useMemo(() => resolveDateRange(kind, customStart, customEnd), [kind, customStart, customEnd])
  const listed = useMemo(
    () => (classId === '' || testItemId === '' ? [] : filterTests(sessions, classId, testItemId, range)),
    [sessions, classId, testItemId, range]
  )
  const testItem = items.find((item) => item.id === testItemId)
  const detail = listed.find((item) => item.id === detailId) ?? null
  const detailSummary = detail ? summarizeTestSession(detail, testItem) : null
  const mergedCounts = useMemo(() => {
    const total = { pending: 0, valid: 0, absent: 0, exempt: 0, invalid: 0 }
    for (const session of listed) {
      const stats = summarizeTestSession(session, testItem)
      total.pending += stats.statuses.pending
      total.valid += stats.statuses.valid
      total.absent += stats.statuses.absent
      total.exempt += stats.statuses.exempt
      total.invalid += stats.statuses.invalid
    }
    return total
  }, [listed, testItem])

  const detailRows = useMemo(() => {
    if (!detail) {
      return [] as PETestRecord[]
    }

    let rows = [...detail.records]
    if (statusFilter !== 'all') {
      rows = rows.filter((item) => item.status === statusFilter)
    }

    if (sortByScore) {
      const direction = detail.directionSnapshot
      rows.sort((a, b) => {
        if (a.rawValue === null && b.rawValue === null) {
          return 0
        }
        if (a.rawValue === null) {
          return 1
        }
        if (b.rawValue === null) {
          return -1
        }
        return direction === 'lowerBetter' ? a.rawValue - b.rawValue : b.rawValue - a.rawValue
      })
    } else {
      rows.sort(
        (a, b) =>
          a.studentNoSnapshot.localeCompare(b.studentNoSnapshot, 'zh-CN', { numeric: true }) ||
          a.nameSnapshot.localeCompare(b.nameSnapshot, 'zh-CN')
      )
    }

    return rows
  }, [detail, statusFilter, sortByScore])

  if (classes.length === 0) {
    return <p className="empty-text">请先在班级管理中创建班级。</p>
  }

  if (items.length === 0) {
    return <p className="empty-text">请先在体育测试中准备测试项目。</p>
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
        <label>
          测试项目
          <select value={testItemId} onChange={(event) => setTestItemId(event.target.value)}>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.isActive ? '' : '（已停用）'}
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

      <p className="stats-note">
        下列各次测试的有效 / 未录入 / 缺测 / 免测 / 无效均为该次名单上的记录人次。范围内合计也是记录人次，不是学生人数。
      </p>
      <p className="stats-note">
        范围内合计记录人次：有效 {mergedCounts.valid}，未录入 {mergedCounts.pending}，缺测 {mergedCounts.absent}，免测{' '}
        {mergedCounts.exempt}，无效 {mergedCounts.invalid}。
      </p>

      {listed.length === 0 ? (
        <p className="empty-text">该范围没有匹配的测试。</p>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>测试</th>
                <th>有效人次</th>
                <th>未录入人次</th>
                <th>缺测人次</th>
                <th>免测人次</th>
                <th>无效人次</th>
                <th>平均成绩</th>
                <th>最好成绩</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {listed.map((item) => {
                const stats = summarizeTestSession(
                  item,
                  items.find((entry) => entry.id === item.testItemId)
                )
                return (
                  <tr key={item.id}>
                    <td>{item.date}</td>
                    <td>
                      {item.title}
                      <div className="stats-muted">{item.testItemNameSnapshot}</div>
                    </td>
                    <td>{stats.statuses.valid}</td>
                    <td>{stats.statuses.pending}</td>
                    <td>{stats.statuses.absent}</td>
                    <td>{stats.statuses.exempt}</td>
                    <td>{stats.statuses.invalid}</td>
                    <td>{stats.average}</td>
                    <td>{stats.best}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="btn btn-small" onClick={() => setDetailId(item.id)}>
                          查看明细
                        </button>
                        <button type="button" className="btn btn-small" onClick={() => onOpenTest(item.id)}>
                          打开编辑
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {detail && detailSummary ? (
        <div className="stats-detail">
          <h3 className="stats-subtitle">
            {detail.date} {detail.title} · {classDisplayName(classes, detail.classId, detail)}
          </h3>
          <div className="stats-filters">
            <label>
              状态筛选
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | TestRecordStatus)}>
                <option value="all">全部</option>
                {TEST_RECORD_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {TEST_RECORD_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>
            <label className="stats-check">
              <input type="checkbox" checked={sortByScore} onChange={(event) => setSortByScore(event.target.checked)} />
              按成绩排序（表格查看，不是排行榜）
            </label>
          </div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>学号</th>
                  <th>姓名</th>
                  <th>性别</th>
                  <th>状态</th>
                  <th>成绩</th>
                </tr>
              </thead>
              <tbody>
                {detailRows.map((record) => (
                  <tr key={record.id}>
                    <td>{record.studentNoSnapshot || '—'}</td>
                    <td>{record.nameSnapshot}</td>
                    <td>{STUDENT_GENDER_LABELS[record.genderSnapshot]}</td>
                    <td>{TEST_RECORD_STATUS_LABELS[record.status]}</td>
                    <td>
                      {record.status === 'valid' && record.rawValue !== null
                        ? formatTestScoreWithUnit(record.rawValue, detail, testItem)
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="stats-muted">
            平均 {detailSummary.average}，最好 {detailSummary.best}
          </p>
        </div>
      ) : null}
    </div>
  )
}
