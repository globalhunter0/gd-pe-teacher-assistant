import { ModuleIcon, type WorkspaceKind } from './ModuleIcon'

interface TechEmptyStateProps {
  kind: WorkspaceKind
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  secondaryLabel?: string
  onSecondary?: () => void
  compact?: boolean
}

export default function TechEmptyState({
  kind,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  compact = false
}: TechEmptyStateProps): React.JSX.Element {
  return (
    <div className={compact ? 'tech-empty-wrap tech-empty-wrap--compact' : 'tech-empty-wrap'}>
      <div className={`tech-empty tech-empty--${kind}${compact ? ' tech-empty--compact' : ''}`}>
        <div className="tech-empty-grid" aria-hidden="true" />
        <div className="tech-empty-glow" aria-hidden="true" />
        <div className="tech-empty-icon" aria-hidden="true">
          <ModuleIcon kind={kind} size={34} />
        </div>
        {kind === 'stats' ? (
          <svg className="tech-empty-chart" viewBox="0 0 280 72" fill="none" aria-hidden="true">
            <path d="M8 58 L52 42 L96 48 L140 22 L184 30 L224 12 L272 28" />
            <path d="M28 62h16M76 62h16M124 62h16M172 62h16M220 62h16" />
          </svg>
        ) : null}
        <p className="tech-empty-title">{title}</p>
        <p className="tech-empty-desc">{description}</p>
        {actionLabel && onAction ? (
          <button type="button" className="btn btn-primary" onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
        {secondaryLabel && onSecondary ? (
          <button type="button" className="btn" onClick={onSecondary} style={{ marginLeft: 8 }}>
            {secondaryLabel}
          </button>
        ) : null}
      </div>
    </div>
  )
}
