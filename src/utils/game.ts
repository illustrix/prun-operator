export const getAddressCode = (text: string, insensitive = false) => {
  const regex = insensitive ? /[A-Z]{2}-\d{3}[a-z]/i : /[A-Z]{2}-\d{3}[a-z]/
  const match = text.match(regex)
  return match ? match[0] : null
}

export const normalizeAddress = (address?: string | undefined | null) => {
  if (!address) return
  const [system, planet] = address.split('-')

  if (!system || !/^[A-Za-z]{2}$/.test(system)) return
  if (!planet || !/^[0-9]{3}[A-Za-z]$/.test(planet)) return

  return `${system.toUpperCase()}-${planet.toLowerCase()}`
}

export const getStationCodeFromName = (name: string) => {
  if (name.includes('Benten')) return 'BEN'
  if (name.includes('Moria')) return 'MOR'
  if (name.includes('Hortus')) return 'HRT'
  if (name.includes('Antares')) return 'ANT'
}
