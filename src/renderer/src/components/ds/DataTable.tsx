interface DataTableProps {
  children: React.ReactNode
  className?: string
}

export default function DataTable({ children, className = '' }: DataTableProps): React.JSX.Element {
  return <div className={['ds-table-wrap', 'data-table-wrap', className].filter(Boolean).join(' ')}>{children}</div>
}
