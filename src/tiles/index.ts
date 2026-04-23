import type { Class } from 'type-fest'
import type { Tool } from '../tools/base/tool'
import { BurnAuto } from '../tools/burn-auto'
import { CopySellContractTool } from '../tools/copy-sell-contract'
import { SngAutoTool } from '../tools/sng-auto'
import { XitAutoTool } from '../tools/xit-auto'
import { $tile, getTileCmd } from '../utils/tile'
import { enhanceContractDraftTile } from './contract-draft-tile'
import { enhanceContractTile } from './contract-tile'
import { enhanceFlightControlTile } from './flight-control-tile'

type TileEnhanceMethod = (tile: Element) => void
type TileEnhance = TileEnhanceMethod | Class<Tool>
type TileEnhanceValue = TileEnhance | TileEnhance[]

const tileMap: Record<string, TileEnhanceValue> = {
  '^CONTD$': SngAutoTool,
  '^CONTD ': enhanceContractDraftTile,
  '^CONT ': enhanceContractTile,
  '^SFC ': enhanceFlightControlTile,
  '^INV ': CopySellContractTool,
  '^XIT BURN ': BurnAuto,
  '^XIT ACT_': XitAutoTool,
}

function getTileEnhance(tile: Element) {
  const tileCmd = getTileCmd(tile).toUpperCase()
  for (const cmd in tileMap) {
    const re = new RegExp(cmd, 'i')
    const match = tileCmd.match(re)
    if (match) {
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
  try {
    tool.match()
  } catch (e) {
    console.warn('tool match failed', tile, tool, e)
    return
  }

  try {
    tool.attach()
  } catch (e) {
    console.error('tool attach failed', tile, tool, e)
    return
  }
  toolMaps.set(tile, tool)
}

const enhanceTile = (tile: Element, enhance: TileEnhance) => {
  if (isTool(enhance)) {
    const tool = new enhance(tile)
    attachTool(tool, tile)
    return
  }

  try {
    enhance(tile)
  } catch (e: unknown) {
    console.warn('failed to enhance', tile, enhance, e)
  }
}

const applyEnhance = (tile: Element, enhance: TileEnhanceValue) => {
  if (Array.isArray(enhance)) {
    for (const item of enhance) {
      applyEnhance(tile, item)
    }
    return
  }
  enhanceTile(tile, enhance)
}

async function processTile(tile: Element) {
  if (tile.hasAttribute(PROCESSED_ATTR)) return

  $tile.next(tile)

  const tileEnhance = getTileEnhance(tile)
  if (!tileEnhance) return

  applyEnhance(tile, tileEnhance)

  // just do once. but our created elements may be removed. perhaps we need to
  // monitor that. for now it's fine.
  tile.setAttribute(PROCESSED_ATTR, 'true')
}

export function scanTiles() {
  document.querySelectorAll('[class*="TileFrame__frame"]').forEach(processTile)

  for (const [tile, tool] of toolMaps) {
    if (!document.contains(tile)) {
      tool.cleanup()
      toolMaps.delete(tile)
    }
  }
}
