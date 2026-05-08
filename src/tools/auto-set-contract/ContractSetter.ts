import {
  awaitActionConfirmation,
  awaitActionFeedback,
} from '../../utils/action-feedback'
import { assert } from '../../utils/assert'
import { STR } from '../../utils/constants'
import {
  findFormComponentByLabel,
  getButtonWithText,
  getElementWithText,
  waitForElement,
} from '../../utils/selector'
import {
  simulateClick,
  simulateInput,
  simulateSelect,
} from '../../utils/simulate'
import { sleep, waitFor } from '../../utils/sleep'
import type { Tile } from '../../utils/tile'
import type { AutoSetContractConfig } from './types'

const STEP_DELAY = 50
const SEARCH_DELAY = 500

export interface ContractSetterOptions extends AutoSetContractConfig {
  autoSave?: boolean
  autoSend?: boolean
  recipient?: string
  // Rename the draft to this when set. Callers decide whether the current
  // name is acceptable; if `name` is provided, we always rewrite it.
  name?: string
  onStep?: (step: string) => void
}

export class ContractSetter {
  constructor(
    public tile: Tile,
    public config: ContractSetterOptions,
  ) {}

  protected get el(): Element {
    return this.tile.el
  }

  protected step(label: string) {
    this.config.onStep?.(label)
  }

  async run(): Promise<void> {
    if (this.config.name) {
      this.step('Applying name')
      await this.applyName()
    }
    this.step('Applying template')
    await this.applyTemplate()
    this.step('Applying currency')
    await this.applyCurrency()
    this.step('Adding commodity rows')
    await this.ensureItemRows()
    const total = this.config.items.length
    for (let i = 0; i < total; i++) {
      this.step(`Filling item ${i + 1} / ${total}`)
      await this.applyItem(i)
    }
    this.step('Applying location')
    await this.applyLocation()
    if (this.config.autoSave) {
      this.step('Saving draft')
      await this.saveDraft()
    }
    if (this.config.recipient) {
      this.step('Applying recipient')
      await this.applyRecipient()
    }
    if (this.config.autoSend) {
      this.step('Sending draft')
      await this.sendDraft()
    }
  }

  // The Name field lives in the first Draft__form (header form) — there's
  // no `name` attribute or `for` on the label, so we match by the label
  // span's text. Typing into the input enables that form's own Save button,
  // which we click to commit the rename.
  async applyName(): Promise<void> {
    if (!this.config.name) return
    const firstDraftForm = this.el.querySelector('[class*="Draft__form"]')
    assert(firstDraftForm, 'First draft form not found')
    const nameContainer = findFormComponentByLabel(firstDraftForm, 'Name')
    assert(nameContainer, 'Name form component not found')
    const nameInput = nameContainer.querySelector<HTMLInputElement>(
      'input[type="text"]',
    )
    assert(nameInput, 'Name input not found')
    nameInput.focus()
    await sleep(STEP_DELAY)
    simulateInput(nameInput, this.config.name)
    await sleep(STEP_DELAY)
    const saveButton = getButtonWithText(firstDraftForm, STR.SAVE)
    assert(saveButton, 'Save button in header form not found')
    simulateClick(saveButton)
    await sleep(STEP_DELAY)
    await awaitActionFeedback(this.el, 5000)
  }

  async applyTemplate(): Promise<void> {
    const selectTemplateButton = getButtonWithText(this.el, STR.SELECT_TEMPLATE)
    assert(selectTemplateButton, 'Select Template button not found')
    selectTemplateButton.click()
    await sleep(STEP_DELAY)

    const templateSelectContainer = this.el.querySelector(
      'div[class*="TemplateSelection__templateTypeSelect"]',
    )
    assert(templateSelectContainer, 'Template select not found')
    const templateSelect = templateSelectContainer.querySelector('select')
    assert(templateSelect, 'Template select element not found')
    simulateSelect(templateSelect, this.config.template)
    await sleep(STEP_DELAY)
  }

  async applyCurrency(): Promise<void> {
    const currencySelect = this.el.querySelector<HTMLSelectElement>(
      'select[name="currency"]',
    )
    assert(currencySelect, 'Currency select not found')
    simulateSelect(currencySelect, this.config.currency)
    await sleep(STEP_DELAY)
  }

  // the form starts with one commodity row; add the rest by clicking the
  // "add commodity" button (itemCount - 1) times.
  async ensureItemRows(): Promise<void> {
    const addCommodityButton = getButtonWithText(this.el, STR.ADD_COMMODITY)
    assert(addCommodityButton, 'Add Commodity button not found')
    for (let i = 1; i < this.config.items.length; i++) {
      addCommodityButton.click()
      await sleep(STEP_DELAY)
    }
  }

