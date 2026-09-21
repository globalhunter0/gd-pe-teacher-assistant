import { useMemo, useState } from 'react'
import {
  getResultDirection,
  type PETestSession,
  type TestItem
} from '@shared/peTest'
import {
  summarizeStudentGrowth,
  type StudentItemHistory
} from '@shared/statistics'
import type { ClassRecord } from '@shared/class'
import type { StudentRecord } from '@shared/student'

interface StudentPeTestHistoryPanelProps {
  student: StudentRecord
  sessions: ReadonlyArray<PETestSession>
  students: ReadonlyArray<StudentRecord>
  classes: ReadonlyArray<ClassRecord>
  testItems: ReadonlyArray<TestItem>
}

function changeTone(kind: StudentItemHistory['changeKind']): string {
  if (kind === 'improved') {
    return 'pe-history-change pe-history-change--up'
  }
  if (kind === 'declined') {
    return 'pe-history-change pe-history-change--down'
  }
  return 'pe-history-change'
}

export default function StudentPeTestHistoryPanel({
  student,
  sessions,
  students,
  classes,
  testItems
}: StudentPeTestHistoryPanelProps): React.JSX.Element {
  const growth = useMemo(
    () => summarizeStudentGrowth(sessions, student.id, testItems, students, classes),
    [sessions, student.id, testItems, students, classes]
  )
  const [itemId, setItemId] = useState<string | null>(null)

  if (!growth) {
    return (
      <section className="pe-history-section">
        <h3>体育测试历史</h3>
        <p className="empty-text">该学生还没有体育测试记录。</p>
      </section>
    )
  }

  const selected = growth.items.find((item) => item.testItemId === itemId) ?? null
  const historyRows = selected
    ? [...selected.points].sort(
        (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt) || b.sessionId.localeCompare(a.sessionId)
      )
    : []

  return (
    <section className="pe-history-section">
      <h3>体育测试历史</h3>
      <p className="pe-quick-setup-hint">
        按学生身份汇总全部班级测试记录（含转班前与已完成测试）。缺考 / 未测会显示在列表中，但不参与最好成绩与趋势比较。
      </p>

      <div className="growth-cards">
        {growth.items.map((item) => {
          const direction = getResultDirection({ direction: item.direction })
          return (
            <button
              key={item.testItemId}
              type="button"
              className={item.testItemId === itemId ? 'growth-card is-active' : 'growth-card'}
              onClick={() => setItemId(item.testItemId === itemId ? null : item.testItemId)}
            >
              <strong>{item.name}</strong>
              <p>共测试 {item.testCount} 次（有效 {item.validCount}）</p>
              <p>最近：{item.recentRawText}</p>
              <p>最好：{item.bestRawText}</p>
              <p>上次：{item.previousRawText}</p>
              <p className={changeTone(item.changeKind)}>变化：{item.changeText}</p>
              {direction === 'lowerBetter' ? <p className="stats-muted">越小越好</p> : null}
              {direction === 'higherBetter' ? <p className="stats-muted">越大越好</p> : null}
            </button>
          )
        })}
      </div>

      {selected ? (
        <div className="pe-history-detail">
          <h4>{selected.name} · 历史成绩</h4>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>测试日期</th>
                  <th>测试项目</th>
                  <th>来源</th>
                  <th>原始成绩</th>
                  <th>单位</th>
                  <th>换算分</th>
                  <th>等级</th>
                  <th>测试状态</th>
                  <th>较上次</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                {historyRows.map((row) => (
                  <tr key={row.sessionId}>
                    <td>{row.date}</td>
                    <td>{row.actualItemName}</td>
                    <td>{row.originLabel}</td>
                    <td>
                      {row.rawText}
                      {row.isPersonalBest ? ' · 个人最佳' : ''}
                    </td>
                    <td>{row.unitText || '—'}</td>
                    <td>{row.scoreText}</td>
                    <td>{row.bandLabel}</td>
                    <td>{row.statusLabel}</td>
                    <td>{row.vsPrevious.text}</td>
                    <td className="data-table-notes">{row.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="stats-muted">点击项目卡片查看该项目全部历史成绩。</p>
      )}
    </section>
  )
}
