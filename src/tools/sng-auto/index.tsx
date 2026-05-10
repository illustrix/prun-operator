import * as Rx from 'rxjs'
import { showToast } from '../../components/Toast'
import { assert } from '../../utils/assert'
import { STR } from '../../utils/constants'
import { normalizeAddress } from '../../utils/game'
import { getElementWithText, waitForElement } from '../../utils/selector'
import { simulateClick } from '../../utils/simulate'
import { sleep, waitFor } from '../../utils/sleep'
import {
  $tile,
  closeTile,
  getAllTiles,
  type Tile,
  waitForTile,
} from '../../utils/tile'
import { autoFulfillContract } from '../auto-fulfill-contract'
import {
  type AutoSetContractConfig,
  type ContractItem,
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
import { collectExcludes, loadSettings } from './settings'

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
  link?: Element
}

const SNG_CONTRACT_PATTERN = /^SNG[PS]-/i

// Wait for the next tile whose cmd matches `pattern`, or resolve to null
// after `ms`. Used when clicking something that may or may not surface a
// new tile (already-open tiles don't re-emit on $tile).
const waitForCmdOrNull = (pattern: string, ms = 5000): Promise<Tile | null> =>
  Rx.firstValueFrom(
    $tile.pipe(
      Rx.filter(t => t.matchCmd(pattern)),
      Rx.take(1),
      Rx.timeout({ first: ms, with: () => Rx.of<Tile | null>(null) }),
    ),
  )

const findBurnTile = (address: string): Tile | undefined => {
  return getAllTiles().find(
    t =>
      t.matchCmd('^XIT BURN ') &&
      normalizeAddress(getBurnAddress(t)) === address,
  )
}

// Draft names follow `SNGP-<address>-…` for BUY (supply/provision) and
// `SNGS-<address>-…` for SELL (submit). Case varies in practice.
const namePrefixFor = (base: SngBase, template: 'BUY' | 'SELL'): string => {
  const addressCode = base.address.replace(/-/g, '').toUpperCase()
  return template === 'BUY' ? `SNGP-${addressCode}-` : `SNGS-${addressCode}-`
}

// Full draft name. BUY uses the configured refill target (days the
// supply contract is meant to top up to). SELL uses the rounded current
// output buildup, falling back to 0 when not finite.
const buildContractName = (
  base: SngBase,
  template: 'BUY' | 'SELL',
): string => {
  const days =
    template === 'BUY'
      ? BALANCE_REFILL_DAYS
      : Number.isFinite(base.outputDays)
        ? Math.round(base.outputDays as number)
        : 0
  return `${namePrefixFor(base, template)}${days}d`
}

// A draft needs renaming when it's brand-new (no existing row) or its
// current name doesn't start with the SNG prefix for this base+template.
const needsRename = (
  existing: ContractDraftRow | null,
  base: SngBase,
  template: 'BUY' | 'SELL',
): boolean => {
  if (!existing) return true
  return !existing.name.toLowerCase().startsWith(
    namePrefixFor(base, template).toLowerCase(),
  )
}

