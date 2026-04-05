import * as Rx from 'rxjs'
import { assert } from '../utils/assert'
import { STR } from '../utils/constants'
import { getAddressCode } from '../utils/game'
import { getElementWithText } from '../utils/selector'
import { simulateClick } from '../utils/simulate'
import { sleep, waitFor } from '../utils/sleep'
import {
  $tile,
  closeTile,
  getTileCmd,
  waitForTile,
  waitForTileCmd,
} from '../utils/tile'

export class AutoFuel {
  originElement?: Element | null
  fuelField?: Element | null

  constructor(private tile: Element) {}

  attach() {
    const fields = this.tile.querySelectorAll(
      '[class*="FormComponent__containerPassive"]',
    )

    for (const field of fields) {
      const label = field.querySelector('label')
      if (label) {
        if (STR.ORIGIN.includes(label.textContent.trim())) {
          this.originElement = field.querySelector('[class*="Link__link"]')
        } else if (STR.FUEL.includes(label.textContent.trim())) {
          this.fuelField = field.querySelector(
            '[class*="FormComponent__input"]',
          )
        }
      }
    }

    assert(this.fuelField, 'Fuel field not found')
    assert(this.originElement, 'Origin element not found')

    const autoRefuelButton = document.createElement('button')
    autoRefuelButton.textContent = 'Auto Fuel'
    autoRefuelButton.style =
      'margin-left: 10px; padding: 2px 6px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;'
    autoRefuelButton.addEventListener('click', async () => {
      try {
        await this.run()
      } catch (err: unknown) {
        console.error('Auto fuel failed', err)
      }
    })
    this.fuelField.insertBefore(autoRefuelButton, this.fuelField.firstChild)
  }

  async run() {
    const cmd = getTileCmd(this.tile)
    const flightId = cmd.split(' ')[1]
    assert(flightId, 'Flight ID not found in tile command')

    const fuelContainer = this.tile.querySelector(
      '[class*="ShipFuel__container"]',
    )
    assert(fuelContainer, 'Fuel container not found')

    simulateClick(fuelContainer)

    const shipFuelTile = await Rx.firstValueFrom(
      $tile.pipe(
        Rx.filter(
          tile => getTileCmd(tile) === `SHPF ${flightId}`.toUpperCase(),
        ),
      ),
    )
    console.log('Auto fuel: Ship fuel tile opened')
    assert(this.originElement, 'Origin element not found')
    simulateClick(this.originElement)

    const addressCode = getAddressCode(this.originElement.textContent.trim())
    assert(addressCode, 'Address code not found in origin element')

    const originTile = await waitForTileCmd(`PLI ${addressCode}`)

    console.log('Auto fuel: Origin tile opened')
    const warehouseButton = await waitFor(() =>
      getElementWithText(
        originTile,
        'span[class*="Link__link"]',
        STR.WAREHOUSE,
      ),
    )
    assert(warehouseButton, 'Warehouse button not found in origin tile')
    simulateClick(warehouseButton)

    const warehouseTile = await waitForTileCmd(`WAR ${addressCode}`)

    console.log('Auto fuel: Warehouse tile opened')
    const autoStoreButton = await waitFor(() =>
      getElementWithText(
        warehouseTile,
        'button[class*="Button__inline"]',
        STR.OPEN_STORE,
      ),
    )
    assert(autoStoreButton, 'Auto store button not found in warehouse tile')
    simulateClick(autoStoreButton)

    const inventoryTile = await waitForTile(tile => {
      const cmd = getTileCmd(tile)
      return cmd.startsWith('INV') && tile.innerHTML.includes(addressCode)
    })

    console.log('Auto fuel: Inventory tile opened')

    await sleep(1000) // FIXME: move fuel

    closeTile(originTile)
    closeTile(warehouseTile)
    closeTile(inventoryTile)
    closeTile(shipFuelTile)
  }
}
