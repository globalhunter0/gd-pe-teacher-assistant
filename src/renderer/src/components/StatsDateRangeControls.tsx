import { STATS_RANGE_OPTIONS, type StatsRangeKind } from '@shared/statistics'

interface StatsDateRangeControlsProps {
  kind: StatsRangeKind
  customStart: string
  customEnd: string
  onKindChange: (kind: StatsRangeKind) => void
  onCustomStartChange: (value: string) => void
  onCustomEndChange: (value: string) => void
}

export default function StatsDateRangeControls({
  kind,
  customStart,
  customEnd,
  onKindChange,
  onCustomStartChange,
  onCustomEndChange
}: StatsDateRangeControlsProps): React.JSX.Element {
  return (
    <div className="stats-filters">
      <label>
        日期范围
        <select value={kind} onChange={(event) => onKindChange(event.target.value as StatsRangeKind)}>
          {STATS_RANGE_OPTIONS.map((item) => (
            <option key={item.kind} value={item.kind}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      {kind === 'custom' ? (
        <>
          <label>
            开始日期
            <input type="date" value={customStart} onChange={(event) => onCustomStartChange(event.target.value)} />
          </label>
          <label>
            结束日期
            <input type="date" value={customEnd} onChange={(event) => onCustomEndChange(event.target.value)} />
          </label>
        </>
      ) : null}
    </div>
  )
}
