import { type FC, type ReactNode, useState } from 'react'
import { assert } from '../utils/assert'
import { STR } from '../utils/constants'
import { getAddressCode } from '../utils/game'
import type { AutoSetContractConfig, ContractItem } from './auto-set-contract'
import { useTool } from './base/context'
import { Tool } from './base/tool'

const CopyButton: FC<{
  getItems: () => ContractItem[]
  title: string
  bgColor: string
}> = ({ getItems, title, bgColor }) => {
  const tool = useTool<CopySellContractTool>()
  const [ok, setOk] = useState(NaN)
  const [error, setError] = useState<string>()

  return (
    <button
      type="button"
      style={{
        marginLeft: 10,
        padding: '2px 6px',
        backgroundColor: error ? '#dc3545' : bgColor,
        color: 'white',
        border: 'none',
        borderRadius: 4,
        cursor: 'pointer',
      }}
      onClick={async () => {
        try {
          const items = getItems()
          await tool.copyContract(items)
          setOk(items.length)
        } catch (err: unknown) {
          console.error('Copy sell contract failed', err)
          if (err instanceof Error) {
            setError(err.message)
          }
        } finally {
          setTimeout(() => {
            setOk(NaN)
            setError(undefined)
          }, 2000)
        }
      }}
    >
      {error ? `Copy Failed: ${error}` : ok ? `Copied ${ok} items!` : title}
    </button>
  )
}

export class CopySellContractTool extends Tool {
  protected copyButton?: HTMLButtonElement
  protected copySelectedButton?: HTMLButtonElement
  protected location?: string
  protected locationLabel?: Element

  override match(): boolean {
    const locationLabel = this.tile.querySelector(
      '[class*="StoreView__capacity"]',
    )
    if (!locationLabel) return false
    const location = getAddressCode(locationLabel.textContent.trim())
    if (!location) return false
    this.locationLabel = locationLabel
    this.location = location
    return true
  }

  override getContainer() {
    return this.locationLabel?.parentNode as Element
  }

  override render(): ReactNode {
    return (
      <div>
        <CopyButton
          getItems={() => this.getContractItems()}
          title="Copy Sell Contract"
          bgColor="#28a745"
        />
        <CopyButton
          getItems={() => this.getSelectedContractItems()}
          title="Copy Selected"
          bgColor="#17a2b8"
        />
      </div>
    )
  }

  protected getContractItem(item: Element): ContractItem {
    const label = item.querySelector('[class*="ColoredIcon__labelContainer"]')
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
    return {
      commodity,
      amount,
      price: 0, // price needs to be filled in manually
    }
  }

  protected getContractItems(): ContractItem[] {
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

        items.push(this.getContractItem(item))
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

  protected getSelectedContractItems(): ContractItem[] {
    const inventoryGrid = this.tile.querySelector(
      '[class*="InventoryView__grid"]',
    )
    assert(inventoryGrid, 'must be grid view')
    const items: ContractItem[] = []

    for (const item of inventoryGrid.children) {
      const classes = [...item.classList]
      const isItem = classes.some(cls =>
        cls.startsWith('GridItemView__container'),
      )
      if (!isItem) continue
      const iconMarker = item.querySelector(
        '[class*="rp-IconMarker__container"]',
      )
      assert(iconMarker, 'Refined PrUn is not active')
      const icon = iconMarker.querySelector('[class*="rp-font-awesome__solid"]')
      const hasIcon = !!icon
      if (hasIcon) {
        const contractItem = this.getContractItem(item)
        contractItem.price = 1
        items.push(contractItem)
      }
    }

    assert(items.length > 0, 'no selected items found')

    return items
  }

  async copyContract(items: ContractItem[]) {
    assert(this.location, 'location not found')
    const config: AutoSetContractConfig = {
      template: 'SELL',
      currency: 'ICA',
      location: this.location,
      items,
    }
    // copy config to clipboard as JSON string, so user can paste it in auto set contract tool
    await navigator.clipboard.writeText(JSON.stringify(config, null, 2))
  }
}
