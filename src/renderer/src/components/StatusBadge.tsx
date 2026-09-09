interface StatusBadgeProps {
  tone?: 'ok' | 'info' | 'warn' | 'danger' | 'muted'
  children: React.ReactNode
}

export default function StatusBadge({ tone = 'info', children }: StatusBadgeProps): React.JSX.Element {
  return <span className={`status-badge status-badge--${tone}`}>{children}</span>
}
