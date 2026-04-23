import { type FC, useMemo, useState } from 'react'
import { Modal } from '../../components/Modal'
import { useTool } from '../base/context'
import styles from './ActionModal.module.css'
import type { BurnAuto, BurnRow, NeededItem } from './index'

const BALANCE_MIN_DAYS = 2
const BALANCE_REFILL_DAYS = 4

type Mode = 'fixed' | 'balance'

const computeNeeded = (
  rows: BurnRow[],
  days: number,
  includeInventory: boolean,
): NeededItem[] => {
  const items: NeededItem[] = []
  for (const row of rows) {
    if (!Number.isFinite(row.burn) || row.burn >= 0) continue
    const gross = Math.abs(row.burn) * days
    const amount = includeInventory ? Math.max(0, gross - row.inventory) : gross
    if (amount <= 0) continue
    items.push({
      ticker: row.ticker,
      inventory: row.inventory,
      gross,
      amount: Math.ceil(amount),
    })
  }
  return items
}

// Balance policy: keep every consumed material between `minDays` and
// `minDays + refillDays` days of supply.
//   • days > minDays + refillDays : skip (over-stocked)
//   • days < minDays               : buy refillDays worth
//   • otherwise                    : top up to (minDays + refillDays) days
const computeBalanced = (
  rows: BurnRow[],
  minDays: number,
  refillDays: number,
): NeededItem[] => {
  const items: NeededItem[] = []
  const targetDays = minDays + refillDays
  for (const row of rows) {
    if (!Number.isFinite(row.burn) || row.burn >= 0) continue
    if (!Number.isFinite(row.days)) continue
    if (row.days > targetDays) continue

    const consumption = -row.burn
    const amount =
      row.days < minDays
        ? refillDays * consumption
        : targetDays * consumption - row.inventory
    if (amount <= 0) continue
    items.push({
      ticker: row.ticker,
      inventory: row.inventory,
      gross: targetDays * consumption,
      amount: Math.ceil(amount),
    })
  }
  return items
}

const formatNumber = (n: number): string =>
  n.toLocaleString('en-US', { maximumFractionDigits: 2 })

export const ActionModal: FC = () => {
  const tool = useTool<BurnAuto>()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('fixed')
  const [days, setDays] = useState(4)
  const [includeInventory, setIncludeInventory] = useState(false)
  const [rows, setRows] = useState<BurnRow[]>([])

  const [status, setStatus] = useState<{
    text: string
    error?: boolean
  } | null>(null)

  const needed = useMemo(
    () =>
      mode === 'fixed'
        ? computeNeeded(rows, days, includeInventory)
        : computeBalanced(rows, BALANCE_MIN_DAYS, BALANCE_REFILL_DAYS),
    [mode, rows, days, includeInventory],
  )

  const runCopy = async (label: string, fn: () => Promise<void>) => {
    if (needed.length === 0) {
      setStatus({ text: 'Nothing to copy.', error: true })
    } else {
      try {
        await fn()
        setStatus({ text: `${label} copied (${needed.length} items)` })
      } catch (err) {
        console.error(`${label} failed`, err)
        setStatus({
          text: err instanceof Error ? err.message : String(err),
          error: true,
        })
      }
    }
    setTimeout(() => setStatus(null), 2000)
  }

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => {
          setRows(tool.parseTable())
          setOpen(true)
        }}
      >
        Auto Provision
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Burn Auto">
        <div className={styles.fieldRow}>
          <span>Mode:</span>
          <label>
            <input
              type="radio"
              name="burn-auto-mode"
              checked={mode === 'fixed'}
              onChange={() => setMode('fixed')}
            />{' '}
            Fixed
          </label>
          <label>
            <input
              type="radio"
              name="burn-auto-mode"
              checked={mode === 'balance'}
              onChange={() => setMode('balance')}
            />{' '}
            Auto Balance
          </label>
        </div>
        {mode === 'fixed' ? (
          <>
            <div className={styles.fieldRow}>
              <label htmlFor="burn-auto-days">Days:</label>
              <input
                id="burn-auto-days"
                type="number"
                min={1}
                className={styles.input}
                value={days}
                onChange={e => setDays(Number(e.target.value))}
              />
            </div>
            <div className={styles.fieldRow}>
              <label>
                <input
                  type="checkbox"
                  checked={includeInventory}
                  onChange={e => setIncludeInventory(e.target.checked)}
                />{' '}
                Include Inventory
              </label>
            </div>
          </>
        ) : (
          <div className={styles.note}>
            Below {BALANCE_MIN_DAYS} days of supply, buy {BALANCE_REFILL_DAYS}{' '}
            days worth. Between {BALANCE_MIN_DAYS} and{' '}
            {BALANCE_MIN_DAYS + BALANCE_REFILL_DAYS} days, top up to{' '}
            {BALANCE_MIN_DAYS + BALANCE_REFILL_DAYS} days. Above{' '}
            {BALANCE_MIN_DAYS + BALANCE_REFILL_DAYS} days, skip.
          </div>
        )}
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Ticker</th>
              <th className={styles.thRight}>Inv</th>
              <th className={styles.thRight}>Target</th>
              <th className={styles.thRight}>Needed</th>
            </tr>
          </thead>
          <tbody>
            {needed.length === 0 ? (
              <tr>
                <td className={styles.emptyCell} colSpan={4}>
                  Nothing needed.
                </td>
              </tr>
            ) : (
              needed.map(item => (
                <tr key={item.ticker}>
                  <td className={styles.td}>{item.ticker}</td>
                  <td className={styles.numTd}>
                    {formatNumber(item.inventory)}
                  </td>
                  <td className={styles.numTd}>{formatNumber(item.gross)}</td>
                  <td className={`${styles.numTd} ${styles.numTdBold}`}>
                    {formatNumber(item.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div>
          <span className={styles.note}>
            NOTE: Change the CX when using the XIT ACT.
          </span>
        </div>
        <div className={styles.footer}>
          {status && (
            <span
              className={`${styles.status} ${status.error ? styles.statusError : styles.statusOk}`}
            >
              {status.text}
            </span>
          )}
          <button
            type="button"
            className={`${styles.action} ${styles.actionXit}`}
            onClick={() => runCopy('XIT ACT', () => tool.copyXitAct(needed))}
          >
            Copy XIT ACT
          </button>
          <button
            type="button"
            className={`${styles.action} ${styles.actionBuy}`}
            onClick={() =>
              runCopy('Buying contract', () => tool.copyBuyContract(needed))
            }
          >
            Copy Buying Contract
          </button>
        </div>
      </Modal>
    </>
  )
}
