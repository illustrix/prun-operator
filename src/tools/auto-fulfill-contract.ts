import { awaitActionFeedback } from '../utils/action-feedback'
import { STR } from '../utils/constants'
import { getElementWithText } from '../utils/selector'
import { sleep } from '../utils/sleep'
import type { Tile } from '../utils/tile'

const FULFILL_POLL_DELAY = 100

export async function autoFulfillContract(tile: Tile): Promise<void> {
  while (true) {
    const fulfillButton = getElementWithText<HTMLButtonElement>(
      tile.el,
      'button[class*="Button__success"]',
      STR.FULFILL,
      true,
    )
    if (!fulfillButton) return

    fulfillButton.scrollIntoView({ behavior: 'smooth' })
    fulfillButton.click()

    const error = await awaitActionFeedback(tile.el)
    if (error) {
      console.log('Auto fulfill aborted:', error)
      return
    }
    await sleep(FULFILL_POLL_DELAY)
  }
}
