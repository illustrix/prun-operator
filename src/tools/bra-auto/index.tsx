import { assert } from '../../utils/assert'
import { waitForElement } from '../../utils/selector'
import type { Station } from '../../utils/stations'
import { xitActTemplate } from '../../utils/xit-act'
import { Tool } from '../base/tool'
import { CopyButton } from './CopyButton'
import { type BraMaterial, parseBraMaterials } from './parse'

export type { BraMaterial } from './parse'

export class BuildingRepairAssistantAuto extends Tool {
  override render() {
    return <CopyButton />
  }

  protected override async getContainer() {
    // append our row inside the form list (the ScrollView__view that
    // wraps every FormComponent row).
    const firstRow = await waitForElement(
      this.tile.el,
      '[class*="FormComponent__container"]',
    )
    return firstRow.parentElement ?? undefined
  }

  override async attach() {
    await super.attach()
    if (!this.rootElement) return
    // copy a sibling form-row's class names so our row picks up the
    // game's grid layout (label column + input column).
    const sibling = this.tile.el.querySelector(
      '[class*="FormComponent__containerActive"]',
    )
    if (sibling) this.rootElement.className = sibling.className
  }

  parseMaterials(): BraMaterial[] {
    return parseBraMaterials(this.tile)
  }

  async copyXitAct(items: BraMaterial[], station: Station) {
    const materials: Record<string, number> = {}
    for (const item of items) {
      materials[item.ticker] = item.amount
    }
    const [firstGroup] = xitActTemplate.groups
    assert(firstGroup, 'xit act template has no group')
    const config = {
      ...xitActTemplate,
      actions: xitActTemplate.actions.map(action => {
        if (action.type === 'CX Buy')
          return { ...action, exchange: station.code }
        if (action.type === 'MTRA')
          return { ...action, origin: station.warehouse }
        return action
      }),
      groups: [{ ...firstGroup, materials }],
    }
    await navigator.clipboard.writeText(JSON.stringify(config))
  }
}
