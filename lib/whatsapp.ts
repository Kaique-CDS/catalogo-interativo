import { formatCurrency } from './utils'

export interface WhatsAppLeadParams {
  whatsapp: string
  storeName: string
  brand: string
  model: string
  year: number
  price: number
  address?: string | null
}

export function buildWhatsAppUrl(params: WhatsAppLeadParams): string {
  const { whatsapp, storeName, brand, model, year, price, address } = params

  const formattedPrice = formatCurrency(price)

  const lines: string[] = [
    `Ola! Estava vendo o catalogo da *${storeName}* e tenho interesse no veiculo:`,
    '',
    `🚗 *${brand} ${model} ${year}*`,
    `💰 Valor: ${formattedPrice}`,
  ]

  if (address) lines.push(`📍 ${address}`)
  lines.push('', 'Poderia me dar mais informacoes?')

  const message = lines.join('\n')
  const cleanPhone = whatsapp.replace(/\D/g, '')
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}
