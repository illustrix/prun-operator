import { type CSSProperties, type FC, type ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children?: ReactNode
  width?: number | string
}

const backdropStyle: CSSProperties = {
  fontFamily: 'Arial, sans-serif',
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
}

const backdropButtonStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  border: 'none',
  padding: 0,
  cursor: 'default',
}

const dialogStyle: CSSProperties = {
  position: 'relative',
  backgroundColor: '#1f2937',
  color: '#f3f4f6',
  borderRadius: 6,
  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
  minWidth: 320,
  maxWidth: '90vw',
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 14px',
  borderBottom: '1px solid #374151',
  fontWeight: 600,
}

const closeButtonStyle: CSSProperties = {
  background: 'transparent',
  color: '#f3f4f6',
  border: 'none',
  fontSize: 20,
  lineHeight: 1,
  cursor: 'pointer',
  padding: '0 4px',
}

const bodyStyle: CSSProperties = {
  padding: 14,
  overflow: 'auto',
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
    <div style={backdropStyle} role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close"
        style={backdropButtonStyle}
        onClick={onClose}
      />
      <div style={{ ...dialogStyle, width }}>
        <div style={headerStyle}>
          <div>{title}</div>
          <button
            type="button"
            style={closeButtonStyle}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div style={bodyStyle}>{children}</div>
      </div>
    </div>,
    document.body,
  )
}
