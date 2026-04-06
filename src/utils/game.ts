export const getAddressCode = (text: string) => {
  const match = text.match(/[A-Z]{2}-\d{3}[a-z]/)
  return match ? match[0] : null
}

export const getStationCodeFromName = (name: string) => {
  if (name.includes('Benten')) return 'BEN'
  if (name.includes('Moria')) return 'MOR'
  if (name.includes('Hortus')) return 'HRT'
  if (name.includes('Antares')) return 'ANT'
}
