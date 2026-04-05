import { sleep } from './sleep'

export const getElementWithText = <E extends Element = Element>(
  container: ParentNode | null | undefined,
  selector: string,
  texts: string[],
  exact = false,
) => {
  if (!container) return
  const elements = container.querySelectorAll<E>(selector)
  for (const el of elements) {
    const textContent = el.textContent.trim()
    if (exact) {
      if (texts.some(text => text === textContent)) {
        return el
      }
    } else {
      if (texts.some(text => textContent.includes(text))) {
        return el
      }
    }
  }
}

export const getButtonWithText = (container: Element, texts: string[]) => {
  return getElementWithText(container, 'button', texts, true) as
    | HTMLButtonElement
    | undefined
}

export const waitForElement = async (
  container: ParentNode,
  selector: string,
  timeout = 5000,
) => {
  const startTime = Date.now()
  while (Date.now() - startTime < timeout) {
    const el = container.querySelector(selector)
    if (el) return el
    await sleep(100)
  }
  throw new Error(`Element ${selector} not found within ${timeout}ms`)
}

export const getParentMatching = (
  element: Element,
  selector: string,
): Element | null => {
  let current: Element | null = element
  while (current) {
    if (current.matches(selector)) {
      return current
    }
    current = current.parentElement
  }
  return null
}
