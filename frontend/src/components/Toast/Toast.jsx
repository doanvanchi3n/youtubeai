import { useEffect } from 'react'
import styles from './Toast.module.css'

export default function Toast({ message, type = 'success', onClose, duration = 4000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  return (
    <div
      className={`${styles.toast} ${styles[`toast${type.charAt(0).toUpperCase() + type.slice(1)}`]}`}
      onClick={onClose}
    >
      <div className={styles.toastContent}>
        <span className={styles.toastMessage}>{message}</span>
        <button
          type="button"
          className={styles.toastClose}
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          aria-label="Đóng"
        >
          ×
        </button>
      </div>
    </div>
  )
}

