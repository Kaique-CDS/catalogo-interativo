import { formatCurrency } from './utils'

export interface WhatsAppLeadParams {
  whatsapp: string
  storeName: string
  brand: string
  model: string
  year: number
  price: number
  transmission?: string | null
  fuel?: string | null
  address?: string | null
}

export function buildWhatsAppUrl(params: WhatsAppLeadParams): string {
  const { whatsapp, storeName, brand, model, year, price, transmission, fuel, address } = params

  const formattedPrice = formatCurrency(price)

  const lines: string[] = [
    `Olá, *${storeName}*! 👋`,
    `Vi este veículo no catálogo online e tenho real interesse:`,
    '',
    `🚗 *${brand} ${model} (${year})*`,
    `💰 *Valor:* ${formattedPrice}`,
  ]

  const specs = [transmission, fuel].filter(Boolean)
  if (specs.length > 0) {
    lines.push(`⚙️ *Detalhes:* ${specs.join(' • ')}`)
  }

  if (address) {
    lines.push(`📍 *Localização:* ${address}`)
  }

  lines.push('', 'O veículo ainda está disponível? Gostaria de saber sobre propostas e formas de pagamento!')

  const message = lines.join('\n')
  const cleanPhone = whatsapp.replace(/\D/g, '')
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}