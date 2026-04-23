import * as Rx from 'rxjs'
import { getParentMatching } from './selector'
import { simulateClick } from './simulate'

function getTileTitle(tile: ParentNode) {
  const titleEl = tile.querySelector('[class*="TileFrame__title"]')
  return titleEl ? titleEl.textContent.trim() : ''
}

function getTileCmd(tile: Element) {
  const cmdEl = tile.querySelector('[class*="TileFrame__cmd"]')
  return cmdEl ? cmdEl.textContent.trim() : ''
}

// abstract tile class
export class Tile {
  cmd: string
  title: string

  constructor(public el: Element) {
    this.cmd = getTileCmd(this.el)
    this.title = getTileTitle(this.el)
  }

  // Test whether the tile's cmd matches `pattern`. A string is treated
  // as a regex source with the `i` (case-insensitive) flag; a RegExp
  // is used as-is so the caller can opt into different flags.
  matchCmd(pattern: string | RegExp): boolean {
    const re = pattern instanceof RegExp ? pattern : new RegExp(pattern, 'i')
    return re.test(this.cmd)
  }
}

export const $tile = new Rx.Subject<Tile>()

export const waitForTile = async (condition: (tile: Tile) => boolean) => {
  return await Rx.firstValueFrom($tile.pipe(Rx.filter(condition)))
}

export const waitForTileCmd = async (cmd: string) => {
  return await waitForTile(tile => tile.cmd === cmd)
}

export const closeTile = (tile: Tile) => {
  const tileWindow = getParentMatching(tile.el, '[class*="Window__window"]')
  if (!tileWindow) return
  const closeButton = tileWindow.querySelector(
    '[class*="Window__header"] div[title="Close buffer"]',
  )
  if (closeButton) {
    simulateClick(closeButton)
  }
}

export const $allTiles = new Rx.BehaviorSubject<Tile[]>([])

export const getAllTiles = () => {
  return $allTiles.getValue()
}
