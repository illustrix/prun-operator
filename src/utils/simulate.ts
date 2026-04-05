export function simulateInput(
  el: HTMLInputElement | HTMLTextAreaElement,
  value: string,
) {
  const nativeInputValueSetter =
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
      ?.set ||
    Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value',
    )?.set

  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(el, value)
  } else {
    el.value = value
  }

  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
}

export function simulateSelect(el: HTMLSelectElement, value: string) {
  const nativeSelectValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLSelectElement.prototype,
    'value',
  )?.set

  if (nativeSelectValueSetter) {
    nativeSelectValueSetter.call(el, value)
  } else {
    el.value = value
  }

  el.dispatchEvent(new Event('change', { bubbles: true }))
}

export function simulateClick(el: Element) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
}
