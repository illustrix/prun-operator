import { type FC, useEffect, useState } from 'react'
import { ConfirmModal } from '../../components/ConfirmModal'
import { LoadingOverlay } from '../../components/LoadingOverlay'
import { Modal } from '../../components/Modal'
import { showToast } from '../../components/Toast'
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
  inProgress?: boolean
  onAction: () => void | Promise<void>
}> = ({ flag, warnLabel, okLabel, hoverLabel, inProgress, onAction }) => {
  const [busy, setBusy] = useState(false)
  const [hovered, setHovered] = useState(false)
  const label = busy ? '…' : hovered ? hoverLabel : flag ? warnLabel : okLabel
  const colorClass = inProgress
    ? styles.actionInProgress
    : flag
      ? styles.actionWarn
      : styles.actionOk
  return (
    <button
      type="button"
      className={`${styles.action} ${colorClass}`}
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
  const [confirmFulfillOpen, setConfirmFulfillOpen] = useState(false)
  const [bases, setBases] = useState<SngBase[]>([])
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState<string | null>(null)

  useEffect(() => {
    const sub = tool.step$.subscribe(setStep)
    return () => sub.unsubscribe()
  }, [tool])

  const runAction = async (fn: () => Promise<void>) => {
    setBusy(true)
    try {
      await fn()
    } catch (err) {
      console.error('SNG action failed', err)
    } finally {
      setBases(tool.collectBases())
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => {
          setBases(tool.collectBases())
          setOpen(true)
          tool
            .checkExistingContracts()
            .then(() => setBases(tool.collectBases()))
            .catch(err => console.error('SNG pre-check failed', err))
        }}
      >
        SNG Auto
      </button>
      <Modal
        open={open}
        hidden={busy}
        onClose={() => setOpen(false)}
        title="SNG Bases"
      >
        <div className={styles.description}>
          <p>
            <strong>How it works</strong>: open the XIT BURN tile for each base
            you want to manage; the tool will auto-detect them here.
          </p>
          <p>
            <strong>Supply</strong>: flagged if any consumed material is
            projected to run out within 3 days. Click to run auto-supply.
          </p>
          <p>
            <strong>Submit</strong>: flagged if any produced material has more
            than 2 days of output in inventory. Click to run auto-submit.
          </p>
          <p className={styles.testing}>In testing — feedback welcome.</p>
        </div>
        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.toolbarBtn}
            onClick={() => setSettingsOpen(true)}
          >
            Settings
          </button>
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
                      warnLabel={
                        b.existingSupply ? 'In Progress' : 'Need Supply'
                      }
                      okLabel={b.existingSupply ? 'In Progress' : 'OK'}
                      hoverLabel="Auto Supply"
                      inProgress={!!b.existingSupply}
                      onAction={() => runAction(() => tool.autoSupply(b))}
                    />
                  </td>
                  <td className={styles.td}>
                    <ActionButton
                      flag={b.needsSubmit}
                      warnLabel={
                        b.existingSubmit ? 'In Progress' : 'Need Submit'
                      }
                      okLabel={b.existingSubmit ? 'In Progress' : 'OK'}
                      hoverLabel="Auto Submit"
                      inProgress={!!b.existingSubmit}
                      onAction={() => runAction(() => tool.autoSubmit(b))}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className={styles.footer}>
          <button
            type="button"
            className={`${styles.fullAutoBtn} ${styles.fullAutoWarnBtn}`}
            onClick={() => setConfirmFulfillOpen(true)}
          >
            Auto Fulfill
          </button>
          <button
            type="button"
            className={styles.fullAutoBtn}
            disabled
            title="Not yet implemented"
            onClick={() => runAction(() => tool.autoSendAll())}
          >
            Auto Send Contract
          </button>
        </div>
      </Modal>
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <ConfirmModal
        open={confirmFulfillOpen}
        title="Auto Fulfill"
        variant="warn"
        confirmLabel="Run Auto Fulfill"
        message={
          <>
            <p>
              Auto Fulfill does <strong>not</strong> verify contract terms
              (price, quantity, counterparty).
            </p>
            <p style={{ marginTop: 8 }}>
              Not recommended if you manage contracts on behalf of others — a
              malicious or mistaken contract will be fulfilled blindly.
            </p>
            <p style={{ marginTop: 8 }}>Continue?</p>
          </>
        }
        onCancel={() => setConfirmFulfillOpen(false)}
        onConfirm={() => {
          setConfirmFulfillOpen(false)
          runAction(() => tool.autoFulfillAll())
        }}
      />
      <LoadingOverlay open={busy} step={step}>
        <div>Auto executing. Please do not interact with the page.</div>
        <div>If it seems stuck, refresh the page.</div>
      </LoadingOverlay>
    </>
  )
}
