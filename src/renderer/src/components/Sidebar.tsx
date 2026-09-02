import { NAV_ITEMS, type NavKey } from '../navigation'

interface SidebarProps {
  activeKey: NavKey
  onNavigate: (key: NavKey) => void
}

export default function Sidebar({ activeKey, onNavigate }: SidebarProps): React.JSX.Element {
  const primaryItems = NAV_ITEMS.filter((item) => item.key !== 'settings')
  const settingsItem = NAV_ITEMS.find((item) => item.key === 'settings')

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-mark" aria-hidden="true">
          体
        </div>
        <div>
          <p className="sidebar-brand-title">体育教师助手</p>
          <p className="sidebar-brand-sub">广东省初中</p>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="主导航">
        {primaryItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={item.key === activeKey ? 'nav-item is-active' : 'nav-item'}
            onClick={() => onNavigate(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {settingsItem ? (
        <div className="sidebar-footer">
          <button
            type="button"
            className={settingsItem.key === activeKey ? 'nav-item is-active' : 'nav-item'}
            onClick={() => onNavigate(settingsItem.key)}
          >
            {settingsItem.label}
          </button>
        </div>
      ) : null}
    </aside>
  )
}
