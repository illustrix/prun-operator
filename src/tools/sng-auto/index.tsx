import { assert } from '../../utils/assert'
import { Tool } from '../base/tool'

export class SngAutoTool extends Tool {
  override match() {
    const container = this.tile.querySelector('[class*="ActionBar__container"]')
    assert(container, 'Action bar container not found')
    this.container = container
  }
}
