import { type FC, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'
import styles from './Toast.module.css'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
  id: number
  text: string
  type: ToastType
}

const listeners = new Set<(items: ToastItem[]) => void>()
let items: ToastItem[] = []
let nextId = 0

const notify = () => {
  for (const listener of listeners) listener(items)
}

let containerEl: HTMLDivElement | null = null
let containerRoot: Root | null = null

const ensureContainer = () => {
  if (containerEl) return
  containerEl = document.createElement('div')
  document.body.appendChild(containerEl)
  containerRoot = createRoot(containerEl)
  containerRoot.render(<ToastContainer />)
}

// Show a toast. Auto-dismisses after `duration` ms.
export const showToast = (
  text: string,
  type: ToastType = 'info',
  duration = 3000,
) => {
  ensureContainer()
  const id = nextId++
  items = [...items, { id, text, type }]
  notify()
  window.setTimeout(() => {
    items = items.filter(t => t.id !== id)
    notify()
  }, duration)
}

const ToastContainer: FC = () => {
  const [current, setCurrent] = useState<ToastItem[]>(items)
  useEffect(() => {
    listeners.add(setCurrent)
    return () => {
      listeners.delete(setCurrent)
    }
  }, [])
  return createPortal(
    <div className={styles.container}>
      {current.map(item => (
        <div
          key={item.id}
          className={`${styles.toast} ${styles[item.type]}`}
          role={item.type === 'error' ? 'alert' : 'status'}
        >
          {item.text}
        </div>
      ))}
    </div>,
    document.body,
  )
}
