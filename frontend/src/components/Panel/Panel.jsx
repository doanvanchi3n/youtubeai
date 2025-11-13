import styles from './Panel.module.css'

export default function Panel({
  children,
  className = '',
  variant = 'default',
  as: Component = 'div',
  ...rest
}) {
  const classes = [
    styles.panel,
    variant === 'light' ? styles.light : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Component className={classes} {...rest}>
      {children}
    </Component>
  )
}



