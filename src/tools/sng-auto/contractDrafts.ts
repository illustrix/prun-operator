import { STR } from '../../utils/constants'
import { getElementWithText } from '../../utils/selector'
import type { Tile } from '../../utils/tile'

export interface ContractDraftRow {
  name: string
  status: string
  created: string
  row: HTMLTableRowElement
  viewButton: HTMLButtonElement | null
}

// Parse the draft list rendered by the CONTD tile. Table columns are:
//   Name | Status | Created | Cmds (View / copy / delete)
// The Name cell wraps the text in a `[class*="Link__link"]` span; every
// other cell is plain text. `viewButton` is the first button labeled
// "View" inside the Cmds cell.
export const parseContractDraftTable = (tile: Tile): ContractDraftRow[] => {
  const table = tile.el.querySelector('table')
  if (!table) return []

  const rows: ContractDraftRow[] = []
  for (const tr of table.querySelectorAll<HTMLTableRowElement>('tbody > tr')) {
    const cells = tr.children
    const cellName = cells[0]
    const cellStatus = cells[1]
    const cellCreated = cells[2]
    const cellCmds = cells[3]
    if (!cellName || !cellStatus || !cellCreated || !cellCmds) continue

    const nameEl = cellName.querySelector('[class*="Link__link"]') ?? cellName
    const name = nameEl.textContent.trim()
    if (!name) continue

    const viewButton =
      getElementWithText<HTMLButtonElement>(
        cellCmds,
        'button',
        STR.VIEW,
        true,
      ) ?? null

    rows.push({
      name,
      status: cellStatus.textContent.trim(),
      created: cellCreated.textContent.trim(),
      row: tr,
      viewButton,
    })
  }
  return rows
}
