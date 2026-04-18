import type { ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { provideToolContext } from './context'

export abstract class Tool {
  static isTool = true

  rootElement?: HTMLDivElement
  root?: Root

  constructor(public tile: Element) {}

  match(): boolean {
    return false
  }

  getContainer(): Element | undefined | null {
    return
  }

  createRootElement(): HTMLDivElement | undefined {
    const container = this.getContainer()
    if (!container) return
    const el = document.createElement('div')
    container.appendChild(el)
    return el
  }

  render(): ReactNode {
    return null
  }

  attach() {
    const rootElement = this.createRootElement()
    if (!rootElement) return
    this.rootElement = rootElement
    this.root = createRoot(rootElement)
    this.root.render(provideToolContext(this, this.render()))
    return this
  }

  cleanup() {
    if (this.root) {
      this.root.unmount()
      this.root = undefined
    }
  }
}
