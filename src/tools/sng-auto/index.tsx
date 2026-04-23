import { waitForElement } from '../../utils/selector'
import { getAllTiles } from '../../utils/tile'
import { Tool } from '../base/tool'
import {
  getBurnAddress,
  hasLowSupply,
  hasSurplusOutput,
  maxOutputDays,
  minSupplyDays,
  parseBurnTable,
} from '../burn-auto/parse'
import { SngModal } from './SngModal'

export interface SngBase {
  address: string
  name?: string
  needsSupply: boolean
  needsSubmit: boolean
  supplyDays: number | null
  outputDays: number | null
}

export class SngAutoTool extends Tool {
  override match() {}

  protected override getContainer() {
    return waitForElement(this.tile.el, '[class*="ActionBar__container"]')
  }

  override render() {
    return <SngModal />
  }

  collectBases(): SngBase[] {
    const bases: SngBase[] = []
    for (const tile of getAllTiles()) {
      if (!tile.cmd.toUpperCase().startsWith('XIT BURN ')) continue
      const address = getBurnAddress(tile)
      if (!address) continue
      const rows = parseBurnTable(tile)
      bases.push({
        address,
        name: tile.title.split('-').pop()?.trim() || undefined,
        needsSupply: hasLowSupply(rows),
        needsSubmit: hasSurplusOutput(rows),
        supplyDays: minSupplyDays(rows),
        outputDays: maxOutputDays(rows),
      })
    }
    return bases
  }

  async autoSupply(base: SngBase): Promise<void> {
    // TODO: drive the supply flow (open draft, fill, submit, etc.)
    console.log('SngAutoTool.autoSupply', base)
  }

  async autoSubmit(base: SngBase): Promise<void> {
    // TODO: drive the submit flow (export surplus output as sell contract)
    console.log('SngAutoTool.autoSubmit', base)
  }
}
