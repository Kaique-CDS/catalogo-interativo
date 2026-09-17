export type WhatsAppSector = 'vendas' | 'financeiro'

export interface WhatsAppLeadParams {
  /** Main sales WhatsApp number */
  whatsapp: string
  /** Finance sector WhatsApp number (optional) */
  whatsappFinanceiro?: string | null
  storeName: string
  sku: string
  brand: string
  model: string
  year: number
  sector?: WhatsAppSector
  /** Whether the customer has a trade-in vehicle */
  hasTradeIn?: boolean
}

export interface WhatsAppFinancingParams {
  whatsappFinanceiro?: string | null
  whatsapp: string
  storeName: string
  sku: string
  brand: string
  model: string
  year: number
  // Financing form data
  nome: string
  cpf: string
  cnh?: string
  dataNascimento?: string
  rendaMensal?: string
  valorEntrada?: string
  banco?: string
  email?: string
  contato: string
  hasTradeIn?: boolean
}

/**
 * Builds a WhatsApp URL placing the vehicle name first and the SKU reference at the end.
 * Routes to the correct number based on sector.
 */
export function buildWhatsAppUrl(params: WhatsAppLeadParams): string {
  const {
    whatsapp,
    whatsappFinanceiro,
    storeName,
    sku,
    brand,
    model,
    year,
    sector = 'vendas',
    hasTradeIn = false,
  } = params

  const targetNumber =
    sector === 'financeiro' && whatsappFinanceiro
      ? whatsappFinanceiro
      : whatsapp

  const lines: string[] = [
    `Olá, *${storeName}*! 👋`,
    `Tenho interesse no veículo *${brand} ${model} (${year})*.`,
  ]

  if (hasTradeIn) {
    lines.push(`🔄 *Tenho um veículo usado para dar na troca.*`)
  }

  lines.push(
    `O veículo ainda está disponível? Gostaria de saber o valor e mais informações!`,
    ``,
    `_(Ref. SKU: #${sku})_`
  )

  const message = lines.join('\n')
  const cleanPhone = targetNumber.replace(/\D/g, '')
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

/**
 * Builds a WhatsApp URL with full financing simulation data.
 * Places the vehicle name first and the SKU reference at the end.
 */
export function buildFinancingWhatsAppUrl(params: WhatsAppFinancingParams): string {
  const {
    whatsappFinanceiro,
    whatsapp,
    storeName,
    sku,
    brand,
    model,
    year,
    nome,
    cpf,
    cnh,
    dataNascimento,
    rendaMensal,
    valorEntrada,
    banco,
    email,
    contato,
    hasTradeIn = false,
  } = params

  const targetNumber =
    whatsappFinanceiro ? whatsappFinanceiro : whatsapp

  const lines: string[] = [
    `Olá, *${storeName}*! 👋`,
    `Gostaria de simular um *financiamento* para o veículo *${brand} ${model} (${year})*.`,
    ``,
    `📋 *Dados para simulação:*`,
    `👤 Nome: ${nome}`,
    `🪪 CPF: ${cpf}`,
  ]

  if (cnh) lines.push(`🚗 CNH: ${cnh}`)
  if (dataNascimento) lines.push(`📅 Data de Nascimento: ${dataNascimento}`)
  if (rendaMensal) lines.push(`💼 Renda Mensal: R$ ${rendaMensal}`)
  if (valorEntrada) lines.push(`💰 Valor de Entrada: R$ ${valorEntrada}`)
  if (banco) lines.push(`🏦 Banco: ${banco}`)
  if (email) lines.push(`📧 E-mail: ${email}`)
  lines.push(`📱 Contato: ${contato}`)

  if (hasTradeIn) {
    lines.push(`🔄 *Tenho um veículo usado para dar na troca.*`)
  }

  lines.push(
    ``,
    `Aguardo o contato da equipe financeira. Obrigado!`,
    ``,
    `_(Ref. SKU: #${sku})_`
  )

  const message = lines.join('\n')
  const cleanPhone = targetNumber.replace(/\D/g, '')
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}