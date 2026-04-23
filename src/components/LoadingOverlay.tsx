import type { FC, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import styles from './LoadingOverlay.module.css'

interface Props {
  open: boolean
  step?: string | null
  children?: ReactNode
}

export const LoadingOverlay: FC<Props> = ({ open, step, children }) => {
  if (!open) return null
  return createPortal(
    <div className={styles.backdrop} role="status" aria-live="polite">
      <div className={styles.panel}>
        <div className={styles.spinner} />
        {step && <div className={styles.step}>{step}</div>}
        {children && <div className={styles.message}>{children}</div>}
      </div>
    </div>,
    document.body,
  )
}
