import { waitForElement } from '../../utils/selector'
import { getAllTiles, type Tile } from '../../utils/tile'
import type { AutoSetContractConfig } from '../auto-set-contract'
import { Tool } from '../base/tool'
import {
  BALANCE_MIN_DAYS,
  BALANCE_REFILL_DAYS,
  computeBalanced,
  getBurnAddress,
  hasLowSupply,
  hasSurplusOutput,
  maxOutputDays,
  minSupplyDays,
  parseBurnTable,
} from '../burn-auto/parse'
import { loadSettings } from './settings'
import { SngModal } from './SngModal'

const DEFAULT_CURRENCY = 'ICA'

export interface SngBase {
  address: string
  name?: string
  needsSupply: boolean
  needsSubmit: boolean
  supplyDays: number | null
  outputDays: number | null
}

const findBurnTile = (address: string): Tile | undefined => {
  return getAllTiles().find(
    t =>
      t.cmd.toUpperCase().startsWith('XIT BURN ') &&
      getBurnAddress(t) === address,
  )
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
    const tile = findBurnTile(base.address)
    if (!tile) {
      console.warn('autoSupply: no XIT BURN tile for', base.address)
      return
    }
    const rows = parseBurnTable(tile)
    const items = computeBalanced(rows, BALANCE_MIN_DAYS, BALANCE_REFILL_DAYS)
    if (items.length === 0) {
      console.log('autoSupply: nothing needed for', base.address)
      return
    }
    const settings = loadSettings()
    const currency =
      settings.bases?.[base.address]?.currency ?? DEFAULT_CURRENCY
    const config: AutoSetContractConfig = {
      template: 'BUY',
      currency,
      location: base.address,
      items: items.map(item => ({
        commodity: item.ticker,
        amount: item.amount,
        price: 1,
      })),
    }
    // TODO: drive the draft / submit flow with `config`
    console.log('autoSupply: contract config prepared', config)
  }

  async autoSubmit(base: SngBase): Promise<void> {
    // TODO: drive the submit flow (export surplus output as sell contract)
    console.log('SngAutoTool.autoSubmit', base)
  }
}
