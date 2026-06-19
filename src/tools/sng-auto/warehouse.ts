import { getAddressCode, normalizeAddress } from '../../utils/game'
import { getAllTiles } from '../../utils/tile'
import type { BurnRow } from '../burn-auto/parse'

// Warehouse stock for a single location: upper-cased ticker -> quantity.
export type WarehouseStock = Map<string, number>

// Parse a quantity label off a grid item indicator. Values are shown with
// thousands separators ("13,862") and may be abbreviated ("1.2k", "3.4M").
const parseAmount = (text: string | null | undefined): number => {
  if (!text) return Number.NaN
  const clean = text.trim().replace(/,/g, '')
  const m = clean.match(/^([\d.]+)\s*([kMGT])?$/i)
  if (!m?.[1]) return Number.parseFloat(clean)
  const n = Number.parseFloat(m[1])
  const mult = { k: 1e3, m: 1e6, g: 1e9, t: 1e12 }[m[2]?.toLowerCase() ?? ''] ?? 1
  return n * mult
}

// Parse the grid rendered by an INV tile into a ticker -> quantity map.
// Each `GridItemView__container` holds a ColoredIcon (ticker label) and a
// MaterialIcon indicator (quantity). Duplicate tickers are summed.
const parseInventoryGrid = (root: Element): WarehouseStock => {
  const stock: WarehouseStock = new Map()
  for (const item of root.querySelectorAll('[class*="GridItemView__container"]')) {
    const label = item.querySelector('[class*="ColoredIcon__label"]')
    const ticker = label?.textContent.trim().toUpperCase()
    if (!ticker) continue
    const indicator = item.querySelector('[class*="MaterialIcon__indicator"]')
    const amount = parseAmount(indicator?.textContent)
    if (!Number.isFinite(amount)) continue
    stock.set(ticker, (stock.get(ticker) ?? 0) + amount)
  }
  return stock
}

// Read the warehouse contents for `address` so auto supply can count them
// toward existing reserves (otherwise it only sees on-site inventory from
// the BURN tile). Returns null when no matching INV tile is open.
export const getWarehouseStock = (address: string): WarehouseStock | null => {
  const normalized = normalizeAddress(address)
  if (!normalized) return null
  // A base has two INV tiles at the same address: base storage (BS) and
  // warehouse (WAR). Pick the warehouse by its title, then confirm the
  // location via the StoreView capacity label (the address isn't in the
  // cmd — same source CopySellContractTool reads).
  const tile = getAllTiles().find(t => {
    if (!t.matchCmd('^INV ')) return false
    if (!t.title.toUpperCase().includes('WAR')) return false
    const label = t.el.querySelector('[class*="StoreView__capacity"]')
    if (!label) return false
    return normalizeAddress(getAddressCode(label.textContent.trim(), true)) === normalized
  })
  if (!tile) return null
  return parseInventoryGrid(tile.el)
}

// Fold warehouse quantities into each row's `inventory` so downstream
// balance/needed math treats warehouse stock as already-held reserves.
// Rows without a matching warehouse entry are returned unchanged.
export const applyWarehouseStock = (
  rows: BurnRow[],
  stock: WarehouseStock,
): BurnRow[] =>
  rows.map(row => {
    const extra = stock.get(row.ticker.toUpperCase())
    return extra ? { ...row, inventory: row.inventory + extra } : row
  })
