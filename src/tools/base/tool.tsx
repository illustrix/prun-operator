import type { ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { assert } from '../../utils/assert'
import { provideToolContext } from './context'

export abstract class Tool {
  // for type guard
  static isTool = true

  private root?: Root // react root

  // react root element, move it if you want to change the position of the ui widget
  protected rootElement?: HTMLDivElement
  // where to create the root element. if not specified, the widget won't be rendered
  protected container?: Node

  constructor(public tile: Element) {}

  // return false if you want to bypass some tiles silently
  match() {
    throw new Error('match method not implemented')
  }

  createRootElement(): HTMLDivElement | undefined {
    if (!this.container) return
    const el = document.createElement('div')
    this.container.appendChild(el)
    return el
  }

  render(): ReactNode {
    throw new Error('render method not implemented')
  }

  attach() {
    const rootElement = this.createRootElement()
    assert(rootElement, 'Failed to create root element for tool')
    this.rootElement = rootElement
    this.root = createRoot(rootElement)
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