const draftNamePrefix = (
  base: SngBase,
  config: AutoSetContractConfig,
): string | null => {
  if (config.template === 'BUY') return namePrefixFor(base, 'BUY')
  if (config.template === 'SELL') return namePrefixFor(base, 'SELL')
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
      contracts.push({ name, partner, link: nameEl ?? undefined })
    }
    return contracts
  }

  // Find an existing contract whose name starts with `prefix`.
  protected findExistingByPrefix(prefix: string): ExistingContract | undefined {
    const needle = prefix.toLowerCase()
    return this.existingContracts.find(c =>
      c.name.toLowerCase().startsWith(needle),
    )
  }

  collectBases(): SngBase[] {
    const bases: SngBase[] = []
    for (const tile of getAllTiles()) {
      if (!tile.matchCmd('^XIT BURN ')) continue
      const address = normalizeAddress(getBurnAddress(tile))
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
      name: needsRename(existing, base, 'BUY')
        ? buildContractName(base, 'BUY')
        : undefined,
      autoSave: true,
      autoSend: true,
      onStep: step => this.step$.next(step),
    }).run()
    this.markContractSubmitted(base, 'BUY')
    await sleep(100)
    closeTile(draft)
    await sleep(100)
  }

  async autoSubmit(base: SngBase): Promise<void> {
    this.step$.next('Preparing submit config')
    const config = this.buildSubmitConfig(base)
    if (!config) return

    this.step$.next('Opening draft')
    const existing = this.findExistingDraft(base, config)
    const draft = existing
      ? await this.openDraft(existing)
      : await this.createNewDraft(base, config)

    await new ContractSetter(draft, {
      ...config,
      name: needsRename(existing, base, 'SELL')
        ? buildContractName(base, 'SELL')
        : undefined,
      autoSave: true,
      autoSend: true,
      onStep: step => this.step$.next(step),
    }).run()
    this.markContractSubmitted(base, 'SELL')
    await sleep(100)
    closeTile(draft)
    await sleep(100)
  }

  // Optimistic update: after a successful submit, drop a synthetic row
  // into existingContracts so collectBases() flips the matching base's
  // status to "In Progress" without a full refresh. The next
  // checkExistingContracts() call replaces it with the real row.
  protected markContractSubmitted(base: SngBase, template: 'BUY' | 'SELL') {
    const prefix = namePrefixFor(base, template)
    if (this.findExistingByPrefix(prefix)) return
    this.existingContracts = [
      ...this.existingContracts,
      { name: `${prefix}pending`, partner: '' },
    ]
  }

  // Walk the existing-contracts snapshot and click "fulfill" on every
  // active SNG[PS]- contract. Each contract is opened by clicking its
  // name link (which surfaces a `CONT <id>` tile) and then handed off
  // to the shared autoFulfillContract loop.
  async autoFulfillAll(): Promise<void> {
    await this.checkExistingContracts()
    const targets = this.existingContracts.filter(c =>
      SNG_CONTRACT_PATTERN.test(c.name),
    )
    if (targets.length === 0) {
      showToast('No SNG contracts to fulfill', 'info')
      return
    }
    for (const contract of targets) {
      try {
        this.step$.next(`Opening ${contract.name}`)
        if (!contract.link) {
          console.warn(`autoFulfillAll: missing link for ${contract.name}`)
          continue
        }
        simulateClick(contract.link)
        const tile = await waitForCmdOrNull('^CONT ')
        if (!tile) {
          console.warn(`autoFulfillAll: ${contract.name} did not open`)
          continue
        }
        this.step$.next(`Fulfilling ${contract.name}`)
        await autoFulfillContract(tile)
        await sleep(100)
        closeTile(tile)
        await sleep(100)
      } catch (err) {
        console.error(`autoFulfillAll: ${contract.name} failed`, err)
      }
    }
    showToast(`Auto Fulfill done (${targets.length} contracts)`, 'success')
  }

  async autoSendAll(): Promise<void> {
    // TODO: iterate bases and run autoSupply / autoSubmit for those that
    // need it, skipping ones with an existing matching contract.
    showToast('Auto Send Contract is not yet implemented', 'warning')
  }

  // Build the BUY contract config for a base using the shared balance
  // policy. Returns null when the base has no burn tile or nothing
  // needs refilling.
  protected buildSupplyConfig(base: SngBase): ContractSetterOptions | null {
    const rows = this.loadBurnRows(base)
    if (!rows) return null
    const items = computeBalanced(rows, BALANCE_MIN_DAYS, BALANCE_REFILL_DAYS)
    if (items.length === 0) {
      console.log('autoSupply: nothing needed for', base.address)
      return null
    }
    return this.contractConfig(
      base,
      'BUY',
      items.map(item => ({
        commodity: item.ticker,
        amount: item.amount,
        price: 1,
      })),
    )
  }

  // Build the SELL contract config: every produced material with a
  // configured internal price is offered at its current inventory.
  // Items without a price in `settings.prices` are skipped (with a
  // warning). Tickers listed in `settings.excludes` (global) or the
  // matching base's `excludes` are skipped silently. Returns null when
  // nothing qualifies.
  protected buildSubmitConfig(base: SngBase): ContractSetterOptions | null {
    const rows = this.loadBurnRows(base)
    if (!rows) return null
    const settings = loadSettings()
    const prices = settings.prices ?? {}
    const excludes = collectExcludes(settings, base.address)
    const items: ContractItem[] = []
    for (const row of rows) {
      if (!Number.isFinite(row.burn) || row.burn <= 0) continue
      if (!Number.isFinite(row.inventory) || row.inventory <= 0) continue
      if (excludes.has(row.ticker.toUpperCase())) continue
      const price = prices[row.ticker]
      if (price === undefined) {
        console.warn(`autoSubmit: no price for ${row.ticker}, skipping`)
        continue
      }
      items.push({
        commodity: row.ticker,
        amount: Math.floor(row.inventory),
        price,
      })
    }
    if (items.length === 0) {
      console.log('autoSubmit: nothing to submit for', base.address)
      return null
    }
    return this.contractConfig(base, 'SELL', items)
  }

  protected loadBurnRows(base: SngBase) {
    const tile = findBurnTile(base.address)
    if (!tile) {
      console.warn('SngAutoTool: no XIT BURN tile for', base.address)
      return null
    }
    return parseBurnTable(tile)
  }

  protected contractConfig(
    base: SngBase,
    template: 'BUY' | 'SELL',
    items: ContractItem[],
  ): ContractSetterOptions {
    const settings = loadSettings()
    const address = normalizeAddress(base.address)
    assert(address, 'invalid address')
    const baseSettings = settings.bases?.[address]
    const currency =
      baseSettings?.currency ?? settings.defaultCurrency ?? DEFAULT_CURRENCY
    const recipient =
      baseSettings?.owner ?? settings.defaultOwner ?? DEFAULT_OWNER
    return {
      template,
      currency,
      location: base.address,
      recipient,
      items,
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
