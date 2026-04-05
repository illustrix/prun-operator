import * as Rx from 'rxjs'
import { getParentMatching } from './selector'
import { simulateClick } from './simulate'

export function getTileTitle(tile: Element) {
  const titleEl = tile.querySelector('[class*="TileFrame__title"]')
  return titleEl ? titleEl.textContent.trim() : ''
}

export function getTileCmd(tile: Element) {
  const cmdEl = tile.querySelector('[class*="TileFrame__cmd"]')
  return cmdEl ? cmdEl.textContent.trim() : ''
}

export const $tile = new Rx.Subject<Element>()

export const waitForTile = async (condition: (tile: Element) => boolean) => {
  return await Rx.firstValueFrom($tile.pipe(Rx.filter(condition)))
}

export const waitForTileCmd = async (cmd: string) => {
  return await waitForTile(tile => getTileCmd(tile) === cmd)
}

export const closeTile = (tile: Element) => {
  const tileWindow = getParentMatching(tile, '[class*="Window__window"]')
  if (!tileWindow) return
  const closeButton = tileWindow.querySelector(
    '[class*="Window__header"] div[title="Close buffer"]',
  )
  if (closeButton) {
    simulateClick(closeButton)
  }
}
