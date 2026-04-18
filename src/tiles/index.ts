import type { Class } from 'type-fest'
import type { Tool } from '../tools/base/tool'
import { BurnAuto } from '../tools/burn-auto'
import { CopySellContractTool } from '../tools/copy-sell-contract'
import { $tile, getTileCmd } from '../utils/tile'
import { enhanceContractDraftTile } from './contract-draft-tile'
import { enhanceContractTile } from './contract-tile'
import { enhanceFlightControlTile } from './flight-control-tile'

type TileEnhanceMethod = (tile: Element) => void

const tileMap: Record<string, TileEnhanceMethod | Class<Tool>> = {
  CONTD: enhanceContractDraftTile,
  CONT: enhanceContractTile,
  SFC: enhanceFlightControlTile,
  INV: CopySellContractTool,
  'XIT BURN': BurnAuto,
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

const toolMaps = new Map<Element, Tool>()

const isTool = (obj: unknown): obj is Class<Tool> => {
  return (
    typeof obj === 'function' &&
    'isTool' in obj &&
    (obj as { isTool: boolean }).isTool === true
  )
}

const attachTool = (tool: Tool, tile: Element) => {
  if (!tool.match()) {
    console.log('tool match failed', tile, tool)
  }
  const ok = tool.attach()
  if (!ok) {
    console.log('tool attach failed', tile, tool)
  }
  toolMaps.set(tile, tool)
}

async function processTile(tile: Element) {
  if (tile.hasAttribute(PROCESSED_ATTR)) return

  $tile.next(tile)

  const tileEnhanceMethod = getTileEnhanceMethod(tile)
  if (!tileEnhanceMethod) return

  try {
    if (isTool(tileEnhanceMethod)) {
      const tool = new tileEnhanceMethod(tile)
      attachTool(tool, tile)
    } else {
      tileEnhanceMethod(tile)
    }
  } catch (e: unknown) {
    console.warn('failed to enhance', tile, e)
  }

  // just do once. but our created elements may be removed. perhaps we need to
  // monitor that. for now it's fine.
  tile.setAttribute(PROCESSED_ATTR, 'true')
}

export function scanTiles() {
  document.querySelectorAll('[class*="Tile__tile"]').forEach(processTile)

  for (const [tile, tool] of toolMaps) {
    if (!document.contains(tile)) {
      tool.cleanup()
      toolMaps.delete(tile)
    }
  }
}