  async applyItem(index: number): Promise<void> {
    const item = this.config.items[index]
    assert(item, `Item ${index} not found in config`)

    const amountInput = this.el.querySelector<HTMLInputElement>(
      `input[name="trades[${index}].amount"]`,
    )
    assert(amountInput, `Amount input for item ${index} not found`)
    simulateInput(amountInput, `${item.amount}`)
    await sleep(STEP_DELAY)

    const commodityLabel = this.el.querySelector(
      `label[for="trades[${index}].material"]`,
    )
    assert(commodityLabel, `Commodity label for item ${index} not found`)
    assert(
      commodityLabel.parentNode,
      `Commodity label parent for item ${index} not found`,
    )
    const commodityInput = commodityLabel.parentNode.querySelector('input')
    assert(commodityInput, `Commodity input for item ${index} not found`)
    commodityInput.focus()
    await sleep(STEP_DELAY)
    simulateInput(commodityInput, item.commodity)
    await sleep(STEP_DELAY)
    const listItem = await waitForElement(
      commodityLabel.parentNode,
      'ul[role="listbox"] li',
      1000,
    )
    simulateClick(listItem)
    await sleep(STEP_DELAY)

    const priceInput = this.el.querySelector<HTMLInputElement>(
      `input[name="trades[${index}].pricePerUnit"]`,
    )
    assert(priceInput, `Price input for item ${index} not found`)
    simulateInput(priceInput, `${item.price}`)
    await sleep(STEP_DELAY)
  }

  async applyLocation(): Promise<void> {
    const locationLabel = this.el.querySelector('label[for="location"]')
    assert(locationLabel, 'Location label not found')
    const locationInput = locationLabel.parentNode?.querySelector('input')
    assert(locationInput, 'Location input not found')
    locationInput.focus()
    await sleep(STEP_DELAY)
    simulateInput(locationInput, this.config.location)
    const locationResultSection = await waitFor(() => {
      return getElementWithText(
        document,
        'div[class*="AddressSelector__sectionContainer"]',
        STR.SEARCH_RESULTS,
      )
    })
    await sleep(SEARCH_DELAY)
    assert(locationResultSection, 'Location result not found')
    const locationResult = locationResultSection.querySelector('ul li')
    assert(locationResult, 'Location result item not found')
    simulateClick(locationResult)
    await sleep(STEP_DELAY)
    const staticInputs = this.el.querySelectorAll(
      'div[class*="StaticInput__static"]',
    )
    assert(
      staticInputs.length >= 2,
      'Static inputs not found after location selection',
    )
    const totalPriceField = staticInputs[1]
    assert(totalPriceField, 'Total price field not found')
    simulateClick(totalPriceField) // defocus to trigger any onBlur handlers
    await sleep(STEP_DELAY)
  }

  async saveDraft(): Promise<void> {
    await sleep(STEP_DELAY)
    const applyButton = getButtonWithText(this.el, STR.APPLY_TEMPLATE)
    assert(applyButton, 'Apply Template button not found')
    simulateClick(applyButton)
    await sleep(STEP_DELAY)
    // soft wait for network requests to settle
    // don't know why twice is needed but it seems to be the case
    await awaitActionFeedback(this.el, 500)
    await awaitActionFeedback(this.el, 500)
    const secondDraftForm = document.querySelectorAll(
      '[class*="Draft__form"]',
    )[1]
    assert(
      secondDraftForm,
      'Second draft form not found after applying template',
    )
    const saveButton = getButtonWithText(secondDraftForm, STR.SAVE)
    assert(saveButton, 'Save button not found')
    saveButton.scrollIntoView({ block: 'center', behavior: 'smooth' })
    await sleep(STEP_DELAY)
    simulateClick(saveButton)
    await sleep(STEP_DELAY)
    await awaitActionFeedback(this.el, 500)
  }

  // Fill the recipient / counterparty field with `this.config.recipient`.
  async applyRecipient(): Promise<void> {
    const thirdDraftForm = this.el.querySelectorAll('[class*="Draft__form"]')[2]
    assert(thirdDraftForm, 'Third draft form not found for recipient')
    const recipientInput = thirdDraftForm.querySelector<HTMLInputElement>(
      'input[class*="UserSelector__input"]',
    )
    assert(recipientInput, 'Recipient input not found')
    recipientInput.focus()
    await sleep(STEP_DELAY)
    assert(this.config.recipient, 'Recipient not specified in config')
    simulateInput(recipientInput, this.config.recipient)
    await sleep(SEARCH_DELAY)

    const recipientResult = this.el.querySelector(
      'div[class*="UserSelector__suggestionsContainer"]',
    )
    assert(recipientResult, 'Recipient result container not found')
    const targetRecipient = await waitFor(() => {
      assert(this.config.recipient, 'Recipient not specified in config')
      return getElementWithText(recipientResult, 'ul[role="listbox"] li', [
        this.config.recipient,
      ])
    }, 1000)
    assert(targetRecipient, 'Recipient result item not found')
    simulateClick(targetRecipient)
    await sleep(STEP_DELAY)
  }

  // Click the Send button and wait for the server's confirmation feedback.
  async sendDraft(): Promise<void> {
    await sleep(STEP_DELAY)
    const sendButton = getButtonWithText(this.el, STR.SEND)
    assert(sendButton, 'Send button not found')
    simulateClick(sendButton)
    const buttons = await awaitActionConfirmation(this.el, 5000)
    await sleep(STEP_DELAY)
    const confirmButton = getButtonWithText(buttons, STR.SEND_DRAFT)
    assert(confirmButton, 'Confirm Send button not found')
    simulateClick(confirmButton)
    const err = await awaitActionFeedback(this.el, 5000)
    if (err) throw new Error(`Send failed: ${err}`)
  }
}
