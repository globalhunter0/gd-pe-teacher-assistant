interface StatCardProps {
  label: string
  value: string
  hint: string
}

export default function StatCard({ label, value, hint }: StatCardProps): React.JSX.Element {
  return (
    <article className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      <p className="stat-hint">{hint}</p>
    </article>
  )
}
