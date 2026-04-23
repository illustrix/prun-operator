import * as Rx from 'rxjs'
import { showToast } from '../../components/Toast'
import { assert } from '../../utils/assert'
import { STR } from '../../utils/constants'
import { getElementWithText, waitForElement } from '../../utils/selector'
import { simulateClick } from '../../utils/simulate'
import { waitFor } from '../../utils/sleep'
import { getAllTiles, type Tile, waitForTile } from '../../utils/tile'
import {
  type AutoSetContractConfig,
  ContractSetter,
  type ContractSetterOptions,
} from '../auto-set-contract'
import { Tool } from '../base/tool'
import {
  BALANCE_MIN_DAYS,
  BALANCE_REFILL_DAYS,
  computeBalanced,
  getBurnAddress,
  hasLowSupply,
  hasSurplusOutput,
  maxOutputDays,
  minSupplyDays,
  parseBurnTable,
} from '../burn-auto/parse'
import {
  type ContractDraftRow,
  parseContractDraftTable,
} from './contractDrafts'
import { SngModal } from './SngModal'
import { loadSettings } from './settings'

const DEFAULT_CURRENCY = 'ICA'
const DEFAULT_OWNER = 'RestOwner'

export interface SngBase {
  address: string
  name?: string
  needsSupply: boolean
  needsSubmit: boolean
  supplyDays: number | null
  outputDays: number | null
  existingSupply?: ExistingContract
  existingSubmit?: ExistingContract
}

export interface ExistingContract {
  name: string
  partner: string
}

const findBurnTile = (address: string): Tile | undefined => {
  return getAllTiles().find(
    t => t.matchCmd('^XIT BURN ') && getBurnAddress(t) === address,
  )
}

const draftNamePrefix = (
  base: SngBase,
  config: AutoSetContractConfig,
): string | null => {
  const addressCode = base.address.replace(/-/g, '').toUpperCase()
  // Draft names follow `SNGP-<address>-…` for BUY (supply/provision) and
  // `SNGS-<address>-…` for SELL (submit). Case varies in practice.
  if (config.template === 'BUY') return `SNGP-${addressCode}-`
  if (config.template === 'SELL') return `SNGS-${addressCode}-`
  return null
}

const waitForDraftTile = (): Promise<Tile> =>
  waitForTile(t => t.matchCmd('^CONTD '))

export class SngAutoTool extends Tool {
  // emits the current step label while an action is running; null when
  // idle. SngModal subscribes to surface progress in the loading overlay.
  readonly step$ = new Rx.BehaviorSubject<string | null>(null)

  protected override getContainer() {
    return waitForElement(this.tile.el, '[class*="ActionBar__container"]')
  }

  override render() {
    return <SngModal />
  }

  // Latest snapshot populated by `checkExistingContracts`, consumed by
  // `collectBases` when annotating each base.
  protected existingContracts: ExistingContract[] = []

  // Find the target tile among all open tiles, then parse its table.
  async checkExistingContracts(): Promise<void> {
    const tile = getAllTiles().find(t => t.matchCmd('^XIT CONTS$'))
    if (!tile) {
      console.warn('checkExistingContracts: target tile not found')
      this.existingContracts = []
      return
    }
    this.existingContracts = this.parseContractsTable(tile)
  }

  // Parse rows of the XIT CONTS table. Columns are:
  //   Contract | Item | Partner | Self
  // Each name cell wraps the text in a `[class*="Link__link"]` div; the
  // partner cell starts with a `Link__link` (partner name), followed by
  // per-item condition rows we ignore here.
  protected parseContractsTable(tile: Tile): ExistingContract[] {
    const table = tile.el.querySelector('table')
    if (!table) return []
    const contracts: ExistingContract[] = []
    for (const tr of table.querySelectorAll<HTMLTableRowElement>(
      'tbody > tr',
    )) {
      const cellContract = tr.children[0]
      const cellPartner = tr.children[2]
      if (!cellContract || !cellPartner) continue
      const nameEl = cellContract.querySelector('[class*="Link__link"]')
      const name = (nameEl ?? cellContract).textContent.trim()
      if (!name) continue
      const partnerEl = cellPartner.querySelector('[class*="Link__link"]')
      const partner = partnerEl?.textContent.trim() ?? ''
      contracts.push({ name, partner })
    }
    return contracts
  }

  // Find an existing contract whose name starts with `prefix`.
  protected findExistingByPrefix(
    prefix: string,
  ): ExistingContract | undefined {
    const needle = prefix.toLowerCase()
    return this.existingContracts.find(c =>
      c.name.toLowerCase().startsWith(needle),
    )
  }

