import { ModuleIcon, type WorkspaceKind } from './workspace/ModuleIcon'

interface PageLayoutProps {
  className?: string
  children: React.ReactNode
}

export default function PageLayout({ className, children }: PageLayoutProps): React.JSX.Element {
  const isDashboard = Boolean(className?.includes('page--dashboard'))
  const isBaseline =
    Boolean(className?.includes('page--training')) ||
    Boolean(className?.includes('page--plans')) ||
    Boolean(className?.includes('page--stats'))
  const classes = ['page']
  if (className) {
    classes.push(className)
  }
  if (!isDashboard && !isBaseline && !className?.includes('page-shell')) {
    classes.push('page-shell')
  }
  return <section className={classes.join(' ')}>{children}</section>
}

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  icon?: WorkspaceKind
}

export function PageHeader({ title, description, actions, icon }: PageHeaderProps): React.JSX.Element {
  return (
    <header className={actions ? 'page-heading page-heading--split' : 'page-heading'}>
      <div className="page-heading-lead">
        {icon ? (
          <span className="page-heading-icon">
            <ModuleIcon kind={icon} size={18} />
          </span>
        ) : null}
        <div className="page-heading-text">
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  )
}
