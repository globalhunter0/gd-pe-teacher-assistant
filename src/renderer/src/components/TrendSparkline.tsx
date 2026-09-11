interface TrendPoint {
  date: string
  value: number
  label: string
}

interface TrendSparklineProps {
  points: TrendPoint[]
  ariaLabel: string
}

export default function TrendSparkline({ points, ariaLabel }: TrendSparklineProps): React.JSX.Element {
  if (points.length === 0) {
    return <p className="stats-muted">暂无有效数据可绘图。</p>
  }

  const width = 560
  const height = 160
  const pad = 28
  const values = points.map((item) => item.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1

  function x(index: number): number {
    if (points.length === 1) {
      return width / 2
    }
    return pad + (index * (width - pad * 2)) / (points.length - 1)
  }

  function y(value: number): number {
    return height - pad - ((value - min) / span) * (height - pad * 2)
  }

  const path = points.map((item, index) => `${index === 0 ? 'M' : 'L'} ${x(index).toFixed(1)} ${y(item.value).toFixed(1)}`).join(' ')

  return (
    <svg className="trend-spark" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel}>
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" />
      {points.map((item, index) => (
        <circle key={`${item.date}-${index}`} cx={x(index)} cy={y(item.value)} r="4">
          <title>{item.label}</title>
        </circle>
      ))}
      <text x={pad} y={height - 8} fontSize="11">
        {points[0].date}
      </text>
      <text x={width - pad} y={height - 8} fontSize="11" textAnchor="end">
        {points[points.length - 1].date}
      </text>
    </svg>
  )
}
