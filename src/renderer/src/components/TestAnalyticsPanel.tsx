import { useMemo, useState } from 'react'
import StatCard from './StatCard'
import { SCORE_BAND_LABELS, summarizeSingleTest } from '@shared/statistics'
import type { ClassRecord } from '@shared/class'
import { isGenderLinkedSession, linkedGenderScoreStats, BUILTIN_TEST_ITEMS, type PETestSession, type TestItem } from '@shared/peTest'

interface TestAnalyticsPanelProps {
  session: PETestSession
  sessions: ReadonlyArray<PETestSession>
  testItem: TestItem | undefined
  classes: ReadonlyArray<ClassRecord>
}

const BUCKETS: Array<{ key: 'personalBest' | 'improved' | 'declined' | 'same' | 'first' | 'absent'; label: string }> = [
  { key: 'personalBest', label: '个人最佳' },
  { key: 'improved', label: '较上次进步' },
  { key: 'declined', label: '较上次退步' },
  { key: 'same', label: '持平' },
  { key: 'first', label: '首次有效测试' },
  { key: 'absent', label: '缺考' }
]

export default function TestAnalyticsPanel({ session, sessions, testItem, classes }: TestAnalyticsPanelProps): React.JSX.Element {
  const summary = useMemo(
    () => summarizeSingleTest(session, sessions, testItem, classes),
    [session, sessions, testItem, classes]
  )
  const [bucket, setBucket] = useState<(typeof BUCKETS)[number]['key'] | null>(null)
  const grouped = isGenderLinkedSession(session)
  const split = grouped ? linkedGenderScoreStats(session, BUILTIN_TEST_ITEMS) : []
  const listed = bucket
    ? summary.performanceRows.filter((item) =>
        bucket === 'personalBest' ? item.isPersonalBest : bucket === 'absent' ? item.vsKind === 'absent' : item.vsKind === bucket
      )
    : []

  return (
    <div className="growth-panel">
      <p className="stats-note">
        {summary.classLabel} · {summary.itemName} · {summary.date}
      </p>
      <div className="stat-grid">
        <StatCard label="测试人数" value={String(summary.rosterCount)} hint="名单快照" />
        <StatCard label="有效成绩" value={String(summary.statuses.valid)} hint="人次" />
        <StatCard label="缺考" value={String(summary.statuses.absent)} hint="人次" />
        <StatCard label="免考" value={String(summary.statuses.exempt)} hint="人次" />
        <StatCard label="未测" value={String(summary.statuses.pending)} hint="人次" />
        <StatCard label="已评分人数" value={String(summary.scoredCount)} hint="已有评分结果" />
        <StatCard
          label="无官方分值"
          value={String(summary.belowOfficialMinimumCount)}
          hint="低于官方最低档，不按 0 分统计"
        />
      </div>
      {grouped ? (
        <>
          <h3 className="stats-subtitle">原始成绩</h3>
          <p className="stats-note">800米与1000米距离不同，不混合统计原始时间。班级综合仅使用换算后的得分。</p>
          <div className="stat-grid">
            {split.map((item) => (
              <StatCard
                key={item.gender}
                label={item.gender === 'male' ? `男生${item.itemName}` : `女生${item.itemName}`}
                value={item.averageRawText}
                hint={`有效 ${item.valid} 人 · 平均成绩`}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <h3 className="stats-subtitle">原始成绩</h3>
          <div className="stat-grid">
            <StatCard label="平均值" value={summary.averageRawText} hint="仅有效 rawValue" />
            <StatCard label="最好" value={summary.bestRawText} hint="按项目方向" />
            <StatCard label="最差" value={summary.worstRawText} hint="按项目方向" />
          </div>
        </>
      )}
      <h3 className="stats-subtitle">得分</h3>
      <div className="stat-grid">
        <StatCard label="平均分" value={summary.averageScoreText} hint="仅官方单项分，不含缺考/免考/未测/无官方分值" />
        <StatCard label="最高分" value={summary.maxScoreText} hint="不含空分" />
        <StatCard label="最低分" value={summary.minScoreText} hint="不含空分" />
      </div>
      {summary.scoringStandardChanged ? <p className="stats-note">评分标准版本不同。请勿把分数变化直接当成身体能力变化。</p> : null}
      <h3 className="stats-subtitle">分数分布</h3>
      {summary.bands ? (
        <div className="stat-grid">
          {(Object.keys(SCORE_BAND_LABELS) as Array<keyof typeof SCORE_BAND_LABELS>).map((key) => (
            <StatCard
              key={key}
              label={SCORE_BAND_LABELS[key]}
              value={`${summary.bands!.counts[key]}人`}
              hint={summary.bands!.rangeLabels[key]}
            />
          ))}
        </div>
      ) : (
        <p className="stats-note">{summary.bandBlockedReason ?? '没有可统计的得分。'}</p>
      )}

      <h3 className="stats-subtitle">本次表现</h3>
      <div className="stat-grid">
        {BUCKETS.map((item) => (
          <button key={item.key} type="button" className="growth-card" onClick={() => setBucket(bucket === item.key ? null : item.key)}>
            <strong>{item.label}</strong>
            <p>
              {item.key === 'personalBest'
                ? summary.performance.personalBest
                : item.key === 'improved'
                  ? summary.performance.improved
                  : item.key === 'declined'
                    ? summary.performance.declined
                    : item.key === 'same'
                      ? summary.performance.same
                      : item.key === 'first'
                        ? summary.performance.first
                        : summary.performance.absent}
              人
            </p>
          </button>
        ))}
      </div>
      {bucket ? (
        <ul className="growth-signals">
          {listed.length === 0 ? <li>该分类暂无学生。</li> : listed.map((item) => (
            <li key={item.studentId}>
              {item.name}
              {item.studentNo ? ` · ${item.studentNo}` : ''} · {item.vsText}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
