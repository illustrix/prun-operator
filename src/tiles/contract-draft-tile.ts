import { autoSetContract } from '../tools/auto-set-contract'

export function enhanceContractDraftTile(tile: Element) {
  const draftForm = tile.querySelector('[class*="Draft__form"]')
  if (!draftForm) return

  const textarea = document.createElement('textarea')
  textarea.placeholder = 'Enter contract configuration as JSON'
  textarea.style =
    'width: 100%; height: 100px; margin-top: 10px; padding: 5px; border: 1px solid #ccc; border-radius: 4px;'
  draftForm.appendChild(textarea)

  const button = document.createElement('button')
  button.textContent = 'Auto Set'
  button.style =
    'margin-top: 10px; padding: 5px 10px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;'
  draftForm.appendChild(button)

  const notice = document.createElement('div')
  notice.textContent =
    'Example config: {"template": "BUY", "currency": "NCC", "items": [{"amount": 100, "commodity": "Iron Ore", "price": 10}], "location": "QQ-001b"}'
  notice.style = 'margin-top: 10px; font-size: 12px; color: #666;'
  draftForm.appendChild(notice)

  button.addEventListener('click', async () => {
    const config = textarea.value.trim()
    if (!config) return
    try {
      const configObj = JSON.parse(config)
      await autoSetContract(tile, configObj)
    } catch (e: unknown) {
      console.log(e)
      if (e instanceof Error) {
        notice.innerHTML = `<span style="color: red;">error: ${e.message}</span>`
      } else {
        notice.innerHTML = `<span style="color: red;">error: ${String(e)}</span>`
      }
      return
    }
  })
}
