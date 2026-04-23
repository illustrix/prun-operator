import { type FC, type ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import styles from './Modal.module.css'

interface ModalProps {
  open: boolean
  // when true the dialog stays mounted (state preserved) but is hidden
  // from view via `display: none`. escape key is also muted.
  hidden?: boolean
  onClose: () => void
  title?: ReactNode
  children?: ReactNode
  width?: number | string
}

export const Modal: FC<ModalProps> = ({
  open,
  hidden,
  onClose,
  title,
  children,
  width,
}) => {
  useEffect(() => {
    if (!open || hidden) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, hidden, onClose])

  if (!open) return null

  return createPortal(
    <div
      className={styles.backdrop}
      style={hidden ? { display: 'none' } : undefined}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Close"
        className={styles.backdropButton}
        onClick={onClose}
      />
      <div className={styles.dialog} style={width ? { width } : undefined}>
        <div className={styles.header}>
          <div>{title}</div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body,
  )
}
