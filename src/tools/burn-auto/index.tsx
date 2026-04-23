import { type CSSProperties, useMemo, useState } from 'react'
import { Modal } from '../../components/Modal'
import { assert } from '../../utils/assert'
import { getAddressCode } from '../../utils/game'
import { waitForElement } from '../../utils/selector'
import { xitActTemplate } from '../../utils/xit-act'
import type { AutoSetContractConfig } from '../auto-set-contract'
import { useTool } from '../base/context'
import { Tool } from '../base/tool'

export interface BurnRow {
  ticker: string
  inventory: number
  burn: number
  need: number
  days: number
}

const triggerButtonStyle: CSSProperties = {
  padding: '2px 8px',
  backgroundColor: '#2563eb',
  color: 'white',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
}

const actionButtonStyle: CSSProperties = {
  padding: '4px 10px',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  color: 'white',
}

const fieldRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 12,
}

const inputStyle: CSSProperties = {
  width: 80,
  padding: '4px 6px',
  borderRadius: 4,
  border: '1px solid #4b5563',
  backgroundColor: '#111827',
  color: '#f3f4f6',
}

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  marginBottom: 12,
  fontSize: 12,
}

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '4px 8px',
  borderBottom: '1px solid #374151',
  color: '#9ca3af',
  fontWeight: 500,
}

const tdStyle: CSSProperties = {
  padding: '4px 8px',
  borderBottom: '1px solid #1f2937',
}

const numTdStyle: CSSProperties = {
  ...tdStyle,
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
}

interface NeededItem {
  ticker: string
  inventory: number
  gross: number
  amount: number
}

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

const formatNumber = (n: number): string =>
  n.toLocaleString('en-US', { maximumFractionDigits: 2 })

const ActionModal = () => {
  const tool = useTool<BurnAuto>()
  const [open, setOpen] = useState(false)
  const [days, setDays] = useState(4)
  const [includeInventory, setIncludeInventory] = useState(false)
  const [rows, setRows] = useState<BurnRow[]>([])

  const [status, setStatus] = useState<{
    text: string
    error?: boolean
  } | null>(null)

  const needed = useMemo(
    () => computeNeeded(rows, days, includeInventory),
    [rows, days, includeInventory],
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
        style={triggerButtonStyle}
        onClick={() => {
          setRows(tool.parseTable())
          setOpen(true)
        }}
      >
        Auto Provision
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Burn Auto">
        <div style={fieldRowStyle}>
          <label htmlFor="burn-auto-days">Days:</label>
          <input
            id="burn-auto-days"
            type="number"
            min={1}
            style={inputStyle}
            value={days}
            onChange={e => setDays(Number(e.target.value))}
          />
        </div>
        <div style={fieldRowStyle}>
          <label>
            <input
              type="checkbox"
              checked={includeInventory}
              onChange={e => setIncludeInventory(e.target.checked)}
            />{' '}
            Include Inventory
          </label>
        </div>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Ticker</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Inv</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Burn × Days</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Needed</th>
            </tr>
          </thead>
          <tbody>
            {needed.length === 0 ? (
              <tr>
                <td style={{ ...tdStyle, color: '#9ca3af' }} colSpan={4}>
                  Nothing needed.
                </td>
              </tr>
            ) : (
              needed.map(item => (
                <tr key={item.ticker}>
                  <td style={tdStyle}>{item.ticker}</td>
                  <td style={numTdStyle}>{formatNumber(item.inventory)}</td>
                  <td style={numTdStyle}>{formatNumber(item.gross)}</td>
                  <td style={{ ...numTdStyle, fontWeight: 600 }}>
                    {formatNumber(item.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div>
          <span
            style={{
              color: '#9ca3af',
              fontSize: 12,
              marginBottom: 8,
              display: 'block',
            }}
          >
            NOTE: Change the CX when using the XIT ACT.
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          {status && (
            <span
              style={{
                marginRight: 'auto',
                fontSize: 12,
                color: status.error ? '#f87171' : '#34d399',
              }}
            >
              {status.text}
            </span>
          )}
          <button
            type="button"
            style={{ ...actionButtonStyle, backgroundColor: '#28a745' }}
            onClick={() => runCopy('XIT ACT', () => tool.copyXitAct(needed))}
          >
            Copy XIT ACT
          </button>
          <button
            type="button"
            style={{ ...actionButtonStyle, backgroundColor: '#17a2b8' }}
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

export class BurnAuto extends Tool {
  protected address?: string
  protected rows: BurnRow[] = []

  override match() {
    const address = this.tile.cmd.split(' ').pop()
    assert(address, 'Address not found in tile command')
    const addressCode = getAddressCode(address, true)
    assert(addressCode, 'Failed to parse address code')
    this.address = addressCode
  }

  override render() {
    return <ActionModal />
  }

  protected override getContainer() {
    return waitForElement(this.tile.el, '[class*="ComExOrdersPanel__filter"]')
  }

  override async attach() {
    await super.attach()
    this.rootElement?.style.setProperty('display', 'flex')
    this.rootElement?.style.setProperty('justify-content', 'flex-end')
  }

  async copyXitAct(items: NeededItem[]) {
    const materials: Record<string, number> = {}
    for (const item of items) {
      materials[item.ticker] = item.amount
    }
    const [firstGroup] = xitActTemplate.groups
    assert(firstGroup, 'xit act template has no group')
    const config = {
      ...xitActTemplate,
      groups: [{ ...firstGroup, materials }],
    }
    await navigator.clipboard.writeText(JSON.stringify(config))
  }

  async copyBuyContract(items: NeededItem[]) {
    assert(this.address, 'address not found')
    const config: AutoSetContractConfig = {
      template: 'BUY',
      currency: 'ICA',
      location: this.address,
      items: items.map(item => ({
        commodity: item.ticker,
        amount: item.amount,
        price: 1,
      })),
    }
    await navigator.clipboard.writeText(JSON.stringify(config, null, 2))
  }

  parseTable(): BurnRow[] {
    const table = this.tile.el.querySelector('table')
    assert(table, 'burn table not found')

    const parseNumber = (text: string | null): number => {
      if (!text) return Number.NaN
      const clean = text.trim().replace(/,/g, '').replace(/^\+/, '')
      if (clean === '∞') return Number.POSITIVE_INFINITY
      return Number.parseFloat(clean)
    }

    const rows: BurnRow[] = []
    for (const tbody of table.querySelectorAll('tbody')) {
      // Skip the "fake" aggregate tbody (workforce totals) shown above planets.
      if (tbody.className.includes('rp-BURN__fakeRow')) continue

      for (const tr of tbody.querySelectorAll(':scope > tr')) {
        // Skip planet header rows (they hold the planet name + BS/INV buttons).
        if (tr.className.includes('rp-PlanetHeader')) continue

        const cells = tr.children
        if (cells.length < 5) continue

        const label = cells[0]?.querySelector('[class*="ColoredIcon__label"]')
        if (!label) continue
        const ticker = label.textContent.trim()
        if (!ticker) continue

        const inventory = parseNumber(cells[1]?.textContent ?? null)
        const burn = parseNumber(cells[2]?.textContent ?? null)
        const need = parseNumber(cells[3]?.textContent ?? null)
        const days = parseNumber(cells[4]?.textContent ?? null)
        if ([inventory, burn, need, days].some(n => Number.isNaN(n))) continue

        rows.push({ ticker, inventory, burn, need, days })
      }
    }
    return rows
  }
}
