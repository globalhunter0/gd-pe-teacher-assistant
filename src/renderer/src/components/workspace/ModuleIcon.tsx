export type WorkspaceKind =
  | 'schedule'
  | 'students'
  | 'lessons'
  | 'tests'
  | 'training'
  | 'plans'
  | 'stats'
  | 'exams'
  | 'resources'
  | 'settings'
  | 'ai'

export function ModuleIcon({
  kind,
  size = 18
}: {
  kind: WorkspaceKind
  size?: number
}): React.JSX.Element {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const
  }

  switch (kind) {
    case 'schedule':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      )
    case 'students':
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
          <path d="M6 4h10a2 2 0 0 1 2 2v14H8a2 2 0 0 1-2-2V4z" />
          <path d="M8 8h8M8 12h6M18 7h2v13h-2" />
        </svg>
      )
    case 'tests':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l2.6 1.6" />
          <path d="M12 3v2M12 19v2" />
        </svg>
      )
    case 'training':
      return (
        <svg {...common}>
          <path d="M8 6h8l2 4-6 9-6-9 2-4z" />
          <path d="M9 10h6" />
          <circle cx="12" cy="7" r="1.2" />
        </svg>
      )
    case 'plans':
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4M16 3v4M8 12h8M8 16h5" />
        </svg>
      )
    case 'stats':
      return (
        <svg {...common}>
          <path d="M4 19V10M10 19V5M16 19v-7M20 19H3" />
          <path d="M4 8l5-3 4 4 6-5" />
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
    case 'settings':
      return (
        <svg {...common}>
          <path d="M4 7h16M4 12h16M4 17h10" />
        </svg>
      )
    case 'ai':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 5v2M12 17v2M5 12h2M17 12h2" />
        </svg>
      )
  }
}
