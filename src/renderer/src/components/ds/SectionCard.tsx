interface SectionCardProps {
  children: React.ReactNode
  className?: string
}

export default function SectionCard({ children, className = '' }: SectionCardProps): React.JSX.Element {
  return <div className={['ds-section', className].filter(Boolean).join(' ')}>{children}</div>
}
