interface HudClassProps {
  className?: string
}

export function TechGrid({ className = '' }: HudClassProps): React.JSX.Element {
  return <div className={`hud-tech-grid ${className}`.trim()} aria-hidden="true" />
}

export function GlowOrb({ className = '' }: HudClassProps): React.JSX.Element {
  return <div className={`hud-glow-orb ${className}`.trim()} aria-hidden="true" />
}

export function SpeedLines({ className = '' }: HudClassProps): React.JSX.Element {
  return (
    <svg className={`hud-speed-lines ${className}`.trim()} viewBox="0 0 960 220" preserveAspectRatio="none" aria-hidden="true">
      <path d="M-20 168 C160 48 300 176 490 88 C700 -6 800 142 990 64" />
      <path d="M-10 198 C210 96 360 208 580 128 C770 54 860 176 990 118" />
      <path d="M40 214 L920 46" />
      <path d="M90 218 L940 92" />
    </svg>
  )
}

export function AccentLine({ className = '' }: HudClassProps): React.JSX.Element {
  return <div className={`hud-accent-line ${className}`.trim()} aria-hidden="true" />
}
