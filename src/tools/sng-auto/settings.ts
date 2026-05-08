import { normalizeAddress } from '../../utils/game'

const STORAGE_KEY = 'prun-operator:sng-settings'

export interface SngBaseSettings {
  owner?: string
  currency?: string
}

export interface SngSettings {
  bases?: Record<string, SngBaseSettings>
  prices?: Record<string, number>
  defaultOwner?: string
  defaultCurrency?: string
}

const normalizeBaseKeys = (
  bases: Record<string, SngBaseSettings> | undefined,
): Record<string, SngBaseSettings> | undefined => {
  if (!bases) return bases
  const out: Record<string, SngBaseSettings> = {}
  for (const [key, value] of Object.entries(bases)) {
    const normalized = normalizeAddress(key) ?? key
    out[normalized] = value
  }
  return out
}

export const normalizeSettings = (settings: SngSettings): SngSettings => ({
  ...settings,
  bases: normalizeBaseKeys(settings.bases),
})

export const loadSettings = (): SngSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return normalizeSettings(parsed as SngSettings)
    }
    return {}
  } catch (err) {
    console.warn('sng-settings: failed to load', err)
    return {}
  }
}

export const saveSettings = (settings: SngSettings): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeSettings(settings)))
}
