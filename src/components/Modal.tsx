import {
  type FC,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'
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
  const dialogRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const drag = useRef<{
    startX: number
    startY: number
    baseX: number
    baseY: number
    x: number
    y: number
  } | null>(null)

  useEffect(() => {
    if (!open || hidden) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, hidden, onClose])

  const onHeaderMouseDown = (e: ReactMouseEvent) => {
    // ignore drags that start on interactive elements (the close button)
    if ((e.target as Element).closest('button')) return
    e.preventDefault()
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: offset.x,
      baseY: offset.y,
      x: offset.x,
      y: offset.y,
    }
    // during drag we mutate the dialog's transform directly to avoid a
    // React re-render on every mousemove. React state is synced on
    // mouseup so subsequent renders keep the latest position.
    const onMove = (ev: MouseEvent) => {
      const d = drag.current
      if (!d || !dialogRef.current) return
      d.x = d.baseX + (ev.clientX - d.startX)
      d.y = d.baseY + (ev.clientY - d.startY)
      dialogRef.current.style.transform = `translate(${d.x}px, ${d.y}px)`
    }
    const onUp = () => {
      const d = drag.current
      if (d) setOffset({ x: d.x, y: d.y })
      drag.current = null
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

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
      <div
        ref={dialogRef}
        className={styles.dialog}
        style={{
          width,
          transform: `translate(${offset.x}px, ${offset.y}px)`,
        }}
      >
        <div className={styles.header} onMouseDown={onHeaderMouseDown}>
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
