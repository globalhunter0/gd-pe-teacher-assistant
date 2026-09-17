import { APP_VERSION_DISPLAY } from '@shared/appVersion'
import { NAV_ITEMS, type NavKey } from '../navigation'

interface SidebarProps {
  activeKey: NavKey
  onNavigate: (key: NavKey) => void
}

function NavIcon({ name }: { name: NavKey }): React.JSX.Element {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const
  }

  switch (name) {
    case 'dashboard':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="4" rx="1.5" />
          <rect x="14" y="10" width="7" height="11" rx="1.5" />
          <rect x="3" y="13" width="7" height="8" rx="1.5" />
        </svg>
      )
    case 'schedule':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      )
    case 'students':
    case 'classes':
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <circle cx="16" cy="9" r="2.4" />
          <path d="M4 19c.8-3 2.8-5 5-5s4.2 2 5 5" />
          <path d="M14 19c.5-2 1.8-3.4 3.4-3.4 1.7 0 3.1 1.2 3.6 3.4" />
        </svg>
      )
    case 'lessons':
      return (
        <svg {...common}>
          <path d="M4 5h11a2 2 0 0 1 2 2v13H6a2 2 0 0 1-2-2V5z" />
          <path d="M17 7h3v13h-3" />
        </svg>
      )
    case 'tests':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l2.5 1.5" />
        </svg>
      )
    case 'training':
      return (
        <svg {...common}>
          <path d="M7 8h10M6 12h12M8 16h8" />
          <circle cx="6" cy="8" r="1.4" />
          <circle cx="18" cy="12" r="1.4" />
        </svg>
      )
    case 'plans':
      return (
        <svg {...common}>
          <path d="M8 4h8M6 8h12v12H6z" />
          <path d="M9 12h6M9 16h4" />
        </svg>
      )
    case 'stats':
      return (
        <svg {...common}>
          <path d="M4 19V10M10 19V5M16 19v-7M20 19H3" />
        </svg>
      )
    case 'exams':
      return (
        <svg {...common}>
          <path d="M7 4h10v16H7z" />
          <path d="M10 8h4M10 12h4M10 16h2" />
        </svg>
      )
    case 'resources':
      return (
        <svg {...common}>
          <path d="M4 7h7l2 2h7v10H4z" />
        </svg>
      )
    case 'ai':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 5v2M12 17v2M5 12h2M17 12h2" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...common}>
          <path d="M4 7h16M4 12h16M4 17h10" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7" />
        </svg>
      )
  }
}

export default function Sidebar({ activeKey, onNavigate }: SidebarProps): React.JSX.Element {
  const primaryItems = NAV_ITEMS.filter((item) => item.key !== 'settings')
  const settingsItem = NAV_ITEMS.find((item) => item.key === 'settings')

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-mark" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="8" />
            <path d="M12 4v16M8 8l8 8M16 8l-8 8" />
          </svg>
        </div>
        <div>
          <p className="sidebar-brand-kicker">广东省初中</p>
          <p className="sidebar-brand-title">体育教师管理助手</p>
          <p className="sidebar-brand-sub">{APP_VERSION_DISPLAY}</p>
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
            <span className="nav-item-icon">
              <NavIcon name={item.key} />
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      {settingsItem ? (
        <div className="sidebar-footer">
          <p className="sidebar-footer-label">本地数据</p>
          <button
            type="button"
            className={settingsItem.key === activeKey ? 'nav-item is-active' : 'nav-item'}
            onClick={() => onNavigate(settingsItem.key)}
          >
            <span className="nav-item-icon">
              <NavIcon name={settingsItem.key} />
            </span>
            {settingsItem.label}
          </button>
        </div>
      ) : null}
    </aside>
  )
}
