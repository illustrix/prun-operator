import { assert } from '../../utils/assert'
import { waitForElement } from '../../utils/selector'
import { xitActTemplate } from '../../utils/xit-act'
import type { AutoSetContractConfig } from '../auto-set-contract'
import { Tool } from '../base/tool'
import { ActionModal } from './ActionModal'
import { type BurnRow, getBurnAddress, parseBurnTable } from './parse'

export type { BurnRow } from './parse'

export interface NeededItem {
  ticker: string
  inventory: number
  gross: number
  amount: number
}

export class BurnAuto extends Tool {
  protected address?: string
  protected rows: BurnRow[] = []

  override match() {
    const address = getBurnAddress(this.tile)
    assert(address, 'Failed to parse burn tile address')
    this.address = address
  }

  override render() {
    return <ActionModal />
  }

  protected override getContainer() {
    return waitForElement(this.tile.el, '[class*="ComExOrdersPanel__filter"]')
  }

  override async attach() {
    await super.attach()
    this.rootElement?.style.setProperty('display', 'flex')
    this.rootElement?.style.setProperty('justify-content', 'flex-end')
  }

  async copyXitAct(items: NeededItem[]) {
    const materials: Record<string, number> = {}
    for (const item of items) {
      materials[item.ticker] = item.amount
    }
    const [firstGroup] = xitActTemplate.groups
    assert(firstGroup, 'xit act template has no group')
    const config = {
      ...xitActTemplate,
      groups: [{ ...firstGroup, materials }],
    }
    await navigator.clipboard.writeText(JSON.stringify(config))
  }

  async copyBuyContract(items: NeededItem[]) {
    assert(this.address, 'address not found')
    const config: AutoSetContractConfig = {
      template: 'BUY',
      currency: 'ICA',
      location: this.address,
      items: items.map(item => ({
        commodity: item.ticker,
        amount: item.amount,
        price: 1,
      })),
    }
    await navigator.clipboard.writeText(JSON.stringify(config, null, 2))
  }

  parseTable(): BurnRow[] {
    return parseBurnTable(this.tile)
  }
}
