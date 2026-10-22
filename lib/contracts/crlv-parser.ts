
export interface CrlvParsedData {
  plate?: string
  renavam?: string
  chassis?: string
  brand_model?: string
  year_fab?: number
  year_model?: number
  color?: string
  fuel?: string
  engine?: string
  owner_name?: string
  owner_cpf_cnpj?: string
  notes?: string
  has_alienacao: boolean
  alienacao_details?: string
  raw_text?: string
  source: 'text_layer' | 'manual'
}

/**
 * Normaliza e limpa texto para extração via regex.
 */
function cleanLine(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
}

/**
 * Expressões regulares para mapear campos do CRLV-e digital brasileiro.
 */
export function parseCrlvText(rawText: string): CrlvParsedData {
  const norm = cleanLine(rawText)

  // 1. Placa (padrão antigo ABC1234 ou Mercosul ABC1D23)
  const placaMatch = norm.match(/\b([A-Z]{3}[0-9][A-Z0-9][0-9]{2})\b/)
  const plate = placaMatch ? placaMatch[1] : undefined

  // 2. Renavam (geralmente 9 a 11 dígitos)
  const renavamMatch =
    norm.match(/RENAVAM[^\d]*(\d{9,11})/) ||
    norm.match(/\b(\d{11})\b/)
  const renavam = renavamMatch ? renavamMatch[1] : undefined

  // 3. Chassi (17 caracteres alfanuméricos)
  const chassiMatch =
    norm.match(/CHASSI[^\w]*([A-HJ-NPR-Z0-9]{17})/) ||
    norm.match(/\b([A-HJ-NPR-Z0-9]{17})\b/)
  const chassis = chassiMatch ? chassiMatch[1] : undefined

  // 4. Marca / Modelo
  let brand_model: string | undefined = undefined
  const marcaMatch =
    norm.match(/MARCA\s*\/\s*MODELO[^\w]*([A-Z0-9\/\s\-]{3,40})(?=ANO|PLACA|COR|CHASSI|\n|$)/) ||
    norm.match(/MARCA[^\w]*([A-Z0-9\/\s\-]{3,35})/)

  if (marcaMatch) {
    brand_model = marcaMatch[1].trim().replace(/\s+/g, ' ')
  }

  // 5. Ano Fabricação e Modelo
  let year_fab: number | undefined = undefined
  let year_model: number | undefined = undefined
  const anoMatch =
    norm.match(/ANO\s*FABRICACAO[^\d]*(\d{4})[^\d]*ANO\s*MODELO[^\d]*(\d{4})/) ||
    norm.match(/FAB\/MOD[^\d]*(\d{4})\s*\/\s*(\d{4})/) ||
    norm.match(/\b(19\d{2}|20\d{2})\s*\/\s*(19\d{2}|20\d{2})\b/)

  if (anoMatch) {
    year_fab = parseInt(anoMatch[1], 10)
    year_model = parseInt(anoMatch[2], 10)
  }

  // 6. Cor
  let color: string | undefined = undefined
  const corMatch = norm.match(/COR\s*PREDOMINANTE[^\w]*([A-Z]+)/) || norm.match(/COR[^\w]*([A-Z]+)/)
  if (corMatch) {
    const rawCor = corMatch[1].trim().toLowerCase()
    color = rawCor.charAt(0).toUpperCase() + rawCor.slice(1)
  }

  // 7. Combustível
  let fuel: string | undefined = undefined
  if (norm.includes('ALCOOL/GASOLINA') || norm.includes('FLEX')) {
    fuel = 'Flex'
  } else if (norm.includes('GASOLINA')) {
    fuel = 'Gasolina'
  } else if (norm.includes('DIESEL')) {
    fuel = 'Diesel'
  } else if (norm.includes('ELETRICO')) {
    fuel = 'Elétrico'
  } else if (norm.includes('HIBRIDO')) {
    fuel = 'Híbrido'
  } else if (norm.includes('ETANOL') || norm.includes('ALCOOL')) {
    fuel = 'Etanol'
  }

  // 8. Proprietário (Nome e CPF/CNPJ)
  let owner_name: string | undefined = undefined
  let owner_cpf_cnpj: string | undefined = undefined

  const nomeMatch = norm.match(/NOME[^\w]*([A-Z\s]{4,60})(?=CPF|CNPJ|ENDERECO|\n)/)
  if (nomeMatch) {
    owner_name = nomeMatch[1].trim().replace(/\s+/g, ' ')
  }

  const docMatch =
    norm.match(/CPF\s*\/\s*CNPJ[^\d]*(\d{11}|\d{14})/) ||
    norm.match(/\b(\d{3}\.\d{3}\.\d{3}\-\d{2}|\d{2}\.\d{3}\.\d{3}\/\d{4}\-\d{2})\b/) ||
    norm.match(/\b(\d{11}|\d{14})\b/)

  if (docMatch) {
    owner_cpf_cnpj = docMatch[1].replace(/\D/g, '')
  }

  // 9. Alienação Fiduciária / Restrições Financeiras
  const hasAlienacao =
    norm.includes('ALIENACAO FIDUCIARIA') ||
    norm.includes('ALIENACAO') ||
    norm.includes('GRAVAME') ||
    norm.includes('ARRENDAMENTO MERCANTIL') ||
    norm.includes('RESERVA DE DOMINIO')

  let alienacao_details: string | undefined = undefined
  if (hasAlienacao) {
    const obsMatch = norm.match(/OBSERVACOES[^\n]*\n?([^\n\r]+)/)
    alienacao_details = obsMatch ? obsMatch[1].trim() : 'Consta Alienação Fiduciária / Gravame financeiro ativo no documento.'
  }

  return {
    plate,
    renavam,
    chassis,
    brand_model,
    year_fab,
    year_model,
    color,
    fuel,
    owner_name,
    owner_cpf_cnpj,
    has_alienacao: hasAlienacao,
    alienacao_details,
    raw_text: rawText,
    source: 'text_layer',
  }
}



/**
 * Lê arquivo CRLV (Buffer) via camada de texto do PDF com fallback para OCR Gemini.
 */
/**
 * Lê arquivo CRLV (Buffer) usando exclusivamente a camada de texto nativa do PDF (sem IA).
 * Em total conformidade com a LGPD e privacidade, nenhum dado pessoal de documento é enviado a APIs externas.
 */
export async function parseCrlvBuffer(
  buffer: Buffer,
  mimeType: string,
  filename?: string
): Promise<CrlvParsedData> {
  const isPdf =
    mimeType === 'application/pdf' ||
    (filename && filename.toLowerCase().endsWith('.pdf'))

  if (!isPdf) {
    throw new Error(
      'O arquivo enviado é uma imagem (foto/escaneado). Por motivos de privacidade e conformidade LGPD, a leitura automática não envia documentos a serviços externos de IA. Por favor, envie o CRLV digital oficial em formato PDF ou preencha os dados do veículo manualmente.'
    )
  }

  // 1. Extração local da camada de texto nativa do PDF (pdf-parse)
  try {
    const pdfParse = require('pdf-parse')
    const pdfData = await pdfParse(buffer)
    if (pdfData?.text && pdfData.text.length > 40) {
      const parsed = parseCrlvText(pdfData.text)
      if (parsed.plate || parsed.renavam || parsed.chassis) {
        return parsed
      }
    }
  } catch (err: any) {
    console.warn('Falha na leitura direta da camada de texto do PDF do CRLV:', err)
  }

  throw new Error(
    'O documento PDF enviado não possui camada de texto pesquisável (arquivo digitalizado como imagem). Por segurança e privacidade, preencha os dados do veículo manualmente.'
  )
}

