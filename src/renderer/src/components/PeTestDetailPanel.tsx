import { useMemo, useState } from 'react'
import PageLayout, { PageHeader } from './PageLayout'
import DataTable from './ds/DataTable'
import type { ClassRecord } from '@shared/class'
import { STUDENT_GENDER_LABELS } from '@shared/student'
import { SCORE_BAND_LABELS } from '@shared/statistics'
import {
  buildPeTestClosure,
  canMarkTestComplete,
  filterPeTestDetailRows,
  isGenderLinkedSession,
  type PETestSession,
  type PeTestDetailFilter,
  type TestItem
} from '@shared/peTest'

interface PeTestDetailPanelProps {
  session: PETestSession
  sessions: ReadonlyArray<PETestSession>
  testItem: TestItem | undefined
  classes: ReadonlyArray<ClassRecord>
  onBack: () => void
  onContinueEntry: () => void
  onOpenAnalysis: () => void
  onOpenEditor?: () => void
}

const FILTERS: Array<{ id: PeTestDetailFilter; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'valid', label: '有效成绩' },
  { id: 'pending', label: '未测' },
  { id: 'absent', label: '缺考' },
  { id: 'exempt', label: '免考' },
  { id: 'fail', label: '不及格' },
  { id: 'invalid', label: '异常' }
]

