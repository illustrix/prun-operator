import { autoFulfillContract } from '../tools/auto-fulfill-contract'
import { STR } from '../utils/constants'
import { getElementWithText } from '../utils/selector'
import type { Tile } from '../utils/tile'

export function enhanceContractTile(tile: Tile) {
  const contractConditionsLabel = getElementWithText(
    tile.el,
    'div[class*="SectionHeader__container"]',
    STR.CONTRACT_CONDITIONS,
  )
  if (!contractConditionsLabel) return
  const autoFulfillButton = document.createElement('button')
  autoFulfillButton.textContent = 'Auto Fulfill'
  autoFulfillButton.style =
    'margin-left: 10px; padding: 2px 6px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;'
  autoFulfillButton.addEventListener('click', () => {
    autoFulfillContract(tile)
  })
  contractConditionsLabel.parentNode?.insertBefore(
    autoFulfillButton,
    contractConditionsLabel,
  )
}
