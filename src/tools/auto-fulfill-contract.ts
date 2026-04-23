import { STR } from '../utils/constants'
import { getElementWithText, waitForElement } from '../utils/selector'
import { simulateClick } from '../utils/simulate'
import { sleep } from '../utils/sleep'
import type { Tile } from '../utils/tile'

export async function autoFulfillContract(tile: Tile) {
  while (true) {
    const fulfillButton = getElementWithText<HTMLButtonElement>(
      tile.el,
      'button[class*="Button__success"]',
      STR.FULFILL,
      true,
    )
    if (!fulfillButton) {
      return
    }
    fulfillButton.scrollIntoView({ behavior: 'smooth' })
    fulfillButton.click()
    const dismissEl = await waitForElement(
      tile.el,
      'span[class*="ActionFeedback__dismiss"]',
      5000,
    )

    if (dismissEl) {
      const error = tile.el.querySelector('div[class*="ActionFeedback__error"]')
      if (error) {
        console.log('Auto fulfill aborted:', error.textContent.trim())
        return
      }

      simulateClick(dismissEl)
    }
    await sleep(100)
  }
}
