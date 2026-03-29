// ==UserScript==
// @name         PrUn Operator
// @namespace    https://explorer.auroras.xyz/
// @version      2026-03-30
// @description  An automation tool for Prosperous Universe, providing features like auto-filling contract drafts and auto-fulfilling contracts. Use at your own risk.
// @author       ivy_exe
// @match        https://apex.prosperousuniverse.com/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=prosperousuniverse.com
// @grant        none
// @updateURL    https://prop.auroras.xyz/prun-operator.user.js
// @downloadURL  https://prop.auroras.xyz/prun-operator.user.js
// ==/UserScript==

(function() {
  'use strict';

  function getElementWithText(container, selector, text, exact = false) {
    if (!container) return;
    const elements = container.querySelectorAll(selector);
    for (const el of elements) {
      if (exact) {
        if (el.textContent.trim() === text) {
          return el;
        }
      } else {
        if (el.textContent.includes(text)) {
          return el;
        }
      }
    }
  }

  function getButtonWithText(container, text) {
    return getElementWithText(container, 'button', text, true);
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function assert(condition, message) {
    if (!condition) {
      throw new Error(message || "Assertion failed");
    }
  }

  function simulateInput(el, value) {
    const nativeInputValueSetter =
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set ||
      Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(el, value);
    } else {
      el.value = value;
    }

    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function simulateSelect(el, value) {
    const nativeSelectValueSetter =
      Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set;

    if (nativeSelectValueSetter) {
      nativeSelectValueSetter.call(el, value);
    } else {
      el.value = value;
    }

    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function simulateClick(el) {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }

  async function waitForElement(container, selector, timeout = 5000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const el = container.querySelector(selector);
      if (el) return el;
      await sleep(100);
    }
    throw new Error(`Element ${selector} not found within ${timeout}ms`);
  }

  const PROCESSED_ATTR = 'data-prun-operator';

  function getTileTitle(tile) {
    const titleEl = tile.querySelector('[class*="TileFrame__title"]');
    return titleEl ? titleEl.textContent.trim() : '';
  }

  function getTileCmd(tile) {
    const cmdEl = tile.querySelector('[class*="TileFrame__cmd"]');
    return cmdEl ? cmdEl.textContent.trim() : '';
  }

  async function autoSetContract(tile, config) {
    const selectTemplateButton = getButtonWithText(tile, 'Select Template');
    assert(selectTemplateButton, 'Select Template button not found');
    selectTemplateButton.click();
    await sleep(50);
    const templateSelectContainer = tile.querySelector('div[class*="TemplateSelection__templateTypeSelect"]');
    assert(templateSelectContainer, 'Template select not found');
    const templateSelect = templateSelectContainer.querySelector('select');
    assert(templateSelect, 'Template select element not found');
    simulateSelect(templateSelect, config.template);
    await sleep(50);
    const currencySelect = tile.querySelector('select[name="currency"]');
    assert(currencySelect, 'Currency select not found');
    simulateSelect(currencySelect, config.currency);
    await sleep(50);

    const addCommodityButton = getButtonWithText(tile, 'add commodity');
    assert(addCommodityButton, 'Add Commodity button not found');
    // assert it already has one commodity row
    for (let i = 1; i < config.items.length; i++) {
      addCommodityButton.click();
      await sleep(50);
    }
    for (let i = 0; i < config.items.length; i++) {
      const item = config.items[i];
      const amountInput = tile.querySelector(`input[name="trades[${i}].amount"]`);
      assert(amountInput, `Amount input for item ${i} not found`);
      simulateInput(amountInput, item.amount);
      await sleep(50);
      const commodityLabel = tile.querySelector(`label[for="trades[${i}].material"]`);
      assert(commodityLabel, `Commodity label for item ${i} not found`);
      const commodityInput = commodityLabel.parentNode.querySelector('input')
      assert(commodityInput, `Commodity input for item ${i} not found`);
      commodityInput.focus();
      await sleep(50);
      simulateInput(commodityInput, item.commodity);
      await sleep(50);
      const listItem = await waitForElement(commodityLabel.parentNode, 'ul[role="listbox"] li', 1000)
      listItem.click();
      await sleep(50);

      const priceInput = tile.querySelector(`input[name="trades[${i}].pricePerUnit"]`);
      assert(priceInput, `Price input for item ${i} not found`);
      simulateInput(priceInput, item.price);
      await sleep(50);
    }
    const locationLabel = tile.querySelector(`label[for="location"]`);
    assert(locationLabel, `Location label not found`);
    const locationInput = locationLabel.parentNode.querySelector('input');
    assert(locationInput, `Location input not found`);
    locationInput.focus();
    await sleep(50);
    simulateInput(locationInput, config.location);
    await sleep(500);
    const locationResultSection = getElementWithText(document, 'div[class*="AddressSelector__sectionContainer"]', 'Search results')
    assert(locationResultSection, 'Location result not found');
    const locationResult = locationResultSection.querySelector('ul li')
    assert(locationResult, 'Location result item not found');
    simulateClick(locationResult);

    await sleep(50);
    const applyButton = getButtonWithText(tile, 'apply template');
    assert(applyButton, 'Apply Template button not found');
    applyButton.click();
    await sleep(200);

    const saveButton = getButtonWithText(tile.querySelectorAll('div[class*="Draft__form"')[1], 'save')
    assert(saveButton, 'Save button not found');
    saveButton.click();
  }

  function enhanceContractDraftTile(tile) {
    const draftForm = tile.querySelector('[class*="Draft__form"]');
    if (!draftForm) return;

    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Enter contract configuration as JSON';
    textarea.style = 'width: 100%; height: 100px; margin-top: 10px; padding: 5px; border: 1px solid #ccc; border-radius: 4px;';
    draftForm.appendChild(textarea);

    const button = document.createElement('button');
    button.textContent = 'Auto Set';
    button.style = 'margin-top: 10px; padding: 5px 10px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;';
    draftForm.appendChild(button);

    const notice = document.createElement('div');
    notice.textContent = 'Example config: {"template": "BUY", "currency": "NCC", "items": [{"amount": 100, "commodity": "Iron Ore", "price": 10}], "location": "QQ-001b"}';
    notice.style = 'margin-top: 10px; font-size: 12px; color: #666;';
    draftForm.appendChild(notice);

    button.addEventListener('click', async () => {
      const config = textarea.value.trim();
      if (!config) return;
      try {
        const configObj = JSON.parse(config);
        await autoSetContract(tile, configObj);
      } catch (e) {
        console.log(e);
        notice.innerHTML = `<span style="color: red;">error: ${e.message}</span>`;
        return;
      }
    });
  }

  async function autoFulfillContract(tile) {
    while (true) {
      const fulfillButton = getElementWithText(tile, 'button[class*="Button__success"]', 'fulfill', true);
      if (!fulfillButton) {
        return;
      }
      fulfillButton.scrollIntoView({ behavior: 'smooth' })
      fulfillButton.click();
      const dismissEl = await waitForElement(tile, 'span[class*="ActionFeedback__dismiss"]', 5000)

      if (dismissEl) {
        const error = tile.querySelector('div[class*="ActionFeedback__error"]')
        if (error) {
          console.log('Auto fulfill aborted:', error.textContent.trim());
          return;
        }

        dismissEl.click();
      }
      await sleep(100);
    }
  }

  function enhanceContractTile(tile) {
    const contractConditionsLabel = getElementWithText(tile, 'div[class*="SectionHeader__container"]', 'Contract conditions')
    if (!contractConditionsLabel) return;
    const autoFulfillButton = document.createElement('button');
    autoFulfillButton.textContent = 'Auto Fulfill';
    autoFulfillButton.style = 'margin-left: 10px; padding: 2px 6px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;';
    autoFulfillButton.addEventListener('click', () => {
      autoFulfillContract(tile);
    });
    contractConditionsLabel.parentNode.insertBefore(autoFulfillButton, contractConditionsLabel)
  }

  function processTile(tile) {
    if (tile.hasAttribute(PROCESSED_ATTR)) return;
    tile.setAttribute(PROCESSED_ATTR, 'true');

    if (getTileTitle(tile) === 'Contract Draft') {
      enhanceContractDraftTile(tile);
    } else if (getTileCmd(tile).startsWith('CONT ')) {
      enhanceContractTile(tile);
    } else {
      tile.removeAttribute(PROCESSED_ATTR);
    }
  }

  function scanTiles() {
    document.querySelectorAll('[class*="Tile__tile"]').forEach(processTile);
  }

  const observer = new MutationObserver(scanTiles);
  observer.observe(document.body, { childList: true, subtree: true });

  scanTiles();

  console.log('PrUn Operator loaded');

})();


