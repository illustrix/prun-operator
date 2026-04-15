import { assert } from '../utils/assert'
import { STR } from '../utils/constants'
import { getAddressCode } from '../utils/game'
import type { AutoSetContractConfig, ContractItem } from './auto-set-contract'

export class CopySellContractTool {
  protected copyButton?: HTMLButtonElement
  protected location?: string

  constructor(private tile: Element) {}

  attach() {
    const locationLabel = this.tile.querySelector(
      '[class*="StoreView__capacity"]',
    )
    if (!locationLabel) return
    const location = getAddressCode(locationLabel.textContent.trim())
    if (!location) return
    this.location = location
    const copyButton = document.createElement('button')
    this.copyButton = copyButton
    copyButton.textContent = 'Copy Sell Contract'
    copyButton.style =
      'margin-left: 10px; padding: 2px 6px; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;'
    copyButton.addEventListener('click', async () => {
      try {
        await this.copyContract()
        copyButton.textContent = 'Copied!'
      } catch (err: unknown) {
        console.error('Copy sell contract failed', err)
        if (err instanceof Error) {
          copyButton.textContent = `Copy Failed: ${err.message}`
        }
      } finally {
        setTimeout(() => {
          copyButton.textContent = 'Copy Sell Contract'
        }, 2000)
      }
    })
    locationLabel.parentNode?.appendChild(copyButton)
  }

  protected getContractItems() {
    const inventoryGrid = this.tile.querySelector(
      '[class*="InventoryView__grid"]',
    )
    assert(inventoryGrid, 'must be grid view')
    const items: ContractItem[] = []

    let state = ''

    for (const item of inventoryGrid.children) {
      const classes = [...item.classList]
      const isSectionHeader = classes.some(cls =>
        cls.startsWith('SectionHeader__container'),
      )
      if (state === 'copying') {
        // add items until next section header
        if (isSectionHeader) {
          break
        }

        const label = item.querySelector(
          '[class*="ColoredIcon__labelContainer"]',
        )
        assert(label, 'item label not found')
        const commodity = label.textContent.trim()
        const amountElement = item.querySelector(
          '[class*="MaterialIcon__indicatorContainer"',
        )
        assert(amountElement, `${commodity} amount element not found`)
        const amount = parseInt(
          amountElement.textContent.trim().replace(/,/g, ''),
          10,
        )
        items.push({
          commodity,
          amount,
          price: 0, // price needs to be filled in manually
        })
      } else {
        if (isSectionHeader) {
          const headerText = item.textContent.trim()
          if (STR.OUTPUTS.some(str => headerText.includes(str))) {
            state = 'copying'
          }
        }
      }
    }

    assert(state === 'copying', 'outputs section not found')

    return items
  }

  async copyContract() {
    assert(this.location, 'location not found')
    const config: AutoSetContractConfig = {
      template: 'SELL',
      currency: 'ICA',
      location: this.location,
      items: this.getContractItems(),
    }
    // copy config to clipboard as JSON string, so user can paste it in auto set contract tool
    await navigator.clipboard.writeText(JSON.stringify(config, null, 2))
  }
}
