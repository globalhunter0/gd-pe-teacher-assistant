interface OverviewItem {
  label: string
  value: string | number
  hint?: string
}

export default function OverviewBar({ items }: { items: OverviewItem[] }): React.JSX.Element {
  return (
    <div className="workspace-overview">
      {items.map((item) => (
        <article key={item.label} className="workspace-overview-card">
          <p className="workspace-overview-label">{item.label}</p>
          <p className="workspace-overview-value">{item.value}</p>
          {item.hint ? <p className="workspace-overview-hint">{item.hint}</p> : null}
        </article>
      ))}
    </div>
  )
}
