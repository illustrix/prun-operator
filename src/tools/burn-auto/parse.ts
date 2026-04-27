import { getAddressCode } from '../../utils/game'
import type { Tile } from '../../utils/tile'

export interface BurnRow {
  ticker: string
  inventory: number
  burn: number
  need: number
  days: number
}

export const getBurnAddress = (tile: Tile) => {
  const address = tile.cmd.split(' ').pop()
  if (!address) return
  return getAddressCode(address, true)
}

const parseNumber = (text: string | null): number => {
  if (!text) return Number.NaN
  const clean = text.trim().replace(/,/g, '').replace(/^\+/, '')
  if (clean === '∞') return Number.POSITIVE_INFINITY
  return Number.parseFloat(clean)
}

export const parseBurnTable = (tile: Tile): BurnRow[] => {
  const table = tile.el.querySelector('table')
  if (!table) return []

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

// true if any consumed material is projected to run out within `threshold` days.
export const hasLowSupply = (rows: BurnRow[], threshold = 3): boolean => {
  return rows.some(
    row =>
      Number.isFinite(row.burn) &&
      row.burn < 0 &&
      Number.isFinite(row.days) &&
      row.days < threshold,
  )
}

// true if any produced material has accumulated more than `threshold` days
// worth of output in inventory (i.e. ready to ship out).
export const hasSurplusOutput = (rows: BurnRow[], threshold = 2): boolean => {
  return rows.some(
    row =>
      Number.isFinite(row.burn) &&
      row.burn > 0 &&
      Number.isFinite(row.inventory) &&
      row.inventory > row.burn * threshold,
  )
}

// smallest `days` among consumed rows — how soon the most critical supply
// depletes. null if no finite consumption row exists.
export const minSupplyDays = (rows: BurnRow[]): number | null => {
  let min = Number.POSITIVE_INFINITY
  for (const row of rows) {
    if (!Number.isFinite(row.burn) || row.burn >= 0) continue
    if (!Number.isFinite(row.days)) continue
    if (row.days < min) min = row.days
  }
  return Number.isFinite(min) ? min : null
}

// largest inventory-over-production-rate among produced rows — how many
// days of output are sitting in inventory for the most-accumulated item.
// null if no finite production row exists.
export const maxOutputDays = (rows: BurnRow[]): number | null => {
  let max = Number.NEGATIVE_INFINITY
  for (const row of rows) {
    if (!Number.isFinite(row.burn) || row.burn <= 0) continue
    if (!Number.isFinite(row.inventory)) continue
    const d = row.inventory / row.burn
    if (d > max) max = d
  }
  return Number.isFinite(max) ? max : null
}

export const BALANCE_MIN_DAYS = 2
export const BALANCE_REFILL_DAYS = 4

export interface NeededItem {
  ticker: string
  inventory: number
  gross: number
  amount: number
}

// Fixed policy: buy `days` worth of every consumed material (optionally
// netting current inventory).
export const computeNeeded = (
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
export const computeBalanced = (
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
