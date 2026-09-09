interface AppHeaderProps {
  title: string
  description?: string
}

export default function AppHeader({ title, description }: AppHeaderProps): React.JSX.Element {
  return (
    <header className="app-header">
      <div>
        <h1 className="app-title">{title}</h1>
        {description ? <p className="app-subtitle">{description}</p> : null}
      </div>
    </header>
  )
}
