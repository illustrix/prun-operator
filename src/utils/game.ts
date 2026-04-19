export const getAddressCode = (text: string, insensitive = false) => {
  const regex = insensitive ? /[A-Z]{2}-\d{3}[a-z]/i : /[A-Z]{2}-\d{3}[a-z]/
  const match = text.match(regex)
  return match ? match[0] : null
}

export const normalizeAddress = (address: string) => {
  const [system, planet] = address.split('-')

  if (!system || !/^[A-Z]{2}$i/.test(system)) return
  if (!planet || !/^[0-9]{3}[a-zA-Z]$i/.test(planet)) return

  return `${system.toUpperCase()}-${planet.toLowerCase()}`
}

export const getStationCodeFromName = (name: string) => {
  if (name.includes('Benten')) return 'BEN'
  if (name.includes('Moria')) return 'MOR'
  if (name.includes('Hortus')) return 'HRT'
  if (name.includes('Antares')) return 'ANT'
}
