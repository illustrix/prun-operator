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
  onAction: (dryRun: boolean) => void | Promise<void>
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
      onClick={async e => {
        // Hold ⌘ (Command) to dry-run: fill + save the draft but don't send.
        const dryRun = e.metaKey
        setBusy(true)
        try {
          await onAction(dryRun)
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
  const [confirmSendOpen, setConfirmSendOpen] = useState(false)
  const [bases, setBases] = useState<SngBase[]>([])
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState<string | null>(null)
  const [progress, setProgress] = useState<{
    current: number
    total: number
  } | null>(null)

  useEffect(() => {
    const stepSub = tool.step$.subscribe(setStep)
    const progressSub = tool.progress$.subscribe(setProgress)
    return () => {
      stepSub.unsubscribe()
      progressSub.unsubscribe()
    }
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
          <p>
            <strong>Dry run</strong>: hold <strong>⌘ (Command)</strong> while
            clicking Supply or Submit to fill and save the draft without sending
            it, so you can review it first.
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
                      onAction={dryRun =>
                        runAction(() => tool.autoSupply(b, dryRun))
                      }
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
                      onAction={dryRun =>
                        runAction(() => tool.autoSubmit(b, dryRun))
                      }
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
            className={`${styles.fullAutoBtn} ${styles.fullAutoWarnBtn}`}
            onClick={() => setConfirmSendOpen(true)}
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
      <ConfirmModal
        open={confirmSendOpen}
        title="Auto Send Contract"
        variant="warn"
        confirmLabel="Run Auto Send"
        message={
          <>
            <p>
              This fills, saves, and <strong>sends</strong> a contract for every
              base that needs supply or submit, skipping ones with a matching
              contract already in progress.
            </p>
            <p style={{ marginTop: 8 }}>
              Sent contracts go to each base's configured owner. Review prices
              and recipients in Settings first — to check a single draft without
              sending, hold <strong>⌘ (Command)</strong> on its Supply / Submit
              button instead.
            </p>
            <p style={{ marginTop: 8 }}>Continue?</p>
          </>
        }
        onCancel={() => setConfirmSendOpen(false)}
        onConfirm={() => {
          setConfirmSendOpen(false)
          runAction(() => tool.autoSendAll())
        }}
      />
      <LoadingOverlay open={busy} step={step} progress={progress}>
        <div>Auto executing. Please do not interact with the page.</div>
        <div>If it seems stuck, refresh the page.</div>
      </LoadingOverlay>
    </>
  )
}
