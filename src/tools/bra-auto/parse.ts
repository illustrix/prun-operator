import type { Tile } from '../../utils/tile'

export interface BraMaterial {
  ticker: string
  amount: number
}

export const parseBraMaterials = (tile: Tile): BraMaterial[] => {
  const list = tile.el.querySelector('[class*="MaterialList__container"]')
  if (!list) return []

  const items: BraMaterial[] = []
  for (const icon of list.querySelectorAll('[class*="MaterialIcon__container"]')) {
    const ticker = icon
      .querySelector('[class*="ColoredIcon__label"]')
      ?.textContent.trim()
    if (!ticker) continue
    const amountText = icon
      .querySelector('[class*="MaterialIcon__indicator"]')
      ?.textContent.trim()
    const amount = Number.parseInt(amountText?.replace(/,/g, '') ?? '', 10)
    if (!Number.isFinite(amount) || amount <= 0) continue
    items.push({ ticker, amount })
  }
  return items
}
