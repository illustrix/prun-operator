import type { ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { Tile } from '../../utils/tile'
import { provideToolContext } from './context'

export abstract class Tool {
  // for type guard
  static isTool = true

  private root?: Root // react root

  // react root element, move it if you want to change the position of the ui widget
  protected rootElement?: HTMLDivElement

  constructor(public tile: Tile) {}

  // throw to skip this tile
  match() {
    throw new Error('match method not implemented')
  }

  // where the widget will render. return undefined to skip rendering.
  // may be sync or async.
  protected getContainer(): Node | Promise<Node> | undefined {
    return undefined
  }

  render(): ReactNode {
    throw new Error('render method not implemented')
  }

  async attach() {
    const container = await this.getContainer()
    if (!container) return
    const el = document.createElement('div')
    container.appendChild(el)
    this.rootElement = el
    this.root = createRoot(el)
    this.root.render(provideToolContext(this, this.render()))
  }

  // this method will be called when the tile is removed
  // override this method to do some cleanup work, like disconnecting observers, etc.
  cleanup() {
    if (this.root) {
      this.root.unmount()
      this.root = undefined
    }
  }
}
