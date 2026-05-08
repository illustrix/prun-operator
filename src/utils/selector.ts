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

export async function waitForElement(
  container: ParentNode,
  selector: string,
  timeout?: number,
): Promise<Element>
export async function waitForElement(
  container: ParentNode,
  selector: string,
  timeout: number,
  shouldThrow: false,
): Promise<Element | undefined>
export async function waitForElement(
  container: ParentNode,
  selector: string,
  timeout = 5000,
  shouldThrow = true,
) {
  const startTime = Date.now()
  while (Date.now() - startTime < timeout) {
    const el = container.querySelector(selector)
    if (el) return el
    await sleep(100)
  }
  if (shouldThrow) {
    throw new Error(`Element ${selector} not found within ${timeout}ms`)
  }
}

// Match a `[class*="FormComponent__container"]` row in `root` whose
// `label > span` text equals `label`. Used to anchor inputs that have
// no `for`/`name` attribute (PrUn renders many fields this way).
export const findFormComponentByLabel = (
  root: ParentNode,
  label: string,
): Element | null => {
  for (const c of root.querySelectorAll('[class*="FormComponent__container"]')) {
    if (c.querySelector('label > span')?.textContent.trim() === label) return c
  }
  return null
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
