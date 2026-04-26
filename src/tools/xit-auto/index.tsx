import { assert } from '../../utils/assert'
import { STR } from '../../utils/constants'
import { getElementWithText, waitForElement } from '../../utils/selector'
import { simulateClick } from '../../utils/simulate'
import { sleep } from '../../utils/sleep'
import { Tool } from '../base/tool'

export class XitAutoTool extends Tool {
  actionBar?: Element | null
  observer?: MutationObserver
  actButton?: HTMLButtonElement

  override match(): boolean {
    return true
  }

  override async attach() {
    this.actionBar = await waitForElement(
      this.tile.el,
      '[class*="ActionBar__container"]',
    )
    this.observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          this.watchActionBar()
        }
      }
    })
    this.observer.observe(this.actionBar, {
      childList: true,
      subtree: true,
    })
    this.watchActionBar()
  }

  override cleanup(): void {
    this.observer?.disconnect()
  }

  watchActionBar() {
    this.actButton = undefined
    assert(this.actionBar, 'Action bar not found')
    const elements = this.actionBar.querySelector(
      '[class*="ActionBar__element"]',
    )
    assert(elements, 'Action bar element not found')
    const act = getElementWithText(elements, 'button', STR.ACT)
    assert(act, 'ACT button not found')
    this.actButton = act as HTMLButtonElement
    this.addAutoButton(elements)
  }

  addAutoButton(container: Element) {
    if (container.getAttribute('data-has-auto') === 'true') {
      return
    }
    const autoButton = document.createElement('button')
    autoButton.textContent = 'Auto'
    autoButton.style.backgroundColor = '#17a2b8'
    autoButton.style.color = 'white'
    autoButton.style.border = 'none'
    autoButton.style.padding = '2px 8px'
    autoButton.style.borderRadius = '4px'
    autoButton.style.cursor = 'pointer'
    autoButton.style.marginLeft = '8px'
    autoButton.addEventListener('click', () => {
      this.autoAct()
    })
    container.appendChild(autoButton)
    container.setAttribute('data-has-auto', 'true')
  }

  async autoAct() {
    while (this.actButton) {
      await sleep(100)
      if (this.actButton.disabled) {
        await sleep(500)
        continue
      }
      simulateClick(this.actButton)
      await sleep(100)
    }
  }
}
