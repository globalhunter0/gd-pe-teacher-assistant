interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  tone?: 'light' | 'dark'
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  tone = 'light'
}: EmptyStateProps): React.JSX.Element {
  return (
    <div className={`empty-state empty-state--${tone}`}>
      <div className="empty-state-mark" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 18c4-6 7-6 9 0s5 6 9 0" />
          <circle cx="12" cy="8" r="2.2" />
        </svg>
      </div>
      <p className="empty-state-title">{title}</p>
      <p className="empty-state-desc">{description}</p>
      {actionLabel && onAction ? (
        <button type="button" className="btn btn-primary btn-small" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
