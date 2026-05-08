import { type FC, useEffect, useState } from 'react'
import { Modal } from '../../components/Modal'
import styles from './SettingsModal.module.css'
import {
  loadSettings,
  normalizeSettings,
  saveSettings,
  type SngSettings,
} from './settings'

interface Props {
  open: boolean
  onClose: () => void
  onImport?: (settings: SngSettings) => void
}

export const SettingsModal: FC<Props> = ({ open, onClose, onImport }) => {
  const [text, setText] = useState('')
  const [status, setStatus] = useState<{
    text: string
    error?: boolean
  } | null>(null)

  useEffect(() => {
    if (!open) return
    setText(JSON.stringify(loadSettings(), null, 2))
    setStatus(null)
  }, [open])

  const handleImport = () => {
    try {
      const parsed = JSON.parse(text)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Root must be a JSON object')
      }
      const normalized = normalizeSettings(parsed as SngSettings)
      saveSettings(normalized)
      setText(JSON.stringify(normalized, null, 2))
      onImport?.(normalized)
      setStatus({ text: 'Settings saved.' })
      setTimeout(() => setStatus(null), 2000)
    } catch (err) {
      setStatus({
        text: err instanceof Error ? err.message : String(err),
        error: true,
      })
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="SNG Settings">
      <textarea
        className={styles.textarea}
        placeholder={`{
  "bases": {
    "QQ-001a": { "currency": "ICA", "owner": "Alice" }
  },
  "prices": {
    "FLX": 1200,
    "BMF": 400
  }
}`}
        value={text}
        onChange={e => setText(e.target.value)}
        spellCheck={false}
      />
      <div className={styles.footer}>
        {status && (
          <span
            className={`${styles.status} ${status.error ? styles.statusError : styles.statusOk}`}
          >
            {status.text}
          </span>
        )}
        <button type="button" className={styles.import} onClick={handleImport}>
          Import
        </button>
      </div>
    </Modal>
  )
}
