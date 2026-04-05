import { assert } from '../utils/assert'
import { STR } from '../utils/constants'
import {
  getButtonWithText,
  getElementWithText,
  waitForElement,
} from '../utils/selector'
import { simulateClick, simulateInput, simulateSelect } from '../utils/simulate'
import { sleep } from '../utils/sleep'

interface AutoSetContractConfig {
  template: string
  currency: string
  location: string
  items: {
    commodity: string
    amount: number
    price: number
  }[]
}

export async function autoSetContract(
  tile: Element,
  config: AutoSetContractConfig,
) {
  const selectTemplateButton = getButtonWithText(tile, STR.SELECT_TEMPLATE)
  assert(selectTemplateButton, 'Select Template button not found')
  selectTemplateButton.click()
  await sleep(50)
  const templateSelectContainer = tile.querySelector(
    'div[class*="TemplateSelection__templateTypeSelect"]',
  )
  assert(templateSelectContainer, 'Template select not found')
  const templateSelect = templateSelectContainer.querySelector('select')
  assert(templateSelect, 'Template select element not found')
  simulateSelect(templateSelect, config.template)
  await sleep(50)
  const currencySelect = tile.querySelector<HTMLSelectElement>(
    'select[name="currency"]',
  )
  assert(currencySelect, 'Currency select not found')
  simulateSelect(currencySelect, config.currency)
  await sleep(50)

  const addCommodityButton = getButtonWithText(tile, STR.ADD_COMMODITY)
  assert(addCommodityButton, 'Add Commodity button not found')
  // assert it already has one commodity row
  for (let i = 1; i < config.items.length; i++) {
    addCommodityButton.click()
    await sleep(50)
  }
  for (let i = 0; i < config.items.length; i++) {
    const item = config.items[i]
    assert(item, `Item ${i} not found in config`)
    const amountInput = tile.querySelector<HTMLInputElement>(
      `input[name="trades[${i}].amount"]`,
    )
    assert(amountInput, `Amount input for item ${i} not found`)
    simulateInput(amountInput, `${item.amount}`)
    await sleep(50)
    const commodityLabel = tile.querySelector(
      `label[for="trades[${i}].material"]`,
    )
    assert(commodityLabel, `Commodity label for item ${i} not found`)
    assert(
      commodityLabel.parentNode,
      `Commodity label parent for item ${i} not found`,
    )
    const commodityInput = commodityLabel.parentNode.querySelector('input')
    assert(commodityInput, `Commodity input for item ${i} not found`)
    commodityInput.focus()
    await sleep(50)
    simulateInput(commodityInput, item.commodity)
    await sleep(50)
    const listItem = await waitForElement(
      commodityLabel.parentNode,
      'ul[role="listbox"] li',
      1000,
    )
    simulateClick(listItem)
    await sleep(50)

    const priceInput = tile.querySelector<HTMLInputElement>(
      `input[name="trades[${i}].pricePerUnit"]`,
    )
    assert(priceInput, `Price input for item ${i} not found`)
    simulateInput(priceInput, `${item.price}`)
    await sleep(50)
  }
  const locationLabel = tile.querySelector(`label[for="location"]`)
  assert(locationLabel, `Location label not found`)
  const locationInput = locationLabel.parentNode?.querySelector('input')
  assert(locationInput, `Location input not found`)
  locationInput.focus()
  await sleep(50)
  simulateInput(locationInput, config.location)
  await sleep(500)
  const locationResultSection = getElementWithText(
    document,
    'div[class*="AddressSelector__sectionContainer"]',
    STR.SEARCH_RESULTS,
  )
  assert(locationResultSection, 'Location result not found')
  const locationResult = locationResultSection.querySelector('ul li')
  assert(locationResult, 'Location result item not found')
  simulateClick(locationResult)

  await sleep(50)
  const applyButton = getButtonWithText(tile, STR.APPLY_TEMPLATE)
  assert(applyButton, 'Apply Template button not found')
  applyButton.click()
  await sleep(200)

  const actionField = tile.querySelectorAll('div[class*="Draft__form"')
  assert(actionField[1], 'Action field not found')
  const saveButton = getButtonWithText(actionField[1], STR.SAVE)
  assert(saveButton, 'Save button not found')
  saveButton.click()
}
