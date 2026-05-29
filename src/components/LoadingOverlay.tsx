import type { FC, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import styles from './LoadingOverlay.module.css'

export interface OverlayProgress {
  current: number
  total: number
}

interface Props {
  open: boolean
  step?: string | null
  // When set (and total > 0), renders an overall progress bar above the
  // message. Omit it for indeterminate work — only the spinner shows.
  progress?: OverlayProgress | null
  children?: ReactNode
}

export const LoadingOverlay: FC<Props> = ({
  open,
  step,
  progress,
  children,
}) => {
  if (!open) return null
  const percent =
    progress && progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : null
  return createPortal(
    <div className={styles.backdrop} role="status" aria-live="polite">
      <div className={styles.panel}>
        <div className={styles.spinner} />
        {step && <div className={styles.step}>{step}</div>}
        {percent !== null && progress && (
          <div className={styles.progress}>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className={styles.progressLabel}>
              {progress.current} / {progress.total}
            </div>
          </div>
        )}
        {children && <div className={styles.message}>{children}</div>}
      </div>
    </div>,
    document.body,
  )
}
