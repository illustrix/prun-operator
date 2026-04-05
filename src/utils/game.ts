export const getAddressCode = (text: string) => {
  const match = text.match(/[A-Z]{2}-\d{3}[a-z]/)
  return match ? match[0] : null
}
