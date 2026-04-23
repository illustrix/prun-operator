import { waitForElement } from './selector'
import { simulateClick } from './simulate'

// Wait for the ActionFeedback popup that appears after clicking a
// button (fulfill, submit draft, …). Returns the error message when the
// server rejected the action, or null on success (in which case the
// popup is dismissed automatically).
// Throws if the popup doesn't appear within `timeout` ms.
export async function awaitActionFeedback(
  container: Element,
  timeout = 5000,
): Promise<string | undefined> {
  const dismiss = await waitForElement(
    container,
    'span[class*="ActionFeedback__dismiss"]',
    timeout,
    false,
  )
  if (!dismiss) return
  const errorEl = container.querySelector('div[class*="ActionFeedback__error"]')
  if (errorEl) {
    return errorEl.textContent.trim() || 'Unknown error'
  }
  simulateClick(dismiss)
}

export async function awaitActionConfirmation(
  container: Element,
  timeout = 5000,
) {
  const buttons = await waitForElement(
    container,
    'div[class*="ActionConfirmationOverlay__buttons"]',
    timeout,
  )

  return buttons
}
