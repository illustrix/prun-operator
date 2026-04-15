import { $tile, getTileCmd } from '../utils/tile'
import { enhanceContractDraftTile } from './contract-draft-tile'
import { enhanceContractTile } from './contract-tile'
import { enhanceFlightControlTile } from './flight-control-tile'
import { enhanceInventoryTile } from './inventory-tile'

const tileMap: Record<string, (tile: Element) => void> = {
  CONTD: enhanceContractDraftTile,
  CONT: enhanceContractTile,
  SFC: enhanceFlightControlTile,
  INV: enhanceInventoryTile,
}

function getTileEnhanceMethod(tile: Element) {
  const tileCmd = getTileCmd(tile)
  for (const cmd in tileMap) {
    if (cmd === tileCmd || tileCmd.startsWith(`${cmd} `)) {
      return tileMap[cmd]
    }
  }
}

const PROCESSED_ATTR = 'data-prun-operator'

function processTile(tile: Element) {
  if (tile.hasAttribute(PROCESSED_ATTR)) return

  $tile.next(tile)

  const tileEnhanceMethod = getTileEnhanceMethod(tile)
  if (!tileEnhanceMethod) return

  try {
    tileEnhanceMethod(tile)
  } catch (e: unknown) {
    console.warn('failed to enhance', tile, e)
  }

  // just do once. but our created elements may be removed. perhaps we need to
  // monitor that. for now it's fine.
  tile.setAttribute(PROCESSED_ATTR, 'true')
}

export function scanTiles() {
  document.querySelectorAll('[class*="Tile__tile"]').forEach(processTile)
}
