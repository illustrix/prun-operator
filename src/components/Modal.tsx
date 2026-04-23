import { type FC, type ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import styles from './Modal.module.css'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children?: ReactNode
  width?: number | string
}

export const Modal: FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  width,
}) => {
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className={styles.backdrop} role="dialog" aria-modal="true">
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
