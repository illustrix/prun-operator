import { type FC, useState } from 'react'
import { Modal } from '../../components/Modal'
import { useTool } from '../base/context'
import type { SngAutoTool, SngBase } from './index'
import { SettingsModal } from './SettingsModal'
import styles from './SngModal.module.css'

const formatDays = (days: number | null): string =>
  days === null
    ? '–'
    : days >= 100
      ? '99d+'
      : `${days.toFixed(days < 10 ? 1 : 0)}d`

const DaysCell: FC<{ supply: number | null; output: number | null }> = ({
  supply,
  output,
}) => (
  <span className={styles.days}>
    <span className={supply === null ? styles.daysMuted : undefined}>
      {formatDays(supply)}
    </span>
    <span className={styles.daysSeparator}>/</span>
    <span className={output === null ? styles.daysMuted : undefined}>
      {formatDays(output)}
    </span>
  </span>
)

const ActionButton: FC<{
  flag: boolean
  warnLabel: string
  okLabel: string
  hoverLabel: string
  onAction: () => void | Promise<void>
}> = ({ flag, warnLabel, okLabel, hoverLabel, onAction }) => {
  const [busy, setBusy] = useState(false)
  const [hovered, setHovered] = useState(false)
  const label = busy
    ? '…'
    : hovered
      ? hoverLabel
      : flag
        ? warnLabel
        : okLabel
  return (
    <button
      type="button"
      className={`${styles.action} ${flag ? styles.actionWarn : styles.actionOk}`}
      disabled={busy}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={async () => {
        setBusy(true)
        try {
          await onAction()
        } catch (err) {
          console.error('SNG action failed', err)
        } finally {
          setBusy(false)
        }
      }}
    >
      {label}
    </button>
  )
}

export const SngModal: FC = () => {
  const tool = useTool<SngAutoTool>()
  const [open, setOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [bases, setBases] = useState<SngBase[]>([])

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => {
          setBases(tool.collectBases())
          setOpen(true)
        }}
      >
        SNG Auto
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="SNG Bases">
        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.toolbarBtn}
            onClick={() => setSettingsOpen(true)}
          >
            Settings
          </button>
        </div>
        <div className={styles.description}>
          <p>
            <strong>Supply</strong>: flagged if any consumed material is
            projected to run out within 3 days. Click to run auto-supply.
          </p>
          <p>
            <strong>Submit</strong>: flagged if any produced material has more
            than 2 days of output in inventory. Click to run auto-submit.
          </p>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Base</th>
              <th className={styles.th}>Days (supply / output)</th>
              <th className={styles.th}>Supply</th>
              <th className={styles.th}>Submit</th>
            </tr>
          </thead>
          <tbody>
            {bases.length === 0 ? (
              <tr>
                <td className={styles.emptyCell} colSpan={4}>
                  No SNG bases detected.
                </td>
              </tr>
            ) : (
              bases.map(b => (
                <tr key={b.address}>
                  <td className={styles.td}>
                    {b.name ? (
                      <>
                        {b.name}
                        <span className={styles.address}>{b.address}</span>
                      </>
                    ) : (
                      b.address
                    )}
                  </td>
                  <td className={styles.td}>
                    <DaysCell supply={b.supplyDays} output={b.outputDays} />
                  </td>
                  <td className={styles.td}>
                    <ActionButton
                      flag={b.needsSupply}
                      warnLabel="Need Supply"
                      okLabel="OK"
                      hoverLabel="Auto Supply"
                      onAction={() => tool.autoSupply(b)}
                    />
                  </td>
                  <td className={styles.td}>
                    <ActionButton
                      flag={b.needsSubmit}
                      warnLabel="Need Submit"
                      okLabel="OK"
                      hoverLabel="Auto Submit"
                      onAction={() => tool.autoSubmit(b)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Modal>
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  )
}
