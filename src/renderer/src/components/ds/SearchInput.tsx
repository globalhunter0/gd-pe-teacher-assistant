interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
}

export default function SearchInput({
  value,
  onChange,
  placeholder,
  label = '搜索'
}: SearchInputProps): React.JSX.Element {
  return (
    <label className="ds-search">
      <span className="ds-search-label">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  )
}
