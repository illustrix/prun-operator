import * as Rx from 'rxjs'
import { assert } from '../utils/assert'
import { STR } from '../utils/constants'
import { getStationCodeFromName } from '../utils/game'
import { getElementWithText } from '../utils/selector'
import { simulateClick, simulateDrag } from '../utils/simulate'
import { sleep, waitFor } from '../utils/sleep'
import {
  $tile,
  closeTile,
  getTileCmd,
  waitForTile,
  waitForTileCmd,
} from '../utils/tile'

export class AutoFuel {
  locationElement?: Element | null
  fuelField?: Element | null

  constructor(private tile: Element) {}

  attach() {
    const fields = this.tile.querySelectorAll(
      '[class*="FormComponent__containerPassive"]',
    )

    for (const field of fields) {
      const label = field.querySelector('label')
      if (label) {
        if (STR.LOCATION.includes(label.textContent.trim())) {
          this.locationElement = field.querySelector('[class*="Link__link"]')
        } else if (STR.FUEL.includes(label.textContent.trim())) {
          this.fuelField = field.querySelector(
            '[class*="FormComponent__input"]',
          )
        }
      }
    }

    assert(this.fuelField, 'Fuel field not found')
    assert(this.locationElement, 'Location element not found')

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
    await sleep(100)
    simulateClick(fuelContainer)

    const shipFuelTile = await Rx.firstValueFrom(
      $tile.pipe(
        Rx.filter(
          tile => getTileCmd(tile) === `SHPF ${flightId}`.toUpperCase(),
        ),
      ),
    )
    console.log('Auto fuel: Ship fuel tile opened')
    assert(this.locationElement, 'Location element not found')
    await sleep(100)
    simulateClick(this.locationElement)

    const stationName = this.locationElement.textContent.trim()
    const stationCode = getStationCodeFromName(stationName)

    const stationTile = await waitForTileCmd(`STNS ${stationCode}`)

    console.log('Auto fuel: Station tile opened')
    const warehouseButton = await waitFor(() =>
      getElementWithText(
        stationTile,
        'span[class*="Link__link"]',
        STR.WAREHOUSE,
      ),
    )
    assert(warehouseButton, 'Warehouse button not found in origin tile')
    await sleep(100)
    simulateClick(warehouseButton)

    const warehouseTile = await waitForTileCmd(`WAR ${stationCode}`)

    console.log('Auto fuel: Warehouse tile opened')
    const autoStoreButton = await waitFor(() =>
      getElementWithText(
        warehouseTile,
        'button[class*="Button__inline"]',
        STR.OPEN_STORE,
      ),
    )
    assert(autoStoreButton, 'Auto store button not found in warehouse tile')
    await sleep(100)
    simulateClick(autoStoreButton)

    const inventoryTile = await waitForTile(tile => {
      const cmd = getTileCmd(tile)
      return cmd.startsWith('INV') && tile.innerHTML.includes(stationName)
    })

    console.log('Auto fuel: Inventory tile opened')

    await sleep(100)

    const shipFuelColumn = shipFuelTile.querySelectorAll(
      '[class*="ShipFuelInventory__column"]',
    )

    for (const column of shipFuelColumn) {
      const materialContainer = column.querySelector(
        '[class*="MaterialIcon__container"]',
      )
      if (!materialContainer) continue
      const materialNameLabel = materialContainer.querySelector(
        '[class*="ColoredIcon__label"]',
      )
      if (!materialNameLabel) continue
      const materialName = materialNameLabel.textContent.trim()
      const indicator = materialContainer.querySelector(
        '[class*="MaterialIcon__indicator"]',
      )
      if (!indicator) continue
      const indicatorText = indicator.textContent.trim()
      const [currentStr, maxStr] = indicatorText.split('/')
      if (!currentStr || !maxStr) continue
      if (currentStr === maxStr) continue // already full

      const source = getElementWithText(
        inventoryTile,
        '[class*="MaterialIcon__container"]',
        [materialName],
      )
      if (!source) {
        console.warn(
          `Material ${materialName} not found in inventory, skipping`,
        )
        continue
      }
      const { drop, end } = simulateDrag(source)
      await sleep(100)
      const target = getElementWithText(
        column,
        '[class*="DropTargetView__item"]',
        STR.MAX,
      )
      if (target) {
        drop(target)
        await sleep(100)
      } else {
        end()
        console.warn(
          `Max button not found for material ${materialName}, skipping`,
        )
      }
    }

    await sleep(100)

    closeTile(stationTile)
    await sleep(50)
    closeTile(warehouseTile)
    await sleep(50)
    closeTile(inventoryTile)
    await sleep(50)
    closeTile(shipFuelTile)
    await sleep(50)
  }
}
