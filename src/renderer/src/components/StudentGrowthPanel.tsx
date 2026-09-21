import { useMemo, useState } from 'react'
import StatCard from './StatCard'
import TrendSparkline from './TrendSparkline'
import {
  buildStudentAttentionSignals,
  indexPeTests,
  summarizeStudentGrowth,
  type StudentItemHistory
} from '@shared/statistics'
import type { ClassRecord } from '@shared/class'
import type { PETestSession, TestItem } from '@shared/peTest'
import type { StudentRecord } from '@shared/student'

interface StudentGrowthPanelProps {
  studentId: string
  sessions: ReadonlyArray<PETestSession>
  students: ReadonlyArray<StudentRecord>
  classes: ReadonlyArray<ClassRecord>
  testItems: ReadonlyArray<TestItem>
}

export default function StudentGrowthPanel({
  studentId,
  sessions,
  students,
  classes,
  testItems
}: StudentGrowthPanelProps): React.JSX.Element {
  const index = useMemo(() => indexPeTests(sessions), [sessions])
  const growth = useMemo(
    () => summarizeStudentGrowth(sessions, studentId, testItems, students, classes, index),
    [sessions, studentId, testItems, students, classes, index]
  )
  const signals = useMemo(
    () => buildStudentAttentionSignals(studentId, sessions, testItems, { index }),
    [studentId, sessions, testItems, index]
  )
  const [itemId, setItemId] = useState<string | null>(null)
  const [axis, setAxis] = useState<'raw' | 'score'>('raw')

  if (!growth) {
    return <p className="empty-text">该学生还没有体育测试记录。</p>
  }

  const selected: StudentItemHistory | undefined = growth.items.find((item) => item.testItemId === itemId)

  return (
    <div className="growth-panel">
      <div className="stats-profile">
        <p>
          <strong>{growth.name}</strong>
          {growth.isHistorical ? <span className="tag">历史学生</span> : null}
        </p>
        <p>班级：{growth.classLabel}</p>
        <p>学号：{growth.studentNo || '—'}</p>
        <p>性别：{growth.genderLabel}</p>
      </div>
      <div className="stat-grid">
        <StatCard label="累计测试次数" value={String(growth.sessionCount)} hint="该生有记录的测试" />
        <StatCard label="参与项目数" value={String(growth.itemCount)} hint="项目" />
        <StatCard label="有效成绩" value={String(growth.validCount)} hint="人次" />
        <StatCard label="缺考" value={String(growth.absentCount)} hint="人次" />
        <StatCard label="免考" value={String(growth.exemptCount)} hint="人次" />
      </div>

      {signals.length > 0 ? (
        <>
          <h3 className="stats-subtitle">建议关注</h3>
          <ul className="growth-signals">
            {signals.map((item) => (
              <li key={`${item.title}-${item.detail}`}>
                <strong>{item.kind === 'watch' ? '建议关注' : item.kind === 'progress' ? '近期进步' : item.kind === 'personalBest' ? '刷新个人最佳' : '近期测试较少'}</strong>
                {item.title} · {item.detail}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <h3 className="stats-subtitle">项目表现</h3>
      <div className="growth-cards">
        {growth.items.map((item) => (
          <button
            key={item.testItemId}
            type="button"
            className={item.testItemId === itemId ? 'growth-card is-active' : 'growth-card'}
            onClick={() => setItemId(item.testItemId === itemId ? null : item.testItemId)}
          >
            <strong>{item.name}</strong>
            <p>最近成绩：{item.recentRawText}</p>
            <p>最近得分：{item.recentScoreText}</p>
            <p>个人最佳：{item.bestRawText}</p>
            <p>上次成绩：{item.previousRawText}</p>
            <p>较上次：{item.changeText}</p>
            <p>首次成绩：{item.firstRawText}</p>
            <p>相比首次：{item.vsFirstText}</p>
            <p>测试次数：{item.testCount}</p>
          </button>
        ))}
      </div>

      {selected ? (
        <div className="growth-detail">
          <h3 className="stats-subtitle">{selected.name} 历史趋势</h3>
          {selected.scoringStandardChanged ? <p className="stats-note">评分标准版本不同。原始成绩仍可比较，得分变化不能直接等同于身体能力变化。</p> : null}
          <div className="toolbar">
            <button type="button" className={axis === 'raw' ? 'btn btn-primary' : 'btn'} onClick={() => setAxis('raw')}>
              原始成绩
            </button>
            <button type="button" className={axis === 'score' ? 'btn btn-primary' : 'btn'} onClick={() => setAxis('score')}>
              得分
            </button>
          </div>
          {axis === 'score' && selected.scoringStandardChanged ? (
            <p className="stats-note">当前为得分轴，且评分标准版本不同。</p>
          ) : null}
          <TrendSparkline
            ariaLabel={`${selected.name}趋势`}
            points={selected.points
              .filter((item) => (axis === 'raw' ? item.status === 'valid' && item.rawValue !== null : item.examScore !== null))
              .map((item) => ({
                date: item.date,
                value: axis === 'raw' ? (item.rawValue as number) : (item.examScore as number),
                label: `${item.date} 原始 ${item.rawText} 得分 ${item.scoreText} ${item.standardLabel}`
              }))}
          />
          {selected.direction === 'lowerBetter' ? <p className="stats-muted">该项目越低越好，数值下降代表进步。</p> : null}
          {selected.direction === 'higherBetter' ? <p className="stats-muted">该项目越高越好，数值上升代表进步。</p> : null}
          {selected.direction === 'neutral' ? <p className="stats-muted">该项目不判断进步或退步。</p> : null}
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>日期</th>
                  <th>测试名称</th>
                  <th>实际项目</th>
                  <th>原始成绩</th>
                  <th>基础分</th>
                  <th>附加分</th>
                  <th>单项得分</th>
                  <th>状态</th>
                  <th>评分体系</th>
                  <th>年级快照</th>
                  <th>较上次</th>
                </tr>
              </thead>
              <tbody>
                {selected.points.map((row) => (
                  <tr key={row.sessionId}>
                    <td>{row.date}</td>
                    <td>
                      {row.title}
                      {row.originLabel === '课堂小测' ? <span className="tag">课堂小测</span> : null}
                    </td>
                    <td>{row.actualItemName}</td>
                    <td>{row.rawText}</td>
                    <td>{row.baseScore === null ? '—' : row.baseScore}</td>
                    <td>{row.bonusScore && row.bonusScore > 0 ? `+${row.bonusScore}` : '—'}</td>
                    <td>{row.scoreText}</td>
                    <td>
                      {row.statusLabel}
                      {row.isPersonalBest ? ' · 个人最佳' : ''}
                    </td>
                    <td>{row.standardLabel}</td>
                    <td>{row.gradeSnapshot}</td>
                    <td>{row.vsPrevious.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="stats-muted">点击项目卡片查看同项目历史和趋势。</p>
      )}
    </div>
  )
}