export default function PeTestDetailPanel({
  session,
  sessions,
  testItem,
  classes,
  onBack,
  onContinueEntry,
  onOpenAnalysis,
  onOpenEditor
}: PeTestDetailPanelProps): React.JSX.Element {
  const [filter, setFilter] = useState<PeTestDetailFilter>('all')
  const [query, setQuery] = useState('')
  const [completeHint, setCompleteHint] = useState(false)

  const closure = useMemo(
    () =>
      buildPeTestClosure({
        session,
        allSessions: sessions,
        testItem,
        classes
      }),
    [session, sessions, testItem, classes]
  )

  const rows = useMemo(
    () =>
      [...filterPeTestDetailRows(closure.rows, filter, query)].sort(
        (a, b) =>
          a.record.studentNoSnapshot.localeCompare(b.record.studentNoSnapshot, 'zh-CN', { numeric: true }) ||
          a.record.nameSnapshot.localeCompare(b.record.nameSnapshot, 'zh-CN')
      ),
    [closure.rows, filter, query]
  )

  function requestComplete(): void {
    if (canMarkTestComplete(closure)) {
      setCompleteHint(false)
      return
    }
    setCompleteHint(true)
  }

  return (
    <PageLayout className="page--pe-test-detail">
      <PageHeader
        icon="tests"
        title="测试详情"
        description={`${closure.classLabel} · ${closure.date} · ${closure.itemName} · ${closure.standardLabel}`}
        actions={
          <>
            {closure.pending > 0 ? (
              <button type="button" className="btn btn-primary" onClick={onContinueEntry}>
                继续录入
              </button>
            ) : null}
            <button type="button" className="btn" onClick={requestComplete}>
              完成测试
            </button>
            <button type="button" className="btn" onClick={onOpenAnalysis}>
              查看完整测试分析
            </button>
            {onOpenEditor ? (
              <button type="button" className="btn" onClick={onOpenEditor}>
                手工编辑
              </button>
            ) : null}
            <button type="button" className="btn" onClick={onBack}>
              返回测试记录
            </button>
          </>
        }
      />

      <dl className="pe-detail-meta">
        <div>
          <dt>班级</dt>
          <dd>{closure.classLabel}</dd>
        </div>
        <div>
          <dt>测试日期</dt>
          <dd>{closure.date}</dd>
        </div>
        <div>
          <dt>测试项目</dt>
          <dd>{closure.itemName}</dd>
        </div>
        <div>
          <dt>评分标准</dt>
          <dd>{closure.standardLabel}</dd>
        </div>
        <div>
          <dt>应测</dt>
          <dd>{closure.roster}</dd>
        </div>
        <div>
          <dt>有效成绩</dt>
          <dd>{closure.valid}</dd>
        </div>
        <div>
          <dt>缺考</dt>
          <dd>{closure.absent}</dd>
        </div>
        <div>
          <dt>免考</dt>
          <dd>{closure.exempt}</dd>
        </div>
        <div>
          <dt>未测</dt>
          <dd>{closure.pending}</dd>
        </div>
        <div>
          <dt>异常</dt>
          <dd>{closure.invalid}</dd>
        </div>
      </dl>
      <p className="pe-detail-progress">
        完成进度 {closure.processed} / {closure.roster}
        {closure.complete ? ' · 本次测试已完成' : ''}
      </p>
      <div className="pe-quick-progress" aria-label="完成进度">
        <span style={{ width: `${closure.roster === 0 ? 0 : Math.round((closure.processed / closure.roster) * 100)}%` }} />
      </div>

      {completeHint && closure.pending > 0 ? (
        <div className="pe-quick-done">
          <p>本次测试仍有 {closure.pending} 名学生未录入成绩。</p>
          <p className="pe-quick-setup-hint">名单：{closure.pendingNames.join('、')}</p>
          <div className="pe-quick-done-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setFilter('pending')
                setCompleteHint(false)
              }}
            >
              继续查看未测学生
            </button>
            <button type="button" className="btn" onClick={() => setCompleteHint(false)}>
              返回处理
            </button>
          </div>
        </div>
      ) : null}

      {closure.complete ? (
        <section className="pe-detail-result">
          <h3>本次测试结果</h3>
          <dl className="pe-detail-result-grid">
            <div>
              <dt>有效样本 n</dt>
              <dd>{closure.summary.scoredCount}</dd>
            </div>
            <div>
              <dt>无官方分值</dt>
              <dd>{closure.summary.belowOfficialMinimumCount}</dd>
            </div>
            <div>
              <dt>平均分</dt>
              <dd>{closure.summary.averageScoreText}</dd>
            </div>
            <div>
              <dt>最高分</dt>
              <dd>{closure.summary.maxScoreText}</dd>
            </div>
            <div>
              <dt>最低分</dt>
              <dd>{closure.summary.minScoreText}</dd>
            </div>
            {closure.passCount !== null ? (
              <div>
                <dt>及格</dt>
                <dd>
                  {closure.passCount}
                  {closure.summary.scoredCount > 0
                    ? `（${Math.round((closure.passCount / closure.summary.scoredCount) * 100)}%）`
                    : ''}
                </dd>
              </div>
            ) : null}
            {closure.excellentCount !== null ? (
              <div>
                <dt>优秀</dt>
                <dd>
                  {closure.excellentCount}
                  {closure.summary.scoredCount > 0
                    ? `（${Math.round((closure.excellentCount / closure.summary.scoredCount) * 100)}%）`
                    : ''}
                </dd>
              </div>
            ) : null}
          </dl>
          {closure.summary.bands ? (
            <p className="pe-quick-setup-hint">
              分布：
              {(Object.keys(SCORE_BAND_LABELS) as Array<keyof typeof SCORE_BAND_LABELS>).map((key) => (
                <span key={key}>
                  {SCORE_BAND_LABELS[key]} {closure.summary.bands?.counts[key] ?? 0}{' '}
                </span>
              ))}
            </p>
          ) : (
            <p className="pe-quick-setup-hint">{closure.summary.bandBlockedReason ?? '暂不显示等级分布'}</p>
          )}
        </section>
      ) : null}

      {closure.attention.length > 0 ? (
        <section className="pe-detail-attention">
          <h3>需要关注</h3>
          <ul>
            {closure.attention.map((item) => (
              <li key={`${item.kind}-${item.studentNo}-${item.name}`}>
                {item.studentNo} {item.name} · {item.note}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="pe-quick-roster-tools">
        <div className="pe-quick-tabs">
          {FILTERS.map((item) =>
            item.id === 'fail' && closure.failCount === null ? null : (
              <button
                key={item.id}
                type="button"
                className={filter === item.id ? 'btn btn-small btn-primary' : 'btn btn-small'}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            )
          )}
        </div>
        <input
          className="pe-quick-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索姓名或学号"
          aria-label="搜索学生"
        />
      </div>

      <DataTable>
        <table className="data-table">
          <thead>
            <tr>
              <th>学号</th>
              <th>姓名</th>
              <th>性别</th>
              {isGenderLinkedSession(session) ? <th>实际项目</th> : null}
              <th>原始成绩</th>
              <th>基础分</th>
              <th>附加分</th>
              <th>单项得分</th>
              <th>状态</th>
              <th>评分依据</th>
              <th>与上次相比</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.record.id}>
                <td>{row.record.studentNoSnapshot}</td>
                <td>{row.record.nameSnapshot}</td>
                <td>{STUDENT_GENDER_LABELS[row.record.genderSnapshot]}</td>
                {isGenderLinkedSession(session) ? <td>{row.resolvedItemName}</td> : null}
                <td>{row.rawText}</td>
                <td>{row.baseText}</td>
                <td>{row.bonusText}</td>
                <td>{row.scoreText}</td>
                <td>{row.statusLabel}</td>
                <td>{closure.standardLabel}</td>
                <td>{row.vsText}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTable>
    </PageLayout>
  )
}
