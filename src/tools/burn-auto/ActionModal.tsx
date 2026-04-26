import { type FC, useMemo, useState } from 'react'
import { Modal } from '../../components/Modal'
import { useTool } from '../base/context'
import styles from './ActionModal.module.css'
import type { BurnAuto } from './index'
import {
  BALANCE_MIN_DAYS,
  BALANCE_REFILL_DAYS,
  type BurnRow,
  computeBalanced,
  computeNeeded,
} from './parse'

type Mode = 'fixed' | 'balance'

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

  // Track deselected tickers so the default ("all selected") needs no
  // initialization. Toggles persist across needed-list changes.
  const [deselected, setDeselected] = useState<Set<string>>(new Set())

  const filtered = useMemo(
    () => needed.filter(item => !deselected.has(item.ticker)),
    [needed, deselected],
  )
  const allSelected = needed.length > 0 && filtered.length === needed.length
  const someSelected = filtered.length > 0 && filtered.length < needed.length

  const toggleAll = () => {
    setDeselected(
      allSelected ? new Set(needed.map(i => i.ticker)) : new Set(),
    )
  }
  const toggleOne = (ticker: string) => {
    setDeselected(prev => {
      const next = new Set(prev)
      if (next.has(ticker)) next.delete(ticker)
      else next.add(ticker)
      return next
    })
  }

  const runCopy = async (label: string, fn: () => Promise<void>) => {
    if (filtered.length === 0) {
      setStatus({ text: 'Nothing to copy.', error: true })
    } else {
      try {
        await fn()
        setStatus({ text: `${label} copied (${filtered.length} items)` })
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
              <th className={styles.checkboxCell}>
                <input
                  type="checkbox"
                  aria-label="Toggle all"
                  checked={allSelected}
                  ref={el => {
                    if (el) el.indeterminate = someSelected
                  }}
                  onChange={toggleAll}
                />
              </th>
              <th className={styles.th}>Ticker</th>
              <th className={styles.thRight}>Inv</th>
              <th className={styles.thRight}>Target</th>
              <th className={styles.thRight}>Needed</th>
            </tr>
          </thead>
          <tbody>
            {needed.length === 0 ? (
              <tr>
                <td className={styles.emptyCell} colSpan={5}>
                  Nothing needed.
                </td>
              </tr>
            ) : (
              needed.map(item => (
                <tr key={item.ticker}>
                  <td className={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      aria-label={`Include ${item.ticker}`}
                      checked={!deselected.has(item.ticker)}
                      onChange={() => toggleOne(item.ticker)}
                    />
                  </td>
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
            onClick={() => runCopy('XIT ACT', () => tool.copyXitAct(filtered))}
          >
            Copy XIT ACT
          </button>
          <button
            type="button"
            className={`${styles.action} ${styles.actionBuy}`}
            onClick={() =>
              runCopy('Buying contract', () => tool.copyBuyContract(filtered))
            }
          >
            Copy Buying Contract
          </button>
        </div>
      </Modal>
    </>
  )
}
