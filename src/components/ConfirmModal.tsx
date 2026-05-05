import type { FC, ReactNode } from 'react'
import styles from './ConfirmModal.module.css'
import { Modal } from './Modal'

interface ConfirmModalProps {
  open: boolean
  title?: ReactNode
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'warn'
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmModal: FC<ConfirmModalProps> = ({
  open,
  title = 'Confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}) => (
  <Modal open={open} onClose={onCancel} title={title} width={420}>
    <div className={styles.message}>{message}</div>
    <div className={styles.actions}>
      <button
        type="button"
        className={`${styles.btn} ${styles.cancel}`}
        onClick={onCancel}
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        className={`${styles.btn} ${variant === 'warn' ? styles.confirmWarn : styles.confirm}`}
        onClick={onConfirm}
      >
        {confirmLabel}
      </button>
    </div>
  </Modal>
)
