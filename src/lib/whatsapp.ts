export function buildWhatsAppURL(number: string, productCode?: string): string {
  const digits = number.replace(/\D/g, '')
  const message = productCode
    ? `Olá, gostaria de consultar o produto ${productCode}.`
    : 'Olá, gostaria de falar com a UniPress.'

  return `https://wa.me/${digits}?${new URLSearchParams({ text: message }).toString()}`
}

export function buildWhatsAppOrContactURL(number: string, productCode?: string): string {
  return number.replace(/\D/g, '') ? buildWhatsAppURL(number, productCode) : '/contato'
}