  collectBases(): SngBase[] {
    const bases: SngBase[] = []
    for (const tile of getAllTiles()) {
      if (!tile.matchCmd('^XIT BURN ')) continue
      const address = getBurnAddress(tile)
      if (!address) continue
      const rows = parseBurnTable(tile)
      const addressCode = address.replace(/-/g, '').toUpperCase()
      bases.push({
        address,
        name: tile.title.split('-').pop()?.trim() || undefined,
        needsSupply: hasLowSupply(rows),
        needsSubmit: hasSurplusOutput(rows),
        supplyDays: minSupplyDays(rows),
        outputDays: maxOutputDays(rows),
        existingSupply: this.findExistingByPrefix(`SNGP-${addressCode}-`),
        existingSubmit: this.findExistingByPrefix(`SNGS-${addressCode}-`),
      })
    }
    return bases
  }

  async autoSupply(base: SngBase): Promise<void> {
    this.step$.next('Preparing supply config')
    const config = this.buildSupplyConfig(base)
    if (!config) return

    this.step$.next('Opening draft')
    const existing = this.findExistingDraft(base, config)
    const draft = existing
      ? await this.openDraft(existing)
      : await this.createNewDraft(base, config)

    await new ContractSetter(draft, {
      ...config,
      autoSave: true,
      autoSend: true,
      onStep: step => this.step$.next(step),
    }).run()
  }

  async autoSubmit(_base: SngBase): Promise<void> {
    // TODO: drive the submit flow (export surplus output as sell contract)
    showToast('Auto Submit is not yet implemented', 'warning')
  }

  // Build the BUY contract config for a base using the shared balance
  // policy. Currency and recipient fall back to settings defaults, then
  // to `DEFAULT_CURRENCY`. Returns null when the base has no burn tile
  // or nothing needs refilling.
  protected buildSupplyConfig(base: SngBase): ContractSetterOptions | null {
    const tile = findBurnTile(base.address)
    if (!tile) {
      console.warn('autoSupply: no XIT BURN tile for', base.address)
      return null
    }
    const rows = parseBurnTable(tile)
    const items = computeBalanced(rows, BALANCE_MIN_DAYS, BALANCE_REFILL_DAYS)
    if (items.length === 0) {
      console.log('autoSupply: nothing needed for', base.address)
      return null
    }
    const settings = loadSettings()
    const baseSettings = settings.bases?.[base.address]
    const currency =
      baseSettings?.currency ?? settings.defaultCurrency ?? DEFAULT_CURRENCY
    const recipient =
      baseSettings?.owner ?? settings.defaultOwner ?? DEFAULT_OWNER
    return {
      template: 'BUY',
      currency,
      location: base.address,
      recipient,
      items: items.map(item => ({
        commodity: item.ticker,
        amount: item.amount,
        price: 1,
      })),
    }
  }

  // Find an existing draft in the CONTD list whose name starts with
  // `SNGP-<address>-` (for BUY) or `SNGS-<address>-` (for SELL). Match
  // is case-insensitive.
  protected findExistingDraft(
    base: SngBase,
    config: AutoSetContractConfig,
  ): ContractDraftRow | null {
    const prefix = draftNamePrefix(base, config)
    if (!prefix) return null
    const needle = prefix.toLowerCase()
    const drafts = parseContractDraftTable(this.tile)
    console.log(drafts)
    return drafts.find(d => d.name.toLowerCase().startsWith(needle)) ?? null
  }

  // Click the draft's View button and wait for the resulting
  // `CONTD <id>` tile to appear.
  protected async openDraft(draft: ContractDraftRow): Promise<Tile> {
    assert(draft.viewButton, `View button missing for draft "${draft.name}"`)
    simulateClick(draft.viewButton)
    return await waitForDraftTile()
  }

  // Click "Create new" on the CONTD list. The button only adds a new
  // row to the list (it doesn't auto-open), so we poll for the new top
  // row and then click its View button.
  protected async createNewDraft(
    _base: SngBase,
    _config: AutoSetContractConfig,
  ): Promise<Tile> {
    const beforeFirst = parseContractDraftTable(this.tile)[0]?.name

    const createButton = getElementWithText<HTMLButtonElement>(
      this.tile.el,
      'button',
      STR.CREATE_NEW,
      true,
    )
    assert(createButton, 'Create new button not found')
    simulateClick(createButton)

    const newDraft = await waitFor(() => {
      const first = parseContractDraftTable(this.tile)[0]
      if (!first) return null
      if (first.name === beforeFirst) return null
      return first
    })
    assert(newDraft, 'New draft row did not appear after Create new')
    return await this.openDraft(newDraft)
  }
}
