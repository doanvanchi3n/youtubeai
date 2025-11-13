import styles from './FilterTabs.module.css'

export default function FilterTabs({
  items,
  active,
  onChange,
  variant = 'teal',
  size = 'md',
  className = '',
}) {
  const wrapperClasses = [
    styles.wrapper,
    variant === 'light' ? styles.light : '',
    size === 'sm' ? styles.sm : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={wrapperClasses}>
      {items.map((item) => {
        const option =
          typeof item === 'string' ? { label: item, value: item } : item
        const isActive = active === option.value
        const tabClasses = [
          styles.tab,
          size === 'sm' ? styles.smTab : '',
          isActive ? styles.active : '',
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <button
            key={option.value}
            type="button"
            className={tabClasses}
            onClick={() => onChange(option.value)}
          >
            {option.icon ? <span>{option.icon}</span> : null}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}



