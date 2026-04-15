import { CopySellContractTool } from '../tools/copy-sell-contract'

export function enhanceInventoryTile(tile: Element) {
  const copySellContractTool = new CopySellContractTool(tile)
  copySellContractTool.attach()
}
