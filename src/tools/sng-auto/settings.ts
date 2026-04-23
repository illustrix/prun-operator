const STORAGE_KEY = 'prun-operator:sng-settings'

export interface SngBaseSettings {
  currency?: string
  owner?: string
}

export interface SngSettings {
  bases?: Record<string, SngBaseSettings>
  prices?: Record<string, number>
}

export const loadSettings = (): SngSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as SngSettings
    }
    return {}
  } catch (err) {
    console.warn('sng-settings: failed to load', err)
    return {}
  }
}

export const saveSettings = (settings: SngSettings): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}
